import { describe, it, expect } from "vitest";
import { fmtRange, fertyTopUpText, FERTY_TOPUP, calcProtein } from "./calc/protein";
import { generateReport, buildTeaser, teaserProducts, planMetrics } from "./report";

/**
 * RTM 13 ส.ค. 69 (Update App.pdf) — ต้นเคาะคำตอบ 19 ส.ค. 69
 * ชุดนี้คุมพฤติกรรมที่ "ดูเผิน ๆ เหมือนถูก" แต่ผิดในสายตาลูกค้า
 */

describe("U-04 — ช่วงตัวเลขที่ต่ำสุด = สูงสุด ต้องไม่ขึ้นเป็น X–X", () => {
  it("ค่าเท่ากัน → เลขเดียว", () => {
    expect(fmtRange(91, 91)).toBe("91");
    expect(fmtRange(1.3, 1.3)).toBe("1.3");
  });

  it("ค่าต่างกัน → ยังเป็นช่วงเหมือนเดิม (ใช้ขีดยาว en dash)", () => {
    expect(fmtRange(72, 90)).toBe("72–90");
  });

  it("เคสจริงที่ต้นเจอ: ให้นมบุตร 70 กก. เดิมขึ้น 91–91", () => {
    const r = calcProtein({ weightKg: 70, stage: "lactating" });
    if ("error" in r) throw new Error(r.error);
    expect(r.minGrams).toBe(r.maxGrams); // ช่วงอ้างอิงคือ 1.3–1.3 จริง ๆ (ไม่ได้แก้สูตร)
    expect(fmtRange(r.minGrams, r.maxGrams)).toBe("91");
    expect(fmtRange(r.perKg[0], r.perKg[1])).toBe("1.3");
  });
});

describe("U-04 — ทุกจุดที่แสดงเป้าโปรตีนต้องกันเลขซ้ำ (ไม่ใช่แค่หน้าเดียว)", () => {
  // เจอตอนเทสต์บนหน้าจริง 19 ส.ค. 69: แก้หน้าเครื่องมือกับรายงานฉบับเต็มแล้ว
  // แต่กล่อง "เป้าหมายของคุณต่อวัน" บนหน้าก่อนเข้า LINE ยังขึ้น "91–91 ก./วัน" อยู่
  // เพราะเป็นคนละฟังก์ชัน (planMetrics) — เทสต์นี้กันไม่ให้หลุดอีก
  it("planMetrics: ให้นมบุตร 70 กก. → 'โปรตีน 91 ก./วัน' ไม่ใช่ '91–91'", () => {
    const r = generateReport({ nickname: "หมิว", stage: "lactating", weightKg: 70, heightCm: 160, tools: {} });
    const row = planMetrics(r).find((m) => m.key === "protein");
    expect(row?.value).toBe("91 ก./วัน");
  });

  it("planMetrics: เคสที่เป็นช่วงจริง ยังขึ้นเป็นช่วงเหมือนเดิม", () => {
    const r = generateReport({ nickname: "หมิว", stage: "prep", weightKg: 60, heightCm: 160, tools: {} });
    const row = planMetrics(r).find((m) => m.key === "protein");
    expect(row?.value).toMatch(/^\d+–\d+ ก\.\/วัน$/);
  });

  it("teaser ที่ส่งออกไปหน้าจอ ก็ต้องไม่มี 'X–X'", () => {
    const r = generateReport({ nickname: "หมิว", stage: "lactating", weightKg: 70, heightCm: 160, tools: {} });
    for (const m of buildTeaser(r).metrics) expect(m.value).not.toMatch(/(\d+)–\1\b/);
  });
});

