import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { verifyLineSignature, extractTicketCode, reportFlex, menuFlex, lineReply } from "@/lib/line";
import { generateReport } from "@/lib/report";
import { resolveCustomerByLineUserId, linkLeadToCustomerViaLine, signResumeToken } from "@/lib/customer";

export const runtime = "nodejs";

// Rich Menu button text (configured as a no-code "Text" action in LINE
// Official Account Manager — see docs/IMPACT-ANALYSIS-2607.md PDF-05/06).
// A LIFF/LINE-Login-based menu would carry a per-user token directly; this
// fixed phrase is the buildable-today substitute that still identifies the
// real tapping user server-side (via the webhook's verified line_user_id).
const MENU_TRIGGER = "แผนของฉัน";

// This LINE channel previously had its webhook pointed directly at a
// third-party slip-verification service (thunder.in.th) — a single LINE
// channel can only have one webhook URL, so now that this app owns the
// webhook, every raw event is relayed on to that service too (best-effort,
// same signed body + signature LINE sent us) so slip-checking keeps working.
const SLIP_CHECK_WEBHOOK_URL = process.env.SLIP_CHECK_WEBHOOK_URL;

async function forwardToSlipCheckWebhook(raw: string, sig: string | null) {
  if (!SLIP_CHECK_WEBHOOK_URL) return;
  try {
    const res = await fetch(SLIP_CHECK_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...(sig ? { "x-line-signature": sig } : {}) },
      body: raw,
    });
    if (!res.ok) {
      console.error(`[slip-check webhook] forward rejected: HTTP ${res.status}`);
    }
  } catch (err) {
    // best-effort — an outage here must never break this app's own bot flow,
    // but it must show up in Vercel logs instead of failing silently.
    console.error("[slip-check webhook] forward failed:", err);
  }
}

