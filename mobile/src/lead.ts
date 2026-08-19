// ส่งข้อมูลผู้ใช้ขึ้น server เพื่อ "ออก ticket + เก็บ lead" — จุดเดียวในแอปที่ข้อมูลออกจากเครื่อง
//
// ── ทำไมไฟล์นี้ห้าม import อะไรจาก react-native ─────────────────────────────
// เพื่อให้เทสต์ด้วย vitest ที่ repo root ได้ตรง ๆ (ดู mobile/src/lead.test.ts)
// ตรรกะการประกอบ payload คือจุดที่พังเงียบที่สุด (ส่งฟิลด์ผิดชื่อ = ข้อมูลหายโดยไม่มี error)
// จึงต้องมีเทสต์คุม — ถ้าไฟล์นี้แตะ react-native เมื่อไหร่ เทสต์จะรันไม่ได้ทันที
//
// ── 🔴 กฎความปลอดภัย/กฎหมายที่ห้ามผิด ────────────────────────────────────────
// 1. PDPA ม.26 — ข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว **ห้ามส่งก่อนได้ consent ชัดแจ้ง**
//    ใช้ CONSENT_TEXT ชุดเดียวกับเว็บ (@shared/disclaimer) ห้ามเขียนข้อความเองใหม่
//    เพราะ consent_log เก็บ policy_version ไว้ตรวจย้อนว่าใครยินยอมภายใต้ข้อความชุดไหน
// 2. **แผนฉบับเต็มห้ามคำนวณในเครื่องแล้วเอามาโชว์** ถึงจะทำได้ก็ตาม (@shared/report
//    เรียกได้จริงจาก alias) — ต้นเคาะ 1 ส.ค. 2569 ว่าแผนเต็มต้องผ่าน LINE OA เท่านั้น
//    และตัวกั้นอยู่ที่ /api/lead ที่คืนมาแค่ teaser · แอปต้องเคารพกติกาเดียวกับเว็บ
//    ไม่งั้นเราจะเปิดประตูหลังให้ funnel ของแบรนด์พังโดยที่เว็บยังปิดอยู่
import { CONSENT_TEXT } from "@shared/disclaimer";
import { calcOvulation } from "@shared/calc/ovulation";
import type { TeaserSummary } from "@shared/report";
import { API_BASE_URL } from "./config";
import type { Profile } from "./store";

export type ContactChannel = "line" | "phone" | "other";

export interface LeadContact {
  nickname: string;
  channel: ContactChannel;
  value: string;
}

export interface LeadResult {
  ticketCode: string;
  teaser?: TeaserSummary;
  tier?: string;
  /** true เมื่อ server ยังไม่ได้ต่อ Supabase (โหมด dev) — ยังไม่ได้บันทึกจริง */
  devMode?: boolean;
}

/** ตรวจก่อนยิง — คืนข้อความไทยที่เอาไปโชว์ได้เลย หรือ null ถ้าผ่าน */
export function validateContact(c: Partial<LeadContact>, consent: boolean): string | null {
  if (!consent) return "กรุณายินยอมก่อนบันทึกข้อมูล";
  if (!c.nickname || !c.nickname.trim()) return "ขอชื่อเล่นสักนิดนะคะ";
  // server ต้องการอย่างน้อย 3 ตัวอักษร — เช็คฝั่งแอปด้วยจะได้ไม่เสียเที่ยวเน็ต
  if (!c.value || c.value.trim().length < 3) return "กรุณาระบุช่องทางติดต่อ (อย่างน้อย 3 ตัวอักษร)";
  return null;
}

