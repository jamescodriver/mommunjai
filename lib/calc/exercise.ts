// PDF-15 — Exercise recommendation (pure). Previously blocked: client's own
// comment asked "ใช้สูตรไหน หลักการอะไร?" and there was no real standard to
// build from. Unblocked via Uriel's research pass (2026-07-30) into WHO,
// ACOG, ACSM, and SOGC/CSEP — see docs/EXERCISE-RESEARCH-BRIEF.md for full
// citations. NEVER invent a number here; every figure below traces to a
// source in that brief.
//
// Key research findings that shape this file's structure (not obvious from
// the code alone, so recorded here):
// - No mainstream body (WHO/ACOG/ACSM) age-tiers exercise TYPE/FITT within
//   the ~18–64 adult range — age is NOT used as an input. The real
//   personalization axis or exercise guidance is (a) contraindication
//   screening, evidence-graded only for pregnancy by SOGC/CSEP 2019 (ACOG's
//   2020 opinion dropped its own contraindication table), and (b) baseline
//   fitness (previously active vs previously sedentary), which ACOG/ACSM
//   both explicitly use to decide "continue at your level" vs "build up
//   gradually."
// - The trying-to-conceive (TTC) and male-fertility sections are NOT backed
//   by a clinical practice guideline — they're observational/cohort
//   research. Copy for those two stages must read as "งานวิจัยชี้ว่า..."
//   (research suggests), never "แนวทางแนะนำว่า..." (guidelines recommend),
//   per this project's compliance rule against overstating evidence.

export type ExerciseStage = "prep" | "infertility" | "pregnant" | "lactating" | "male";
export type BaselineActivity = "active" | "sedentary";

// SOGC/CSEP 2019 Canadian Guideline for Physical Activity throughout
// Pregnancy — the only one of 12 compared guidelines with an evidence-graded
// contraindication table (ACOG 2020 does not publish its own). Only ever
// shown/used for stage === "pregnant".
export const ABSOLUTE_CONTRAINDICATIONS = [
  { v: "ruptured_membranes", label: "ถุงน้ำคร่ำแตก/รั่ว" },
  { v: "preterm_labour", label: "เจ็บครรภ์คลอดก่อนกำหนด" },
  { v: "bleeding", label: "เลือดออกทางช่องคลอดโดยไม่ทราบสาเหตุ" },
  { v: "placenta_previa", label: "รกเกาะต่ำ (หลังอายุครรภ์ 28 สัปดาห์)" },
  { v: "preeclampsia", label: "ครรภ์เป็นพิษ (preeclampsia)" },
  { v: "incompetent_cervix", label: "ปากมดลูกหลวม/ไม่แข็งแรง" },
  { v: "iugr", label: "ทารกในครรภ์โตช้ากว่าปกติ (IUGR)" },
  { v: "high_order_multiple", label: "ตั้งครรภ์แฝด 3 ขึ้นไป" },
  { v: "uncontrolled_diabetes", label: "เบาหวานชนิดที่ 1 ที่ควบคุมไม่ได้" },
  { v: "uncontrolled_htn", label: "ความดันโลหิตสูงที่ควบคุมไม่ได้" },
  { v: "uncontrolled_thyroid", label: "ไทรอยด์ผิดปกติที่ควบคุมไม่ได้" },
  { v: "cardio_resp", label: "โรคหัวใจ/ปอด/ระบบอื่นที่รุนแรง" },
] as const;

export const RELATIVE_CONTRAINDICATIONS = [
  { v: "recurrent_loss", label: "เคยแท้งซ้ำหลายครั้ง" },
  { v: "gestational_htn", label: "ความดันโลหิตสูงจากการตั้งครรภ์" },
  { v: "prior_preterm", label: "เคยคลอดก่อนกำหนดมาก่อน" },
  { v: "mild_cardio_resp", label: "โรคหัวใจ/ปอดระดับไม่รุนแรง" },
  { v: "anemia", label: "โลหิตจางที่มีอาการ" },
  { v: "malnutrition", label: "ภาวะขาดสารอาหาร" },
  { v: "eating_disorder", label: "ภาวะการกินผิดปกติ" },
  { v: "twin_after_28w", label: "ตั้งครรภ์แฝดคู่ หลังอายุครรภ์ 28 สัปดาห์" },
] as const;
export type ContraindicationId =
  | (typeof ABSOLUTE_CONTRAINDICATIONS)[number]["v"]
  | (typeof RELATIVE_CONTRAINDICATIONS)[number]["v"];

export interface ExerciseInput {
  stage: ExerciseStage;
  baseline: BaselineActivity;
  /** Only meaningful for stage === "pregnant" — ignored otherwise. */
  contraindications?: string[];
}

