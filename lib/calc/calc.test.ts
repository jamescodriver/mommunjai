import { describe, it, expect } from "vitest";
import { calcOvulation } from "./ovulation";
import { calcProtein } from "./protein";
import { assessNutrients } from "./nutrients";
import { bedtimesForWake, assessSleep } from "./sleep";
import {
  recommendVitamins, mapLegacyArtPlan, ART_PLAN_VALUES, ART_PLAN_LABELS, artPlanLabel,
  INFERTILITY_ISSUE_VALUES, INFERTILITY_BASE_SET, INFERTILITY_PRODUCT_MAP, LINING_PREP_SET,
  behaviorProductIds, resolvePcosStatus, NO_DOSAGE_YET, PRODUCTS, CONCEPTION_METHODS,
  EXERCISE_FREQ_VALUES, type MaleBehavior,
} from "./vitamins";
import { calcWater } from "./water";
import { autoTags } from "../tagging";
import { genTicketCode } from "../ticket";
import { bmiTier, bmiValue, bmiScale, BMI_BANDS, BMI_TIER_NOTE } from "./bmi";

describe("ovulation (M2)", () => {
  it("computes ovulation 14d before next period for a 28d cycle", () => {
    const r = calcOvulation({ lastPeriodStart: "2026-07-01", cycleLength: 28 });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.nextPeriod).toBe("2026-07-29");
      expect(r.ovulationDate).toBe("2026-07-15"); // 29 - 14
      expect(r.fertileStart).toBe("2026-07-10");
      expect(r.fertileEnd).toBe("2026-07-16");
    }
  });
  it("rejects future dates", () => {
    const r = calcOvulation({ lastPeriodStart: "2099-01-01", cycleLength: 28 });
    expect("error" in r).toBe(true);
  });
  it("rejects out-of-range cycle length", () => {
    expect("error" in calcOvulation({ lastPeriodStart: "2026-07-01", cycleLength: 12 })).toBe(true);
    expect("error" in calcOvulation({ lastPeriodStart: "2026-07-01", cycleLength: 40 })).toBe(true);
  });
  it("flags irregular cycles", () => {
    const r = calcOvulation({ lastPeriodStart: "2026-07-01", cycleLength: 34 });
    if (!("error" in r)) expect(r.irregularWarning).toBe(true);
  });
});

describe("protein (M3)", () => {
  it("computes range for prep stage (1.2–1.5 g/kg)", () => {
    const r = calcProtein({ weightKg: 50, stage: "prep" });
    if (!("error" in r)) {
      expect(r.minGrams).toBe(60); // 50*1.2
      expect(r.maxGrams).toBe(75); // 50*1.5
      expect(r.perKg).toEqual([1.2, 1.5]);
      expect(r.fertyServings.max).toBeGreaterThanOrEqual(3);
    }
  });
  it("pregnant needs more (1.1-1.3)", () => {
    const r = calcProtein({ weightKg: 60, stage: "pregnant" });
    if (!("error" in r)) { expect(r.minGrams).toBe(66); expect(r.maxGrams).toBe(78); }
  });
  it("rejects invalid weight", () => {
    expect("error" in calcProtein({ weightKg: 0, stage: "prep" })).toBe(true);
    expect("error" in calcProtein({ weightKg: 200, stage: "prep" })).toBe(true);
  });
});

describe("water (PDF-17)", () => {
  it("30-35 ml/kg range for prep, no bonus", () => {
    const r = calcWater({ weightKg: 60, stage: "prep" });
    if (!("error" in r)) {
      expect(r.targetMinMl).toBe(1800); // 60*30
      expect(r.targetMaxMl).toBe(2100); // 60*35
    }
  });
  it("pregnant/lactating get an extra bonus on top of the base range", () => {
    const base = calcWater({ weightKg: 60, stage: "prep" });
    const pregnant = calcWater({ weightKg: 60, stage: "pregnant" });
    const lactating = calcWater({ weightKg: 60, stage: "lactating" });
    if (!("error" in base) && !("error" in pregnant) && !("error" in lactating)) {
      expect(pregnant.targetMinMl).toBe(base.targetMinMl + 300);
      expect(lactating.targetMinMl).toBe(base.targetMinMl + 700);
    }
  });
  it("rejects invalid weight", () => {
    expect("error" in calcWater({ weightKg: 0, stage: "prep" })).toBe(true);
    expect("error" in calcWater({ weightKg: 200, stage: "prep" })).toBe(true);
  });
  it("bands current intake into ดี / เกือบถึงเป้า / ควรเพิ่ม without any fear-based wording", () => {
    const good = calcWater({ weightKg: 60, stage: "prep", currentMl: 2000 });
    const low = calcWater({ weightKg: 60, stage: "prep", currentMl: 500 });
    if (!("error" in good) && !("error" in low)) {
      expect(good.current?.status).toBe("ดี");
      expect(low.current?.status).toBe("ควรเพิ่ม");
      // compliance: no scare/threat language in the shortfall explanation
      for (const r of [good, low]) {
        expect(r.current?.note).not.toMatch(/อันตราย|เสี่ยง|เสื่อม|กลัว/);
      }
    }
  });
  it("omits `current` block when currentMl isn't provided", () => {
    const r = calcWater({ weightKg: 60, stage: "prep" });
    if (!("error" in r)) expect(r.current).toBeUndefined();
  });
});

describe("nutrients (M4)", () => {
  it("100% when all eaten, flags avoid violations", () => {
    const all = ["egg", "fish", "avocado", "brownrice", "veggies", "water", "pureveg", "kaffir"];
    const r = assessNutrients(all, ["sugar"]);
    expect(r.overall).toBe(100);
    expect(r.avoidViolations).toContain("ของหวาน/น้ำตาล");
    expect(r.missing.length).toBe(0);
  });
  it("partial + missing list", () => {
    const r = assessNutrients(["egg"], []);
    expect(r.overall).toBeLessThan(100);
    expect(r.missing.length).toBeGreaterThan(0);
  });
});

