import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isSlipCheckEnabled, expectedReceiverAccounts, receiverMatches,
  verifySlipByUrl, signSlipImageToken, verifySlipImageToken, slipReplyText, slipFailMessage,
} from "./slip";

/**
 * 🔴 ชุดนี้คุมเรื่องเงิน — ถ้าตรวจสลิปพลาด ลูกค้าอาจส่งของโดยไม่ได้รับเงินจริง
 * กติกาที่ห้ามหลุด: ไม่แน่ใจ = ต้องไม่ผ่าน · ห้ามให้ API key โผล่ในข้อความถึงผู้ใช้
 */

const KEY = "test-key-do-not-log";
const saved = { ...process.env };
const savedFetch = globalThis.fetch;

beforeEach(() => {
  process.env = { ...saved };
  process.env.THUNDER_API_KEY = KEY;
  process.env.SLIP_CHECK_ENABLED = "1";
  delete process.env.THUNDER_RECEIVER_ACCOUNT;
});
afterEach(() => {
  process.env = { ...saved };
  globalThis.fetch = savedFetch;
  vi.restoreAllMocks();
});

const ok = (data: any, shape: "success" | "status" = "status") =>
  vi.fn(async () => new Response(JSON.stringify(shape === "status" ? { status: 200, data } : { success: true, data }), { status: 200 })) as any;

const SLIP = {
  transRef: "2024011512345678",
  date: "2026-08-20T10:30:00+07:00",
  amount: { amount: 1500.5, local: { amount: 1500.5, currency: "THB" } },
  sender: { displayName: "นาย ผู้โอน ทดสอบ" },
  receiver: { displayName: "นาง ผู้รับ ทดสอบ", account: { type: "BANKAC", value: "xxx-x-xx789-x" } },
};

describe("สวิตช์เปิด/ปิด", () => {
  it("ต้องมีทั้งสวิตช์และ key ถึงจะทำงาน", () => {
    expect(isSlipCheckEnabled()).toBe(true);
    delete process.env.THUNDER_API_KEY;
    expect(isSlipCheckEnabled()).toBe(false); // มีสวิตช์แต่ไม่มี key = ปิด
  });

  it.each(["0", "false", "off", "no"])("ปิดด้วยค่า %s", (v) => {
    process.env.SLIP_CHECK_ENABLED = v;
    expect(isSlipCheckEnabled()).toBe(false);
  });

  it("ไม่ตั้งสวิตช์ = ปิด (ต้องเปิดโดยตั้งใจเท่านั้น เพราะทับงานบอทอีกตัว)", () => {
    delete process.env.SLIP_CHECK_ENABLED;
    expect(isSlipCheckEnabled()).toBe(false);
  });
});

