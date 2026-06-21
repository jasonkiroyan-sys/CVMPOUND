import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service-role key when available (bypasses RLS),
// falling back to the anon key. Never import this into a client component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "placeholder-service-key"
);

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};
