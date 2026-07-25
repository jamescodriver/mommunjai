"use client";
import { useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { recommendVitamins, VitaminProfile } from "@/lib/calc/vitamins";
import type { Stage } from "@/lib/calc/protein";
import { recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, PlanCta, EmbedAutoResize } from "@/components/ui";

export default function VitaminsPage() {
  const embed = useEmbed();
  const [stage, setStage] = useState<Stage>("prep");
  const [hasPcos, setHasPcos] = useState(false);
  const [artPlan, setArtPlan] = useState<VitaminProfile["artPlan"]>("none");
  const [res, setRes] = useState<ReturnType<typeof recommendVitamins> | null>(null);

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
      <ToolShell embed={embed} emoji="💊" title="แนะนำวิตามินครูก้อย"
        intro="ตอบ 3 ข้อ แล้วครูก้อยจะช่วยเลือกตัวบำรุงให้ตรงกับคุณ (คำแนะนำทั่วไป ไม่ใช่การรักษาโรค)">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">1. คุณอยู่ช่วงไหน</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {([["prep", "เตรียมตั้งครรภ์"], ["infertility" as Stage, "มีบุตรยาก"], ["pregnant", "ตั้งครรภ์"], ["male", "ฝ่ายชาย"]] as [Stage, string][]).map(([v, l]) => (
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
            <div className="mt-3 space-y-3">
              {res.primary.map((p) => (
                <div key={p.id} className="rounded-xl bg-white/70 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-sm text-teal-deep">฿{p.price.toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/70">{p.why}</p>
                  {p.detail && <p className="mt-1 text-xs text-ink/50">{p.detail}</p>}
                  {p.howto && <p className="mt-1 text-xs text-teal-deep">วิธีทาน: {p.howto}</p>}
                </div>
              ))}
            </div>
            <PlanCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
