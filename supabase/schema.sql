-- Bodegon POS Kosher - Supabase schema
-- Run this script in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nombre text not null,
  marca text,
  kosher boolean not null default false,
  imagen text,
  precio_venta numeric(12, 2) not null default 0 check (precio_venta >= 0),
  stock integer not null default 0 check (stock >= 0),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, codigo)
);

alter table public.productos add column if not exists id uuid default gen_random_uuid();
alter table public.productos add column if not exists codigo text;
alter table public.productos add column if not exists nombre text;
alter table public.productos add column if not exists marca text;
alter table public.productos add column if not exists kosher boolean not null default false;
alter table public.productos add column if not exists imagen text;
alter table public.productos add column if not exists precio_venta numeric(12, 2) not null default 0;
alter table public.productos add column if not exists stock integer not null default 0;
alter table public.productos add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.productos add column if not exists created_at timestamptz not null default now();
alter table public.productos add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_index
    where indrelid = 'public.productos'::regclass
      and indisprimary
  ) then
    alter table public.productos alter column id set not null;
    alter table public.productos add primary key (id);
  end if;
end;
$$;

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  total numeric(12, 2) not null default 0 check (total >= 0),
  fecha timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.ventas add column if not exists id uuid default gen_random_uuid();
alter table public.ventas add column if not exists total numeric(12, 2) not null default 0;
alter table public.ventas add column if not exists fecha timestamptz not null default now();
alter table public.ventas add column if not exists user_id uuid references auth.users(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_index
    where indrelid = 'public.ventas'::regclass
      and indisprimary
  ) then
    alter table public.ventas alter column id set not null;
    alter table public.ventas add primary key (id);
  end if;
end;
$$;

create table if not exists public.ventas_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  precio numeric(12, 2) not null check (precio >= 0)
);

alter table public.ventas_items add column if not exists id uuid default gen_random_uuid();
alter table public.ventas_items add column if not exists venta_id uuid references public.ventas(id) on delete cascade;
alter table public.ventas_items add column if not exists producto_id uuid references public.productos(id) on delete restrict;
alter table public.ventas_items add column if not exists cantidad integer;
alter table public.ventas_items add column if not exists precio numeric(12, 2);

do $$
begin
  if not exists (
    select 1
    from pg_index
    where indrelid = 'public.ventas_items'::regclass
      and indisprimary
  ) then
    alter table public.ventas_items alter column id set not null;
    alter table public.ventas_items add primary key (id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.productos'::regclass
      and contype = 'u'
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.productos'::regclass and attname = 'user_id'),
        (select attnum from pg_attribute where attrelid = 'public.productos'::regclass and attname = 'codigo')
      ]::smallint[]
  ) then
    alter table public.productos add constraint productos_user_codigo_unique unique (user_id, codigo);
  end if;
end;
$$;

create index if not exists productos_user_codigo_idx on public.productos (user_id, codigo);
create index if not exists productos_user_stock_idx on public.productos (user_id, stock);
create index if not exists ventas_user_fecha_idx on public.ventas (user_id, fecha desc);
create index if not exists ventas_items_venta_idx on public.ventas_items (venta_id);
create index if not exists ventas_items_producto_idx on public.ventas_items (producto_id);

create table if not exists public.scanner_lab_scans (
  id uuid primary key default gen_random_uuid(),
  raw_code text not null,
  normalized_code text not null,
  status text not null check (status in ('found', 'not_found', 'error')),
  source text,
  product_name text,
  brand text,
  product_description text,
  category text,
  image_url text,
  kosher_hint boolean not null default false,
  api_attempts jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.scanner_lab_scans add column if not exists id uuid default gen_random_uuid();
alter table public.scanner_lab_scans add column if not exists raw_code text;
alter table public.scanner_lab_scans add column if not exists normalized_code text;
alter table public.scanner_lab_scans add column if not exists status text;
alter table public.scanner_lab_scans add column if not exists source text;
alter table public.scanner_lab_scans add column if not exists product_name text;
alter table public.scanner_lab_scans add column if not exists brand text;
alter table public.scanner_lab_scans add column if not exists product_description text;
alter table public.scanner_lab_scans add column if not exists category text;
alter table public.scanner_lab_scans add column if not exists image_url text;
alter table public.scanner_lab_scans add column if not exists kosher_hint boolean not null default false;
alter table public.scanner_lab_scans add column if not exists api_attempts jsonb not null default '[]'::jsonb;
alter table public.scanner_lab_scans add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.scanner_lab_scans add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_index
    where indrelid = 'public.scanner_lab_scans'::regclass
      and indisprimary
  ) then
    alter table public.scanner_lab_scans alter column id set not null;
    alter table public.scanner_lab_scans add primary key (id);
  end if;
end;
$$;

