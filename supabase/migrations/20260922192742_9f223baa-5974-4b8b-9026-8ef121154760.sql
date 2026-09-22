CREATE POLICY "Paciente le seus arquivos diario" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'diario-alimentar' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Paciente envia arquivos diario" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'diario-alimentar' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Paciente atualiza arquivos diario" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'diario-alimentar' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Paciente remove arquivos diario" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'diario-alimentar' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Paciente le suas fotos evolucao" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'fotos-evolucao' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Nutricionista gerencia arquivos saude" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id IN ('diario-alimentar','fotos-evolucao') AND public.has_role(auth.uid(), 'nutricionista'))
WITH CHECK (bucket_id IN ('diario-alimentar','fotos-evolucao') AND public.has_role(auth.uid(), 'nutricionista'));