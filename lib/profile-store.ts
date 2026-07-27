// Client-side progressive profile. Stays on the user's own device; nothing reaches the server
// until they consent (M7).
//
// localStorage, not sessionStorage: the report links out to the assessment tools in a new tab,
// and sessionStorage is per-tab — the new tab's writes never reach the tab holding the report,
// so the score could never update. localStorage also means someone returning tomorrow still has
// their tool results. Same device, same user, still client-only.
"use client";

export interface Profile {
  stage?: "prep" | "infertility" | "pregnant" | "lactating" | "male";
  weightKg?: number;
  ageRange?: string;
  hasPcos?: boolean;
  artPlan?: "none" | "iui" | "ivf" | "icsi";
  interests?: string[];
  tools?: Record<string, { input: unknown; output: unknown }>;
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

export function mergeProfile(patch: Partial<Profile>): Profile {
  const cur = readProfile();
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

export function toolCount(): number {
  return Object.keys(readProfile().tools || {}).length;
}