/**
 * ผลเครื่องมือที่ "สืบย้อนจากโปรไฟล์ได้" ตอนกดส่ง
 *
 * ⚠️ ตอนนี้มีแค่ ovulation ตัวเดียว เพราะเป็นเครื่องมือเดียวที่ input ของมัน
 *    (วันแรกของประจำเดือน + ความยาวรอบ) ถูกเก็บไว้ในโปรไฟล์จริง ๆ
 *    เครื่องมือที่ผู้ใช้ตอบสด ๆ แล้วไม่ได้เก็บผล (เช็กสารอาหาร · ความเครียด · ออกกำลังกาย)
 *    ยัง **ไม่ถูกส่งไปด้วย** — ถ้าจะให้ครบต้องเก็บผลลงเครื่องก่อน เป็นงานคนละก้อน
 *    ไม่ปลอมข้อมูลขึ้นมาเติมเด็ดขาด (กฎ "ยังไม่ประเมิน ≠ 0")
 *
 * รูป input/output ล้อกับที่เว็บบันทึกไว้เป๊ะ (app/tools/ovulation/page.tsx)
 * เพื่อให้แอดมินเห็นข้อมูลหน้าตาเดียวกันไม่ว่ามาจากเว็บหรือแอป
 */
export function buildToolResults(p: Profile): Record<string, { input: unknown; output: unknown }> {
  const tools: Record<string, { input: unknown; output: unknown }> = {};
  if (p.lastPeriodStart) {
    const cycle = p.cycleLength ?? 28;
    const r = calcOvulation({ lastPeriodStart: p.lastPeriodStart, cycleLength: cycle });
    if (!("error" in r)) tools.ovulation = { input: { last: p.lastPeriodStart, cycle }, output: r };
  }
  return tools;
}

/**
 * ประกอบ body ให้ตรงกับที่ POST /api/lead รอรับ
 *
 * 🔒 ชื่อฟิลด์ฝั่ง server เป็น snake_case (age_range, sleep_bedtime, …) ส่วนใน Profile
 *    ของแอปเป็น camelCase — แปลงตรงนี้ที่เดียว ห้ามส่ง camelCase ดิบไป
 *    ฟิลด์ที่สะกดไม่ตรงจะถูก sanitize เป็น null **เงียบ ๆ ไม่มี error** ข้อมูลจะหายโดยไม่มีใครรู้
 *    (route.ts ตั้งใจไม่ throw เพราะไม่อยากให้ฟอร์มยาวตกทั้งใบเพราะฟิลด์เสริมพัง)
 */
export function buildLeadPayload(p: Profile, c: LeadContact) {
  return {
    consent: true,
    consent_text: CONSENT_TEXT,
    nickname: c.nickname.trim(),
    contact_channel: c.channel,
    contact_value: c.value.trim(),
    stage: p.stage,
    age_range: p.ageRange,
    weight_kg: p.weightKg,
    height_cm: p.heightCm,
    sleep_bedtime: p.sleepBedtime,
    sleep_waketime: p.sleepWaketime,
    gestational_weeks: p.gestationalWeeks,
    tools: buildToolResults(p),
    // จากไหน — แอดมินต้องแยกออกว่า lead มาจากแอปหรือเว็บ (คุณภาพ/พฤติกรรมต่างกัน)
    interests: ["mobile-app"],
  };
}

/** ยิงจริง — โยน Error ที่มีข้อความภาษาไทยพร้อมโชว์ */
export async function submitLead(p: Profile, c: LeadContact): Promise<LeadResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildLeadPayload(p, c)),
    });
  } catch {
    // แยกให้ชัดจาก error ฝั่ง server — ผู้ใช้จะได้รู้ว่าควรเช็คเน็ตตัวเอง
    throw new Error("เชื่อมต่อไม่ได้ ลองเช็คอินเทอร์เน็ตแล้วกดใหม่อีกครั้งนะคะ");
  }

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* ปล่อยว่าง แล้วไปตกที่ข้อความ error ด้านล่าง */
  }

  if (!res.ok) throw new Error(data?.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่");
  if (!data?.ticket_code) throw new Error("บันทึกไม่สำเร็จ กรุณาลองใหม่");

  return {
    ticketCode: data.ticket_code,
    teaser: data.teaser,
    tier: data.tier,
    devMode: !!data.dev_mode,
  };
}
