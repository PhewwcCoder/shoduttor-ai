// Shared Supabase client (service-role key — server-side only, never expose this).
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.warn(
    "[shoduttor] WARNING: SUPABASE_URL / SUPABASE_SERVICE_KEY not set. FAQ storage and tickets will fail until you add them to server/.env"
  );
}

// Pass safe fallbacks so requiring this file never throws at import time;
// actual calls will surface a clear error if creds are missing.
const supabase = createClient(url || "http://localhost", key || "missing-key");

module.exports = { supabase };
