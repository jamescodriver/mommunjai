// LINE Messaging API helpers (server-only): signature verify, Flex builder, reply/push.
import crypto from "node:crypto";
import type { Report } from "./report";

export function verifyLineSignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha256", secret).update(body).digest("base64");
  try {
    return hash.length === signature.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Extract a ticket code (MJ-XXXXXX) from free text.
export function extractTicketCode(text: string): string | null {
  const m = /MJ-[2-9A-HJ-NP-Z]{6}/i.exec(text || "");
  return m ? m[0].toUpperCase() : null;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

// CI จริงของ Baby & Mom (docs/BRAND.md §สี) — primary = เขียว ไม่ใช่ชมพู
// เดิมการ์ดนี้ใช้ #C85A8A/#5FB3B3 ซึ่งไม่ใช่สีแบรนด์เลยสักตัว
const BM_GREEN = "#1BC0BA";
const BM_GREEN_DEEP = "#159C97";
const BM_INK = "#3D3D4D";
const BM_MUTED = "#6E6E7C"; // เข้มพอให้อ่านออกบนพื้นขาวของ LINE ทั้งธีมสว่าง/มืด

const thDate = (iso: string) => {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
};

/** แถวตัวเลข 1 บรรทัด: ป้ายซ้าย · ค่าขวา */
const metricRow = (label: string, value: string) => ({
  type: "box",
  layout: "horizontal",
  contents: [
    { type: "text", text: label, size: "sm", color: BM_MUTED, flex: 4 },
    { type: "text", text: value, size: "sm", weight: "bold", color: BM_GREEN_DEEP, align: "end", flex: 6, wrap: true },
  ],
});

/**
 * การ์ด Flex สรุปแผนเฉพาะคุณ ที่ตอบกลับใน LINE OA หลังผู้ใช้พิมพ์รหัส ticket
 *
 * ⛔️ ไม่แสดง "คะแนน x/100" กับเปอร์เซ็นต์ 5 เสาอีกแล้ว (ต้นเคาะ 1/8/2026)
 *    เพราะรายงานฉบับเต็มเลิกใช้ระบบคะแนนไปตั้งแต่ R15 — การ์ดจึงโชว์ตัวเลขที่ไม่มีอยู่
 *    ในรายงานที่กดเข้าไปดู กลายเป็นสัญญาสิ่งที่ไม่มี และ "คะแนนความพร้อมมีลูก" ยัง
 *    สุ่มเสี่ยงถูกอ่านเป็นคำพยากรณ์โอกาสตั้งครรภ์ ซึ่งเราไม่เคยมีหลักฐานรองรับ
 *
 * ✅ แทนด้วย **เป้าหมายต่อวันที่คำนวณจากตัวเขาเอง** — พิสูจน์ว่าแผนถูกทำให้เฉพาะบุคคลจริง
 *    (หน้าที่เดิมของคะแนน) โดยไม่ตัดสินร่างกายใคร และเอาไปทำตามได้ทันทีตั้งแต่ในแชท
 *
 * 🔒 กฎที่ต้องรักษาไว้:
 *  - "ยังไม่ประเมิน ≠ 0" — แถวไหนไม่มีข้อมูล (เช่นไม่ได้กรอกน้ำหนัก) ให้ **หายไป**
 *    ห้ามเดาค่า และห้ามแสดงเป็น 0
 *  - รายงานที่ snapshot ไว้ก่อน R3 ไม่มี part1/part2 → ทุก field ต้อง optional chain
 *    การ์ดจะเหลือแค่หัว-ท้าย แต่ต้องไม่พังและยังกดเปิดรายงานได้
 *  - ต้องมี disclaimer เสมอ (legal-compliance §1) — แชทก็เป็นผลลัพธ์สุขภาพเหมือนกัน
 *  - ห้ามใส่ชื่อ/ราคาสินค้าลงการ์ด — บอกได้แค่ "มีกี่รายการ" ให้ไปดูในรายงานที่มี
 *    คำเตือน Safety Matrix กำกับครบ (การ์ดในแชทไม่มีที่พอใส่คำเตือน = ขายลอย ๆ)
 */
export function reportFlex(report: Report, code: string) {
  const p1 = report.part1;
  const p2 = report.part2;

  const metrics: any[] = [];
  const protein = p2?.protein ?? report.protein;
  if (protein) metrics.push(metricRow("โปรตีน", `${protein.min}–${protein.max} ก./วัน`));
  const water = p1?.water ?? p2?.waterMl;
  if (water) metrics.push(metricRow("น้ำดื่ม", `${water.minMl.toLocaleString()}–${water.maxMl.toLocaleString()} มล./วัน`));
  if (p1?.sleep) metrics.push(metricRow("นอน", `${p1.sleep.recommendedMinHours}–${p1.sleep.recommendedMaxHours} ชม./คืน`));
  if (p1?.exercise?.weeklyTarget) {
    // เป้าออกกำลังกายฉบับเต็มยาวได้ถึง ~100 ตัวอักษร ("150–300 นาที/สัปดาห์ กิจกรรม
    // ระดับปานกลาง หรือ 75–150 นาที/สัปดาห์ กิจกรรมระดับหนัก (ผสมกันได้)") ซึ่งกินการ์ด
    // ไปครึ่งใบ — ในแชทเอาแค่ทางเลือกแรก ส่วนเงื่อนไขเต็มอยู่ในรายงานที่กดเข้าไปดู
    const short = p1.exercise.weeklyTarget.split(" หรือ ")[0];
    metrics.push(metricRow("ออกกำลังกาย", short));
  }

  const highlights: any[] = [];
  if (report.fertileWindow) {
    highlights.push({
      type: "text",
      text: `🗓️ ช่วงมีโอกาสสูงรอบถัดไป ${thDate(report.fertileWindow.start)}–${thDate(report.fertileWindow.end)}${report.isMale ? " (ของคู่คุณ)" : ""}`,
      size: "sm", color: BM_INK, wrap: true,
    });
  }
  if (report.vitamins.length) {
    highlights.push({
      type: "text",
      text: `💊 วิตามินที่เลือกให้คุณ ${report.vitamins.length} รายการ พร้อมวิธีทานและข้อควรระวัง`,
      size: "sm", color: BM_INK, wrap: true,
    });
  }

  const body: any[] = [
    { type: "text", text: `สวัสดีค่ะคุณ ${report.nickname} 💛`, size: "sm", color: BM_MUTED, wrap: true },
  ];
  if (metrics.length) {
    body.push({
      type: "box", layout: "vertical", spacing: "sm", margin: "md",
      contents: [
        { type: "text", text: "เป้าหมายที่คำนวณจากข้อมูลของคุณ", size: "xs", weight: "bold", color: BM_MUTED },
        ...metrics,
      ],
    });
  }
  if (highlights.length) {
    body.push({ type: "separator", margin: "lg" });
    body.push({ type: "box", layout: "vertical", spacing: "sm", margin: "lg", contents: highlights });
  }
  if (report.quickWinToday) {
    // quickWinToday ขึ้นต้นด้วย "วันนี้:" มาแล้วจาก generateReport — อย่าเติมคำนำหน้าซ้ำ
    // (เคยได้ "💡 เริ่มวันนี้: วันนี้: กินไข่ต้ม 2 ฟอง…")
    body.push({ type: "separator", margin: "lg" });
    body.push({ type: "text", text: `💡 ${report.quickWinToday}`, size: "sm", color: BM_INK, wrap: true, margin: "lg" });
  }

  return {
    type: "flex",
    // altText = ข้อความที่โผล่ในรายการแชทและการแจ้งเตือน (บางเครื่องเห็นแค่บรรทัดนี้)
    // จึงต้องสื่อว่า "แผนของคุณมาแล้ว" ไม่ใช่ตัวเลขคะแนนแบบเดิม
    altText: `แผนเฉพาะคุณของคุณ ${report.nickname} พร้อมแล้ว — รหัส ${code}`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical", backgroundColor: BM_GREEN, paddingAll: "lg", spacing: "xs",
        contents: [
          { type: "text", text: "แผนเฉพาะคุณ · Baby & Mom", size: "xs", color: "#EAFBFA" },
          { type: "text", text: report.title, size: "lg", weight: "bold", color: "#FFFFFF", wrap: true },
        ],
      },
      body: { type: "box", layout: "vertical", spacing: "none", contents: body },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          APP_URL
            ? {
                type: "button", style: "primary", color: BM_GREEN, height: "sm",
                action: { type: "uri", label: "เปิดแผนฉบับเต็ม", uri: `${APP_URL}/r/${code}` },
              }
            : { type: "text", text: `รหัสของคุณ: ${code}`, size: "sm", align: "center", weight: "bold", color: BM_GREEN_DEEP },
          { type: "text", text: `รหัสของคุณ ${code} · ทักถามทีม Baby & Mom ต่อได้เลย ไม่ต้องเล่าซ้ำค่ะ`, size: "xs", color: BM_MUTED, align: "center", wrap: true },
          // 🔒 ห้ามลบ — ทุกผลลัพธ์สุขภาพต้องมี disclaimer ทุกเส้นทางการแสดงผล
          { type: "text", text: "ข้อมูลเพื่อการดูแลสุขภาพเบื้องต้น ไม่แทนคำวินิจฉัยของแพทย์", size: "xxs", color: "#9A9AA6", align: "center", wrap: true },
        ],
      },
    },
  };
}

