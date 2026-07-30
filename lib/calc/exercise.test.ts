import { describe, it, expect } from "vitest";
import { recommendExercise, ABSOLUTE_CONTRAINDICATIONS, RELATIVE_CONTRAINDICATIONS } from "./exercise";

describe("exercise (PDF-15)", () => {
  it("gives WHO baseline for prep, active baseline keeps current level", () => {
    const r = recommendExercise({ stage: "prep", baseline: "active" });
    expect(r.cautionLevel).toBe("none");
    expect(r.weeklyTarget).toMatch(/150–300/);
    expect(r.intensity).toMatch(/ทำต่อในระดับที่เคยทำได้เลย/);
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it("gives gradual-progression intensity for a sedentary baseline", () => {
    const r = recommendExercise({ stage: "prep", baseline: "sedentary" });
    expect(r.intensity).toMatch(/15 นาที\/วัน/);
  });

  // Red-team catch: the TTC/ovulation research tip is shown for BOTH prep and
  // infertility, so its citation + "this is research not a guideline" framing
  // must not be gated to infertility only.
  it("prep stage also gets the TTC evidence note + citations (not infertility-only)", () => {
    const r = recommendExercise({ stage: "prep", baseline: "active" });
    expect(r.evidenceNote).toBeTruthy();
    expect(r.sources.some((s) => s.includes("Rich-Edwards"))).toBe(true);
    expect(r.sources.some((s) => s.includes("Hakimi"))).toBe(true);
  });

  it("infertility stage surfaces the RED-S/fueling evidence note and frames it as research, not a guideline", () => {
    const r = recommendExercise({ stage: "infertility", baseline: "active" });
    expect(r.evidenceNote).toBeTruthy();
    expect(r.evidenceNote).toMatch(/งานวิจัย/);
    expect(r.tips.some((t) => t.includes("ประจำเดือนมาไม่สม่ำเสมอ"))).toBe(true);
  });

  it("male stage recommends WHO baseline + research-flagged sauna/endurance caution", () => {
    const r = recommendExercise({ stage: "male", baseline: "active" });
    expect(r.cautionLevel).toBe("none");
    expect(r.tips.some((t) => t.includes("ซาวน่า"))).toBe(true);
    expect(r.evidenceNote).toMatch(/งานวิจัย/);
  });

  it("male stage's positive sperm-quality claim has a matching citation (red-team catch)", () => {
    const r = recommendExercise({ stage: "male", baseline: "active" });
    expect(r.sources.some((s) => s.includes("Jóźków") || s.includes("Rossato"))).toBe(true);
  });

  it("lactating stage has no hard weekly-minute target and covers breastfeeding-before-exercise tip", () => {
    const r = recommendExercise({ stage: "lactating", baseline: "sedentary" });
    expect(r.cautionLevel).toBe("none");
    expect(r.tips.some((t) => t.includes("ให้นม/ปั๊มนมก่อนออกกำลังกาย"))).toBe(true);
  });

  describe("pregnant — SOGC/CSEP contraindication gating", () => {
    it("no contraindications selected -> full recommendation with warning signs", () => {
      const r = recommendExercise({ stage: "pregnant", baseline: "active", contraindications: [] });
      expect(r.cautionLevel).toBe("none");
      expect(r.warningSigns && r.warningSigns.length).toBeGreaterThanOrEqual(10);
      expect(r.avoid?.some((a) => a.includes("นอนหงาย"))).toBe(true);
    });

    it("any absolute contraindication -> hard stop, no exercise type suggested", () => {
      const r = recommendExercise({
        stage: "pregnant",
        baseline: "active",
        contraindications: ["preeclampsia"],
      });
      expect(r.cautionLevel).toBe("stop");
      expect(r.type.length).toBe(0);
      expect(r.cautionNote).toMatch(/ปรึกษาแพทย์/);
    });

    it("a relative-only contraindication -> consult, but still gets a plan", () => {
      const r = recommendExercise({
        stage: "pregnant",
        baseline: "active",
        contraindications: ["anemia"],
      });
      expect(r.cautionLevel).toBe("consult");
      expect(r.type.length).toBeGreaterThan(0);
    });

    // Red-team catch: the "consult" case's intensity text used to carry a
    // parenthetical claiming "no need to scale back (if none of the above
    // conditions apply)" even though the user just said one DOES apply —
    // self-contradicting the caution banner shown right above it.
    it("consult case's intensity note does not contradict its own caution banner", () => {
      const r = recommendExercise({ stage: "pregnant", baseline: "active", contraindications: ["anemia"] });
      expect(r.intensity).not.toMatch(/ถ้าไม่มีภาวะที่ต้องระวัง/);
    });

    it("absolute takes precedence over relative when both are selected", () => {
      const r = recommendExercise({
        stage: "pregnant",
        baseline: "active",
        contraindications: ["anemia", "preeclampsia"],
      });
      expect(r.cautionLevel).toBe("stop");
    });

    it("every absolute and relative id is a real, distinct value (no accidental overlap)", () => {
      const abs = new Set(ABSOLUTE_CONTRAINDICATIONS.map((c) => c.v));
      const rel = new Set(RELATIVE_CONTRAINDICATIONS.map((c) => c.v));
      const overlap = [...abs].filter((v) => rel.has(v as any));
      expect(overlap.length).toBe(0);
    });
  });
});
