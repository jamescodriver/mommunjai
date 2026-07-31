// PDF-05/06 — resolves a signed resume token (minted by the LINE webhook's
// menu reply) into a prefill payload for /plan, so a returning customer isn't
// asked to re-answer what we already know. Invalid/expired token -> 400;
// /plan treats that as "no prefill", never a hard error.
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { verifyResumeToken } from "@/lib/customer";
import { mapLegacyArtPlan } from "@/lib/calc/vitamins";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("rt") || "";
  let verified: ReturnType<typeof verifyResumeToken>;
  try {
    verified = verifyResumeToken(token);
  } catch {
    // RESUME_TOKEN_SECRET not configured — treat as "no prefill", not a crash.
    verified = null;
  }
  if (!verified) return NextResponse.json({ error: "ลิงก์หมดอายุหรือไม่ถูกต้อง" }, { status: 400 });

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "SUPABASE env ยังไม่ตั้ง" }, { status: 400 });
  }

  const sb = getServiceClient();
  const { data: customer } = await sb
    .from("customers")
    .select("id, primary_lead_id")
    .eq("id", verified.customerId)
    .maybeSingle();
  if (!customer?.primary_lead_id) {
    return NextResponse.json({ error: "ไม่พบข้อมูลลูกค้า" }, { status: 400 });
  }

  // R3 — ฟิลด์ใหม่จาก migration 0006 ต้องถูกส่งกลับด้วย ไม่งั้นคนที่กลับมาผ่านลิงก์
  // ใน LINE จะต้องกรอกน้ำหนัก/การนอน/ออกกำลังกายใหม่ทุกครั้ง (prefill พัง)
  const { data: lead } = await sb
    .from("leads")
    // (ต้องเป็น string literal บรรทัดเดียว — supabase-js อ่าน select ตอน type-check
    //  ถ้าต่อสตริงด้วย + ชนิดที่ได้จะกลายเป็น GenericStringError ทันที)
    .select("nickname, stage, age_range, has_pcos, art_plan, infertility_issues, height_cm, contact_channel, contact_value, weight_kg, sleep_bedtime, sleep_waketime, exercise_freq, pcos_status, behaviors, partner_profile, conception_method, gestational_weeks, has_gdm")
    .eq("id", customer.primary_lead_id)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: "ไม่พบข้อมูลลูกค้า" }, { status: 400 });

  const { data: toolRows } = await sb
    .from("tool_results")
    .select("tool, input, output, created_at")
    .eq("lead_id", customer.primary_lead_id)
    .order("created_at", { ascending: false });

  const tools: Record<string, { input: unknown; output: unknown }> = {};
  for (const row of toolRows || []) {
    if (!(row.tool in tools)) tools[row.tool] = { input: row.input, output: row.output }; // most recent per tool
  }
  const weightSource = tools.protein?.input ?? tools.water?.input;
  const toolWeightKg = weightSource && typeof weightSource === "object" && "weight" in weightSource
    ? Number((weightSource as any).weight) || undefined
    : undefined;
  // R4 — น้ำหนักที่กรอกในแบบสอบถามเป็นค่าที่ผู้ใช้ตั้งใจให้กับโปรไฟล์ตัวเอง จึงมาก่อน
  // ค่าที่เดาจาก input ของเครื่องมือคำนวณ (ซึ่งอาจกรอกแทนคนอื่นก็ได้)
  const weightKg = (lead.weight_kg != null ? Number(lead.weight_kg) : undefined) ?? toolWeightKg;

  return NextResponse.json({
    nickname: lead.nickname,
    stage: lead.stage,
    age_range: lead.age_range,
    has_pcos: lead.has_pcos,
    pcos_status: lead.pcos_status ?? (lead.has_pcos ? "yes" : undefined),
    sleep_bedtime: lead.sleep_bedtime ?? undefined,
    sleep_waketime: lead.sleep_waketime ?? undefined,
    exercise_freq: lead.exercise_freq ?? undefined,
    behaviors: Array.isArray(lead.behaviors) ? lead.behaviors : [],
    partner_profile: lead.partner_profile && typeof lead.partner_profile === "object" ? lead.partner_profile : {},
    conception_method: lead.conception_method ?? undefined,
    gestational_weeks: lead.gestational_weeks ?? undefined,
    has_gdm: !!lead.has_gdm,
    // R4 — a lead saved before this migration may still carry the old
    // none|iui|ivf|icsi values; normalize so /plan never has to know about them.
    art_plan: mapLegacyArtPlan(lead.art_plan),
    infertility_issues: Array.isArray(lead.infertility_issues) ? lead.infertility_issues : [],
    height_cm: lead.height_cm ?? undefined,
    contact_channel: lead.contact_channel,
    contact_value: lead.contact_value,
    weightKg,
    tools,
  });
}
