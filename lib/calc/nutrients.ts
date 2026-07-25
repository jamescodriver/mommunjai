// M4 — Nutrient checklist (pure). See docs/nutrition-protocol.md §2.
export interface NutrientItem {
  key: string;
  label: string;
  pillar: "egg" | "uterus" | "hormone";
}
export interface AvoidItem {
  key: string;
  label: string;
}

export const EAT_ITEMS: NutrientItem[] = [
  { key: "egg", label: "ไข่ต้ม 2 ฟอง", pillar: "egg" },
  { key: "fish", label: "ปลา 1 ตัว (โอเมกา-3)", pillar: "egg" },
  { key: "avocado", label: "อะโวคาโด + น้ำผึ้งชันโรง", pillar: "hormone" },
  { key: "brownrice", label: "ข้าวกล้อง 1 ถ้วยเล็ก", pillar: "uterus" },
  { key: "veggies", label: "ผักสด 1 ถ้วย", pillar: "hormone" },
  { key: "water", label: "น้ำเปล่าไม่เย็น 2–3 ลิตร", pillar: "uterus" },
  { key: "pureveg", label: "ผงผักเพียวเรด/กรีน", pillar: "egg" },
  { key: "kaffir", label: "น้ำมะกรูด", pillar: "hormone" },
];

export const AVOID_ITEMS: AvoidItem[] = [
  { key: "sugar", label: "ของหวาน/น้ำตาล" },
  { key: "coldwater", label: "น้ำเย็น" },
  { key: "caffeine", label: "ชา/กาแฟ/คาเฟอีน" },
  { key: "transfat", label: "ไขมันทรานส์" },
  { key: "processed", label: "อาหารแปรรูป" },
];

export interface NutrientResult {
  pillars: { egg: number; uterus: number; hormone: number }; // 0..100 %
  eatenCount: number;
  totalEat: number;
  missing: string[];
  avoidViolations: string[];
  overall: number; // 0..100
}

export function assessNutrients(
  eaten: string[],
  avoided: string[], // items the user admits eating (violations)
): NutrientResult {
  const eatenSet = new Set(eaten);
  const byPillar: Record<string, { done: number; total: number }> = {
    egg: { done: 0, total: 0 },
    uterus: { done: 0, total: 0 },
    hormone: { done: 0, total: 0 },
  };
  const missing: string[] = [];
  for (const it of EAT_ITEMS) {
    byPillar[it.pillar].total++;
    if (eatenSet.has(it.key)) byPillar[it.pillar].done++;
    else missing.push(it.label);
  }
  const pct = (p: { done: number; total: number }) =>
    p.total ? Math.round((p.done / p.total) * 100) : 0;
  const avoidSet = new Set(avoided);
  const avoidViolations = AVOID_ITEMS.filter((a) => avoidSet.has(a.key)).map(
    (a) => a.label,
  );
  const eatenCount = EAT_ITEMS.filter((i) => eatenSet.has(i.key)).length;
  return {
    pillars: {
      egg: pct(byPillar.egg),
      uterus: pct(byPillar.uterus),
      hormone: pct(byPillar.hormone),
    },
    eatenCount,
    totalEat: EAT_ITEMS.length,
    missing,
    avoidViolations,
    overall: Math.round((eatenCount / EAT_ITEMS.length) * 100),
  };
}
