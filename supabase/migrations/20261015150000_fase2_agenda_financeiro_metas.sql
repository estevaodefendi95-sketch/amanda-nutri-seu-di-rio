-- Fase 2: agenda (pronta para Google Agenda), financeiro, metas, exames e mensagens.
-- Tudo com RLS: a nutricionista acessa tudo; o paciente só vê o que é dele e foi liberado.

-- ---------------------------------------------------------------------------
-- consultas: agenda e registro de cada atendimento (google_event_id para a integração)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inicio timestamptz NOT NULL,
  fim timestamptz,
  tipo text NOT NULL DEFAULT 'presencial' CHECK (tipo IN ('presencial', 'online')),
  status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada', 'faltou')),
  link_online text,
  anotacoes text,
  google_event_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consultas_inicio_idx ON public.consultas (inicio);
CREATE INDEX IF NOT EXISTS consultas_paciente_idx ON public.consultas (paciente_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultas TO authenticated;
GRANT ALL ON public.consultas TO service_role;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gerencia consultas" ON public.consultas;
CREATE POLICY "Nutricionista gerencia consultas" ON public.consultas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

-- ---------------------------------------------------------------------------
-- lancamentos: financeiro do consultório (só a nutricionista)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  consulta_id uuid REFERENCES public.consultas(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  valor numeric(10,2) NOT NULL CHECK (valor >= 0),
  vencimento date NOT NULL DEFAULT current_date,
  pago_em date,
  forma text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lancamentos_vencimento_idx ON public.lancamentos (vencimento);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gerencia lancamentos" ON public.lancamentos;
CREATE POLICY "Nutricionista gerencia lancamentos" ON public.lancamentos
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

-- ---------------------------------------------------------------------------
-- metas: metas do paciente (a nutricionista define; o paciente lê)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor_alvo numeric(10,2),
  unidade text,
  prazo date,
  status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'cancelada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS metas_paciente_idx ON public.metas (paciente_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas TO authenticated;
GRANT ALL ON public.metas TO service_role;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gerencia metas" ON public.metas;
CREATE POLICY "Nutricionista gerencia metas" ON public.metas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

DROP POLICY IF EXISTS "Paciente ve suas metas" ON public.metas;
CREATE POLICY "Paciente ve suas metas" ON public.metas
FOR SELECT TO authenticated USING (paciente_id = auth.uid());

-- ---------------------------------------------------------------------------
-- exames: resultados laboratoriais (o paciente só vê os liberados)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT current_date,
  nome text NOT NULL,
  valor text,
  unidade text,
  observacoes text,
  arquivo_path text,
  liberado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exames_paciente_idx ON public.exames (paciente_id, data DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exames TO authenticated;
GRANT ALL ON public.exames TO service_role;
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gerencia exames" ON public.exames;
CREATE POLICY "Nutricionista gerencia exames" ON public.exames
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

DROP POLICY IF EXISTS "Paciente ve exames liberados" ON public.exames;
CREATE POLICY "Paciente ve exames liberados" ON public.exames
FOR SELECT TO authenticated USING (paciente_id = auth.uid() AND liberado);

-- ---------------------------------------------------------------------------
-- mensagens: recados entre a nutricionista e cada paciente
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto text NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 2000),
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mensagens_paciente_idx ON public.mensagens (paciente_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gerencia mensagens" ON public.mensagens;
CREATE POLICY "Nutricionista gerencia mensagens" ON public.mensagens
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

DROP POLICY IF EXISTS "Paciente ve suas mensagens" ON public.mensagens;
CREATE POLICY "Paciente ve suas mensagens" ON public.mensagens
FOR SELECT TO authenticated USING (paciente_id = auth.uid());

DROP POLICY IF EXISTS "Paciente envia mensagem" ON public.mensagens;
CREATE POLICY "Paciente envia mensagem" ON public.mensagens
FOR INSERT TO authenticated
WITH CHECK (paciente_id = auth.uid() AND autor_id = auth.uid());

DROP POLICY IF EXISTS "Paciente marca como lida" ON public.mensagens;
CREATE POLICY "Paciente marca como lida" ON public.mensagens
FOR UPDATE TO authenticated
USING (paciente_id = auth.uid() AND autor_id <> auth.uid())
WITH CHECK (paciente_id = auth.uid() AND autor_id <> auth.uid());

-- Quem não é nutricionista só pode alterar "lida_em".
CREATE OR REPLACE FUNCTION public.proteger_mensagem()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'nutricionista') THEN
    IF NEW.texto IS DISTINCT FROM OLD.texto
       OR NEW.autor_id IS DISTINCT FROM OLD.autor_id
       OR NEW.paciente_id IS DISTINCT FROM OLD.paciente_id THEN
      RAISE EXCEPTION 'Mensagens não podem ser editadas.';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.proteger_mensagem() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_proteger_mensagem ON public.mensagens;
CREATE TRIGGER trg_proteger_mensagem
  BEFORE UPDATE ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.proteger_mensagem();
