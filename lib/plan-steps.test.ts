import { describe, expect, it } from "vitest";
import { stepsFor } from "./plan-steps";

/**
 * เทสต์ชุดนี้เกิดจาก QA รอบ 31/7 (TC-11-01) — บั๊ก "ให้นมบุตรยังเจอคำถาม ART"
 * รอดเทสต์ 295 ตัวมาได้ เพราะ stepsFor() ไม่มีเทสต์คลุมเลยสักตัว
 */
describe("stepsFor — ขั้นตอนที่แต่ละ stage ต้องเจอ/ไม่เจอ", () => {
  const steps = (stage: string, issues: string[] = []) => stepsFor(stage, false, issues);

  it("🔒 TC-05-01 — 'เตรียมตั้งครรภ์' ไม่เจอคำถามกระบวนการทางการแพทย์", () => {
    expect(steps("prep")).not.toContain("art");
  });

  it("🔒 TC-11-01 — 'ให้นมบุตร' ก็ต้องไม่เจอเช่นกัน", () => {
    // ถ้าเจอ: แม่ให้นมที่เลือก IVF-ICSI จะได้ tier "full" + A.O.S ("ดูแลคุณภาพไข่และตัวอ่อน")
    // และถ้าเลือก "เตรียมผนังมดลูก" จะได้ดอกคำฝอย/น้ำมันละหุ่งเข้าแผนหลังคลอด
    expect(steps("lactating")).not.toContain("art");
  });

  it("TC-05-02 — stage ที่เหลือยังเจอคำถามนี้เหมือนเดิม", () => {
    for (const s of ["infertility", "pregnant", "male"]) {
      expect(steps(s), s).toContain("art");
    }
  });

  it("'issues' โผล่เฉพาะ infertility", () => {
    expect(steps("infertility")).toContain("issues");
    for (const s of ["prep", "pregnant", "lactating", "male"]) {
      expect(steps(s), s).not.toContain("issues");
    }
  });

  it("🔒 TC-07-02 — ฟอร์มฝ่ายชายโผล่เฉพาะตอนติ๊ก male_factor เท่านั้น", () => {
    expect(steps("infertility", ["male_factor"])).toContain("partner");
    expect(steps("infertility", ["pcos"])).not.toContain("partner");
    expect(steps("infertility")).not.toContain("partner");
    // stage อื่นไม่มีเช็กลิสต์ปัญหา จึงไม่มีทางเจอขั้นนี้
    expect(steps("male", ["male_factor"])).not.toContain("partner");
  });

  it("TC-09-01 — คำถามวิธีตั้งครรภ์โผล่เฉพาะ pregnant", () => {
    expect(steps("pregnant")).toContain("conception");
    for (const s of ["prep", "infertility", "lactating", "male"]) {
      expect(steps(s), s).not.toContain("conception");
    }
  });

  it("มาจากการ์ดหน้าแรก (?stage=) → ข้ามหน้าเลือก stage แต่ยังต้องเจอ intro/consent ก่อนเสมอ", () => {
    const withPicker = stepsFor("prep", false);
    const skipped = stepsFor("prep", true);
    expect(withPicker).toContain("stage");
    expect(skipped).not.toContain("stage");
    // 🔒 regression ของบั๊กเดิม: ทางเข้าหลักเคยข้าม consent ไปเลย
    expect(skipped[0]).toBe("intro");
  });

  it("ทุก stage เริ่มที่ intro และจบที่ contact เสมอ", () => {
    for (const s of ["prep", "infertility", "pregnant", "lactating", "male"]) {
      const st = steps(s);
      expect(st[0], s).toBe("intro");
      expect(st[st.length - 1], s).toBe("contact");
    }
  });
});
