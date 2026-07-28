"use client";
import { useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { calcProtein, Stage } from "@/lib/calc/protein";
import { recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, Field, PlanCta, VitaminsCta, EmbedAutoResize } from "@/components/ui";

const STAGES: { v: Stage; l: string }[] = [
  { v: "prep", l: "เตรียมตั้งครรภ์ / บำรุงไข่" },
  { v: "pregnant", l: "ตั้งครรภ์แล้ว" },
  { v: "lactating", l: "ให้นมบุตร" },
  { v: "male", l: "ฝ่ายชาย (บำรุงสเปิร์ม)" },
];

export default function ProteinPage() {
  const embed = useEmbed();
  const [weight, setWeight] = useState<number | "">("");
  const [stage, setStage] = useState<Stage>("prep");
  const [res, setRes] = useState<ReturnType<typeof calcProtein> | null>(null);

  const run = () => {
    const r = calcProtein({ weightKg: Number(weight), stage });
    setRes(r);
    if (!("error" in r)) {
      recordTool("protein", { weight, stage }, r);
      mergeProfile({ weightKg: Number(weight), stage });
    }
  };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} emoji="🥚" title="คำนวณโปรตีน"
        intro="โปรตีนสำคัญมากในการบำรุงไข่ให้อ้วนโตสมบูรณ์ มาดูกันว่าคุณควรได้วันละเท่าไหร่">
        <div className="space-y-4">
          <Field label="น้ำหนักตัว (กิโลกรัม)" hint="30–150 กก.">
            <input type="number" className="field" value={weight} placeholder="เช่น 55"
              onChange={(e) => setWeight(e.target.value === "" ? "" : +e.target.value)} />
          </Field>
          <Field label="ช่วงของคุณ">
            <select className="field" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              {STAGES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </Field>
          <button className="btn-primary w-full" onClick={run}>คำนวณโปรตีน</button>
        </div>

        {res && "error" in res && <ResultCard><p className="text-rose-deep">{res.error}</p></ResultCard>}
        {res && !("error" in res) && (
          <ResultCard>
            <div className="text-center">
              <p className="text-sm text-ink/60">เป้าโปรตีนต่อวัน</p>
              <p className="text-2xl font-semibold text-teal-deep">{res.minGrams}–{res.maxGrams} กรัม</p>
              <p className="text-xs text-ink/50">({res.perKg[0]}–{res.perKg[1]} ก./น้ำหนักตัว 1 กก.)</p>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <p className="font-medium">เทียบเท่าประมาณ:</p>
              {res.foodEquivalents.map((f) => (
                <div key={f.label} className="flex justify-between rounded-lg bg-white/60 px-3 py-2">
                  <span>{f.label}</span><span className="font-medium">{f.amount}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink/60">
              ถ้ากินอาหารไม่ถึงเป้า เติมด้วยโปรตีนเฟอร์ตี้ {res.fertyServings.min}–{res.fertyServings.max} ซอง/วัน
            </p>
            <PlanCta />
            <VitaminsCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
