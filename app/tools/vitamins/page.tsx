"use client";
import { useEffect, useState } from "react";
import { useEmbed } from "@/components/use-embed";
import {
  recommendVitamins, VitaminProfile, VitaminStage, Product, StopRules, InfertilityIssue,
  INFERTILITY_ISSUES, ART_PLAN_VALUES, mapLegacyArtPlan,
} from "@/lib/calc/vitamins";
import { readProfile, recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, PlanCta, EmbedAutoResize } from "@/components/ui";
import { IconPill } from "@/components/icons";
import AdminHandoffCta from "@/components/admin-handoff-cta";

const VITAMIN_STAGES = new Set<VitaminStage>(["prep", "infertility", "pregnant", "male"]);

export default function VitaminsPage() {
  const embed = useEmbed();
  const [stage, setStage] = useState<VitaminStage>("prep");
  // R2 comment-round-3 — the issue checklist only ever belongs to "มีบุตรยาก"; every
  // other stage is "บำรุงธรรมดา" with no issue-picker at all (this standalone tool
  // used to ask a free-standing PCOS yes/no regardless of stage — that was the bug).
  const [issues, setIssues] = useState<InfertilityIssue[]>([]);
  const [artPlan, setArtPlan] = useState<VitaminProfile["artPlan"]>("ยัง");
  const [res, setRes] = useState<ReturnType<typeof recommendVitamins> | null>(null);

  // Prefill from whatever the person already told another tool (/plan, protein, an
  // earlier vitamins run) so a returning user isn't asked to re-answer these questions.
  useEffect(() => {
    const p = readProfile();
    if (p.stage && VITAMIN_STAGES.has(p.stage as VitaminStage)) setStage(p.stage as VitaminStage);
    if (p.infertilityIssues?.length) setIssues(p.infertilityIssues);
    else if (p.hasPcos) setIssues(["pcos"]);
    // mapLegacyArtPlan also covers a browser with a pre-R4 cached value.
    if (p.artPlan) setArtPlan(mapLegacyArtPlan(p.artPlan));
  }, []);

  const toggleIssue = (v: InfertilityIssue) => {
    setIssues((cur) => {
      if (v === "unsure") return cur.includes("unsure") ? [] : ["unsure"];
      return cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => x !== "unsure"), v];
    });
  };

  const effectiveIssues = stage === "infertility" ? issues : [];

  const run = () => {
    const profile = { stage, hasPcos: effectiveIssues.includes("pcos"), artPlan, infertilityIssues: effectiveIssues };
    const r = recommendVitamins(profile);
    setRes(r);
    recordTool("vitamins", profile, r);
    mergeProfile({
      stage, hasPcos: effectiveIssues.includes("pcos"), artPlan,
      infertilityIssues: effectiveIssues, interests: r.primary.map((p) => p.id),
    });
  };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} icon={<IconPill />} title="แนะนำวิตามินครูก้อย"
        intro="ตอบไม่กี่ข้อ แล้วครูก้อยจะช่วยเลือกตัวบำรุงให้ตรงกับคุณ (คำแนะนำทั่วไป ไม่ใช่การรักษาโรค)">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">1. คุณอยู่ช่วงไหน</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {([["prep", "เตรียมตั้งครรภ์"], ["infertility", "มีบุตรยาก"], ["pregnant", "ตั้งครรภ์"], ["male", "ฝ่ายชาย"]] as [VitaminStage, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setStage(v)} className={`rounded-xl border px-3 py-2 ${stage === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{l}</button>
              ))}
            </div>
          </div>
          {/* R2 comment-round-3 — issue checklist stays with "มีบุตรยาก" only; every
              other stage skips straight to the ART question below (regular nourishment). */}
          {stage === "infertility" && (
            <div>
              <p className="text-sm font-medium">2. มีปัญหาข้อไหนบ้าง (เลือกได้หลายข้อ)</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {INFERTILITY_ISSUES.map((it) => (
                  <label key={it.v} className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer ${issues.includes(it.v) ? "border-teal bg-teal/10" : "border-black/10 bg-white/60"}`}>
                    <input type="checkbox" className="accent-teal" checked={issues.includes(it.v)} onChange={() => toggleIssue(it.v)} />
                    {it.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{stage === "infertility" ? "3." : "2."} เข้าสู่กระบวนการทางการแพทย์ไหม</p>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
              {ART_PLAN_VALUES.map((v) => (
                <button key={v} onClick={() => setArtPlan(v)} className={`rounded-xl border px-2 py-2 ${artPlan === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{v}</button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={run}>ดูวิตามินที่แนะนำ</button>
        </div>

        {res && (
          <ResultCard>
            <p className="text-sm text-ink/70">{res.note}</p>

            <ProductGroup title="ชุดแกนหลัก — ทานประจำทุกวัน" emoji="⭐" items={res.core} />
            <ProductGroup title="เสริมตามโปรไฟล์ของคุณ" emoji="🎯" items={res.targeted} />
            <ProductGroup title="โภชนาการเสริมจากชุดครูก้อย" emoji="🥗" items={res.nutrition} collapsed />
            <ProductGroup title="ใช้ภายนอก" emoji="🤲" items={res.external} collapsed />

            {res.cautions.length > 0 && (
              <div className="mt-4 rounded-xl border border-rose/30 bg-rose-soft/40 p-3">
                <p className="text-xs font-semibold text-rose-deep">⚠️ ต้องรู้ก่อนเริ่ม</p>
                <ul className="mt-1 space-y-1 text-xs text-ink/70">
                  {res.cautions.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
            <PlanCta />
            <AdminHandoffCta
              stage={stage}
              artPlan={artPlan}
              infertilityIssues={effectiveIssues}
              interests={res.primary.map((p) => p.id)}
              tool="vitamins"
              toolInput={{ stage, artPlan, infertilityIssues: effectiveIssues }}
              toolOutput={res}
            />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}

// Long lists (the brand's set runs to 19 items) are grouped so the core four stay
// readable; the optional groups start collapsed. R2 comment-round-3 — client asked
// to drop price/dosage/detail from this page entirely (that's now an LINE OA/admin
// conversation via AdminHandoffCta below); only the product name + one-line "why"
// + safety-critical caution/stop-rule text stay, since those are compliance
// requirements (legal-compliance.md), not commercial detail.
function ProductGroup({ title, emoji, items, collapsed = false }: {
  title: string; emoji: string; items: Product[]; collapsed?: boolean;
}) {
  if (items.length === 0) return null;
  const list = (
    <div className="mt-2 space-y-2">
      {items.map((p) => (
        <div key={p.id} className="rounded-xl bg-white/70 p-3">
          <span className="font-semibold">{p.name}</span>
          <p className="mt-1 text-xs text-ink/70">{p.why}</p>
          {p.caution && <p className="mt-1 text-xs text-ink/60">{p.caution}</p>}
          {p.stop && <p className="mt-1 text-xs font-medium text-rose-deep">❌ หยุดทาน: {stopLabel(p.stop)}</p>}
        </div>
      ))}
    </div>
  );

  if (!collapsed) {
    return (
      <div className="mt-4">
        <p className="text-sm font-semibold">{emoji} {title} <span className="font-normal text-ink/50">({items.length})</span></p>
        {list}
      </div>
    );
  }
  return (
    <details className="mt-4 group">
      <summary className="cursor-pointer list-none text-sm font-semibold">
        <span className="text-teal-deep group-open:hidden">▸</span>
        <span className="hidden text-teal-deep group-open:inline">▾</span>{" "}
        {emoji} {title} <span className="font-normal text-ink/50">({items.length})</span>
      </summary>
      {list}
    </details>
  );
}

function stopLabel(s: StopRules): string {
  const parts: string[] = [];
  if (s.ovulation) parts.push("ช่วงวันไข่ตก");
  if (s.embryoTransfer) parts.push("หลังใส่ตัวอ่อน");
  if (s.pregnant) parts.push("ช่วงตั้งครรภ์");
  if (s.lactating) parts.push("ช่วงให้นม");
  return parts.join(" · ");
}
