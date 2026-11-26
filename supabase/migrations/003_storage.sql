-- 003_storage.sql
-- Bucket público para logos e imágenes de páginas. Escritura solo en la
-- carpeta del usuario autenticado; lectura pública para páginas publicadas.
-- Ejecutar en Supabase → SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'page-assets',
  'page-assets',
  true,
  1048576,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "page assets are public" on storage.objects;
create policy "page assets are public" on storage.objects
  for select using (bucket_id = 'page-assets');

drop policy if exists "page assets owner can upload" on storage.objects;
create policy "page assets owner can upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "page assets owner can update" on storage.objects;
create policy "page assets owner can update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "page assets owner can delete" on storage.objects;
create policy "page assets owner can delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
