"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readProfile } from "@/lib/profile-store";
import { CONSENT_TEXT } from "@/lib/disclaimer";
import { Field } from "@/components/ui";
import ReportView from "@/components/report-view";
import type { Report } from "@/lib/report";
import { track } from "@/lib/track";

// Stepped questionnaire applying completion mechanics from docs/MOTIVATION-RESEARCH.md §4:
// endowed progress (starts >0), personalize early (name), justify each sensitive question,
// micro-commitment intro, one-topic-per-screen, reveal report as the peak-end moment.
const STEPS = ["intro", "name", "stage", "health", "art", "contact"] as const;
type Step = (typeof STEPS)[number];

export default function PlanPage() {
  const [i, setI] = useState(0);
  const [form, setForm] = useState<any>({ contact_channel: "line", art_plan: "none" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ticket: string; report: Report } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const p = readProfile();
    setForm((f: any) => ({ ...f, stage: p.stage || "prep", has_pcos: p.hasPcos, art_plan: p.artPlan || "none", weightKg: p.weightKg, interests: p.interests || [] }));
  }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const step: Step = STEPS[i];
  // endowed progress: never start at 0 — intro already counts as a step done
  const progress = Math.round(((i + 1) / STEPS.length) * 100);

  const next = () => { setErr(null); setI((x) => Math.min(x + 1, STEPS.length - 1)); };
  const back = () => setI((x) => Math.max(x - 1, 0));

  const submit = async () => {
    setErr(null);
    if (!form.nickname) return setErr("ขอชื่อเล่นสักนิดนะคะ");
    if (!form.contact_value) return setErr("กรุณาระบุช่องทางติดต่อ");
    if (!consent) return setErr("กรุณายินยอมก่อนบันทึกข้อมูล");
    setLoading(true);
    try {
      const p = readProfile();
      const res = await fetch("/api/lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consent: true, consent_text: CONSENT_TEXT, tools: p.tools || {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      track("lead_submit", { stage: form.stage, has_pcos: !!form.has_pcos, art_plan: form.art_plan });
      setResult({ ticket: data.ticket_code, report: data.report });
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  // ---- reveal the report (peak-end moment) ----
  if (result) {
    return (
      <main>
        <div className="mx-auto max-w-2xl px-4 pt-6 text-center">
          <div className="glass-strong p-5">
            <div className="text-3xl">🎉</div>
            <p className="mt-1 text-sm">แผนของคุณพร้อมแล้ว! เก็บรหัสนี้ไปคุยต่อกับทีมครูก้อยใน LINE OA เพื่อรับคำแนะนำเฉพาะคุณ</p>
            <div className="mx-auto my-3 w-fit rounded-2xl border-2 border-dashed border-teal bg-teal-soft px-6 py-2 text-2xl font-bold tracking-widest text-teal-deep">{result.ticket}</div>
            <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(result.ticket)}>คัดลอกรหัส</button>
          </div>
        </div>
        <ReportView report={result.report} code={result.ticket} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md p-4 sm:p-6">
      <Link href="/" className="text-sm text-teal-deep">← กลับหน้าหลัก</Link>

      {/* endowed progress */}
      <div className="mt-3 h-2 rounded-full bg-black/5">
        <div className="h-2 rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-ink/50">
        {i < STEPS.length - 1 ? `อีก ${STEPS.length - 1 - i} ขั้นตอน รับแผน 90 วันของคุณ` : "ขั้นตอนสุดท้าย!"}
      </p>

      <div className="glass mt-3 p-5 sm:p-7">
        {step === "intro" && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">💛</div>
            <h1 className="text-xl font-semibold">แผน 90 วัน มั่นใจก่อนมีลูก — ฉบับของคุณ</h1>
            <p className="text-sm text-ink/70">ตอบไม่กี่ข้อ แล้วครูก้อยจะทำ <b>แผนบำรุง 90 วันเฉพาะคุณ</b> ให้ทันที (ทั้งไข่และอสุจิใช้เวลาสุกราว 90 วัน การเริ่มดูแลวันนี้จึงช่วยสนับสนุนการเตรียมพร้อม)</p>
            <button className="btn-primary w-full" onClick={next}>พร้อมลงมือ 90 วัน เริ่มเลย</button>
            <p className="text-xs text-ink/50">ใช้เวลาไม่ถึง 2 นาที · ข้อมูลของคุณถูกเก็บอย่างปลอดภัย</p>
          </div>
        )}

        {step === "name" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">เรียกคุณว่าอะไรดีคะ?</h2>
            <p className="text-xs text-ink/50">เราจะใส่ชื่อคุณในแผน เพื่อให้เป็นของคุณจริง ๆ</p>
            <input className="field" autoFocus value={form.nickname || ""} onChange={(e) => set("nickname", e.target.value)} placeholder="ชื่อเล่น" />
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={() => form.nickname ? next() : setErr("ขอชื่อเล่นสักนิดนะคะ")}>ต่อไป</button></div>
          </div>
        )}

        {step === "stage" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ตอนนี้คุณ{form.nickname ? ` ${form.nickname}` : ""}อยู่ช่วงไหน?</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[["prep", "เตรียมตั้งครรภ์"], ["infertility", "มีบุตรยาก"], ["pregnant", "ตั้งครรภ์แล้ว"], ["male", "ฝ่ายชาย"]].map(([v, l]) => (
                <button key={v} onClick={() => setForm((f: any) => ({ ...f, stage: v, ...(v === "male" ? { has_pcos: false } : {}) }))} className={`rounded-xl border px-3 py-3 ${form.stage === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{l}</button>
              ))}
            </div>
            <p className="rounded-lg bg-teal/10 p-2 text-xs text-teal-deep">💡 รู้ไหมคะ? การบำรุงล่วงหน้าอย่างน้อย 3 เดือนช่วยสนับสนุนการเตรียมความพร้อมของร่างกาย</p>
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ต่อไป</button></div>
          </div>
        )}

        {step === "health" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">เล่าเรื่องสุขภาพอีกนิดนะคะ</h2>
            <p className="text-xs text-ink/50">ถามเพื่อปรับแผนและการแนะนำวิตามินให้ตรงกับคุณโดยเฉพาะ — ไม่เปิดเผยให้ใคร</p>
            <Field label="ช่วงอายุ">
              <select className="field" value={form.age_range || ""} onChange={(e) => set("age_range", e.target.value)}>
                <option value="">ไม่ระบุ</option><option>ต่ำกว่า 30</option><option>30–34</option><option>35–39</option><option>40+</option>
              </select>
            </Field>
            {form.stage !== "male" && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal" checked={!!form.has_pcos} onChange={(e) => set("has_pcos", e.target.checked)} /> มีภาวะ PCOS / ไม่แน่ใจ</label>
            )}
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ต่อไป</button></div>
          </div>
        )}

        {step === "art" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">มีแผนใช้เทคโนโลยีช่วยไหมคะ?</h2>
            <p className="text-xs text-ink/50">
              {form.stage === "male"
                ? "ถามเพื่อจัดแผนบำรุงอสุจิให้เข้ากับจังหวะการรักษาของคู่ (ถ้ามี)"
                : "ถามเพื่อจัดแผนบำรุงไข่/ผนังมดลูกให้เข้ากับจังหวะการรักษา (ถ้ามี)"}
            </p>
            <div className="grid grid-cols-4 gap-2 text-sm">
              {[["none", "ยังไม่"], ["iui", "IUI"], ["ivf", "IVF"], ["icsi", "ICSI"]].map(([v, l]) => (
                <button key={v} onClick={() => set("art_plan", v)} className={`rounded-xl border px-2 py-2 ${form.art_plan === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{l}</button>
              ))}
            </div>
            <p className="rounded-lg bg-teal/10 p-2 text-xs text-teal-deep">อีกขั้นเดียว เราจะสร้างแผน 90 วันของคุณให้เลยค่ะ ✨</p>
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ขั้นสุดท้าย</button></div>
          </div>
        )}

        {step === "contact" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">รับแผนของคุณได้เลย 🎁</h2>
            <Field label="ช่องทางให้ทีมครูก้อยติดต่อกลับ *" hint="เพื่อส่งแผนและให้คำแนะนำเฉพาะคุณ">
              <div className="flex gap-2">
                <select className="field !w-24" value={form.contact_channel} onChange={(e) => set("contact_channel", e.target.value)}>
                  <option value="line">LINE</option><option value="phone">โทร</option>
                </select>
                <input className="field" value={form.contact_value || ""} onChange={(e) => set("contact_value", e.target.value)} placeholder="LINE ID / เบอร์" />
              </div>
            </Field>
            <label className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs text-ink/70">
              <input type="checkbox" className="mt-0.5 accent-teal" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{CONSENT_TEXT} (<Link href="/privacy" className="underline">อ่านนโยบาย</Link>)</span>
            </label>
            {err && <p className="text-sm text-rose-deep">{err}</p>}
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={back}>ย้อน</button>
              <button className="btn-primary flex-1" onClick={submit} disabled={loading}>{loading ? "กำลังสร้างแผน…" : "รับแผน 90 วันของฉัน"}</button>
            </div>
          </div>
        )}
        {err && step !== "contact" && <p className="mt-3 text-sm text-rose-deep">{err}</p>}
      </div>
    </main>
  );
}
