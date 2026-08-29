// admin/supabase-config.js
// Public client configuration. Jangan pernah menaruh secret/service_role key di sini.
const SUPABASE_URL = "https://ejismfixxzcwhwkxmfzr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_flGqebaUsaugKfRAFDHkXg_TNo-OaGD";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);