describe("sleep (M5)", () => {
  it("suggests bedtimes for a wake time", () => {
    const r = bedtimesForWake("06:30");
    if ("bedtimes" in r) { expect(r.bedtimes).toHaveLength(2); expect(r.bedtimes[0]).toMatch(/^\d{2}:\d{2}$/); }
  });
  it("assess: before 10pm + 8h = good", () => {
    const r = assessSleep("22:00", "06:00");
    if ("hours" in r) { expect(r.hours).toBe(8); expect(r.status).toBe("ดี"); expect(r.beforeTen).toBe(true); }
  });
  it("assess: late bedtime flagged", () => {
    const r = assessSleep("01:00", "08:00");
    if ("hours" in r) { expect(r.beforeTen).toBe(false); expect(r.status).toBe("ควรปรับ"); }
  });
  it("rejects bad time", () => { expect("error" in assessSleep("99:99", "06:00")).toBe(true); });
});

describe("vitamins (M6)", () => {
  it("PCOS gets PCO-VIT", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: true, artPlan: "ยัง" });
    expect(r.primary.map((p) => p.id)).toContain("pcovit");
    expect(r.primary.map((p) => p.id)).toContain("ovaall");
  });
  it("male gets the men's set", () => {
    const r = recommendVitamins({ stage: "male", hasPcos: false, artPlan: "ยัง" });
    expect(r.primary.map((p) => p.id)).toEqual(["mzall", "ferta", "pureseed"]);
  });
  // The brand's leaflet is 19 items; an earlier version only knew 7 and capped output at 3.
  it("prep covers the brand's full set, not a token few", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง" });
    const all = [...r.core, ...r.targeted, ...r.nutrition, ...r.external];
    // R4 (0408) · PDF-01 — core เปลี่ยน collatelo → kaffirshot (client ยืนยัน 4 ตัวหลัก)
    // และ Night Shot ย้ายจาก targeted แบบไม่มีเงื่อนไข ไปผูกกับ sleepSignal (PDF-09)
    // ตัว sleepSignal ไม่ได้ส่งมาในเทสต์นี้ (undefined) จึงไม่มี Night Shot → รวมน้อยลง 2 ตัว
    expect(all.length).toBeGreaterThanOrEqual(16);
    expect(r.core.map((p) => p.id)).toEqual(["ovaall", "ferty", "kaffirshot", "ferti9oil"]);
  });
  it("PDF-09 (0408) — Night Shot โผล่เฉพาะเมื่อสัญญาณการนอนไม่ดี (ต้นยืนยัน 4/08: ทุก stage ที่ประเมินการนอน)", () => {
    for (const stage of ["prep", "infertility", "pregnant", "lactating", "male"] as const) {
      const bad = recommendVitamins({ stage, hasPcos: false, artPlan: "ยัง", sleepSignal: "bad" });
      expect(bad.primary.map((p) => p.id), stage).toContain("nightshot");
      const ok = recommendVitamins({ stage, hasPcos: false, artPlan: "ยัง", sleepSignal: "ok" });
      expect(ok.primary.map((p) => p.id), stage).not.toContain("nightshot");
      const unknown = recommendVitamins({ stage, hasPcos: false, artPlan: "ยัง" });
      expect(unknown.primary.map((p) => p.id), stage).not.toContain("nightshot");
    }
  });
  // Safety Matrix (product-catalog-master.md §4) — these must never reach the wrong stage.
  it("drops the products banned in pregnancy", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง" });
    const ids = [...r.core, ...r.targeted, ...r.nutrition, ...r.external].map((p) => p.id);
    for (const banned of ["aos", "kaffirshot", "puregreen", "varginaree", "safflower", "castoroil"]) {
      expect(ids, `${banned} ห้ามแนะนำช่วงตั้งครรภ์`).not.toContain(banned);
    }
    // R10 — แม่ท้องได้ชุดของตัวเอง (goatmilk/ferty/ferti9oil/probiotics) ไม่ใช่ชุดเตรียมตั้งครรภ์
    // ใช้ ferty เป็นตัวยืนยันว่า "ของปลอดภัยไม่ได้ถูกกรองทิ้งหมด" (เดิมใช้ ovaall ซึ่งตอนนี้
    // ตั้งใจไม่อยู่ในชุดแม่ท้องแล้ว เพราะสื่อว่า "บำรุงไข่" — Lucifer red-team 31/7)
    expect(ids).toContain("ferty");
  });
  it("drops Varginaree while breastfeeding", () => {
    const r = recommendVitamins({ stage: "lactating", hasPcos: false, artPlan: "ยัง" });
    const ids = [...r.core, ...r.targeted, ...r.nutrition].map((p) => p.id);
    expect(ids).not.toContain("varginaree");
  });
  it("warns ART patients to clear supplements with their doctor first", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "IVF-ICSI" });
    expect(r.cautions.join(" ")).toMatch(/ปรึกษาแพทย์/);
    expect(r.cautions.join(" ")).toMatch(/ใส่ตัวอ่อน/);
  });
  it("every product carries dosage, and stop-rules are spelled out", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: true, artPlan: "IVF-ICSI" });
    for (const p of [...r.core, ...r.targeted, ...r.nutrition, ...r.external]) {
      if (NO_DOSAGE_YET.includes(p.id)) continue; // R3 §Reversals — อนุมัติให้แสดงโดยยังไม่มี dosage
      expect(p.howto, `${p.name} ไม่มีวิธีรับประทาน`).toBeTruthy();
    }
    // castor oil is external-only — the app must say so, never imply it is drunk
    const castor = r.external.find((p) => p.id === "castoroil");
    expect(castor?.caution).toMatch(/ห้ามรับประทาน/);
  });
  // Regression: male products shipped with no `howto`, so the report rendered them
  // with no dosage at all. Every recommended product must carry brand-confirmed dosage —
  // ยกเว้นรายชื่อใน NO_DOSAGE_YET ที่ client อนุมัติเป็นลายลักษณ์อักษรแล้ว (R3 · TC-06-08)
  it("every recommended product has dosage instructions (except the approved NO_DOSAGE_YET list)", () => {
    const profiles = [
      { stage: "male", hasPcos: false, artPlan: "ยัง" },
      { stage: "prep", hasPcos: false, artPlan: "ยัง" },
      { stage: "prep", hasPcos: true, artPlan: "ยัง" },
      { stage: "prep", hasPcos: false, artPlan: "IVF-ICSI" },
    ] as const;
    for (const p of profiles) {
      for (const prod of recommendVitamins(p).primary) {
        if (NO_DOSAGE_YET.includes(prod.id)) continue;
        expect(prod.howto, `${prod.name} ไม่มีวิธีรับประทาน`).toBeTruthy();
      }
    }
  });
  // กันคนเผลอเติมชื่อเข้า NO_DOSAGE_YET ลอย ๆ: ทุกตัวต้องมีอยู่จริงใน PRODUCTS และ
  // ต้อง "ยังไม่มี howto" จริง (ถ้าแบรนด์ส่ง dosage มาแล้ว ให้เอาออกจากลิสต์ด้วย)
  it("NO_DOSAGE_YET lists only real products that genuinely still lack a dosage", () => {
    for (const id of NO_DOSAGE_YET) {
      expect(PRODUCTS[id], `${id} ไม่มีใน PRODUCTS`).toBeTruthy();
      expect(PRODUCTS[id].howto, `${id} มี howto แล้ว — เอาออกจาก NO_DOSAGE_YET`).toBeFalsy();
    }
  });
  it("R3 — the three new SKUs exist with the catalogue prices and no invented dosage", () => {
    expect(PRODUCTS.goatmilk.name).toBe("นมแพะคัดเกรด Goats Milk");
    expect(PRODUCTS.goatmilk.price).toBe(650);
    expect(PRODUCTS.blackchickensoup.name).toBe("ซุปไก่ดำ BY ครูก้อยเข้าครัว");
    expect(PRODUCTS.blackchickensoup.price).toBe(1800);
    expect(PRODUCTS.bananaflower.name).toBe("น้ำหัวปลี มามอง");
    expect(PRODUCTS.bananaflower.price).toBe(1850);
    for (const id of ["goatmilk", "blackchickensoup", "bananaflower"]) {
      expect(PRODUCTS[id].howto).toBeUndefined();
    }
  });
  it("never claims to prevent or cure disease", () => {
    const r = recommendVitamins({ stage: "male", hasPcos: false, artPlan: "ยัง" });
    const text = r.note + r.primary.map((p) => `${p.why}${p.howto ?? ""}${p.detail ?? ""}`).join("");
    expect(text).not.toMatch(/มะเร็ง|ป้องกันโรค|รักษา|หย่อนสมรรถภาพ|ไม่มีผลข้างเคียง/);
  });
  it("note never claims cure", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: true, artPlan: "ยัง" });
    expect(r.note).not.toMatch(/หายขาด|รักษาให้หาย|การันตี|ท้องแน่นอน/);
  });
});

