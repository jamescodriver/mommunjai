import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET as DIAG } from "../app/api/line/webhook/route";
import {
  isSlipCheckEnabled, expectedReceiverAccounts, receiverMatches,
  verifySlipByUrl, signSlipImageToken, verifySlipImageToken, slipReplyText, slipFailMessage, isSlipCheckActive,
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

/**
 * 🔴 โครงสร้างนี้คัดมาจาก **คำตอบจริงของ API** (ยิงสลิปจริง 20 ส.ค. 69)
 *    ไม่ใช่จากเอกสาร — เอกสารเขียนไว้คนละแบบ (data.transRef / data.sender.displayName)
 *    ซึ่งทำให้โค้ดอ่านค่าไม่ได้เลยสักฟิลด์ และตอบข้อความว่างเปล่าเหมือนกันหมด
 *    ไม่ว่าสลิปจริงหรือปลอม
 */
const SLIP = {
  isDuplicate: false,
  matchedAccount: null,
  amountInSlip: 1039,
  rawSlip: {
    payload: "0038000600000101030060217Ae56d807cc40c4dcd5102TH91046305",
    transRef: "Ae56d807cc40c4dcd",
    date: "2026-08-20T15:51:52+07:00",
    amount: { amount: 1039, local: { amount: 0, currency: "" } },
    sender: { bank: { id: "006", short: "KTB" },
      account: { name: { th: "น.ส. จรรทพร ว", en: "MISS JANTAPORN W" }, bank: { type: "BANKAC", account: "XXX-X-XX423-1" } } },
    receiver: { bank: { id: "004", short: "KBANK" },
      account: { name: { th: "บจก. เบบี้แอนด์มัม(ประเทศไทย)", en: "BABY A" }, bank: { type: "BANKAC", account: "XXX-X-XX660-9" } } },
  },
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
  const SHOP = ["0528766609"]; // = 052-8-76660-9

  it("ไม่ได้ตั้งบัญชีไว้เทียบ → ตัดสินไม่ได้ ไม่ใช่ 'ผ่าน'", () => {
    expect(receiverMatches("XXX-X-XX660-9", [])).toBeUndefined();
  });

  // 🔴 เคสจริงจาก production 20 ส.ค. 69 — สลิป 2 ใบของบัญชีร้านเดียวกัน
  //    แต่ปิดเลขคนละตำแหน่ง วิธีเดิม (endsWith) ผ่านแค่ใบแรก
  it("สลิปกรุงไทย→กสิกร 'XXX-X-XX660-9' → ตรง", () => {
    expect(receiverMatches("XXX-X-XX660-9", SHOP)).toBe(true);
  });

  it("🔴 สลิปกสิกร→กสิกร 'xxx-x-x6660-x' (ปิดหลักสุดท้าย) → ต้องตรงด้วย", () => {
    // เคสนี้เคยถูกตอบว่า "โอนเข้าบัญชีอื่น" ใส่ลูกค้าที่จ่ายเงินจริง
    expect(receiverMatches("xxx-x-x6660-x", SHOP)).toBe(true);
  });

  it("คนละบัญชีจริง (จัดแนวได้ แต่หลักขัดกัน) → false ปฏิเสธได้เต็มปาก", () => {
    expect(receiverMatches("xxx-x-x1234-x", SHOP)).toBe(false);
    expect(receiverMatches("XXX-X-XX111-1", SHOP)).toBe(false);
  });

  it("🔒 จัดแนวไม่ได้ (ความยาวไม่เท่า) → undefined ห้ามฟันธงว่าผิด", () => {
    // บัญชีบางธนาคารยาวไม่เท่ากัน — ตัดสินไม่ได้ ต้องไม่ไปกล่าวหาลูกค้า
    expect(receiverMatches("xx-x-x660-x", SHOP)).toBeUndefined();
  });

  it("เห็นตัวเลขน้อยกว่า 3 หลัก → ตัดสินไม่ได้", () => {
    expect(receiverMatches("xxx-x-xxxxx-x", SHOP)).toBeUndefined();
    expect(receiverMatches("xx", SHOP)).toBeUndefined();
  });

  it("ตัวคั่นแบบอื่น (เว้นวรรค/จุด) ก็ต้องจัดแนวได้", () => {
    // ต้องยาว 10 ตำแหน่งเท่าเลขบัญชีจริงหลังตัดตัวคั่น (xxx + x + x6660 + x)
    expect(receiverMatches("xxx x x6660 x", SHOP)).toBe(true);
    expect(receiverMatches("xxx.x.x6660.x", SHOP)).toBe(true);
  });

  it("🔒 เลขตรงกัน = 'ไม่ขัดกัน' เท่านั้น ข้อความห้ามเคลมว่ายืนยันแล้ว", () => {
    const t = slipReplyText({ amount: 100, receiverMatched: true, verifiedBy: "digits" });
    expect(t).toMatch(/แอดมินจะยืนยัน/);
    expect(t).not.toMatch(/ยืนยันแล้ว|ตรวจสอบแล้วว่าถูกต้อง|เงินเข้าบัญชีร้านแล้ว/);
  });

  it("ห้ามเอาเบอร์โทร (proxy) มาเทียบกับเลขบัญชี", () => {
    expect(receiverMatches("", SHOP)).toBeUndefined();
  });

  it("ตั้งได้หลายบัญชี คั่นด้วยจุลภาค และตัดอักขระที่ไม่ใช่ตัวเลขทิ้ง", () => {
    process.env.THUNDER_RECEIVER_ACCOUNT = "123-4-56789-0, 987-6-54321-0";
    expect(expectedReceiverAccounts()).toEqual(["1234567890", "9876543210"]);
  });
});

