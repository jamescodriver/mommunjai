"use client";
import { useState } from "react";
import type { LactationKnowledge } from "@/lib/calc/lactation";
import { MEDICAL_DISCLAIMER } from "@/lib/disclaimer";
import { productPhotoSrc } from "@/lib/product-photos";
import { track } from "@/lib/track";

// R11 — เนื้อหาความรู้ "ให้นมบุตร" (PRD-UPDATE-R3-3107 §R11)
//
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 ข้อจำกัด พ.ร.บ.นมผง ที่ผูกกับ "ตัวแอปเอง" (โทษจำคุกไม่เกิน 1 ปี — มาตรา ๑๔/๓๔)
//    ห้ามในไฟล์นี้เด็ดขาด (มี unit test สแกน อย่าถอด):
//      ❌ อีโมจิ/ไอคอน/ภาพ ทารก เด็กเล็ก ขวดนม จุกนม (รวมถึงเป็น icon ประจำหัวข้อ)
//      ❌ ตัวเลขช่วงอายุเด็กในข้อความที่ผูกกับสินค้า
//      ❌ ข้อความทำนอง "แม่กินแล้วน้ำนมดีต่อลูก"
//      ❌ เสนอแนะว่าสินค้าใดให้เด็กกิน — นมแพะคือเครื่องดื่มของ "แม่" เท่านั้น
//    รายละเอียดเต็ม + เหตุผล: หัวไฟล์ lib/calc/lactation.ts และ legal-compliance.md §2
//
// 🔴 ห้ามผูกคำเคลม "เพิ่มน้ำนม" กับสินค้าใด ๆ — น้ำหัวปลีมี RCT ไทยที่ทดสอบตรงแล้ว
//    ไม่ได้ผล (p=0.73) และซุปไก่ดำไม่มีงานวิจัยเลย (ข้อมูลอยู่ใน lib/calc/lactation.ts)
// ═══════════════════════════════════════════════════════════════════════════
//
// ข้อเท็จจริงทั้งหมดมาจาก lib/calc/lactation.ts — ห้ามพิมพ์ข้อเท็จจริงลงในไฟล์นี้

type Topic = "pump" | "nourishment" | "volume" | "danger";

