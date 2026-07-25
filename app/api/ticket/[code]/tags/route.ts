import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { sessionFromReq } from "@/lib/session-server";
import { hasPerm } from "@/lib/auth";

export const runtime = "nodejs";

// Add/remove a manual tag on a ticket's lead. Requires manage_tags.
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "manage_tags")) return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการ tag" }, { status: 403 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });
  const code = params.code?.toUpperCase();
  const body = await req.json().catch(() => null);
  if (!body?.slug) return NextResponse.json({ error: "ต้องระบุ slug" }, { status: 400 });

  const sb = getServiceClient();
  const { data: ticket } = await sb.from("tickets").select("lead_id").eq("code", code).single();
  if (!ticket) return NextResponse.json({ error: "ไม่พบ ticket" }, { status: 404 });

  let { data: tag } = await sb.from("tags").select("id").eq("slug", body.slug).single();
  if (!tag) {
    const { data: created } = await sb.from("tags").insert({ slug: body.slug, label: body.label || body.slug, kind: "manual" }).select("id").single();
    tag = created!;
  }

  if (body.action === "remove") {
    await sb.from("tag_assignments").delete().eq("lead_id", ticket.lead_id).eq("tag_id", tag.id);
  } else {
    await sb.from("tag_assignments").upsert({ lead_id: ticket.lead_id, tag_id: tag.id, source: "staff" }, { onConflict: "lead_id,tag_id" });
  }
  await sb.from("staff_audit").insert({ staff_id: s!.sid, action: body.action === "remove" ? "remove_tag" : "add_tag", target: `${code} ${body.slug}` });
  return NextResponse.json({ ok: true });
}
