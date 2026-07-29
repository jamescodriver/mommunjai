import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { sessionFromReq } from "@/lib/session-server";
import { hasPerm } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/leads — list all leads (dashboard). Requires view_leads.
// Query: q, stage, pcos(true), art, tag(slug), line(yes|no), page, limit, format(csv)
// See docs/PRD-PHASE2.md §3.5 (Epic D — Leads Dashboard).
export async function GET(req: NextRequest) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "view_leads"))
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ / ไม่มีสิทธิ์" }, { status: 401 });
  if (!hasSupabaseEnv())
    return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });

  const sb = getServiceClient();
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const stage = sp.get("stage") || "";
  const pcos = sp.get("pcos") || "";
  const art = sp.get("art") || "";
  const tag = sp.get("tag") || "";
  const line = sp.get("line") || ""; // yes|no
  const isCsv = sp.get("format") === "csv";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = isCsv ? 5000 : Math.min(100, Math.max(1, parseInt(sp.get("limit") || "25", 10) || 25));

  // --- resolve id-set constraints (intersection) ---
  const idSets: string[][] = [];

  if (tag) {
    const { data } = await sb
      .from("tag_assignments")
      .select("lead_id, tags!inner(slug)")
      .eq("tags.slug", tag);
    idSets.push((data || []).map((r: any) => r.lead_id));
  }
  if (line === "yes" || line === "no") {
    const { data } = await sb.from("line_bindings").select("lead_id").not("lead_id", "is", null);
    const bound = [...new Set((data || []).map((r: any) => r.lead_id))];
    if (line === "yes") idSets.push(bound);
    else {
      // line=no → exclude bound: fetch all lead ids then subtract (small scale)
      const { data: all } = await sb.from("leads").select("id");
      const boundSet = new Set(bound);
      idSets.push((all || []).map((r: any) => r.id).filter((id: string) => !boundSet.has(id)));
    }
  }
  if (/^MJ-/i.test(q)) {
    const { data } = await sb.from("tickets").select("lead_id").eq("code", q.toUpperCase());
    idSets.push((data || []).map((r: any) => r.lead_id));
  }

  let allowedIds: string[] | null = null;
  if (idSets.length) {
    allowedIds = idSets.reduce((acc, set) => acc.filter((id) => set.includes(id)));
    if (allowedIds.length === 0) {
      return isCsv
        ? csvResponse([], s!.name)
        : NextResponse.json({ rows: [], total: 0, page, limit });
    }
  }

  // --- main query ---
  let query = sb
    .from("leads")
    .select(
      "id, created_at, nickname, contact_channel, contact_value, stage, age_range, has_pcos, art_plan, tickets(code), reports(score), tag_assignments(id), line_bindings(id)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (stage) query = query.eq("stage", stage);
  if (pcos === "true") query = query.eq("has_pcos", true);
  if (art) query = query.eq("art_plan", art);
  if (allowedIds) query = query.in("id", allowedIds);
  // text search on name/contact (skip when q is a ticket code — already constrained)
  if (q && !/^MJ-/i.test(q)) query = query.or(`nickname.ilike.%${q}%,contact_value.ilike.%${q}%`);

  if (!isCsv) query = query.range((page - 1) * limit, page * limit - 1);
  else query = query.limit(limit);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });

  const rows = (data || []).map((r: any) => ({
    id: r.id,
    created_at: r.created_at,
    nickname: r.nickname,
    contact_channel: r.contact_channel,
    contact_value: r.contact_value,
    stage: r.stage,
    age_range: r.age_range,
    has_pcos: r.has_pcos,
    art_plan: r.art_plan,
    ticket: r.tickets?.[0]?.code ?? r.tickets?.code ?? null,
    score: r.reports?.[0]?.score ?? r.reports?.score ?? null,
    tag_count: Array.isArray(r.tag_assignments) ? r.tag_assignments.length : 0,
    line_bound: Array.isArray(r.line_bindings) ? r.line_bindings.length > 0 : !!r.line_bindings,
  }));

  // audit (best-effort)
  sb.from("staff_audit")
    .insert({ staff_id: s!.sid, action: isCsv ? "export_leads" : "list_leads", target: `n=${rows.length}` })
    .then(() => {}, () => {});

  if (isCsv) {
    if (!hasPerm(s, "export_data"))
      return NextResponse.json({ error: "ไม่มีสิทธิ์ส่งออกข้อมูล" }, { status: 403 });
    return csvResponse(rows, s!.name);
  }
  return NextResponse.json({ rows, total: count ?? rows.length, page, limit });
}

const STAGE_TH: Record<string, string> = {
  prep: "เตรียมตั้งครรภ์", infertility: "มีบุตรยาก", pregnant: "ตั้งครรภ์", lactating: "ให้นม", male: "ฝ่ายชาย",
};

function csvResponse(rows: any[], _by: string) {
  const head = ["วันที่", "ชื่อเล่น", "ช่องทาง", "ติดต่อ", "สเตจ", "อายุ", "PCOS", "ART", "คะแนน", "Ticket", "Tags", "LINE"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      new Date(r.created_at).toLocaleString("th-TH"),
      r.nickname, r.contact_channel, r.contact_value,
      STAGE_TH[r.stage] || r.stage || "", r.age_range || "",
      r.has_pcos ? "ใช่" : "ไม่", r.art_plan || "ยัง",
      r.score ?? "", r.ticket || "", r.tag_count, r.line_bound ? "เชื่อมแล้ว" : "ยัง",
    ].map(esc).join(","),
  );
  // BOM so Excel reads Thai UTF-8 correctly
  const body = "﻿" + [head.map(esc).join(","), ...lines].join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mommunjai-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
