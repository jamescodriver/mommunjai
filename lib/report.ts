// Personalized "Fertility Readiness Report" generator (pure, testable).
// The reward users get for completing the questionnaire — see docs/MOTIVATION-RESEARCH.md.
// NEVER claim to cure / guarantee pregnancy. Frames as readiness & preparation.
import { recommendVitamins, Product, VitaminProfile, ArtPlan, InfertilityIssue } from "./calc/vitamins";
import { calcProtein, Stage } from "./calc/protein";
import { bmiTier } from "./calc/bmi";

export interface ReportProfile {
  nickname?: string;
  stage?: Stage | "infertility";
  weightKg?: number;
  /** R3 — only collected when the "น้ำหนักเกิน" issue is checked; used internally for a BMI tier only. */
  heightCm?: number;
  ageRange?: string;
  hasPcos?: boolean;
  artPlan?: ArtPlan;
  /** R2 — only meaningful when stage === "infertility". */
  infertilityIssues?: InfertilityIssue[];
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
export interface PlanPhase {
  phase: string;
  title: string;
  items: string[];
}
export interface Report {
  title: string;
  tagline: string;
  nickname: string;
  greeting: string;
  score: number; // 0..100 overall — presented gently, AFTER strengths
  scoreLabel: string;
  strengths: string[]; // "จุดแข็งของคุณ" — shown FIRST (research: never lead with a low score)
  improvements: string[]; // "จุดที่เสริมได้" (never framed as failures)
  quickWinToday: string; // 1 thing to do today (dampens "want answer now")
  pillars: Pillar[];
  fertileWindow: { ovulation: string; start: string; end: string; next: string } | null;
  protein: { min: number; max: number; ferty: number; note?: string } | null;
  vitamins: Product[];
  vitaminNote: string;
  plan90: PlanPhase[];
  weeklyActions: string[];
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
  const hasPcos = !!p.hasPcos || !!p.infertilityIssues?.includes("pcos");

  // ----- pillars from whichever tools were completed -----
  const { pillars, score, scoreLabel } = computePillars({ isMale, hasPcos, tools: t });
  const done = pillars.filter((x) => x.score !== null);

  // ----- strengths FIRST (research: never lead with a low score for a hurting person) -----
  const strengths: string[] = [];
  done.filter((x) => (x.score as number) >= 65).forEach((x) => strengths.push(`${x.label}ของคุณอยู่ในเกณฑ์ดี (${x.score}%) — รักษาไว้ต่อเนื่องนะคะ`));
  if (t.ovulation?.output?.ovulationDate) strengths.push(`คุณเริ่มวางแผนจากรอบเดือน${isMale ? "ของคู่" : ""}แล้ว เป็นก้าวที่สำคัญมาก`);
  if (t.protein?.output) strengths.push(`คุณใส่ใจเรื่องโปรตีนบำรุง${isMale ? "อสุจิ" : "ไข่"} ซึ่งเป็นหัวใจของการเตรียมตัว`);
  if (strengths.length === 0) strengths.push("คุณลงมือหาข้อมูลและเริ่มเตรียมตัววันนี้ — นั่นคือจุดเริ่มที่ดีที่สุดแล้วค่ะ");

  // ----- "จุดที่เสริมได้" (never "จุดที่พลาด") -----
  const improvements: string[] = [];
  done.filter((x) => (x.score as number) < 65).forEach((x) => improvements.push(`${x.label}: มีพื้นที่ให้เสริมอีกนิด — ${x.note}`));
  // เสาที่ยังไม่ได้ประเมินไม่ต้องพูดซ้ำตรงนี้ — หมวด "ความพร้อมโดยรวม" มีลิงก์ไปทำแบบประเมินให้แล้ว

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
  // R3 — internal-only BMI tier (never shown as a number), only computed when
  // both height+weight are present (height is only ever collected after the
  // "น้ำหนักเกิน" checkbox in R2 — see app/plan/page.tsx).
  const weightTier = p.weightKg && p.heightCm ? bmiTier(p.weightKg, p.heightCm) ?? undefined : undefined;
  const vp: VitaminProfile = {
    stage: baseStage,
    hasPcos,
    artPlan: p.artPlan || "ยัง",
    infertilityIssues: p.infertilityIssues,
    weightTier,
  };
  const rec = recommendVitamins(vp);

