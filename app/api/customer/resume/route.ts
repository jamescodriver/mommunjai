// PDF-05/06 — resolves a signed resume token (minted by the LINE webhook's
// menu reply) into a prefill payload for /plan, so a returning customer isn't
// asked to re-answer what we already know. Invalid/expired token -> 400;
// /plan treats that as "no prefill", never a hard error.
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { verifyResumeToken } from "@/lib/customer";

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

  const { data: lead } = await sb
    .from("leads")
    .select("nickname, stage, age_range, has_pcos, art_plan, contact_channel, contact_value")
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
  const weightKg = weightSource && typeof weightSource === "object" && "weight" in weightSource
    ? Number((weightSource as any).weight) || undefined
    : undefined;

  return NextResponse.json({
    nickname: lead.nickname,
    stage: lead.stage,
    age_range: lead.age_range,
    has_pcos: lead.has_pcos,
    art_plan: lead.art_plan,
    contact_channel: lead.contact_channel,
    contact_value: lead.contact_value,
    weightKg,
    tools,
  });
}
