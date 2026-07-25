"use client";
import { useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { bedtimesForWake, assessSleep } from "@/lib/calc/sleep";
import { recordTool } from "@/lib/profile-store";
import { ToolShell, ResultCard, Field, PlanCta, EmbedAutoResize } from "@/components/ui";

export default function SleepPage() {
  const embed = useEmbed();
  const [mode, setMode] = useState<"A" | "B">("A");
  const [wake, setWake] = useState("06:30");
  const [bed, setBed] = useState("22:00");
  const [aRes, setARes] = useState<ReturnType<typeof bedtimesForWake> | null>(null);
  const [bRes, setBRes] = useState<ReturnType<typeof assessSleep> | null>(null);

  const runA = () => { const r = bedtimesForWake(wake); setARes(r); if (!("error" in r)) recordTool("sleep", { mode: "A", wake }, r); };
  const runB = () => { const r = assessSleep(bed, wake); setBRes(r); if (!("error" in r)) recordTool("sleep", { mode: "B", bed, wake }, r); };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} emoji="🌙" title="คำนวณการนอน"
        intro="ครูก้อยแนะนำให้เข้านอนก่อน 4 ทุ่ม (22:00) เพราะเป็นช่วงที่ฮอร์โมนซ่อมแซมร่างกายทำงานดีที่สุด">
        <div className="mb-4 flex gap-2">
          <button className={mode === "A" ? "btn-primary flex-1" : "btn-ghost flex-1"} onClick={() => setMode("A")}>หาเวลานอนที่ดี</button>
          <button className={mode === "B" ? "btn-primary flex-1" : "btn-ghost flex-1"} onClick={() => setMode("B")}>ประเมินการนอนจริง</button>
        </div>

        {mode === "A" ? (
          <div className="space-y-4">
            <Field label="ฉันต้องตื่นเวลา"><input type="time" className="field" value={wake} onChange={(e) => setWake(e.target.value)} /></Field>
            <button className="btn-primary w-full" onClick={runA}>แนะนำเวลาเข้านอน</button>
            {aRes && "error" in aRes && <ResultCard><p className="text-rose-deep">{aRes.error}</p></ResultCard>}
            {aRes && "bedtimes" in aRes && (
              <ResultCard>
                <p className="text-sm text-ink/60">เพื่อตื่นสดชื่นที่ {wake} ควรเข้านอนเวลา:</p>
                <div className="mt-2 flex gap-3">
                  {aRes.bedtimes.map((b, i) => (
                    <div key={b} className="flex-1 rounded-xl bg-teal/10 p-3 text-center">
                      <div className="text-xl font-semibold">{b}</div>
                      <div className="text-xs text-ink/60">{i === 0 ? "9 ชม." : "7.5 ชม."}</div>
                    </div>
                  ))}
                </div>
                <PlanCta />
              </ResultCard>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="เข้านอน"><input type="time" className="field" value={bed} onChange={(e) => setBed(e.target.value)} /></Field>
              <Field label="ตื่น"><input type="time" className="field" value={wake} onChange={(e) => setWake(e.target.value)} /></Field>
            </div>
            <button className="btn-primary w-full" onClick={runB}>ประเมิน</button>
            {bRes && "error" in bRes && <ResultCard><p className="text-rose-deep">{bRes.error}</p></ResultCard>}
            {bRes && "hours" in bRes && (
              <ResultCard>
                <div className="text-center">
                  <p className="text-sm text-ink/60">คุณนอน</p>
                  <p className="text-2xl font-semibold text-teal-deep">{bRes.hours} ชั่วโมง</p>
                  <span className={`chip mt-1 ${bRes.status === "ดี" ? "" : "!bg-gold/20 !text-gold !border-gold/30"}`}>{bRes.status}</span>
                </div>
                {bRes.notes.length > 0 && (
                  <ul className="mt-3 list-disc pl-5 text-xs text-ink/70 space-y-1">
                    {bRes.notes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                )}
                <PlanCta />
              </ResultCard>
            )}
          </div>
        )}
      </ToolShell>
    </>
  );
}
