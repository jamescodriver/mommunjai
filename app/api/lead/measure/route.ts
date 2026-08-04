import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/ticket";
import { generateReport, buildTeaser } from "@/lib/report";

/**
 * เติมน้ำหนัก/ส่วนสูงหลังกรอกแบบสอบถามเสร็จ แล้วคำนวณเป้าหมายใหม่ทันที
 *
 * ทำไมต้องมี: ตัวเลขในหน้าสรุป (โปรตีน · น้ำ · BMI) คำนวณจากน้ำหนัก แต่ 2 ช่องนี้ไม่บังคับ
 * กรอกในแบบสอบถาม (บังคับ = คนกรอกไม่จบ) คนที่ข้ามไปจึงเห็นหน้าสรุปที่ไม่มีตัวเลขของตัวเอง
 * ต้นเคาะ 1 ส.ค. 2026 ให้ "กรอกตรงหน้านั้นแล้วประเมินใหม่ได้เลย" — ตอนนั้นแรงจูงใจสูงสุด
 * เพราะเขาเห็นแล้วว่าจะได้อะไรกลับมา
 *
 * ── โมเดลความปลอดภัย (สำคัญ — นี่คือ endpoint สาธารณะที่ "เขียน" ข้อมูลสุขภาพ) ──
 * 1. ต้องรู้รหัส ticket ซึ่งเป็นความลับระดับเดียวกับที่ใช้เปิด /r/<code> อยู่แล้ว
 * 2. **เติมได้เฉพาะช่องที่ยังว่าง** — ถ้า lead มีน้ำหนัก/ส่วนสูงอยู่แล้ว จะไม่ถูกทับเด็ดขาด
 *    (คนที่เดารหัสถูกจึงทำได้อย่างมากแค่เติมค่าที่เจ้าตัวกำลังจะเติมเองอยู่แล้ว
 *     ไม่สามารถแก้/ลบคำตอบจริงของใครได้)
 * 3. ทำได้เฉพาะ lead ที่เพิ่งสร้างภายใน 24 ชม. — หลังจากนั้นถือว่าจบการกรอกแล้ว
 * 4. rate limit ต่อ IP เหมือน /api/lead
 * 5. รับแค่ 2 ฟิลด์นี้เท่านั้น ฟิลด์อื่นใน body ถูกทิ้งทั้งหมด
 */

const FRESH_MS = 24 * 60 * 60 * 1000;

const num = (v: any, min: number, max: number): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (typeof n !== "number" || !isFinite(n)) return null;
  return n >= min && n <= max ? Math.round(n * 10) / 10 : null;
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`measure:${ip}`)) {
    return NextResponse.json({ error: "ส่งข้อมูลถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 }); }

  const code = String(body?.code || "").toUpperCase();
  if (!/^MJ-[2-9A-HJ-NP-Z]{6}$/.test(code)) {
    return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  }
  const weight = num(body?.weight_kg, 20, 300);
  const height = num(body?.height_cm, 80, 250);
  if (weight === null && height === null) {
    return NextResponse.json({ error: "กรุณากรอกน้ำหนักหรือส่วนสูง" }, { status: 400 });
  }

  // ไม่มี Supabase (เครื่อง dev) → ไม่มีอะไรให้บันทึก แต่ต้องไม่พัง หน้าจอคำนวณเองได้อยู่แล้ว
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true, dev_mode: true });

  try {
    const sb = getServiceClient();
    const { data: ticket } = await sb.from("tickets").select("lead_id").eq("code", code).single();
    if (!ticket?.lead_id) return NextResponse.json({ error: "ไม่พบรหัสนี้" }, { status: 404 });

    const { data: lead } = await sb.from("leads").select("*").eq("id", ticket.lead_id).single();
    if (!lead) return NextResponse.json({ error: "ไม่พบรหัสนี้" }, { status: 404 });

    // (3) เฉพาะ lead ที่ยังสด
    if (lead.created_at && Date.now() - new Date(lead.created_at).getTime() > FRESH_MS) {
      return NextResponse.json({ error: "หมดเวลาแก้ไข กรุณาทำแบบสอบถามใหม่" }, { status: 409 });
    }

    // (2) เติมเฉพาะช่องว่าง — ค่าที่ผู้ใช้เคยตอบไว้ห้ามถูกทับ
    const patch: Record<string, number> = {};
    if (weight !== null && lead.weight_kg == null) patch.weight_kg = weight;
    if (height !== null && lead.height_cm == null) patch.height_cm = height;
    if (!Object.keys(patch).length) {
      return NextResponse.json({ ok: true, note: "มีข้อมูลอยู่แล้ว ไม่ได้เปลี่ยนอะไร" });
    }
    await sb.from("leads").update(patch).eq("id", lead.id);

    // สร้างรายงานใหม่จากคำตอบชุดที่อัปเดตแล้ว + ผลเครื่องมือเดิม แล้วทับ snapshot
    // ไม่งั้นแผนที่เขาเปิดจาก LINE จะยังเป็นฉบับที่ไม่มีตัวเลขของตัวเอง (คนละอย่างกับที่เพิ่งเห็น)
    const { data: results } = await sb
      .from("tool_results").select("tool, input, output").eq("lead_id", lead.id);
    const tools: any = {};
    (results || []).forEach((r) => (tools[r.tool] = { input: r.input, output: r.output }));

    const merged = { ...lead, ...patch };
    const report = generateReport({
      nickname: merged.nickname, stage: merged.stage,
      weightKg: merged.weight_kg ?? undefined, heightCm: merged.height_cm ?? undefined,
      ageRange: merged.age_range, hasPcos: merged.has_pcos, pcosStatus: merged.pcos_status ?? undefined,
      artPlan: merged.art_plan, infertilityIssues: merged.infertility_issues || [],
      behaviors: merged.behaviors || [], partnerBehaviors: merged.partner_profile?.behaviors || [],
      sleepBedtime: merged.sleep_bedtime ?? undefined, sleepWaketime: merged.sleep_waketime ?? undefined,
      exerciseFreq: merged.exercise_freq ?? undefined, hasGdm: !!merged.has_gdm,
      gestationalWeeks: merged.gestational_weeks ?? undefined,
      conceptionMethod: merged.conception_method ?? undefined, tools,
    });
    await sb.from("reports").update({ score: report.score, payload: report }).eq("code", code);
    await sb.from("events").insert({ lead_id: lead.id, name: "measure_filled", props: Object.keys(patch) });

    // ตอบกลับแค่ teaser เหมือน /api/lead — แผนฉบับเต็มยังต้องผ่าน LINE เท่านั้น
    return NextResponse.json({ ok: true, teaser: buildTeaser(report) });
  } catch {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
