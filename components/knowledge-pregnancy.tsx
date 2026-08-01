"use client";
import { useState } from "react";
import type { PregnancyKnowledge } from "@/lib/calc/pregnancy";
import { MEDICAL_DISCLAIMER } from "@/lib/disclaimer";
import { productPhotoSrc } from "@/lib/product-photos";
import { track } from "@/lib/track";

// R10 — เนื้อหาความรู้ "ตั้งครรภ์แล้ว" 4 หัวข้อ (PRD-UPDATE-R3-3107 §R10)
// ข้อมูลทั้งหมดมาจาก lib/calc/pregnancy.ts เท่านั้น — ห้ามเขียนข้อเท็จจริงลงในไฟล์นี้
//
// 🔒 กติกาที่หน้าจอนี้ต้องรักษา (ถ้าจะแก้ อ่านหัวไฟล์ lib/calc/pregnancy.ts ก่อน):
//   1. ข้อความความปลอดภัย 3 ข้อของ "นับลูกดิ้น" ต้องอยู่ **นอก toggle** และเห็นทั้ง 2 โหมด
//   2. โหมดนับเลข **ห้ามสรุปผล** — ไม่มีคำว่าปกติ/ผ่าน ไม่มีติ๊กถูกสีเขียว ไม่มีแถบความคืบหน้า
//      ที่สื่อว่า "ครบแล้ว" (เพราะเลข "ผ่าน" ทำให้แม่ที่รู้สึกผิดปกติเลื่อนการไปโรงพยาบาล)
//   3. หน้าสัญญาณอันตรายต้องมีทางติดต่อฉุกเฉินอยู่ในหน้าเสมอ และแอปห้ามประเมินความรุนแรงให้

type Topic = "development" | "nutrients" | "kick" | "danger";

const TOPICS: { id: Topic; label: string; emoji: string }[] = [
  { id: "development", label: "พัฒนาการลูก", emoji: "🌱" },
  { id: "nutrients", label: "สารอาหารที่ต้องได้", emoji: "🥗" },
  // 🔒 ไอคอนต้องไม่สื่อถึงทารก/ขวดนม/จุกนม (กติกาเดียวกับ R11 — พ.ร.บ.นมผง)
  { id: "kick", label: "นับลูกดิ้น", emoji: "⏱️" },
  { id: "danger", label: "สัญญาณอันตราย", emoji: "🚨" },
];

