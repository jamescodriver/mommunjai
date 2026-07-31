// BMI tiering. Standard WHO Asian-population BMI cutoffs (public health reference,
// not brand-specific — safe to hardcode, unlike a clinical dosage or hormone range).
//
// 🔄 มติกลับทาง (R13 · docs/PRD-UPDATE-R3-3107.md §Reversals · คอมเมนต์ TC-13-01):
//   เดิม (R2, 26/7) ไฟล์นี้ล็อกไว้ว่า "The app NEVER shows the number itself, only a
//   qualitative tier" เพราะตอนนั้นทีมครูก้อยเห็นว่าตัวเลขทำให้ลูกค้างง
//   ใหม่ (R3, 31/7) client ยืนยันกลับมติ: *"ให้กลับมา โชว์ BMI พร้อมใส่ scale สีให้รู้ด้วย
//   ระดับไหน"* → ตอนนี้แสดง **ตัวเลขจริง + แถบสี 4 ระดับ** ได้ (ดู bmiScale())
//   คงบันทึกมติเดิมไว้ตรงนี้ ไม่ลบทิ้ง เพื่อให้คนอ่านโค้ดรู้ว่าเป็นการกลับมติที่ตั้งใจ
//   ไม่ใช่การ "ลืมกฎเดิม"
//
// R13 ยังเพิ่มระดับ "ต่ำกว่าเกณฑ์" (<18.5) เข้ามาด้วย — กลุ่มเตรียมตั้งครรภ์ที่ผอมเกินไป
// มีผลต่อการตกไข่ ไม่ควรถูกจัดรวมเป็น "ปกติ" เหมือนก่อนหน้านี้
export type BmiTier = "underweight" | "normal" | "overweight" | "obese";

/** ค่าดิบไม่ปัดเศษ — ใช้ตัดสินระดับ (ปัดก่อนแล้วค่อยตัดระดับจะทำให้ BMI 22.96 กลายเป็น
 *  "เกินเกณฑ์" ทั้งที่ยังไม่ถึง 23 · มี unit test กันไว้) */
function rawBmi(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  return bmi;
}

/** ตัวเลข BMI สำหรับ "แสดงผล" (ทศนิยม 1 ตำแหน่ง) — null เมื่อ input ใช้ไม่ได้ ไม่เคย throw */
export function bmiValue(weightKg: number, heightCm: number): number | null {
  const bmi = rawBmi(weightKg, heightCm);
  return bmi === null ? null : Math.round(bmi * 10) / 10;
}

export function bmiTier(weightKg: number, heightCm: number): BmiTier | null {
  const bmi = rawBmi(weightKg, heightCm);
  if (bmi === null) return null;
  return tierOf(bmi);
}

/** แยกออกมาเพื่อให้ทั้ง bmiTier() และ bmiScale() ใช้เกณฑ์ชุดเดียวกัน (ห้ามมี 2 ที่) */
function tierOf(bmi: number): BmiTier {
  if (bmi < 18.5) return "underweight";
  if (bmi < 23) return "normal";
  if (bmi < 25) return "overweight";
  return "obese";
}

export interface BmiBand {
  tier: BmiTier;
  label: string;
  /** ช่วงตัวเลขที่แสดงใต้แถบสี */
  range: string;
  /** สีจาก CI จริงของแบรนด์ (docs/BRAND.md) — ส่งเป็น hex เพราะ Tailwind purge
   *  ตัด class ที่ประกอบชื่อแบบ dynamic ทิ้ง */
  color: string;
}

/** แถบสี 4 ระดับตามตารางใน PRD R13 (ฟ้า/เขียว/ทอง/ชมพูเข้ม) */
export const BMI_BANDS: BmiBand[] = [
  { tier: "underweight", label: "ต่ำกว่าเกณฑ์", range: "< 18.5", color: "#5FA9DE" },
  { tier: "normal", label: "ปกติ", range: "18.5 – 22.9", color: "#1BC0BA" },
  { tier: "overweight", label: "เกินเกณฑ์", range: "23.0 – 24.9", color: "#E7B84B" },
  { tier: "obese", label: "อ้วน", range: "≥ 25.0", color: "#E14F97" },
];

export interface BmiResult {
  bmi: number;
  tier: BmiTier;
  label: string;
  color: string;
  note: string;
}

/** R13 — ตัวเลข + ระดับ + สี พร้อมใช้ในหน้าจอ (null เมื่อยังไม่มีน้ำหนัก/ส่วนสูงที่ใช้ได้) */
export function bmiScale(weightKg: number, heightCm: number): BmiResult | null {
  const raw = rawBmi(weightKg, heightCm);
  if (raw === null) return null;
  const tier = tierOf(raw);
  const band = BMI_BANDS.find((b) => b.tier === tier)!;
  return { bmi: Math.round(raw * 10) / 10, tier, label: band.label, color: band.color, note: BMI_TIER_NOTE[tier] };
}

// ข้อความประกอบระดับ — กลุ่มเป้าหมายเปราะบางทางอารมณ์ (legal-compliance.md §4):
// ห้ามตัดสิน/ทำให้รู้สึกผิด และห้ามพูดถึงตัวเลขซ้ำในข้อความ (ตัวเลขแสดงแยกอยู่แล้ว)
export const BMI_TIER_NOTE: Record<BmiTier, string> = {
  underweight:
    "น้ำหนักตัวอยู่ในเกณฑ์ต่ำกว่ามาตรฐาน — การได้พลังงานและโปรตีนให้พอในแต่ละวันช่วยสนับสนุนรอบเดือนและการตกไข่ ลองเพิ่มมื้อว่างที่มีโปรตีนและไขมันดีดูนะคะ",
  normal: "น้ำหนักตัวอยู่ในเกณฑ์ปกติ ทานตามแผนบำรุงปกติได้เลยค่ะ",
  overweight:
    "น้ำหนักตัวอยู่ในเกณฑ์เกินมาตรฐานเล็กน้อย — เสริมโปรตีนเฟอร์ตี้ให้ครบและคุมสัดส่วนอาหารตามหลัก 70% อาหาร/30% วิตามินให้เข้มขึ้นอีกนิด",
  obese:
    "น้ำหนักตัวอยู่ในเกณฑ์เกินมาตรฐานค่อนข้างมาก — แนะนำปรึกษาแพทย์/นักโภชนาการควบคู่ไปกับการบำรุงด้วยโปรตีนเฟอร์ตี้และคุมสัดส่วนอาหารอย่างใกล้ชิด",
};
