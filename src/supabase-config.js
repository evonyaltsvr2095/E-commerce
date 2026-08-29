// src/supabase-config.js
// Konfigurasi Supabase untuk website customer (public, read-only).
// PENTING: isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY dengan nilai
// YANG SAMA seperti yang ada di admin/supabase-config.js
// (project Supabase yang baru: ejismfixxzcwhwkxmfzr)

const SUPABASE_URL = "https://ejismfixxzcwhwkxmfzr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_flGqebaUsaugKfRAFDHkXg_TNo-OaGD";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);
