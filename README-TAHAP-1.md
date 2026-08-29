# Kopi Ngalam — Tahap 1: Admin Authentication

## Yang sudah dibuat

- Customer tetap langsung masuk ke `index.html`.
- Customer tidak perlu login.
- Ditambahkan link `Admin` di footer.
- Admin login melalui `admin/login.html`.
- Login memakai Supabase Auth.
- Username admin diterjemahkan menjadi email internal:
  `USERNAME@admin.kopingalam.local`
- Session disimpan oleh Supabase.
- `admin/dashboard.html` mengarahkan kembali ke login jika session tidak ada.
- Logout tersedia.
- SQL dasar `admin_profiles` + fungsi `is_admin()` sudah disiapkan.

## Setup Supabase

1. Buat project di Supabase.
2. Buka SQL Editor.
3. Jalankan `supabase/phase1.sql`.
4. Buka Authentication -> Users -> Add user.
5. Buat admin, contoh:
   - Email: `admin@admin.kopingalam.local`
   - Password: gunakan password kuat milikmu.
6. Jika tidak ingin verifikasi email, nonaktifkan/atur email confirmation sesuai konfigurasi Auth project.
7. Salin UUID user tersebut.
8. Jalankan:

```sql
insert into public.admin_profiles (id, username, display_name)
values (
  'UUID-DARI-AUTH-USERS',
  'admin',
  'Administrator'
);
```

9. Buka `admin/supabase-config.js`.
10. Isi `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` dari Project Settings -> API.
11. Jangan pernah memasukkan `service_role` atau secret key ke file frontend.

## URL

Customer:
`index.html`

Admin:
`admin/login.html`

## Catatan

Tahap 1 belum memindahkan data produk ke database. `app.js` masih menggunakan data produk lokal seperti project awal.

Tahap 2 akan mengunci dashboard berdasarkan `admin_profiles`/`is_admin()` dan mulai membuat database produk/pesanan secara penuh.

## Supabase project saat ini

Project frontend admin menggunakan Supabase project baru `aajtbsjmvonrjweamasi`. Gunakan Publishable Key saja di frontend; jangan pernah menaruh secret/service_role key di file HTML/JS.
