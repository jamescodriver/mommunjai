// Personalized "Fertility Readiness Report" generator (pure, testable).
// The reward users get for completing the questionnaire — see docs/MOTIVATION-RESEARCH.md.
// NEVER claim to cure / guarantee pregnancy. Frames as readiness & preparation.
import {
  recommendVitamins, resolvePcosStatus, Product, VitaminProfile, ArtPlan, InfertilityIssue,
  EXERCISE_FREQS,
  type MaleBehavior, type PcosStatus, type ExerciseFreq,
} from "./calc/vitamins";
import { calcProtein, Stage } from "./calc/protein";
import { bmiTier, bmiScale, type BmiResult } from "./calc/bmi";
import { calcWater, type WaterStage } from "./calc/water";
import { recommendExercise, type BaselineActivity, type ExerciseStage } from "./calc/exercise";
import { goodFatTarget, type GoodFatResult, type GoodFatStage } from "./calc/goodfat";
import { assessSleep } from "./calc/sleep";
import { buildPregnancyKnowledge, type PregnancyKnowledge } from "./calc/pregnancy";
import { buildLactationKnowledge, type LactationKnowledge } from "./calc/lactation";
import {
  PROTEIN_FOODS, PROTEIN_FOODS_SOURCE, RECOMMENDED_VEGETABLES, RECOMMENDED_FRUITS, FOOD_SOURCE_NOTE,
} from "./calc/food-reference";

export interface ReportProfile {
  nickname?: string;
  stage?: Stage | "infertility";
  weightKg?: number;
  /** R4 (R3 rev.) — ตอนนี้ถามส่วนสูงกับทุกคนในขั้น health แล้ว (เดิมถามเฉพาะคนที่ติ๊ก
   *  "น้ำหนักเกิน") เพราะ R13 ต้องแสดงตัวเลข BMI ให้ผู้ใช้เห็นจริง */
  heightCm?: number;
  ageRange?: string;
  hasPcos?: boolean;
  /** R4 — 3 สถานะ ("unsure" ไม่ได้ PCO-VIT); ถ้าไม่ส่งมาจะ fallback ไป hasPcos */
  pcosStatus?: PcosStatus;
  artPlan?: ArtPlan;
  /** R2 — only meaningful when stage === "infertility". */
  infertilityIssues?: InfertilityIssue[];
  /** R6 — พฤติกรรมของผู้กรอกเอง (stage male) */
  behaviors?: MaleBehavior[];
  /** R7 — พฤติกรรมของคู่ (ฝ่ายชาย) เมื่อติ๊ก male_factor — คนละคนกับผู้กรอก */
  partnerBehaviors?: MaleBehavior[];
  /** R4 — เวลานอน/ตื่น "HH:MM" + ความถี่ออกกำลังกาย (ใช้เต็มรูปแบบใน R15) */
  sleepBedtime?: string;
  sleepWaketime?: string;
  exerciseFreq?: ExerciseFreq;
  /** R9 — เบาหวานขณะตั้งครรภ์ */
  hasGdm?: boolean;
  /** R9/R10 — อายุครรภ์ (สัปดาห์) ใช้หาไตรมาส + กฎน้ำหัวปลี ≥16 สัปดาห์
   *  ไม่กรอก = ไม่เดาไตรมาสให้ (ดู lib/calc/pregnancy.ts) */
  gestationalWeeks?: number;
  tools?: Record<string, { input?: any; output?: any }>;
}

export interface Pillar {
  key: "egg" | "nutrition" | "sleep" | "hormone" | "water";
  label: string;
  score: number | null; // null = ยังไม่ได้ทำเครื่องมือนี้
  note: string;
  /** เครื่องมือที่ต้องทำเพื่อให้ได้คะแนนเสานี้ — ใช้ทำลิงก์ "ทำแบบประเมิน" ในรายงาน */
  toolHref?: string;
  toolLabel?: string;
}

