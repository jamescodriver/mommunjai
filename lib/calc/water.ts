// PDF-17 — Water intake calculator (pure). Standard adult guidance ~30–35 ml
// per kg body weight (see docs/IMPACT-ANALYSIS-2607.md PDF-17). Client asked
// to ship the standard formula first ("ทำตามมาตรฐานที่แนะนำก่อน") — no
// fertility-specific water research exists yet, so this stays general-purpose
// hydration guidance, not a fertility claim.
export type WaterStage = "prep" | "infertility" | "pregnant" | "lactating" | "male";

export interface WaterInput {
  weightKg: number;
  stage: WaterStage;
  currentMl?: number;
}
export interface WaterResult {
  targetMinMl: number;
  targetMaxMl: number;
  targetMidMl: number;
  glasses: [number, number]; // ~250ml/glass
  current?: {
    ml: number;
    pct: number; // of targetMidMl, uncapped
    status: "ดี" | "เกือบถึงเป้า" | "ควรเพิ่ม";
    shortfallMl: number;
    note: string;
  };
}
export interface WaterError {
  error: string;
}

const GLASS_ML = 250;
// Pregnancy/lactation bump the standard adult range slightly (extra fluid for
// amniotic fluid / milk production) — general nutrition guidance, not a
// fertility claim; framed as a range, not a single hard number.
const STAGE_BONUS_ML: Record<WaterStage, number> = {
  prep: 0,
  infertility: 0,
  male: 0,
  pregnant: 300,
  lactating: 700,
};

export function calcWater(input: WaterInput): WaterResult | WaterError {
  const { weightKg, stage, currentMl } = input;
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 150) {
    return { error: "น้ำหนักควรอยู่ระหว่าง 30–150 กิโลกรัม" };
  }
  if (!(stage in STAGE_BONUS_ML)) return { error: "กรุณาเลือกช่วง (สเตจ)" };

  const bonus = STAGE_BONUS_ML[stage];
  const targetMinMl = Math.round(weightKg * 30 + bonus);
  const targetMaxMl = Math.round(weightKg * 35 + bonus);
  const targetMidMl = Math.round((targetMinMl + targetMaxMl) / 2);

  const result: WaterResult = {
    targetMinMl,
    targetMaxMl,
    targetMidMl,
    glasses: [Math.round(targetMinMl / GLASS_ML), Math.round(targetMaxMl / GLASS_ML)],
  };

  if (currentMl !== undefined && Number.isFinite(currentMl) && currentMl >= 0) {
    const pct = Math.round((currentMl / targetMidMl) * 100);
    const shortfallMl = Math.max(0, targetMinMl - currentMl);
    let status: "ดี" | "เกือบถึงเป้า" | "ควรเพิ่ม";
    let note: string;
    if (pct >= 90) {
      status = "ดี";
      note = "ดื่มน้ำได้ใกล้เป้าหมายแล้ว รักษาระดับนี้ไว้ได้เลยค่ะ";
    } else if (pct >= 70) {
      status = "เกือบถึงเป้า";
      note = `ใกล้ถึงเป้าแล้ว ลองเพิ่มอีกวันละ ${GLASS_ML} มล. (~1 แก้ว) เพื่อให้ร่างกายไหลเวียนและลำเลียงสารอาหารได้คล่องขึ้น`;
    } else {
      status = "ควรเพิ่ม";
      note = "ยังห่างจากเป้าหมายอยู่บ้าง ลองเพิ่มทีละแก้วในแต่ละมื้อ ไม่ต้องรีบให้ถึงเป้าในวันเดียวก็ได้ค่ะ";
    }
    result.current = { ml: currentMl, pct, status, shortfallMl, note };
  }

  return result;
}