  // ----- personalized 90-day plan (food/behavior FIRST, products last; ART = consult doctor before supplements) -----
  const artActive = !!p.artPlan && p.artPlan !== "ยัง";
  // age-appropriate referral timing (clinical: <35=12mo, 35-39=6mo, 40+=now)
  const referral =
    p.ageRange === "40+"
      ? "อายุเป็นปัจจัยเรื่องเวลา แนะนำพบแพทย์ผู้เชี่ยวชาญด้านมีบุตรยากได้เลย ไม่ต้องรอให้ครบกำหนด"
      : p.ageRange === "35–39"
        ? "หากพยายามเองแล้วราว 6 เดือนยังไม่สำเร็จ ควรปรึกษาแพทย์"
        : "หากพยายามเองแล้วราว 12 เดือนยังไม่สำเร็จ ควรปรึกษาแพทย์";

  const plan90: PlanPhase[] = isMale
    ? [
        { phase: "เดือนที่ 1", title: "ปรับพื้นฐานฝ่ายชาย", items: [
            "เพิ่มโปรตีน + เมล็ดฟักทอง (ซิงก์) ในมื้ออาหาร",
            "งดเหล้า-บุหรี่ ลดความร้อนบริเวณอัณฑะ",
            "นอนก่อน 4 ทุ่ม 7–9 ชม.",
            "ถ้าต้องการเสริม: M-Z All วันละ 1 เม็ดก่อนนอน (ปรึกษาเภสัชกรถ้ามีโรคประจำตัว)",
          ] },
        { phase: "เดือนที่ 2", title: "เร่งบำรุงสเปิร์ม", items: ["ออกกำลังกายสม่ำเสมอ ไม่หักโหม", "ลดน้ำตาล/อาหารแปรรูป", "ถ้าต้องการเสริมโปรตีน: Ferta เวย์โปรตีน วันละ 2 ซอง ชงกับน้ำเปล่า"] },
        { phase: "เดือนที่ 3", title: "พร้อมไปด้วยกัน", items: ["ตรวจวิเคราะห์น้ำเชื้อกับแพทย์ (ถ้าจะทำ ART)", "ประสานจังหวะกับช่วงไข่ตกของคู่"] },
      ]
    : [
        { phase: "เดือนที่ 1", title: "ปูพื้นฐานบำรุงไข่", items: [
            artActive ? "ปรึกษาแพทย์ที่ดูแลคุณก่อนเริ่มวิตามินเสริมทุกชนิด (เพราะอาจมีผลต่อยาที่ได้รับ)" : "ยึดหลัก 70% อาหาร 30% วิตามิน",
            protein ? `กินโปรตีนให้ถึง ${protein.min}–${protein.max} กรัม/วัน` : "กินโปรตีนให้พอในแต่ละวัน",
            "นอนก่อน 4 ทุ่ม (22:00) 7–9 ชม.",
            artActive ? "เมื่อแพทย์อนุญาต จึงเริ่มวิตามินบำรุง เช่น OvaAll" : "ถ้าต้องการเสริม: OvaAll วันละ 1 ซองพร้อมอาหาร",
          ] },
        { phase: "เดือนที่ 2", title: "เร่งบำรุงไข่ + สมดุลฮอร์โมน", items: [
            "งดหวาน/คาเฟอีน/น้ำเย็น" + (hasPcos ? " (สำคัญมากสำหรับการดูแลสมดุลในกลุ่ม PCOS)" : ""),
            "ออกกำลังกายเบา (เดิน/โยคะ) 3 วัน/สัปดาห์",
            "เพิ่มอะโวคาโด+น้ำผึ้งชันโรง ครึ่งผล/วัน",
            "ถ้าต้องการเสริม: โปรตีนเฟอร์ตี้ช่วยให้ได้โปรตีนครบ" + (hasPcos ? " · PCO-VIT สำหรับดูแลสมดุล (ปรึกษาแพทย์/เภสัชกรถ้าใช้ยาอยู่)" : ""),
          ] },
        { phase: "เดือนที่ 3", title: artActive ? art3Title(p.artPlan!) : "เตรียมพร้อมสูงสุด", items: [
            "ดูแลผนังมดลูกด้วยโภชนาการ (ธาตุเหล็ก/โฟเลต/วิตามินอี จากอาหาร) — หลีกเลี่ยงการประคบหรือสมุนไพรกระตุ้นมดลูกในช่วงลุ้นผล และปรึกษาแพทย์ก่อนใช้เทคนิคใด ๆ",
            "จดบันทึกรอบเดือน/วันไข่ตกให้แม่นขึ้น",
            artActive ? "ปรึกษาแพทย์เรื่องจังหวะเก็บไข่/ย้ายตัวอ่อน" : referral,
          ] },
      ];

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

