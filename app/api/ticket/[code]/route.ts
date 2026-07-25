import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { sessionFromReq } from "@/lib/session-server";
import { hasPerm } from "@/lib/auth";

export const runtime = "nodejs";

// Staff ticket lookup — requires an authenticated session with view_leads.
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "view_leads")) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ / ไม่มีสิทธิ์" }, { status: 401 });
  const code = params.code?.toUpperCase();
  if (!/^MJ-[0-9A-Z]{6}$/.test(code)) return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });

  const sb = getServiceClient();
  const { data: ticket } = await sb.from("tickets").select("id, code, status, lead_id, created_at").eq("code", code).single();
  if (!ticket) return NextResponse.json({ error: "ไม่พบ ticket นี้" }, { status: 404 });

  const { data: lead } = await sb.from("leads").select("*").eq("id", ticket.lead_id).single();
  const { data: results } = await sb.from("tool_results").select("tool, input, output, created_at").eq("lead_id", ticket.lead_id);
  const { data: assigns } = await sb.from("tag_assignments").select("source, tags(slug, label, color)").eq("lead_id", ticket.lead_id);
  const { data: binding } = await sb.from("line_bindings").select("line_user_id, bound_at").eq("lead_id", ticket.lead_id).maybeSingle();
  const { data: report } = await sb.from("reports").select("score").eq("code", code).maybeSingle();

  await sb.from("staff_audit").insert({ staff_id: s!.sid, action: "view_ticket", target: code });

  return NextResponse.json({
    ticket, lead, results: results || [], tags: assigns || [],
    line: binding || null, reportScore: report?.score ?? null,
    canTag: hasPerm(s, "manage_tags"),
  });
}