// ── R15 — โครงรายงานใหม่ Part 1 / Part 2 ────────────────────────────────────
// PRD-UPDATE-R3-3107 §R15 (คอมเมนต์ TC-15-01 *"ปรับแทนที่เลย"*) แทนที่โครงเดิม
// (จุดแข็ง/จุดที่เสริมได้/เสาคะแนน 5 ด้าน/แผน 3 เฟส 90 วัน/สัปดาห์นี้ทำ 3 อย่าง) ทั้งหมด
//
// ทุกฟิลด์ใหม่เป็น optional โดยตั้งใจ — รายงานเก่าที่ snapshot ไว้ใน reports.payload
// ก่อน R3 ไม่มีฟิลด์เหล่านี้ ต้อง render ได้โดยไม่พัง (แค่บล็อกนั้นหายไป)

export interface WaterTarget {
  minMl: number;
  maxMl: number;
  midMl: number;
  glassesMin: number;
  glassesMax: number;
}

export interface SleepGuide {
  /** ช่วงที่แนะนำ (คัมภีร์ครูก้อย: เข้านอนก่อน 22:00 · 7–9 ชม.) */
  recommendedMinHours: number;
  recommendedMaxHours: number;
  bedtimeRule: string;
  /** เวลาที่ผู้ใช้กรอกจริงในขั้น "เล่าเรื่องสุขภาพ" (R4) — ไม่มีก็ได้ */
  bedtime?: string;
  waketime?: string;
  actualHours?: number;
  beforeTen?: boolean;
  goodDuration?: boolean;
  /** ชั่วโมงที่ยังขาดจากขั้นต่ำที่แนะนำ (0 = ถึงแล้ว) — มีเมื่อกรอกเวลาจริงเท่านั้น */
  shortfallHours?: number;
  /** ข้อความเทียบ "ที่แนะนำ vs ที่ทำจริง" — โทนอ่อนโยน ไม่ตัดสิน */
  note: string;
}

export interface ExerciseGuide {
  /** ความถี่ที่ผู้ใช้กรอก (R4) แปลงเป็น baseline ของ lib/calc/exercise.ts */
  freq?: string;
  freqLabel?: string;
  baseline: BaselineActivity;
  weeklyTarget: string;
  frequency: string;
  intensity: string;
  types: string[];
  tips: string[];
  avoid?: string[];
  evidenceNote?: string;
  sources: string[];
}

export interface ReportPart1 {
  bmi: BmiResult | null;
  water: WaterTarget | null;
  sleep: SleepGuide;
  exercise: ExerciseGuide;
}

export interface ProteinFoodRef {
  food: string;
  per: string;
  protein: string;
}

export interface ReportPart2 {
  protein: { min: number; max: number; ferty: number; note?: string } | null;
  waterMl: WaterTarget | null;
  goodFat: GoodFatResult;
  proteinFoods: ProteinFoodRef[];
  proteinFoodsSource: string;
  vegetables: string[];
  fruits: string[];
  foodSourceNote: string;
}

export interface Report {
  title: string;
  tagline: string;
  nickname: string;
  greeting: string;
  // ── คะแนน/เสา: ไม่ได้แสดงในรายงานฉบับเต็มอีกแล้ว (R15) แต่ **ยังไม่ตาย** —
  //    เป็นข้อมูลตั้งต้นของ buildTeaser() (tier teaser/medium) และการ์ด Flex ใน LINE
  //    (lib/line.ts) จึงคงกฎ "ยังไม่ประเมิน ≠ 0%" ไว้เต็มรูปแบบ
  score: number; // 0..100 overall
  scoreLabel: string;
  quickWinToday: string; // 1 thing to do today (dampens "want answer now")
  pillars: Pillar[];
  fertileWindow: { ovulation: string; start: string; end: string; next: string } | null;
  protein: { min: number; max: number; ferty: number; note?: string } | null;
  /** R13 — ตัวเลข BMI + ระดับ + สี (กลับมติ R2 ที่เคยห้ามแสดงตัวเลข — ดู lib/calc/bmi.ts)
   *  optional เพราะรายงานที่ถูก snapshot ไว้ก่อน R3 ใน `reports` ยังไม่มีฟิลด์นี้ */
  bmi?: BmiResult | null;
  vitamins: Product[];
  vitaminNote: string;
  /** R15 — ข้อมูลของคุณ (BMI · น้ำ · นอน · ออกกำลังกาย) */
  part1?: ReportPart1;
  /** R15 — โภชนาการของคุณ (โปรตีน · น้ำ · ไขมันดี · ตารางอาหาร) */
  part2?: ReportPart2;
  /** R10 — ความรู้ช่วงตั้งครรภ์ 4 หัวข้อ (มีเฉพาะ stage "pregnant")
   *  🔒 optional เสมอ: รายงานที่ snapshot ไว้ก่อน R3 ไม่มีฟิลด์นี้ ต้อง render ได้ปกติ */
  pregnancyKnowledge?: PregnancyKnowledge;
  /** R11 — ความรู้ช่วงให้นมบุตร 3 หัวข้อ (มีเฉพาะ stage "lactating") — optional เช่นกัน */
  lactationKnowledge?: LactationKnowledge;
  partnerNudge: string | null; // include the partner (~40% male factor)
  isMale: boolean; // the view swaps egg/sperm wording and the protein product off this
  cautions: string[];
  generatedFor: { stage?: string; hasPcos?: boolean; artPlan?: string };
}