create index if not exists scanner_lab_scans_created_at_idx on public.scanner_lab_scans (created_at desc);
create index if not exists scanner_lab_scans_normalized_code_idx on public.scanner_lab_scans (normalized_code);
create index if not exists scanner_lab_scans_status_idx on public.scanner_lab_scans (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists productos_set_updated_at on public.productos;
create trigger productos_set_updated_at
before update on public.productos
for each row
execute function public.set_updated_at();

alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.ventas_items enable row level security;
alter table public.scanner_lab_scans enable row level security;

drop policy if exists "productos_select_own" on public.productos;
create policy "productos_select_own"
on public.productos
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "productos_insert_own" on public.productos;
create policy "productos_insert_own"
on public.productos
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "productos_update_own" on public.productos;
create policy "productos_update_own"
on public.productos
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "productos_delete_own" on public.productos;
create policy "productos_delete_own"
on public.productos
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ventas_select_own" on public.ventas;
create policy "ventas_select_own"
on public.ventas
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ventas_insert_own" on public.ventas;
create policy "ventas_insert_own"
on public.ventas
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ventas_update_own" on public.ventas;
create policy "ventas_update_own"
on public.ventas
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ventas_items_select_own" on public.ventas_items;
create policy "ventas_items_select_own"
on public.ventas_items
for select
to authenticated
using (
  exists (
    select 1
    from public.ventas v
    where v.id = venta_id
      and v.user_id = auth.uid()
  )
);

drop policy if exists "ventas_items_insert_own" on public.ventas_items;
create policy "ventas_items_insert_own"
on public.ventas_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.ventas v
    where v.id = venta_id
      and v.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.productos p
    where p.id = producto_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "ventas_items_update_own" on public.ventas_items;
create policy "ventas_items_update_own"
on public.ventas_items
for update
to authenticated
using (
  exists (
    select 1
    from public.ventas v
    where v.id = venta_id
      and v.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.ventas v
    where v.id = venta_id
      and v.user_id = auth.uid()
  )
);

drop policy if exists "ventas_items_delete_own" on public.ventas_items;
create policy "ventas_items_delete_own"
on public.ventas_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.ventas v
    where v.id = venta_id
      and v.user_id = auth.uid()
  )
);

create or replace function public.registrar_venta(
  p_user_id uuid,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venta_id uuid;
  v_total numeric(12, 2) := 0;
  v_expected_count integer := 0;
  v_found_count integer := 0;
  v_row record;
begin
  if auth.uid() is null or p_user_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene items';
  end if;

  select count(*)
  into v_expected_count
  from (
    select producto_id
    from jsonb_to_recordset(p_items) as x(producto_id uuid, cantidad integer)
    group by producto_id
  ) grouped_items;

  for v_row in
    select p.id, p.precio_venta, p.stock, ci.cantidad
    from (
      select producto_id, sum(cantidad)::integer as cantidad
      from jsonb_to_recordset(p_items) as x(producto_id uuid, cantidad integer)
      group by producto_id
    ) ci
    join public.productos p
      on p.id = ci.producto_id
     and p.user_id = p_user_id
    for update of p
  loop
    v_found_count := v_found_count + 1;

    if v_row.cantidad is null or v_row.cantidad <= 0 then
      raise exception 'Cantidad inválida para producto %', v_row.id;
    end if;

    if v_row.stock < v_row.cantidad then
      raise exception 'Stock insuficiente para producto %', v_row.id;
    end if;

    v_total := v_total + (v_row.precio_venta * v_row.cantidad);
  end loop;

  if v_expected_count <> v_found_count then
    raise exception 'Uno o más productos no pertenecen al usuario';
  end if;

  insert into public.ventas (total, user_id)
  values (v_total, p_user_id)
  returning id into v_venta_id;

  insert into public.ventas_items (venta_id, producto_id, cantidad, precio)
  select v_venta_id, p.id, ci.cantidad, p.precio_venta
  from (
    select producto_id, sum(cantidad)::integer as cantidad
    from jsonb_to_recordset(p_items) as x(producto_id uuid, cantidad integer)
    group by producto_id
  ) ci
  join public.productos p
    on p.id = ci.producto_id
   and p.user_id = p_user_id;

  update public.productos p
  set stock = p.stock - ci.cantidad
  from (
    select producto_id, sum(cantidad)::integer as cantidad
    from jsonb_to_recordset(p_items) as x(producto_id uuid, cantidad integer)
    group by producto_id
  ) ci
  where p.id = ci.producto_id
    and p.user_id = p_user_id;

  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(uuid, jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'productos_fotos',
  'productos_fotos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "productos_fotos_select_own" on storage.objects;
create policy "productos_fotos_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'productos_fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "productos_fotos_insert_own" on storage.objects;
create policy "productos_fotos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'productos_fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "productos_fotos_update_own" on storage.objects;
create policy "productos_fotos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'productos_fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'productos_fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "productos_fotos_delete_own" on storage.objects;
create policy "productos_fotos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'productos_fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
