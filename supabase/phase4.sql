-- =========================================================
-- KOPI NGALAM — Tahap 4: Varian Menu (Hot / Ice, dll)
-- =========================================================
-- Contoh pemakaian:
--   Produk 1: name="Kopi Tubruk", variant_group="kopi-tubruk",
--             variant_label="Hot",  price=18000
--   Produk 2: name="Kopi Tubruk", variant_group="kopi-tubruk",
--             variant_label="Ice",  price=20000
-- Keduanya akan tampil sebagai SATU kartu menu "Kopi Tubruk"
-- dengan 2 tombol pilihan (Hot / Ice) di site customer.

alter table public.products add column if not exists variant_group text;
alter table public.products add column if not exists variant_label text;

comment on column public.products.variant_group is
  'Kode pengelompokan varian menu (mis. "kopi-tubruk"). Kosongkan kalau menu tidak punya varian.';
comment on column public.products.variant_label is
  'Label varian yang tampil ke customer (mis. "Hot" / "Ice"). Isi bareng dengan variant_group.';

-- VERIFIKASI
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name in ('variant_group', 'variant_label');