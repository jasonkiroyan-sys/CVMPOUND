import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service-role key when available (bypasses RLS),
// falling back to the anon key. Never import this into a client component.
// Server-side client. Prefers the service-role key (set it in the host's env to
// bypass RLS); falls back to the public anon credentials, which is sufficient
// for v1 since RLS is disabled and the anon role has full table grants.
const DEFAULT_SUPABASE_URL = "https://iakxrkrogjjugugmznpn.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3hya3JvZ2pqdWd1Z216bnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzk0NzAsImV4cCI6MjA5NzYxNTQ3MH0.X9BqTJbT2UnJf9NvW07FoerxUoyOcuxI-1JejlSlOXk";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    DEFAULT_SUPABASE_ANON_KEY
);

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};