const stageThai: Record<string, string> = {
  prep: "เตรียมตั้งครรภ์", infertility: "ดูแลภาวะมีบุตรยาก",
  pregnant: "ดูแลครรภ์", lactating: "ให้นมบุตร", male: "บำรุงฝ่ายชาย",
};

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

/** คำนวณเสาคะแนน + คะแนนรวม จากผลเครื่องมือที่ทำไปแล้ว
 *  แยกออกมาเป็น pure function เพื่อให้หน้ารายงานเรียกซ้ำได้ตอนผู้ใช้ไปทำแบบประเมินเพิ่มแล้วกลับมา */
export function computePillars(a: {
  isMale: boolean;
  hasPcos?: boolean;
  tools?: Record<string, { input?: any; output?: any }>;
}): { pillars: Pillar[]; score: number; scoreLabel: string } {
  const t = a.tools || {};
  const pillars: Pillar[] = [];
  const nut = t.nutrients?.output;
  const NUT = { toolHref: "/tools/nutrients", toolLabel: "เช็กสารอาหาร" };
  const SLP = { toolHref: "/tools/sleep", toolLabel: "คำนวณการนอน" };

  pillars.push({ key: "egg", label: a.isMale ? "คุณภาพอสุจิ" : "คุณภาพไข่", score: nut ? nut.pillars?.egg ?? null : null,
    note: nut
      ? (a.isMale ? "จากอาหารบำรุงอสุจิที่คุณกิน" : "จากอาหารบำรุงไข่ที่คุณกิน")
      : "ยังไม่ได้ประเมิน", ...NUT });
  pillars.push({ key: "nutrition", label: "โภชนาการรวม", score: nut ? nut.overall ?? null : null,
    note: nut ? `กินครบ ${nut.eatenCount ?? 0}/${nut.totalEat ?? 8} อย่าง` : "ยังไม่ได้ประเมิน", ...NUT });

  // โหมด "แนะนำเวลาเข้านอน" คืนแค่รายการเวลา ไม่ได้ประเมินอะไร — ต้องไม่ให้คะแนน
  const sleep = t.sleep?.output;
  const assessed = sleep && typeof sleep.goodDuration === "boolean";
  const sleepScore = assessed ? (sleep.beforeTen && sleep.goodDuration ? 92 : sleep.goodDuration ? 72 : 48) : null;
  pillars.push({ key: "sleep", label: "การนอน", score: sleepScore,
    note: assessed ? (sleep.status ? `สถานะ: ${sleep.status}` : "ประเมินแล้ว") : "ยังไม่ได้ประเมิน", ...SLP });

  let hormone: number | null = nut ? nut.pillars?.hormone ?? null : null;
  if (hormone !== null && a.hasPcos) hormone = clamp(hormone - 10);
  pillars.push({ key: "hormone", label: "สมดุลฮอร์โมน", score: hormone,
    note: hormone === null
      ? "ยังไม่ได้ประเมิน"
      : (a.hasPcos ? "การดูแลเรื่องน้ำตาลช่วยสมดุลฮอร์โมนได้ — ค่อย ๆ ปรับไปด้วยกันนะคะ" : "จากอาหารปรับสมดุลฮอร์โมน"), ...NUT });

  // PDF-19 — น้ำเป็น pillar ที่ 5 ยังไม่ประเมินจนกว่าผู้ใช้จะกรอก "ดื่มไปแล้วกี่มล." จริง
  // (แค่กดดูเป้าหมายเฉย ๆ ไม่นับ — เหมือนกฎเดียวกับโหมด A ของการนอน)
  const WTR = { toolHref: "/tools/water", toolLabel: "เช็คปริมาณน้ำ" };
  const water = t.water?.output;
  const waterAssessed = !!water?.current && typeof water.current.pct === "number";
  const waterScore = waterAssessed ? clamp(water.current.pct) : null;
  pillars.push({ key: "water", label: "การดื่มน้ำ", score: waterScore,
    note: waterAssessed ? `สถานะ: ${water.current.status}` : "ยังไม่ได้ประเมิน", ...WTR });

  const done = pillars.filter((x) => x.score !== null);
  const score = done.length ? clamp(done.reduce((s, x) => s + (x.score as number), 0) / done.length) : 50;
  const scoreLabel = score >= 80 ? "พร้อมดีมาก 💚" : score >= 60 ? "พร้อมพอควร มีจุดเสริม 💛" : "เริ่มต้นได้ดี มีหลายอย่างที่ทำได้เลย 🌱";
  return { pillars, score, scoreLabel };
}

