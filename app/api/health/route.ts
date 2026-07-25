import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Deploy verification: confirms which integrations are wired WITHOUT leaking secret values
// (booleans only). Also echoes the webhook URL to paste into LINE Developers.
export async function GET(req: NextRequest) {
  const lineSecret = !!process.env.LINE_CHANNEL_SECRET;
  const lineToken = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const supabase = hasSupabaseEnv();
  const session = !!process.env.SESSION_SECRET;
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const missing: string[] = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!session) missing.push("SESSION_SECRET");
  if (!lineSecret) missing.push("LINE_CHANNEL_SECRET");
  if (!lineToken) missing.push("LINE_CHANNEL_ACCESS_TOKEN");

  return NextResponse.json({
    ok: true,
    service: "mommunjai",
    // core = app usable (lead capture, report, staff/admin login)
    core_ready: supabase && session,
    supabase,
    session_secret_set: session,
    // LINE bot: needs BOTH to verify signature and reply
    line_ready: lineSecret && lineToken,
    line_channel_secret_set: lineSecret,
    line_access_token_set: lineToken,
    line_webhook_url: `${origin}/api/line/webhook`,
    app_url: process.env.NEXT_PUBLIC_APP_URL || null,
    missing_env: missing,
  });
}
