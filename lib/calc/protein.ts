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

// g per kg body weight, per stage. Sources (see docs/nutrition-protocol.md §1):
// - prep 1.2–1.5: decided 2026-07-25 to span clinical pre-conception guidance (~1.2)
//   up to the brand's own Ferty guidance for egg/endometrium support (1.5 g/kg).
// - pregnant 1.1–1.3: standard maternal nutrition guidance.
// - lactating ~1.3, male 1.2–1.6: general nutrition guidance (not fertility-specific).
const RANGES: Record<Stage, [number, number]> = {
  prep: [1.2, 1.5],
  pregnant: [1.1, 1.3],
  lactating: [1.3, 1.3],
  male: [1.2, 1.6],
};

const FERTY_G = 25; // 1 sachet ~25g protein

// ── U-05 (RTM 13 ส.ค. 69) — "เติมเท่าไหร่" เป็นคำแนะนำของแบรนด์ ไม่ใช่ผลคำนวณ ──
//
// เดิมประโยคแนะนำ "เติมด้วยโปรตีนเฟอร์ตี้ X ซอง/วัน" หยิบเลขจาก fertyServings มาใช้
// ซึ่ง **ผิดความหมาย**: fertyServings คือ "ถ้ากินซองแทนโปรตีนทั้งวันจะใช้กี่ซอง"
// (91 ก. ÷ 25 ก./ซอง ≈ 4) ไม่ใช่ "เติมส่วนที่ขาดอีกกี่ซอง" — คนน้ำหนักมากจึงถูกแนะนำ
// ให้กิน 4 ซอง/วัน ทั้งที่ทีมหน้าร้านแนะนำจริงแค่ 1–2 ซอง
//
// 🔒 ต้นเคาะ 19 ส.ค. 69: "fix ไปเลย ว่า ถ้ากินอาหารไม่ถึงเป้า เติมด้วยโปรตีนเฟอร์ตี้
//    1-2 ซอง ต่อวัน" — เป็นค่าคงที่จากแบรนด์ **ห้ามคำนวณจากน้ำหนักตัว**
//    ใช้ค่านี้ทุกที่ที่พูดถึง "เติม" ห้ามเขียนตัวเลขซ้ำในหน้าจอเอง
export const FERTY_TOPUP = { min: 1, max: 2 } as const;

/** ประโยคแนะนำมาตรฐาน — เขียนที่เดียวเพื่อให้เว็บ/รายงาน/การ์ด LINE พูดตรงกัน */
export function fertyTopUpText(isMale = false): string {
  const name = isMale ? "Ferta" : "โปรตีนเฟอร์ตี้";
  return `ถ้ากินอาหารไม่ถึงเป้า เติมด้วย${name} ${FERTY_TOPUP.min}\u2013${FERTY_TOPUP.max} ซอง/วัน`;
}

// ── U-04 (RTM 13 ส.ค. 69) — ช่วงที่ต่ำสุด = สูงสุด ต้องไม่พิมพ์เป็น "X\u2013X" ──
//
// ช่วงโปรตีนของ "ให้นมบุตร" คือ 1.3\u20131.3 (ค่าเดียว ไม่ใช่ช่วง) ทุกจุดที่แสดงจึง
// พิมพ์ออกมาเป็น 91\u201391 กรัม / 1.3\u20131.3 ก./กก. / 4\u20134 ซอง ซึ่งการคำนวณไม่ผิด
// แต่หน้าตาทำให้ลูกค้าคิดว่าระบบพัง (ต้นเจอเอง 13 ส.ค. 69)
/** พิมพ์ช่วงตัวเลข — ถ้าค่าต่ำสุดเท่ากับสูงสุด ให้เหลือเลขเดียว */
export function fmtRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}\u2013${max}`;
}
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
