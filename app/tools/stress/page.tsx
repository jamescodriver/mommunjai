"use client";
import { useEffect, useState } from "react";
import { useEmbed } from "@/components/use-embed";
import {
  ST5_QUESTIONS, ST5_OPTIONS, ST5_TIMEFRAME, ST5_CREDIT, STRESS_DISCLAIMER,
  STRESS_PRODUCT_IDS, HELPLINE, scoreSt5, StressResult,
} from "@/lib/calc/stress";
import { productsForStage, type VitaminStage } from "@/lib/calc/vitamins";
import { readProfile, recordTool, mergeProfile } from "@/lib/profile-store";
import { ToolShell, ResultCard, PlanCta, EmbedAutoResize } from "@/components/ui";
import { IconHeart } from "@/components/icons";
import AdminHandoffCta from "@/components/admin-handoff-cta";

// R14 · TS-14 — แบบประเมินความเครียด ST-5 (กรมสุขภาพจิต)
//
// 🔒 PDPA ม.26 — คำตอบเรื่องสุขภาพจิตเป็นข้อมูลอ่อนไหว หน้านี้จึง **คำนวณฝั่ง client ล้วน**
//    และเก็บลง localStorage เฉพาะ "ระดับ+คะแนนรวม" ไม่เก็บคำตอบรายข้อ และไม่ส่งขึ้น server
//    (ตามข้อเสนอใน docs/STRESS-SCALE-RESEARCH-BRIEF.md §g ข้อ 4)
//
// 🔒 มติต้น 31/7 (docs/PRD-UPDATE-R3-3107.md §R14): คะแนน 8 ขึ้นไปยังแสดงสินค้าได้
//    แต่ต้องอยู่ใน **กรอบหัวข้อ "ตัวช่วย"** และต้องอยู่ **ใต้** ช่องทางขอความช่วยเหลือเสมอ
//    ห้ามสลับลำดับ — จุดนี้คือเส้นแบ่งระหว่าง "ให้ทางเลือก" กับ "ขายความกลัว"
export default function StressPage() {
  const embed = useEmbed();
  const [answers, setAnswers] = useState<(number | null)[]>(Array(ST5_QUESTIONS.length).fill(null));
  const [res, setRes] = useState<StressResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // เปลี่ยนคำตอบข้อไหนก็ตาม = ผลเดิมใช้ไม่ได้แล้ว ต้องกดประเมินใหม่
  // (บทเรียนจากเครื่องมือออกกำลังกาย: ผลเก่าค้างบนจอหลังผู้ใช้แก้ input เป็นบั๊กความปลอดภัย)
  useEffect(() => { setRes(null); setErr(null); }, [answers]);

  const pick = (qIndex: number, value: number) =>
    setAnswers((cur) => cur.map((a, i) => (i === qIndex ? value : a)));

  const run = () => {
    const r = scoreSt5(answers);
    if (!r) return setErr("กรุณาตอบให้ครบทั้ง 5 ข้อก่อนนะคะ");
    setErr(null);
    setRes(r);
    // เก็บเฉพาะผลสรุป ไม่เก็บคำตอบรายข้อ
    recordTool("stress", { completed: true }, { score: r.score, band: r.band });
    mergeProfile({});
  };

  // 🔒 ต้องผ่าน productsForStage() → allowedIn() เสมอ ห้ามหยิบจาก PRODUCTS ตรง ๆ
  // A.O.S มี stop.pregnant + stop.embryoTransfer — ถ้าข้ามด่านนี้ แม่ตั้งครรภ์ที่ทำแบบประเมิน
  // จะเห็น A.O.S พร้อมข้อความ "ดูแลคุณภาพไข่และตัวอ่อน" โดยไม่มีคำเตือนหยุดเลย (Lucifer 31/7)
  const stage = (readProfile().stage as VitaminStage | undefined) ?? "prep";
  const products = productsForStage(stage, STRESS_PRODUCT_IDS);
  const answered = answers.filter((a) => a !== null).length;

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} icon={<IconHeart />} title="แบบประเมินความเครียด"
        intro={`ตอบ 5 ข้อสั้น ๆ นึกถึงตัวเอง${ST5_TIMEFRAME} — แบบประเมินของกรมสุขภาพจิต ไม่เก็บคำตอบรายข้อของคุณไว้ที่ไหน`}
        disclaimer={STRESS_DISCLAIMER}>
        <div className="space-y-4">
          {ST5_QUESTIONS.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-medium">{qi + 1}. {q}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {ST5_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => pick(qi, o.value)}
                    className={`rounded-xl border px-3 py-2 text-left ${answers[qi] === o.value ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {err && <p className="text-sm text-rose-deep">{err}</p>}
          <button className="btn-primary w-full" onClick={run}>
            ดูผลประเมิน {answered < ST5_QUESTIONS.length && `(ตอบแล้ว ${answered}/${ST5_QUESTIONS.length})`}
          </button>
          <p className="text-xs text-ink/50">{ST5_CREDIT}</p>
        </div>

        {res && (
          <ResultCard>
            <div className="text-center">
              <p className="text-sm text-ink/60">คะแนนความเครียดของคุณ</p>
              <p className="text-3xl font-semibold" style={{ color: res.color }}>{res.score}<span className="text-base text-ink/40"> / 15</span></p>
              <p className="mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: res.color }}>{res.bandLabel}</p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink/80">{res.advice}</p>

            {/* 🔒 คะแนน 8+ — ช่องทางช่วยเหลือต้องมาก่อนและเด่นกว่ากรอบสินค้าเสมอ */}
            {res.showHelpline && (
              <div className="mt-4 rounded-xl border-2 border-teal bg-teal-soft p-4 text-center">
                <p className="text-sm font-semibold text-teal-deep">คุยกับผู้เชี่ยวชาญได้ ฟรี ตลอด 24 ชั่วโมง</p>
                <a href={`tel:${HELPLINE.number}`} className="btn-primary mt-2 w-full">
                  📞 โทร {HELPLINE.number} — {HELPLINE.name}
                </a>
                <p className="mt-1 text-xs text-ink/60">{HELPLINE.note}</p>
              </div>
            )}

            {/* กรอบสินค้า — หัวข้อเปลี่ยนตามระดับความเปราะบางของผู้ใช้ (มติต้น 31/7) */}
            <div className="mt-4">
              <p className="text-sm font-semibold">
                {res.productsAsAid ? "🌿 ตัวช่วย" : "🌿 ตัวช่วยดูแลตัวเอง"}
              </p>
              <p className="mt-0.5 text-xs text-ink/50">
                {res.productsAsAid
                  ? "เป็นตัวช่วยดูแลตัวเองควบคู่กันได้ ไม่ใช่สิ่งทดแทนการปรึกษาผู้เชี่ยวชาญ"
                  : "ตัวช่วยเสริมสำหรับการพักผ่อนและดูแลร่างกายโดยรวม"}
              </p>
              <div className="mt-2 space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="rounded-xl bg-white/70 p-3">
                    <span className="font-semibold">{p.name}</span>
                    <p className="mt-1 text-xs text-ink/70">{p.why}</p>
                    {p.caution && <p className="mt-1 text-xs text-ink/60">{p.caution}</p>}
                    {/* 🔒 A.O.S พก stop-rule ไว้ในฟิลด์ stop ไม่ใช่ caution — ถ้าไม่ render ตรงนี้
                        คำเตือน "หยุดหลังใส่ตัวอ่อน/ช่วงตั้งครรภ์" จะเงียบหายทั้งที่มีข้อมูลอยู่ */}
                    {p.stop && (
                      <p className="mt-1 text-xs font-medium text-rose-deep">
                        ❌ หยุดทาน: {[
                          p.stop.ovulation && "ช่วงวันไข่ตก",
                          p.stop.embryoTransfer && "หลังใส่ตัวอ่อน",
                          p.stop.pregnant && "ช่วงตั้งครรภ์",
                          p.stop.lactating && "ช่วงให้นม",
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <PlanCta />
            {/* 🔒 PDPA ม.26 — ส่งได้เฉพาะ "คะแนนรวม + ระดับ" **ไม่ส่งคำตอบรายข้อ**
                ข้อความ consent ถูกขยายให้ครอบคลุมความเครียดแล้ว (CONSENT_POLICY_VERSION
                2026-07-31, ดู lib/disclaimer.ts) และจะถูกส่งไปพร้อมกันทุกครั้งใน AdminHandoffCta
                → แอดมินเห็นระดับความเครียดเพื่อคุยต่อได้ โดยไม่ต้องรู้ว่าตอบข้อไหนว่าอย่างไร
                ⚠️ ห้ามเพิ่มคำตอบรายข้อ (answers) เข้ามาตรงนี้ — เก็บเท่าที่จำเป็นตาม PDPA */}
            <AdminHandoffCta tool="stress"
              toolInput={{ completed: true }}
              toolOutput={{ score: res.score, band: res.band, bandLabel: res.bandLabel }}
              label="อยากคุยกับทีมเรื่องการดูแลตัวเองเพิ่มเติม ทักได้ที่ LINE OA" />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
