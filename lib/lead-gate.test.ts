import { describe, expect, it } from "vitest";
import { POST } from "../app/api/lead/route";
import { POST as MEASURE } from "../app/api/lead/measure/route";
import { ART_PLAN_VALUES, INFERTILITY_ISSUE_VALUES } from "./calc/vitamins";

/**
 * 🔒 กติกาหลักของเฟส 1: **แผนฉบับเต็มต้องได้จาก LINE OA เท่านั้น**
 *
 * ต้นเจอเอง 1 ส.ค. 2026: "infertility ให้ดู plan ฉบับเต็ม ตั้งแต่ยังไม่ได้ส่ง ticket
 * ให้ใน line oa เลย" — ตรวจแล้วเป็นของที่ R6 ตั้งใจทำไว้ (tier "full" ได้รายงานเต็ม
 * ทันที) ไม่ใช่บั๊ก แต่ขัดกับกลไกเก็บ lead จึงกลับมติ
 *
 * เทสต์ชุดนี้ยิงเข้า route จริง ไม่ได้เช็คแค่ตรรกะย่อย เพราะจุดที่ต้องกันคือ
 * **สิ่งที่เดินทางออกไปถึงเบราว์เซอร์** ไม่ใช่สิ่งที่หน้าจอเลือกจะวาด
 * (ถ้ากันแค่ฝั่ง UI ตัวรายงานเต็มยังอยู่ใน response ให้เปิดแท็บ Network อ่านได้)
 */

// route จำกัด 5 ครั้ง/นาที/IP — เทสต์ยิงหลายสิบครั้ง จึงต้องแยก IP รายคำขอ
// (เหมือนผู้ใช้จริงคนละคน) ไม่งั้นจะได้ 429 แล้วเข้าใจผิดว่า gate ทำงาน
let ipSeq = 0;
const post = async (body: any) => {
  const req = new Request("http://localhost/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++ipSeq}` },
    body: JSON.stringify(body),
  });
  const res = await POST(req as any);
  return { status: res.status, json: await res.json() };
};

