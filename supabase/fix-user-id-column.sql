-- Minimal fix for:
-- column productos.user_id does not exist 42703
--
-- Run this in the Supabase SQL Editor for the same project configured in .env.local.

alter table public.productos
add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists productos_user_codigo_idx
on public.productos (user_id, codigo);

alter table public.productos enable row level security;

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

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'productos'
  and column_name = 'user_id';
