// ส่งต่อ (relay) LINE webhook event ไปให้บอทอีกตัวที่ใช้ LINE OA เดียวกัน
//
// ── ทำไมต้องมี ─────────────────────────────────────────────────────────────
// LINE OA ตั้ง "Webhook URL" ได้แค่ช่องเดียวเท่านั้น แต่ OA ของ Baby & Mom
// มีบอทเช็คสลิปของ Thunder (line.thunder.in.th) ใช้ช่องนั้นอยู่ก่อนแล้ว
// และ Thunder ไม่มีฟีเจอร์ส่งต่อ webhook ให้ระบบภายนอก (ยืนยันจาก API doc 12/8/2569)
// เราจึงต้องรับ event เป็นตัวแรก แล้ว "ส่งต่อทุก event" ให้ Thunder เอง
//
// ── 🔴 กฎเหล็ก 3 ข้อ (ผิดข้อไหนก็ทำระบบเก็บเงินของลูกค้าพัง) ──────────────
// 1. ส่ง body ดิบตัวเดิม "เป๊ะทุกไบต์" + header x-line-signature เดิม
//    ห้าม JSON.parse แล้ว stringify ใหม่เด็ดขาด — ลายเซ็นคำนวณจาก body ดิบ
//    ขยับแม้แต่ช่องว่างเดียว Thunder จะตีตกทุก event
// 2. Thunder ต้องได้ของเสมอ ถึงงานฝั่งเราจะพัง — ฟังก์ชันนี้จึงไม่โยน exception
//    ออกไปเลย คืนเป็น result object ให้ผู้เรียกตัดสินใจแทน
// 3. ห้ามบล็อกนานเกินไป — LINE คาดหวังให้ webhook ตอบเร็ว จึงมี timeout + retry
//    แค่ครั้งเดียว ไม่ retry ยาว
//
// ── Kill switch ──────────────────────────────────────────────────────────
// LINE_BOT_ENABLED=0 → หยุดงาน "ฝั่ง Mommunjai" ทั้งหมด แต่ยัง "ส่งต่อ Thunder ตามปกติ"
// ใช้ตอนฉุกเฉิน: บอทเราตอบมั่ว/ตอบชนบอทสลิป ปิดได้โดยไม่ต้องแตะ LINE Console
// ⚠️ ต้อง Redeploy ใน Vercel หลังแก้ค่า (~1 นาที) — env var ไม่ได้อ่านสดทุกครั้ง

/** header ที่ต้องส่งต่อ — x-line-signature คือหัวใจ ที่เหลือช่วยให้ปลายทางเห็นเหมือนของจริง */
const FORWARD_HEADERS = ["x-line-signature", "content-type", "user-agent"] as const;

const TIMEOUT_MS = 5000;

/** ปลายทางที่จะส่งต่อ — ไม่ตั้ง = ไม่มีบอทตัวอื่น (โหมดเดิม/dev) */
export function relayTargetUrl(): string | undefined {
  const url = process.env.LINE_RELAY_WEBHOOK_URL?.trim();
  return url ? url : undefined;
}

/**
 * อยู่ในโหมด "อยู่ร่วมกับบอทตัวอื่น" หรือไม่
 *
 * 🔴 สำคัญกว่าที่คิด: โหมดนี้เปลี่ยนพฤติกรรมการ "ตอบ" ของเราด้วย
 *    replyToken ของ LINE ใช้ได้ครั้งเดียว ถ้าเราตอบข้อความที่ไม่ใช่ของเรา
 *    บอทสลิปจะตอบไม่ได้ → คนโอนเงินจะได้ข้อความ "พิมพ์รหัส MJ-XXXXXX"
 *    แทนผลตรวจสลิป ในโหมดนี้เราจึงต้องเงียบกับทุกอย่างที่ไม่ใช่ของเราจริง ๆ
 */
export function isRelayMode(): boolean {
  return !!relayTargetUrl();
}

/** kill switch — ปิดเฉพาะงานฝั่งเรา การส่งต่อยังทำงานปกติ */
export function isBotEnabled(): boolean {
  const v = process.env.LINE_BOT_ENABLED?.trim().toLowerCase();
  if (v === undefined || v === "") return true; // ไม่ตั้ง = เปิด (ค่าเริ่มต้นเดิม)
  return !["0", "false", "off", "no"].includes(v);
}

export type RelayResult =
  | { relayed: true; status: number; attempts: number }
  | { relayed: false; reason: string; attempts: number };

/**
 * ส่ง body ดิบ + header เดิมต่อไปให้บอทอีกตัว
 * @param raw   body ดิบจาก `await req.text()` — ห้ามแปลงร่างมาก่อน
 * @param headers header ของ request เดิม (NextRequest.headers)
 */
export async function relayToPartner(raw: string, headers: Headers): Promise<RelayResult> {
  const url = relayTargetUrl();
  if (!url) return { relayed: false, reason: "no-target", attempts: 0 };

  const out = new Headers();
  for (const h of FORWARD_HEADERS) {
    const v = headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has("content-type")) out.set("content-type", "application/json");

  let lastReason = "unknown";
  // ยิงได้มากสุด 2 ครั้ง: LINE จะไม่ส่งซ้ำให้ถ้าเราตอบ 200 ไปแล้ว
  // ถ้าพลาดตรงนี้ = event หายจากบอทสลิปถาวร จึงขอ retry สั้น ๆ อีกครั้ง
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: out,
        body: raw,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return { relayed: true, status: res.status, attempts: attempt };
      lastReason = `http-${res.status}`;
      // 4xx = ปลายทางปฏิเสธของชิ้นนี้ (เช่นลายเซ็นไม่ผ่าน) ยิงซ้ำก็ได้ผลเดิม
      if (res.status < 500) return { relayed: false, reason: lastReason, attempts: attempt };
    } catch (e: any) {
      lastReason = e?.name === "TimeoutError" ? "timeout" : `error:${e?.name || "unknown"}`;
    }
  }
  return { relayed: false, reason: lastReason, attempts: 2 };
}