const postMeasure = async (body: any) => {
  const req = new Request("http://localhost/api/lead/measure", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.1.0.${++ipSeq}` },
    body: JSON.stringify(body),
  });
  const res = await MEASURE(req as any);
  return { status: res.status, json: await res.json() };
};

const base = {
  nickname: "ก้อย", weight_kg: 62, height_cm: 158, age_range: "35-39",
  contact_channel: "line", contact_value: "koy_line", consent: true,
};
const STAGES = ["prep", "infertility", "pregnant", "lactating", "male"] as const;

describe("/api/lead — แผนฉบับเต็มต้องไม่หลุดออกไปกับ response", () => {
  it("🔒 ทุก stage × ทุกคำตอบกระบวนการทางการแพทย์ ต้องไม่มี report ติดกลับมา", async () => {
    for (const stage of STAGES) {
      for (const art_plan of ART_PLAN_VALUES) {
        const { status, json } = await post({ ...base, stage, art_plan });
        expect(status, `${stage}/${art_plan}`).toBe(200);
        expect(json.report, `${stage}/${art_plan} — report หลุด!`).toBeUndefined();
        expect(json.teaser, `${stage}/${art_plan}`).toBeTruthy();
        expect(json.ticket_code, `${stage}/${art_plan}`).toMatch(/^MJ-/);
      }
    }
  });

  it("🔒 มีบุตรยาก + ติ๊กปัญหาครบทุกข้อ ก็ยังไม่ได้แผนเต็ม", async () => {
    const { json } = await post({
      ...base, stage: "infertility", art_plan: "IVF-ICSI",
      infertility_issues: INFERTILITY_ISSUE_VALUES.filter((x) => x !== "unsure"),
    });
    expect(json.report).toBeUndefined();
    expect(json.teaser).toBeTruthy();
  });

  it("🔒 ขนาด response ต้องเล็ก — กันรายงานเต็มแอบมาในรูปอื่น", async () => {
    const { json } = await post({ ...base, stage: "infertility", art_plan: "IVF-ICSI" });
    const s = JSON.stringify(json);
    // รายงานเต็มยาว ~10,000+ ตัวอักษร · teaser ปกติไม่ถึง 3,000
    expect(s.length).toBeLessThan(3000);
    // ชิ้นส่วนที่มีเฉพาะในรายงานเต็ม ต้องไม่ปรากฏเลย
    for (const key of ["part1", "part2", "lactationKnowledge", "pregnancyKnowledge", "proteinFoods", "goodFat"]) {
      expect(s, key).not.toContain(`"${key}"`);
    }
  });

  it("tier ยังส่งกลับไปตามเดิม (แอดมิน/analytics ใช้ดูชั้นของ lead)", async () => {
    const a = await post({ ...base, stage: "infertility", art_plan: "IVF-ICSI" });
    const b = await post({ ...base, stage: "lactating", art_plan: "ยัง" });
    expect(a.json.tier).toBe("full");
    expect(b.json.tier).toBe("teaser");
  });

  it("teaser ยังพก cautions + สินค้าแนะนำมาครบเหมือนเดิม (ไม่ได้กันจนว่างเปล่า)", async () => {
    const { json } = await post({ ...base, stage: "infertility", art_plan: "IVF-ICSI" });
    expect(json.teaser.cautions.length).toBeGreaterThan(0);
    expect(json.teaser.recommendedProducts.length).toBeGreaterThan(0);
    // R4 (0408) · PDF-02/07 — quickWinToday ตัดออกจาก TeaserSummary ทั้งระบบแล้ว
  });
});

/**
 * R16 — หน้าสรุปต้องมีตัวเลขจริงของผู้ใช้ ไม่ใช่ "ยังไม่ได้ประเมิน" ลอย ๆ
 * และถ้าไม่ได้กรอกน้ำหนัก ต้องเติมได้จากหน้านั้นเลย
 */
describe("teaser metrics — เป้าหมายต่อวันที่คำนวณจากผู้ใช้เอง", () => {
  it("กรอกน้ำหนักมา → ได้ครบ 4 แถว", async () => {
    const { json } = await post({ ...base, stage: "infertility", art_plan: "ยัง" });
    expect(json.teaser.metrics.map((m: any) => m.key)).toEqual(["protein", "water", "sleep", "exercise"]);
    expect(json.teaser.metrics.every((m: any) => m.value && !/\b0\b/.test(m.value))).toBe(true);
  });

  it("🔒 ไม่กรอกน้ำหนัก → แถวโปรตีน/น้ำ **หายไป** ไม่ใช่แสดง 0", async () => {
    const { json } = await post({
      nickname: "ฝน", stage: "prep", contact_channel: "line", contact_value: "fon", consent: true,
    });
    const keys = json.teaser.metrics.map((m: any) => m.key);
    expect(keys).not.toContain("protein");
    expect(keys).not.toContain("water");
    // แต่ยังต้องมีของที่คำนวณได้จาก stage เพื่อไม่ให้กรอบว่างเปล่า
    expect(keys).toContain("sleep");
    expect(keys).toContain("exercise");
  });

  it("🔒 metrics ต้องไม่พา part1/part2 ติดออกมาด้วย (gate เดิมยังอยู่)", async () => {
    const { json } = await post({ ...base, stage: "infertility", art_plan: "ยัง" });
    const s = JSON.stringify(json.teaser);
    for (const k of ['"part1"', '"part2"', '"goodFat"', '"bmi"', '"proteinFoods"']) {
      expect(s, k).not.toContain(k);
    }
  });
});

describe("/api/lead/measure — เติมน้ำหนักจากหน้าสรุป", () => {
  it("ปฏิเสธรหัสผิดรูปแบบ", async () => {
    const { status } = await postMeasure({ code: "ไม่ใช่รหัส", weight_kg: 55 });
    expect(status).toBe(400);
  });

  it("ปฏิเสธค่านอกช่วงที่เป็นไปได้", async () => {
    expect((await postMeasure({ code: "MJ-AB23CD", weight_kg: 5 })).status).toBe(400);
    expect((await postMeasure({ code: "MJ-AB23CD", weight_kg: 999 })).status).toBe(400);
    expect((await postMeasure({ code: "MJ-AB23CD" })).status).toBe(400);
  });

  it("รหัสถูกรูปแบบ + ค่าสมเหตุสมผล → ผ่าน validation (dev ไม่มี DB จึงตอบ ok)", async () => {
    const { status, json } = await postMeasure({ code: "MJ-AB23CD", weight_kg: 55, height_cm: 160 });
    expect(status).toBe(200);
    expect(json.ok).toBe(true);
  });
});
