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
        intro="กรอกวันแรกของประจำเดือนล่าสุด แล้วเราจะช่วยหาช่วงที่มีโอกาสมีลูกสูงสุด — คุณผู้ชายกรอกแทนคู่ได้เลยค่ะ ช่วยกันวางแผนได้ทั้งสองคน 👫"
        disclaimer={OVULATION_DISCLAIMER}
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
            <div className="text-center">
              <p className="text-sm text-ink/60">ช่วงมีโอกาสสูง (Fertile window)</p>
              <p className="text-xl font-semibold text-teal-deep">
                {fmtTH(res.fertileStart)} – {fmtTH(res.fertileEnd)}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-xl bg-teal/10 p-3">
                <div className="text-ink/60">วันไข่ตก (โดยประมาณ)</div>
                <div className="font-semibold">{fmtTH(res.ovulationDate)}</div>
              </div>
              <div className="rounded-xl bg-rose-soft p-3">
                <div className="text-ink/60">ประจำเดือนรอบถัดไป</div>
                <div className="font-semibold">{fmtTH(res.nextPeriod)}</div>
              </div>
            </div>
            {res.irregularWarning && (
              <p className="mt-3 text-xs text-gold">
                รอบเดือนของคุณอาจไม่สม่ำเสมอ ผลอาจคลาดเคลื่อน โดยเฉพาะผู้มีภาวะ PCOS — แนะนำปรึกษาแพทย์
              </p>
            )}
            <PlanCta />
            <VitaminsCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