function Box({ title, children, tone = "plain" }: { title?: string; children: React.ReactNode; tone?: "plain" | "warn" | "teal" }) {
  const bg = tone === "warn" ? "bg-rose-50" : tone === "teal" ? "bg-teal-soft/60" : "bg-white/70";
  return (
    <div className={`rounded-xl ${bg} p-3`}>
      {title && <div className="text-sm font-semibold text-teal-deep">{title}</div>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

function VolumeTable({ rows, caption }: { rows: { age: string; amount: string; perWeight?: string }[]; caption: string }) {
  return (
    <div className="rounded-xl bg-white/70 p-3">
      <div className="text-sm font-semibold text-teal-deep">{caption}</div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.age} className="border-t border-black/5 first:border-t-0">
                <td className="py-1.5 pr-2">{r.age}</td>
                <td className="py-1.5 pr-2 font-medium text-teal-deep">{r.amount}</td>
                <td className="py-1.5 text-xs text-ink/60">{r.perWeight || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LactationKnowledgeView({ data, code }: { data: LactationKnowledge; code?: string }) {
  const [topic, setTopic] = useState<Topic | null>(null);

  // 🔒 ไอคอนหัวข้อ: ห้ามใช้อะไรที่สื่อถึงทารก/ขวดนม/จุกนม (พ.ร.บ.นมผง)
  const TOPICS: { id: Topic; label: string; emoji: string }[] = [
    { id: "pump", label: "ตารางปั๊มนม", emoji: "⏱️" },
    { id: "nourishment", label: data.nourishment.title, emoji: "🍲" },
    { id: "volume", label: "ลูกกินนมวันละเท่าไหร่", emoji: "📊" },
    { id: "danger", label: "สัญญาณอันตรายหลังคลอด", emoji: "🚨" },
  ];

  const open = (t: Topic) => {
    const next = topic === t ? null : t;
    setTopic(next);
    if (next) track("lactation_knowledge_open", { code, topic: next });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => open(t.id)}
            aria-expanded={topic === t.id}
            className={`rounded-xl border px-3 py-3 text-sm ${topic === t.id ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}
          >
            <span aria-hidden>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── 1. ตารางปั๊มนม ── */}
      {topic === "pump" && (
        <div className="space-y-3">
          <Box tone="teal"><p className="text-sm font-medium text-ink/80">{data.pump.headline}</p></Box>
          <Box>
            <ul className="space-y-1.5 text-sm text-ink/80">
              {data.pump.points.map((x, i) => <li key={i}>• {x}</li>)}
            </ul>
          </Box>
          {/* 🔒 ต้องอยู่คู่กับตัวเลขเสมอ — ตัวเลขรอบปั๊มคือความเห็นผู้เชี่ยวชาญ ไม่ใช่เป้า */}
          <Box tone="warn"><p className="text-sm text-ink/80">{data.pump.evidenceNote}</p></Box>
          <Box title="สิ่งที่เราเลือกจะไม่เขียน เพราะยืนยันไม่ได้">
            <ul className="space-y-1 text-xs text-ink/70">
              {data.pump.notInThisApp.map((x, i) => <li key={i}>• {x}</li>)}
            </ul>
          </Box>
          <p className="text-[11px] text-ink/40">ที่มา: {data.pump.source}</p>
        </div>
      )}

      {/* ── 2. อาหารบำรุงแม่หลังคลอด (เปลี่ยนกรอบจาก "อาหารเพิ่มน้ำนม") ── */}
      {topic === "nourishment" && (
        <div className="space-y-3">
          {/* พระเอกของหน้าคือสิ่งที่ได้ผลจริง ไม่ใช่สินค้า — ต้องอยู่บนสุดเสมอ */}
          <Box tone="teal" title={data.nourishment.whatWorks.headline}>
            <p className="text-sm text-ink/80">{data.nourishment.whatWorks.detail}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink/80">
              {data.nourishment.whatWorks.order.map((x, i) => <li key={i}>{x}</li>)}
            </ol>
            <p className="mt-2 text-xs text-ink/60">{data.nourishment.whatWorks.abmQuote}</p>
            <p className="mt-1 text-[11px] text-ink/40">ที่มา: {data.nourishment.whatWorks.source}</p>
          </Box>

          <Box title={data.nourishment.energy.headline}>
            <p className="text-sm text-ink/80">{data.nourishment.energy.detail}</p>
            <p className="mt-1 text-[11px] text-ink/40">ที่มา: {data.nourishment.energy.source}</p>
          </Box>

          <Box title="ทำไมเราเปลี่ยนชื่อหัวข้อนี้">
            <p className="text-sm text-ink/80">{data.nourishment.reframeNote}</p>
          </Box>

          <div className="rounded-xl bg-white/70 p-3">
            <div className="text-sm font-semibold text-teal-deep">ภูมิปัญญาไทย พร้อมหลักฐานตามจริง</div>
            <div className="mt-2 space-y-3">
              {data.nourishment.thaiWisdom.map((w) => (
                <div key={w.name} className="border-t border-black/5 pt-2 first:border-t-0 first:pt-0">
                  <div className="text-sm font-medium">{w.name}</div>
                  <p className="text-xs text-ink/70">{w.tradition}</p>
                  {/* 🔒 ฟิลด์เดียวที่พูดถึงปริมาณน้ำนมได้ และพูดตามผลวิจัยจริงเท่านั้น */}
                  <p className="mt-1 text-xs text-ink/80">หลักฐาน: {w.evidence}</p>
                  <p className="mt-1 text-xs text-ink/60">{w.howWePresentIt}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/70">{data.nourishment.consensus}</p>
          </div>

          <Box title="ความเชื่อที่งานวิจัยไม่รองรับ">
            <ul className="space-y-2 text-sm text-ink/80">
              {data.nourishment.myths.map((m, i) => (
                <li key={i}>
                  <div className="text-ink/60">ที่มักได้ยิน: {m.myth}</div>
                  <div>ตามงานวิจัย: {m.fact}</div>
                </li>
              ))}
            </ul>
          </Box>
        </div>
      )}

      {/* ── 3. ลูกกินนมวันละเท่าไหร่ ── */}
      {topic === "volume" && (
        <div className="space-y-3">
          {/* 🔒 คำเตือนต้องอยู่บนสุดของหัวข้อนี้ ไม่ใช่ท้ายหัวข้อ */}
          <Box tone="warn"><p className="text-sm text-ink/80">{data.volume.topWarning}</p></Box>
          <VolumeTable rows={data.volume.colostrum} caption="น้ำนมเหลือง (โคลอสตรุม) ต่อมื้อ ในไม่กี่วันแรก" />
          <VolumeTable rows={data.volume.daily} caption="ปริมาณน้ำนมแม่รวมต่อวัน (นมแม่ล้วน ทารกครบกำหนด)" />
          <p className="text-[11px] text-ink/40">ที่มา: {data.volume.source}</p>

          <Box tone="teal" title={data.volume.insight.headline}>
            <p className="text-sm text-ink/80">{data.volume.insight.detail}</p>
            <p className="mt-1 text-[11px] text-ink/40">ที่มา: {data.volume.insight.source}</p>
          </Box>

          <Box title="สิ่งที่ควรดูแทนการนับออนซ์">
            <ul className="space-y-1 text-sm text-ink/80">
              {data.volume.watchInstead.map((x, i) => <li key={i}>• {x}</li>)}
            </ul>
          </Box>

          <Box tone="warn" title="สัญญาณที่ควรพาไปพบแพทย์">
            <ul className="space-y-1 text-sm text-ink/80">
              {data.volume.redFlags.map((x, i) => <li key={i}>• {x}</li>)}
            </ul>
          </Box>

          <p className="text-sm text-ink/80">{data.volume.afterSixMonths}</p>
          <Box tone="teal"><p className="text-sm text-ink/80">{data.volume.noGuiltNote}</p></Box>
        </div>
      )}

      {/* ── สัญญาณอันตรายหลังคลอด ── */}
      {topic === "danger" && (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-deep">{data.postpartumDanger.cta.primary}</p>
            <p className="mt-1 text-sm text-ink/80">{data.postpartumDanger.cta.critical}</p>
            <a
              href={`tel:${data.postpartumDanger.cta.criticalTel}`}
              onClick={() => track("emergency_tel_click", { code, source: "postpartum_danger" })}
              className="btn-primary mt-2 inline-block w-full text-center"
            >
              โทร {data.postpartumDanger.cta.criticalTel} (เฉพาะกรณีวิกฤต)
            </a>
          </div>
          <p className="text-xs text-ink/60">{data.postpartumDanger.cta.timeframeNote}</p>
          <div className="space-y-2">
            {data.postpartumDanger.signs.map((s, i) => (
              <div key={i} className="rounded-xl bg-white/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{s.sign}</div>
                  <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-deep">{s.action}</span>
                </div>
                <p className="mt-1 text-xs text-ink/70">{s.detail}</p>
                <p className="mt-1 text-xs text-ink/60">{s.why}</p>
                <p className="mt-1 text-[11px] text-ink/40">ที่มา: {s.source}</p>
              </div>
            ))}
          </div>
          <Box tone="teal"><p className="text-sm text-ink/80">{data.postpartumDanger.cta.closing}</p></Box>
        </div>
      )}

      {/* ── ชุดสินค้าของช่วงนี้ ── */}
      {data.products.length > 0 && (
        <div className="rounded-xl bg-white/70 p-3">
          <div className="text-sm font-semibold text-teal-deep">ของบำรุงสำหรับคุณแม่ในช่วงนี้</div>
          {/* 🔒 ประโยคนี้ทำหน้าที่ 2 อย่าง: บอกกรอบที่ถูกกฎหมาย (ของแม่ ไม่ใช่ของเด็ก)
              และกันการเข้าใจผิดว่าสินค้าเหล่านี้เกี่ยวกับปริมาณน้ำนม */}
          <p className="mt-1 text-xs text-ink/60">
            ทั้งหมดนี้เป็นอาหารและเครื่องดื่มบำรุงสำหรับตัวคุณแม่ ไม่ใช่ผลิตภัณฑ์สำหรับเด็ก และไม่ได้เป็นคำแนะนำเรื่องปริมาณน้ำนม
          </p>
          <ul className="mt-2 space-y-2">
            {data.products.map(({ product, amount, note }) => {
              const photo = productPhotoSrc(product.id);
              return (
                <li key={product.id} className="flex gap-2">
                  {photo && <img src={photo} alt={product.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain" />}
                  <div className="min-w-0 text-sm">
                    <div className="font-medium leading-tight">{product.name}</div>
                    <div className="text-xs text-teal-deep">{product.price === null ? "สอบถามราคา" : `฿${product.price.toLocaleString()}`}</div>
                    <p className="text-xs text-ink/70">{product.why}</p>
                    {note && <p className="text-xs text-ink/60">{note}</p>}
                    <p className="text-xs text-ink/50">
                      ปริมาณช่วงให้นม: {amount || product.howto || "สอบถามทีม Baby & Mom ทาง LINE OA"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <a
        className="btn-ghost block w-full text-center"
        href={data.fbMenuUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("fb_menu_click", { code, source: "lactation" })}
      >
        🍱 ดูเมนูอาหารสำหรับคุณแม่หลังคลอด (เปิดเพจ Baby &amp; Mom)
      </a>

      <p className="text-xs text-ink/60">⚠️ {MEDICAL_DISCLAIMER}</p>
      <p className="text-[11px] text-ink/40">สรุปหลักฐานเต็มของเนื้อหาชุดนี้: {data.brief}</p>
    </div>
  );
}
