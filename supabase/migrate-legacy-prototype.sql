-- Migration for older prototype tables that were created without multi-tenant columns.
-- Run this once if the app reports: column productos.user_id does not exist.

create extension if not exists pgcrypto;

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

alter table public.ventas add column if not exists id uuid default gen_random_uuid();
alter table public.ventas add column if not exists total numeric(12, 2) not null default 0;
alter table public.ventas add column if not exists fecha timestamptz not null default now();
alter table public.ventas add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.ventas_items add column if not exists id uuid default gen_random_uuid();
alter table public.ventas_items add column if not exists venta_id uuid references public.ventas(id) on delete cascade;
alter table public.ventas_items add column if not exists producto_id uuid references public.productos(id) on delete restrict;
alter table public.ventas_items add column if not exists cantidad integer;
alter table public.ventas_items add column if not exists precio numeric(12, 2);

create index if not exists productos_user_codigo_idx on public.productos (user_id, codigo);
create index if not exists ventas_user_fecha_idx on public.ventas (user_id, fecha desc);

alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.ventas_items enable row level security;

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
