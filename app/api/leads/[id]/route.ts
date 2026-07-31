import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { sessionFromReq } from "@/lib/session-server";
import { hasPerm } from "@/lib/auth";
import { mapLegacyArtPlan, INFERTILITY_ISSUE_VALUES } from "@/lib/calc/vitamins";

export const runtime = "nodejs";

const STAGES = ["prep", "infertility", "pregnant", "lactating", "male"];
const CONTACT_CHANNELS = ["line", "phone", "other"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Health-sensitive fields — worth a before/after diff in the audit trail,
// not just "this field was touched" (Lucifer red-team, 2026-07-31).
const SENSITIVE_FIELDS = ["stage", "has_pcos", "art_plan", "infertility_issues"];

function sanitizeIssues(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => (INFERTILITY_ISSUE_VALUES as string[]).includes(x)).slice(0, INFERTILITY_ISSUE_VALUES.length);
}

// PATCH /api/leads/:id — edit a customer record's own answers (not their tool
// history/report, which are historical snapshots, not live-editable fields).
// Requires manage_leads — a separate, narrower permission than view_leads,
// since editing/deleting customer PII is a step up in sensitivity from just
// viewing it (docs/legal-compliance.md §3 — PDPA sensitive health data).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "manage_leads"))
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ / ไม่มีสิทธิ์แก้ไขข้อมูลลูกค้า" }, { status: 401 });
  if (!UUID_RE.test(params.id))
    return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  if (!hasSupabaseEnv())
    return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  // Whitelist: only the customer's own submitted-answer fields are editable
  // here. created_at/customer_id/interests(auto-derived)/ticket/report stay
  // untouched — this is a correction tool, not a way to rewrite history.
  const patch: Record<string, any> = {};
  if ("nickname" in body) {
    const v = String(body.nickname ?? "").trim().slice(0, 80);
    if (!v) return NextResponse.json({ error: "ชื่อเล่นห้ามว่าง" }, { status: 400 });
    patch.nickname = v;
  }
  if ("contact_channel" in body) {
    if (!CONTACT_CHANNELS.includes(body.contact_channel))
      return NextResponse.json({ error: "ช่องทางติดต่อไม่ถูกต้อง" }, { status: 400 });
    patch.contact_channel = body.contact_channel;
  }
  if ("contact_value" in body) {
    const v = String(body.contact_value ?? "").trim().slice(0, 120);
    if (v.length < 3) return NextResponse.json({ error: "ช่องทางติดต่อสั้นเกินไป" }, { status: 400 });
    patch.contact_value = v;
  }
  if ("stage" in body) {
    if (body.stage !== null && !STAGES.includes(body.stage))
      return NextResponse.json({ error: "สเตจไม่ถูกต้อง" }, { status: 400 });
    patch.stage = body.stage;
  }
  if ("age_range" in body) patch.age_range = body.age_range ? String(body.age_range).slice(0, 20) : null;
  if ("has_pcos" in body) patch.has_pcos = !!body.has_pcos;
  if ("art_plan" in body) patch.art_plan = mapLegacyArtPlan(body.art_plan);
  if ("infertility_issues" in body) patch.infertility_issues = sanitizeIssues(body.infertility_issues);
  if ("height_cm" in body) patch.height_cm = body.height_cm ? Number(body.height_cm) : null;

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "ไม่มีข้อมูลให้แก้ไข" }, { status: 400 });

  const sb = getServiceClient();

  // Capture before-values for the sensitive fields so the audit log can
  // reconstruct old -> new, not just "this field was touched".
  const touchedSensitive = SENSITIVE_FIELDS.filter((f) => f in patch);
  let before: Record<string, any> | null = null;
  if (touchedSensitive.length) {
    const { data } = await sb.from("leads").select(touchedSensitive.join(",")).eq("id", params.id).maybeSingle();
    before = data;
  }

  const { data, error } = await sb.from("leads").update(patch).eq("id", params.id).select("id").single();
  if (error || !data) return NextResponse.json({ error: "แก้ไขไม่สำเร็จ — ไม่พบรายการนี้" }, { status: 404 });

  const detail: Record<string, any> = {};
  for (const f of touchedSensitive) detail[f] = { from: before?.[f] ?? null, to: patch[f] };

  await sb.from("staff_audit").insert({
    staff_id: s!.sid,
    action: "edit_lead",
    target: `${params.id} · ${Object.keys(patch).join(",")}`,
    detail,
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/leads/:id — permanently deletes the lead row. DB-level FK
// cascade (supabase/migrations/0001_init.sql, 0002_phase2.sql) already
// removes everything scoped to just this submission: tickets,
// tag_assignments, consent_log, tool_results, reports. Anything scoped to
// the *person* rather than this one submission (line_bindings, customers,
// events) only has lead_id nulled, not deleted. This is the PDPA
// right-to-erasure flow docs/legal-compliance.md §3 calls for
// ("ผู้ใช้ต้องถอนความยินยอม/ขอลบได้... ออกแบบ flow ลบตาม ticket").
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "manage_leads"))
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ / ไม่มีสิทธิ์ลบข้อมูลลูกค้า" }, { status: 401 });
  if (!UUID_RE.test(params.id))
    return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  if (!hasSupabaseEnv())
    return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });

  const sb = getServiceClient();
  // Capture the ticket code for the audit trail before the row (and its
  // cascaded ticket) is gone — best-effort, never blocks the delete itself.
  const { data: before } = await sb.from("leads").select("customer_id, tickets(code)").eq("id", params.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "ไม่พบรายการนี้" }, { status: 404 });

  // Lucifer red-team (2026-07-31): `customers.primary_lead_id` is only
  // ON DELETE SET NULL, not cascade — but nothing was re-pointing it to a
  // surviving lead, so deleting *this one old submission* could silently
  // break that customer's LINE resume link even though they have other
  // leads left. Re-point to their most recent surviving lead first.
  if (before.customer_id) {
    const { data: customer } = await sb.from("customers").select("primary_lead_id").eq("id", before.customer_id).maybeSingle();
    if (customer?.primary_lead_id === params.id) {
      const { data: other } = await sb
        .from("leads")
        .select("id")
        .eq("customer_id", before.customer_id)
        .neq("id", params.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (other) {
        await sb.from("customers").update({ primary_lead_id: other.id }).eq("id", before.customer_id);
      }
      // else: no surviving lead for this customer — leave it to the FK's
      // own ON DELETE SET NULL, which is correct (nothing left to point to).
    }
  }

  const { error, count } = await sb.from("leads").delete({ count: "exact" }).eq("id", params.id);
  if (error) return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  if (!count) return NextResponse.json({ error: "ไม่พบรายการนี้" }, { status: 404 });

  const ticketCode = (before as any)?.tickets?.[0]?.code ?? (before as any)?.tickets?.code ?? "";
  // Deliberately no nickname/contact info here — this log itself is never
  // purged, so it shouldn't become a second place PII survives an erasure
  // request. The ticket code + lead id are enough to reconstruct who/what/when.
  await sb.from("staff_audit").insert({
    staff_id: s!.sid,
    action: "delete_lead",
    target: `${params.id} · ${ticketCode}`,
  });

  return NextResponse.json({ ok: true });
}
