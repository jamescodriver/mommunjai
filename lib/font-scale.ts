// ขนาดตัวอักษรที่ผู้ใช้เลือกเอง (ปุ่ม ก ก ก บนหัวรายงาน)
//
// วิธีทำงาน: ทุกขนาดใน Tailwind เป็นหน่วย rem ซึ่งอิงกับ font-size ของ <html>
// การเปลี่ยน font-size ของ <html> จึงย่อ/ขยาย "ทั้งหน้า" ตามสัดส่วนเดิม
// (ทั้งตัวอักษร ระยะห่าง และความกว้างกล่อง) ไม่ใช่แค่ขยายตัวหนังสือจนล้นกรอบ
//
// ค่าที่เลือกไว้จำข้ามหน้า/ข้ามครั้ง ผ่าน localStorage และถูก apply ตั้งแต่ก่อน
// วาดหน้าแรก (สคริปต์ใน app/layout.tsx) เพื่อไม่ให้เห็นตัวอักษรกระตุกตอนโหลด

export const FONT_SCALE_KEY = "mj_font_scale";

/** ค่าเริ่มต้นของทั้งแอป — ต้องตรงกับ `html { font-size }` ใน app/globals.css เป๊ะ ๆ
 *  (ต้นเคาะ 1/8: เอาขนาดกลางเดิมเป็นค่าเริ่มต้นเลย ข้อความเนื้อหาจะได้ ~17px) */
export const DEFAULT_ROOT_PX = 17.5;

export const FONT_SCALES = [
  { id: "compact", label: "ก", title: "เล็กลง", px: 16 },
  { id: "normal", label: "ก", title: "ขนาดปกติ", px: DEFAULT_ROOT_PX },
  { id: "large", label: "ก", title: "ใหญ่ที่สุด", px: 19.5 },
] as const;

export type FontScaleId = (typeof FONT_SCALES)[number]["id"];

export function pxForScale(id: string): number {
  return FONT_SCALES.find((s) => s.id === id)?.px ?? DEFAULT_ROOT_PX;
}

export function applyFontScale(id: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = `${pxForScale(id)}px`;
}

export function readFontScale(): FontScaleId {
  if (typeof localStorage === "undefined") return "normal";
  const v = localStorage.getItem(FONT_SCALE_KEY);
  return FONT_SCALES.some((s) => s.id === v) ? (v as FontScaleId) : "normal";
}

/** สคริปต์ที่ฝังใน <head> — ต้องรันก่อน React hydrate ไม่งั้นจะเห็นขนาดกระตุก */
export const FONT_SCALE_BOOT_SCRIPT = `try{var m={${FONT_SCALES.map(
  (s) => `${JSON.stringify(s.id)}:${s.px}`,
).join(",")}};var v=localStorage.getItem(${JSON.stringify(
  FONT_SCALE_KEY,
)});if(m[v])document.documentElement.style.fontSize=m[v]+"px"}catch(e){}`;
