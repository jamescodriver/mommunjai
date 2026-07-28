"use client";
import { useEffect, useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { recommendVitamins, VitaminProfile, VitaminStage, Product, StopRules } from "@/lib/calc/vitamins";
import { readProfile, recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, PlanCta, EmbedAutoResize } from "@/components/ui";
import { IconPill } from "@/components/icons";

const VITAMIN_STAGES = new Set<VitaminStage>(["prep", "infertility", "pregnant", "male"]);

export default function VitaminsPage() {
  const embed = useEmbed();
  const [stage, setStage] = useState<VitaminStage>("prep");
  const [hasPcos, setHasPcos] = useState(false);
  const [artPlan, setArtPlan] = useState<VitaminProfile["artPlan"]>("none");
  const [res, setRes] = useState<ReturnType<typeof recommendVitamins> | null>(null);

  // Prefill from whatever the person already told another tool (/plan, protein, an
  // earlier vitamins run) so a returning user isn't asked to re-answer these 3 questions.
  useEffect(() => {
    const p = readProfile();
    if (p.stage && VITAMIN_STAGES.has(p.stage as VitaminStage)) setStage(p.stage as VitaminStage);
    if (p.hasPcos !== undefined) setHasPcos(!!p.hasPcos);
    if (p.artPlan) setArtPlan(p.artPlan);
  }, []);

  const run = () => {
    const profile = { stage, hasPcos, artPlan };
    const r = recommendVitamins(profile);
    setRes(r);
    recordTool("vitamins", profile, r);
    mergeProfile({ stage, hasPcos, artPlan, interests: r.primary.map((p) => p.id) });
  };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} icon={<IconPill />} title="แนะนำวิตามินครูก้อย"
        intro="ตอบ 3 ข้อ แล้วครูก้อยจะช่วยเลือกตัวบำรุงให้ตรงกับคุณ (คำแนะนำทั่วไป ไม่ใช่การรักษาโรค)">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">1. คุณอยู่ช่วงไหน</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {([["prep", "เตรียมตั้งครรภ์"], ["infertility", "มีบุตรยาก"], ["pregnant", "ตั้งครรภ์"], ["male", "ฝ่ายชาย"]] as [VitaminStage, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setStage(v)} className={`rounded-xl border px-3 py-2 ${stage === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">2. มีภาวะ PCOS (ถุงน้ำรังไข่) ไหม</p>
            <div className="mt-2 flex gap-2 text-sm">
              <button onClick={() => setHasPcos(true)} className={`flex-1 rounded-xl border px-3 py-2 ${hasPcos ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>ใช่ / ไม่แน่ใจ</button>
              <button onClick={() => setHasPcos(false)} className={`flex-1 rounded-xl border px-3 py-2 ${!hasPcos ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>ไม่มี</button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">3. วางแผนทำเด็กหลอดแก้วไหม</p>
            <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
              {(["none", "iui", "ivf", "icsi"] as const).map((v) => (
                <button key={v} onClick={() => setArtPlan(v)} className={`rounded-xl border px-2 py-2 ${artPlan === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{v === "none" ? "ยังไม่" : v.toUpperCase()}</button>
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
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}

// Long lists (the brand's set runs to 19 items) are grouped so the core four stay
// readable; the optional groups start collapsed. Prices we don't have confirmed are
// shown as "สอบถามราคา" rather than guessed — see lib/calc/vitamins.ts.
function ProductGroup({ title, emoji, items, collapsed = false }: {
  title: string; emoji: string; items: Product[]; collapsed?: boolean;
}) {
  if (items.length === 0) return null;
  const list = (
    <div className="mt-2 space-y-2">
      {items.map((p) => (
        <div key={p.id} className="rounded-xl bg-white/70 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{p.name}</span>
            <span className="shrink-0 text-sm text-teal-deep">
              {p.price === null ? "สอบถามราคา" : `฿${p.price.toLocaleString()}`}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/70">{p.why}</p>
          {p.detail && <p className="mt-1 text-xs text-ink/50">{p.detail}</p>}
          {p.howto && <p className="mt-1 text-xs text-teal-deep">วิธีทาน: {p.howto}</p>}
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
