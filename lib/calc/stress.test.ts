import { describe, expect, it } from "vitest";
import {
  scoreSt5, ST5_QUESTIONS, ST5_OPTIONS, ST5_CREDIT, STRESS_DISCLAIMER, STRESS_PRODUCT_IDS,
} from "./stress";
import { PRODUCTS } from "./vitamins";

describe("ST-5 — โครงแบบวัดตรงต้นฉบับกรมสุขภาพจิต [R14 · TC-14-02]", () => {
  it("มี 5 ข้อ และตัวเลือก 0–3 ครบ 4 ตัวเลือก", () => {
    expect(ST5_QUESTIONS).toHaveLength(5);
    expect(ST5_OPTIONS.map((o) => o.value)).toEqual([0, 1, 2, 3]);
  });
  it("ให้เครดิตเจ้าของแบบวัด — เงื่อนไขการใช้ Open Data ของกรมสุขภาพจิต", () => {
    expect(ST5_CREDIT).toContain("กรมสุขภาพจิต");
  });
  it("มี disclaimer ว่าเป็นการคัดกรอง ไม่ใช่การวินิจฉัย", () => {
    expect(STRESS_DISCLAIMER).toMatch(/ไม่ใช่การวินิจฉัย/);
  });
});

describe("ST-5 — เกณฑ์คะแนน 4 ระดับ", () => {
  const all = (n: number) => Array(5).fill(n);
  it("คะแนนต่ำสุด 0 → เครียดน้อย", () => {
    const r = scoreSt5(all(0))!;
    expect(r.score).toBe(0);
    expect(r.band).toBe("low");
  });
  it("คะแนนสูงสุด 15 → เครียดมากที่สุด", () => {
    const r = scoreSt5(all(3))!;
    expect(r.score).toBe(15);
    expect(r.band).toBe("severe");
  });
  it.each([
    [4, "low"], [5, "moderate"], [7, "moderate"], [8, "high"], [9, "high"], [10, "severe"],
  ])("คะแนน %i → %s (เช็คขอบเขตทุกช่วง)", (score, band) => {
    // กระจายคะแนนลง 5 ข้อให้รวมได้ตามที่ต้องการ
    const answers = [0, 0, 0, 0, 0];
    let left = score;
    for (let i = 0; i < 5 && left > 0; i++) {
      answers[i] = Math.min(3, left);
      left -= answers[i];
    }
    expect(scoreSt5(answers)!.band).toBe(band);
  });
});

describe("🔒 ST-5 — กติกาความปลอดภัย (มติต้น 31/7 + legal-compliance §4)", () => {
  const withScore = (score: number) => {
    const answers = [0, 0, 0, 0, 0];
    let left = score;
    for (let i = 0; i < 5 && left > 0; i++) { answers[i] = Math.min(3, left); left -= answers[i]; }
    return scoreSt5(answers)!;
  };

  it("คะแนน 0–7 → ไม่ต้องขึ้นสายด่วน และแสดงสินค้าได้ตามปกติ", () => {
    for (const s of [0, 4, 5, 7]) {
      const r = withScore(s);
      expect(r.showHelpline, `score ${s}`).toBe(false);
      expect(r.productsAsAid, `score ${s}`).toBe(false);
    }
  });

  it("คะแนน 8–15 → ต้องขึ้นสายด่วน และกรอบสินค้าต้องเป็น 'ตัวช่วย'", () => {
    for (const s of [8, 9, 10, 15]) {
      const r = withScore(s);
      expect(r.showHelpline, `score ${s}`).toBe(true);
      expect(r.productsAsAid, `score ${s}`).toBe(true);
    }
  });

  it("คำแนะนำระดับสูงสุดต้องชวนไปหาผู้เชี่ยวชาญ ไม่ใช่ชวนซื้อของ", () => {
    const r = withScore(15);
    expect(r.advice).toMatch(/ผู้เชี่ยวชาญ/);
    // ห้ามมีคำเชิงขายในคำแนะนำของระดับที่เปราะบางที่สุด
    expect(r.advice).not.toMatch(/สั่งซื้อ|ลดราคา|โปรโมชั่น|สินค้า/);
  });

  it("ไม่มีข้อความไหนเคลมว่าสินค้ารักษาความเครียดได้", () => {
    for (const s of [0, 5, 8, 15]) {
      expect(withScore(s).advice).not.toMatch(/รักษาความเครียด|หายเครียด|แก้เครียดได้/);
    }
  });

  it("ทุกข้อความเป็น plain text — ห้ามมี markdown ติดไปโผล่บนหน้าจอ", () => {
    // เคยหลุดมาแล้ว 2 ครั้งในโปรเจกต์นี้ (คำเตือนชุดเตรียมผนัง + ข้อความ DHA)
    for (const s of [0, 5, 8, 15]) {
      const r = withScore(s);
      expect(`${r.advice}${r.bandLabel}`).not.toMatch(/\*\*|\[.+\]\(.+\)/);
    }
  });
});

describe("ST-5 — input ที่ใช้ไม่ได้ต้องคืน null ไม่ throw", () => {
  it.each([
    ["ตอบไม่ครบ", [0, 1, 2]],
    ["ยังไม่ได้ตอบบางข้อ", [0, 1, null, 2, 3]],
    ["ค่านอกช่วง", [0, 1, 2, 3, 9]],
    ["ค่าติดลบ", [-1, 0, 0, 0, 0]],
    ["ไม่ใช่จำนวนเต็ม", [0.5, 0, 0, 0, 0]],
  ])("%s → null", (_label, input) => {
    expect(scoreSt5(input as (number | null)[])).toBeNull();
  });
});

describe("ST-5 — สินค้าที่แนะนำ [TC-14-03]", () => {
  it("แนะนำ Night Shot + A.O.S และทั้งคู่มีอยู่จริงใน PRODUCTS", () => {
    expect(STRESS_PRODUCT_IDS).toEqual(["nightshot", "aos"]);
    for (const id of STRESS_PRODUCT_IDS) expect(PRODUCTS[id], id).toBeTruthy();
  });
});