describe("mapLegacyArtPlan (R4 migration)", () => {
  it("maps every legacy value forward", () => {
    expect(mapLegacyArtPlan("none")).toBe("ยัง");
    expect(mapLegacyArtPlan("")).toBe("ยัง");
    expect(mapLegacyArtPlan("iui")).toBe("IUI");
    expect(mapLegacyArtPlan("ivf")).toBe("IVF-ICSI");
    expect(mapLegacyArtPlan("icsi")).toBe("IVF-ICSI");
  });
  it("is case-insensitive on legacy values", () => {
    expect(mapLegacyArtPlan("IVF")).toBe("IVF-ICSI");
    expect(mapLegacyArtPlan("ICSI")).toBe("IVF-ICSI");
    expect(mapLegacyArtPlan("IUI")).toBe("IUI"); // also a valid *new* value verbatim
  });
  it("passes every new R4 value through unchanged", () => {
    for (const v of ART_PLAN_VALUES) expect(mapLegacyArtPlan(v)).toBe(v);
  });
  it("never throws on garbage/untrusted input — defaults to ยัง", () => {
    expect(mapLegacyArtPlan(undefined)).toBe("ยัง");
    expect(mapLegacyArtPlan(null)).toBe("ยัง");
    expect(mapLegacyArtPlan(123)).toBe("ยัง");
    expect(mapLegacyArtPlan({})).toBe("ยัง");
    expect(mapLegacyArtPlan("some-unknown-string")).toBe("ยัง");
  });
});

