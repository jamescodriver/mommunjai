import { describe, expect, it } from "vitest";
import { stepsFor, sanitizeForStage } from "./plan-steps";
import { reportTier } from "./report";

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

  it("TC-05-02 — เหลือเฉพาะ 'มีบุตรยาก' ที่ยังเจอคำถามนี้", () => {
    expect(steps("infertility")).toContain("art");
  });

  // R4 (0408) · PDF-06 — "ฝ่ายชาย" ตัดคำถาม ART ออกด้วย (client ยืนยัน "ต้องไม่มีส่วนนี้")
  it("PDF-06 (0408) — 'ฝ่ายชาย' ไม่เจอคำถามกระบวนการทางการแพทย์อีกแล้ว", () => {
    expect(steps("male")).not.toContain("art");
  });

  // R4 (0408) · PDF-13 — "ตั้งครรภ์แล้ว" ตัดคำถาม ART ที่ซ้ำกับ "conception" ออกด้วย
  it("PDF-13 (0408) — 'ตั้งครรภ์แล้ว' ไม่เจอคำถามกระบวนการทางการแพทย์อีกแล้ว (ซ้ำกับ conception)", () => {
    expect(steps("pregnant")).not.toContain("art");
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

/**
 * บั๊กที่ต้นเจอเอง 1/8/2026: "หน้าที่ให้ลูกค้าเลย กับ หน้าที่กดหลังใส่เลข ticket ไม่ต่างกันเลย"
 * ต้นตอ = /plan prefill art_plan จากโปรไฟล์เดิมใน localStorage แต่ stage ให้นม/เตรียมตั้งครรภ์
 * ไม่มีขั้น art ให้เห็นหรือแก้ ค่าเก่าจึงติดไปกับการส่ง → tier กระโดดเป็น "full" → /plan
 * แสดง ReportView เต็มทันที ซึ่งเป็นคอมโพเนนต์เดียวกับหน้า /r/[code] เป๊ะ
 */
describe("sanitizeForStage — ไม่ได้ถาม = ไม่มีคำตอบ", () => {
  const stale = {
    nickname: "ก้อย", stage: "lactating",
    art_plan: "IVF-ICSI",                       // ค้างจากรอบ "มีบุตรยาก" ก่อนหน้า
    infertility_issues: ["pcos", "thin_lining"],
    partner_profile: { behaviors: ["smoke"] },
    gestational_weeks: 20, has_gdm: true,
  };

  it("🔒 ให้นมบุตร: art_plan ที่ค้างมาต้องถูกล้างเป็น 'ยัง' (ไม่งั้น tier กระโดดเป็น full)", () => {
    const out = sanitizeForStage(stale, stepsFor("lactating", true, []));
    expect(out.art_plan).toBe("ยัง");
    expect(reportTier({ artPlan: out.art_plan as any })).toBe("teaser");
    // ของเดิมพัง: ถ้าไม่ล้าง จะได้ full
    expect(reportTier({ artPlan: stale.art_plan as any })).toBe("full");
  });

  it("🔒 เตรียมตั้งครรภ์ก็โดนเหมือนกัน (ไม่มีขั้น art เช่นกัน)", () => {
    const out = sanitizeForStage(stale, stepsFor("prep", true, []));
    expect(out.art_plan).toBe("ยัง");
  });

  it("ล้างคำตอบของขั้นอื่นที่ไม่ได้ถามด้วย — issues / partner / conception", () => {
    const out: any = sanitizeForStage(stale, stepsFor("lactating", true, []));
    expect(out.infertility_issues).toEqual([]);      // ขั้น issues เฉพาะ infertility
    expect(out.partner_profile).toEqual({ behaviors: [] });
    expect(out.gestational_weeks).toBeUndefined();   // ขั้น conception เฉพาะ pregnant
    expect(out.has_gdm).toBeUndefined();
  });

  it("stage ที่ถูกถามจริง ต้องไม่ถูกล้าง", () => {
    const inf = sanitizeForStage(stale, stepsFor("infertility", true, ["pcos", "thin_lining"]));
    expect(inf.art_plan).toBe("IVF-ICSI");
    expect(inf.infertility_issues).toEqual(["pcos", "thin_lining"]);
    const preg: any = sanitizeForStage(stale, stepsFor("pregnant", true, []));
    expect(preg.gestational_weeks).toBe(20);
    expect(preg.has_gdm).toBe(true);
    // R4 (0408) · PDF-13 — pregnant ไม่เจอขั้น art อีกแล้ว ค่าที่ค้างมาต้องถูกล้างเป็น "ยัง"
    // (เหมือน prep/lactating/male) ไม่ใช่คงค่าเดิมไว้อีกต่อไป
    expect(preg.art_plan).toBe("ยัง");
  });

  it("PDF-13 (0408) — ตั้งครรภ์แล้ว: art_plan ที่ค้างมาต้องถูกล้าง (ไม่งั้น tier กระโดดเป็น full)", () => {
    const out = sanitizeForStage(stale, stepsFor("pregnant", true, []));
    expect(out.art_plan).toBe("ยัง");
    expect(reportTier({ artPlan: out.art_plan as any })).toBe("teaser");
  });

  it("ไม่แตะฟิลด์อื่นที่ไม่เกี่ยวกับขั้นตอน", () => {
    const out = sanitizeForStage(stale, stepsFor("lactating", true, []));
    expect(out.nickname).toBe("ก้อย");
    expect(out.stage).toBe("lactating");
  });
});
