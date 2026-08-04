// Personalized "Fertility Readiness Report" generator (pure, testable).
// The reward users get for completing the questionnaire — see docs/MOTIVATION-RESEARCH.md.
// NEVER claim to cure / guarantee pregnancy. Frames as readiness & preparation.
import {
  recommendVitamins, resolvePcosStatus, Product, VitaminProfile, ArtPlan, InfertilityIssue,
  EXERCISE_FREQS,
  type MaleBehavior, type PcosStatus, type ExerciseFreq, type ConceptionMethod,
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
  /** R4 (0408) · PDF-12 — ท้องธรรมชาติ/IUI/ICSI มีความหมายเฉพาะ stage "pregnant" */
  conceptionMethod?: ConceptionMethod;
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

// หัวเรื่อง/คำโปรยรายงาน แยกตามช่วงชีวิต — ใช้ทั้งบนเว็บและหัวการ์ด Flex ใน LINE
// 🔒 ห้ามพูดถึงลูก/น้ำนม ในชุด lactating (พ.ร.บ.นมผง — ดู docs/legal-compliance.md §2)
// 🔒 ห้ามเคลมผลลัพธ์ ("เพิ่มโอกาส"/"การันตี") — ใช้ภาษา "เตรียม/ดูแล/ฟื้นฟู" เท่านั้น
export const STAGE_TITLE: Record<string, string> = {
  prep: "แผน 90 วัน เตรียมร่างกายให้พร้อม — ฉบับของคุณ",
  infertility: "แผน 90 วัน บำรุงเฉพาะทาง — ฉบับของคุณ",
  male: "แผน 90 วัน บำรุงฝ่ายชาย — ฉบับของคุณ",
  pregnant: "แผนดูแลครรภ์ — ฉบับของคุณ",
  lactating: "แผนฟื้นฟูร่างกายหลังคลอด — ฉบับของคุณ",
};
export const STAGE_TAGLINE: Record<string, string> = {
  prep: "ในวันที่รู้สึกควบคุมอะไรไม่ได้ นี่คือ 90 วันที่คุณลงมือเองได้",
  infertility: "ในวันที่รู้สึกควบคุมอะไรไม่ได้ นี่คือ 90 วันที่คุณลงมือเองได้",
  male: "ไข่และอสุจิใช้เวลาพัฒนาจนสมบูรณ์ราว 90 วัน — เริ่มวันนี้ทันเสมอ",
  pregnant: "ดูแลตัวเองให้ดีในทุกไตรมาส ด้วยความรู้ที่มีงานวิจัยรองรับ",
  lactating: "ร่างกายคุณแม่ก็ต้องการการฟื้นฟู — เริ่มจากสิ่งที่ทำได้จริงในแต่ละวัน",
};

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
  // 🔒 ช่วงมีโอกาสสูงมีความหมายเฉพาะคนที่กำลังพยายามตั้งครรภ์เท่านั้น
  //    เดิมไม่มีเงื่อนไขช่วงชีวิตเลย → คนที่เคยใช้เครื่องมือนับวันไข่ตกไว้ก่อน แล้วต่อมา
  //    ตั้งครรภ์/ให้นม จะยังเห็น "ช่วงมีโอกาสสูงรอบถัดไป" ในรายงานและในการ์ด LINE
  //    ซึ่งทั้งไม่ถูกต้องและสะกิดใจคนที่เพิ่งแท้ง (พบตอนพรีวิวการ์ด Flex ทีละ stage 1/8/2026)
  const fertileStages = p.stage === undefined || ["prep", "infertility", "male"].includes(p.stage);
  const fertileWindow = fertileStages && ov && ov.ovulationDate
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
  // R4 (0408) · PDF-09 — สัญญาณการนอนสำหรับ Night Shot ต้องคำนวณก่อน vp เพราะ
  // recommendVitamins อ่านจาก vp.sleepSignal โดยตรง — ไม่กรอกเวลานอน = undefined (ไม่เดา)
  const sleepAssess = p.sleepBedtime && p.sleepWaketime ? assessSleep(p.sleepBedtime, p.sleepWaketime) : null;
  const sleepSignal: "bad" | "ok" | undefined =
    sleepAssess && !("error" in sleepAssess) ? (sleepAssess.goodDuration && sleepAssess.beforeTen ? "ok" : "bad") : undefined;
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
    sleepSignal,
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

  // R4 (0408) · PDF-02/07 — "quickWinToday" (กล่อง "วันนี้ทำอะไร") ตัดออกทั้งระบบตามที่
  // client ยืนยัน ("เอาออกทั้ง teaser และ line card") — เอาออกทั้งหน้าเทสเซอร์ (app/plan)
  // และการ์ด LINE Flex (lib/line.ts) ไม่ใช่แค่ซ่อนบน UI

  // ----- partner nudge (include the partner — ~40% male factor) -----
  const partnerNudge = isMale
    ? null
    : "ชวนคุณสามีเตรียมตัวไปด้วยกันนะคะ — สุขภาพฝ่ายชายมีผลต่อการเตรียมพร้อมมากกว่าที่คิด ลองให้เขาทำเครื่องมือ ‘บำรุงฝ่ายชาย’ ดู";

  // ----- cautions (ethics/safety — see docs/MOTIVATION-RESEARCH.md §5) -----
  // 🔒 คำเตือนชุดนี้เขียนขึ้นสำหรับ "คนที่กำลังพยายามมีลูก" แต่เดิมถูกใส่ให้ทุก stage
  //    คนที่ตั้งครรภ์แล้วจึงได้อ่านว่า "ไม่รับประกันการตั้งครรภ์" และแม่ให้นมได้อ่านว่า
  //    "หากพยายามเองแล้วราว 12 เดือนยังไม่สำเร็จ ควรปรึกษาแพทย์" (ต้นเจอเอง 1/8/2026)
  //    → แยกตามช่วงชีวิต แต่ **ห้ามลดจำนวนคำเตือนลง** — กลุ่มที่ไม่ได้พยายามมีลูก
  //    ต้องได้คำเตือนที่ตรงกับเขาแทน ไม่ใช่ได้น้อยลง (กติกา red-team รอบแรก H2)
  const tryingToConceive = !["pregnant", "lactating"].includes(p.stage || "prep");
  const cautions: string[] = [
    tryingToConceive
      ? "แผนนี้เป็นคำแนะนำทั่วไปเพื่อเตรียมความพร้อม ไม่ใช่การวินิจฉัยหรือรักษาโรค และไม่รับประกันการตั้งครรภ์"
      : "แผนนี้เป็นคำแนะนำทั่วไปเพื่อการดูแลสุขภาพ ไม่ใช่การวินิจฉัยหรือรักษาโรค",
  ];
  if (hasPcos) cautions.push("ผู้มีภาวะ PCOS รอบเดือนอาจไม่สม่ำเสมอ ผลการนับวันไข่ตกอาจคลาดเคลื่อน ควรอยู่ในการดูแลของแพทย์");
  if (artActive) {
    cautions.push("คุณกำลังอยู่ในกระบวนการรักษากับแพทย์ — อย่าหยุดหรือปรับยา/วิตามินเองก่อนปรึกษาแพทย์ เพราะบางอย่างอาจมีผลต่อการรักษา");
    // R15 — ประโยคนี้เคยเป็นข้อแรกของแผน 90 วันเดือนที่ 1 (การ์ดความปลอดภัยของผู้ป่วย ART)
    // แผนถูกตัดออกตาม TC-15-01 แต่กติกาต้องไม่หายไปด้วย จึงย้ายมาอยู่ในคำเตือน
    cautions.push("ปรึกษาแพทย์ที่ดูแลคุณก่อนเริ่มวิตามินเสริมทุกชนิด เพราะอาจมีผลต่อยาที่ได้รับ");
  }
  if (tryingToConceive && (p.ageRange === "40+" || p.ageRange === "35–39" || artActive))
    cautions.push("เรื่องเวลาเป็นสิ่งสำคัญ แนะนำปรึกษาแพทย์ผู้เชี่ยวชาญควบคู่ไปด้วย");
  // R4 (0408) · PDF-12 — ต้นยืนยัน (4/08) "แนะนำตามจริง": การตั้งครรภ์จาก IUI/ICSI มักอยู่ใน
  // การดูแลต่อเนื่องของแพทย์ผู้เชี่ยวชาญด้านมีบุตรยากในช่วงแรก (เช่น ยาฮอร์โมนเสริม) — เป็น
  // ข้อเท็จจริงทางการแพทย์ที่มีจริง ไม่ใช่การเพิ่มสินค้า/สรรพคุณใหม่ที่ไม่มีหลักฐาน (ตรวจแล้ว
  // ไม่มี logic ใดใน recommendVitamins ที่ควรแยกสินค้าตามวิธีตั้งครรภ์ เพราะไม่มีหลักฐาน
  // รองรับว่าวิตามินควรต่างกัน — ความต่างที่แท้จริงคือการดูแล/ประสานแพทย์)
  if (p.stage === "pregnant" && (p.conceptionMethod === "ท้องด้วย IUI" || p.conceptionMethod === "ท้องด้วย ICSI")) {
    cautions.push("การตั้งครรภ์จาก IUI/ICSI มักอยู่ในการดูแลต่อเนื่องของแพทย์ผู้เชี่ยวชาญด้านมีบุตรยากในช่วงแรก (เช่น ยาฮอร์โมนเสริม) — ควรแจ้งให้แพทย์ฝากครรภ์และแพทย์ที่ดูแลเรื่องมีบุตรยากประสานกัน ก่อนเริ่มหรือปรับอาหารเสริมใดๆ");
  }
  // referral ตามอายุใช้กับคนที่กำลังพยายามมีลูกเท่านั้น · อีก 2 กลุ่มได้ referral ของตัวเอง
  // ที่ "เร่งด่วนกว่า" (ไม่ต้องรอนัด) ไม่ใช่ได้คำเตือนน้อยลง
  cautions.push(
    tryingToConceive
      ? referral
      : p.stage === "pregnant"
        ? "ฝากครรภ์ตามนัดทุกครั้ง และหากมีอาการผิดปกติ ให้พบแพทย์ทันทีโดยไม่ต้องรอถึงวันนัด"
        : "หลังคลอดหากมีอาการผิดปกติ ให้พบแพทย์ทันทีโดยไม่ต้องรอถึงวันนัดตรวจหลังคลอด",
  );
  // R3 · TC-03-02 🔒 — คำเตือน Safety Matrix ที่ recommendVitamins สร้างไว้ (หยุดเมื่อไหร่ ·
  // ชุดเตรียมผนังมดลูก · PCOS ไม่แน่ใจ · เบาหวานขณะตั้งครรภ์) เดิม "ตกหล่น" ไม่เคยไปถึง
  // รายงานเลย เพราะรายงานสร้าง cautions ของตัวเองแยก — ต่อท้ายเข้ามาแบบไม่ซ้ำข้อความ
  for (const c of rec.cautions) if (!cautions.includes(c)) cautions.push(c);

  return {
    // 🔒 หัวเรื่องต้องตรงกับช่วงชีวิตจริง — เดิมเป็นข้อความเดียวตายตัวทุก stage ทำให้
    //    คนที่ตั้งครรภ์แล้วหรือกำลังให้นม ได้รายงานพาดหัวว่า "มั่นใจก่อนมีลูก"
    //    (โผล่ทั้งหัวรายงานบนเว็บและหัวการ์ดใน LINE — พบตอนพรีวิวการ์ดทีละ stage 1/8/2026)
    title: STAGE_TITLE[p.stage || "prep"] || STAGE_TITLE.prep,
    tagline: STAGE_TAGLINE[p.stage || "prep"] || STAGE_TAGLINE.prep,
    nickname: p.nickname || "คุณ",
    greeting: `เราอ่านคำตอบของคุณ ${p.nickname || "คุณ"} แล้ว และทำแผนนี้ขึ้นเพื่อคุณโดยเฉพาะค่ะ 💛`,
    score, scoreLabel,
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
/** แถว "เป้าหมายต่อวัน" ที่คำนวณจากคำตอบของผู้ใช้เอง — ใช้ร่วมกันระหว่างหน้า teaser
 *  กับการ์ด Flex ใน LINE เขียนที่เดียวเพื่อไม่ให้ 2 ที่แสดงตัวเลขไม่ตรงกัน
 *
 *  🔒 กฎ "ยังไม่ประเมิน ≠ 0" — แถวไหนคำนวณไม่ได้ (ไม่ได้กรอกน้ำหนัก ฯลฯ) ให้ **หายไป**
 *     ห้ามเดาค่า ห้ามแสดง 0 · ฝั่งหน้าจอเช็คว่าอาร์เรย์ว่างแล้วชวนกรอกเพิ่มแทน */
export interface PlanMetric {
  key: "protein" | "water" | "sleep" | "exercise";
  label: string;
  value: string;
}

export function planMetrics(report: Report): PlanMetric[] {
  const p1 = report.part1;
  const p2 = report.part2;
  const rows: PlanMetric[] = [];
  const protein = p2?.protein ?? report.protein;
  if (protein) rows.push({ key: "protein", label: "โปรตีน", value: `${protein.min}–${protein.max} ก./วัน` });
  const water = p1?.water ?? p2?.waterMl;
  if (water) rows.push({ key: "water", label: "น้ำดื่ม", value: `${water.minMl.toLocaleString()}–${water.maxMl.toLocaleString()} มล./วัน` });
  if (p1?.sleep) rows.push({ key: "sleep", label: "นอน", value: `${p1.sleep.recommendedMinHours}–${p1.sleep.recommendedMaxHours} ชม./คืน` });
  if (p1?.exercise?.weeklyTarget) {
    // เป้าฉบับเต็มยาวได้ถึง ~100 ตัวอักษร — ในกรอบสรุปเอาแค่ทางเลือกแรก
    rows.push({ key: "exercise", label: "ออกกำลังกาย", value: p1.exercise.weeklyTarget.split(" หรือ ")[0] });
  }
  return rows;
}

export interface TeaserSummary {
  nickname: string;
  scoreLabel: string;
  /** R16 — เป้าหมายต่อวันที่คำนวณจากตัวผู้ใช้เอง (แทนบล็อก "จุดที่ควรเสริมก่อน" ที่เดิม
   *  ขึ้นว่า "ยังไม่ได้ประเมิน" ลอย ๆ กับคนที่ยังไม่เคยทำเครื่องมือย่อย = คนส่วนใหญ่) */
  metrics: PlanMetric[];
  weakestPillars: { label: string; note: string }[];
  recommendedProducts: { id: string; name: string; why: string }[];
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
    metrics: planMetrics(report),
    weakestPillars: ordered.slice(0, 2).map((x) => ({ label: x.label, note: x.note })),
    // R4 (0408) · PDF-01/14 — ขยายจาก 3 เป็น 4 ตัว: ที่ 3 ตัวเคยตัด probiotics/ตัวสุดท้าย
    // ของชุด core (4 ตัว) ออกไปเงียบ ๆ ทุก stage ที่ core มี 4 ตัวพอดี (prep/infertility/
    // pregnant) → confirm แล้วว่าให้โชว์ทั้ง 4 ไม่ใช่ตัดเหลือ 3
    recommendedProducts: report.vitamins.slice(0, 4).map((x) => ({ id: x.id, name: x.name, why: x.why })),
    // 🔒 Lucifer red-team 31/7 — หน้า teaser แนะนำอาหารเสริม 3 ตัวโดยไม่มี disclaimer และ
    // ไม่มีข้อความ referral ตามอายุเลย ทั้งที่ teaser คือ tier ที่ **คนส่วนใหญ่ของแอปเห็น**
    // (หลัง R5/R11 ตัดคำถาม ART ออกจาก prep/lactating → 2 กลุ่มนี้เป็น teaser เสมอ)
    // ผลคือ H2 (referral ตามอายุ — งานแก้ red-team รอบแรก: อายุ 40+ ต้องได้ยินว่า
    // "พบแพทย์ผู้เชี่ยวชาญได้เลย ไม่ต้องรอ") ถอยหลังกลับไปเงียบ ๆ
    // ทุกผลลัพธ์สุขภาพต้องมี disclaimer เสมอตามกติกาโปรเจกต์ — teaser ไม่ใช่ข้อยกเว้น
    cautions: report.cautions,
  };
}
