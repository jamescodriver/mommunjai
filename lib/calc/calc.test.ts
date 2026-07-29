import { describe, it, expect } from "vitest";
import { calcOvulation } from "./ovulation";
import { calcProtein } from "./protein";
import { assessNutrients } from "./nutrients";
import { bedtimesForWake, assessSleep } from "./sleep";
import { recommendVitamins } from "./vitamins";
import { calcWater } from "./water";
import { autoTags } from "../tagging";
import { genTicketCode } from "../ticket";

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