function Box({ title, children, tone = "plain" }: { title?: string; children: React.ReactNode; tone?: "plain" | "warn" | "teal" }) {
  const bg = tone === "warn" ? "bg-rose-50" : tone === "teal" ? "bg-teal-soft/60" : "bg-white/70";
  return (
    <div className={`rounded-xl ${bg} p-3`}>
      {title && <div className="text-sm font-semibold text-teal-deep">{title}</div>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

/** โหมดนับเลข — แสดง "จำนวนที่นับได้" อย่างเดียว 🔒 ห้ามเพิ่มการตัดสินผลใด ๆ */
function KickCounter() {
  const [count, setCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const bump = () => {
    setCount((c) => c + 1);
    if (startedAt === null) setStartedAt(Date.now());
  };
  const minutes = startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 60000);

  return (
    <div className="rounded-xl bg-white/70 p-3 text-center">
      <div className="text-sm text-ink/80">จำนวนครั้งที่คุณนับได้</div>
      <div className="font-display text-5xl font-bold text-teal-deep">{count}</div>
      {startedAt !== null && minutes >= 1 && (
        <div className="mt-1 text-sm text-ink/75">เริ่มนับเมื่อประมาณ {minutes} นาทีที่แล้ว</div>
      )}
      <div className="mt-3 flex gap-2">
        <button className="btn-primary flex-1" onClick={bump}>+ นับ 1 ครั้ง</button>
        <button className="btn-ghost" onClick={() => { setCount(0); setStartedAt(null); }}>เริ่มใหม่</button>
      </div>
    </div>
  );
}

export default function PregnancyKnowledgeView({ data, code }: { data: PregnancyKnowledge; code?: string }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [kickMode, setKickMode] = useState(data.kick.modes[0]?.id ?? "count");
  const mode = data.kick.modes.find((m) => m.id === kickMode) ?? data.kick.modes[0];

  const open = (t: Topic) => {
    const next = topic === t ? null : t;
    setTopic(next);
    if (next) track("pregnancy_knowledge_open", { code, topic: next });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/80">{data.trimesterNote}</p>

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

      {/* ── 1. พัฒนาการลูกตามไตรมาส ── */}
      {topic === "development" && (
        <div className="space-y-3">
          {(data.development ? [data.development] : data.allDevelopment).map((d) => (
            <Box key={d.trimester} title={`${d.label} (${d.weeksLabel})`}>
              <p className="text-sm text-ink/80">{d.theme}</p>
              <div className="mt-2 space-y-2">
                {d.blocks.map((b) => (
                  <div key={b.weeks}>
                    <div className="text-sm font-semibold text-teal-deep">{b.weeks}</div>
                    <ul className="mt-0.5 list-disc pl-5 text-sm text-ink/80">
                      {b.items.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Box>
          ))}
          <p className="text-xs text-ink/75">ที่มา: {data.developmentSource}</p>
        </div>
      )}

      {/* ── 2. สารอาหาร — ตัวเลขชุดเดียวตลอดการตั้งครรภ์ ── */}
      {topic === "nutrients" && (
        <div className="space-y-3">
          {/* 🔒 ประโยคนี้ต้องอยู่ "ก่อน" ตาราง ไม่ใช่ท้ายบล็อก — เป็นเหตุผลว่าทำไมไม่มีเลขรายไตรมาส */}
          <Box tone="teal"><p className="text-sm text-ink/80">{data.nutrients.noTrimesterNumbers}</p></Box>

          <Box title="สิ่งที่เปลี่ยนตามไตรมาสจริง ๆ คือเหตุผลว่าทำไมตอนนี้ถึงสำคัญ">
            {(data.nutrients.focus ? [data.nutrients.focus] : data.nutrients.allFocus).map((f) => (
              <div key={f.trimester} className="mt-2 first:mt-0">
                {!data.nutrients.focus && <div className="text-sm font-semibold text-teal-deep">ไตรมาสที่ {f.trimester}</div>}
                <ul className="mt-0.5 space-y-1 text-sm text-ink/80">
                  {f.focus.map((x, i) => <li key={i}>• {x.nutrient} — {x.why}</li>)}
                </ul>
              </div>
            ))}
            <p className="mt-2 text-sm text-rose-deep">⚠️ {data.nutrients.calciumMisreadWarning}</p>
          </Box>

          <div className="rounded-xl bg-white/70 p-3">
            <div className="text-sm font-semibold text-teal-deep">ปริมาณที่แนะนำต่อวัน (ค่าเดียวตลอดการตั้งครรภ์)</div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink/75">
                    <th className="pb-1 font-medium">สารอาหาร</th>
                    <th className="pb-1 font-medium">ปริมาณ/วัน</th>
                    <th className="pb-1 font-medium">หน้าที่</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nutrients.items.map((n) => (
                    <tr key={n.name} className="border-t border-black/5 align-top">
                      <td className="py-1.5 pr-2 font-medium">{n.name}</td>
                      <td className="py-1.5 pr-2 text-sm text-teal-deep">{n.amount}</td>
                      <td className="py-1.5 text-sm text-ink/80">{n.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-ink/75">ที่มา: {data.nutrients.source}</p>
          </div>

          <Box tone="warn" title="ข้อควรระวังเรื่องอาหารเสริม">
            <ul className="space-y-1 text-sm text-ink/80">
              {data.nutrients.supplementWarnings.map((x, i) => <li key={i}>⚠️ {x}</li>)}
            </ul>
          </Box>
        </div>
      )}

      {/* ── 3. นับลูกดิ้น — 2 โหมด + กติกาความปลอดภัยนอก toggle ── */}
      {topic === "kick" && (
        <div className="space-y-3">
          {/* 🔒 บล็อกนี้อยู่ "นอก" toggle โดยตั้งใจ — ต้องเห็นเสมอไม่ว่าเลือกโหมดไหน
              การมีโหมดนับเลขได้ ขึ้นอยู่กับการที่ 3 ข้อนี้แสดงอยู่ตลอด (PRD §R10 กล่อง 🔒) */}
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3">
            <div className="text-sm font-semibold text-rose-deep">อ่านก่อนเลือกวิธี — ใช้กับทั้ง 2 แบบ</div>
            <ul className="mt-1 space-y-1.5 text-sm text-ink/80">
              {data.kick.alwaysVisibleSafety.map((x, i) => <li key={i}>• {x}</li>)}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {data.kick.modes.map((m) => (
              <button
                key={m.id}
                onClick={() => { setKickMode(m.id); track("kick_mode_select", { code, mode: m.id }); }}
                aria-pressed={kickMode === m.id}
                className={`rounded-xl border px-3 py-2 text-sm ${kickMode === m.id ? "border-teal bg-teal-soft" : "border-black/10 bg-white/60"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode && (
            <Box title={mode.label}>
              <p className="text-sm text-ink/80">{mode.summary}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink/80">
                {mode.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              {/* ป้ายกำกับที่มาของแต่ละโหมด — ถ้อยคำล็อกไว้ใน lib/calc/pregnancy.ts */}
              <p className="mt-2 text-xs text-ink/75">{mode.provenance}</p>
            </Box>
          )}

          {kickMode === "count" && (
            <>
              <KickCounter />
              {/* 🔒 แทนที่จะสรุปผล — บอกตรง ๆ ว่าเราจะไม่สรุปผลให้ และทำไม */}
              <p className="text-sm text-rose-deep">{data.kick.noVerdictRule}</p>
            </>
          )}

          <p className="text-sm text-ink/80">{data.kick.gestationNote}</p>
          <p className="text-xs text-ink/75">ℹ️ {data.kick.evidenceNote}</p>
        </div>
      )}

      {/* ── 4. สัญญาณอันตราย ── */}
      {topic === "danger" && (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-deep">{data.danger.cta.primary}</p>
            <p className="mt-1 text-sm text-ink/80">{data.danger.cta.critical}</p>
            <a
              href={`tel:${data.danger.cta.criticalTel}`}
              onClick={() => track("emergency_tel_click", { code, source: "pregnancy_danger" })}
              className="btn-primary mt-2 inline-block w-full text-center"
            >
              โทร {data.danger.cta.criticalTel} (เฉพาะกรณีวิกฤต)
            </a>
            <p className="mt-2 text-sm text-ink/80">{data.danger.cta.noWaitRule}</p>
          </div>

          <p className="text-sm text-ink/80">{data.danger.timeframeNote}</p>

          <div className="space-y-2">
            {data.danger.signs.map((s, i) => (
              <div key={i} className="rounded-xl bg-white/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{s.sign}</div>
                  <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-deep">{s.action}</span>
                </div>
                <p className="mt-1 text-sm text-ink/80">{s.detail}</p>
                <p className="mt-1 text-sm text-ink/80">{s.why}</p>
                <p className="mt-1 text-xs text-ink/75">ที่มา: {s.source}</p>
              </div>
            ))}
          </div>

          <Box tone="teal"><p className="text-sm text-ink/80">{data.danger.cta.closing}</p></Box>
          <p className="text-xs text-ink/75">ที่มา: {data.danger.source}</p>
        </div>
      )}

      {/* ── ชุดสินค้าของช่วงนี้ ── */}
      {data.products.length > 0 && (
        <div className="rounded-xl bg-white/70 p-3">
          <div className="text-sm font-semibold text-teal-deep">ของบำรุงที่ทีมแนะนำสำหรับช่วงตั้งครรภ์</div>
          <ul className="mt-2 space-y-2">
            {data.products.map(({ product, note }) => {
              const photo = productPhotoSrc(product.id);
              return (
                <li key={product.id} className="flex gap-2">
                  {photo && <img src={photo} alt={product.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain" />}
                  <div className="min-w-0 text-sm">
                    <div className="font-medium leading-tight">{product.name}</div>
                    <div className="text-sm text-teal-deep">{product.price === null ? "สอบถามราคา" : `฿${product.price.toLocaleString()}`}</div>
                    <p className="text-sm text-ink/80">{product.why}</p>
                    {note && <p className="text-sm text-ink/80">{note}</p>}
                    <p className="text-sm text-ink/75">
                      วิธีทาน: {product.howto || "สอบถามทีม Baby & Mom ทาง LINE OA"}
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
        onClick={() => track("fb_menu_click", { code, source: "pregnancy" })}
      >
        🍱 ดูเมนูอาหารสำหรับคุณแม่ตั้งครรภ์ (เปิดเพจ Baby &amp; Mom)
      </a>

      <p className="text-sm text-ink/80">⚠️ {MEDICAL_DISCLAIMER}</p>
      <p className="text-xs text-ink/75">สรุปหลักฐานเต็มของเนื้อหาชุดนี้: {data.brief}</p>
    </div>
  );
}
