import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { autoTags } from "@/lib/tagging";
import { genTicketCode, rateLimit } from "@/lib/ticket";
import { CONSENT_POLICY_VERSION } from "@/lib/disclaimer";
import { generateReport, reportTier, buildTeaser } from "@/lib/report";
import { verifyResumeToken } from "@/lib/customer";
import { PERSISTED_TOOLS } from "@/lib/persisted-tools";
import {
  mapLegacyArtPlan, INFERTILITY_ISSUE_VALUES, MALE_BEHAVIOR_VALUES,
  EXERCISE_FREQ_VALUES, PCOS_STATUS_VALUES, CONCEPTION_METHODS,
  type MaleBehavior, type PcosStatus, type ExerciseFreq,
} from "@/lib/calc/vitamins";

function sanitizeIssues(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => (INFERTILITY_ISSUE_VALUES as string[]).includes(x)).slice(0, INFERTILITY_ISSUE_VALUES.length);
}

// ── R3 (PRD-UPDATE-R3-3107) sanitizers ────────────────────────────────────
// ทุกค่าที่เข้ามาจาก client ถือว่าไม่น่าเชื่อถือ — ค่าที่ไม่ตรง whitelist ให้กลายเป็น
// null/[] เงียบ ๆ ไม่ throw (ฟอร์มยาว ผู้ใช้ไม่ควรตกทั้งใบเพราะฟิลด์เสริมพัง)
function sanitizeBehaviors(v: any): MaleBehavior[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.filter((x) => (MALE_BEHAVIOR_VALUES as string[]).includes(x)))) as MaleBehavior[];
}
/** "HH:MM" 24 ชม. เท่านั้น */
function sanitizeTime(v: any): string | null {
  return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null;
}
function sanitizeNum(v: any, min: number, max: number): number | null {
  const n = v === "" || v === null || v === undefined ? NaN : Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function sanitizeEnum<T extends string>(v: any, allowed: readonly string[]): T | null {
  return typeof v === "string" && allowed.includes(v) ? (v as T) : null;
}
/** R7 — ข้อมูลของ "คู่" เก็บเป็นก้อน jsonb แยก ห้ามปนกับน้ำหนัก/ส่วนสูงของผู้กรอกเอง */
function sanitizePartnerProfile(v: any): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return {
    weight_kg: sanitizeNum(v.weight_kg ?? v.weightKg, 20, 300),
    height_cm: sanitizeNum(v.height_cm ?? v.heightCm, 80, 250),
    sleep_bedtime: sanitizeTime(v.sleep_bedtime),
    sleep_waketime: sanitizeTime(v.sleep_waketime),
    exercise_freq: sanitizeEnum(v.exercise_freq, EXERCISE_FREQ_VALUES),
    behaviors: sanitizeBehaviors(v.behaviors),
  };
}
/** R4 — has_pcos (boolean เดิม) ต้องถูกเขียนคู่กับ pcos_status เสมอ เพื่อให้ข้อมูลเก่า
 *  + logic/filter/tag เดิมทั้งหมดยังทำงานได้ (`has_pcos = pcos_status === 'yes'`) */
function resolvePcosFromBody(body: any): { pcos_status: PcosStatus | null; has_pcos: boolean } {
  const status = sanitizeEnum<PcosStatus>(body.pcos_status, PCOS_STATUS_VALUES);
  if (status) return { pcos_status: status, has_pcos: status === "yes" };
  // ฟอร์ม/ไคลเอนต์เก่าที่ยังส่งมาแต่ has_pcos
  return { pcos_status: body.has_pcos ? "yes" : null, has_pcos: !!body.has_pcos };
}

function reportProfileFromBody(body: any) {
  const pcos = resolvePcosFromBody(body);
  const partner = sanitizePartnerProfile(body.partner_profile);
  return {
    nickname: body.nickname,
    stage: body.stage,
    weightKg: sanitizeNum(body.weightKg ?? body.weight_kg, 20, 300) ?? undefined,
    heightCm: sanitizeNum(body.height_cm ?? body.heightCm, 80, 250) ?? undefined,
    ageRange: body.age_range,
    hasPcos: pcos.has_pcos,
    pcosStatus: pcos.pcos_status ?? undefined,
    artPlan: mapLegacyArtPlan(body.art_plan),
    infertilityIssues: sanitizeIssues(body.infertility_issues) as any,
    behaviors: sanitizeBehaviors(body.behaviors),
    partnerBehaviors: (partner.behaviors as MaleBehavior[]) || [],
    sleepBedtime: sanitizeTime(body.sleep_bedtime) ?? undefined,
    sleepWaketime: sanitizeTime(body.sleep_waketime) ?? undefined,
    exerciseFreq: sanitizeEnum<ExerciseFreq>(body.exercise_freq, EXERCISE_FREQ_VALUES) ?? undefined,
    hasGdm: !!body.has_gdm,
    // R10 — อายุครรภ์เป็นแกนของเนื้อหาความรู้ช่วงตั้งครรภ์ (ไตรมาส + กฎน้ำหัวปลี ≥16 สัปดาห์)
    // ใช้ช่วงเดียวกับที่ sanitize ตอนเขียนลง leads (1–45) เพื่อไม่ให้ 2 ที่หลุดจากกัน
    gestationalWeeks: sanitizeNum(body.gestational_weeks, 1, 45) ?? undefined,
    tools: body.tools && typeof body.tools === "object" ? body.tools : {},
  };
}

