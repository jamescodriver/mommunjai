import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/ticket";

export const runtime = "nodejs";

// Lightweight analytics beacon. Never blocks UX; best-effort.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`ev:${ip}`, 60, 60_000)) return NextResponse.json({ ok: true });
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ ok: true });
  if (hasSupabaseEnv()) {
    try {
      await getServiceClient().from("events").insert({
        name: String(body.name).slice(0, 60),
        anon_id: body.anon_id ? String(body.anon_id).slice(0, 64) : null,
        props: body.props && typeof body.props === "object" ? body.props : {},
      });
    } catch {
      /* best-effort */
    }
  }
  return NextResponse.json({ ok: true });
}
