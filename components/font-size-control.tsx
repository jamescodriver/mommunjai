"use client";
import { useEffect, useState } from "react";
import { FONT_SCALES, applyFontScale, readFontScale, FONT_SCALE_KEY, type FontScaleId } from "@/lib/font-scale";

/** ปุ่ม ก ก ก — ให้ผู้ใช้เลือกขนาดตัวอักษรเอง แทนที่จะเดาแทนทุกคน */
export default function FontSizeControl({ className = "" }: { className?: string }) {
  // เริ่มที่ "normal" เสมอเพื่อให้ตรงกับ HTML ที่ server ส่งมา (กัน hydration mismatch)
  // แล้วค่อยซิงก์กับค่าจริงใน localStorage หลัง mount — ส่วนการ apply ขนาดจริง
  // ทำไปแล้วตั้งแต่สคริปต์ใน <head> จึงไม่มีจังหวะที่ขนาดกระตุก
  const [scale, setScale] = useState<FontScaleId>("normal");
  useEffect(() => setScale(readFontScale()), []);

  const pick = (id: FontScaleId) => {
    setScale(id);
    applyFontScale(id);
    try { localStorage.setItem(FONT_SCALE_KEY, id); } catch { /* โหมดส่วนตัว/ปิดคุกกี้ — ข้ามไป ไม่ต้องพัง */ }
  };

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <span className="mr-1 text-xs text-ink/75">ขนาดตัวอักษร</span>
      <div className="flex items-center gap-1 rounded-full bg-white/70 p-1" role="group" aria-label="ปรับขนาดตัวอักษร">
        {FONT_SCALES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => pick(s.id)}
            aria-pressed={scale === s.id}
            title={s.title}
            className={`flex h-8 w-8 items-center justify-center rounded-full leading-none transition ${
              scale === s.id ? "bg-teal text-white" : "text-ink/75 hover:bg-teal-soft"
            }`}
            // ขนาดตัว "ก" บนปุ่มบอกใบ้ว่ากดแล้วจะได้ตัวใหญ่แค่ไหน — ใช้ px คงที่
            // จงใจ ไม่ใช้ rem เพราะปุ่มต้องไม่ขยายตามค่าที่ตัวเองกำลังตั้ง
            style={{ fontSize: `${12 + i * 3}px` }}
          >
            {s.label}
            <span className="sr-only">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
