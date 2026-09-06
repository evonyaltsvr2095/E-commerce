-- =========================================================
-- ROLE ADMIN vs KASIR
-- =========================================================

-- 1. Tambah kolom role
alter table public.admin_profiles
  add column if not exists role text not null default 'kasir'
  check (role in ('admin', 'kasir'));

-- Akun yang sudah ada saat ini dijadikan admin (supaya tidak
-- mendadak kehilangan akses penuh setelah migrasi ini)
update public.admin_profiles set role = 'admin';

-- 2. is_admin() sekarang cek role juga (bukan cuma keanggotaan)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Fungsi baru: is_staff() -- true untuk admin ATAU kasir
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid()
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- =========================================================
-- RAPIKAN KEAMANAN admin_profiles (celah lama: anon kebagian grant penuh)
-- =========================================================
revoke all on table public.admin_profiles from anon;
revoke all on table public.admin_profiles from authenticated;
grant select, insert, update, delete on table public.admin_profiles to authenticated;

drop policy if exists "admin can read own profile" on public.admin_profiles;
drop policy if exists "Staff can read own profile" on public.admin_profiles;
create policy "Staff can read own profile"
on public.admin_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Admins can view all profiles" on public.admin_profiles;
create policy "Admins can view all profiles"
on public.admin_profiles
for select
to authenticated
using ((select is_admin()));

drop policy if exists "Admins can insert profiles" on public.admin_profiles;
create policy "Admins can insert profiles"
on public.admin_profiles
for insert
to authenticated
with check ((select is_admin()));

drop policy if exists "Admins can update profiles" on public.admin_profiles;
create policy "Admins can update profiles"
on public.admin_profiles
for update
to authenticated
using ((select is_admin()))
with check ((select is_admin()));

drop policy if exists "Admins can delete profiles" on public.admin_profiles;
create policy "Admins can delete profiles"
on public.admin_profiles
for delete
to authenticated
using ((select is_admin()) and id <> auth.uid());
-- (admin tidak bisa hapus akunnya sendiri, supaya tidak terkunci)

-- =========================================================
-- orders: staff (admin & kasir) boleh lihat & update status,
-- HAPUS tetap cuma admin.
-- =========================================================
drop policy if exists "Admins can view all orders" on public.orders;
create policy "Staff can view all orders"
on public.orders
for select
to authenticated
using ((select is_staff()));

drop policy if exists "Admins can update orders" on public.orders;
create policy "Staff can update orders"
on public.orders
for update
to authenticated
using ((select is_staff()))
with check ((select is_staff()));

-- "Admins can delete orders" TIDAK diubah, tetap is_admin() saja.

-- =========================================================
-- products: staff boleh lihat SEMUA produk (termasuk nonaktif)
-- supaya kasir bisa lihat & toggle di Setting Menu. Insert/update/
-- delete PENUH tetap cuma admin (tidak diubah dari sebelumnya).
-- =========================================================
drop policy if exists "Staff can view all products" on public.products;
create policy "Staff can view all products"
on public.products
for select
to authenticated
using ((select is_staff()));

-- =========================================================
-- RPC: toggle_product_availability
-- Supaya kasir bisa ubah status Tersedia/Nonaktif TANPA
-- diberi izin UPDATE penuh ke tabel products (harga/nama tetap
-- aman, cuma admin yang bisa ubah lewat jalur biasa).
-- =========================================================
create or replace function public.toggle_product_availability(
  p_product_id bigint,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select is_staff()) then
    raise exception 'Tidak diizinkan.';
  end if;

  update public.products
  set is_active = p_is_active
  where id = p_product_id;
end;
$$;

revoke all on function public.toggle_product_availability(bigint, boolean) from public;
grant execute on function public.toggle_product_availability(bigint, boolean) to authenticated;

-- =========================================================
-- VERIFIKASI
-- =========================================================
select id, username, display_name, role from public.admin_profiles order by username;

select policyname, cmd, roles
from pg_policies
where tablename in ('admin_profiles', 'orders', 'products')
order by tablename, policyname;