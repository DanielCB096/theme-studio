-- 001_themes.sql
-- Tabla de temas, índices, trigger de updated_at y políticas RLS.
-- Ejecutar en Supabase → SQL Editor (o `supabase db push`).

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists themes_user_id_idx on public.themes (user_id);
create index if not exists themes_public_idx on public.themes (is_public) where is_public = true;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists themes_touch_updated_at on public.themes;
create trigger themes_touch_updated_at
  before update on public.themes
  for each row execute function public.touch_updated_at();

alter table public.themes enable row level security;

-- Permisos de tabla explícitos. RLS sigue decidiendo qué filas ve cada rol:
-- `anon` solo puede leer (y solo filas públicas); `authenticated` opera sujeto a las políticas.
grant select on public.themes to anon;
grant select, insert, update, delete on public.themes to authenticated;

-- Políticas idempotentes: el archivo se puede reejecutar sin duplicarlas.
drop policy if exists "owner can read own" on public.themes;
create policy "owner can read own" on public.themes
  for select using (auth.uid() = user_id);

drop policy if exists "anyone can read public" on public.themes;
create policy "anyone can read public" on public.themes
  for select using (is_public = true);

drop policy if exists "owner can insert" on public.themes;
create policy "owner can insert" on public.themes
  for insert with check (auth.uid() = user_id);

drop policy if exists "owner can update" on public.themes;
create policy "owner can update" on public.themes
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "owner can delete" on public.themes;
create policy "owner can delete" on public.themes
  for delete using (auth.uid() = user_id);
