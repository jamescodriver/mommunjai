"use client";
import { useEffect, useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { calcWater, WaterStage } from "@/lib/calc/water";
import { readProfile, recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, Field, PlanCta, VitaminsCta, EmbedAutoResize } from "@/components/ui";

const STAGES: { v: WaterStage; l: string }[] = [
  { v: "prep", l: "เตรียมตั้งครรภ์ / บำรุงไข่" },
  { v: "infertility", l: "มีบุตรยาก" },
  { v: "pregnant", l: "ตั้งครรภ์แล้ว" },
  { v: "lactating", l: "ให้นมบุตร" },
  { v: "male", l: "ฝ่ายชาย" },
];

export default function WaterPage() {
  const embed = useEmbed();
  const [weight, setWeight] = useState<number | "">("");
  const [stage, setStage] = useState<WaterStage>("prep");
  const [current, setCurrent] = useState<number | "">("");
  const [res, setRes] = useState<ReturnType<typeof calcWater> | null>(null);

  useEffect(() => {
    const p = readProfile();
    if (p.weightKg) setWeight(p.weightKg);
    if (p.stage) setStage(p.stage as WaterStage);
  }, []);

  const run = () => {
    const r = calcWater({
      weightKg: Number(weight),
      stage,
      currentMl: current === "" ? undefined : Number(current),
    });
    setRes(r);
    if (!("error" in r)) {
      recordTool("water", { weight, stage, current }, r);
      mergeProfile({ weightKg: Number(weight), stage });
    }
  };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} emoji="💧" title="เช็คปริมาณน้ำ"
        intro="น้ำเป็นตัวช่วยไหลเวียนเลือดและลำเลียงสารอาหารไปเลี้ยงร่างกาย มาดูกันว่าวันนี้คุณควรดื่มน้ำเท่าไหร่">
        <div className="space-y-4">
          <Field label="น้ำหนักตัว (กิโลกรัม)" hint="30–150 กก.">
            <input type="number" className="field" value={weight} placeholder="เช่น 55"
              onChange={(e) => setWeight(e.target.value === "" ? "" : +e.target.value)} />
          </Field>
          <Field label="ช่วงของคุณ">
            <select className="field" value={stage} onChange={(e) => setStage(e.target.value as WaterStage)}>
              {STAGES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </Field>
          <Field label="วันนี้ดื่มน้ำไปแล้วกี่มิลลิลิตร (ไม่บังคับ)" hint="ไม่ใส่ก็ได้ ถ้าอยากรู้แค่เป้าหมาย · 1 แก้ว ≈ 250 มล.">
            <input type="number" className="field" value={current} placeholder="เช่น 1200"
              onChange={(e) => setCurrent(e.target.value === "" ? "" : +e.target.value)} />
          </Field>
          <button className="btn-primary w-full" onClick={run}>คำนวณปริมาณน้ำ</button>
        </div>

        {res && "error" in res && <ResultCard><p className="text-rose-deep">{res.error}</p></ResultCard>}
        {res && !("error" in res) && (
          <ResultCard>
            <div className="text-center">
              <p className="text-sm text-ink/60">เป้าหมายน้ำต่อวัน</p>
              <p className="text-2xl font-semibold text-teal-deep">{res.targetMinMl.toLocaleString()}–{res.targetMaxMl.toLocaleString()} มล.</p>
              <p className="text-xs text-ink/50">≈ {res.glasses[0]}–{res.glasses[1]} แก้ว (แก้วละ 250 มล.)</p>
            </div>

            {res.current && (
              <div className="mt-4 rounded-xl bg-white/70 p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-ink/60">ดื่มไปแล้ว {res.current.ml.toLocaleString()} มล.</span>
                  <span className={`chip ${res.current.status === "ดี" ? "" : "!bg-gold/20 !text-gold !border-gold/30"}`}>{res.current.status}</span>
                </div>
                <p className="mt-2 text-xs text-ink/70">{res.current.note}</p>
              </div>
            )}

            <PlanCta />
            <VitaminsCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
