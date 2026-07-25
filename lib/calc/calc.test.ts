import { describe, it, expect } from "vitest";
import { calcOvulation } from "./ovulation";
import { calcProtein } from "./protein";
import { assessNutrients } from "./nutrients";
import { bedtimesForWake, assessSleep } from "./sleep";
import { recommendVitamins } from "./vitamins";
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
  it("computes range for prep stage", () => {
    const r = calcProtein({ weightKg: 50, stage: "prep" });
    if (!("error" in r)) {
      expect(r.minGrams).toBe(50); // 50*1.0
      expect(r.maxGrams).toBe(60); // 50*1.2
      expect(r.fertyServings.max).toBeGreaterThanOrEqual(2);
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
    const r = recommendVitamins({ stage: "prep", hasPcos: true, artPlan: "none" });
    expect(r.primary.map((p) => p.id)).toContain("pcovit");
    expect(r.primary.map((p) => p.id)).toContain("ovaall");
  });
  it("male gets Motila1", () => {
    const r = recommendVitamins({ stage: "male", hasPcos: false, artPlan: "none" });
    expect(r.primary.map((p) => p.id)).toContain("motila1");
  });
  it("note never claims cure", () => {
    const r = recommendVitamins({ stage: "prep", hasPcos: true, artPlan: "none" });
    expect(r.note).not.toMatch(/หายขาด|รักษาให้หาย|การันตี|ท้องแน่นอน/);
  });
});

describe("tagging (M8)", () => {
  it("auto tags from profile", () => {
    const t = autoTags({ stage: "infertility", hasPcos: true, artPlan: "icsi", interests: ["ovaall"], toolResultsCount: 4 });
    expect(t).toEqual(expect.arrayContaining(["#PCOS", "#มีบุตรยาก", "#ICSI", "#สนใจ-OvaAll", "#engaged"]));
  });
});

describe("ticket", () => {
  it("format MJ-XXXXXX without confusing chars", () => {
    for (let i = 0; i < 50; i++) expect(genTicketCode()).toMatch(/^MJ-[2-9A-HJ-NP-Z]{6}$/);
  });
});
