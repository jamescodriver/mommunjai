// ขนาดตัวอักษรที่ผู้ใช้เลือกเอง (ปุ่ม ก ก ก บนหัวรายงาน)
//
// วิธีทำงาน: ทุกขนาดใน Tailwind เป็นหน่วย rem ซึ่งอิงกับ font-size ของ <html>
// การเปลี่ยน font-size ของ <html> จึงย่อ/ขยาย "ทั้งหน้า" ตามสัดส่วนเดิม
// (ทั้งตัวอักษร ระยะห่าง และความกว้างกล่อง) ไม่ใช่แค่ขยายตัวหนังสือจนล้นกรอบ
//
// ⚠️ ปุ่มนี้ตั้ง **ตัวคูณ** (--fs-scale) ไม่ใช่ px ตรง ๆ เพราะขนาดฐาน (--fs-base ใน
// app/globals.css) ต่างกันระหว่างมือถือ 17.5px กับจอใหญ่ 19.5px — ถ้าปุ่มตั้ง px ตรง ๆ
// การกด "ขนาดปกติ" บน desktop จะกลายเป็นการย่อหน้าจอลงเป็นค่ามือถือ ซึ่งผิดความหมาย
//
// ค่าที่เลือกไว้จำข้ามหน้า/ข้ามครั้ง ผ่าน localStorage และถูก apply ตั้งแต่ก่อน
// วาดหน้าแรก (สคริปต์ใน app/layout.tsx) เพื่อไม่ให้เห็นตัวอักษรกระตุกตอนโหลด

export const FONT_SCALE_KEY = "mj_font_scale";
/** ชื่อ CSS variable ที่ปุ่มนี้เขียนทับ — ต้องตรงกับ app/globals.css */
export const FONT_SCALE_VAR = "--fs-scale";

export const FONT_SCALES = [
  { id: "compact", label: "ก", title: "เล็กลง", scale: 0.9 },
  { id: "normal", label: "ก", title: "ขนาดปกติ", scale: 1 },
  { id: "large", label: "ก", title: "ใหญ่ที่สุด", scale: 1.12 },
] as const;

export type FontScaleId = (typeof FONT_SCALES)[number]["id"];

export function scaleFor(id: string): number {
  return FONT_SCALES.find((s) => s.id === id)?.scale ?? 1;
}

export function applyFontScale(id: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(FONT_SCALE_VAR, String(scaleFor(id)));
}

export function readFontScale(): FontScaleId {
  if (typeof localStorage === "undefined") return "normal";
  const v = localStorage.getItem(FONT_SCALE_KEY);
  return FONT_SCALES.some((s) => s.id === v) ? (v as FontScaleId) : "normal";
}

/** สคริปต์ที่ฝังใน <head> — ต้องรันก่อน React hydrate ไม่งั้นจะเห็นขนาดกระตุก */
export const FONT_SCALE_BOOT_SCRIPT = `try{var m={${FONT_SCALES.map(
  (s) => `${JSON.stringify(s.id)}:${s.scale}`,
).join(",")}};var v=localStorage.getItem(${JSON.stringify(
  FONT_SCALE_KEY,
)});if(m[v])document.documentElement.style.setProperty(${JSON.stringify(
  FONT_SCALE_VAR,
)},m[v])}catch(e){}`;
