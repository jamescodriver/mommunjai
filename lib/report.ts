// Personalized "Fertility Readiness Report" generator (pure, testable).
// The reward users get for completing the questionnaire — see docs/MOTIVATION-RESEARCH.md.
// NEVER claim to cure / guarantee pregnancy. Frames as readiness & preparation.
import { recommendVitamins, Product, VitaminProfile } from "./calc/vitamins";
import { calcProtein, Stage } from "./calc/protein";

export interface ReportProfile {
  nickname?: string;
  stage?: Stage | "infertility";
  weightKg?: number;
  ageRange?: string;
  hasPcos?: boolean;
  artPlan?: "none" | "iui" | "ivf" | "icsi";
  tools?: Record<string, { input?: any; output?: any }>;
}

export interface Pillar {
  key: "egg" | "nutrition" | "sleep" | "hormone";
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
  protein: { min: number; max: number; ferty: number } | null;
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

export function generateReport(p: ReportProfile): Report {
  const t = p.tools || {};
  const baseStage: Stage = (p.stage === "infertility" ? "prep" : (p.stage as Stage)) || "prep";
  const isMale = p.stage === "male";

  // ----- pillars from whichever tools were completed -----
  const pillars: Pillar[] = [];
  const nut = t.nutrients?.output;
  pillars.push({ key: "egg", label: isMale ? "คุณภาพอสุจิ" : "คุณภาพไข่", score: nut ? nut.pillars?.egg ?? null : null,
    note: nut
      ? (isMale ? "จากอาหารบำรุงอสุจิที่คุณกิน" : "จากอาหารบำรุงไข่ที่คุณกิน")
      : "ยังไม่ได้ประเมิน", toolHref: "/tools/nutrients", toolLabel: "เช็กสารอาหาร" });
  pillars.push({ key: "nutrition", label: "โภชนาการรวม", score: nut ? nut.overall ?? null : null,
    note: nut ? `กินครบ ${nut.eatenCount ?? 0}/${nut.totalEat ?? 8} อย่าง` : "ยังไม่ได้ประเมิน", toolHref: "/tools/nutrients", toolLabel: "เช็กสารอาหาร" });
  const sleep = t.sleep?.output;
  const sleepScore = sleep ? (sleep.beforeTen && sleep.goodDuration ? 92 : sleep.goodDuration ? 72 : 48) : null;
  pillars.push({ key: "sleep", label: "การนอน", score: sleepScore,
    note: sleep ? (sleep.status ? `สถานะ: ${sleep.status}` : "ประเมินแล้ว") : "ยังไม่ได้ประเมิน", toolHref: "/tools/sleep", toolLabel: "คำนวณการนอน" });
  // hormone pillar blends nutrition-hormone pillar and PCOS/sugar signal
  let hormone: number | null = nut ? nut.pillars?.hormone ?? null : null;
  if (hormone !== null && p.hasPcos) hormone = clamp(hormone - 10);
  pillars.push({ key: "hormone", label: "สมดุลฮอร์โมน", score: hormone,
    note: hormone === null
      ? "ยังไม่ได้ประเมิน"
      : (p.hasPcos ? "การดูแลเรื่องน้ำตาลช่วยสมดุลฮอร์โมนได้ — ค่อย ๆ ปรับไปด้วยกันนะคะ" : "จากอาหารปรับสมดุลฮอร์โมน"), toolHref: "/tools/nutrients", toolLabel: "เช็กสารอาหาร" });

  const done = pillars.filter((x) => x.score !== null);
  const score = done.length ? clamp(done.reduce((s, x) => s + (x.score as number), 0) / done.length) : 50;
  const scoreLabel = score >= 80 ? "พร้อมดีมาก 💚" : score >= 60 ? "พร้อมพอควร มีจุดเสริม 💛" : "เริ่มต้นได้ดี มีหลายอย่างที่ทำได้เลย 🌱";

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

  // ----- vitamins -----
  const vp: VitaminProfile = { stage: baseStage, hasPcos: !!p.hasPcos, artPlan: p.artPlan || "none" };
  const rec = recommendVitamins(vp);

  // ----- personalized 90-day plan (food/behavior FIRST, products last; ART = consult doctor before supplements) -----
  const artActive = !!p.artPlan && p.artPlan !== "none";
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
            "งดหวาน/คาเฟอีน/น้ำเย็น" + (p.hasPcos ? " (สำคัญมากสำหรับการดูแลสมดุลในกลุ่ม PCOS)" : ""),
            "ออกกำลังกายเบา (เดิน/โยคะ) 3 วัน/สัปดาห์",
            "เพิ่มอะโวคาโด+น้ำผึ้งชันโรง ครึ่งผล/วัน",
            "ถ้าต้องการเสริม: โปรตีนเฟอร์ตี้ช่วยให้ได้โปรตีนครบ" + (p.hasPcos ? " · PCO-VIT สำหรับดูแลสมดุล (ปรึกษาแพทย์/เภสัชกรถ้าใช้ยาอยู่)" : ""),
          ] },
        { phase: "เดือนที่ 3", title: artActive ? `เตรียมพร้อมก่อนทำ ${p.artPlan!.toUpperCase()}` : "เตรียมพร้อมสูงสุด", items: [
            "ดูแลผนังมดลูกด้วยโภชนาการ (ธาตุเหล็ก/โฟเลต/วิตามินอี จากอาหาร) — หลีกเลี่ยงการประคบหรือสมุนไพรกระตุ้นมดลูกในช่วงลุ้นผล และปรึกษาแพทย์ก่อนใช้เทคนิคใด ๆ",
            "จดบันทึกรอบเดือน/วันไข่ตกให้แม่นขึ้น",
            artActive ? "ปรึกษาแพทย์เรื่องจังหวะเก็บไข่/ย้ายตัวอ่อน" : referral,
          ] },
      ];

  // ----- quick win today (dampens "want answer now") -----
  const quickWinToday = p.hasPcos
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
  if (p.hasPcos) weeklyActions.push("สัปดาห์นี้: งดของหวานทั้งหมด ดื่มน้ำอุ่น 2–3 ลิตร/วัน");
  if (!fertileWindow) weeklyActions.push("ลองทำ ‘นับวันไข่ตก’ เพื่อวางแผนช่วงมีโอกาส");
  if (weeklyActions.length < 3) weeklyActions.push("สัปดาห์นี้: จัดจานตามหลัก 70% อาหาร — โปรตีน ผัก ไขมันดี ให้ครบทุกมื้อ");

  // ----- cautions (ethics/safety — see docs/MOTIVATION-RESEARCH.md §5) -----
  const cautions: string[] = [
    "แผนนี้เป็นคำแนะนำทั่วไปเพื่อเตรียมความพร้อม ไม่ใช่การวินิจฉัยหรือรักษาโรค และไม่รับประกันการตั้งครรภ์",
  ];
  if (p.hasPcos) cautions.push("ผู้มีภาวะ PCOS รอบเดือนอาจไม่สม่ำเสมอ ผลการนับวันไข่ตกอาจคลาดเคลื่อน ควรอยู่ในการดูแลของแพทย์");
  if (p.artPlan && p.artPlan !== "none")
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
    generatedFor: { stage: stageThai[p.stage || "prep"], hasPcos: p.hasPcos, artPlan: p.artPlan },
  };
}
