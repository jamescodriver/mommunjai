import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { verifyLineSignature, extractTicketCode, reportFlex, lineReply } from "@/lib/line";
import { generateReport } from "@/lib/report";

export const runtime = "nodejs";

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

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }
  const events: any[] = payload.events || [];

  for (const ev of events) {
    try {
      if (ev.type !== "message" || ev.message?.type !== "text") continue;
      const lineUserId = ev.source?.userId as string | undefined;
      const code = extractTicketCode(ev.message.text);

      if (!code) {
        await lineReply(ev.replyToken, [{ type: "text", text: "สวัสดีค่ะ 💛 พิมพ์ ‘รหัส MJ-XXXXXX’ ที่ได้จากแอป เพื่อรับรายงานความพร้อมมีลูกเฉพาะคุณค่ะ" }]);
        continue;
      }
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
        { type: "text", text: `เชื่อมข้อมูลสำเร็จค่ะคุณ ${report.nickname} 🎉 นี่คือรายงานความพร้อมของคุณ` },
        reportFlex(report, code),
      ]);
    } catch {
      /* keep processing other events; always 200 to LINE */
    }
  }

  return NextResponse.json({ ok: true });
}

// LINE verifies the webhook URL with a GET/verify — respond 200.
export async function GET() {
  return NextResponse.json({ ok: true });
}