// LINE Messaging API webhook.
// When a user sends their ticket code (MJ-XXXXXX) in the OA chat, we:
//  1) bind their LINE userId <-> lead, 2) tag them (#line-connected), 3) reply with their report Flex.
// NOTE: LINE OA *native chat tags* are not settable via public API — we manage tags in our own
// system (tag_assignments) which admin/staff see. This webhook does the binding + our-side tagging.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-line-signature");
  const devBypass = !process.env.LINE_CHANNEL_SECRET && req.headers.get("x-dev-bypass") === "1";

  if (!devBypass && !verifyLineSignature(raw, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const forwardDone = forwardToSlipCheckWebhook(raw, sig);

  let payload: any;
  try { payload = JSON.parse(raw); } catch { await forwardDone; return NextResponse.json({ ok: true }); }
  const events: any[] = payload.events || [];

  for (const ev of events) {
    try {
      if (ev.type !== "message" || ev.message?.type !== "text") continue;
      const lineUserId = ev.source?.userId as string | undefined;

      if (ev.message.text.trim() === MENU_TRIGGER) {
        const planUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/plan`;
        if (!hasSupabaseEnv() || !lineUserId) {
          await lineReply(ev.replyToken, [menuFlex({ freshPlanUrl: planUrl })]);
          continue;
        }
        const sb = getServiceClient();
        const customer = await resolveCustomerByLineUserId(sb, lineUserId);
        if (!customer?.primary_lead_id) {
          await lineReply(ev.replyToken, [menuFlex({ freshPlanUrl: planUrl })]);
          continue;
        }
        const { data: lead } = await sb.from("leads").select("nickname").eq("id", customer.primary_lead_id).maybeSingle();
        const { data: ticket } = await sb.from("tickets").select("code").eq("lead_id", customer.primary_lead_id).maybeSingle();
        let resumeUrl: string | undefined;
        try {
          resumeUrl = `${planUrl}?rt=${encodeURIComponent(signResumeToken(customer.id))}`;
        } catch {
          resumeUrl = undefined; // RESUME_TOKEN_SECRET not configured — still send the report link below
        }
        await lineReply(ev.replyToken, [
          menuFlex({ nickname: lead?.nickname, reportCode: ticket?.code, resumeUrl, freshPlanUrl: planUrl }),
        ]);
        continue;
      }

      const code = extractTicketCode(ev.message.text);

      // No auto-reply here: this webhook now shares the channel with
      // slip-check + normal staff chat (see forwardToSlipCheckWebhook above),
      // so replying to every unrecognized text message would talk over them.
      if (!code) continue;
      if (!hasSupabaseEnv()) {
        await lineReply(ev.replyToken, [{ type: "text", text: `รับรหัส ${code} แล้วค่ะ (โหมดทดสอบ — ยังไม่เชื่อมฐานข้อมูล)` }]);
        continue;
      }

      const sb = getServiceClient();
      const { data: ticket } = await sb.from("tickets").select("lead_id").eq("code", code).single();
      if (!ticket) {
        await lineReply(ev.replyToken, [{ type: "text", text: "ไม่พบรหัสนี้ค่ะ ลองตรวจสอบอีกครั้ง หรือทำแบบสอบถามใหม่ในแอปนะคะ" }]);
        continue;
      }

      // bind line user <-> lead
      if (lineUserId) {
        await sb.from("line_bindings").upsert(
          { line_user_id: lineUserId, lead_id: ticket.lead_id, ticket_code: code },
          { onConflict: "line_user_id" },
        );
        await sb.from("leads").update({ line_user_id: lineUserId }).eq("id", ticket.lead_id);
        // PDF-05/06: also pull this lead into the customer-identity system,
        // so the "แผนของฉัน" menu trigger recognizes them going forward.
        const customerId = await linkLeadToCustomerViaLine(sb, ticket.lead_id, lineUserId);
        if (customerId) await sb.from("line_bindings").update({ customer_id: customerId }).eq("line_user_id", lineUserId);
      }

      // our-side tag: #line-connected
      const { data: tag } = await sb.from("tags").select("id").eq("slug", "#line-connected").single()
        .then(async (r) => r.data ? r : sb.from("tags").insert({ slug: "#line-connected", label: "เชื่อม LINE แล้ว", kind: "auto", color: "#06C755" }).select("id").single());
      if (tag?.id) await sb.from("tag_assignments").upsert({ lead_id: ticket.lead_id, tag_id: tag.id, source: "auto" }, { onConflict: "lead_id,tag_id" });

      // load report snapshot (or build from lead + tool_results)
      let report;
      const { data: rep } = await sb.from("reports").select("payload").eq("code", code).single();
      if (rep?.payload) report = rep.payload;
      else {
        const { data: lead } = await sb.from("leads").select("*").eq("id", ticket.lead_id).single();
        const { data: results } = await sb.from("tool_results").select("tool, input, output").eq("lead_id", ticket.lead_id);
        const tools: any = {};
        (results || []).forEach((r) => (tools[r.tool] = { input: r.input, output: r.output }));
        report = generateReport({ nickname: lead?.nickname, stage: lead?.stage, weightKg: undefined, ageRange: lead?.age_range, hasPcos: lead?.has_pcos, artPlan: lead?.art_plan, tools });
      }

      await lineReply(ev.replyToken, [
        // เลิกใช้คำว่า "รายงานความพร้อม" ตามที่การ์ด Flex เลิกโชว์คะแนนแล้ว (1/8/2026)
        { type: "text", text: `เชื่อมข้อมูลสำเร็จค่ะคุณ ${report.nickname} 🎉 นี่คือแผนเฉพาะคุณค่ะ` },
        reportFlex(report, code),
      ]);
    } catch {
      /* keep processing other events; always 200 to LINE */
    }
  }

  await forwardDone;
  return NextResponse.json({ ok: true });
}

// LINE verifies the webhook URL with a GET/verify — respond 200.
export async function GET() {
  return NextResponse.json({ ok: true });
}