export function generateReport(p: ReportProfile): Report {
  const t = p.tools || {};
  const baseStage: Stage = (p.stage === "infertility" ? "prep" : (p.stage as Stage)) || "prep";
  const isMale = p.stage === "male";
  // R2 — the infertility checklist's "PCOS" item is equivalent to the older
  // standalone hasPcos flag; either one turns on all the same PCOS-aware copy.
  // R4 — ตอนนี้มีทางเข้าที่ 3 คือช่อง 3 สถานะ; "ไม่แน่ใจ" **ไม่นับเป็นมี PCOS**
  // (ไม่งั้นรายงานจะพูดกับเขาเหมือนคนที่ได้รับการวินิจฉัยแล้ว — ผิด legal-compliance §4)
  const pcosStatus = resolvePcosStatus(p);
  const hasPcos = pcosStatus === "yes";

  // ----- pillars: ไม่ได้แสดงในรายงานฉบับเต็มแล้ว (R15) แต่ยังเป็นข้อมูลตั้งต้นของ
  //       buildTeaser() + การ์ด Flex ใน LINE — กฎ "ยังไม่ประเมิน ≠ 0%" จึงยังบังคับใช้เต็ม
  const { pillars, score, scoreLabel } = computePillars({ isMale, hasPcos, tools: t });

  // ----- fertile window (from ovulation tool) -----
  const ov = t.ovulation?.output;
  const fertileWindow = ov && ov.ovulationDate
    ? { ovulation: ov.ovulationDate, start: ov.fertileStart, end: ov.fertileEnd, next: ov.nextPeriod }
    : null;

  // ----- protein target -----
  let protein: Report["protein"] = null;
  const pr = t.protein?.output;
  if (pr && typeof pr.minGrams === "number") {
    protein = { min: pr.minGrams, max: pr.maxGrams, ferty: pr.fertyServings?.max ?? Math.round(pr.maxGrams / 25) };
  } else if (p.weightKg) {
    const c = calcProtein({ weightKg: p.weightKg, stage: baseStage });
    if (!("error" in c)) protein = { min: c.minGrams, max: c.maxGrams, ferty: c.fertyServings.max };
  }
  // R3 — qualitative age modifier only (decision: no new numeric formula yet).
  if (protein && (p.ageRange === "35–39" || p.ageRange === "40+")) {
    protein = { ...protein, note: "ช่วงอายุนี้ควรได้โปรตีนในช่วงบนของเกณฑ์ที่แนะนำ" };
  }

  // ----- vitamins -----
  // R13 — ทั้ง tier (ใช้เลือกข้อความ) และตัวเลขจริง + แถบสี (แสดงให้ผู้ใช้เห็น)
  // คำนวณได้เมื่อมีทั้งน้ำหนักและส่วนสูง — R4 ทำให้ถามครบทุก stage แล้ว
  const weightTier = p.weightKg && p.heightCm ? bmiTier(p.weightKg, p.heightCm) ?? undefined : undefined;
  const bmi = p.weightKg && p.heightCm ? bmiScale(p.weightKg, p.heightCm) : null;
  const vp: VitaminProfile = {
    // ⚠️ ต้องส่ง stage จริง ไม่ใช่ baseStage — baseStage แปลง "infertility" → "prep"
    // เพื่อใช้กับตารางโปรตีนเท่านั้น (protein.ts ไม่มีช่วงของ infertility) ถ้าส่ง baseStage
    // เข้ามาตรงนี้ ตาราง mapping R12 ของ "มีบุตรยาก" จะไม่มีวันทำงานจากรายงานเลย
    stage: (p.stage as VitaminProfile["stage"]) || "prep",
    hasPcos,
    pcosStatus,
    artPlan: p.artPlan || "ยัง",
    infertilityIssues: p.infertilityIssues,
    weightTier,
    ageRange: p.ageRange,
    behaviors: p.behaviors,
    partnerBehaviors: p.partnerBehaviors,
    hasGdm: p.hasGdm,
  };
  const rec = recommendVitamins(vp);

  const artActive = !!p.artPlan && p.artPlan !== "ยัง";
  // age-appropriate referral timing (clinical: <35=12mo, 35-39=6mo, 40+=now)
  // R15 — เดิมข้อความนี้ซ่อนอยู่ในแผน 90 วันเฟส 3 ซึ่งถูกตัดออกแล้ว ย้ายมาอยู่ใน
  // cautions เพื่อไม่ให้คำแนะนำ "ควรไปหาหมอเมื่อไหร่" หายไปจากรายงานพร้อมโครงเดิม
  const referral = artActive
    ? "คุณอยู่ระหว่างกระบวนการรักษาแล้ว — ปรึกษาแพทย์ที่ดูแลคุณเรื่องจังหวะเก็บไข่/ย้ายตัวอ่อนควบคู่ไปกับการดูแลตัวเอง"
    : p.ageRange === "40+"
      ? "อายุเป็นปัจจัยเรื่องเวลา แนะนำพบแพทย์ผู้เชี่ยวชาญด้านมีบุตรยากได้เลย ไม่ต้องรอให้ครบกำหนด"
      : p.ageRange === "35–39"
        ? "หากพยายามเองแล้วราว 6 เดือนยังไม่สำเร็จ ควรปรึกษาแพทย์"
        : "หากพยายามเองแล้วราว 12 เดือนยังไม่สำเร็จ ควรปรึกษาแพทย์";

  // ── R15 Part 1 — ข้อมูลของคุณ ────────────────────────────────────────────
  const stage5: WaterStage & ExerciseStage & GoodFatStage =
    (["prep", "infertility", "pregnant", "lactating", "male"] as const).includes(p.stage as any)
      ? (p.stage as WaterStage & ExerciseStage & GoodFatStage)
      : "prep";

  // น้ำ — ต้องมีน้ำหนักที่ใช้ได้จริง (calcWater คืน error เมื่ออยู่นอกช่วง 30–150 กก.)
  let water: WaterTarget | null = null;
  if (p.weightKg) {
    const w = calcWater({ weightKg: p.weightKg, stage: stage5 });
    if (!("error" in w)) {
      water = {
        minMl: w.targetMinMl, maxMl: w.targetMaxMl, midMl: w.targetMidMl,
        glassesMin: w.glasses[0], glassesMax: w.glasses[1],
      };
    }
  }

  const sleep = buildSleepGuide(p.sleepBedtime, p.sleepWaketime);

  // ออกกำลังกาย — ความถี่ที่กรอกใน R4 คือแกน personalization จริงของ lib/calc/exercise.ts
  // (baseline "เคยขยับอยู่แล้ว" vs "เพิ่งเริ่ม") ไม่ใช่อายุ — ดูคอมเมนต์หัวไฟล์ exercise.ts
  const baseline: BaselineActivity =
    p.exerciseFreq === "3-4" || p.exerciseFreq === "daily" ? "active" : "sedentary";
  const ex = recommendExercise({ stage: stage5, baseline });
  const exercise: ExerciseGuide = {
    freq: p.exerciseFreq,
    freqLabel: EXERCISE_FREQS.find((f) => f.v === p.exerciseFreq)?.label,
    baseline,
    weeklyTarget: ex.weeklyTarget,
    frequency: ex.frequency,
    intensity: ex.intensity,
    types: ex.type,
    tips: ex.tips,
    avoid: ex.avoid,
    evidenceNote: ex.evidenceNote,
    sources: ex.sources,
  };

  const part1: ReportPart1 = { bmi, water, sleep, exercise };

  // ── R15 Part 2 — โภชนาการของคุณ ──────────────────────────────────────────
  const part2: ReportPart2 = {
    protein,
    waterMl: water,
    goodFat: goodFatTarget(stage5),
    proteinFoods: PROTEIN_FOODS.map((f) => ({ food: f.food, per: f.per, protein: f.protein })),
    proteinFoodsSource: PROTEIN_FOODS_SOURCE,
    vegetables: RECOMMENDED_VEGETABLES,
    fruits: RECOMMENDED_FRUITS,
    foodSourceNote: FOOD_SOURCE_NOTE,
  };

  // ── R10 / R11 — เนื้อหาความรู้ตามช่วงชีวิต ────────────────────────────────
  // 🔒 อยู่หลัง tier gate เดิมโดยอัตโนมัติ: buildTeaser() ไม่หยิบฟิลด์นี้ และหน้ารายงาน
  //    ฉบับเต็มถูก render เฉพาะ tier "full" (ดูคอมเมนต์หัว components/report-view.tsx)
  // 🔒 R11 มีข้อจำกัด พ.ร.บ.นมผง กำกับอยู่ในไฟล์ lib/calc/lactation.ts — อ่านก่อนแก้
  const pregnancyKnowledge =
    p.stage === "pregnant" ? buildPregnancyKnowledge({ gestationalWeeks: p.gestationalWeeks }) : undefined;
  const lactationKnowledge = p.stage === "lactating" ? buildLactationKnowledge() : undefined;

  // ----- quick win today (dampens "want answer now") -----
  const quickWinToday = hasPcos
    ? "วันนี้: งดของหวานทั้งหมด แล้วดื่มน้ำอุ่น 1 แก้วตอนตื่น"
    : isMale
      ? "วันนี้: เพิ่มไข่ต้ม 2 ฟอง + เมล็ดฟักทองหนึ่งกำมือ"
      : "วันนี้: กินไข่ต้ม 2 ฟอง และเข้านอนก่อน 4 ทุ่ม";

  // ----- partner nudge (include the partner — ~40% male factor) -----
  const partnerNudge = isMale
    ? null
    : "ชวนคุณสามีเตรียมตัวไปด้วยกันนะคะ — สุขภาพฝ่ายชายมีผลต่อการเตรียมพร้อมมากกว่าที่คิด ลองให้เขาทำเครื่องมือ ‘บำรุงฝ่ายชาย’ ดู";

  // ----- cautions (ethics/safety — see docs/MOTIVATION-RESEARCH.md §5) -----
  const cautions: string[] = [
    "แผนนี้เป็นคำแนะนำทั่วไปเพื่อเตรียมความพร้อม ไม่ใช่การวินิจฉัยหรือรักษาโรค และไม่รับประกันการตั้งครรภ์",
  ];
  if (hasPcos) cautions.push("ผู้มีภาวะ PCOS รอบเดือนอาจไม่สม่ำเสมอ ผลการนับวันไข่ตกอาจคลาดเคลื่อน ควรอยู่ในการดูแลของแพทย์");
  if (artActive) {
    cautions.push("คุณกำลังอยู่ในกระบวนการรักษากับแพทย์ — อย่าหยุดหรือปรับยา/วิตามินเองก่อนปรึกษาแพทย์ เพราะบางอย่างอาจมีผลต่อการรักษา");
    // R15 — ประโยคนี้เคยเป็นข้อแรกของแผน 90 วันเดือนที่ 1 (การ์ดความปลอดภัยของผู้ป่วย ART)
    // แผนถูกตัดออกตาม TC-15-01 แต่กติกาต้องไม่หายไปด้วย จึงย้ายมาอยู่ในคำเตือน
    cautions.push("ปรึกษาแพทย์ที่ดูแลคุณก่อนเริ่มวิตามินเสริมทุกชนิด เพราะอาจมีผลต่อยาที่ได้รับ");
  }
  if (p.ageRange === "40+" || p.ageRange === "35–39" || artActive)
    cautions.push("เรื่องเวลาเป็นสิ่งสำคัญ แนะนำปรึกษาแพทย์ผู้เชี่ยวชาญควบคู่ไปด้วย");
  cautions.push(referral);
  // R3 · TC-03-02 🔒 — คำเตือน Safety Matrix ที่ recommendVitamins สร้างไว้ (หยุดเมื่อไหร่ ·
  // ชุดเตรียมผนังมดลูก · PCOS ไม่แน่ใจ · เบาหวานขณะตั้งครรภ์) เดิม "ตกหล่น" ไม่เคยไปถึง
  // รายงานเลย เพราะรายงานสร้าง cautions ของตัวเองแยก — ต่อท้ายเข้ามาแบบไม่ซ้ำข้อความ
  for (const c of rec.cautions) if (!cautions.includes(c)) cautions.push(c);

  return {
    title: "แผน 90 วัน มั่นใจก่อนมีลูก — ฉบับของคุณ",
    tagline: "ในวันที่รู้สึกควบคุมอะไรไม่ได้ นี่คือ 90 วันที่คุณลงมือเองได้",
    nickname: p.nickname || "คุณ",
    greeting: `เราอ่านคำตอบของคุณ ${p.nickname || "คุณ"} แล้ว และทำแผนนี้ขึ้นเพื่อคุณโดยเฉพาะค่ะ 💛`,
    score, scoreLabel, quickWinToday,
    pillars, fertileWindow, protein,
    vitamins: rec.primary, vitaminNote: rec.note,
    part1, part2,
    pregnancyKnowledge, lactationKnowledge,
    partnerNudge, isMale, cautions, bmi,
    generatedFor: { stage: stageThai[p.stage || "prep"], hasPcos, artPlan: p.artPlan },
  };
}

