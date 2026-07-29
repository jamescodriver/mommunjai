import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { autoTags } from "@/lib/tagging";
import { genTicketCode, rateLimit } from "@/lib/ticket";
import { CONSENT_POLICY_VERSION } from "@/lib/disclaimer";
import { generateReport, reportTier, buildTeaser } from "@/lib/report";
import { verifyResumeToken } from "@/lib/customer";
import { mapLegacyArtPlan, INFERTILITY_ISSUE_VALUES } from "@/lib/calc/vitamins";

function sanitizeIssues(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => (INFERTILITY_ISSUE_VALUES as string[]).includes(x)).slice(0, INFERTILITY_ISSUE_VALUES.length);
}

function reportProfileFromBody(body: any) {
  return {
    nickname: body.nickname,
    stage: body.stage,
    weightKg: body.weightKg ? Number(body.weightKg) : undefined,
    heightCm: body.height_cm ? Number(body.height_cm) : undefined,
    ageRange: body.age_range,
    hasPcos: !!body.has_pcos,
    artPlan: mapLegacyArtPlan(body.art_plan),
    infertilityIssues: sanitizeIssues(body.infertility_issues) as any,
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

  const profile = {
    nickname: String(body.nickname).slice(0, 80),
    contact_channel: ["line", "phone", "other"].includes(body.contact_channel) ? body.contact_channel : "line",
    contact_value: String(body.contact_value).slice(0, 120),
    stage: body.stage || null,
    age_range: body.age_range || null,
    has_pcos: !!body.has_pcos,
    art_plan: mapLegacyArtPlan(body.art_plan),
    infertility_issues: sanitizeIssues(body.infertility_issues),
    height_cm: body.height_cm ? Number(body.height_cm) : null,
    interests: Array.isArray(body.interests) ? body.interests.slice(0, 20) : [],
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
  // R5/R6 — teaser/medium tiers never get the full report body back in this
  // response. The full report is still generated + stored below exactly as
  // before; only what /api/lead hands back to the browser changes.
  const tier = reportTier({ artPlan: profile.art_plan, infertilityIssues: profile.infertility_issues });
  const reportPayload = tier === "full" ? { report } : { teaser: buildTeaser(report) };

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
      })).filter((r) => ["ovulation", "protein", "nutrients", "sleep", "vitamins", "water"].includes(r.tool));
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
