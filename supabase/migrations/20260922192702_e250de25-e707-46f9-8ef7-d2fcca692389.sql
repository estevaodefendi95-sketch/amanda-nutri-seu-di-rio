CREATE TYPE public.app_role AS ENUM ('nutricionista', 'paciente');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Usuario ve seus proprios papeis" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Nutricionista ve todos os papeis" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'nutricionista'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  telefone text,
  data_nascimento date,
  sexo text,
  objetivo text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente ve seu perfil" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Paciente atualiza seu perfil" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Nutricionista gerencia perfis" ON public.profiles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'nutricionista')) WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

CREATE TABLE public.dietas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  data_inicio date,
  data_fim date,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dietas_paciente ON public.dietas(paciente_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dietas TO authenticated;
GRANT ALL ON public.dietas TO service_role;
ALTER TABLE public.dietas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente ve suas dietas" ON public.dietas
FOR SELECT TO authenticated USING (paciente_id = auth.uid());
CREATE POLICY "Nutricionista gerencia dietas" ON public.dietas
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'nutricionista')) WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

CREATE TABLE public.refeicoes_dieta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dieta_id uuid NOT NULL REFERENCES public.dietas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  horario time,
  alimentos text,
  observacoes text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refeicoes_dieta ON public.refeicoes_dieta(dieta_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refeicoes_dieta TO authenticated;
GRANT ALL ON public.refeicoes_dieta TO service_role;
ALTER TABLE public.refeicoes_dieta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente ve refeicoes das suas dietas" ON public.refeicoes_dieta
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.dietas d WHERE d.id = dieta_id AND d.paciente_id = auth.uid()
));
CREATE POLICY "Nutricionista gerencia refeicoes" ON public.refeicoes_dieta
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'nutricionista')) WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

CREATE TABLE public.diario_alimentar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT current_date,
  refeicao text NOT NULL,
  foto_url text,
  descricao text,
  comentario_nutricionista text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_diario_paciente_data ON public.diario_alimentar(paciente_id, data);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diario_alimentar TO authenticated;
GRANT ALL ON public.diario_alimentar TO service_role;
ALTER TABLE public.diario_alimentar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente ve seu diario" ON public.diario_alimentar
FOR SELECT TO authenticated USING (paciente_id = auth.uid());
CREATE POLICY "Paciente cria no seu diario" ON public.diario_alimentar
FOR INSERT TO authenticated WITH CHECK (paciente_id = auth.uid());
CREATE POLICY "Paciente edita seu diario" ON public.diario_alimentar
FOR UPDATE TO authenticated USING (paciente_id = auth.uid()) WITH CHECK (paciente_id = auth.uid());
CREATE POLICY "Paciente remove seu diario" ON public.diario_alimentar
FOR DELETE TO authenticated USING (paciente_id = auth.uid());
CREATE POLICY "Nutricionista gerencia diarios" ON public.diario_alimentar
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'nutricionista')) WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT current_date,
  peso numeric(6,2),
  altura numeric(5,2),
  percentual_gordura numeric(5,2),
  massa_magra numeric(6,2),
  circunferencias jsonb NOT NULL DEFAULT '{}'::jsonb,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_avaliacoes_paciente ON public.avaliacoes(paciente_id, data);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente ve suas avaliacoes" ON public.avaliacoes
FOR SELECT TO authenticated USING (paciente_id = auth.uid());
CREATE POLICY "Nutricionista gerencia avaliacoes" ON public.avaliacoes
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'nutricionista')) WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));

CREATE TABLE public.fotos_evolucao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  foto_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fotos_evolucao_paciente ON public.fotos_evolucao(paciente_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fotos_evolucao TO authenticated;
GRANT ALL ON public.fotos_evolucao TO service_role;
ALTER TABLE public.fotos_evolucao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente ve suas fotos" ON public.fotos_evolucao
FOR SELECT TO authenticated USING (paciente_id = auth.uid());
CREATE POLICY "Nutricionista gerencia fotos" ON public.fotos_evolucao
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'nutricionista')) WITH CHECK (public.has_role(auth.uid(), 'nutricionista'));