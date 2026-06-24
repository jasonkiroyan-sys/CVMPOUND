import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Lightweight config health check — reports presence of config as booleans only,
// never the values themselves. Safe to keep public; exposes no secrets.
export async function GET() {
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  return NextResponse.json({
    ok: true,
    // AI features (photo recognition + Claude coach) require the Anthropic key.
    anthropic_key: hasAnthropic,
    ai_features: hasAnthropic ? "enabled" : "fallback",
    // Supabase: env override present? (the app also has baked public defaults)
    supabase_url_env: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_service_role_env: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
