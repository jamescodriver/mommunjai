"use client";
import { useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { calcOvulation } from "@/lib/calc/ovulation";
import { OVULATION_DISCLAIMER } from "@/lib/disclaimer";
import { recordTool } from "@/lib/profile-store";
import { ToolShell, ResultCard, Field, PlanCta, VitaminsCta, EmbedAutoResize } from "@/components/ui";
import { IconCalendar } from "@/components/icons";

const fmtTH = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long" });

export default function OvulationPage() {
  const embed = useEmbed();
  const [last, setLast] = useState("");
  const [cycle, setCycle] = useState(28);
  const [res, setRes] = useState<ReturnType<typeof calcOvulation> | null>(null);

  const run = () => {
    const r = calcOvulation({ lastPeriodStart: last, cycleLength: cycle });
    setRes(r);
    if (!("error" in r)) recordTool("ovulation", { last, cycle }, r);
  };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell
        embed={embed}
        icon={<IconCalendar />}
        title="นับวันไข่ตก"
        intro="กรอกวันแรกของประจำเดือนล่าสุด แล้วดูวันที่มีโอกาสตั้งครรภ์สูงสุดได้เลย"
      >
        <div className="space-y-4">
          <Field label="วันแรกของประจำเดือนล่าสุด" hint="ของคุณ หรือของคู่ก็ได้">
            <input type="date" className="field" value={last} onChange={(e) => setLast(e.target.value)} />
          </Field>
          <Field label={`ความยาวรอบเดือน (วัน): ${cycle}`} hint="ปกติ 21–35 วัน (ค่าเริ่มต้น 28)">
            <input type="range" min={21} max={35} value={cycle} className="w-full accent-teal"
              onChange={(e) => setCycle(+e.target.value)} />
          </Field>
          <button className="btn-primary w-full" onClick={run}>คำนวณวันไข่ตก</button>
        </div>

        {res && "error" in res && (
          <ResultCard><p className="text-rose-deep">{res.error}</p></ResultCard>
        )}
        {res && !("error" in res) && (
          <ResultCard>
            {/* R9 — ovulation date is now the hero: largest element in the result,
                fertile window demoted to a smaller secondary chip alongside it. */}
            <div className="text-center">
              <p className="text-xs text-ink/50">วันไข่ตก (โดยประมาณ)</p>
              <p className="text-4xl font-bold text-teal-deep sm:text-5xl">{fmtTH(res.ovulationDate)}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs">
              <div className="rounded-xl bg-teal/10 p-3">
                <div className="text-ink/60">ช่วงมีโอกาสสูง</div>
                <div className="font-medium">{fmtTH(res.fertileStart)} – {fmtTH(res.fertileEnd)}</div>
              </div>
              <div className="rounded-xl bg-rose-soft p-3">
                <div className="text-ink/60">ประจำเดือนรอบถัดไป</div>
                <div className="font-medium">{fmtTH(res.nextPeriod)}</div>
              </div>
            </div>
            {res.irregularWarning && (
              <p className="mt-3 text-xs text-gold">
                รอบเดือนของคุณอาจไม่สม่ำเสมอ ผลอาจคลาดเคลื่อน โดยเฉพาะผู้มีภาวะ PCOS — แนะนำปรึกษาแพทย์
              </p>
            )}
            <details className="mt-3 text-xs text-ink/50">
              <summary className="cursor-pointer select-none">ℹ️ คำอธิบาย/ข้อจำกัดของผลลัพธ์</summary>
              <p className="mt-1 leading-relaxed">{OVULATION_DISCLAIMER}</p>
            </details>
            <PlanCta />
            <VitaminsCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
