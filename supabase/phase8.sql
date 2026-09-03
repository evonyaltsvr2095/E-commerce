-- =========================================================
-- KOPI NGALAM — Tahap 8: Catatan/Permintaan Khusus per Item
-- =========================================================
-- Aman dijalankan berkali-kali.
--
-- Menambah kolom `notes` di tabel order_items (misal:
-- "less sugar", "tanpa es", "pisahkan saus"), dan memperluas
-- fungsi buat_pesanan_dengan_item supaya menyimpannya.
-- Signature fungsi TIDAK berubah (masih parameter yang sama
-- persis seperti Tahap 7) -- catatan diambil dari dalam
-- p_items (jsonb), bukan parameter baru, jadi tidak ada
-- risiko bentrok dengan pemanggilan yang sudah ada.
-- =========================================================

alter table public.order_items add column if not exists notes text;

create or replace function public.buat_pesanan_dengan_item(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_items jsonb,
  p_total numeric,
  p_payment_method text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order_id uuid := gen_random_uuid();
  item jsonb;
begin
  insert into public.orders (
    id, customer_name, customer_email, customer_phone,
    items, total, payment_method
  )
  values (
    v_order_id, p_customer_name, p_customer_email, p_customer_phone,
    p_items, p_total, p_payment_method
  );

  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity, subtotal, notes
    )
    values (
      v_order_id,
      (item->>'product_id')::bigint,
      item->>'name',
      (item->>'price')::numeric,
      (item->>'quantity')::numeric,
      (item->>'price')::numeric * (item->>'quantity')::numeric,
      nullif(trim(item->>'notes'), '')
    );
  end loop;

  return v_order_id;
end;
$function$;

grant execute on function public.buat_pesanan_dengan_item(text, text, text, jsonb, numeric, text) to anon, authenticated;

-- VERIFIKASI
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'order_items' and column_name = 'notes';