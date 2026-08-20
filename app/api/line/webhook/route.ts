import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { verifyLineSignature, extractTicketCode, reportFlex, menuFlex, lineReply } from "@/lib/line";
import { isSlipCheckEnabled, isSlipCheckActive, verifySlipByUrl, signSlipImageToken, slipReplyText, slipFailMessage, expectedReceiverAccounts } from "@/lib/slip";
import { generateReport } from "@/lib/report";
import { resolveCustomerByLineUserId, linkLeadToCustomerViaLine, signResumeToken } from "@/lib/customer";
import { relayToPartner, isRelayMode, isBotEnabled, relayTargetUrl } from "@/lib/line-relay";

export const runtime = "nodejs";

// Rich Menu button text (configured as a no-code "Text" action in LINE
// Official Account Manager — see docs/IMPACT-ANALYSIS-2607.md PDF-05/06).
// A LIFF/LINE-Login-based menu would carry a per-user token directly; this
// fixed phrase is the buildable-today substitute that still identifies the
// real tapping user server-side (via the webhook's verified line_user_id).
const MENU_TRIGGER = "แผนของฉัน";

// LINE Messaging API webhook.
// When a user sends their ticket code (MJ-XXXXXX) in the OA chat, we:
//  1) bind their LINE userId <-> lead, 2) tag them (#line-connected), 3) reply with their report Flex.
// NOTE: LINE OA *native chat tags* are not settable via public API — we manage tags in our own
// system (tag_assignments) which admin/staff see. This webhook does the binding + our-side tagging.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-line-signature");
  const canVerify = !!process.env.LINE_CHANNEL_SECRET;
  const devBypass = !canVerify && req.headers.get("x-dev-bypass") === "1";
  const sigOk = verifyLineSignature(raw, sig);

  // ── ส่งต่อให้บอทอีกตัว (Thunder) ทันที ขนานกับงานของเรา ──────────────────
  // 🔴 เริ่มก่อนทำงานอะไรของเราทั้งสิ้น เพื่อให้ error/ความช้าฝั่งเราไม่ไปหน่วง
  //    บอทเช็คสลิปของลูกค้า · จะ await ตอนท้ายก่อน return (Vercel ตัดฟังก์ชันทิ้ง
  //    ทันทีที่ return — ยิงแบบ fire-and-forget แล้วไม่รอ event จะหายเป็นช่วง ๆ)
  //
  // fail-open: ถ้าเรา "ตรวจลายเซ็นไม่ได้" (LINE_CHANNEL_SECRET หาย/ตั้งผิด)
  //   → ส่งต่อไปก่อน ให้ Thunder ตรวจเอง — config พังฝั่งเรา ต้องไม่ทำบอทลูกค้าตาย
  // fail-closed: ถ้าตรวจได้แล้ว "ไม่ผ่าน" = ของปลอม → ไม่ส่งต่อ ไม่เป็นทางผ่านให้คนยิงขยะ
  const relayPromise = !canVerify || sigOk
    ? relayToPartner(raw, req.headers)
    : Promise.resolve(null);
  // ห้ามให้ปัญหาของการส่งต่อทำให้ response เราพัง (LINE จะเห็นเป็น 500 แล้วอาจปิด webhook)
  const settleRelay = async () => {
    try {
      const r = await relayPromise;
      if (r && !r.relayed && r.reason !== "no-target") {
        console.error(`[line-relay] ส่งต่อไม่สำเร็จ: ${r.reason} (ยิงไป ${r.attempts} ครั้ง)`);
      }
    } catch (e) {
      console.error("[line-relay] ส่งต่อพังแบบไม่คาดคิด", e);
    }
  };

  if (!devBypass && !sigOk) {
    await settleRelay();
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { await settleRelay(); return NextResponse.json({ ok: true }); }
  const events: any[] = payload.events || [];

  // kill switch — ปิดงานฝั่งเราได้ทันทีตอนฉุกเฉิน โดยที่ยังส่งต่อ Thunder ตามปกติ
  if (!isBotEnabled()) {
    await settleRelay();
    return NextResponse.json({ ok: true, bot: "disabled" });
  }

  // อยู่ร่วมกับบอทตัวอื่นบน OA เดียวกัน → เราต้องเงียบกับข้อความที่ไม่ใช่ของเรา
  const relaying = isRelayMode();

  for (const ev of events) {
    try {
      if (ev.type !== "message") continue;

      // ── ตรวจสลิปโอนเงินเอง (แทนการส่งต่อให้บอทของ Thunder) ────────────────
      // 🔴 ห้ามเปิดพร้อมกับ relay — replyToken ใช้ได้ครั้งเดียว ถ้าเปิดคู่กัน
      //    บอทของ Thunder จะตอบภาพเดียวกันด้วย แล้วฝ่ายใดฝ่ายหนึ่งจะพัง
      //    (มีคำเตือนใน log + diagnostic ที่ GET ของไฟล์นี้)
      if (ev.message.type === "image") {
        // ปิดอยู่ หรือ relay ยังเปิดอยู่ (ตั้งค่าชนกัน) = ปล่อยให้บอทอีกตัวจัดการ ไม่ตอบอะไรเลย
        // 🔴 ถอยไปทางที่ปลอดภัยเสมอ ห้ามแย่งตอบกับบอทอีกตัวในเรื่องเงิน
        if (!isSlipCheckActive(relaying)) {
          if (isSlipCheckEnabled()) {
            console.error("[slip] ตั้งค่าชนกัน: relay เปิดอยู่ จึงปิดการตรวจสลิปของเราอัตโนมัติ — ต้องล้าง LINE_RELAY_WEBHOOK_URL ก่อน");
          }
          continue;
        }

        // Thunder รับภาพได้ทางเดียวที่ยืนยันแล้วคือ "ให้ URL แล้วเขามาดึงเอง"
        // เราจึงออกลิงก์ชั่วคราวที่เซ็นไว้ ชี้ไปที่ /api/line/slip-image (อายุ 2 นาที ไม่เก็บไฟล์)
        const base = process.env.NEXT_PUBLIC_APP_URL || "";
        const t = signSlipImageToken(ev.message.id);
        if (!base || !t) {
          // ตั้งค่าไม่ครบ (ไม่มี NEXT_PUBLIC_APP_URL หรือไม่มี secret) — ห้ามเดาว่าสลิปถูกต้อง
          console.error("[slip] ตั้งค่าไม่ครบ: ต้องมี NEXT_PUBLIC_APP_URL และ SLIP_IMAGE_SECRET/LINE_CHANNEL_SECRET");
          await lineReply(ev.replyToken, [{ type: "text", text: slipFailMessage("unknown") }]);
          continue;
        }
        const r = await verifySlipByUrl(`${base}/api/line/slip-image?t=${encodeURIComponent(t)}`);

        // 🔴 ผู้ใช้ส่งรูปอะไรเข้ามาก็ได้ในแชทร้าน (รูปสินค้า · แคปหน้าจอ · รูปเล่น)
        //    ถ้าตอบทุกใบว่า "อ่านสลิปไม่ได้" บอทจะไปขวางบทสนทนาปกติ (ต้นเจอเอง 20 ส.ค. 69)
        //    → ตอบเฉพาะตอนที่ **รู้จริงว่าเป็นสลิป** เท่านั้น
        if (!r.ok && (r.reason === "not-a-slip" || r.reason === "network" || r.reason === "unknown")) {
          // อ่านไม่ออก = เดาไม่ได้ว่าเป็นสลิปหรือรูปทั่วไป → เงียบไว้ ปล่อยให้แอดมินดูเอง
          continue;
        }
        if (!r.ok && (r.reason === "quota" || r.reason === "auth")) {
          // ⚠️ ต่างจากข้างบน: 2 กรณีนี้คือ "ระบบตรวจของเราพังทั้งระบบ" ไม่ใช่เรื่องของรูป
          //    ถ้าเงียบด้วย ลูกค้าที่ส่งสลิปจริงจะไม่ได้คำตอบเลยและไม่มีใครรู้ว่าระบบล่ม
          //    (โควตามีแค่ 100 ครั้ง โอกาสเกิดจริงสูง) จึงต้องตอบให้รู้ว่าให้รอแอดมิน
          console.error(`[slip] ระบบตรวจสลิปใช้งานไม่ได้: ${r.reason}`);
        }
        await lineReply(ev.replyToken, [
          { type: "text", text: r.ok ? slipReplyText(r.data) : r.message },
        ]);
        continue;
      }

      if (ev.message?.type !== "text") continue;
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

      // 🔴 ข้อความที่ไม่ใช่ "แผนของฉัน" และไม่มีรหัส MJ- = ไม่ใช่งานของเรา → เงียบสนิท
      //
      //    เดิมตอบทักทาย "พิมพ์รหัส MJ-XXXXXX" ทุกข้อความที่ไม่รู้จัก ซึ่งเคยเหมาะตอนที่
      //    OA นี้เป็นช่องทางของเครื่องมือ แต่ตอนนี้เป็น **แชทร้านค้าจริง** ที่ลูกค้าคุยกับ
      //    แอดมินตลอดเวลา → กลายเป็นเด้งขึ้นมาขัดทุกบทสนทนา (ต้นเจอเอง 20 ส.ค. 69)
      //
      //    ⚠️ ห้ามเอากลับมาโดยไม่คิดให้ครบ: บอทตัวนี้อยู่ในแชทเดียวกับคนจริง
      //    การตอบอัตโนมัติกับข้อความที่เราไม่เข้าใจ = ไปขวางงานแอดมิน
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

  await settleRelay();
  return NextResponse.json({ ok: true });
}

// LINE verifies the webhook URL with a GET/verify — respond 200.
//
// พ่วง diagnostic ไว้ด้วย เพราะเวลาสลับ webhook จริงบน OA ที่มีบอทเช็คสลิปทำงานอยู่
// เราต้องรู้ให้ได้ใน 1 วินาทีว่า "โค้ดที่ deploy อยู่ตอนนี้ตั้งค่าไว้ยังไง" — ไม่งั้น
// ต้องไปไล่อ่าน log ของ Vercel ซึ่งบางบัญชีเข้าไม่ได้ และช้าเกินไปตอนของพัง
//
// 🔒 ตั้งใจไม่ใส่: ค่า secret ใด ๆ · URL ปลายทางแบบเต็ม (ท่อนหลัง /webhook/<uuid>
//    ทำหน้าที่เหมือนโทเคน) — โชว์แค่ชื่อโฮสต์ ซึ่งพอตรวจว่าพิมพ์โดเมนถูกไหม
export function GET() {
  const target = relayTargetUrl();
  let relay: "on" | "off" | "bad-url" = target ? "on" : "off";
  let relayHost: string | undefined;
  if (target) {
    try {
      relayHost = new URL(target).host;
    } catch {
      relay = "bad-url"; // ตั้ง env ผิดรูปแบบ = ส่งต่อไม่ได้เลยทุก event
    }
  }

  // U-slip — เปิดตรวจสลิปเองพร้อมกับ relay ไม่ได้ ต้องเห็นได้จากตรงนี้ทันที
  const slip = isSlipCheckEnabled() ? "on" : "off";
  // 🔴 ต้องใช้แหล่งความจริงเดียวกับตอนรับ event จริง (isRelayMode()) ห้ามดูจากป้าย relay
  //    เดิมเช็ค `relay === "on"` ซึ่งพลาดกรณี relay = "bad-url": ป้ายบอกว่าไม่ใช่ "on"
  //    diagnostic เลยรายงาน slipActive:true ทั้งที่ webhook จริง ๆ ปิดการตรวจสลิปอยู่
  //    (isRelayMode() ถือว่า "ตั้งค่าไว้แต่ URL ใช้ไม่ได้" = ยังอยู่ในโหมดอยู่ร่วมกับบอทอื่น)
  //    เจอบน production 20 ส.ค. 69 — diagnostic ที่โกหกอันตรายกว่าไม่มี diagnostic
  const relayOn = isRelayMode();
  const slipActive = isSlipCheckActive(relayOn);
  const conflict = slip === "on" && !slipActive;

  return NextResponse.json({
    ok: true,
    // slip = ตั้งค่าไว้ให้เปิดไหม · slipActive = ทำงานจริงไหม (ต่างกันเมื่อตั้งค่าชนกัน)
    slip,
    slipActive,
    // 🔴 ตั้งเลขบัญชีร้านไว้เทียบหรือยัง — เป็น boolean เท่านั้น **ห้ามส่งเลขบัญชีออกมา**
    //    ไม่ตั้ง = ระบบอ่านสลิปให้เฉย ๆ ไม่รู้ว่าเงินเข้าบัญชีร้านจริงไหม (อันตรายกว่าไม่ตรวจเลย)
    //    ต้องมองเห็นจาก diagnostic เพราะ 20 ส.ค. 69 เจอ 2 ครั้งที่แก้ env แล้วไม่มีผลจริง
    receiverCheck: expectedReceiverAccounts().length > 0,
    ...(relay === "bad-url"
      ? { warning: "LINE_RELAY_WEBHOOK_URL ตั้งไว้แต่ไม่ใช่ URL ที่ใช้ได้ — ตอนนี้ไม่มีอะไรถูกส่งต่อไปบอทสลิปเลย และการตรวจสลิปของเราก็ยังปิดอยู่ ต้องลบตัวแปรนี้ทิ้งให้หมด (ไม่ใช่ใส่ค่าว่าง/เว้นวรรค)" }
      : conflict
      ? { warning: "relay เปิดอยู่ จึงปิดการตรวจสลิปของเราอัตโนมัติเพื่อไม่ให้บอท 2 ตัวตอบชนกัน — ถ้าต้องการให้เราตรวจเอง ต้องลบ LINE_RELAY_WEBHOOK_URL ทิ้ง" }
      : {}),
    // ส่งต่อให้บอทอีกตัวไหม · off = เราตอบทุกข้อความ (ทับบอทสลิป!)
    relay,
    relayHost,
    // kill switch — off = เราเงียบหมด แต่ยังส่งต่อ
    bot: isBotEnabled() ? "on" : "off",
    // ตั้ง secret/token ครบไหม (ไม่เปิดเผยค่า)
    signature: !!process.env.LINE_CHANNEL_SECRET,
    canReply: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    // ตอบคำถาม "commit ที่ deploy อยู่มี relay แล้วหรือยัง" และ "นี่ env ไหน"
    env: process.env.VERCEL_ENV || "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
  });
}
