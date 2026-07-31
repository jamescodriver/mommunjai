"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mergeProfile, readProfile, recordTool, setConsentChoice } from "@/lib/profile-store";
import { CONSENT_TEXT, MEDICAL_DISCLAIMER } from "@/lib/disclaimer";
import { Field } from "@/components/ui";
import ReportView from "@/components/report-view";
import type { Report, ReportTier, TeaserSummary } from "@/lib/report";
import {
  ART_PLAN_VALUES, INFERTILITY_ISSUES, mapLegacyArtPlan, artPlanLabel,
  AGE_RANGES, EXERCISE_FREQS, MALE_BEHAVIORS, CONCEPTION_METHODS,
} from "@/lib/calc/vitamins";
import { track } from "@/lib/track";
import { stepsFor, type Step } from "@/lib/plan-steps";

// Stepped questionnaire applying completion mechanics from docs/MOTIVATION-RESEARCH.md §4:
// endowed progress (starts >0), personalize early (name), justify each sensitive question,
// micro-commitment intro, one-topic-per-screen, reveal report as the peak-end moment.
// ⚠️ ลำดับขั้น + กติกาว่า stage ไหนเจอขั้นไหน ย้ายไป lib/plan-steps.ts แล้ว (เพื่อให้เทสต์ได้)

const VALID_STAGES = ["prep", "infertility", "pregnant", "lactating", "male"];
const LINE_OA_URL = process.env.NEXT_PUBLIC_LINE_OA_URL || "https://lin.ee/fBa4xkz";

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanPageInner />
    </Suspense>
  );
}

