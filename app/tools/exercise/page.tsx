"use client";
import { useEffect, useState } from "react";
import { useEmbed } from "@/components/use-embed";
import {
  recommendExercise, ABSOLUTE_CONTRAINDICATIONS, RELATIVE_CONTRAINDICATIONS,
  ExerciseStage, BaselineActivity,
} from "@/lib/calc/exercise";
import { readProfile, recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, Field, PlanCta, VitaminsCta, EmbedAutoResize } from "@/components/ui";
import { IconRun } from "@/components/icons";

const STAGES: { v: ExerciseStage; l: string }[] = [
  { v: "prep", l: "เตรียมตั้งครรภ์ / บำรุงไข่" },
  { v: "infertility", l: "มีบุตรยาก" },
  { v: "pregnant", l: "ตั้งครรภ์แล้ว" },
  { v: "lactating", l: "ให้นมบุตร" },
  { v: "male", l: "ฝ่ายชาย" },
];

export default function ExercisePage() {
  const embed = useEmbed();
  const [stage, setStage] = useState<ExerciseStage>("prep");
  const [baseline, setBaseline] = useState<BaselineActivity>("sedentary");
  const [issues, setIssues] = useState<string[]>([]);
  const [res, setRes] = useState<ReturnType<typeof recommendExercise> | null>(null);

  useEffect(() => {
    const p = readProfile();
    if (p.stage) setStage(p.stage as ExerciseStage);
  }, []);

  // Red-team catch: a result computed before ticking a new contraindication
  // (or changing baseline) must never stay on screen looking current — an
  // absolute-contraindication tick after seeing a "full plan" result must not
  // leave that now-invalid full plan visible with no indication it changed.
  // Any change to an input the recommendation depends on invalidates it,
  // forcing a fresh press of "ดูคำแนะนำ" instead of trusting stale state.
  useEffect(() => { setRes(null); }, [stage, baseline, issues]);

  const toggleIssue = (v: string) => {
    setIssues((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  };

  const run = () => {
    const r = recommendExercise({ stage, baseline, contraindications: stage === "pregnant" ? issues : undefined });
    setRes(r);
    recordTool("exercise", { stage, baseline, issues }, r);
    mergeProfile({ stage });
  };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} icon={<IconRun />} title="แนะนำการออกกำลังกาย"
        intro="ตอบไม่กี่ข้อ แล้วเราจะแนะนำการออกกำลังกายที่เหมาะกับช่วงของคุณ อ้างอิงแนวทางจาก WHO / ACOG / SOGC-CSEP (ไม่ใช่คำวินิจฉัยแพทย์)">
        <div className="space-y-4">
          <Field label="ช่วงของคุณ">
            <select className="field" value={stage}
              onChange={(e) => { setStage(e.target.value as ExerciseStage); setIssues([]); setRes(null); }}>
              {STAGES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </Field>

          <Field label="ก่อนหน้านี้ออกกำลังกายสม่ำเสมออยู่แล้วไหม" hint="ใช้ปรับจุดเริ่มต้นให้เหมาะกับคุณ — ไม่ได้ใช้อายุมาคิดคำแนะนำ เพราะแนวทางสากลไม่ได้แยกตามอายุในช่วงวัยเจริญพันธุ์">
            <div className="flex gap-2 text-sm">
              <button onClick={() => setBaseline("active")}
                className={`flex-1 rounded-xl border px-3 py-2 ${baseline === "active" ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>
                ทำอยู่แล้วสม่ำเสมอ
              </button>
              <button onClick={() => setBaseline("sedentary")}
                className={`flex-1 rounded-xl border px-3 py-2 ${baseline === "sedentary" ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>
                ไม่ค่อยได้ออกกำลังกาย
              </button>
            </div>
          </Field>

          {stage === "pregnant" && (
            <div>
              <p className="text-sm font-medium">มีภาวะเหล่านี้อยู่ไหม (เลือกได้มากกว่า 1 ข้อ)</p>
              <p className="mb-2 text-xs text-ink/50">ใช้คัดกรองความปลอดภัยก่อนแนะนำโปรแกรม — ไม่มีก็ข้ามได้เลย</p>
              <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-black/10 bg-white/50 p-2 text-sm">
                {[...ABSOLUTE_CONTRAINDICATIONS, ...RELATIVE_CONTRAINDICATIONS].map((c) => (
                  <label key={c.v} className="flex items-center gap-2">
                    <input type="checkbox" className="accent-teal" checked={issues.includes(c.v)} onChange={() => toggleIssue(c.v)} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button className="btn-primary w-full" onClick={run}>ดูคำแนะนำการออกกำลังกาย</button>
        </div>

        {res && (
          <ResultCard>
            {res.cautionNote && (
              <div className={`mb-3 rounded-xl p-3 text-sm ${res.cautionLevel === "stop" ? "bg-rose-soft text-rose-deep" : "bg-gold/20 text-ink"}`}>
                {res.cautionLevel === "stop" ? "⛔ " : "⚠️ "}{res.cautionNote}
              </div>
            )}

            {res.type.length > 0 && (
              <>
                <p className="text-sm text-ink/60">เป้าหมายต่อสัปดาห์</p>
                <p className="text-lg font-semibold text-teal-deep">{res.weeklyTarget}</p>
                <p className="mt-1 text-xs text-ink/60">{res.frequency}</p>
                <p className="mt-3 text-sm font-medium">ความหนักที่เหมาะกับคุณ</p>
                <p className="text-sm text-ink/70">{res.intensity}</p>
                <p className="mt-3 text-sm font-medium">ประเภทที่แนะนำ</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {res.type.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
              </>
            )}

            {res.avoid && res.avoid.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-rose-deep">ควรเลี่ยง</p>
                <ul className="mt-1 space-y-1 text-xs text-ink/70">
                  {res.avoid.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}

            {res.tips.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium">เกร็ดที่ควรรู้</p>
                <ul className="mt-1 space-y-1 text-xs text-ink/70">
                  {res.tips.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
              </div>
            )}

            {res.evidenceNote && (
              <p className="mt-3 rounded-lg bg-teal/10 p-2 text-xs text-teal-deep">ℹ️ {res.evidenceNote}</p>
            )}

            {res.warningSigns && res.warningSigns.length > 0 && (
              <div className="mt-4 rounded-xl border border-rose/30 bg-rose-soft/40 p-3">
                <p className="text-xs font-semibold text-rose-deep">⚠️ หยุดออกกำลังกายทันทีแล้วติดต่อแพทย์ถ้ามีอาการเหล่านี้</p>
                <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-ink/70">
                  {res.warningSigns.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
            )}

            <details className="mt-3 group">
              <summary className="cursor-pointer list-none text-xs text-ink/50">
                <span className="text-ink/40 group-open:hidden">▸</span>
                <span className="hidden text-ink/40 group-open:inline">▾</span> แหล่งอ้างอิง
              </summary>
              <ul className="mt-1 space-y-1 text-xs text-ink/50">
                {res.sources.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </details>

            <PlanCta />
            <VitaminsCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