// 🔄 หัวข้อเดิมคือ "internal only, never shown as a number" — R13 กลับมติให้แสดงตัวเลข+แถบสี
// (PRD-UPDATE-R3-3107 §Reversals · TC-13-01) เกณฑ์การแบ่งระดับยังเป็นชุดเดิม + เพิ่ม underweight
describe("bmiTier (R13 — now user-facing: number + 4-level colour scale)", () => {
  it("classifies normal/overweight/obese by WHO Asian cutoffs", () => {
    expect(bmiTier(50, 160)).toBe("normal"); // BMI ≈ 19.5
    expect(bmiTier(66.5, 170)).toBe("overweight"); // BMI ≈ 23.0
    expect(bmiTier(75, 170)).toBe("obese"); // BMI ≈ 26.0
  });
  it("boundary: BMI exactly 23 is overweight, not normal", () => {
    const heightM = 1.7;
    const weightAt23 = 23 * heightM * heightM;
    expect(bmiTier(weightAt23, 170)).toBe("overweight");
  });
  it("boundary: BMI exactly 25 is obese, not overweight", () => {
    const heightM = 1.7;
    const weightAt25 = 25 * heightM * heightM;
    expect(bmiTier(weightAt25, 170)).toBe("obese");
  });
  it("boundary: just under 23 is still normal", () => {
    const heightM = 1.7;
    const weightJustUnder23 = 23 * heightM * heightM - 0.01;
    expect(bmiTier(weightJustUnder23, 170)).toBe("normal");
  });
  it("rejects invalid/non-finite/non-positive inputs without throwing", () => {
    expect(bmiTier(0, 160)).toBeNull();
    expect(bmiTier(-5, 160)).toBeNull();
    expect(bmiTier(50, 0)).toBeNull();
    expect(bmiTier(50, -160)).toBeNull();
    expect(bmiTier(NaN, 160)).toBeNull();
    expect(bmiTier(50, Infinity)).toBeNull();
  });
  // R13 🔒 — ระดับใหม่ "ต่ำกว่าเกณฑ์": ผอมเกินไปมีผลต่อการตกไข่ ห้ามถูกจัดรวมเป็น "ปกติ" เหมือนเดิม
  it("R13 — adds the underweight band (<18.5), which used to fall into 'normal'", () => {
    expect(bmiTier(45, 165)).toBe("underweight"); // BMI ≈ 16.5
    const at18_5 = 18.5 * 1.65 * 1.65;
    expect(bmiTier(at18_5, 165)).toBe("normal"); // ขอบพอดี 18.5 = ปกติ
    expect(bmiTier(at18_5 - 0.01, 165)).toBe("underweight");
  });
  it("R13 — bmiValue returns the real number rounded to 1 decimal", () => {
    expect(bmiValue(60, 165)).toBe(22); // 60 / 1.65² = 22.038…
    expect(bmiValue(0, 165)).toBeNull();
    expect(bmiValue(60, 0)).toBeNull();
    expect(bmiValue(NaN, 165)).toBeNull();
  });
  it("R13 — bmiScale gives number + tier + label + colour for all 4 bands", () => {
    const cases: [number, string][] = [[45, "underweight"], [60, "normal"], [65, "overweight"], [75, "obese"]];
    for (const [kg, tier] of cases) {
      const r = bmiScale(kg, 165);
      expect(r, `${kg}kg`).not.toBeNull();
      expect(r!.tier).toBe(tier);
      expect(r!.bmi).toBeGreaterThan(0);
      expect(r!.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(r!.label.length).toBeGreaterThan(0);
      expect(r!.note).toBe(BMI_TIER_NOTE[r!.tier]);
    }
    expect(bmiScale(0, 165)).toBeNull();
  });
  it("R13 — BMI_BANDS covers exactly the 4 tiers, in order, each with its own colour", () => {
    expect(BMI_BANDS.map((b) => b.tier)).toEqual(["underweight", "normal", "overweight", "obese"]);
    expect(new Set(BMI_BANDS.map((b) => b.color)).size).toBe(4);
  });
  it("compliance: the qualitative note never spells out 'BMI' or a decimal BMI-style number (e.g. 27.3)", () => {
    for (const tier of Object.keys(BMI_TIER_NOTE) as (keyof typeof BMI_TIER_NOTE)[]) {
      expect(BMI_TIER_NOTE[tier]).not.toMatch(/BMI|ดัชนีมวลกาย/i);
      expect(BMI_TIER_NOTE[tier]).not.toMatch(/\d+\.\d/); // no decimal figure like a BMI value
    }
  });
});

describe("recommendVitamins — R2 infertility issue checklist", () => {
  it("issues=['pcos'] triggers PCO-VIT even without the legacy hasPcos flag", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["pcos"] });
    expect(r.primary.map((p) => p.id)).toContain("pcovit");
  });
  // 🔄 R3 กลับมติ R2: Motila1 แนะนำได้แล้ว (แบบไม่มีวิธีทาน) — PRD-UPDATE-R3-3107 §Reversals
  it("issues=['male_factor'] adds the men's set incl. Motila1 (R3 reversal)", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["male_factor"] });
    const ids = r.primary.map((p) => p.id);
    expect(ids).toContain("mzall");
    expect(ids).toContain("ferta");
    expect(ids).toContain("motila1");
  });
  it("issues=['unsure'] behaves like the pre-checklist baseline — no PCO-VIT/M-Z All added", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["unsure"] });
    const ids = r.primary.map((p) => p.id);
    expect(ids).not.toContain("pcovit");
    expect(ids).not.toContain("mzall");
    expect(ids).not.toContain("motila1");
  });
  it("multiple issues combine without duplicate products", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["pcos", "male_factor", "overweight"] });
    const ids = r.primary.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length); // no dupes
    expect(ids).toContain("pcovit");
    expect(ids).toContain("mzall");
  });
  it("'overweight' issue + a computed weightTier adds a qualitative BMI note, never a number", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["overweight"], weightTier: "obese" });
    expect(r.cautions.join(" ")).toMatch(BMI_TIER_NOTE.obese);
    expect(r.cautions.join(" ")).not.toMatch(/BMI|ดัชนีมวลกาย/);
    expect(r.cautions.join(" ")).not.toMatch(/\b\d{2}\.\d\b/); // no "27.3"-style number
  });
  it("a weightTier with no 'overweight' issue ticked does not surface the BMI note", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", weightTier: "obese" });
    expect(r.cautions.join(" ")).not.toMatch(BMI_TIER_NOTE.obese);
  });
  it("Safety Matrix still drops Varginaree while lactating even via the new issue-checklist path", () => {
    const r = recommendVitamins({ stage: "lactating", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["pcos", "diminished_ovary"] });
    const ids = [...r.core, ...r.targeted, ...r.nutrition].map((p) => p.id);
    expect(ids).not.toContain("varginaree");
  });
  it("Safety Matrix still drops embryo-transfer/pregnancy-unsafe items while pregnant via the issue-checklist path", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["thin_lining", "male_factor"] });
    const ids = [...r.core, ...r.targeted, ...r.nutrition, ...r.external].map((p) => p.id);
    for (const banned of ["aos", "varginaree", "kaffirshot", "puregreen", "safflower", "castoroil"]) {
      expect(ids, `${banned} ห้ามแนะนำช่วงตั้งครรภ์`).not.toContain(banned);
    }
  });
  it("INFERTILITY_ISSUE_VALUES has exactly the 7 spec'd keys, 'unsure' included", () => {
    expect(INFERTILITY_ISSUE_VALUES).toHaveLength(7);
    expect(INFERTILITY_ISSUE_VALUES).toContain("unsure");
  });
});

