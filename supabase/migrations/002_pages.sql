-- 002_pages.sql
-- Páginas del Page Builder (Anexo A), con RLS.
-- Ejecutar en Supabase → SQL Editor.

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  theme jsonb not null check (jsonb_typeof(theme) = 'object'),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pages_user_id_idx on public.pages (user_id);
create index if not exists pages_public_idx on public.pages (is_public) where is_public = true;

drop trigger if exists pages_touch_updated_at on public.pages;
create trigger pages_touch_updated_at
  before update on public.pages
  for each row execute function public.touch_updated_at();

alter table public.pages enable row level security;

grant select on public.pages to anon;
grant select, insert, update, delete on public.pages to authenticated;

drop policy if exists "owner can read own pages" on public.pages;
create policy "owner can read own pages" on public.pages
  for select using (auth.uid() = user_id);

drop policy if exists "anyone can read public pages" on public.pages;
create policy "anyone can read public pages" on public.pages
  for select using (is_public = true);

drop policy if exists "owner can insert pages" on public.pages;
create policy "owner can insert pages" on public.pages
  for insert with check (auth.uid() = user_id);

drop policy if exists "owner can update pages" on public.pages;
create policy "owner can update pages" on public.pages
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "owner can delete pages" on public.pages;
create policy "owner can delete pages" on public.pages
  for delete using (auth.uid() = user_id);
