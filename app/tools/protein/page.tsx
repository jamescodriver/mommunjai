"use client";
import { useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { calcProtein, fmtRange, fertyTopUpText, Stage } from "@/lib/calc/protein";
import { recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, Field, PlanCta, VitaminsCta, EmbedAutoResize } from "@/components/ui";
import { IconEgg } from "@/components/icons";

const STAGES: { v: Stage; l: string }[] = [
  { v: "prep", l: "เตรียมตั้งครรภ์ / บำรุงไข่" },
  { v: "pregnant", l: "ตั้งครรภ์แล้ว" },
  { v: "lactating", l: "ให้นมบุตร" },
  { v: "male", l: "ฝ่ายชาย (บำรุงสเปิร์ม)" },
];

// PDF-10 — "แหล่งโปรตีนกับปริมาณ" reference table. Figures sourced from
// docs/nutrition-protocol.md §1 (the same numbers protein.ts's food-equivalent
// math is built on) — not invented, and readable on its own without having to
// calculate a personal target first.
const PROTEIN_SOURCES: { food: string; amount: string; grams: string }[] = [
  { food: "🥚 ไข่ต้ม", amount: "1 ฟอง", grams: "≈ 6–7 กรัม" },
  { food: "🍗 อกไก่", amount: "100 กรัม", grams: "≈ 30 กรัม" },
  { food: "🐟 ปลา", amount: "100 กรัม", grams: "≈ 20 กรัม" },
  { food: "🥤 โปรตีนเฟอร์ตี้", amount: "1 ซอง", grams: "≈ 25 กรัม" },
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
      <ToolShell embed={embed} icon={<IconEgg />} title="คำนวณโปรตีน"
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

        <details className="mt-4 group">
          <summary className="cursor-pointer list-none text-sm font-semibold">
            <span className="text-teal-deep group-open:hidden">▸</span>
            <span className="hidden text-teal-deep group-open:inline">▾</span>{" "}
            🍳 รู้จักแหล่งโปรตีนกับปริมาณ
          </summary>
          <div className="mt-2 space-y-2">
            {PROTEIN_SOURCES.map((s) => (
              <div key={s.food} className="flex items-center justify-between rounded-xl bg-white/70 p-3 text-sm">
                <span>{s.food}</span>
                <span className="text-ink/60">{s.amount}</span>
                <span className="font-medium text-teal-deep">{s.grams}</span>
              </div>
            ))}
            <p className="text-xs text-ink/60">
              ถ้ากินอาหารไม่ถึงเป้าในแต่ละวัน เติมด้วย <b>โปรตีนเฟอร์ตี้</b> ได้เลย — 1 ซอง ≈ โปรตีน 25 กรัม
            </p>
          </div>
        </details>

        {res && "error" in res && <ResultCard><p className="text-rose-deep">{res.error}</p></ResultCard>}
        {res && !("error" in res) && (
          <ResultCard>
            <div className="text-center">
              <p className="text-sm text-ink/60">เป้าโปรตีนต่อวัน</p>
              <p className="text-2xl font-semibold text-teal-deep">{fmtRange(res.minGrams, res.maxGrams)} กรัม</p>
              <p className="text-xs text-ink/50">({fmtRange(res.perKg[0], res.perKg[1])} ก./น้ำหนักตัว 1 กก.)</p>
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
              {/* U-05 — ค่าคงที่จากแบรนด์ ห้ามคำนวณจากน้ำหนักตัว (ดู lib/calc/protein.ts) */}
              {fertyTopUpText(stage === "male")}
            </p>
            <PlanCta />
            <VitaminsCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
