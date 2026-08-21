import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { generateReport, buildTeaser, reportTier, buildSleepGuide, type Report } from "./report";
import { goodFatTarget, type GoodFatStage } from "./calc/goodfat";
import { PRODUCT_PHOTO_IDS, hasProductPhoto, productPhotoSrc } from "./product-photos";
import { PRODUCTS } from "./calc/vitamins";
import { PROTEIN_BAR_MAX, PROTEIN_FOOD_GROUPS } from "./calc/food-reference";

const ALL_STAGES: GoodFatStage[] = ["prep", "infertility", "pregnant", "lactating", "male"];

// ── R15 · TC-15-04/05 — ไขมันดี ─────────────────────────────────────────────
describe("R15 — ไขมันดี (EPA+DHA) ต่อหมวด", () => {
  it("มีตัวเลขจริงแค่ 2 ค่าใน 5 หมวด — ไม่ใช่ 5 ค่า (ห้ามแต่งตัวเลข)", () => {
    const values = ALL_STAGES.map((s) => goodFatTarget(s).epaDhaMgPerDay);
    expect(new Set(values)).toEqual(new Set([250, 300]));
  });
  it("prep · infertility · male → 250 มก./วัน และไม่มีขั้นต่ำ DHA แยก", () => {
    for (const s of ["prep", "infertility", "male"] as const) {
      const g = goodFatTarget(s);
      expect(g.epaDhaMgPerDay).toBe(250);
      expect(g.dhaMinMgPerDay).toBeNull();
    }
  });
  it("pregnant · lactating → 300 มก./วัน โดยเป็น DHA อย่างน้อย 200 มก.", () => {
    for (const s of ["pregnant", "lactating"] as const) {
      const g = goodFatTarget(s);
      expect(g.epaDhaMgPerDay).toBe(300);
      expect(g.dhaMinMgPerDay).toBe(200);
      expect(g.source).toMatch(/FAO\/WHO 2010 Table 7\.2/);
    }
  });
  it("ทุกหมวดต้อง trace กลับหา research brief ได้ (TC-15-05 ห้ามมีตัวเลขลอย)", () => {
    for (const s of ALL_STAGES) {
      const g = goodFatTarget(s);
      expect(g.source).toBeTruthy();
      expect(g.brief).toContain("GOOD-FAT-BY-CATEGORY-RESEARCH-BRIEF.md");
      expect(g.targetLabel).toContain(String(g.epaDhaMgPerDay));
    }
  });

  it("🔒 infertility — ห้ามเคลมว่าไขมันดีช่วยให้ตั้งครรภ์ (ASRM 2022)", () => {
    const g = goodFatTarget("infertility");
    // ข้อความ "เชิงบวก" (เหตุผลที่ให้ผู้ใช้อ่านว่าทำไมต้องกิน) ห้ามมีเคลมเรื่องการตั้งครรภ์เลย
    expect([g.why, g.targetLabel].join(" ")).not.toMatch(/ท้องง่าย|โอกาสตั้งครรภ์|ช่วยให้ตั้งครรภ์|เพิ่มการเจริญพันธุ์/);
    // ต้องบอกตรง ๆ ว่ายังไม่มีองค์กรใดยืนยัน — ไม่ใช่แค่ "ไม่พูดถึง"
    // (evidenceNote พูดถึง "โอกาสตั้งครรภ์" ได้ แต่ต้องอยู่ในรูปปฏิเสธเท่านั้น)
    expect(g.evidenceNote).toMatch(/ยังไม่มีองค์กร[^.]*ยืนยัน/);
    expect(g.evidenceNote).toMatch(/ไม่ใช่คำแนะนำเพื่อการเจริญพันธุ์/);
    // และต้องเตือนเรื่องอยู่ระหว่างรักษาให้ปรึกษาแพทย์ก่อนเสริม
    expect(g.extraCautions.join(" ")).toMatch(/IVF|ICSI|ปรึกษาแพทย์/);
  });

  it("🔒 ทุกหมวด — \"ไขมันดีทั่วไป\" ต้องแยกจาก \"แหล่ง DHA\" และมีคำเตือนกำกับ", () => {
    for (const s of ALL_STAGES) {
      const g = goodFatTarget(s);
      // แยกกันจริง: น้ำมันมะกอก/อะโวคาโด/ถั่ว ต้องไม่ไปโผล่ในลิสต์แหล่ง DHA
      const dha = g.dhaSources.join(" ");
      expect(dha).not.toMatch(/น้ำมันมะกอก|อะโวคาโด|อัลมอนด์|วอลนัท|แฟลกซ์/);
      expect(g.generalGoodFats.join(" ")).toMatch(/น้ำมันมะกอก/);
      expect(g.notDhaWarning).toMatch(/ไม่ใช่แหล่ง DHA/);
      // แหล่ง DHA จริงต้องเป็นปลา/สาหร่าย/อาหารเสริมเท่านั้น
      expect(dha).toMatch(/ปลาทะเล/);
      expect(dha).toMatch(/สาหร่าย/);
    }
  });

  it("ข้อความทุกอันเป็น plain text — ห้ามมี markdown ติดไปโผล่บนหน้าจอ", () => {
    // เจอจริงตอน verify ในเบราว์เซอร์: "**ไม่ใช่แหล่ง DHA**" แสดงดอกจันให้ผู้ใช้เห็น
    for (const s of ALL_STAGES) {
      const json = JSON.stringify(goodFatTarget(s));
      expect(json, `${s} มี markdown ในข้อความ`).not.toMatch(/\*\*|\[.+\]\(.+\)/);
    }
  });

  // R10/R11 — ขยายการสแกนให้ครอบคลุมรายงานทั้งใบของทุก stage (ไม่ใช่แค่บล็อกไขมันดี)
  // เนื้อหาความรู้ตั้งครรภ์/ให้นมบุตรถูก render เป็น plain text เหมือนกันทุกจุด
  it("รายงานทั้งใบของทุก stage ต้องไม่มี markdown (รวมเนื้อหา R10/R11)", () => {
    const profiles = [
      { nickname: "A", stage: "pregnant" as const, gestationalWeeks: 8 },
      { nickname: "A", stage: "pregnant" as const, gestationalWeeks: 20 },
      { nickname: "A", stage: "pregnant" as const, gestationalWeeks: 34 },
      { nickname: "A", stage: "pregnant" as const },
      { nickname: "A", stage: "lactating" as const },
      { nickname: "A", stage: "prep" as const, weightKg: 60, heightCm: 160 },
      { nickname: "A", stage: "infertility" as const, infertilityIssues: ["pcos" as const] },
      { nickname: "A", stage: "male" as const },
    ];
    for (const p of profiles) {
      const json = JSON.stringify(generateReport(p));
      // 🔒 ดอกจันคู่ = markdown · ดอกจันเดี่ยวใช้ได้ (เป็นเชิงอรรถ "*" ของโหมดนับลูกดิ้น)
      expect(json, `${p.stage} มี markdown ในรายงาน`).not.toMatch(/\*\*|\[.+?\]\(.+?\)|^#{1,6}\s|__/m);
    }
  });

  it("ความต่างของหมวดอยู่ที่ \"ไขมันที่ต้องจำกัด\" — ท้อง/ให้นมเข้มกว่าคนทั่วไป", () => {
    for (const s of ["pregnant", "lactating"] as const) {
      expect(goodFatTarget(s).limitFats.map((f) => f.label).join(" ")).toMatch(/เข้มกว่าคนทั่วไป/);
    }
    expect(goodFatTarget("male").limitFats.map((f) => f.label)).toContain("ไขมันอิ่มตัวส่วนเกิน");
  });
});

// ── R15 · TC-15-07 — รูปสินค้า มี/ไม่มี ─────────────────────────────────────
describe("R15 — รูปสินค้าในตารางวิตามิน (TC-15-07)", () => {
  // อ่านจากดิสก์จริง ไม่ฮาร์ดโค้ดจำนวน — ชุดภาพจากแบรนด์เพิ่มได้เรื่อย ๆ (1 ส.ค. 2026
  // ได้ต้นฉบับความละเอียดสูงมาแทน crop จาก leaflet และเติมของที่ขาดไป 6 รายการ)
  // เทสต์ชุดนี้จึงต้องยืนยัน "list ตรงกับไฟล์จริง" แทนการล็อกตัวเลขไว้เฉย ๆ
  const filesOnDisk = fs
    .readdirSync(path.join(process.cwd(), "public", "products"))
    .filter((f) => f.endsWith(".jpg"))
    .map((f) => f.replace(/\.jpg$/, ""))
    .sort();
  const MISSING = Object.keys(PRODUCTS).filter((id) => !PRODUCT_PHOTO_IDS.includes(id as any));

  it("PRODUCT_PHOTO_IDS ต้องตรงกับไฟล์บนดิสก์เป๊ะทั้งสองทาง (กัน list เพี้ยน/ไฟล์หาย)", () => {
    expect([...PRODUCT_PHOTO_IDS].sort()).toEqual(filesOnDisk);
    for (const id of PRODUCT_PHOTO_IDS) expect(PRODUCTS[id], `${id} ไม่มีใน PRODUCTS`).toBeTruthy();
  });

  it("ตอนนี้เหลือสินค้าเดียวที่ยังไม่มีรูป: ซุปไก่ดำ (เตือนเมื่อแบรนด์ส่งมาแล้ว)", () => {
    expect(MISSING).toEqual(["blackchickensoup"]);
  });

  it("สินค้าที่ยังไม่มีรูป → hasProductPhoto false และ src เป็น null (ไม่ยิงรูปแตก)", () => {
    for (const id of MISSING) {
      expect(PRODUCTS[id], `${id} หายไปจาก PRODUCTS`).toBeTruthy();
      expect(hasProductPhoto(id)).toBe(false);
      expect(productPhotoSrc(id)).toBeNull();
    }
  });

  it("สินค้าที่มีรูป → path ชี้ไป /products/<id>.jpg", () => {
    expect(productPhotoSrc("ovaall")).toBe("/products/ovaall.jpg");
    expect(hasProductPhoto("ovaall")).toBe(true);
  });

  it("🔒 สินค้าไม่มีรูป ต้องยัง \"ถูกแนะนำ\" ตามปกติ ไม่ถูกซ่อนออกจากรายงาน", () => {
    // ซุปไก่ดำยังไม่มีรูป แต่ต้องยังอยู่ในแผนของแม่ให้นมตามปกติ
    const r = generateReport({ nickname: "ก้อย", stage: "lactating" });
    const ids = r.vitamins.map((v) => v.id);
    expect(ids).toContain("blackchickensoup");
    expect(ids.some((id) => !hasProductPhoto(id))).toBe(true);
  });

  it("สินค้าที่ยังไม่ยืนยัน dosage ต้องไม่มี howto (หน้าจอจึงขึ้น \"สอบถามทีม…\" แทนช่องว่าง)", () => {
    const r = generateReport({
      nickname: "A", stage: "infertility", infertilityIssues: ["male_factor"],
      partnerBehaviors: ["stress", "smoke"],
    });
    const motila = r.vitamins.find((v) => v.id === "motila1");
    expect(motila).toBeTruthy();
    expect(motila?.howto).toBeUndefined();
  });
});

// ── R15 · TC-15-01/02 — โครงใหม่ Part 1 / Part 2 ────────────────────────────
describe("R15 — Part 1 ข้อมูลของคุณ", () => {
  it("TC-15-01 โครงเดิม (จุดแข็ง/จุดที่เสริมได้/แผน 3 เฟส/สัปดาห์นี้) หายไปจาก payload แล้ว", () => {
    const r = generateReport({ nickname: "A", stage: "prep", weightKg: 60, heightCm: 160 }) as unknown as Record<string, unknown>;
    for (const k of ["strengths", "improvements", "plan90", "weeklyActions"]) {
      expect(r[k], `${k} ยังอยู่`).toBeUndefined();
    }
  });

  it("TC-15-02 ครบ 4 อย่าง: BMI · น้ำ · นอน · ออกกำลังกาย", () => {
    const r = generateReport({
      nickname: "A", stage: "prep", weightKg: 60, heightCm: 160,
      sleepBedtime: "23:30", sleepWaketime: "06:00", exerciseFreq: "1-2",
    });
    expect(r.part1?.bmi?.bmi).toBe(23.4);
    expect(r.part1?.water).toEqual({ minMl: 1800, maxMl: 2100, midMl: 1950, glassesMin: 7, glassesMax: 8 });
    expect(r.part1?.sleep.actualHours).toBe(6.5);
    expect(r.part1?.exercise.weeklyTarget).toBeTruthy();
  });

  it("นอนไม่ถึงเกณฑ์ → บอก \"ห่างอยู่เท่าไร\" อย่างอ่อนโยน ไม่ตัดสิน", () => {
    const g = buildSleepGuide("00:30", "06:00");
    expect(g.actualHours).toBe(5.5);
    expect(g.shortfallHours).toBe(1.5);
    expect(g.beforeTen).toBe(false);
    expect(g.note).toContain("1.5");
    expect(g.note).not.toMatch(/แย่|ผิด|ล้มเหลว/);
  });
  it("นอนครบเกณฑ์ + ก่อน 4 ทุ่ม → ไม่มีข้อความว่าขาด", () => {
    const g = buildSleepGuide("21:30", "06:00");
    expect(g.shortfallHours).toBe(0);
    expect(g.beforeTen).toBe(true);
    expect(g.note).toContain("อยู่ในช่วงที่แนะนำ");
  });
  it("ไม่กรอกเวลานอน → ยังบอกเกณฑ์ที่แนะนำ ไม่เดาเวลาให้", () => {
    const g = buildSleepGuide(undefined, undefined);
    expect(g.actualHours).toBeUndefined();
    expect(g.recommendedMinHours).toBe(7);
    expect(g.note).toContain("ยังไม่ได้กรอก");
  });

  it("ความถี่ออกกำลังกายที่กรอก (R4) เปลี่ยน baseline ของคำแนะนำจริง", () => {
    const often = generateReport({ nickname: "A", stage: "prep", weightKg: 60, exerciseFreq: "daily" });
    const rare = generateReport({ nickname: "A", stage: "prep", weightKg: 60, exerciseFreq: "0" });
    expect(often.part1?.exercise.baseline).toBe("active");
    expect(rare.part1?.exercise.baseline).toBe("sedentary");
    expect(often.part1?.exercise.intensity).not.toBe(rare.part1?.exercise.intensity);
    expect(often.part1?.exercise.freqLabel).toBe("ทุกวัน");
  });

  it("ไม่กรอกน้ำหนัก → ไม่มีเป้าน้ำ/BMI (ไม่เดาตัวเลขให้)", () => {
    const r = generateReport({ nickname: "A", stage: "prep" });
    expect(r.part1?.water).toBeNull();
    expect(r.part1?.bmi).toBeNull();
    expect(r.part2?.protein).toBeNull();
  });
});

describe("R15 — Part 2 โภชนาการของคุณ", () => {
  it("TC-15-04 แสดงโปรตีน/น้ำ/ไขมันดี เฉพาะบุคคล", () => {
    const r = generateReport({ nickname: "A", stage: "pregnant", weightKg: 60, heightCm: 160 });
    expect(r.part2?.protein).toEqual({ min: 66, max: 78, ferty: 3 });
    expect(r.part2?.waterMl?.minMl).toBe(2100); // 60×30 + 300 (bonus ช่วงตั้งครรภ์)
    expect(r.part2?.goodFat.epaDhaMgPerDay).toBe(300);
  });

  it("Open Q#5 — stage 'infertility' ใช้ช่วงโปรตีนเดียวกับ 'prep' (protein.ts ไม่มีหมวดนี้)", () => {
    const inf = generateReport({ nickname: "A", stage: "infertility", weightKg: 60 });
    const prep = generateReport({ nickname: "A", stage: "prep", weightKg: 60 });
    expect(inf.part2?.protein).toEqual(prep.part2?.protein);
    expect(inf.part2?.protein).toEqual({ min: 72, max: 90, ferty: 4 });
    // แต่ไขมันดี/น้ำ ยังยึด stage จริง ไม่ถูกแปลงเป็น prep
    expect(inf.part2?.goodFat.stage).toBe("infertility");
  });

  it("TC-15-06 มีตารางโปรตีนต่ออาหาร + ผัก + ผลไม้ พร้อมอ้างอิงที่มา", () => {
    const r = generateReport({ nickname: "A", stage: "prep", weightKg: 60 });
    expect(r.part2?.proteinFoods.length).toBeGreaterThan(0);
    // ตารางใหม่ (2026-08-21) มาจาก source/ตารางโปรตีนอาหาร.xlsx — ฐาน "วัตถุดิบดิบ 100 ก."
    expect(r.part2?.proteinFoods.find((f) => f.food === "อกไก่ (ไม่มีหนัง)"))
      .toEqual({ food: "อกไก่ (ไม่มีหนัง)", per: "100 กรัม", protein: "≈ 23 ก.", proteinAvg: 23, group: "meat", note: "ไขมันต่ำสุดในกลุ่มไก่" });
    // ต้นสั่งเพิ่มอะโวคาโดเข้าไปด้วย ทั้งที่ไม่มีในไฟล์ต้นฉบับ
    expect(r.part2?.proteinFoods.find((f) => f.food === "อะโวคาโด")).toBeTruthy();
    // ค่าจากคัมภีร์ครูก้อย (ฐาน "สุก") ไม่ได้หายไป — ย้ายไปอยู่ตาราง "หน่วยที่กินจริง"
    expect(r.part2?.proteinServings.find((s) => s.serving === "อกไก่สุก 100 กรัม")?.protein).toBe("≈ 30 ก.");
    expect(r.part2?.proteinServings.find((s) => s.serving.includes("เฟอร์ตี้"))?.protein).toBe("≈ 25 ก.");
    // ทุกแถวต้องมีค่าตัวเลขไว้วาดแถบ และไม่เกินสเกลสูงสุด
    for (const f of r.part2!.proteinFoods) {
      expect(f.proteinAvg).toBeGreaterThan(0);
      expect(f.proteinAvg).toBeLessThanOrEqual(PROTEIN_BAR_MAX);
      expect(PROTEIN_FOOD_GROUPS.some((g) => g.key === f.group)).toBe(true);
    }
    expect(r.part2?.proteinFoodsSource).toContain("USDA");
    expect(r.part2?.vegetables.length).toBeGreaterThan(0);
    expect(r.part2?.fruits.length).toBeGreaterThan(0);
  });

  it("ไขมันดีในรายงานตรงกับ stage ของผู้ใช้ทั้ง 5 หมวด", () => {
    for (const s of ALL_STAGES) {
      const r = generateReport({ nickname: "A", stage: s, weightKg: 60 });
      expect(r.part2?.goodFat).toEqual(goodFatTarget(s));
    }
  });
});

// ── 🔒 gate เดิม (R6) ต้องไม่รั่ว ────────────────────────────────────────────
describe("🔒 R15 — tier gate เดิมยังกันเนื้อหา Part 1/Part 2 ไว้ครบ", () => {
  const full = generateReport({
    nickname: "หมิว", stage: "infertility", artPlan: "ยัง", weightKg: 60, heightCm: 160,
    sleepBedtime: "23:30", sleepWaketime: "06:00", exerciseFreq: "1-2",
  });

  it("teaser payload ไม่มี part1/part2/ไขมันดี/BMI/ตารางอาหาร", () => {
    const json = JSON.stringify(buildTeaser(full));
    expect(json).not.toMatch(/"part1"|"part2"|"goodFat"|"bmi"|"proteinFoods"|"epaDhaMgPerDay"/);
    expect(json).not.toMatch(/250 มก\.|300 มก\./);
  });

  it("tier ยังตัดสินด้วยกติกาเดิมทุกกรณี (R15 ไม่แตะ)", () => {
    expect(reportTier({ artPlan: "ยัง", infertilityIssues: [] })).toBe("teaser");
    expect(reportTier({ artPlan: "IUI" })).toBe("medium");
    expect(reportTier({ artPlan: "IVF-ICSI" })).toBe("full");
  });
});

// ── รายงานเก่า (snapshot ก่อน R3) ต้องยังใช้งานได้ ──────────────────────────
describe("R15 — ความเข้ากันได้กับ reports.payload เก่า (ก่อน R3)", () => {
  // payload จริงรูปแบบเดิม: มี strengths/plan90 แต่ไม่มี part1/part2/bmi
  const legacy = {
    title: "แผน 90 วัน มั่นใจก่อนมีลูก — ฉบับของคุณ",
    tagline: "…", nickname: "เก่า", greeting: "…",
    score: 60, scoreLabel: "พร้อมพอควร มีจุดเสริม 💛",
    strengths: ["จุดแข็งเดิม"], improvements: [], quickWinToday: "วันนี้: กินไข่ต้ม 2 ฟอง",
    pillars: [
      { key: "egg", label: "คุณภาพไข่", score: 60, note: "…" },
      { key: "sleep", label: "การนอน", score: null, note: "ยังไม่ได้ประเมิน" },
    ],
    fertileWindow: null, protein: { min: 72, max: 90, ferty: 4 },
    vitamins: [{ id: "ovaall", name: "OvaAll", price: 2490, group: "core", why: "…" }],
    vitaminNote: "…", plan90: [], weeklyActions: [],
    partnerNudge: null, isMale: false, cautions: ["…"],
    generatedFor: { stage: "เตรียมตั้งครรภ์", hasPcos: false },
  } as unknown as Report;

  it("อ่านฟิลด์ใหม่แล้วได้ undefined ไม่ throw (หน้าจอใช้ optional chain ทุกจุด)", () => {
    expect(legacy.part1).toBeUndefined();
    expect(legacy.part2).toBeUndefined();
    expect(legacy.part1?.water?.minMl).toBeUndefined();
    expect(legacy.part2?.goodFat?.epaDhaMgPerDay).toBeUndefined();
    expect(legacy.bmi).toBeUndefined();
  });

  it("ฟิลด์ที่หน้าจอ deref ตรง ๆ (vitamins/cautions) ยังมีครบใน payload เก่า", () => {
    expect(Array.isArray(legacy.vitamins)).toBe(true);
    expect(Array.isArray(legacy.cautions)).toBe(true);
    // สินค้าเก่าไม่มีรูป/ไม่มี howto ก็ต้องไม่พัง
    expect(productPhotoSrc(legacy.vitamins[0].id)).toBe("/products/ovaall.jpg");
    expect(legacy.vitamins[0].howto).toBeUndefined();
  });

  it("buildTeaser ยังทำงานกับ payload เก่าได้ (เส้นทาง LINE/ticket เดิม)", () => {
    const t = buildTeaser(legacy);
    expect(t.nickname).toBe("เก่า");
    expect(t.weakestPillars.length).toBeGreaterThan(0);
    expect(t.recommendedProducts[0].name).toBe("OvaAll");
  });
});
