import { describe, it, expect } from "vitest";
import { calcOvulation } from "./ovulation";
import { calcProtein } from "./protein";
import { assessNutrients } from "./nutrients";
import { bedtimesForWake, assessSleep } from "./sleep";
import { recommendVitamins, mapLegacyArtPlan, ART_PLAN_VALUES, INFERTILITY_ISSUE_VALUES } from "./vitamins";
import { calcWater } from "./water";
import { autoTags } from "../tagging";
import { genTicketCode } from "../ticket";
import { bmiTier, BMI_TIER_NOTE } from "./bmi";

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
    expect(all.length).toBeGreaterThanOrEqual(18);
    expect(r.core.map((p) => p.id)).toEqual(["ovaall", "ferty", "collatelo", "ferti9oil"]);
  });
  // Safety Matrix (product-catalog-master.md §4) — these must never reach the wrong stage.
  it("drops the products banned in pregnancy", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง" });
    const ids = [...r.core, ...r.targeted, ...r.nutrition, ...r.external].map((p) => p.id);
    for (const banned of ["aos", "kaffirshot", "puregreen", "varginaree", "safflower", "castoroil"]) {
      expect(ids, `${banned} ห้ามแนะนำช่วงตั้งครรภ์`).not.toContain(banned);
    }
    expect(ids).toContain("ovaall");
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
      expect(p.howto, `${p.name} ไม่มีวิธีรับประทาน`).toBeTruthy();
    }
    // castor oil is external-only — the app must say so, never imply it is drunk
    const castor = r.external.find((p) => p.id === "castoroil");
    expect(castor?.caution).toMatch(/ห้ามรับประทาน/);
  });
  // Regression: male products shipped with no `howto`, so the report rendered them
  // with no dosage at all. Every recommended product must carry brand-confirmed dosage.
  it("every recommended product has dosage instructions", () => {
    const profiles = [
      { stage: "male", hasPcos: false, artPlan: "ยัง" },
      { stage: "prep", hasPcos: false, artPlan: "ยัง" },
      { stage: "prep", hasPcos: true, artPlan: "ยัง" },
      { stage: "prep", hasPcos: false, artPlan: "IVF-ICSI" },
    ] as const;
    for (const p of profiles) {
      for (const prod of recommendVitamins(p).primary) {
        expect(prod.howto, `${prod.name} ไม่มีวิธีรับประทาน`).toBeTruthy();
      }
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

describe("bmiTier (R3 — internal only, never shown as a number)", () => {
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
  it("issues=['male_factor'] adds M-Z All but Motila1 stays excluded app-wide", () => {
    const r = recommendVitamins({ stage: "infertility", hasPcos: false, artPlan: "ยัง", infertilityIssues: ["male_factor"] });
    const ids = r.primary.map((p) => p.id);
    expect(ids).toContain("mzall");
    expect(ids).not.toContain("motila1");
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