// PDF-05/06 — reply to the Rich Menu's fixed "แผนของฉัน" trigger. If we know
// this LINE user (found a customer + a lead), offer their latest report plus
// a resume link to redo/change their info; otherwise just point them to /plan.
export function menuFlex(opts: { nickname?: string; reportCode?: string; resumeUrl?: string; freshPlanUrl?: string }) {
  const buttons: any[] = [];
  if (opts.reportCode && APP_URL) {
    buttons.push({
      type: "button", style: "primary", color: BM_GREEN, height: "sm",
      action: { type: "uri", label: "ดูแผนล่าสุด", uri: `${APP_URL}/r/${opts.reportCode}` },
    });
  }
  if (opts.resumeUrl) {
    buttons.push({
      type: "button", style: "secondary", height: "sm",
      action: { type: "uri", label: "เปลี่ยนข้อมูล / ทำแบบสอบถามใหม่", uri: opts.resumeUrl },
    });
  }
  if (!buttons.length && opts.freshPlanUrl) {
    buttons.push({
      type: "button", style: "primary", color: BM_GREEN, height: "sm",
      action: { type: "uri", label: "เริ่มทำแบบสอบถาม", uri: opts.freshPlanUrl },
    });
  }
  const greeting = opts.nickname ? `สวัสดีค่ะคุณ ${opts.nickname} 💛` : "สวัสดีค่ะ 💛";
  return {
    type: "flex",
    altText: "เมนูของคุณ — Baby & Mom",
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          { type: "text", text: greeting, weight: "bold", size: "md", color: BM_GREEN_DEEP, wrap: true },
          { type: "text", text: buttons.length > 1 ? "ดูแผนเดิม หรือทำแบบสอบถามใหม่ได้เลยค่ะ" : "เริ่มทำแบบสอบถามเพื่อรับแผนเฉพาะคุณได้เลยค่ะ", size: "sm", color: "#777777", wrap: true, margin: "sm" },
        ],
      },
      footer: { type: "box", layout: "vertical", spacing: "sm", contents: buttons },
    },
  };
}

export async function lineReply(replyToken: string, messages: any[]): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages }),
  });
  return res.ok;
}

export async function linePush(to: string, messages: any[]): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages }),
  });
  return res.ok;
}
