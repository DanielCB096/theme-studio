-- 005_page_datasets.sql
-- Dataset editable por página y consumido por el bloque `table` (Hito 2B), con RLS.
-- Ejecutar en Supabase → SQL Editor.

create table if not exists public.page_datasets (
  page_id uuid primary key references public.pages (id) on delete cascade,
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and pg_column_size(data) < 100000
  ),
  updated_at timestamptz not null default now()
);

drop trigger if exists page_datasets_touch_updated_at on public.page_datasets;
create trigger page_datasets_touch_updated_at
  before update on public.page_datasets
  for each row execute function public.touch_updated_at();

alter table public.page_datasets enable row level security;

-- Lectura pública para que una página publicada pueda renderizar su tabla.
-- Escritura reservada al dueño de la página.
grant select on public.page_datasets to anon, authenticated;
grant insert, update, delete on public.page_datasets to authenticated;

-- Políticas idempotentes: el archivo se puede reejecutar sin duplicarlas.
drop policy if exists "anyone can read public page datasets" on public.page_datasets;
create policy "anyone can read public page datasets" on public.page_datasets
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and (p.is_public = true or p.user_id = auth.uid())
    )
  );

drop policy if exists "owner can insert page datasets" on public.page_datasets;
create policy "owner can insert page datasets" on public.page_datasets
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "owner can update page datasets" on public.page_datasets;
create policy "owner can update page datasets" on public.page_datasets
  for update to authenticated
  using (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "owner can delete page datasets" on public.page_datasets;
create policy "owner can delete page datasets" on public.page_datasets
  for delete to authenticated
  using (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  );
