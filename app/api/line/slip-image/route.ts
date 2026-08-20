import { NextRequest } from "next/server";
import { verifySlipImageToken } from "@/lib/slip";
import { lineGetMessageContent } from "@/lib/line";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ส่งต่อภาพที่ผู้ใช้ส่งเข้ามาใน LINE ให้ Thunder มาดึงไปตรวจสลิป
 *
 * ทำไมต้องมีหน้านี้: Thunder รับภาพได้ทางเดียวที่ยืนยันแล้วคือ "ให้ URL แล้วเขาไปดึงเอง"
 * แต่ภาพใน LINE ต้องมี access token ถึงจะโหลดได้ Thunder จึงดึงตรงไม่ได้
 * (รายละเอียดผลทดสอบ API จริงอยู่หัวไฟล์ lib/slip.ts)
 *
 * ── 🔒 ความปลอดภัย/ความเป็นส่วนตัว ────────────────────────────────────────
 * ภาพสลิปมีชื่อผู้โอน/ผู้รับและเลขบัญชีบางส่วน = ข้อมูลส่วนบุคคล จึงต้อง:
 *   • เดา URL ไม่ได้ — ต้องมีโทเคนที่เซ็น HMAC ด้วย secret ฝั่ง server
 *   • อายุสั้นมาก (2 นาที) พอให้ Thunder ดึงทันเท่านั้น
 *   • **ไม่เก็บไฟล์ไว้ที่ไหนเลย** — อ่านจาก LINE แล้วส่งต่อทันที ไม่เขียนลงดิสก์/ฐานข้อมูล
 *   • ห้าม cache — ตั้ง no-store และห้าม index
 *   • โทเคนผิด/หมดอายุ = 404 เปล่า ๆ ไม่บอกสาเหตุ (ไม่ให้ใช้ไล่เดา)
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") || "";
  const messageId = verifySlipImageToken(token);
  if (!messageId) return new Response("not found", { status: 404 });

  const img = await lineGetMessageContent(messageId);
  if (!img) return new Response("not found", { status: 404 });

  return new Response(Buffer.from(img.base64, "base64"), {
    status: 200,
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
