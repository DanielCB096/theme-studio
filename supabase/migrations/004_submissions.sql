-- 004_submissions.sql
-- Respuestas de los formularios públicos del Page Builder, con RLS.
-- Ejecutar en Supabase → SQL Editor.

create table if not exists public.page_submissions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and pg_column_size(data) < 20000
  ),
  user_agent text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists page_submissions_page_id_idx
  on public.page_submissions (page_id);
create index if not exists page_submissions_created_at_idx
  on public.page_submissions (created_at desc);

alter table public.page_submissions enable row level security;

-- El formulario público llega sin sesión: `anon` solo puede insertar.
-- La lectura y la gestión quedan reservadas al dueño de la página.
grant insert on public.page_submissions to anon, authenticated;
grant select, update, delete on public.page_submissions to authenticated;

-- Políticas idempotentes: el archivo se puede reejecutar sin duplicarlas.
drop policy if exists "anyone can submit to public page" on public.page_submissions;
create policy "anyone can submit to public page" on public.page_submissions
  for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.is_public = true
    )
  );

drop policy if exists "owner can read page submissions" on public.page_submissions;
create policy "owner can read page submissions" on public.page_submissions
  for select to authenticated
  using (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "owner can update page submissions" on public.page_submissions;
create policy "owner can update page submissions" on public.page_submissions
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

drop policy if exists "owner can delete page submissions" on public.page_submissions;
create policy "owner can delete page submissions" on public.page_submissions
  for delete to authenticated
  using (
    exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.user_id = auth.uid()
    )
  );
