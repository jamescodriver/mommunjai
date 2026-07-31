"use client";
import { useState } from "react";
import type { Report } from "@/lib/report";
import { BMI_BANDS } from "@/lib/calc/bmi";
import { SAMPLE_PLATE, SAMPLE_PLATE_DISCLAIMER } from "@/lib/calc/food-reference";
import { productPhotoSrc } from "@/lib/product-photos";
import { track } from "@/lib/track";
import { Wordmark } from "@/components/wordmark";
import AdminHandoffCta from "@/components/admin-handoff-cta";
import PregnancyKnowledgeView from "@/components/knowledge-pregnancy";
import LactationKnowledgeView from "@/components/knowledge-lactation";

const LINE_OA_URL = process.env.NEXT_PUBLIC_LINE_OA_URL || "https://lin.ee/fBa4xkz";
const fmtTH = (iso: string) => {
  try { return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long" }); }
  catch { return iso; }
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="glass p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal text-xs text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/70 p-3">
      <div className="text-sm font-semibold text-teal-deep">{title}</div>
      <div className="mt-1 text-sm text-ink/80">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// R15 (PRD-UPDATE-R3-3107 §R15 · คอมเมนต์ TC-15-01 "ปรับแทนที่เลย")
// โครงเดิม (จุดแข็ง → quick win → คะแนน 5 เสา → จุดที่เสริมได้ → แผน 90 วัน 3 เฟส →
// สัปดาห์นี้ทำ 3 อย่าง) **ถูกแทนที่ทั้งหมด** ด้วย:
//   Part 1 ข้อมูลของคุณ (BMI · น้ำ · นอน · ออกกำลังกาย)
//   Part 2 โภชนาการของคุณ (โปรตีน · น้ำ · ไขมันดี · ตารางอาหาร)
//   ตารางวิตามิน 3 คอลัมน์ + รูปสินค้า
//   ปิดท้าย: ปุ่มแนะนำเมนู + ปุ่มทักแอดมิน
//
// 🔒 gate เดิมไม่แตะ: หน้านี้ถูก render เฉพาะ tier "full" เท่านั้น (app/plan/page.tsx
//    เช็ค result.tier === "full" · app/r/[code] เปิดได้ต่อเมื่อมี ticket ที่ผ่าน LINE)
//    teaser/medium ยังได้แค่ buildTeaser() จาก /api/lead เหมือนเดิม
// 🔒 รายงานที่ snapshot ไว้ก่อน R3 ไม่มี part1/part2 → ทุกบล็อกใหม่เป็น optional chain
//    บล็อกที่ไม่มีข้อมูลหายไปเงียบ ๆ ไม่พังทั้งหน้า
export default function ReportView({ report, code, ticketNote }: { report: Report; code?: string; ticketNote?: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const p1 = report.part1;
  const p2 = report.part2;
  // R10/R11 — เนื้อหาความรู้ตามช่วงชีวิต (มีเฉพาะ stage pregnant / lactating)
  // 🔒 optional เสมอ — รายงานที่ snapshot ไว้ก่อน R3 ไม่มีฟิลด์นี้ บล็อกจะหายไปเงียบ ๆ
  const preg = report.pregnancyKnowledge;
  const lact = report.lactationKnowledge;
  const nPartner = preg || lact ? "5" : "4";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-6">
      {/* header */}
      <div className="glass-strong p-6 text-center">
        <Wordmark height={26} />
        <p className="text-xs font-medium text-ink/50">by Baby & Mom</p>
        <h1 className="mt-1 text-2xl font-semibold text-teal-deep">{report.title}</h1>
        <p className="mt-1 text-sm text-ink/70">{report.tagline}</p>
        <p className="mt-3 text-sm">{report.greeting}</p>
        {code && ticketNote && (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-teal bg-teal-soft py-3 text-xl font-bold tracking-widest text-teal-deep">{code}</div>
        )}
      </div>

      {/* ══ Part 1 — ข้อมูลของคุณ ══ */}
      <Section n="1" title="ข้อมูลของคุณ 📋">
        <div className="space-y-3">
          {/* R13/TC-15-03 — ตัวเลข BMI + แถบสี 4 ระดับ (ที่เดียวกับทั้งแอป: lib/calc/bmi.ts) */}
          {report.bmi ? (
            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-sm font-semibold text-teal-deep">ค่า BMI ของคุณ</div>
              <div className="mt-1 flex items-end gap-3">
                <div className="font-display text-4xl font-bold" style={{ color: report.bmi.color }}>{report.bmi.bmi}</div>
                <div className="pb-1">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: report.bmi.color }}>
                    {report.bmi.label}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex overflow-hidden rounded-full" role="img" aria-label={`ระดับ BMI: ${report.bmi.label}`}>
                {BMI_BANDS.map((b) => (
                  <div key={b.tier} className="h-3 flex-1" style={{ backgroundColor: b.color, opacity: b.tier === report.bmi!.tier ? 1 : 0.28 }} />
                ))}
              </div>
              <div className="mt-1 flex text-[10px] text-ink/50">
                {BMI_BANDS.map((b) => (
                  <div key={b.tier} className="flex-1 text-center leading-tight">{b.label}<br />{b.range}</div>
                ))}
              </div>
              <p className="mt-2 text-sm text-ink/70">{report.bmi.note}</p>
              <p className="mt-1 text-xs text-ink/50">ค่า BMI เป็นตัวเลขอ้างอิงคร่าว ๆ ไม่ได้บอกสุขภาพทั้งหมดของคุณ และไม่ใช่การวินิจฉัยค่ะ</p>
            </div>
          ) : (
            <Card title="ค่า BMI ของคุณ">
              <p className="text-xs text-ink/50">ยังไม่ได้กรอกน้ำหนัก/ส่วนสูงครบ จึงยังคำนวณ BMI ให้ไม่ได้ (เราไม่เดาตัวเลขให้ค่ะ)</p>
            </Card>
          )}

          {/* เป้าน้ำดื่มต่อวัน */}
          <Card title="น้ำดื่มที่ควรได้ต่อวัน 💧">
            {p1?.water ? (
              <>
                <p><b className="text-teal-deep">{p1.water.minMl.toLocaleString()}–{p1.water.maxMl.toLocaleString()} มล./วัน</b> (~{p1.water.glassesMin}–{p1.water.glassesMax} แก้ว แก้วละ 250 มล.)</p>
                <p className="mt-1 text-xs text-ink/50">คำนวณจากน้ำหนักตัวตามเกณฑ์ทั่วไป 30–35 มล./กก. · ดื่มน้ำไม่เย็นตลอดวัน</p>
              </>
            ) : (
              <p className="text-xs text-ink/50">ยังไม่ได้กรอกน้ำหนัก จึงยังคำนวณเป้าน้ำดื่มให้ไม่ได้ค่ะ</p>
            )}
          </Card>

          {/* ชั่วโมงนอนที่แนะนำ + เทียบกับเวลาที่กรอกจริง (R4) */}
          <Card title="การนอน 😴">
            {p1?.sleep ? (
              <>
                <p>แนะนำ <b className="text-teal-deep">{p1.sleep.recommendedMinHours}–{p1.sleep.recommendedMaxHours} ชั่วโมง/คืน</b> · {p1.sleep.bedtimeRule}</p>
                {p1.sleep.actualHours !== undefined && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-teal-soft px-2 py-0.5">เวลาที่คุณกรอก: {p1.sleep.bedtime}–{p1.sleep.waketime}</span>
                    <span className="rounded-full bg-teal-soft px-2 py-0.5">≈ {p1.sleep.actualHours} ชม.</span>
                    {p1.sleep.beforeTen === false && <span className="rounded-full bg-gold/25 px-2 py-0.5">เข้านอนหลัง 22:00</span>}
                  </div>
                )}
                <p className="mt-2">{p1.sleep.note}</p>
              </>
            ) : (
              <p className="text-xs text-ink/50">แนะนำนอน 7–9 ชั่วโมง และเข้านอนก่อน 4 ทุ่ม (22:00)</p>
            )}
          </Card>

          {/* รูปแบบออกกำลังกายที่เหมาะ */}
          {p1?.exercise && (
            <Card title="ออกกำลังกายที่เหมาะกับคุณ 🏃‍♀️">
              {p1.exercise.freqLabel && (
                <p className="text-xs text-ink/60">คุณกรอกไว้ว่าออกกำลังกาย {p1.exercise.freqLabel} → คำแนะนำนี้ปรับตามจุดเริ่มต้นของคุณแล้ว</p>
              )}
              <p className="mt-1">เป้าหมาย: <b>{p1.exercise.weeklyTarget}</b></p>
              <p>ความถี่: {p1.exercise.frequency}</p>
              <p>ระดับ: {p1.exercise.intensity}</p>
              {p1.exercise.types.length > 0 && (
                <ul className="mt-1 list-disc pl-5">{p1.exercise.types.map((x, i) => <li key={i}>{x}</li>)}</ul>
              )}
              {p1.exercise.tips.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-ink/70">{p1.exercise.tips.map((x, i) => <li key={i}>{x}</li>)}</ul>
              )}
              {p1.exercise.avoid && p1.exercise.avoid.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-rose-deep">{p1.exercise.avoid.map((x, i) => <li key={i}>{x}</li>)}</ul>
              )}
              {p1.exercise.evidenceNote && <p className="mt-1 text-xs text-ink/50">ℹ️ {p1.exercise.evidenceNote}</p>}
            </Card>
          )}

          {/* ช่วงมีโอกาสสูง — แสดงเฉพาะคนที่ทำเครื่องมือนับวันไข่ตกมาแล้ว */}
          {report.fertileWindow && (
            <Card title="ช่วงมีโอกาสสูงรอบถัดไป 🗓️">
              <p><b className="text-teal-deep">{fmtTH(report.fertileWindow.start)}–{fmtTH(report.fertileWindow.end)}</b>{report.isMale ? " (ของคู่คุณ)" : ""}</p>
              <p className="mt-1 text-xs text-ink/50">การนับวันไข่ตกใช้คุมกำเนิดไม่ได้ และวันตกไข่เลื่อนได้ในแต่ละรอบ</p>
            </Card>
          )}
        </div>
      </Section>

      {/* ══ Part 2 — โภชนาการของคุณ ══ */}
      <Section n="2" title="โภชนาการของคุณ 🍽️">
        <div className="space-y-3">
          <Card title={`โปรตีน ${report.isMale ? "💪" : "🥚"}`}>
            {report.protein ? (
              <>
                <p>เป้าหมาย <b className="text-teal-deep">{report.protein.min}–{report.protein.max} กรัม/วัน</b> (เติมด้วย {report.isMale ? "Ferta" : "Ferty"} ~{report.protein.ferty} ซอง ถ้าอาหารไม่ถึง)</p>
                {report.protein.note && <p className="mt-1 text-xs text-teal-deep">💡 {report.protein.note}</p>}
              </>
            ) : (
              <p className="text-xs text-ink/50">ยังไม่ได้กรอกน้ำหนัก จึงยังคำนวณเป้าโปรตีนให้ไม่ได้ค่ะ</p>
            )}
          </Card>

          <Card title="น้ำ 💧">
            {p2?.waterMl
              ? <p>เป้าหมาย <b className="text-teal-deep">{p2.waterMl.minMl.toLocaleString()}–{p2.waterMl.maxMl.toLocaleString()} มล./วัน</b></p>
              : <p className="text-xs text-ink/50">ยังไม่ได้กรอกน้ำหนัก จึงยังคำนวณเป้าน้ำให้ไม่ได้ค่ะ</p>}
          </Card>

          {/* ── ไขมันดี ────────────────────────────────────────────────────
              🔒 กฎบังคับจาก GOOD-FAT-BY-CATEGORY-RESEARCH-BRIEF §6.3:
              "ไขมันดีทั่วไป" (น้ำมันมะกอก/อะโวคาโด/ถั่ว) กับ "แหล่ง DHA จริง"
              ต้องอยู่คนละบล็อกเสมอ — ถ้าเขียนรวมกันผู้ใช้จะเข้าใจว่ากินน้ำมันมะกอก
              แล้วได้ DHA พอ (ผิด) ห้ามยุบ 2 กล่องนี้เป็นกล่องเดียว */}
          {p2?.goodFat && (
            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-sm font-semibold text-teal-deep">ไขมันดี (EPA+DHA) 🐟</div>
              <p className="mt-1 text-sm">เป้าหมาย <b className="text-teal-deep">{p2.goodFat.targetLabel}</b></p>
              <p className="mt-1 text-sm text-ink/80">{p2.goodFat.why}</p>

              <div className="mt-3 rounded-lg bg-teal-soft/60 p-2">
                <div className="text-xs font-semibold text-teal-deep">✅ แหล่ง DHA จริง — มีแค่กลุ่มนี้</div>
                <ul className="mt-1 list-disc pl-5 text-xs text-ink/80">
                  {p2.goodFat.dhaSources.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              <div className="mt-2 rounded-lg bg-black/[0.04] p-2">
                <div className="text-xs font-semibold">🥑 ไขมันดีทั่วไป — ดีต่อสุขภาพ แต่ <u>ไม่ใช่</u> แหล่ง DHA</div>
                <ul className="mt-1 list-disc pl-5 text-xs text-ink/80">
                  {p2.goodFat.generalGoodFats.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
                <p className="mt-1 text-xs text-rose-deep">{p2.goodFat.notDhaWarning}</p>
              </div>

              <div className="mt-2">
                <div className="text-xs font-semibold">ไขมันที่ควรจำกัดสำหรับช่วงของคุณ</div>
                <ul className="mt-1 space-y-1 text-xs text-ink/80">
                  {p2.goodFat.limitFats.map((f, i) => <li key={i}>• <b>{f.label}</b> — {f.note}</li>)}
                </ul>
              </div>

              {p2.goodFat.extraCautions.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-ink/70">
                  {p2.goodFat.extraCautions.map((x, i) => <li key={i}>⚠️ {x}</li>)}
                </ul>
              )}

              <p className="mt-2 text-xs text-ink/50">ℹ️ {p2.goodFat.evidenceNote}</p>
              {/* TC-15-05 — ตัวเลขต้อง trace กลับหาแหล่งอ้างอิงได้ ห้ามมีตัวเลขลอย */}
              <p className="mt-1 text-[11px] text-ink/40">ที่มาของตัวเลข: {p2.goodFat.source} · สรุปหลักฐานเต็ม: {p2.goodFat.brief}</p>
            </div>
          )}

          {/* ตารางโปรตีนต่ออาหาร */}
          {p2?.proteinFoods && p2.proteinFoods.length > 0 && (
            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-sm font-semibold text-teal-deep">โปรตีนในอาหาร (อ้างอิง)</div>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink/50">
                      <th className="pb-1 font-medium">อาหาร</th>
                      <th className="pb-1 font-medium">ปริมาณอ้างอิง</th>
                      <th className="pb-1 text-right font-medium">โปรตีน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p2.proteinFoods.map((f, i) => (
                      <tr key={i} className="border-t border-black/5">
                        <td className="py-1.5">{f.food}</td>
                        <td className="py-1.5 text-ink/70">{f.per}</td>
                        <td className="py-1.5 text-right font-medium text-teal-deep">{f.protein}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-[11px] text-ink/40">ที่มา: {p2.proteinFoodsSource}</p>
            </div>
          )}

          {p2?.vegetables && p2.vegetables.length > 0 && (
            <Card title="ผักแนะนำ 🥬">
              <ul className="list-disc pl-5 text-sm">{p2.vegetables.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </Card>
          )}
          {p2?.fruits && p2.fruits.length > 0 && (
            <Card title="ผลไม้แนะนำ 🍌">
              <ul className="list-disc pl-5 text-sm">{p2.fruits.map((x, i) => <li key={i}>{x}</li>)}</ul>
              {p2.foodSourceNote && <p className="mt-2 text-[11px] text-ink/40">{p2.foodSourceNote}</p>}
            </Card>
          )}
        </div>
      </Section>

      {/* ══ ตารางแนะนำวิตามิน — 3 คอลัมน์ + รูปสินค้า ══ */}
      <Section n="3" title="วิตามินที่แนะนำสำหรับคุณ 💊">
        <p className="text-xs text-ink/60">{report.vitaminNote}</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink/50">
                <th className="w-[38%] pb-1 font-medium">ผลิตภัณฑ์</th>
                <th className="w-[30%] pb-1 font-medium">วิธีรับประทาน</th>
                <th className="pb-1 font-medium">ประโยชน์</th>
              </tr>
            </thead>
            <tbody>
              {report.vitamins.map((v) => {
                // TC-15-07 — "ถ้ามีก็แสดง ไม่มีก็ไม่ต้องแสดง": สินค้า 7 ตัวที่ยังไม่มีรูป
                // ต้องขึ้นแถวตามปกติ **โดยไม่มีรูป** ไม่ใช่ซ่อนสินค้า และไม่ปล่อยรูปแตก
                const photo = productPhotoSrc(v.id);
                return (
                  <tr key={v.id} className="border-t border-black/5 align-top">
                    <td className="py-2 pr-2">
                      <div className="flex gap-2">
                        {photo && (
                          <img
                            src={photo}
                            alt={v.name}
                            loading="lazy"
                            className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight">{v.name}</div>
                          <div className="text-xs text-teal-deep">{v.price === null ? "สอบถามราคา" : `฿${v.price.toLocaleString()}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-xs text-ink/80">
                      {v.howto
                        ? v.howto
                        // R3 §Reversals (TC-06-08) — สินค้าที่แบรนด์ยังไม่ยืนยัน dosage
                        // (Motila1/นมแพะ/ซุปไก่ดำ/น้ำหัวปลี) แสดงได้ แต่ต้องบอกตรง ๆ
                        // ให้ถามทีม ห้ามปล่อยช่องว่าง
                        : <span className="text-ink/50">สอบถามทีม Baby &amp; Mom ทาง LINE OA</span>}
                    </td>
                    <td className="py-2 text-xs text-ink/80">
                      <p>{v.why}</p>
                      {v.caution && <p className="mt-1 text-ink/60">{v.caution}</p>}
                      {/* 🔒 stop-rule ของ Safety Matrix ต้องแสดงในรายงานด้วย ไม่ใช่เฉพาะหน้าเครื่องมือ
                          (ดอกคำฝอย/น้ำมันละหุ่งไม่มี caption แยก คำเตือนอยู่ในฟิลด์ stop เท่านั้น) */}
                      {v.stop && (
                        <p className="mt-1 font-medium text-rose-deep">
                          ❌ หยุดทาน: {[
                            v.stop.ovulation && "ช่วงวันไข่ตก",
                            v.stop.embryoTransfer && "หลังใส่ตัวอ่อน",
                            v.stop.pregnant && "ช่วงตั้งครรภ์",
                            v.stop.lactating && "ช่วงให้นม",
                          ].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink/50">แผนนี้มีค่าแม้คุณจะเลือกกินอาหารก่อนโดยไม่เสริมวิตามินก็ได้ค่ะ (หลัก 70% อาหาร · 30% วิตามิน)</p>
      </Section>

      {/* ══ R10 — ความรู้ช่วงตั้งครรภ์ 4 หัวข้อ ══ */}
      {preg && (
        <Section n="4" title="ความรู้สำหรับช่วงตั้งครรภ์ 🤰">
          <PregnancyKnowledgeView data={preg} code={code} />
        </Section>
      )}

      {/* ══ R11 — ความรู้ช่วงให้นมบุตร ══
          🔒 ห้ามเพิ่มไอคอน/ภาพ ทารก ขวดนม จุกนม ในหัวข้อนี้ (พ.ร.บ.นมผง — ดูหัวไฟล์
             components/knowledge-lactation.tsx) */}
      {lact && (
        <Section n="4" title="ความรู้สำหรับช่วงให้นมบุตร 🌿">
          <LactationKnowledgeView data={lact} code={code} />
        </Section>
      )}

      {/* partner nudge */}
      {report.partnerNudge && (
        <Section n={nPartner} title="ชวนคู่ของคุณไปด้วยกัน 👫">
          <p className="text-sm">{report.partnerNudge}</p>
        </Section>
      )}

      {/* ══ ปิดท้าย: ปุ่มแนะนำเมนู + ปุ่มทักแอดมิน ══ */}
      <section className="glass p-5">
        <button
          className="btn-ghost w-full"
          onClick={() => { setShowMenu((s) => !s); if (!showMenu) track("menu_suggestion_open", { code }); }}
          aria-expanded={showMenu}
        >
          🍱 {showMenu ? "ซ่อนตัวอย่างจานอาหาร" : "ดูตัวอย่างจานอาหารของคุณ"}
        </button>

        {showMenu && (
          <div className="mt-3 rounded-xl bg-white/70 p-3">
            {/* ภาพจานอาหารตัวอย่าง — วาดด้วย SVG ในหน้า (ยังไม่มีไฟล์ภาพจานจากแบรนด์
                ดู PRD Open Question #3 เรื่อง asset) จึงไม่มีรูปแตกและไม่ต้องรอ asset */}
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label="ภาพจานอาหารตัวอย่าง แบ่งเป็น 4 หมวด">
                <circle cx="60" cy="60" r="58" fill="#ffffff" stroke="rgba(0,0,0,0.08)" />
                {(() => {
                  let start = -90;
                  return SAMPLE_PLATE.map((part) => {
                    const angle = (part.share / 100) * 360;
                    const end = start + angle;
                    const rad = (d: number) => (d * Math.PI) / 180;
                    const x1 = 60 + 50 * Math.cos(rad(start));
                    const y1 = 60 + 50 * Math.sin(rad(start));
                    const x2 = 60 + 50 * Math.cos(rad(end));
                    const y2 = 60 + 50 * Math.sin(rad(end));
                    const large = angle > 180 ? 1 : 0;
                    start = end;
                    return (
                      <path key={part.key} d={`M60 60 L${x1} ${y1} A50 50 0 ${large} 1 ${x2} ${y2} Z`}
                        fill={part.color} fillOpacity={0.75} stroke="#fff" strokeWidth={1.5} />
                    );
                  });
                })()}
              </svg>
              <ul className="w-full space-y-1 text-sm">
                {SAMPLE_PLATE.map((part) => (
                  <li key={part.key} className="flex items-start gap-2">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: part.color }} />
                    <span><b>{part.label}</b> ~{part.share}% — <span className="text-ink/70">{part.examples}</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-xs text-ink/50">{SAMPLE_PLATE_DISCLAIMER}</p>
          </div>
        )}

        {/* 🔒 คำเตือน + referral ต้องอยู่ **เหนือ** ปุ่มขาย — มาตรฐานเดียวกับที่บังคับใน ST-5
            (สายด่วนต้องมาก่อนกรอบสินค้า) เดิมบล็อกนี้อยู่ล่างสุดของหน้าใต้ปุ่ม LINE ทำให้
            ข้อความอย่าง "ปรึกษาแพทย์ก่อนเริ่มวิตามิน" และ referral ตามอายุ อยู่หลังการตัดสินใจ
            ไปแล้ว — Lucifer red-team 31/7 · ยังคงบล็อกท้ายหน้าไว้ด้วยเพื่อไม่ให้ใครพลาด */}
        {report.cautions.length > 0 && (
          <div className="mt-4 rounded-xl border border-rose/30 bg-rose-soft/40 p-3">
            <p className="text-xs font-semibold text-rose-deep">⚠️ ต้องรู้ก่อนเริ่ม</p>
            <ul className="mt-1 space-y-1 text-xs text-ink/70">
              {report.cautions.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </div>
        )}

        {/* ปุ่มทักแอดมิน
            - มี ticket อยู่แล้ว (เส้นทางปกติ: กรอก /plan เสร็จ หรือเปิด /r/<code>)
              → ใช้ ticket เดิมทักแอดมินเลย **ห้ามยิง /api/lead ซ้ำ** ไม่งั้นจะได้ lead
              และ customer ซ้ำอีกใบทุกครั้งที่กดปุ่มจากรายงาน
            - ไม่มี ticket → ใช้ AdminHandoffCta เดิมเก็บชื่อ/ช่องทางแล้วออกรหัสให้ (TC-15-09) */}
        {code ? (
          <div className="mt-3 rounded-xl border border-teal/30 bg-teal-soft/40 p-3 text-center">
            <p className="text-xs text-ink/70">มีคำถามเรื่องแผนของคุณ? แอดมินเห็นคำตอบที่คุณตอบไว้แล้ว ไม่ต้องเล่าซ้ำ</p>
            <div className="mx-auto my-2 w-fit rounded-xl border-2 border-dashed border-teal bg-white px-4 py-1.5 text-lg font-bold tracking-widest text-teal-deep">{code}</div>
            <a className="btn-primary w-full" href={LINE_OA_URL} target="_blank" rel="noreferrer" onClick={() => track("line_click", { code, source: "report" })}>
              💬 คุยกับทีม Baby &amp; Mom ที่ LINE OA
            </a>
            <p className="mt-1 text-xs text-ink/50">พิมพ์รหัส {code} ในแชท หรือกด “แผนของฉัน” ในเมนู LINE</p>
          </div>
        ) : (
          <AdminHandoffCta
            tool="report"
            stage={report.generatedFor?.stage}
            artPlan={report.generatedFor?.artPlan}
            label="สอบถามรายละเอียดแผนของคุณเพิ่มเติมได้ที่ LINE OA"
          />
        )}
      </section>

      {/* cautions / disclaimer — 🔒 ต้องอยู่ทุกเส้นทางการแสดงผล */}
      <div className="glass p-4 text-xs text-ink/60">
        {report.cautions.map((c, i) => <p key={i} className="mb-1">⚠️ {c}</p>)}
      </div>
    </div>
  );
}