describe("recommendVitamins — R4 artPlan (5-value schema)", () => {
  it("only 'ยัง' skips the ART-consult caution; every other value adds it", () => {
    const skip = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง" });
    expect(skip.cautions.join(" ")).not.toMatch(/ปรึกษาแพทย์ที่ดูแลคุณก่อนเริ่มอาหารเสริม/);
    for (const ap of ["IUI", "IVF-ICSI", "บำรุงไข่", "เตรียมผนังมดลูก"] as const) {
      const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: ap });
      expect(r.cautions.join(" "), `artPlan=${ap}`).toMatch(/ปรึกษาแพทย์ที่ดูแลคุณก่อนเริ่มอาหารเสริม/);
    }
  });
});

describe("tagging (M8)", () => {
  it("auto tags from profile", () => {
    const t = autoTags({ stage: "infertility", hasPcos: true, artPlan: "IVF-ICSI", interests: ["ovaall"], toolResultsCount: 4 });
    expect(t).toEqual(expect.arrayContaining(["#PCOS", "#มีบุตรยาก", "#ICSI", "#สนใจ-OvaAll", "#engaged"]));
  });
});

describe("ticket", () => {
  it("format MJ-XXXXXX without confusing chars", () => {
    for (let i = 0; i < 50; i++) expect(genTicketCode()).toMatch(/^MJ-[2-9A-HJ-NP-Z]{6}$/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRD-UPDATE-R3-3107.md — batch 1+2 (R2/R3/R4/R6/R7/R8/R9/R12)
// ชื่อเทสต์อ้าง TC-xx-xx ตรงกับ public/test-plan-3107.html เพื่อให้ tester เขียน
// test report โดยใช้ id เดียวกันได้
// ═══════════════════════════════════════════════════════════════════════════

const idsOf = (r: ReturnType<typeof recommendVitamins>) =>
  [...r.core, ...r.targeted, ...r.nutrition, ...r.external].map((p) => p.id);

describe("R2 — ช่วงอายุ 35–39 / 40+ → A.O.S [TS-02]", () => {
  it("TC-02-01 อายุ 35–39 → มี A.O.S", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", ageRange: "35–39" });
    expect(r.primary.map((p) => p.id)).toContain("aos");
  });
  it("TC-02-02 อายุ 40+ → มี A.O.S", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", ageRange: "40+" });
    expect(r.primary.map((p) => p.id)).toContain("aos");
  });
  it("TC-02-03 อายุต่ำกว่า 35 และไม่มีปัจจัยอื่น → ไม่มี A.O.S", () => {
    for (const ageRange of ["ต่ำกว่า 30", "30–34", undefined]) {
      const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", ageRange });
      expect(r.primary.map((p) => p.id), `ageRange=${ageRange}`).not.toContain("aos");
    }
  });
  it("TC-02-04 เข้าเงื่อนไขทั้งอายุและ artPlan พร้อมกัน → A.O.S ปรากฏครั้งเดียว", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "IUI", ageRange: "40+" });
    const all = idsOf(r);
    expect(all.filter((x) => x === "aos")).toHaveLength(1);
    expect(r.primary.filter((p) => p.id === "aos")).toHaveLength(1);
  });
  it("รับ hyphen '35-39' ที่พิมพ์มือจากหน้า /leads ได้ด้วย", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", ageRange: "35-39" });
    expect(r.primary.map((p) => p.id)).toContain("aos");
  });
  it("🔒 แม่ตั้งครรภ์อายุ 40+ ต้องไม่ได้ A.O.S — กฎอายุห้าม bypass Safety Matrix", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง", ageRange: "40+" });
    expect(idsOf(r)).not.toContain("aos");
    expect(r.primary.map((p) => p.id)).not.toContain("aos");
  });
  it("🔒 ฝ่ายชายอายุ 40+ ยังได้ A.O.S ตามปกติ (ไม่มี stop rule ของ stage นี้)", () => {
    const r = recommendVitamins({ stage: "male", hasPcos: false, artPlan: "ยัง", ageRange: "40+" });
    expect(r.primary.map((p) => p.id)).toContain("aos");
  });
});

describe("R3 — artPlan 'เตรียมผนังมดลูก' → ชุดเฉพาะ 4 ตัว [TS-03]", () => {
  it("TC-03-01 เห็นครบทั้ง 4 รายการ (Colla Telo + ดอกคำฝอย + น้ำมันละหุ่ง + Probiotics)", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "เตรียมผนังมดลูก" });
    for (const id of LINING_PREP_SET) expect(r.primary.map((p) => p.id), id).toContain(id);
    expect(LINING_PREP_SET).toEqual(["collatelo", "safflower", "castoroil", "probiotics"]);
  });
  it("ผูกกับค่า artPlan ไม่ใช่ stage — ทำงานได้ทั้ง prep และ infertility", () => {
    for (const stage of ["prep", "infertility", "lactating"] as const) {
      const r = recommendVitamins({ stage, hasPcos: false, artPlan: "เตรียมผนังมดลูก" });
      for (const id of LINING_PREP_SET) expect(r.primary.map((p) => p.id), `${stage}/${id}`).toContain(id);
    }
  });
  it("ไม่ได้เลือก 'เตรียมผนังมดลูก' → ไม่ถูกยกขึ้นมาเป็นคำแนะนำหลัก", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง" });
    expect(r.primary.map((p) => p.id)).not.toContain("castoroil");
    expect(r.primary.map((p) => p.id)).not.toContain("safflower");
  });
  it("TC-03-02 🔒 คำเตือน stop-rule ของดอกคำฝอย/น้ำมันละหุ่งยังแสดงครบ", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "เตรียมผนังมดลูก" });
    const text = r.cautions.join(" ");
    expect(text).toMatch(/วันไข่ตก/);
    expect(text).toMatch(/ใส่ตัวอ่อน/);
    expect(text).toMatch(/ตั้งครรภ์/);
    expect(text).toMatch(/ห้ามรับประทาน/); // น้ำมันละหุ่ง = ใช้ภายนอก
    // และตัวสินค้าเองต้องยังพก stop-rule ติดมาด้วย (หน้าจอ render จากตรงนี้)
    const safflower = r.primary.find((p) => p.id === "safflower");
    expect(safflower?.stop).toEqual({ ovulation: true, embryoTransfer: true, pregnant: true });
  });
  it("🔒 แม่ตั้งครรภ์ที่ค่า artPlan ยังค้างเป็น 'เตรียมผนังมดลูก' ต้องไม่ได้ของที่ห้ามช่วงตั้งครรภ์", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "เตรียมผนังมดลูก" });
    const all = idsOf(r);
    for (const banned of ["safflower", "castoroil"]) expect(all, banned).not.toContain(banned);
    expect(all).toContain("collatelo"); // ตัวที่ปลอดภัยยังอยู่
  });
});