  // ----- this-week actions (from weakest pillars) -----
  const weeklyActions: string[] = [];
  const weakest = [...done].sort((a, b) => (a.score as number) - (b.score as number))[0];
  if (weakest?.key === "sleep") weeklyActions.push("สัปดาห์นี้: เข้านอนก่อน 22:00 ให้ได้อย่างน้อย 5 วัน");
  if (weakest?.key === "nutrition" || weakest?.key === "egg") weeklyActions.push("สัปดาห์นี้: กินไข่ต้ม 2 ฟอง + ปลา 1 มื้อทุกวัน");
  if (weakest?.key === "water") weeklyActions.push("สัปดาห์นี้: เพิ่มน้ำอีก 1 แก้วในแต่ละมื้อ ค่อย ๆ ไปให้ถึงเป้าหมาย");
  if (hasPcos) weeklyActions.push("สัปดาห์นี้: งดของหวานทั้งหมด ดื่มน้ำอุ่น 2–3 ลิตร/วัน");
  if (!fertileWindow) weeklyActions.push("ลองทำ ‘นับวันไข่ตก’ เพื่อวางแผนช่วงมีโอกาส");
  if (weeklyActions.length < 3) weeklyActions.push("สัปดาห์นี้: จัดจานตามหลัก 70% อาหาร — โปรตีน ผัก ไขมันดี ให้ครบทุกมื้อ");

  // ----- cautions (ethics/safety — see docs/MOTIVATION-RESEARCH.md §5) -----
  const cautions: string[] = [
    "แผนนี้เป็นคำแนะนำทั่วไปเพื่อเตรียมความพร้อม ไม่ใช่การวินิจฉัยหรือรักษาโรค และไม่รับประกันการตั้งครรภ์",
  ];
  if (hasPcos) cautions.push("ผู้มีภาวะ PCOS รอบเดือนอาจไม่สม่ำเสมอ ผลการนับวันไข่ตกอาจคลาดเคลื่อน ควรอยู่ในการดูแลของแพทย์");
  if (p.artPlan && p.artPlan !== "ยัง")
    cautions.push("คุณกำลังอยู่ในกระบวนการรักษากับแพทย์ — อย่าหยุดหรือปรับยา/วิตามินเองก่อนปรึกษาแพทย์ เพราะบางอย่างอาจมีผลต่อการรักษา");
  if (p.ageRange === "40+" || p.ageRange === "35–39" || artActive)
    cautions.push("เรื่องเวลาเป็นสิ่งสำคัญ แนะนำปรึกษาแพทย์ผู้เชี่ยวชาญควบคู่ไปด้วย");

  return {
    title: "แผน 90 วัน มั่นใจก่อนมีลูก — ฉบับของคุณ",
    tagline: "ในวันที่รู้สึกควบคุมอะไรไม่ได้ นี่คือ 90 วันที่คุณลงมือเองได้",
    nickname: p.nickname || "คุณ",
    greeting: `เราอ่านคำตอบของคุณ ${p.nickname || "คุณ"} แล้ว และทำแผนนี้ขึ้นเพื่อคุณโดยเฉพาะค่ะ 💛`,
    score, scoreLabel, strengths, improvements, quickWinToday,
    pillars, fertileWindow, protein,
    vitamins: rec.primary, vitaminNote: rec.note,
    plan90, weeklyActions: weeklyActions.slice(0, 4), partnerNudge, isMale, cautions,
    generatedFor: { stage: stageThai[p.stage || "prep"], hasPcos, artPlan: p.artPlan },
  };
}

// R4 — "เตรียมผนังมดลูก" reads awkwardly as "เตรียมพร้อมก่อนทำ เตรียมผนังมดลูก";
// every other artPlan value still fits the original "เตรียมพร้อมก่อนทำ {X}" phrasing.
function art3Title(ap: ArtPlan): string {
  return ap === "เตรียมผนังมดลูก" ? "เตรียมผนังมดลูกให้พร้อมที่สุด" : `เตรียมพร้อมก่อนทำ ${ap}`;
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
  };
}
