import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildLeadPayload, buildToolResults, validateContact, submitLead } from "./lead";
import { CONSENT_TEXT } from "@shared/disclaimer";
import type { Profile } from "./store";

/**
 * 🔴 จุดที่พังเงียบที่สุดของฟีเจอร์นี้คือ "ชื่อฟิลด์"
 *
 * `/api/lead` ตั้งใจ sanitize ค่าที่ไม่รู้จักเป็น null **โดยไม่ throw** (เพื่อไม่ให้ฟอร์มยาว
 * ตกทั้งใบเพราะฟิลด์เสริมพัง) ผลข้างเคียงคือถ้าแอปส่ง `weightKg` แทน `weight_kg`
 * lead จะถูกบันทึกสำเร็จ ได้ ticket ปกติ **แต่น้ำหนักหายไปเงียบ ๆ**
 * ไม่มี error ให้เห็นทั้งฝั่งแอปและฝั่งแอดมิน — เจอได้ก็ต่อเมื่อมีคนไปเปิดดูข้อมูลจริง
 * เทสต์ชุดนี้จึงล็อกชื่อฟิลด์ไว้ทุกตัว
 */

const baseProfile: Profile = {
  stage: "prep",
  nickname: "หมิว",
  weightKg: 55,
  heightCm: 160,
  ageRange: "30-34",
  lastPeriodStart: "2026-08-01",
  cycleLength: 28,
  sleepBedtime: "23:30",
  sleepWaketime: "06:30",
};

const contact = { nickname: "หมิว", channel: "line" as const, value: "miew_line" };

describe("validateContact", () => {
  it("ไม่ติ๊กยินยอม = ห้ามผ่าน (PDPA ม.26 ข้อมูลสุขภาพ)", () => {
    expect(validateContact(contact, false)).toMatch(/ยินยอม/);
  });

  it("ไม่มีชื่อเล่น / ชื่อเล่นเป็นช่องว่างล้วน = ไม่ผ่าน", () => {
    expect(validateContact({ ...contact, nickname: "" }, true)).toMatch(/ชื่อเล่น/);
    expect(validateContact({ ...contact, nickname: "   " }, true)).toMatch(/ชื่อเล่น/);
  });

  it("ช่องทางติดต่อสั้นกว่า 3 ตัวอักษร = ไม่ผ่าน (ตรงกับกติกาฝั่ง server)", () => {
    expect(validateContact({ ...contact, value: "ab" }, true)).toMatch(/ช่องทางติดต่อ/);
  });

  it("ครบถ้วน = ผ่าน", () => {
    expect(validateContact(contact, true)).toBeNull();
  });
});

describe("buildLeadPayload — ชื่อฟิลด์ต้องเป็น snake_case ตามที่ /api/lead รอรับ", () => {
  it("แปลง camelCase ของแอป → snake_case ของ server ครบทุกตัว", () => {
    const body = buildLeadPayload(baseProfile, contact) as any;

    expect(body).toMatchObject({
      consent: true,
      consent_text: CONSENT_TEXT, // ใช้ข้อความชุดเดียวกับเว็บ ห้ามเขียนเอง
      nickname: "หมิว",
      contact_channel: "line",
      contact_value: "miew_line",
      stage: "prep",
      age_range: "30-34",
      weight_kg: 55,
      height_cm: 160,
      sleep_bedtime: "23:30",
      sleep_waketime: "06:30",
    });

    // 🔴 ห้ามหลุด camelCase ออกไป — ถ้าหลุด server จะ sanitize ทิ้งเงียบ ๆ
    expect(body.weightKg).toBeUndefined();
    expect(body.heightCm).toBeUndefined();
    expect(body.ageRange).toBeUndefined();
    expect(body.sleepBedtime).toBeUndefined();
  });

  it("ตัดช่องว่างหัวท้ายของชื่อเล่น/ช่องทางติดต่อ", () => {
    const body = buildLeadPayload(baseProfile, { ...contact, nickname: "  หมิว  ", value: "  miew  " }) as any;
    expect(body.nickname).toBe("หมิว");
    expect(body.contact_value).toBe("miew");
  });

  it("ติดป้ายว่ามาจากแอป — แอดมินต้องแยก lead แอป/เว็บออกจากกันได้", () => {
    expect((buildLeadPayload(baseProfile, contact) as any).interests).toContain("mobile-app");
  });

  it("โปรไฟล์ว่างเปล่าก็ต้องประกอบ payload ได้ ไม่พัง", () => {
    const body = buildLeadPayload({}, contact) as any;
    expect(body.consent).toBe(true);
    expect(body.stage).toBeUndefined();
    expect(body.tools).toEqual({});
  });
});