export type CautionLevel = "none" | "consult" | "stop";

export interface ExerciseResult {
  cautionLevel: CautionLevel;
  cautionNote?: string;
  weeklyTarget: string;
  frequency: string;
  intensity: string;
  type: string[];
  tips: string[];
  avoid?: string[];
  warningSigns?: string[];
  /** Set only for prep/infertility/male — these sections are research
   *  evidence, not a clinical guideline, and must be framed as such. */
  evidenceNote?: string;
  sources: string[];
}

const WHO_WEEKLY_TARGET =
  "150–300 นาที/สัปดาห์ กิจกรรมระดับปานกลาง หรือ 75–150 นาที/สัปดาห์ กิจกรรมระดับหนัก (ผสมกันได้)";
const WHO_STRENGTH_TIP = "ฝึกกล้ามเนื้อมัดใหญ่ (เวท/ยางยืด/บอดี้เวท) อย่างน้อย 2 วัน/สัปดาห์";

function baselineIntensity(baseline: BaselineActivity, alreadyActiveNote: string): string {
  return baseline === "active"
    ? alreadyActiveNote
    : "เริ่มจาก 15 นาที/วันก่อน แล้วค่อย ๆ เพิ่มเวลา/ความหนักทีละน้อยจนถึงเป้าหมาย ไม่ต้องรีบ";
}

const WHO_SOURCE = "WHO 2020 Guidelines on Physical Activity and Sedentary Behaviour (Br J Sports Med 2020;54(24):1451–1462)";
const ACSM_SOURCE = "ACSM — Garber CE, et al. Med Sci Sports Exerc 2011;43(7):1334–1359 (FITT framework)";