describe("verifySlipImage", () => {
  it("สำเร็จ → คืนข้อมูลสลิปที่แปลงแล้ว (รับ response ได้ทั้ง 2 แบบตามที่ doc เขียนไม่ตรงกัน)", async () => {
    process.env.THUNDER_RECEIVER_ACCOUNT = "0528766609"; // บัญชีร้านจริง — เลขท้าย 6609 ตรงกับ XXX-X-XX660-9
    for (const shape of ["status", "success"] as const) {
      globalThis.fetch = ok(SLIP, shape);
      const r = await verifySlipByUrl("https://x.test/i.jpg");
      expect(r.ok).toBe(true);
      if (!r.ok) throw new Error("ควรผ่าน");
      expect(r.data.amount).toBe(1039);
      expect(r.data.transRef).toBe("Ae56d807cc40c4dcd");
      expect(r.data.senderName).toBe("น.ส. จรรทพร ว");
      expect(r.data.receiverName).toBe("บจก. เบบี้แอนด์มัม(ประเทศไทย)");
      expect(r.data.receiverAccount).toBe("XXX-X-XX660-9");
    }
  });

  it("ยิงไปที่ /verify/bank พร้อม Bearer key · เปิด checkDuplicate และ matchAccount เสมอ", async () => {
    const spy = ok(SLIP); globalThis.fetch = spy;
    await verifySlipByUrl("https://x.test/i.jpg");
    const [url, init] = spy.mock.calls[0] as any;
    expect(String(url)).toBe("https://api.thunder.in.th/v2/verify/bank");
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(init.body);
    expect(body.checkDuplicate).toBe(true); // กันสลิปเดิมถูกเคลมซ้ำ
    expect(body.matchAccount).toBe(true);   // ให้ Thunder เทียบบัญชีร้านฝั่งเขาด้วย
    // ⚠️ ต้องเป็นฟิลด์ url เท่านั้น — ทดสอบกับ API จริงแล้ว base64/multipart ใช้ไม่ได้
    expect(body.url).toBe("https://x.test/i.jpg");
    expect(body.image).toBeUndefined();
  });

  it("🔴 เงินเข้าบัญชีอื่น → ไม่ผ่าน ถึงสลิปจะเป็นของจริง", async () => {
    process.env.THUNDER_RECEIVER_ACCOUNT = "0528761111"; // จัดแนวได้ แต่หลักขัดกัน = คนละบัญชีแน่
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

  it("🔴🔴 เทียบปลายทางไม่ได้ → ต้องไม่ผ่าน (เดิมปล่อยผ่าน = สลิปปลอมได้คำตอบเดียวกับของจริง)", async () => {
    // ไม่ได้ตั้งบัญชีร้าน + Thunder ไม่ได้ส่ง matchedAccount กลับมา = ไม่มีหลักฐานว่าถูก
    delete process.env.THUNDER_RECEIVER_ACCOUNT;
    globalThis.fetch = ok(SLIP);
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("ต้องไม่ผ่าน");
    expect(r.reason).toBe("unverified-receiver");
  });

  it("สลิปผู้รับเป็นพร้อมเพย์ (ไม่มีเลขบัญชีให้เทียบ) → ต้องไม่ผ่าน", async () => {
    process.env.THUNDER_RECEIVER_ACCOUNT = "0528766609";
    globalThis.fetch = ok({ ...SLIP, rawSlip: { ...SLIP.rawSlip,
      receiver: { bank: { short: "KBANK" }, account: { name: { th: "ร้าน" }, proxy: { type: "MSISDN", value: "08x-xxx-xx78" } } } } });
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("ต้องไม่ผ่าน");
    expect(r.reason).toBe("unverified-receiver");
  });

  it("✅ Thunder เทียบบัญชีให้แล้ว (matchedAccount) → ผ่าน แม้เราเทียบเองไม่ได้", async () => {
    delete process.env.THUNDER_RECEIVER_ACCOUNT;
    globalThis.fetch = ok({ ...SLIP, matchedAccount: { bankCode: "004", bankNumber: "0528766609" } });
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("ควรผ่าน");
    expect(r.data.verifiedBy).toBe("thunder");
  });

  it("🔴 สลิปซ้ำมาแบบ success + isDuplicate:true (ไม่ใช่ error) → ต้องดักให้ได้", async () => {
    // ถ้าไม่ดัก จะตอบว่า 'ตรวจเรียบร้อย' ให้สลิปที่ถูกใช้ไปแล้ว = เปิดช่องเคลมซ้ำ
    process.env.THUNDER_RECEIVER_ACCOUNT = "0528766609";
    globalThis.fetch = ok({ ...SLIP, isDuplicate: true });
    const r = await verifySlipByUrl("https://x.test/i.jpg");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("ต้องไม่ผ่าน");
    expect(r.reason).toBe("duplicate");
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

  it("ทุกกรณีต้องบอกว่าแอดมินจะยืนยันอีกครั้ง และห้ามเคลมว่ายืนยันกับธนาคารแล้ว", () => {
    for (const v of ["thunder", "digits", undefined] as const) {
      const t = slipReplyText({ amount: 100, verifiedBy: v });
      expect(t).toMatch(/แอดมินจะยืนยัน/);
      expect(t).not.toMatch(/ยืนยันกับธนาคาร|เงินเข้าบัญชีแล้ว|ตรวจสอบกับธนาคาร/);
    }
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

describe("🔴 ตั้งค่าชนกัน (relay + slip) ต้องถอยไปทางที่ปลอดภัยเอง", () => {
  it("relay เปิดอยู่ → ปิดการตรวจสลิปของเราอัตโนมัติ ถึงจะตั้ง env ให้เปิดก็ตาม", () => {
    expect(isSlipCheckEnabled()).toBe(true);      // เจตนาจาก env = เปิด
    expect(isSlipCheckActive(true)).toBe(false);  // แต่ทำงานจริง = ปิด เพราะ relay เปิดอยู่
  });

  it("relay ปิดแล้ว → ทำงานตามที่ตั้งไว้", () => {
    expect(isSlipCheckActive(false)).toBe(true);
  });

  it("ไม่ได้ตั้ง env ให้เปิด → ปิดอยู่แล้วไม่ว่า relay จะเปิดหรือปิด", () => {
    process.env.SLIP_CHECK_ENABLED = "0";
    expect(isSlipCheckActive(false)).toBe(false);
    expect(isSlipCheckActive(true)).toBe(false);
  });
});

describe("🔒 diagnostic ต้องบอกได้ว่าตั้งเลขบัญชีร้านหรือยัง โดยไม่เปิดเผยเลขบัญชี", () => {
  it("ตั้งแล้ว → รายงาน true และห้ามมีเลขบัญชีอยู่ใน response", async () => {
    process.env.THUNDER_RECEIVER_ACCOUNT = "123-4-56789-0";
    const body = await (DIAG() as any).json();
    expect(body.receiverCheck).toBe(true);
    expect(JSON.stringify(body)).not.toContain("56789");
  });

  it("ยังไม่ตั้ง → รายงาน false", async () => {
    delete process.env.THUNDER_RECEIVER_ACCOUNT;
    expect((await (DIAG() as any).json()).receiverCheck).toBe(false);
  });
});
