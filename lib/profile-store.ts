// Client-side progressive profile. Stays on the user's own device; nothing reaches the server
// until they consent (M7).
//
// localStorage, not sessionStorage: the report links out to the assessment tools in a new tab,
// and sessionStorage is per-tab — the new tab's writes never reach the tab holding the report,
// so the score could never update. localStorage also means someone returning tomorrow still has
// their tool results. Same device, same user, still client-only.
"use client";
import type { ArtPlan, InfertilityIssue } from "./calc/vitamins";
import { CONSENT_POLICY_VERSION } from "./disclaimer";

export interface Profile {
  stage?: "prep" | "infertility" | "pregnant" | "lactating" | "male";
  weightKg?: number;
  ageRange?: string;
  hasPcos?: boolean;
  artPlan?: ArtPlan;
  /** R2 — only meaningful when stage === "infertility"; the issue-picker never appears for other stages. */
  infertilityIssues?: InfertilityIssue[];
  interests?: string[];
  tools?: Record<string, { input: unknown; output: unknown }>;
  /** R7 — has this device answered the consent prompt at least once, and what did they say. */
  consent?: boolean;
  consentAsked?: boolean;
  /** R3 (2026-07-31) — เวอร์ชันข้อความ consent ที่ผู้ใช้เห็นตอนกดยินยอม
   *  🔒 จำเป็นเพราะข้อความถูกขยายให้ครอบคลุมพฤติกรรมสูบบุหรี่/ดื่ม/ความเครียด + ข้อมูลของคู่
   *  ถ้าไม่เก็บเวอร์ชัน คนที่ยินยอมข้อความเก่าจะถูกบันทึกลง consent_log ว่ายินยอมข้อความใหม่
   *  ที่เขาไม่เคยเห็น = บันทึกความยินยอมเป็นเท็จ (PDPA ม.26) — Lucifer red-team 31/7 */
  consentVersion?: string;
}

const KEY = "mmj_profile";

export function readProfile(): Profile {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

// R7 — once someone has explicitly declined, every *other* write here is a
// no-op: "declining still lets you use the calculator, but nothing about you
// gets remembered on this device" (docs/legal-compliance.md client-only-first).
// The consent choice itself always writes via setConsentChoice(), which
// bypasses this function entirely, so declining is never self-defeating.
export function mergeProfile(patch: Partial<Profile>): Profile {
  const cur = readProfile();
  if (cur.consentAsked && !cur.consent) return cur;
  const next = { ...cur, ...patch };
  if (typeof window !== "undefined")
    localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function recordTool(tool: string, input: unknown, output: unknown) {
  const cur = readProfile();
  const tools = { ...(cur.tools || {}), [tool]: { input, output } };
  mergeProfile({ tools });
}

// R7 — records the user's consent choice. Accepting behaves like a normal
// merge; declining wipes anything already cached (stage/weight/tool results)
// so the device goes back to genuinely anonymous, keeping only the fact that
// they were asked (so we don't nag them again on every page).
export function setConsentChoice(granted: boolean) {
  if (typeof window === "undefined") return;
  if (granted) {
    const next = { ...readProfile(), consent: true, consentAsked: true, consentVersion: CONSENT_POLICY_VERSION };
    localStorage.setItem(KEY, JSON.stringify(next));
  } else {
    localStorage.setItem(KEY, JSON.stringify({ consent: false, consentAsked: true, consentVersion: CONSENT_POLICY_VERSION } as Profile));
  }
}

export function toolCount(): number {
  return Object.keys(readProfile().tools || {}).length;
}

/** R3 — ต้องถามความยินยอมใหม่ไหม
 *  true เมื่อ (ก) ยังไม่เคยถาม หรือ (ข) เคยยินยอมภายใต้ข้อความเวอร์ชันเก่ากว่าปัจจุบัน
 *  ⚠️ คนที่เคย "ปฏิเสธ" ไม่ต้องถามซ้ำทุกครั้งที่ขึ้นเวอร์ชัน — เคารพการปฏิเสธเดิม */
export function needsConsentAgain(p: Profile = readProfile()): boolean {
  if (!p.consentAsked) return true;
  if (!p.consent) return false;
  return p.consentVersion !== CONSENT_POLICY_VERSION;
}