// R15 — ชั่วโมงนอนที่แนะนำ เทียบกับเวลานอน/ตื่นที่ผู้ใช้กรอกจริงในขั้น "เล่าเรื่องสุขภาพ" (R4)
// เกณฑ์: 7–9 ชม. + เข้านอนก่อน 22:00 (กฎครูก้อย — docs/nutrition-protocol.md §3)
// โทน: บอก "ห่างอยู่เท่าไร" ไม่ใช่ "คุณทำผิด" — กลุ่มเป้าหมายเปราะบาง (legal-compliance §4)
const SLEEP_MIN_H = 7;
const SLEEP_MAX_H = 9;
const BEDTIME_RULE = "เข้านอนก่อน 4 ทุ่ม (22:00)";

export function buildSleepGuide(bedtime?: string, waketime?: string): SleepGuide {
  const base = {
    recommendedMinHours: SLEEP_MIN_H,
    recommendedMaxHours: SLEEP_MAX_H,
    bedtimeRule: BEDTIME_RULE,
  };
  if (!bedtime || !waketime) {
    return {
      ...base,
      note: `เกณฑ์ที่แนะนำคือนอน ${SLEEP_MIN_H}–${SLEEP_MAX_H} ชั่วโมง และ${BEDTIME_RULE} — ยังไม่ได้กรอกเวลานอนจริงไว้ ถ้ากรอกเพิ่มเราจะเทียบให้เห็นชัดขึ้นค่ะ`,
    };
  }
  const a = assessSleep(bedtime, waketime);
  if ("error" in a) {
    return { ...base, note: `เกณฑ์ที่แนะนำคือนอน ${SLEEP_MIN_H}–${SLEEP_MAX_H} ชั่วโมง และ${BEDTIME_RULE}` };
  }
  const shortfallHours = Math.max(0, Math.round((SLEEP_MIN_H - a.hours) * 10) / 10);
  const parts: string[] = [`ตอนนี้คุณนอนราว ${a.hours} ชั่วโมง (${bedtime}–${waketime})`];
  if (shortfallHours > 0) {
    parts.push(`ยังห่างจากเกณฑ์ที่แนะนำอยู่ประมาณ ${shortfallHours} ชั่วโมง — ขยับเวลาเข้านอนให้เร็วขึ้นทีละ 15 นาทีก็ช่วยได้แล้วค่ะ`);
  } else if (a.hours > SLEEP_MAX_H) {
    parts.push("นอนนานกว่าเกณฑ์เล็กน้อย ลองสังเกตคุณภาพการนอนดูนะคะ");
  } else {
    parts.push(`อยู่ในช่วงที่แนะนำ (${SLEEP_MIN_H}–${SLEEP_MAX_H} ชั่วโมง) แล้วค่ะ`);
  }
  if (!a.beforeTen) parts.push(`ถ้าขยับให้${BEDTIME_RULE}ได้ จะตรงกับช่วงที่ฮอร์โมนซ่อมแซมทำงานดีที่สุด`);
  return {
    ...base,
    bedtime, waketime,
    actualHours: a.hours,
    beforeTen: a.beforeTen,
    goodDuration: a.goodDuration,
    shortfallHours,
    note: parts.join(" · "),
  };
}