describe("buildToolResults", () => {
  it("มีวันแรกของประจำเดือน → ส่งผลนับวันไข่ตกไปด้วย (รูปเดียวกับที่เว็บบันทึก)", () => {
    const tools = buildToolResults(baseProfile) as any;
    expect(tools.ovulation.input).toEqual({ last: "2026-08-01", cycle: 28 });
    expect(tools.ovulation.output.ovulationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ไม่ได้กรอกความยาวรอบ → ใช้ 28 เป็นค่าเริ่มต้น", () => {
    const tools = buildToolResults({ lastPeriodStart: "2026-08-01" }) as any;
    expect(tools.ovulation.input.cycle).toBe(28);
  });

  it("🔒 ไม่มีข้อมูล = ไม่ส่งอะไรเลย ห้ามปลอมค่าขึ้นมาเติม (กฎ 'ยังไม่ประเมิน ≠ 0')", () => {
    expect(buildToolResults({})).toEqual({});
  });

  it("วันที่รูปแบบผิด → ทิ้งเงียบ ๆ ไม่ส่ง ไม่ทำให้ทั้ง payload พัง", () => {
    expect(buildToolResults({ lastPeriodStart: "01/08/2026" })).toEqual({});
  });
});

describe("submitLead", () => {
  const savedFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = savedFetch;
    vi.restoreAllMocks();
  });

  it("สำเร็จ → คืนรหัส ticket + teaser", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ ticket_code: "MJ-A3K7P9", tier: "teaser", teaser: { nickname: "หมิว" } }), { status: 200 }),
    ) as any;

    const r = await submitLead(baseProfile, contact);
    expect(r.ticketCode).toBe("MJ-A3K7P9");
    expect(r.teaser).toEqual({ nickname: "หมิว" });
  });

  it("ยิงไปที่ /api/lead ด้วย body ที่ประกอบไว้", async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify({ ticket_code: "MJ-AAAAAA" }), { status: 200 }));
    globalThis.fetch = spy as any;

    await submitLead(baseProfile, contact);
    const [url, init] = spy.mock.calls[0] as any;
    expect(String(url)).toMatch(/\/api\/lead$/);
    expect(JSON.parse(init.body).weight_kg).toBe(55);
  });

  it("server ตอบ error → โยนข้อความไทยของ server ออกมาตรง ๆ", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "ส่งข้อมูลถี่เกินไป กรุณารอสักครู่" }), { status: 429 }),
    ) as any;
    await expect(submitLead(baseProfile, contact)).rejects.toThrow(/ถี่เกินไป/);
  });

  it("เน็ตล่ม → ข้อความต้องบอกให้เช็คอินเทอร์เน็ต ไม่ใช่โทษ server", async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError("Network request failed"); }) as any;
    await expect(submitLead(baseProfile, contact)).rejects.toThrow(/อินเทอร์เน็ต/);
  });

  it("ตอบ 200 แต่ไม่มี ticket_code = ถือว่าไม่สำเร็จ (ห้ามพาผู้ใช้ไปหน้ารหัสว่าง)", async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as any;
    await expect(submitLead(baseProfile, contact)).rejects.toThrow(/ไม่สำเร็จ/);
  });
});
