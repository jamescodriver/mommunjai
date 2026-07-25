import { describe, it, expect } from "vitest";
import { generateReport } from "./report";
import { hashPin, verifyPin, signSession, verifySession, hasPerm } from "./auth";
import { extractTicketCode } from "./line";

describe("report engine", () => {
  const base = { nickname: "หมิว", stage: "infertility" as const, hasPcos: true, artPlan: "icsi" as const,
    tools: { nutrients: { output: { pillars: { egg: 80, uterus: 60, hormone: 70 }, overall: 75, eatenCount: 6, totalEat: 8 } },
             sleep: { output: { beforeTen: false, goodDuration: true, status: "ควรปรับ" } },
             ovulation: { output: { ovulationDate: "2026-08-01", fertileStart: "2026-07-27", fertileEnd: "2026-08-02", nextPeriod: "2026-08-15" } } } };

  it("leads with strengths, never a raw failure", () => {
    const r = generateReport(base);
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.title).toContain("90 วัน");
  });
  it("has a quick win today", () => { expect(generateReport(base).quickWinToday).toBeTruthy(); });
  it("PCOS + ICSI → safety caution about not changing treatment", () => {
    const r = generateReport(base);
    expect(r.cautions.join(" ")).toMatch(/อย่าหยุดหรือปรับยา|ปรึกษาแพทย์/);
  });
  it("never claims cure/guarantee", () => {
    const all = JSON.stringify(generateReport(base));
    expect(all).not.toMatch(/รักษาให้หาย|หายขาด|การันตี|ท้องแน่นอน/);
  });
  it("non-male gets partner nudge; male does not", () => {
    expect(generateReport(base).partnerNudge).toBeTruthy();
    expect(generateReport({ ...base, stage: "male" as any }).partnerNudge).toBeNull();
  });
  it("90-day plan has 3 phases", () => { expect(generateReport(base).plan90).toHaveLength(3); });
  it("carries fertile window + vitamins", () => {
    const r = generateReport(base);
    expect(r.fertileWindow?.start).toBe("2026-07-27");
    expect(r.vitamins.length).toBeGreaterThan(0);
  });
});

describe("report safety (Lucifer red-team fixes)", () => {
  it("H1: never recommends castor oil (uterus-stimulant, unsafe in pregnancy/ART)", () => {
    const j = JSON.stringify(generateReport({ nickname: "A", stage: "prep", artPlan: "ivf" }));
    expect(j.toLowerCase()).not.toContain("castor");
    expect(j).not.toContain("กระตุ้นมดลูก) "); // only appears inside the safe warning
  });
  it("H3: ART patient — month-1 gates supplements behind consulting the doctor", () => {
    const r = generateReport({ nickname: "A", stage: "infertility", artPlan: "icsi" });
    expect(r.plan90[0].items[0]).toMatch(/ปรึกษาแพทย์.*ก่อนเริ่มวิตามิน/);
  });
  it("H2: referral timing adapts to age (40+ = see doctor now)", () => {
    const r40 = generateReport({ nickname: "A", stage: "prep", ageRange: "40+" });
    expect(JSON.stringify(r40)).toMatch(/ไม่ต้องรอ|พบแพทย์ผู้เชี่ยวชาญ/);
    const r30 = generateReport({ nickname: "A", stage: "prep", ageRange: "30–34" });
    expect(JSON.stringify(r30)).toMatch(/12 เดือน/);
  });
  it("M1: no implicit pregnancy-success guarantee wording", () => {
    const j = JSON.stringify(generateReport({ nickname: "A", stage: "prep" }));
    expect(j).not.toMatch(/เพิ่มโอกาสสำเร็จ|โอกาสสำเร็จ/);
  });
  it("M3: nickname fallback is neutral (not 'คุณแม่')", () => {
    expect(generateReport({ stage: "prep" }).nickname).toBe("คุณ");
  });
});

describe("auth", () => {
  it("hash/verify PIN roundtrip", () => {
    const h = hashPin("1234");
    expect(verifyPin("1234", h)).toBe(true);
    expect(verifyPin("9999", h)).toBe(false);
  });
  it("session sign/verify roundtrip", () => {
    const s = { sid: "u1", name: "A", role: "staff" as const, perms: ["view_leads" as const], exp: Math.floor(Date.now() / 1000) + 100 };
    const tok = signSession(s);
    expect(verifySession(tok)?.sid).toBe("u1");
  });
  it("rejects expired + tampered sessions", () => {
    const expired = signSession({ sid: "u", name: "A", role: "staff", perms: [], exp: 1 });
    expect(verifySession(expired)).toBeNull();
    expect(verifySession("garbage.sig")).toBeNull();
  });
  it("admin has all perms; staff only granted", () => {
    expect(hasPerm({ sid: "a", name: "A", role: "admin", perms: [], exp: 9e9 }, "manage_users")).toBe(true);
    expect(hasPerm({ sid: "s", name: "S", role: "staff", perms: ["view_leads"], exp: 9e9 }, "manage_users")).toBe(false);
    expect(hasPerm({ sid: "s", name: "S", role: "staff", perms: ["view_leads"], exp: 9e9 }, "view_leads")).toBe(true);
    expect(hasPerm(null, "view_leads")).toBe(false);
  });
});

describe("line ticket extraction", () => {
  it("finds MJ code in free text", () => {
    expect(extractTicketCode("สวัสดีค่ะ รหัสของฉันคือ mj-4x7k2p นะคะ")).toBe("MJ-4X7K2P");
    expect(extractTicketCode("ไม่มีรหัส")).toBeNull();
  });
});
