-- =========================================================
-- KOPI NGALAM — Tahap 6: Rating & Ulasan Menu
-- =========================================================

create or replace view public.product_rating_summary as
select
  product_id,
  round(avg(rating)::numeric, 1) as avg_rating,
  count(*) as review_count
from public.product_reviews
group by product_id;

-- View mewarisi RLS dari tabel product_reviews yang sudah
-- mengizinkan SELECT untuk semua orang (anon & authenticated),
-- jadi cukup pastikan grant SELECT ke view-nya juga:
grant select on public.product_rating_summary to anon, authenticated;

-- VERIFIKASI
select * from public.product_rating_summary limit 10;