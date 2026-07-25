// Client-side progressive profile (sessionStorage). No PII persisted server-side until consent (M7).
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
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function mergeProfile(patch: Partial<Profile>): Profile {
  const cur = readProfile();
  const next = { ...cur, ...patch };
  if (typeof window !== "undefined")
    sessionStorage.setItem(KEY, JSON.stringify(next));
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
