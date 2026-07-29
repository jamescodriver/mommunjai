// Client-side progressive profile. Stays on the user's own device; nothing reaches the server
// until they consent (M7).
//
// localStorage, not sessionStorage: the report links out to the assessment tools in a new tab,
// and sessionStorage is per-tab — the new tab's writes never reach the tab holding the report,
// so the score could never update. localStorage also means someone returning tomorrow still has
// their tool results. Same device, same user, still client-only.
"use client";
import type { ArtPlan } from "./calc/vitamins";

export interface Profile {
  stage?: "prep" | "infertility" | "pregnant" | "lactating" | "male";
  weightKg?: number;
  ageRange?: string;
  hasPcos?: boolean;
  artPlan?: ArtPlan;
  interests?: string[];
  tools?: Record<string, { input: unknown; output: unknown }>;
  /** R7 — has this device answered the consent prompt at least once, and what did they say. */
  consent?: boolean;
  consentAsked?: boolean;
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
    const next = { ...readProfile(), consent: true, consentAsked: true };
    localStorage.setItem(KEY, JSON.stringify(next));
  } else {
    localStorage.setItem(KEY, JSON.stringify({ consent: false, consentAsked: true } as Profile));
  }
}

export function toolCount(): number {
  return Object.keys(readProfile().tools || {}).length;
}
