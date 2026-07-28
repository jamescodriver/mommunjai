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

// A compact Flex bubble summarizing the personalized report.
export function reportFlex(report: Report, code: string) {
  const top = report.pillars.filter((p) => p.score !== null).slice(0, 3);
  return {
    type: "flex",
    altText: `รายงานความพร้อมมีลูกของ ${report.nickname} — คะแนน ${report.score}/100`,
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          { type: "text", text: "รายงานความพร้อมมีลูกเฉพาะคุณ", weight: "bold", size: "md", color: "#C85A8A", wrap: true },
          { type: "text", text: `สวัสดีค่ะคุณ ${report.nickname} 💛`, size: "sm", color: "#555555", wrap: true },
          { type: "box", layout: "baseline", margin: "md", contents: [
            { type: "text", text: `${report.score}`, size: "3xl", weight: "bold", color: "#5FB3B3", flex: 0 },
            { type: "text", text: `/100  ${report.scoreLabel}`, size: "sm", color: "#777777", gravity: "bottom", margin: "sm", wrap: true },
          ] },
          ...top.map((p) => ({
            type: "box", layout: "horizontal", contents: [
              { type: "text", text: p.label, size: "sm", color: "#555555", flex: 3 },
              { type: "text", text: `${p.score}%`, size: "sm", align: "end", color: "#3E8E8E", flex: 1 },
            ],
          })),
          { type: "separator", margin: "md" },
          { type: "text", text: "แผนบำรุง 90 วัน + วิตามินที่แนะนำ ดูฉบับเต็มได้เลย 👇", size: "xs", color: "#999999", wrap: true, margin: "md" },
        ],
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          APP_URL ? {
            type: "button", style: "primary", color: "#C85A8A", height: "sm",
            action: { type: "uri", label: "ดูรายงานฉบับเต็ม", uri: `${APP_URL}/r/${code}` },
          } : { type: "text", text: `รหัสของคุณ: ${code}`, size: "sm", align: "center" },
          { type: "text", text: "ทีม Baby & Mom พร้อมช่วยวางแผนต่อค่ะ", size: "xs", color: "#aaaaaa", align: "center" },
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
      type: "button", style: "primary", color: "#C85A8A", height: "sm",
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
      type: "button", style: "primary", color: "#C85A8A", height: "sm",
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
          { type: "text", text: greeting, weight: "bold", size: "md", color: "#C85A8A", wrap: true },
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