describe("R4 — PCOS 3 สถานะ [TS-04]", () => {
  it("resolvePcosStatus: checklist > ช่องใหม่ > has_pcos เดิม", () => {
    expect(resolvePcosStatus({ infertilityIssues: ["pcos"], pcosStatus: "no" })).toBe("yes");
    expect(resolvePcosStatus({ pcosStatus: "unsure", hasPcos: true })).toBe("unsure");
    expect(resolvePcosStatus({ hasPcos: true })).toBe("yes");
    expect(resolvePcosStatus({})).toBe("no");
  });
  it("'มี' (yes) → แนะนำ PCO-VIT", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", pcosStatus: "yes" });
    expect(r.primary.map((p) => p.id)).toContain("pcovit");
  });
  it("TC-04-05 'ไม่แน่ใจ' → ไม่มี PCO-VIT แต่มีข้อความชวนไปตรวจยืนยัน", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", pcosStatus: "unsure" });
    expect(r.primary.map((p) => p.id)).not.toContain("pcovit");
    expect(r.cautions.join(" ")).toMatch(/ยังไม่แน่ใจ/);
    expect(r.cautions.join(" ")).toMatch(/ตรวจยืนยันกับแพทย์/);
    // compliance: ห้ามบอกว่า "คุณเป็น PCOS"
    expect(r.cautions.join(" ")).not.toMatch(/คุณเป็น PCOS|คุณมีภาวะ PCOS/);
  });
  it("'ไม่ติ๊กเลย' (no) → ไม่มีทั้ง PCO-VIT และข้อความ PCOS", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: false, artPlan: "ยัง", pcosStatus: "no" });
    expect(r.primary.map((p) => p.id)).not.toContain("pcovit");
    expect(r.cautions.join(" ")).not.toMatch(/PCOS/);
  });
  it("ข้อมูลเก่าที่มีแต่ has_pcos=true ยังได้ PCO-VIT เหมือนเดิม (backward compat)", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: true, artPlan: "ยัง" });
    expect(r.primary.map((p) => p.id)).toContain("pcovit");
  });
  it("EXERCISE_FREQ_VALUES ตรงกับที่ระบุใน PRD 4 ตัวเลือก", () => {
    expect(EXERCISE_FREQ_VALUES).toEqual(["0", "1-2", "3-4", "daily"]);
  });
});

describe("R6 — กฎสินค้าจากพฤติกรรมฝ่ายชาย [TS-06]", () => {
  const male = (behaviors: MaleBehavior[]) =>
    recommendVitamins({ stage: "male", hasPcos: false, artPlan: "ยัง", behaviors }).primary.map((p) => p.id);

  it("TC-06-03 ติ๊ก 'เครียด' อย่างเดียว → มี A.O.S (ไม่มี Motila1)", () => {
    expect(behaviorProductIds(["stress"])).toEqual(["aos"]);
    expect(male(["stress"])).toContain("aos");
    expect(male(["stress"])).not.toContain("motila1");
  });
  it("TC-06-04 ติ๊ก 'ดื่ม' อย่างเดียว → มี Motila1 (ไม่มี A.O.S)", () => {
    expect(behaviorProductIds(["alcohol"])).toEqual(["motila1"]);
    expect(male(["alcohol"])).toContain("motila1");
    expect(male(["alcohol"])).not.toContain("aos");
  });
  it("TC-06-05 ติ๊ก 'บุหรี่' อย่างเดียว → มี Motila1", () => {
    expect(behaviorProductIds(["smoke"])).toEqual(["motila1"]);
    expect(male(["smoke"])).toContain("motila1");
  });
  it("TC-06-06 ติ๊กครบ 3 → มีทั้ง A.O.S และ Motila1", () => {
    const ids = male(["smoke", "alcohol", "stress"]);
    expect(ids).toContain("aos");
    expect(ids).toContain("motila1");
  });
  it("TC-06-07 ติ๊ก 2 ข้อพอดี → มีทั้งคู่ (ยืนยันขอบเขต >= 2 ทุกคู่)", () => {
    const pairs: MaleBehavior[][] = [["smoke", "alcohol"], ["smoke", "stress"], ["alcohol", "stress"]];
    for (const pair of pairs) {
      expect(behaviorProductIds(pair), pair.join("+")).toEqual(["aos", "motila1"]);
      const ids = male(pair);
      expect(ids, pair.join("+")).toContain("aos");
      expect(ids, pair.join("+")).toContain("motila1");
    }
  });
  it("ไม่ติ๊กเลย → ไม่เพิ่มทั้งคู่จากกฎนี้", () => {
    expect(behaviorProductIds([])).toEqual([]);
    expect(behaviorProductIds(undefined)).toEqual([]);
    const ids = male([]);
    expect(ids).toEqual(["mzall", "ferta", "pureseed"]);
  });
  it("ค่าซ้ำ/ค่าขยะจาก client ไม่ทำให้นับเกิน (['stress','stress'] = 1 ข้อ)", () => {
    expect(behaviorProductIds(["stress", "stress"])).toEqual(["aos"]);
    expect(behaviorProductIds(["smoke", "hacked" as MaleBehavior])).toEqual(["motila1"]);
  });
  it("TC-06-08 Motila1 ที่แสดงยังไม่มีวิธีรับประทาน แต่ถูก mark flag ไว้แล้ว", () => {
    const motila = recommendVitamins({ stage: "male", hasPcos: false, artPlan: "ยัง", behaviors: ["smoke"] })
      .primary.find((p) => p.id === "motila1");
    expect(motila).toBeTruthy();
    expect(motila!.howto).toBeUndefined();
    expect(NO_DOSAGE_YET).toContain("motila1");
  });
});

