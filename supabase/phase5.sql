-- =========================================================
-- KOPI NGALAM — Tahap 5: Notifikasi Pesanan Real-time
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- VERIFIKASI: 'orders' harus muncul di hasil ini
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public';