function PlanPageInner() {
  const params = useSearchParams();
  const rt = params.get("rt");
  const stageParam = params.get("stage");

  const [i, setI] = useState(0);
  // R5 · TC-05-03 — art_plan default "ยัง" (ไม่ใช่ null) ตั้งแต่ต้น เพื่อให้ stage "prep"
  // ที่ไม่ถูกถามคำถามนี้แล้ว ยังบันทึกค่าที่ logic อื่น (report tier/tag/สินค้า) ใช้ได้
  const [form, setForm] = useState<any>({
    contact_channel: "line", art_plan: "ยัง", infertility_issues: [],
    pcos_status: "no", behaviors: [], partner_profile: { behaviors: [] }, has_gdm: false,
  });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ticket: string; tier: ReportTier; report?: Report; teaser?: TeaserSummary } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // R7 fix — the category already chosen on the home page (?stage=) should only
  // skip the redundant "stage" picker screen, never the "intro" consent step.
  // (Previously this jumped straight to index 1 "name", bypassing consent
  // entirely for the primary entry path — caught in QA, see test-report-r2607-r1-r9.html.)
  const [skipStagePicker] = useState(() => !!(stageParam && VALID_STAGES.includes(stageParam)));

  const steps = useMemo(
    () => stepsFor(form.stage, skipStagePicker, form.infertility_issues || []),
    [form.stage, skipStagePicker, form.infertility_issues],
  );

  useEffect(() => {
    // R7 — a device that already answered the consent prompt (via /plan or any
    // standalone tool) carries that choice in; otherwise it stays unanswered
    // and the intro step below asks fresh.
    setConsent(!!readProfile().consent);

    // Resuming via a LINE-menu link (PDF-05/06): fetch what we already know
    // about this customer and skip straight past intro/name/stage. An
    // invalid/expired token just falls back to the normal fresh flow below —
    // never a hard error.
    if (rt) {
      fetch(`/api/customer/resume?rt=${encodeURIComponent(rt)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setForm((f: any) => ({
            ...f,
            nickname: data.nickname ?? f.nickname,
            stage: data.stage ?? f.stage,
            age_range: data.age_range ?? f.age_range,
            has_pcos: data.has_pcos ?? f.has_pcos,
            art_plan: data.art_plan ?? f.art_plan,
            infertility_issues: data.infertility_issues ?? f.infertility_issues,
            height_cm: data.height_cm ?? f.height_cm,
            contact_channel: data.contact_channel ?? f.contact_channel,
            contact_value: data.contact_value ?? f.contact_value,
            weightKg: data.weightKg ?? f.weightKg,
            // R3 batch — ฟิลด์ใหม่ต้อง prefill กลับมาด้วย ไม่งั้นคนที่กลับมาทางลิงก์ LINE
            // ต้องกรอกน้ำหนัก/การนอน/ออกกำลังกาย/ข้อมูลคู่ ใหม่หมดทุกครั้ง
            pcos_status: data.pcos_status ?? f.pcos_status,
            sleep_bedtime: data.sleep_bedtime ?? f.sleep_bedtime,
            sleep_waketime: data.sleep_waketime ?? f.sleep_waketime,
            exercise_freq: data.exercise_freq ?? f.exercise_freq,
            behaviors: data.behaviors?.length ? data.behaviors : f.behaviors,
            partner_profile: data.partner_profile && Object.keys(data.partner_profile).length
              ? { behaviors: [], ...data.partner_profile }
              : f.partner_profile,
            conception_method: data.conception_method ?? f.conception_method,
            gestational_weeks: data.gestational_weeks ?? f.gestational_weeks,
            has_gdm: data.has_gdm ?? f.has_gdm,
          }));
          // Resuming from a LINE ticket implies they consented once already.
          setConsent(true);
          setConsentChoice(true);
          if (data.stage) mergeProfile({ stage: data.stage, hasPcos: data.has_pcos, artPlan: data.art_plan, weightKg: data.weightKg });
          for (const [tool, r2] of Object.entries<any>(data.tools || {})) recordTool(tool, r2.input, r2.output);
          setI(stepsFor(data.stage, true, data.infertility_issues || []).indexOf("health"));
        })
        .catch(() => {});
      return;
    }

    const p = readProfile();
    const presetStage = stageParam && VALID_STAGES.includes(stageParam) ? stageParam : p.stage || "prep";
    setForm((f: any) => ({
      ...f,
      stage: presetStage,
      has_pcos: p.hasPcos,
      art_plan: mapLegacyArtPlan(p.artPlan),
      weightKg: p.weightKg,
      interests: p.interests || [],
    }));
    // Category already picked on the home page — the "stage" step is filtered
    // out of `steps` via skipStagePicker above, but intro/consent still shows
    // first (index 0) like any other entry into /plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const step: Step = steps[i] ?? steps[steps.length - 1];
  // endowed progress: never start at 0 — intro already counts as a step done
  const progress = Math.round(((i + 1) / steps.length) * 100);

  const next = () => { setErr(null); setI((x) => Math.min(x + 1, steps.length - 1)); };
  const back = () => setI((x) => Math.max(x - 1, 0));

  const toggleIssue = (v: string) => {
    setForm((f: any) => {
      const cur: string[] = f.infertility_issues || [];
      let issues: string[];
      if (v === "unsure") {
        // "ไม่แน่ใจ" is exclusive — picking it clears everything else, and vice versa.
        issues = cur.includes("unsure") ? [] : ["unsure"];
      } else {
        issues = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => x !== "unsure"), v];
      }
      // R4 — เลิกล้างส่วนสูงเมื่อเอา "น้ำหนักเกิน" ออกแล้ว: ตอนนี้ถามส่วนสูงกับทุกคน
      // ในขั้น health (จำเป็นสำหรับ BMI ใน R13) ไม่ได้ผูกกับเช็กบ็อกซ์นี้อีกต่อไป
      return { ...f, infertility_issues: issues };
    });
  };

  // R4 · TC-04-04 — PCOS เป็น 2 ช่องแยกกันแต่เลือกได้ทีละอัน (ติ๊กอันหนึ่งอีกอันหลุด)
  // has_pcos เดิมถูกเขียนคู่ไว้ตลอด เพื่อให้ข้อมูล/logic เก่าทำงานเหมือนเดิม
  const setPcos = (v: "yes" | "unsure") =>
    setForm((f: any) => {
      const next = f.pcos_status === v ? "no" : v;
      return { ...f, pcos_status: next, has_pcos: next === "yes" };
    });

  const setPartner = (k: string, v: any) =>
    setForm((f: any) => ({ ...f, partner_profile: { ...(f.partner_profile || {}), [k]: v } }));

  const toggleBehavior = (key: "behaviors" | "partner", v: string) =>
    setForm((f: any) => {
      const cur: string[] = (key === "behaviors" ? f.behaviors : f.partner_profile?.behaviors) || [];
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      return key === "behaviors"
        ? { ...f, behaviors: next }
        : { ...f, partner_profile: { ...(f.partner_profile || {}), behaviors: next } };
    });

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
        body: JSON.stringify({ ...form, consent: true, consent_text: CONSENT_TEXT, tools: p.tools || {}, resume_token: rt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      track("lead_submit", { stage: form.stage, has_pcos: !!form.has_pcos, art_plan: form.art_plan, tier: data.tier });
      setResult({ ticket: data.ticket_code, tier: data.tier, report: data.report, teaser: data.teaser });
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  // ---- reveal the result (peak-end moment) ----
  if (result) {
    // R6 — only "full" tier renders the complete 90-day report inline; teaser/medium
    // get a short summary + a prominent hand-off to LINE OA for the full plan.
    if (result.tier === "full" && result.report) {
      return (
        <main>
          <div className="mx-auto max-w-2xl px-4 pt-6 text-center">
            <div className="glass-strong p-5">
              <div className="text-3xl">🎉</div>
              <p className="mt-1 text-sm">แผนของคุณพร้อมแล้ว! เก็บรหัสนี้ไปคุยต่อกับทีม Baby & Mom ใน LINE OA เพื่อรับคำแนะนำเฉพาะคุณ</p>
              <div className="mx-auto my-3 w-fit rounded-2xl border-2 border-dashed border-teal bg-teal-soft px-6 py-2 text-2xl font-bold tracking-widest text-teal-deep">{result.ticket}</div>
              <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(result.ticket)}>คัดลอกรหัส</button>
            </div>
          </div>
          <ReportView report={result.report} code={result.ticket} />
        </main>
      );
    }

    const t = result.teaser;
    return (
      <main className="mx-auto w-full max-w-2xl space-y-4 p-4 pt-6 sm:p-6">
        <div className="glass-strong p-5 text-center">
          <div className="text-3xl">🎉</div>
          <p className="mt-1 text-sm">เราดูคำตอบของคุณแล้ว! เก็บรหัสนี้ไว้คุยต่อกับทีม Baby &amp; Mom ใน LINE OA เพื่อรับแผนบำรุง 90 วันฉบับเต็มค่ะ</p>
          <div className="mx-auto my-3 w-fit rounded-2xl border-2 border-dashed border-teal bg-teal-soft px-6 py-2 text-2xl font-bold tracking-widest text-teal-deep">{result.ticket}</div>
          <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(result.ticket)}>คัดลอกรหัส</button>
        </div>

        {t && (
          <>
            <section className="glass p-5">
              <h2 className="text-base font-semibold">จุดที่ควรเสริมก่อน 🌱</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {t.weakestPillars.map((p, idx) => (
                  <li key={idx}>• <b>{p.label}</b>{p.note ? `: ${p.note}` : ""}</li>
                ))}
              </ul>
            </section>
            <section className="glass p-5">
              <h2 className="text-base font-semibold">แนะนำเบื้องต้นสำหรับคุณ 💊</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {t.recommendedProducts.map((p) => (
                  <li key={p.id}>• <b>{p.name}</b> — {p.why}</li>
                ))}
              </ul>
            </section>
            <section className="glass-strong p-5 text-center">
              <p className="text-sm font-medium">{t.quickWinToday}</p>
            </section>
          </>
        )}

        {/* 🔒 Lucifer red-team 31/7 — คำเตือน + referral ตามอายุ ต้องอยู่ **เหนือ** ปุ่มขาย
            teaser คือ tier ที่คนส่วนใหญ่เห็น (prep/lactating เป็น teaser เสมอหลัง R5/R11)
            ถ้าไม่มีบล็อกนี้ ผู้หญิงอายุ 40+ จะเห็นสินค้า 3 ตัว + ปุ่มซื้อ โดยไม่เคยเห็นประโยค
            "พบแพทย์ผู้เชี่ยวชาญได้เลย ไม่ต้องรอ" = H2 ที่เคยแก้ไปรอบแรกถอยหลังกลับ */}
        {t?.cautions && t.cautions.length > 0 && (
          <section className="rounded-xl border border-rose/30 bg-rose-soft/40 p-4">
            <p className="text-xs font-semibold text-rose-deep">⚠️ ต้องรู้ก่อนเริ่ม</p>
            <ul className="mt-1 space-y-1 text-xs text-ink/70">
              {t.cautions.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </section>
        )}
        <p className="text-xs leading-relaxed text-ink/60">⚠️ {MEDICAL_DISCLAIMER}</p>

        <a className="btn-primary w-full" href={LINE_OA_URL} target="_blank" rel="noreferrer" onClick={() => track("line_click", { code: result.ticket, tier: result.tier })}>
          💛 รับแผนบำรุง 90 วันฉบับเต็ม ผ่าน LINE OA
        </a>
        <p className="text-center text-xs text-ink/50">พิมพ์รหัส {result.ticket} ในแชท หรือกด “แผนของฉัน” ในเมนู LINE เพื่อรับแผนเต็มพร้อมราคา</p>
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
        {i < steps.length - 1 ? `อีก ${steps.length - 1 - i} ขั้นตอน รับแผน 90 วันของคุณ` : "ขั้นตอนสุดท้าย!"}
      </p>

      <div className="glass mt-3 p-5 sm:p-7">
        {step === "intro" && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">💛</div>
            <h1 className="text-xl font-semibold">แผน 90 วัน มั่นใจก่อนมีลูก — ฉบับของคุณ</h1>
            <p className="text-sm text-ink/70">ตอบไม่กี่ข้อ แล้วเราจะทำ <b>แผนบำรุง 90 วันเฉพาะคุณ</b> ให้ทันที (ทั้งไข่และอสุจิใช้เวลาพัฒนาจนสมบูรณ์ขึ้นราว 90 วัน การเริ่มดูแลวันนี้จึงช่วยสนับสนุนการเตรียมพร้อม)</p>
            {/* R7 — consent moved here, first, instead of the old last "contact" step */}
            <label className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-left text-xs text-ink/70">
              <input
                type="checkbox"
                className="mt-0.5 accent-teal"
                checked={consent}
                onChange={(e) => { setConsent(e.target.checked); setConsentChoice(e.target.checked); }}
              />
              <span>{CONSENT_TEXT} (<Link href="/privacy" className="underline">อ่านนโยบาย</Link>)</span>
            </label>
            <button className="btn-primary w-full" onClick={next}>พร้อมลงมือ 90 วัน เริ่มเลย</button>
            <p className="text-xs text-ink/50">ใช้เวลาไม่ถึง 2 นาที · ตอบไม่ยินยอมก็ยังใช้เครื่องมือคำนวณได้ตามปกติ</p>
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
              {[["prep", "เตรียมตั้งครรภ์"], ["infertility", "มีบุตรยาก"], ["pregnant", "ตั้งครรภ์แล้ว"], ["lactating", "ให้นมบุตร"], ["male", "ฝ่ายชาย"]].map(([v, l]) => (
                <button key={v} onClick={() => setForm((f: any) => ({ ...f, stage: v, ...(v === "male" ? { has_pcos: false, pcos_status: "no", infertility_issues: [] } : {}) }))} className={`rounded-xl border px-3 py-3 ${form.stage === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{l}</button>
              ))}
            </div>
            <p className="rounded-lg bg-teal/10 p-2 text-xs text-teal-deep">💡 รู้ไหมคะ? การบำรุงล่วงหน้าอย่างน้อย 3 เดือนช่วยสนับสนุนการเตรียมความพร้อมของร่างกาย</p>
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ต่อไป</button></div>
          </div>
        )}

        {step === "issues" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ตอนนี้มีเรื่องไหนที่ตรงกับคุณบ้าง?</h2>
            <p className="text-xs text-ink/50">เลือกได้มากกว่า 1 ข้อ เพื่อให้เราแนะนำตัวช่วยที่ตรงปัญหาจริง</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {INFERTILITY_ISSUES.map((it) => (
                <label key={it.v} className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer ${(form.infertility_issues || []).includes(it.v) ? "border-teal bg-teal/10" : "border-black/10 bg-white/60"}`}>
                  <input type="checkbox" className="accent-teal" checked={(form.infertility_issues || []).includes(it.v)} onChange={() => toggleIssue(it.v)} />
                  {it.label}
                </label>
              ))}
            </div>
            {/* R4 — ส่วนสูงย้ายไปถามที่ขั้น "เล่าเรื่องสุขภาพ" กับทุกคนแล้ว (ไม่ผูกกับ "น้ำหนักเกิน") */}
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ต่อไป</button></div>
          </div>
        )}

        {step === "health" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">เล่าเรื่องสุขภาพอีกนิดนะคะ</h2>
            <p className="text-xs text-ink/50">ถามเพื่อปรับแผนและการแนะนำวิตามินให้ตรงกับคุณโดยเฉพาะ — ไม่เปิดเผยให้ใคร</p>
            <Field label="ช่วงอายุ">
              <select className="field" value={form.age_range || ""} onChange={(e) => set("age_range", e.target.value)}>
                <option value="">ไม่ระบุ</option>
                {AGE_RANGES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>

            {/* R4 · TC-04-01 — น้ำหนัก + ส่วนสูง ถามทุก stage (เดิมถามส่วนสูงเฉพาะคนที่ติ๊ก
                "น้ำหนักเกิน") เพราะ R13 ต้องแสดงตัวเลข BMI ให้เจ้าตัวเห็น */}
            <div className="grid grid-cols-2 gap-2">
              <Field label={form.stage === "pregnant" ? "น้ำหนักปัจจุบัน (กก.)" : "น้ำหนัก (กก.)"}>
                <input type="number" inputMode="decimal" className="field" value={form.weightKg ?? ""} placeholder="เช่น 55"
                  onChange={(e) => set("weightKg", e.target.value === "" ? undefined : +e.target.value)} />
              </Field>
              <Field label="ส่วนสูง (ซม.)">
                <input type="number" inputMode="numeric" className="field" value={form.height_cm ?? ""} placeholder="เช่น 160"
                  onChange={(e) => set("height_cm", e.target.value === "" ? undefined : +e.target.value)} />
              </Field>
            </div>

            {/* R4 · TC-04-02 — เวลานอน 2 ช่อง (เข้านอน/ตื่น) */}
            <div className="grid grid-cols-2 gap-2">
              <Field label="ปกติเข้านอนกี่โมง">
                <input type="time" className="field" value={form.sleep_bedtime || ""} onChange={(e) => set("sleep_bedtime", e.target.value)} />
              </Field>
              <Field label="ตื่นกี่โมง">
                <input type="time" className="field" value={form.sleep_waketime || ""} onChange={(e) => set("sleep_waketime", e.target.value)} />
              </Field>
            </div>

            {/* R4 · TC-04-03 */}
            <Field label="ออกกำลังกายบ่อยแค่ไหน">
              <select className="field" value={form.exercise_freq || ""} onChange={(e) => set("exercise_freq", e.target.value)}>
                <option value="">ไม่ระบุ</option>
                {EXERCISE_FREQS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
              </select>
            </Field>

            {/* R4 · TC-04-04/05 — PCOS แยก 2 ช่อง (เลือกได้ทีละอัน)
                "ไม่แน่ใจ" จะไม่ได้ PCO-VIT แต่ได้ข้อความชวนไปตรวจยืนยันแทน
                R2 — stage "มีบุตรยาก" ใช้เช็กลิสต์ข้างบนแทนช่องนี้ */}
            {form.stage !== "male" && form.stage !== "infertility" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">ภาวะ PCOS (ถุงน้ำรังไข่)</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-teal" checked={form.pcos_status === "yes"} onChange={() => setPcos("yes")} /> มีภาวะ PCOS
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-teal" checked={form.pcos_status === "unsure"} onChange={() => setPcos("unsure")} /> ไม่แน่ใจ
                </label>
                {form.pcos_status === "unsure" && (
                  <p className="rounded-lg bg-teal/10 p-2 text-xs text-teal-deep">เดี๋ยวเราจะแนะนำวิธีตรวจยืนยันกับแพทย์ให้ในแผนนะคะ (ยังไม่แนะนำวิตามินเฉพาะกลุ่ม PCOS จนกว่าจะรู้ผลชัด)</p>
                )}
              </div>
            )}

            {/* R6 · TC-06-01/02 — ฝ่ายชายได้ฟิลด์สุขภาพชุดเดียวกับหญิง + พฤติกรรม 3 ข้อ */}
            {form.stage === "male" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">มีข้อไหนตรงกับคุณบ้าง (เลือกได้หลายข้อ)</p>
                {MALE_BEHAVIORS.map((b) => (
                  <label key={b.v} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-teal" checked={(form.behaviors || []).includes(b.v)}
                      onChange={() => toggleBehavior("behaviors", b.v)} /> {b.label}
                  </label>
                ))}
                <p className="text-xs text-ink/50">ถามเพราะทั้ง 3 เรื่องนี้มีผลต่อคุณภาพอสุจิโดยตรง — เราจะเลือกตัวบำรุงให้ตรงจุด</p>
              </div>
            )}

            {/* R9 · TC-09-02 — เฉพาะแม่ตั้งครรภ์ */}
            {form.stage === "pregnant" && (
              <>
                <Field label="อายุครรภ์ (สัปดาห์)">
                  <input type="number" inputMode="numeric" className="field" value={form.gestational_weeks ?? ""} placeholder="เช่น 20"
                    onChange={(e) => set("gestational_weeks", e.target.value === "" ? undefined : +e.target.value)} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-teal" checked={!!form.has_gdm} onChange={(e) => set("has_gdm", e.target.checked)} />
                  มีภาวะเบาหวานขณะตั้งครรภ์
                </label>
                {form.has_gdm && (
                  // 🔒 legal-compliance §4 — ห้ามให้คำแนะนำที่ทำให้ชะลอการพบแพทย์
                  <p className="rounded-lg bg-rose-soft/60 p-2 text-xs text-rose-deep">ภาวะนี้ต้องอยู่ในการดูแลของแพทย์/นักโภชนาการที่ดูแลครรภ์ของคุณนะคะ แผนนี้เป็นข้อมูลประกอบเท่านั้น และอาหารเสริมทุกตัวให้ปรึกษาแพทย์ก่อนเสมอ</p>
                )}
              </>
            )}

            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ต่อไป</button></div>
          </div>
        )}

        {/* R7 · TC-07-02 — ฟอร์มฝ่ายชาย (ข้อมูลของ "คู่" ไม่ใช่ของผู้กรอก)
            เก็บลง partner_profile แยกก้อน ห้ามเขียนทับน้ำหนัก/ส่วนสูงของผู้หญิง */}
        {step === "partner" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ขอข้อมูลของคุณสามีหน่อยนะคะ</h2>
            <p className="text-xs text-ink/50">คุณติ๊กว่ามีปัญหาจากฝ่ายชาย — ข้อมูลชุดนี้เป็นของเขา (คนละส่วนกับข้อมูลของคุณ) เพื่อให้เราแนะนำตัวบำรุงฝ่ายชายได้ตรงจริง</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="น้ำหนัก (กก.)">
                <input type="number" inputMode="decimal" className="field" value={form.partner_profile?.weight_kg ?? ""} placeholder="เช่น 70"
                  onChange={(e) => setPartner("weight_kg", e.target.value === "" ? undefined : +e.target.value)} />
              </Field>
              <Field label="ส่วนสูง (ซม.)">
                <input type="number" inputMode="numeric" className="field" value={form.partner_profile?.height_cm ?? ""} placeholder="เช่น 175"
                  onChange={(e) => setPartner("height_cm", e.target.value === "" ? undefined : +e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="เข้านอนกี่โมง">
                <input type="time" className="field" value={form.partner_profile?.sleep_bedtime || ""} onChange={(e) => setPartner("sleep_bedtime", e.target.value)} />
              </Field>
              <Field label="ตื่นกี่โมง">
                <input type="time" className="field" value={form.partner_profile?.sleep_waketime || ""} onChange={(e) => setPartner("sleep_waketime", e.target.value)} />
              </Field>
            </div>
            <Field label="ออกกำลังกายบ่อยแค่ไหน">
              <select className="field" value={form.partner_profile?.exercise_freq || ""} onChange={(e) => setPartner("exercise_freq", e.target.value)}>
                <option value="">ไม่ระบุ</option>
                {EXERCISE_FREQS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
              </select>
            </Field>
            <div className="space-y-2">
              <p className="text-sm font-medium">มีข้อไหนตรงกับเขาบ้าง (เลือกได้หลายข้อ)</p>
              {MALE_BEHAVIORS.map((b) => (
                <label key={b.v} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-teal" checked={(form.partner_profile?.behaviors || []).includes(b.v)}
                    onChange={() => toggleBehavior("partner", b.v)} /> {b.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ต่อไป</button></div>
          </div>
        )}

        {/* R9 · TC-09-01/03 — ตัวเลือกมาจาก CONCEPTION_METHODS ที่เดียว เติมข้อ 3 ได้ทันที */}
        {step === "conception" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ท้องนี้ตั้งครรภ์ด้วยวิธีไหนคะ?</h2>
            <p className="text-xs text-ink/50">ถามเพื่อจัดคำแนะนำการดูแลครรภ์ให้เข้ากับจังหวะของคุณ</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {CONCEPTION_METHODS.map((v) => (
                <button key={v} onClick={() => set("conception_method", v)}
                  className={`rounded-xl border px-3 py-3 ${form.conception_method === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{v}</button>
              ))}
            </div>
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ต่อไป</button></div>
          </div>
        )}

        {step === "art" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">เข้าสู่กระบวนการทางการแพทย์ไหมคะ?</h2>
            <p className="text-xs text-ink/50">
              {form.stage === "male"
                ? "ถามเพื่อจัดแผนบำรุงอสุจิให้เข้ากับจังหวะการรักษาของคู่ (ถ้ามี)"
                : "ถามเพื่อจัดแผนบำรุงไข่/ผนังมดลูกให้เข้ากับจังหวะการรักษา (ถ้ามี)"}
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {ART_PLAN_VALUES.map((v) => (
                // R8 · TC-08-02 — เปลี่ยนแค่ป้ายที่แสดง ค่าที่เก็บยังเป็น v เดิม
                <button key={v} onClick={() => set("art_plan", v)} className={`rounded-xl border px-2 py-2 ${form.art_plan === v ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>{artPlanLabel(v)}</button>
              ))}
            </div>
            <p className="rounded-lg bg-teal/10 p-2 text-xs text-teal-deep">อีกขั้นเดียว เราจะสร้างแผน 90 วันของคุณให้เลยค่ะ ✨</p>
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={back}>ย้อน</button><button className="btn-primary flex-1" onClick={next}>ขั้นสุดท้าย</button></div>
          </div>
        )}

        {step === "contact" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">รับแผนของคุณได้เลย 🎁</h2>
            <Field label="ช่องทางให้ทีม Baby & Mom ติดต่อกลับ *" hint="เพื่อส่งแผนและให้คำแนะนำเฉพาะคุณ">
              <div className="flex gap-2">
                <select className="field !w-24" value={form.contact_channel} onChange={(e) => set("contact_channel", e.target.value)}>
                  <option value="line">LINE</option><option value="phone">โทร</option>
                </select>
                <input className="field" value={form.contact_value || ""} onChange={(e) => set("contact_value", e.target.value)} placeholder="LINE ID / เบอร์" />
              </div>
            </Field>
            {/* R7 — consent already asked at "intro"; only shown again here if they hadn't agreed yet */}
            {!consent ? (
              <label className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs text-ink/70">
                <input type="checkbox" className="mt-0.5 accent-teal" checked={consent} onChange={(e) => { setConsent(e.target.checked); setConsentChoice(e.target.checked); }} />
                <span>{CONSENT_TEXT} (<Link href="/privacy" className="underline">อ่านนโยบาย</Link>)</span>
              </label>
            ) : (
              <p className="text-xs text-teal-deep">✓ คุณให้ความยินยอมแล้วตอนเริ่มต้นค่ะ</p>
            )}
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