describe("R7 — ฟอร์มฝ่ายชายเมื่อติ๊ก male_factor [TS-07]", () => {
  const infertility = (issues: any[], partnerBehaviors?: MaleBehavior[]) =>
    recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: issues, partnerBehaviors })
      .primary.map((p) => p.id);

  it("TC-07-01 ติ๊ก male_factor → มีสินค้าฝ่ายชายในผลลัพธ์ (Ferta / MZ-All / Motila1)", () => {
    const ids = infertility(["male_factor"]);
    for (const id of ["ferta", "mzall", "motila1"]) expect(ids, id).toContain(id);
  });
  it("กฎพฤติกรรม R6 ทำงานกับข้อมูลฝ่ายชายชุดนี้ด้วย — ติ๊กเครียด → A.O.S เข้ารายการ", () => {
    expect(infertility(["male_factor"], ["stress"])).toContain("aos");
  });
  it("พฤติกรรมของคู่ไม่ทำงานถ้าไม่ได้ติ๊ก male_factor (ไม่ใช่ข้อมูลของคนกรอก)", () => {
    expect(infertility(["pcos"], ["stress"])).not.toContain("aos");
  });
  it("🔒 คู่ติ๊กเครียด แต่ผู้กรอกตั้งครรภ์อยู่ → A.O.S ยังถูกตัดออกตาม Safety Matrix", () => {
    const r = recommendVitamins({
      stage: "pregnant", hasPcos: false, artPlan: "ยัง",
      infertilityIssues: ["male_factor"], partnerBehaviors: ["stress", "smoke"],
    });
    expect(idsOf(r)).not.toContain("aos");
  });
});

describe("R8 — ป้าย IVF-ICSI [TS-08]", () => {
  it("TC-08-01 label ที่แสดง = 'IVF-ICSI (เด็กหลอดแก้ว)'", () => {
    expect(ART_PLAN_LABELS["IVF-ICSI"]).toBe("IVF-ICSI (เด็กหลอดแก้ว)");
    expect(artPlanLabel("IVF-ICSI")).toBe("IVF-ICSI (เด็กหลอดแก้ว)");
  });
  it("TC-08-02 ค่าที่เก็บยังเป็น 'IVF-ICSI' เหมือนเดิม และตัวเลือกอื่นไม่เปลี่ยน", () => {
    expect(ART_PLAN_VALUES).toEqual(["ยัง", "IUI", "IVF-ICSI", "บำรุงไข่", "เตรียมผนังมดลูก"]);
    expect(mapLegacyArtPlan("IVF-ICSI (เด็กหลอดแก้ว)")).toBe("ยัง"); // label ไม่ใช่ค่าที่ valid
    for (const v of ART_PLAN_VALUES) {
      if (v !== "IVF-ICSI") expect(artPlanLabel(v)).toBe(v);
    }
  });
  it("artPlanLabel ไม่พังกับค่าที่ไม่รู้จัก", () => {
    expect(artPlanLabel("อะไรก็ไม่รู้")).toBe("อะไรก็ไม่รู้");
  });
});

describe("R9 — ตั้งครรภ์: วิธีตั้งครรภ์ + เบาหวานขณะตั้งครรภ์ [TS-09]", () => {
  it("TC-09-01/03 CONCEPTION_METHODS เป็น array เดียวที่เติมตัวเลือกได้ — R4 (0408) · PDF-12 เติม IUI แล้ว", () => {
    expect(CONCEPTION_METHODS).toEqual(["ท้องธรรมชาติ", "ท้องด้วย IUI", "ท้องด้วย ICSI"]);
  });
  it("🔒 ติ๊กเบาหวานขณะตั้งครรภ์ → มีข้อความให้อยู่ในการดูแลของแพทย์", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง", hasGdm: true });
    expect(r.cautions.join(" ")).toMatch(/เบาหวานขณะตั้งครรภ์/);
    expect(r.cautions.join(" ")).toMatch(/การดูแลของแพทย์/);
  });
  it("ไม่ติ๊ก → ไม่มีข้อความนี้", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง" });
    expect(r.cautions.join(" ")).not.toMatch(/เบาหวานขณะตั้งครรภ์/);
  });
});

