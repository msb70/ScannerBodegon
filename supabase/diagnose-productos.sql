-- Diagnose the productos table in the current Supabase project.
-- Run in SQL Editor and check that user_id_exists is true.

select
  current_database() as database_name,
  current_schema() as current_schema,
  to_regclass('public.productos') as productos_table,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'productos'
      and column_name = 'user_id'
  ) as user_id_exists;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'productos'
order by ordinal_position;
