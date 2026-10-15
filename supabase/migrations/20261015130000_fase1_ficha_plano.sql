-- Fase 1: ficha editável, anamnese, alimentos, plano alimentar estruturado e consentimento (LGPD).
-- Idempotente onde possível (IF NOT EXISTS) para poder rodar em projetos novos ou já em uso.

-- ---------------------------------------------------------------------------
-- profiles: status do paciente, altura, nível de atividade e visão do paciente
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS altura_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS nivel_atividade text,
  ADD COLUMN IF NOT EXISTS paciente_ve_calorias boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('ativo', 'arquivado'));

-- O paciente edita o próprio perfil, mas não pode mudar status nem a visão de calorias.
CREATE OR REPLACE FUNCTION public.proteger_campos_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'nutricionista') THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.paciente_ve_calorias IS DISTINCT FROM OLD.paciente_ve_calorias THEN
      RAISE EXCEPTION 'Apenas a nutricionista pode alterar este campo.';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.proteger_campos_perfil() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_proteger_campos_perfil ON public.profiles;
CREATE TRIGGER trg_proteger_campos_perfil
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_perfil();

-- ---------------------------------------------------------------------------
-- anamneses: histórico clínico e hábitos (visível só para a nutricionista)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anamneses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamneses TO authenticated;
GRANT ALL ON public.anamneses TO service_role;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gerencia anamneses" ON public.anamneses;
CREATE POLICY "Nutricionista gerencia anamneses" ON public.anamneses
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

-- ---------------------------------------------------------------------------
-- alimentos: tabela de alimentos (valores por 100 g). Fonte: TACO, outra ou própria.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  fonte text NOT NULL DEFAULT 'propria',
  kcal numeric(7,2) NOT NULL DEFAULT 0,
  proteina numeric(7,2) NOT NULL DEFAULT 0,
  carbo numeric(7,2) NOT NULL DEFAULT 0,
  gordura numeric(7,2) NOT NULL DEFAULT 0,
  fibra numeric(7,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nome, fonte)
);
CREATE INDEX IF NOT EXISTS idx_alimentos_nome ON public.alimentos (lower(nome));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alimentos TO authenticated;
GRANT ALL ON public.alimentos TO service_role;
ALTER TABLE public.alimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autenticados leem alimentos" ON public.alimentos;
CREATE POLICY "Autenticados leem alimentos" ON public.alimentos
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Nutricionista gerencia alimentos" ON public.alimentos;
CREATE POLICY "Nutricionista gerencia alimentos" ON public.alimentos
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

-- ---------------------------------------------------------------------------
-- dietas: rascunho/publicada/encerrada e metas do plano
-- ---------------------------------------------------------------------------
-- O backfill roda só quando a coluna status é criada (planos antigos: ativa vira publicada,
-- o resto encerrada). Assim, reexecutar a migration nunca publica um rascunho.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dietas' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.dietas ADD COLUMN status text NOT NULL DEFAULT 'rascunho';
    ALTER TABLE public.dietas ADD COLUMN publicada_em timestamptz;
    UPDATE public.dietas
    SET status = CASE WHEN ativa THEN 'publicada' ELSE 'encerrada' END,
        publicada_em = CASE WHEN ativa THEN created_at ELSE NULL END;
  END IF;
END
$$;

ALTER TABLE public.dietas
  ADD COLUMN IF NOT EXISTS meta_kcal numeric(7,2),
  ADD COLUMN IF NOT EXISTS meta_proteina_g numeric(7,2),
  ADD COLUMN IF NOT EXISTS meta_carbo_g numeric(7,2),
  ADD COLUMN IF NOT EXISTS meta_gordura_g numeric(7,2);

ALTER TABLE public.dietas DROP CONSTRAINT IF EXISTS dietas_status_check;
ALTER TABLE public.dietas
  ADD CONSTRAINT dietas_status_check CHECK (status IN ('rascunho', 'publicada', 'encerrada'));

