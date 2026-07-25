// M3 — Protein calculator (pure). See docs/nutrition-protocol.md §1.
export type Stage = "prep" | "pregnant" | "lactating" | "male";

export interface ProteinInput {
  weightKg: number;
  stage: Stage;
}
export interface ProteinResult {
  minGrams: number;
  maxGrams: number;
  perKg: [number, number];
  foodEquivalents: { label: string; amount: string }[];
  fertyServings: { min: number; max: number };
}
export interface ProteinError {
  error: string;
}

const RANGES: Record<Stage, [number, number]> = {
  prep: [1.0, 1.2],
  pregnant: [1.1, 1.3],
  lactating: [1.3, 1.3],
  male: [1.2, 1.6],
};

const FERTY_G = 25; // 1 sachet ~25g protein
const EGG_G = 6.5;

export function calcProtein(input: ProteinInput): ProteinResult | ProteinError {
  const { weightKg, stage } = input;
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 150) {
    return { error: "น้ำหนักควรอยู่ระหว่าง 30–150 กิโลกรัม" };
  }
  if (!RANGES[stage]) return { error: "กรุณาเลือกช่วง (สเตจ)" };
  const [lo, hi] = RANGES[stage];
  const minGrams = Math.round(weightKg * lo);
  const maxGrams = Math.round(weightKg * hi);
  const mid = (minGrams + maxGrams) / 2;
  return {
    minGrams,
    maxGrams,
    perKg: [lo, hi],
    fertyServings: {
      min: Math.max(1, Math.round(minGrams / FERTY_G)),
      max: Math.max(1, Math.round(maxGrams / FERTY_G)),
    },
    foodEquivalents: [
      { label: "ไข่ต้ม", amount: `≈ ${Math.round(mid / EGG_G)} ฟอง` },
      { label: "อกไก่/ปลา", amount: `≈ ${Math.round((mid / 25) * 100)} กรัม` },
      { label: "โปรตีนเฟอร์ตี้", amount: `≈ ${Math.round(mid / FERTY_G)} ซอง` },
    ],
  };
}