describe("R12 — ตาราง product mapping ของ 'มีบุตรยาก' [TS-12]", () => {
  const forIssues = (issues: any[]) =>
    recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: issues })
      .primary.map((p) => p.id);

  it("ชุดพื้นฐาน base 4 = Ferty · OvaAll · น้ำมะกรูด Shot 100% · Ferti 9 Oil", () => {
    expect(INFERTILITY_BASE_SET).toEqual(["ferty", "ovaall", "kaffirshot", "ferti9oil"]);
    expect(PRODUCTS.kaffirshot.price).toBe(600); // Open Q1 default = Shot 100% ไม่ใช่สูตร 70% ฿2,376
  });
  it("TC-12-01 PCOS อย่างเดียว → base 4 + PCO-VIT และไม่มี Colla Telo / Varginaree", () => {
    const ids = forIssues(["pcos"]);
    expect(ids).toEqual([...INFERTILITY_BASE_SET, "pcovit"]);
    expect(ids).not.toContain("collatelo");
    expect(ids).not.toContain("varginaree");
  });
  it("TC-12-02 รังไข่เสื่อมก่อนวัย → base 4 + Varginaree", () => {
    expect(forIssues(["diminished_ovary"])).toEqual([...INFERTILITY_BASE_SET, "varginaree"]);
  });
  it("TC-12-03 ฮอร์โมนเพศต่ำ → base 4 + Varginaree", () => {
    expect(forIssues(["low_hormone"])).toEqual([...INFERTILITY_BASE_SET, "varginaree"]);
  });
  it("TC-12-04 ผนังมดลูกบาง → base 4 + Colla Telo + Varginaree", () => {
    expect(forIssues(["thin_lining"])).toEqual([...INFERTILITY_BASE_SET, "collatelo", "varginaree"]);
  });
  it("ปัญหาจากฝ่ายชาย → Ferta + MZ-All + Motila1 (บน base 4 ของผู้กรอกเอง)", () => {
    expect(forIssues(["male_factor"])).toEqual([...INFERTILITY_BASE_SET, "ferta", "mzall", "motila1"]);
  });
  it("TC-13-02 น้ำหนักเกิน → base 4 + PCO-VIT + คำแนะนำโภชนาการ/ออกกำลังกาย", () => {
    expect(forIssues(["overweight"])).toEqual([...INFERTILITY_BASE_SET, "pcovit"]);
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["overweight"] });
    expect(r.cautions.join(" ")).toMatch(/ลดคาร์บ/);
    expect(r.cautions.join(" ")).toMatch(/ออกกำลังกาย/);
  });
  it("TC-12-06 'ไม่แน่ใจ' → base 4 เท่านั้น (แม้ has_pcos เดิมจะเป็น true)", () => {
    expect(forIssues(["unsure"])).toEqual(INFERTILITY_BASE_SET);
    const legacy = recommendVitamins({ stage: "infertility", hasPcos: true, artPlan: "ยัง", infertilityIssues: ["unsure"] });
    expect(legacy.primary.map((p) => p.id)).toEqual(INFERTILITY_BASE_SET);
  });
  it("TC-12-05 ติ๊กหลายข้อ → union แบบ dedupe ไม่ซ้ำ ไม่ตกหล่น", () => {
    const ids = forIssues(["pcos", "thin_lining", "overweight", "low_hormone"]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [...INFERTILITY_BASE_SET, "pcovit", "collatelo", "varginaree"]) expect(ids, id).toContain(id);
  });
  it("TC-12-07 ตรวจทีละแถว — ทุกแถวของตารางต้องได้ base 4 + ของในแถวนั้นเป๊ะ", () => {
    for (const [issue, extras] of Object.entries(INFERTILITY_PRODUCT_MAP)) {
      expect(forIssues([issue]), issue).toEqual([...INFERTILITY_BASE_SET, ...extras]);
    }
  });
  it("ทุก id ในตาราง mapping มีอยู่จริงใน PRODUCTS (กันพิมพ์ผิดเงียบ ๆ)", () => {
    for (const id of [...INFERTILITY_BASE_SET, ...LINING_PREP_SET, ...Object.values(INFERTILITY_PRODUCT_MAP).flat()]) {
      expect(PRODUCTS[id], id).toBeTruthy();
    }
  });
});

// 🔒🔒 คุณสมบัติความปลอดภัยที่สำคัญที่สุดของไฟล์นี้ — ต้องจริงกับ "ทุก" เส้นทางใหม่
describe("Safety Matrix — allowedIn() ยังกรองได้ครบทุก code path ใหม่ของ R3", () => {
  const STAGES = ["prep", "infertility", "pregnant", "lactating", "male"] as const;
  const ISSUE_SETS: any[][] = [[], ["pcos"], ["thin_lining"], ["male_factor"], ["overweight"], ["unsure"],
    ["pcos", "thin_lining", "male_factor", "overweight", "low_hormone", "diminished_ovary"]];
  const BEHAVIOR_SETS: MaleBehavior[][] = [[], ["stress"], ["smoke"], ["smoke", "alcohol", "stress"]];

  it("สินค้าที่มี stop.pregnant ห้ามหลุดไปหาแม่ตั้งครรภ์ · stop.lactating ห้ามหลุดไปหาแม่ให้นม", () => {
    let checked = 0;
    for (const stage of STAGES)
      for (const artPlan of ART_PLAN_VALUES)
        for (const ageRange of ["ต่ำกว่า 30", "35–39", "40+"])
          for (const issues of ISSUE_SETS)
            for (const behaviors of BEHAVIOR_SETS)
              for (const pcosStatus of ["yes", "unsure", "no"] as const) {
                const r = recommendVitamins({
                  stage, hasPcos: pcosStatus === "yes", artPlan, ageRange, pcosStatus,
                  infertilityIssues: issues, behaviors, partnerBehaviors: behaviors,
                  hasGdm: stage === "pregnant",
                });
                const all = [...idsOf(r), ...r.primary.map((p) => p.id)];
                for (const id of all) {
                  const prod = PRODUCTS[id];
                  const where = `${stage}/${artPlan}/${ageRange}/${issues.join("+")}/${behaviors.join("+")}`;
                  if (stage === "pregnant") expect(prod.stop?.pregnant, `${id} @ ${where}`).toBeFalsy();
                  if (stage === "lactating") expect(prod.stop?.lactating, `${id} @ ${where}`).toBeFalsy();
                }
                checked++;
              }
    expect(checked).toBeGreaterThan(1000); // กันเทสต์ผ่านเพราะลูปว่าง
  });

  it("ของที่ปลอดภัยยังต้องอยู่ — ไม่ใช่กรองทิ้งหมดแล้วผ่านเทสต์", () => {
    const preg = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง", ageRange: "40+" });
    // R10 — ชุดแม่ท้องคือ goatmilk/ferty/ferti9oil/probiotics (ไม่ใช่ ovaall ที่สื่อว่าบำรุงไข่)
    expect(preg.primary.map((p) => p.id)).toContain("ferty");
    const lact = recommendVitamins({ stage: "lactating", hasPcos: false, artPlan: "ยัง" });
    expect(lact.primary.map((p) => p.id)).toContain("ferty");
  });

  it("ไม่มีสินค้าซ้ำข้ามกลุ่ม (core/targeted/nutrition/external) ในทุก stage", () => {
    for (const stage of STAGES) {
      const r = recommendVitamins({ stage, hasPcos: true, artPlan: "เตรียมผนังมดลูก", ageRange: "40+",
        infertilityIssues: ["pcos", "thin_lining"], partnerBehaviors: ["stress"] });
      const all = idsOf(r);
      expect(new Set(all).size, stage).toBe(all.length);
    }
  });
});