// R5 — which depth of report a submission is allowed to see immediately (see R6
// for how this gates /api/lead's response). Decided combinations (PRD §Open Q3):
//  - "เตรียมผนังมดลูก" / "IVF-ICSI" → full (most medically intensive tracks)
//  - "IUI" / "บำรุงไข่" → medium
//  - "ยัง" + no issues (or only "ไม่แน่ใจ") → teaser
//  - "ยัง" + a real issue ticked (e.g. PCOS, but not yet in a medical process)
//    → medium: not spec-literal (PRD only names IUI/บำรุงไข่ for medium), but a
//    defined answer is needed for every input combo — flagged in the PM report.
export type ReportTier = "teaser" | "medium" | "full";
export function reportTier(p: { artPlan?: ArtPlan; infertilityIssues?: string[] }): ReportTier {
  const ap = p.artPlan || "ยัง";
  if (ap === "เตรียมผนังมดลูก" || ap === "IVF-ICSI") return "full";
  if (ap === "IUI" || ap === "บำรุงไข่") return "medium";
  const issues = (p.infertilityIssues || []).filter((x) => x !== "unsure");
  return issues.length > 0 ? "medium" : "teaser";
}

// R6 — teaser/medium responses never carry the full report body server-side.
// Full generation/storage in `reports` is unchanged; this just picks what's safe
// to hand back in /api/lead's JSON for a non-"full" tier.
export interface TeaserSummary {
  nickname: string;
  scoreLabel: string;
  weakestPillars: { label: string; note: string }[];
  recommendedProducts: { id: string; name: string; why: string }[];
  quickWinToday: string;
  /** 🔒 คำเตือนที่ต้องเดินทางมาถึงหน้า teaser ด้วย — ห้ามตัดออก (ดูคอมเมนต์ใน buildTeaser) */
  cautions: string[];
}
export function buildTeaser(report: Report): TeaserSummary {
  const scored = report.pillars.filter((x) => x.score !== null);
  const ordered = scored.length
    ? [...scored].sort((a, b) => (a.score as number) - (b.score as number))
    : report.pillars; // nothing assessed yet at lead-submit time — still surface something
  return {
    nickname: report.nickname,
    scoreLabel: report.scoreLabel,
    weakestPillars: ordered.slice(0, 2).map((x) => ({ label: x.label, note: x.note })),
    recommendedProducts: report.vitamins.slice(0, 3).map((x) => ({ id: x.id, name: x.name, why: x.why })),
    quickWinToday: report.quickWinToday,
    // 🔒 Lucifer red-team 31/7 — หน้า teaser แนะนำอาหารเสริม 3 ตัวโดยไม่มี disclaimer และ
    // ไม่มีข้อความ referral ตามอายุเลย ทั้งที่ teaser คือ tier ที่ **คนส่วนใหญ่ของแอปเห็น**
    // (หลัง R5/R11 ตัดคำถาม ART ออกจาก prep/lactating → 2 กลุ่มนี้เป็น teaser เสมอ)
    // ผลคือ H2 (referral ตามอายุ — งานแก้ red-team รอบแรก: อายุ 40+ ต้องได้ยินว่า
    // "พบแพทย์ผู้เชี่ยวชาญได้เลย ไม่ต้องรอ") ถอยหลังกลับไปเงียบ ๆ
    // ทุกผลลัพธ์สุขภาพต้องมี disclaimer เสมอตามกติกาโปรเจกต์ — teaser ไม่ใช่ข้อยกเว้น
    cautions: report.cautions,
  };
}
