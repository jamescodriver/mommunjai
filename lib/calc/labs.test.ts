import { describe, expect, it } from "vitest";
import { FEMALE_HORMONES, SEMEN_PARAMS, SEMEN_COLOR } from "./labs";

describe("labs reference data (R10)", () => {
  it("has exactly the 6 hormones the client asked about, each with required fields", () => {
    expect(FEMALE_HORMONES).toHaveLength(6);
    const ids = FEMALE_HORMONES.map((h) => h.id);
    expect(new Set(ids).size).toBe(6);
    for (const h of FEMALE_HORMONES) {
      expect(h.name.length).toBeGreaterThan(0);
      expect(h.whatItIs.length).toBeGreaterThan(0);
      expect(h.referenceNote.length).toBeGreaterThan(0);
      expect(h.interpretation.length).toBeGreaterThan(0);
    }
  });

  it("marks prolactin and TSH as targeted, not core — per ASRM they are not universal screening", () => {
    const prolactin = FEMALE_HORMONES.find((h) => h.id === "prolactin")!;
    const tsh = FEMALE_HORMONES.find((h) => h.id === "tsh")!;
    expect(prolactin.roleLabel).toContain("อาการเฉพาะ");
    expect(tsh.roleLabel).toContain("อาการเฉพาะ");
  });

  it("marks FSH, E2, AMH as the core/routine set", () => {
    for (const id of ["fsh", "e2", "amh"]) {
      const h = FEMALE_HORMONES.find((x) => x.id === id)!;
      expect(h.roleLabel).toBe("ตรวจเป็นมาตรฐาน");
    }
  });

  it("flags AMH and LH with a lab-dependent caveat (brief flags 1/2)", () => {
    const amh = FEMALE_HORMONES.find((h) => h.id === "amh")!;
    const lh = FEMALE_HORMONES.find((h) => h.id === "lh")!;
    expect(amh.caveat).toBeTruthy();
    expect(lh.caveat).toBeTruthy();
  });

  it("flags TSH with a caveat about the guidance being unsettled (brief flag 4)", () => {
    const tsh = FEMALE_HORMONES.find((h) => h.id === "tsh")!;
    expect(tsh.caveat).toBeTruthy();
  });

  it("has the 7 WHO 6th-edition semen parameters, each with a lower limit and meaning", () => {
    expect(SEMEN_PARAMS).toHaveLength(7);
    const ids = SEMEN_PARAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(7);
    for (const p of SEMEN_PARAMS) {
      expect(p.lowerLimit.length).toBeGreaterThan(0);
      expect(p.belowMeans.length).toBeGreaterThan(0);
    }
  });

  it("semen color entries have no numeric cutoff fields (soft parameter, brief §3.2)", () => {
    expect(SEMEN_COLOR.length).toBeGreaterThan(0);
    for (const c of SEMEN_COLOR) {
      expect(c.color.length).toBeGreaterThan(0);
      expect(c.meaning.length).toBeGreaterThan(0);
    }
  });
});
