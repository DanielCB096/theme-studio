-- 006_multiple_datasets.sql
-- Varios datasets por página (máximo 10 lógicos) para el bloque `table` del
-- Hito 2C. Evoluciona la tabla de 005_page_datasets.sql sin perder la fila
-- existente: añade `id` y `name`, cambia la clave primaria de `page_id` a `id`
-- y conserva `data`, `updated_at`, el trigger, los grants y las políticas RLS.
--
-- Ejecutar en Supabase → SQL Editor DESPUÉS de 005_page_datasets.sql.
-- El archivo es idempotente y se puede reejecutar sin duplicar índices,
-- constraints ni políticas.
--
-- El límite de 10 datasets por página se aplica en el cliente
-- (datasetRepository.createPageDataset). La base de datos no lo impone porque
-- contarlo con un trigger añadiría bloqueos y una semántica difícil de
-- reejecutar; la carrera entre dos pestañas puede superarlo temporalmente.

begin;

-- 1. Columnas nuevas, primero nullable para poder rellenar las filas existentes.
alter table public.page_datasets add column if not exists id uuid;
alter table public.page_datasets add column if not exists name text;

-- 2. Rellenar la fila (o filas) creadas por 005: un dataset por página.
update public.page_datasets
set id = gen_random_uuid()
where id is null;

update public.page_datasets
set name = 'Datos'
where name is null;

-- 3. Convertir las columnas en obligatorias con sus valores por defecto.
alter table public.page_datasets alter column id set default gen_random_uuid();
alter table public.page_datasets alter column id set not null;
alter table public.page_datasets alter column name set default 'Datos';
alter table public.page_datasets alter column name set not null;

-- 4. Quitar la clave primaria de `page_id` (sea cual sea su nombre) antes de
--    poner la nueva en `id`. Sin este paso, una página solo admitiría una fila.
do $$
declare
  primary_key_name text;
begin
  select conname
  into primary_key_name
  from pg_constraint
  where conrelid = 'public.page_datasets'::regclass
    and contype = 'p';

  if primary_key_name is not null then
    execute format('alter table public.page_datasets drop constraint %I', primary_key_name);
  end if;
end
$$;

-- 5. Clave primaria en `id`, solo si todavía no existe.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.page_datasets'::regclass
      and contype = 'p'
  ) then
    alter table public.page_datasets
      add constraint page_datasets_pkey primary key (id);
  end if;
end
$$;

-- 6. Nombre de 1 a 60 caracteres.
alter table public.page_datasets drop constraint if exists page_datasets_name_length;
alter table public.page_datasets
  add constraint page_datasets_name_length
  check (char_length(name) between 1 and 60);

-- 7. Consultas por página y unicidad del nombre sin distinguir mayúsculas.
create index if not exists page_datasets_page_id_idx
  on public.page_datasets (page_id);

create unique index if not exists page_datasets_page_name_key
  on public.page_datasets (page_id, lower(name));

-- 8. `data` conserva su check de tamaño y tipo de 005. `updated_at` y los
--    grants siguen igual. Se repiten de forma idempotente para que el archivo
--    documente el estado final esperado.
grant select on public.page_datasets to anon, authenticated;
grant insert, update, delete on public.page_datasets to authenticated;

drop trigger if exists page_datasets_touch_updated_at on public.page_datasets;
create trigger page_datasets_touch_updated_at
  before update on public.page_datasets
  for each row execute function public.touch_updated_at();

-- 9. Las políticas de 005 ya operan por fila sobre `page_id`: no necesitan
--    cambios para admitir varias filas por página. Se recrean con la misma
--    semántica para dejar el archivo completo e idempotente.
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

commit;

-- Al borrar una página, sus datasets siguen cayendo por la FK
-- `page_id → pages.id on delete cascade` de 005.
