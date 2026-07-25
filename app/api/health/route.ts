import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Deploy verification: confirms which integrations are wired without leaking secrets.
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "mommunjai",
    supabase: hasSupabaseEnv(),
    line: !!process.env.LINE_CHANNEL_SECRET && !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    session_secret_set: !!process.env.SESSION_SECRET,
    app_url: process.env.NEXT_PUBLIC_APP_URL || null,
  });
}