export function recommendExercise(input: ExerciseInput): ExerciseResult {
  const { stage, baseline } = input;

  if (stage === "pregnant") {
    const picked = new Set(input.contraindications || []);
    const hasAbsolute = ABSOLUTE_CONTRAINDICATIONS.some((c) => picked.has(c.v));
    const hasRelative = RELATIVE_CONTRAINDICATIONS.some((c) => picked.has(c.v));

    const sources = [
      "SOGC/CSEP 2019 Canadian Guideline for Physical Activity throughout Pregnancy (J Obstet Gynaecol Can 2018;40(11):1528–1537) — อ่านจากต้นฉบับโดยตรง",
      // ACOG 804: WebFetch to acog.org returned HTTP 402 during research — content
      // cross-verified via 2 independent secondary summaries that agree with each
      // other, not read from the primary PDF directly. See docs/EXERCISE-RESEARCH-BRIEF.md.
      "ACOG Committee Opinion No. 804 (Obstet Gynecol 2020;135:e178–188) — เนื้อหา cross-check จากแหล่งรอง เนื่องจากดึงต้นฉบับ acog.org โดยตรงไม่ได้ระหว่างค้นข้อมูล",
    ];

    if (hasAbsolute) {
      return {
        cautionLevel: "stop",
        cautionNote:
          "จากภาวะที่เลือกไว้ คุณควรทำแค่กิจกรรมในชีวิตประจำวันตามปกติ และปรึกษาแพทย์ก่อนเริ่มโปรแกรมออกกำลังกายใดๆ เพิ่มเติม — ไม่แนะนำให้เพิ่มความหนักเองโดยยังไม่ได้คุยกับแพทย์",
        weeklyTarget: "รอคำแนะนำจากแพทย์ก่อน",
        frequency: "—",
        intensity: "—",
        type: [],
        tips: ["ทำกิจกรรมประจำวันตามปกติได้ (เดิน/งานบ้านเบาๆ) แต่ยังไม่ควรเริ่มโปรแกรมออกกำลังกายใหม่จนกว่าแพทย์จะประเมิน"],
        sources,
      };
    }

    const base: ExerciseResult = {
      cautionLevel: hasRelative ? "consult" : "none",
      cautionNote: hasRelative
        ? "จากภาวะที่เลือกไว้ ควรปรึกษาแพทย์ก่อนเพิ่มความหนักของการออกกำลังกายเกินกว่ากิจกรรมเบาๆ ที่ทำอยู่แล้ว"
        : undefined,
      weeklyTarget: "อย่างน้อย 150 นาที/สัปดาห์ กิจกรรมระดับปานกลาง",
      frequency: "กระจายอย่างน้อย 3 วัน/สัปดาห์ (ยิ่งสม่ำเสมอทุกวันยิ่งดี)",
      // The "no need to scale back" reassurance only applies when there's truly
      // nothing to be cautious about — a relative-contraindication case must not
      // get a note that contradicts its own "consult" caution banner.
      intensity: hasRelative
        ? "ปรึกษาแพทย์ก่อนตัดสินใจว่าจะคงระดับเดิมหรือลดความหนักลง — อย่าเพิ่มความหนักเองก่อนคุยกับแพทย์"
        : baselineIntensity(baseline, "ทำต่อในระดับที่เคยทำได้เลย ไม่ต้องลดลงเพราะตั้งครรภ์"),
      type: [
        "คาร์ดิโอเบา–ปานกลาง: เดินเร็ว/ปั่นจักรยานอยู่กับที่/ว่ายน้ำ/แอโรบิกแรงกระแทกต่ำ",
        "เวทเทรนนิ่งเบา + ยืดเหยียด",
        "ฝึกอุ้งเชิงกราน (Kegel) ทุกวัน — ช่วยลดความเสี่ยงปัสสาวะเล็ด",
      ],
      avoid: [
        "หลีกเลี่ยงนอนหงายเป็นเวลานานหลังอายุครรภ์ ~20 สัปดาห์ (กดเส้นเลือดใหญ่ ทำให้เลือดไหลเวียนกลับหัวใจลดลง)",
        "หลีกเลี่ยงกิจกรรมเสี่ยงหกล้ม/ปะทะกระแทก",
        "หลีกเลี่ยงออกกำลังกลางแดด/อากาศร้อนอบอ้าวมาก โดยเฉพาะไตรมาสแรก",
        "ถ้ารู้สึกหน้ามืด คลื่นไส้ หรือไม่สบายตัวขณะนอนหงายออกกำลังกาย ให้เปลี่ยนท่าทันที",
      ],
      tips: ["ลองใช้ \"talk test\": ถ้าพูดคุยเป็นประโยคระหว่างออกกำลังยังได้ ระดับความหนักถือว่าเหมาะสม"],
      warningSigns: [
        "เลือดออกทางช่องคลอด",
        "ปวดท้อง",
        "เจ็บครรภ์สม่ำเสมอ (สัญญาณคลอดก่อนกำหนด)",
        "น้ำคร่ำรั่ว/ไหล",
        "เหนื่อยหอบก่อนออกแรง",
        "เวียนศีรษะ",
        "ปวดศีรษะ",
        "เจ็บหน้าอก",
        "กล้ามเนื้ออ่อนแรงจนเสียการทรงตัว",
        "ปวด/บวมที่น่อง",
      ],
      sources,
    };
    return base;
  }

  if (stage === "lactating") {
    return {
      cautionLevel: "none",
      weeklyTarget: "กลับมาออกกำลังกายได้ทีละน้อยตามความพร้อมของร่างกาย ไม่มีตัวเลขตายตัว",
      frequency: "ค่อยๆเพิ่มความถี่ตามความพร้อม",
      intensity: baselineIntensity(baseline, "กลับสู่ระดับเดิมได้ทีละน้อย ฟังสัญญาณร่างกายตัวเอง"),
      type: ["คาร์ดิโอเบา (เดิน) ก่อน แล้วค่อยเพิ่มความหนัก", "ฝึกอุ้งเชิงกราน (Kegel) ต่อเนื่องได้ทันที", "กล้ามท้องแบบค่อยเป็นค่อยไป (ถ้ามีภาวะกล้ามท้องแยก/diastasis recti ควรปรึกษาผู้เชี่ยวชาญก่อน)"],
      tips: [
        "ให้นม/ปั๊มนมก่อนออกกำลังกายช่วยลดความไม่สบายเต้านมระหว่างทำ",
        "การออกกำลังกายสม่ำเสมอไม่กระทบปริมาณหรือคุณภาพน้ำนม",
        "ความเร็ว/ระยะเวลาในการกลับมาออกกำลังกาย ขึ้นกับวิธีคลอด (คลอดธรรมชาติ/ผ่าคลอด) และภาวะแทรกซ้อน — ปรึกษาแพทย์ในนัดตรวจหลังคลอด",
      ],
      sources: ["ACOG Committee Opinion No. 804 (Obstet Gynecol 2020;135:e178–188) — เนื้อหา cross-check จากแหล่งรอง เนื่องจากดึงต้นฉบับ acog.org โดยตรงไม่ได้ระหว่างค้นข้อมูล"],
    };
  }

  if (stage === "male") {
    return {
      cautionLevel: "none",
      weeklyTarget: WHO_WEEKLY_TARGET,
      frequency: "ส่วนใหญ่ของวันในสัปดาห์",
      intensity: baselineIntensity(baseline, "ทำต่อในระดับที่เคยทำได้เลย"),
      type: ["คาร์ดิโอ (เดินเร็ว/วิ่ง/ปั่นจักรยาน/ว่ายน้ำ)", WHO_STRENGTH_TIP],
      tips: [
        "งานวิจัยชี้ว่าการออกกำลังกายระดับปานกลางสม่ำเสมอ (คาร์ดิโอ+เวท) สัมพันธ์กับคุณภาพอสุจิที่ดีขึ้น ผ่านฮอร์โมนเทสโทสเตอโรนและไขมันส่วนเกินที่ลดลง",
        "งานวิจัยชี้ว่าการฝึกความอึดหนักมากต่อเนื่อง (เช่น วิ่งมากกว่า ~100 กม./สัปดาห์) อาจสัมพันธ์กับคุณภาพอสุจิที่ลดลงในบางการศึกษา — ไม่ใช่ข้อห้าม แค่ไม่ควรหักโหมเกินไปช่วงเตรียมมีบุตร",
        "งานวิจัยขนาดเล็กพบว่าการเข้าซาวน่า/แช่น้ำร้อนบ่อยๆ อาจกระทบคุณภาพอสุจิชั่วคราว (ฟื้นตัวได้ภายในไม่กี่เดือนหลังหยุด) — ลดความถี่ได้ถ้ากำลังเตรียมมีบุตร",
      ],
      evidenceNote: "หัวข้อออกกำลังกายกับสุขภาพฝ่ายชายด้านบนมาจากงานวิจัยเชิงสังเกต ไม่ใช่แนวทางทางการแพทย์อย่างเป็นทางการ — ใช้เป็นข้อมูลประกอบการตัดสินใจ ไม่ใช่คำสั่งแพทย์",
      // Red-team caught: the "moderate exercise -> better sperm quality" tip
      // (first bullet above) had no matching citation — Jóźków/Rossato is the
      // source for that specific claim, distinct from Aerts (endurance harm)
      // and Garolla (sauna).
      sources: [
        WHO_SOURCE,
        "Jóźków P, Rossato M. The Impact of Intense Exercise on Semen Quality. Am J Mens Health 2017 (moderate exercise & sperm quality)",
        "Aerts A, et al. Sports Med Open 2024;10:72 (endurance exercise & semen quality)",
        "Garolla A, et al. Hum Reprod 2013;28(4):877–885 (sauna exposure, n=10, suggestive only)",
      ],
    };
  }

  // prep / infertility — same WHO baseline; infertility gets the RED-S/fueling
  // note surfaced more prominently since that's the population it's most
  // relevant to.
  const ttcTip =
    "งานวิจัยชี้ว่าการออกกำลังกายระดับปานกลาง-หนักไม่ได้ลดโอกาสตั้งครรภ์ แต่การฝึกหนักมากต่อเนื่อง (มากกว่า ~60 นาที/วันของกิจกรรมหนักมาก) โดยกินไม่พอกับที่ซ้อม อาจกระทบการตกไข่ได้ — กินให้พอกับที่ซ้อมสำคัญกว่าการลดความหนักของการออกกำลังกาย";
  return {
    cautionLevel: "none",
    weeklyTarget: WHO_WEEKLY_TARGET,
    frequency: "ส่วนใหญ่ของวันในสัปดาห์",
    intensity: baselineIntensity(baseline, "ทำต่อในระดับที่เคยทำได้เลย"),
    type: ["คาร์ดิโอ (เดินเร็ว/วิ่ง/ปั่นจักรยาน/ว่ายน้ำ)", WHO_STRENGTH_TIP],
    tips:
      stage === "infertility"
        ? [ttcTip, "ถ้าออกกำลังกายหนักแล้วประจำเดือนมาไม่สม่ำเสมอ หรือขาดหายไป ควรปรึกษาแพทย์ — อาจเป็นสัญญาณว่าพลังงานที่กินเข้าไปไม่พอกับที่ใช้ออกกำลังกาย"]
        : [ttcTip],
    // ttcTip is shown for BOTH prep and infertility, so its citation/evidence
    // framing must not be gated to infertility only (red-team caught: prep
    // users were seeing the same research claim with no source attached).
    evidenceNote:
      "หัวข้อการออกกำลังกายกับการตกไข่ด้านบนมาจากงานวิจัยเชิงสังเกต ไม่ใช่แนวทางทางการแพทย์อย่างเป็นทางการฉบับเดียว — ใช้เป็นข้อมูลประกอบ ไม่ใช่คำวินิจฉัย",
    sources: [
      WHO_SOURCE,
      ACSM_SOURCE,
      "Rich-Edwards JW, et al. Epidemiology 2002;13(2):184–190",
      "Hakimi O, Cameron LC. Sports Medicine 2017;47(8):1555–1567",
      "ACOG Committee Opinion No. 702: Female Athlete Triad (Obstet Gynecol 2017;129(6):e160–e167)",
    ],
  };
}