describe("เทียบเลขบัญชีผู้รับ (กันโกงที่สำคัญที่สุด)", () => {
  it("ไม่ได้ตั้งบัญชีไว้เทียบ → ตัดสินไม่ได้ (undefined) ไม่ใช่ 'ผ่าน'", () => {
    expect(receiverMatches("xxx-x-xx789-x", [])).toBeUndefined();
  });

  it("เลขท้ายตรงกับบัญชีแบรนด์ → ผ่าน", () => {
    expect(receiverMatches("xxx-x-xx789-x", ["1234567890789"])).toBe(true);
  });

  it("เลขท้ายไม่ตรง → ไม่ผ่าน", () => {
    expect(receiverMatches("xxx-x-xx789-x", ["1234567890111"])).toBe(false);
  });

  it("เห็นตัวเลขน้อยกว่า 3 หลัก → ตัดสินไม่ได้ ห้ามเดา", () => {
    expect(receiverMatches("xxx-x-xxxx-x", ["1234567890001"])).toBeUndefined();
    expect(receiverMatches("xx", ["1234567890012"])).toBeUndefined();
  });

  it("🔒 เลขตรงกัน = 'ไม่ขัดกัน' เท่านั้น ข้อความห้ามเคลมว่ายืนยันแล้ว", () => {
    const t = slipReplyText({ amount: 100, receiverMatched: true });
    expect(t).toMatch(/แอดมินจะยืนยัน/);
    expect(t).not.toMatch(/ยืนยันแล้ว|ตรวจสอบแล้วว่าถูกต้อง|เงินเข้าบัญชีร้านแล้ว/);
  });

  it("ห้ามเอาเบอร์โทร (proxy) มาเทียบกับเลขบัญชี", () => {
    // สลิปที่ผู้รับเป็นพร้อมเพย์เบอร์โทร ไม่มี account.value → ต้องตัดสินไม่ได้
    expect(receiverMatches("", ["1234567890"])).toBeUndefined();
  });

  it("ตั้งได้หลายบัญชี คั่นด้วยจุลภาค และตัดอักขระที่ไม่ใช่ตัวเลขทิ้ง", () => {
    process.env.THUNDER_RECEIVER_ACCOUNT = "123-4-56789-0, 987-6-54321-0";
    expect(expectedReceiverAccounts()).toEqual(["1234567890", "9876543210"]);
  });
});

