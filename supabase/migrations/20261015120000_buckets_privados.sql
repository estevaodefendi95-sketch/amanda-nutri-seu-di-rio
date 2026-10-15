-- Cria os buckets privados usados pelo app.
-- As policies de storage já existem na migration anterior, mas nenhuma migration
-- criava os buckets. Sem isto, um projeto Supabase novo (ao migrar o banco)
-- ficaria sem os buckets e os uploads falhariam.
-- Idempotente: pode rodar em projetos que já têm os buckets.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('diario-alimentar', 'diario-alimentar', false),
  ('fotos-evolucao', 'fotos-evolucao', false)
ON CONFLICT (id) DO UPDATE SET public = false;