describe("U-05 — จำนวนซองที่ 'เติม' เป็นค่าคงที่ของแบรนด์ 1–2 ซอง", () => {
  it("ค่าคงที่คือ 1–2", () => {
    expect(FERTY_TOPUP).toEqual({ min: 1, max: 2 });
  });

  it("ประโยคแนะนำพูดว่า 1–2 ซอง/วัน", () => {
    expect(fertyTopUpText()).toContain("1–2 ซอง/วัน");
    expect(fertyTopUpText()).toContain("โปรตีนเฟอร์ตี้");
  });

  it("ฝ่ายชายใช้ชื่อ Ferta แต่จำนวนซองเท่ากัน", () => {
    expect(fertyTopUpText(true)).toContain("Ferta");
    expect(fertyTopUpText(true)).toContain("1–2 ซอง/วัน");
  });

  it("🔴 ห้ามผูกกับน้ำหนักตัวอีก — คนหนัก 100 กก. ก็ยังได้ 1–2 ซอง", () => {
    // ของเดิมหยิบเลขจาก fertyServings (= กินซองแทนทั้งวัน) ซึ่งคนหนัก 100 กก. จะได้ ~6 ซอง
    const heavy = calcProtein({ weightKg: 100, stage: "prep" });
    if ("error" in heavy) throw new Error(heavy.error);
    expect(heavy.fertyServings.max).toBeGreaterThan(2); // ตัวเลขเทียบเท่ายังคงไว้เหมือนเดิม
    expect(fertyTopUpText()).toContain("1–2 ซอง/วัน"); // แต่ประโยคแนะนำนิ่งเสมอ
  });
});

describe("U-07 — หน้าก่อนเข้า LINE ต้องเรียงของตามอาการขึ้นก่อน", () => {
  const base = { nickname: "หมิว", stage: "prep" as const, weightKg: 55, heightCm: 160, tools: {} };

  it("มี PCOS → PCO-VIT ต้องโผล่บนหน้าเทสเซอร์ (เดิมถูกดันตกจอ)", () => {
    const r = generateReport({ ...base, hasPcos: true, pcosStatus: "yes" });
    const ids = teaserProducts(r).map((x) => x.id);
    expect(ids).toContain("pcovit");
  });

  it("ยังเติมชุดพื้นฐานจนครบ 4 ตัว ไม่ตัดตัวหลักทิ้ง (ตามมติ PDF-01 รอบ 4 ส.ค.)", () => {
    const r = generateReport({ ...base, hasPcos: true, pcosStatus: "yes" });
    const picked = teaserProducts(r);
    expect(picked).toHaveLength(4);
    const ids = picked.map((x) => x.id);
    expect(ids.some((id) => ["ovaall", "ferty", "kaffirshot", "ferti9oil"].includes(id))).toBe(true);
  });

  it("ไม่มีอาการอะไรเลย → ได้ชุดพื้นฐานเหมือนเดิม (ไม่ทำให้เคสปกติเปลี่ยน)", () => {
    const r = generateReport(base);
    const ids = teaserProducts(r).map((x) => x.id);
    expect(ids).toHaveLength(4);
    expect(ids).toContain("ferty");
  });

  it("ห้ามมีสินค้าซ้ำในรายการ", () => {
    const r = generateReport({ ...base, hasPcos: true, pcosStatus: "yes", artPlan: "IVF-ICSI" });
    const ids = teaserProducts(r).map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("buildTeaser ใช้ลำดับเดียวกัน (หน้าจอกับ API ต้องไม่พูดคนละเรื่อง)", () => {
    const r = generateReport({ ...base, hasPcos: true, pcosStatus: "yes" });
    expect(buildTeaser(r).recommendedProducts.map((x) => x.id)).toEqual(teaserProducts(r).map((x) => x.id));
  });

  it("🔒 สินค้าที่โชว์ต้องมาจากรายการที่ผ่านกฎความปลอดภัยแล้วเท่านั้น ห้ามงอกใหม่", () => {
    const r = generateReport({ ...base, hasPcos: true, pcosStatus: "yes", artPlan: "IVF-ICSI" });
    const allowed = new Set([...(r.vitaminsTargeted || []), ...r.vitamins].map((x) => x.id));
    for (const x of teaserProducts(r)) expect(allowed.has(x.id)).toBe(true);
  });
});
