// R3 — internal-only BMI tiering. Standard WHO Asian-population BMI cutoffs
// (public health reference, not brand-specific — safe to hardcode, unlike a
// clinical dosage or hormone range). The app NEVER shows the number itself,
// only a qualitative tier used to nudge the nutrition/vitamin copy.
export type BmiTier = "normal" | "overweight" | "obese";

export function bmiTier(weightKg: number, heightCm: number): BmiTier | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  if (bmi < 23) return "normal";
  if (bmi < 25) return "overweight";
  return "obese";
}

// Qualitative-only copy — never paired with the raw BMI number in the UI.
export const BMI_TIER_NOTE: Record<BmiTier, string> = {
  normal: "น้ำหนักตัวอยู่ในเกณฑ์ปกติ ทานตามแผนบำรุงปกติได้เลยค่ะ",
  overweight:
    "น้ำหนักตัวอยู่ในเกณฑ์เกินมาตรฐานเล็กน้อย — เสริมโปรตีนเฟอร์ตี้ให้ครบและคุมสัดส่วนอาหารตามหลัก 70% อาหาร/30% วิตามินให้เข้มขึ้นอีกนิด",
  obese:
    "น้ำหนักตัวอยู่ในเกณฑ์เกินมาตรฐานค่อนข้างมาก — แนะนำปรึกษาแพทย์/นักโภชนาการควบคู่ไปกับการบำรุงด้วยโปรตีนเฟอร์ตี้และคุมสัดส่วนอาหารอย่างใกล้ชิด",
};