-- O paciente só enxerga o plano publicado.
DROP POLICY IF EXISTS "Paciente ve suas dietas" ON public.dietas;
CREATE POLICY "Paciente ve suas dietas" ON public.dietas
FOR SELECT TO authenticated
USING (paciente_id = auth.uid() AND status = 'publicada');

DROP POLICY IF EXISTS "Paciente ve refeicoes das suas dietas" ON public.refeicoes_dieta;
CREATE POLICY "Paciente ve refeicoes das suas dietas" ON public.refeicoes_dieta
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.dietas d
  WHERE d.id = dieta_id AND d.paciente_id = auth.uid() AND d.status = 'publicada'
));

-- ---------------------------------------------------------------------------
-- itens_refeicao: alimentos de cada refeição, com quantidade e substituições
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itens_refeicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refeicao_id uuid NOT NULL REFERENCES public.refeicoes_dieta(id) ON DELETE CASCADE,
  alimento_id uuid REFERENCES public.alimentos(id) ON DELETE SET NULL,
  descricao text,
  quantidade_g numeric(8,2),
  medida_caseira text,
  substituicoes text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_itens_refeicao_refeicao ON public.itens_refeicao (refeicao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_refeicao TO authenticated;
GRANT ALL ON public.itens_refeicao TO service_role;
ALTER TABLE public.itens_refeicao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Paciente ve itens das suas refeicoes" ON public.itens_refeicao;
CREATE POLICY "Paciente ve itens das suas refeicoes" ON public.itens_refeicao
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1
  FROM public.refeicoes_dieta r
  JOIN public.dietas d ON d.id = r.dieta_id
  WHERE r.id = refeicao_id AND d.paciente_id = auth.uid() AND d.status = 'publicada'
));

DROP POLICY IF EXISTS "Nutricionista gerencia itens" ON public.itens_refeicao;
CREATE POLICY "Nutricionista gerencia itens" ON public.itens_refeicao
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

-- ---------------------------------------------------------------------------
-- avaliacoes: dobras cutâneas
-- ---------------------------------------------------------------------------
ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS dobras jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- diario_alimentar: marca de revisão; o paciente não pode forjar o comentário da Amanda
-- ---------------------------------------------------------------------------
ALTER TABLE public.diario_alimentar
  ADD COLUMN IF NOT EXISTS revisado_em timestamptz;

CREATE OR REPLACE FUNCTION public.proteger_campos_diario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'nutricionista') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.comentario_nutricionista := NULL;
      NEW.revisado_em := NULL;
    ELSIF NEW.comentario_nutricionista IS DISTINCT FROM OLD.comentario_nutricionista
       OR NEW.revisado_em IS DISTINCT FROM OLD.revisado_em THEN
      RAISE EXCEPTION 'Apenas a nutricionista pode comentar o diário.';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.proteger_campos_diario() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_proteger_campos_diario ON public.diario_alimentar;
CREATE TRIGGER trg_proteger_campos_diario
  BEFORE INSERT OR UPDATE ON public.diario_alimentar
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_diario();

-- ---------------------------------------------------------------------------
-- consentimentos: aceite do termo de tratamento de dados (LGPD), com versão e data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consentimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  versao text NOT NULL,
  aceito_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, versao)
);
GRANT SELECT, INSERT ON public.consentimentos TO authenticated;
GRANT ALL ON public.consentimentos TO service_role;
ALTER TABLE public.consentimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve seus consentimentos" ON public.consentimentos;
CREATE POLICY "Usuario ve seus consentimentos" ON public.consentimentos
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuario registra seu consentimento" ON public.consentimentos;
CREATE POLICY "Usuario registra seu consentimento" ON public.consentimentos
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Nutricionista ve consentimentos" ON public.consentimentos;
CREATE POLICY "Nutricionista ve consentimentos" ON public.consentimentos
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'nutricionista'));
