-- =========================================================
-- KOPI NGALAM 
-- Admin authentication foundation
-- =========================================================
--
-- CARA PAKAI:
-- 1. Buat project Supabase.
-- 2. Jalankan SQL ini di SQL Editor.
-- 3. Buat user admin di Authentication -> Users.
--    Untuk username "admin", gunakan email:
--       admin@admin.kopingalam.local
--    dan password yang saya tentukan.
-- 4. Nonaktifkan email confirmation.
-- 5. Masukkan UUID user tersebut ke public.admin_profiles.
--
-- CATATAN KEAMANAN:
-- - Jangan pernah menaruh service_role/secret key di frontend.
-- - Browser hanya memakai publishable/anon key.
-- - RLS tetap diaktifkan pada tabel.
-- =========================================================

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default 'Administrator',
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

-- Admin hanya boleh membaca profil miliknya sendiri.
drop policy if exists "admin can read own profile" on public.admin_profiles;
create policy "admin can read own profile"
on public.admin_profiles
for select
to authenticated
using ((select auth.uid()) = id);

revoke all on table public.admin_profiles from anon;
grant select on table public.admin_profiles to authenticated;

-- Fungsi sederhana untuk memeriksa apakah user adalah admin.
-- Dipakai tahap berikutnya untuk RLS produk/pesanan.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- =========================================================
-- CONTOH SETELAH USER AUTH SUDAH DIBUAT
-- Ganti UUID dengan UUID user admin dari Supabase Dashboard.
--
-- insert into public.admin_profiles (id, username, display_name)
-- values (
--   'UUID-DARI-AUTH-USERS',
--   'admin',
--   'Administrator'
-- );
-- =========================================================