export const runtime = "nodejs";

function corsHeaders(origin: string | null) {
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const h: Record<string, string> = { "Content-Type": "application/json" };
  // Same-origin (no Origin header) always allowed; cross-origin must be in allowlist.
  if (origin && (allowed.includes(origin) || allowed.includes("*"))) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Vary"] = "Origin";
  }
  return h;
}

export async function OPTIONS(req: NextRequest) {
  const h = corsHeaders(req.headers.get("origin"));
  return new NextResponse(null, {
    status: 204,
    headers: { ...h, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!rateLimit(`lead:${ip}`)) {
    return NextResponse.json({ error: "ส่งข้อมูลถี่เกินไป กรุณารอสักครู่" }, { status: 429, headers });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400, headers });
  }

  // --- validation ---
  const errors: string[] = [];
  if (!body.consent) errors.push("ต้องยินยอมก่อนบันทึกข้อมูล");
  if (!body.nickname || String(body.nickname).trim().length < 1) errors.push("กรุณาระบุชื่อเล่น");
  if (!body.contact_value || String(body.contact_value).trim().length < 3) errors.push("กรุณาระบุช่องทางติดต่อ");
  const stages = ["prep", "infertility", "pregnant", "lactating", "male"];
  if (body.stage && !stages.includes(body.stage)) errors.push("stage ไม่ถูกต้อง");
  if (errors.length) return NextResponse.json({ error: errors.join(" · ") }, { status: 400, headers });

  const pcos = resolvePcosFromBody(body);
  const profile = {
    nickname: String(body.nickname).slice(0, 80),
    contact_channel: ["line", "phone", "other"].includes(body.contact_channel) ? body.contact_channel : "line",
    contact_value: String(body.contact_value).slice(0, 120),
    stage: body.stage || null,
    age_range: body.age_range || null,
    has_pcos: pcos.has_pcos,
    art_plan: mapLegacyArtPlan(body.art_plan),
    infertility_issues: sanitizeIssues(body.infertility_issues),
    height_cm: sanitizeNum(body.height_cm ?? body.heightCm, 80, 250),
    interests: Array.isArray(body.interests) ? body.interests.slice(0, 20) : [],
    // ── R3: migration 0006_r3_profile_fields.sql ──────────────────────────
    weight_kg: sanitizeNum(body.weightKg ?? body.weight_kg, 20, 300),
    sleep_bedtime: sanitizeTime(body.sleep_bedtime),
    sleep_waketime: sanitizeTime(body.sleep_waketime),
    exercise_freq: sanitizeEnum(body.exercise_freq, EXERCISE_FREQ_VALUES),
    pcos_status: pcos.pcos_status,
    behaviors: sanitizeBehaviors(body.behaviors),
    partner_profile: sanitizePartnerProfile(body.partner_profile),
    conception_method: sanitizeEnum(body.conception_method, CONCEPTION_METHODS),
    gestational_weeks: sanitizeNum(body.gestational_weeks, 1, 45),
    has_gdm: !!body.has_gdm,
  };
  const tags = autoTags({
    stage: profile.stage || undefined,
    hasPcos: profile.has_pcos,
    artPlan: profile.art_plan,
    infertilityIssues: profile.infertility_issues,
    interests: profile.interests,
    toolResultsCount: body.tools ? Object.keys(body.tools).length : 0,
  });

  const report = generateReport(reportProfileFromBody(body));
  const tier = reportTier({ artPlan: profile.art_plan, infertilityIssues: profile.infertility_issues });

  // 🔒 แผนฉบับเต็มไม่ถูกส่งกลับมาที่เบราว์เซอร์ **ไม่ว่ากรณีใด** — ต้องผ่าน LINE เท่านั้น
  //    (ต้นเคาะ 1 ส.ค. 2026 · กลับมติ R6 ที่เคยให้ tier "full" เห็นแผนเต็มทันทีในหน้า /plan)
  //
  //    เดิม: artPlan = "IVF-ICSI"/"เตรียมผนังมดลูก" → tier "full" → ตอบ { report } กลับไป
  //    คนที่กำลังทำ IVF ซึ่งเป็นกลุ่มที่ตั้งใจดูแลตัวเองที่สุด จึงได้ของครบโดยไม่ต้องทักแอดมิน
  //    = ปิดทางเก็บ lead กับกลุ่มที่มีค่าที่สุดของ funnel
  //
  //    ⚠️ ต้องปิดที่ API ไม่ใช่แค่ซ่อนใน UI — ถ้าแก้แค่หน้าจอ ตัวรายงานเต็มยังเดินทาง
  //    มากับ response อยู่ดี เปิดแท็บ Network ก็อ่านได้ทั้งฉบับ (ไม่ได้ gate จริง)
  //
  //    `tier` ยังส่งกลับไปเหมือนเดิม เพราะ track()/แอดมินใช้ดูว่า lead รายนี้อยู่ชั้นไหน
  const reportPayload = { teaser: buildTeaser(report) };

  // --- DEV fallback: no Supabase env → return generated ticket + report without persisting ---
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ticket_code: genTicketCode(), tags, tier, ...reportPayload, dev_mode: true, note: "SUPABASE env ยังไม่ตั้ง — ยังไม่ได้บันทึกจริง" },
      { headers },
    );
  }

  // Resuming from a LINE-menu link (PDF-05/06)? Verify server-side — never trust
  // a client-supplied customer id directly. A missing/misconfigured secret (or
  // any other verification error) just falls back to "no token" rather than
  // failing the whole submission.
  let resumedCustomerId: string | null = null;
  if (typeof body.resume_token === "string") {
    try {
      resumedCustomerId = verifyResumeToken(body.resume_token)?.customerId ?? null;
    } catch {
      resumedCustomerId = null;
    }
  }

  // --- persist via Supabase (BFF, service role) ---
  try {
    const sb = getServiceClient();
    const { data: lead, error: le } = await sb.from("leads").insert(profile).select("id").single();
    if (le || !lead) throw le || new Error("insert lead failed");

    // Link this submission to a customer — either the one the resume token
    // pointed at, or a brand-new customer for a first-time/no-token submission.
    // Always a fresh `leads` INSERT above either way — old ticket/report links
    // for this person's previous submissions stay frozen and untouched.
    if (resumedCustomerId) {
      await sb.from("leads").update({ customer_id: resumedCustomerId }).eq("id", lead.id);
      await sb.from("customers").update({
        primary_lead_id: lead.id,
        current_stage: profile.stage,
        last_active_at: new Date().toISOString(),
      }).eq("id", resumedCustomerId);
    } else {
      const { data: customer } = await sb
        .from("customers")
        .insert({ primary_lead_id: lead.id, current_stage: profile.stage })
        .select("id")
        .single();
      if (customer) await sb.from("leads").update({ customer_id: customer.id }).eq("id", lead.id);
    }

    await sb.from("consent_log").insert({
      lead_id: lead.id,
      policy_version: CONSENT_POLICY_VERSION,
      consent_text: String(body.consent_text || "").slice(0, 2000),
      granted: true,
      ip,
    });

    if (body.tools && typeof body.tools === "object") {
      const rows = Object.entries(body.tools).map(([tool, v]: any) => ({
        lead_id: lead.id, tool, input: v?.input ?? null, output: v?.output ?? null,
      })).filter((r) => PERSISTED_TOOLS.includes(r.tool));
      if (rows.length) await sb.from("tool_results").insert(rows);
    }

    // ticket with retry on unique collision
    let code = "";
    for (let i = 0; i < 6; i++) {
      code = genTicketCode();
      const { error } = await sb.from("tickets").insert({ code, lead_id: lead.id });
      if (!error) break;
      code = "";
    }
    if (!code) throw new Error("ticket generation failed");

    if (tags.length) {
      const { data: tagRows } = await sb.from("tags").select("id, slug").in("slug", tags);
      if (tagRows?.length) {
        await sb.from("tag_assignments").insert(
          tagRows.map((t) => ({ lead_id: lead.id, tag_id: t.id, source: "auto" })),
        );
      }
    }

    // store the personalized report snapshot (shareable at /r/<code> and via LINE)
    await sb.from("reports").insert({ code, lead_id: lead.id, score: report.score, payload: report });

    return NextResponse.json({ ticket_code: code, tags, tier, ...reportPayload }, { headers });
  } catch (e: any) {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" }, { status: 500, headers });
  }
}
