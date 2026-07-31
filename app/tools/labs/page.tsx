"use client";
import { useEffect, useState } from "react";
import { useEmbed } from "@/components/use-embed";
import {
  FEMALE_HORMONES, ENDOMETRIAL_NOTE, AFC_NOTE,
  SEMEN_PARAMS, SEMEN_REFERENCE_CAVEAT, SEMEN_COLOR, SEMEN_COLOR_CAVEAT,
  HORMONE_SPERM_RELATIONSHIP, LAB_REFERENCE_DISCLAIMER,
} from "@/lib/calc/labs";
import { readProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, PlanCta, EmbedAutoResize } from "@/components/ui";
import { IconClipboard } from "@/components/icons";
import AdminHandoffCta from "@/components/admin-handoff-cta";

type Tab = "female" | "male";

// R10 — purely educational; no "จองตรวจ"/discount code/GFC-specific referral
// here (that stays blocked pending a business partnership — see PDF-18 in
// docs/IMPACT-ANALYSIS-2607.md). Every value traces back to
// docs/LAB-HORMONE-RESEARCH-BRIEF.md — see that file before editing content.
export default function LabsPage() {
  const embed = useEmbed();
  const [tab, setTab] = useState<Tab>("female");

  useEffect(() => {
    const p = readProfile();
    if (p.stage === "male") setTab("male");
  }, []);

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} icon={<IconClipboard />} title="ตรวจร่างกาย — ควรตรวจอะไรบ้าง"
        intro="ความรู้เบื้องต้นเรื่องค่าตรวจที่เกี่ยวข้องกับการเตรียมความพร้อม ไม่ใช่การวินิจฉัยหรือแนะนำให้ต้องไปตรวจที่ใดที่หนึ่ง">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <button onClick={() => setTab("female")} className={`rounded-xl border px-3 py-2 ${tab === "female" ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>ฝ่ายหญิง</button>
          <button onClick={() => setTab("male")} className={`rounded-xl border px-3 py-2 ${tab === "male" ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>ฝ่ายชาย</button>
        </div>

        <ResultCard>
          {tab === "female" ? (
            <>
              <p className="text-xs text-ink/60">
                6 ค่านี้เป็นชุดที่คลินิกเจริญพันธุ์ตรวจกันทั่วไปเวลาประเมินความพร้อม — แต่ <strong>ไม่ใช่ทุกคนต้องตรวจครบทั้งหมด</strong> บางค่า (Prolactin, TSH) แพทย์มักตรวจเฉพาะเมื่อมีอาการ ไม่ใช่การตรวจมาตรฐานสำหรับทุกคน
              </p>
              <div className="mt-3 space-y-3">
                {FEMALE_HORMONES.map((h) => (
                  <div key={h.id} className="rounded-xl bg-white/70 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{h.name}</span>
                      <span className="shrink-0 rounded-full bg-teal/10 px-2 py-0.5 text-[11px] text-teal-deep">{h.roleLabel}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink/70">{h.whatItIs}</p>
                    <p className="mt-1 text-xs text-ink/50">ตรวจเมื่อไหร่: {h.whenToTest}</p>
                    <p className="mt-1 text-xs text-ink/60">{h.referenceNote}</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-ink/70">
                      {h.interpretation.map((line, i) => <li key={i}>• {line}</li>)}
                    </ul>
                    {h.caveat && <p className="mt-1 text-xs font-medium text-rose-deep">⚠️ {h.caveat}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-3">
                <p className="text-xs font-semibold">การตรวจภายใน (อัลตราซาวด์)</p>
                <p className="mt-1 text-xs text-ink/70">{ENDOMETRIAL_NOTE}</p>
                <p className="mt-2 text-xs text-ink/70">{AFC_NOTE}</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-ink/60">ค่าตรวจน้ำเชื้อตามมาตรฐาน WHO (ฉบับที่ 6, พ.ศ. 2564)</p>
              <div className="mt-3 space-y-3">
                {SEMEN_PARAMS.map((p) => (
                  <div key={p.id} className="rounded-xl bg-white/70 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="shrink-0 text-sm text-teal-deep">≥ {p.lowerLimit}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink/70">ต่ำกว่านี้: {p.belowMeans}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink/60">{SEMEN_REFERENCE_CAVEAT}</p>

              <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-3">
                <p className="text-xs font-semibold">สี/ลักษณะภายนอก</p>
                <ul className="mt-1 space-y-0.5 text-xs text-ink/70">
                  {SEMEN_COLOR.map((c, i) => <li key={i}>• <strong>{c.color}</strong> — {c.meaning}</li>)}
                </ul>
                <p className="mt-2 text-xs text-ink/50">{SEMEN_COLOR_CAVEAT}</p>
              </div>

              <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-3">
                <p className="text-xs font-semibold">ฮอร์โมนเกี่ยวข้องกับคุณภาพน้ำอสุจิยังไง</p>
                <p className="mt-1 text-xs text-ink/70">{HORMONE_SPERM_RELATIONSHIP}</p>
              </div>
            </>
          )}

          <div className="mt-4 rounded-xl border border-rose/30 bg-rose-soft/40 p-3">
            <p className="text-xs text-ink/70">{LAB_REFERENCE_DISCLAIMER}</p>
          </div>

          <PlanCta />
          {/* R10 red-team fix — `tab` is just which reference table the reader is
              looking at (they may be checking either section for a partner), not
              a confirmed answer about who they are. Don't derive `stage` from it —
              that mis-tagged leads in Supabase (e.g. a woman reading the male
              section to help her partner would submit as stage="male"). This tool
              stays intentionally un-personalized per R10 scope. */}
          {/* R3 — ส่งว่าผู้ใช้กำลังสนใจฝั่งไหน (หญิง/ชาย) ให้แอดมินเห็นบริบทตอนคุยต่อ
              ผลถูกเก็บลง tool_results ได้แล้วตั้งแต่ migration 0007 (ก่อนหน้านี้ถูกทิ้งเงียบ ๆ) */}
          <AdminHandoffCta tool="labs" toolInput={{ tab }} toolOutput={{ viewed: tab }} label="สอบถามหรือปรึกษาเรื่องนี้เพิ่มเติมได้ที่ LINE OA" />
        </ResultCard>
      </ToolShell>
    </>
  );
}
