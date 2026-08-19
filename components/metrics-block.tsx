"use client";
import { useState } from "react";
import type { TeaserSummary } from "@/lib/report";

/**
 * R16 — กรอบ "เป้าหมายต่อวัน" บนหน้าสรุปหลังกรอกแบบสอบถามเสร็จ
 *
 * แทนบล็อกเดิม "จุดที่ควรเสริมก่อน 🌱" ที่ขึ้นว่า *"คุณภาพไข่: ยังไม่ได้ประเมิน /
 * โภชนาการรวม: ยังไม่ได้ประเมิน"* กับทุกคนที่ไม่เคยทำเครื่องมือย่อยมาก่อน — ซึ่งคือ
 * คนส่วนใหญ่ที่เข้าจากหน้าแรก แปลว่าบล็อกที่ควรโน้มน้าวที่สุดกลับว่างเปล่า
 *
 * 🔒 กฎ "ยังไม่ประเมิน ≠ 0" ยังอยู่ครบ: แถวไหนคำนวณไม่ได้จะไม่ขึ้นเลย ไม่ใช่ขึ้นเป็น 0
 *    และเราไม่เดาน้ำหนักให้ใคร — ถ้าไม่มี ก็ชวนกรอก
 *
 * โปรตีน/น้ำ/BMI ต้องใช้ "น้ำหนัก" ซึ่งไม่ได้บังคับกรอกในแบบสอบถาม (บังคับ = คนกรอกไม่จบ)
 * จึงเปิดช่องให้เติมตรงนี้ ตอนที่แรงจูงใจสูงสุดเพราะเห็นแล้วว่าจะได้อะไรกลับมา
 */
export default function MetricsBlock({
  teaser,
  onFilled,
}: {
  teaser: TeaserSummary;
  onFilled: (weightKg: number, heightCm?: number) => Promise<void> | void;
}) {
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasWeightRows = teaser.metrics.some((m) => m.key === "protein" || m.key === "water");

  const submit = async () => {
    const wn = parseFloat(w);
    const hn = h ? parseFloat(h) : undefined;
    if (!isFinite(wn) || wn < 20 || wn > 300) return setErr("กรอกน้ำหนักเป็นตัวเลข 20–300 กก. ค่ะ");
    if (hn !== undefined && (!isFinite(hn) || hn < 80 || hn > 250)) return setErr("ส่วนสูงควรอยู่ระหว่าง 80–250 ซม. ค่ะ");
    setErr(null);
    setBusy(true);
    try { await onFilled(wn, hn); } finally { setBusy(false); }
  };

  return (
    <section className="glass p-5">
      {/* U-09 (RTM 13 ส.ค. 69) — "ตัวหนังสือเล็ก ใหญ่ ทำให้อ่านง่ายๆ"
          เดิมหัวข้อ · ป้าย · ตัวเลข ใช้ขนาดใกล้กันหมด ตาไม่รู้จะเกาะตรงไหนก่อน
          ลำดับใหม่: ตัวเลขเป้าหมาย > หัวข้อ > ป้ายกำกับ > คำอธิบาย */}
      <h2 className="text-lg font-semibold leading-snug">เป้าหมายของคุณต่อวัน 🎯</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink/60">คำนวณจากคำตอบของคุณเอง เริ่มทำได้เลยวันนี้</p>

      <dl className="mt-3 divide-y divide-black/5">
        {teaser.metrics.map((m) => (
          <div key={m.key} className="flex items-baseline gap-3 py-2">
            <dt className="w-24 shrink-0 text-xs text-ink/60">{m.label}</dt>
            <dd className="flex-1 text-base font-semibold leading-snug text-teal-deep">{m.value}</dd>
          </div>
        ))}
      </dl>


      {/* ยังไม่ได้กรอกน้ำหนัก → เติมตรงนี้ กดแล้วคำนวณใหม่ทันที ไม่ต้องทำแบบสอบถามซ้ำ */}
      {!hasWeightRows && (
        <div className="mt-4 rounded-xl border border-teal/30 bg-teal-soft/40 p-3">
          <p className="text-sm font-medium text-teal-deep">อยากรู้เป้าโปรตีนกับน้ำดื่มของคุณไหมคะ?</p>
          <p className="mt-1 text-xs text-ink/75">กรอกน้ำหนัก (ส่วนสูงใส่ด้วยก็ดี จะได้ค่า BMI ในแผนฉบับเต็ม) แล้วคำนวณให้ทันที ไม่ต้องเริ่มใหม่</p>
          <div className="mt-3 flex gap-2">
            <input
              className="field" inputMode="decimal" placeholder="น้ำหนัก (กก.)"
              value={w} onChange={(e) => setW(e.target.value)}
              aria-label="น้ำหนัก หน่วยกิโลกรัม"
            />
            <input
              className="field" inputMode="decimal" placeholder="ส่วนสูง (ซม.)"
              value={h} onChange={(e) => setH(e.target.value)}
              aria-label="ส่วนสูง หน่วยเซนติเมตร"
            />
          </div>
          {err && <p className="mt-2 text-sm text-rose-deep">{err}</p>}
          <button className="btn-primary mt-3 w-full" onClick={submit} disabled={busy}>
            {busy ? "กำลังคำนวณ…" : "คำนวณเป้าหมายให้ฉัน"}
          </button>
        </div>
      )}
    </section>
  );
}