describe("verifySlipImage", () => {
  it("สำเร็จ → คืนข้อมูลสลิปที่แปลงแล้ว (รับ response ได้ทั้ง 2 แบบตามที่ doc เขียนไม่ตรงกัน)", async () => {
    for (const shape of ["status", "success"] as const) {
      globalThis.fetch = ok(SLIP, shape);
      const r = await verifySlipByUrl("https://x.test/i.jpg");
      expect(r.ok).toBe(true);
      if (!r.ok) throw new Error("ควรผ่าน");
      expect(r.data.amount).toBe(1500.5);
      expect(r.data.transRef).toBe("2024011512345678");
      expect(r.data.senderName).toBe("นาย ผู้โอน ทดสอบ");
    }
  });

  it("ยิงไปที่ /verify/bank พร้อม Bearer key และเปิด checkDuplicate เสมอ", async () => {
    const spy = ok(SLIP); globalThis.fetch = spy;
    await verifySlipByUrl("https://x.test/i.jpg");
    const [url, init] = spy.mock.calls[0] as any;
    expect(String(url)).toBe("https://api.thunder.in.th/v2/verify/bank");
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(init.body);
    expect(body.checkDuplicate).toBe(true); // กันสลิปเดิมถูกเคลมซ้ำ
    // ⚠️ ต้องเป็นฟิลด์ url เท่านั้น — ทดสอบกับ API จริงแล้ว base64/multipart ใช้ไม่ได้
    expect(body.url).toBe("https://x.test/i.jpg");
    expect(body.image).toBeUndefined();
  });

  it("🔴 เงินเข้าบัญชีอื่น → ไม่ผ่าน ถึงสลิปจะเป็นของจริง", async () => {
    process.env.THUNDER_RECEIVER_ACCOUNT = "1234567890111";
    globalThis.fetch = ok(SLIP);
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("ต้องไม่ผ่าน");
    expect(r.reason).toBe("wrong-receiver");
  });

  it.each([
    [401, "INVALID_API_KEY", "auth"],
    [403, "QUOTA_EXCEEDED", "quota"],
    [404, "SLIP_NOT_FOUND", "not-a-slip"],
    [400, "VALIDATION_ERROR", "not-a-slip"],
    [409, "DUPLICATE_SLIP", "duplicate"],
  ])("HTTP %s / %s → reason %s", async (status, code, reason) => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, error: { code, message: "x" } }), { status: status as number }),
    ) as any;
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("ต้องไม่ผ่าน");
    expect(r.reason).toBe(reason);
  });

  it("เน็ตล่ม/หมดเวลา → ไม่โยน exception และต้องไม่ถือว่าผ่าน", async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError("fetch failed"); }) as any;
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("ต้องไม่ผ่าน");
    expect(r.reason).toBe("network");
  });

  it("ตอบ 200 แต่ไม่มี data → ถือว่าไม่ผ่าน (ห้ามตีความว่าสำเร็จ)", async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ status: 200 }), { status: 200 })) as any;
    expect((await verifySlipByUrl("https://x.test/i.jpg")).ok).toBe(false);
  });

  it("ไม่มี key → ปิดการทำงาน ไม่ยิง API เลย", async () => {
    delete process.env.THUNDER_API_KEY;
    const spy = ok(SLIP); globalThis.fetch = spy;
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("🔒 ข้อความที่ส่งถึงผู้ใช้ ห้ามมี API key หรือรายละเอียดทางเทคนิค", () => {
  it("ทุกข้อความ error ไม่มี key และไม่มีชื่อ error code", () => {
    for (const reason of ["disabled","not-a-slip","duplicate","wrong-receiver","quota","auth","network","unknown"] as const) {
      const m = slipFailMessage(reason);
      expect(m).not.toContain(KEY);
      expect(m).not.toMatch(/API_KEY|QUOTA_EXCEEDED|Bearer|http/i);
      expect(m.length).toBeGreaterThan(10);
    }
  });

  it("ข้อความผลสำเร็จมียอดเงินและผู้โอน ไม่มี key", () => {
    const t = slipReplyText({ amount: 1500.5, currency: "THB", senderName: "นาย ก", transRef: "REF1" });
    expect(t).toContain("1,500.50");
    expect(t).toContain("นาย ก");
    expect(t).not.toContain(KEY);
  });

  it("ไม่ได้ตั้งบัญชีไว้เทียบ → ต้องบอกผู้ใช้ว่าแอดมินจะยืนยันอีกครั้ง ห้ามทำให้เข้าใจว่าระบบยืนยันปลายทางแล้ว", () => {
    const t = slipReplyText({ amount: 100, receiverMatched: undefined });
    expect(t).toMatch(/แอดมินจะยืนยัน/);
  });
});

describe("โทเคนภาพชั่วคราวที่ให้ Thunder มาดึง", () => {
  beforeEach(() => { process.env.SLIP_IMAGE_SECRET = "s3cret-for-slip-image"; });

  it("เซ็นแล้วตรวจกลับได้ messageId เดิม", () => {
    const t = signSlipImageToken("MSG123")!;
    expect(verifySlipImageToken(t)).toBe("MSG123");
  });

  it("🔒 โทเคนถูกแก้ = ใช้ไม่ได้", () => {
    const t = signSlipImageToken("MSG123")!;
    expect(verifySlipImageToken(t.slice(0, -2) + "xx")).toBeNull();
  });

  it("🔒 หมดอายุแล้ว (เกิน 2 นาที) = ใช้ไม่ได้ — ภาพสลิปต้องไม่เปิดค้างไว้", () => {
    const now = 1_000_000;
    const t = signSlipImageToken("MSG123", now)!;
    expect(verifySlipImageToken(t, now + 119)).toBe("MSG123");
    expect(verifySlipImageToken(t, now + 121)).toBeNull();
  });

  it("🔒 คนอื่นเดา messageId แล้วสร้างโทเคนเองไม่ได้ ถ้าไม่มี secret", () => {
    const t = signSlipImageToken("MSG123")!;
    process.env.SLIP_IMAGE_SECRET = "secret-อื่น";
    expect(verifySlipImageToken(t)).toBeNull();
  });

  it("ไม่มี secret เลย = ออกโทเคนไม่ได้ (ระบบต้องไม่ทำงานแบบไม่มีการป้องกัน)", () => {
    delete process.env.SLIP_IMAGE_SECRET;
    delete process.env.LINE_CHANNEL_SECRET;
    expect(signSlipImageToken("MSG123")).toBeNull();
  });
});
