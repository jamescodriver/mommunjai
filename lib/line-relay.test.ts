import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { relayTargetUrl, isRelayMode, isBotEnabled, relayToPartner } from "./line-relay";
import { POST as WEBHOOK } from "../app/api/line/webhook/route";

/**
 * 🔴 ชุดเทสต์นี้กันความพังที่ "มองไม่เห็นจากฝั่งเรา"
 *
 * LINE OA ของ Baby & Mom มีบอทเช็คสลิปของ Thunder ใช้ช่อง Webhook URL อยู่ก่อนแล้ว
 * และ LINE ตั้ง webhook ได้ช่องเดียว เราจึงต้องรับ event เป็นตัวแรกแล้วส่งต่อให้ Thunder
 *
 * สองอย่างที่ผิดแล้วลูกค้าเสียเงินจริง และเราจะไม่รู้ตัวเลยถ้าไม่มีเทสต์:
 *   1. body ที่ส่งต่อไม่ตรงต้นฉบับทุกไบต์ → ลายเซ็นเพี้ยน → Thunder ตีตกทุก event
 *   2. เราไปตอบข้อความที่ไม่ใช่ของเรา → กิน replyToken (ใช้ได้ครั้งเดียว)
 *      → คนโอนเงินได้ข้อความ "พิมพ์รหัส MJ-XXXXXX" แทนผลตรวจสลิป
 */

const RELAY_URL = "https://relay.test/api/v1/webhook/abc";

// เว้นวรรคแปลก ๆ ตั้งใจ — ถ้าโค้ด parse แล้ว stringify ใหม่ ช่องว่างพวกนี้จะหาย
// และเทสต์ "ส่งต่อตรงทุกไบต์" จะจับได้ทันที
const rawBody = (text: string) =>
  `{ "events": [ {"type":"message","replyToken":"rt-1","source":{"type":"user","userId":"U1"},"message":{"type":"text","text":${JSON.stringify(text)}} } ] }`;

type Call = { url: string; init: any };
let calls: Call[] = [];
const savedEnv = { ...process.env };

/** จำลอง fetch ทั้งของ relay และของ LINE reply แล้วเก็บไว้ตรวจ */
function stubFetch(status = 200) {
  calls = [];
  globalThis.fetch = vi.fn(async (url: any, init: any) => {
    calls.push({ url: String(url), init });
    return new Response("{}", { status });
  }) as any;
}

const relayCalls = () => calls.filter((c) => c.url.startsWith(RELAY_URL));
const lineReplyCalls = () => calls.filter((c) => c.url.includes("api.line.me"));

const hitWebhook = async (text: string, sig = "sig-abc") => {
  const body = rawBody(text);
  const req = new Request("http://localhost/api/line/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "x-line-signature": sig, "x-dev-bypass": "1" },
    body,
  });
  const res = await WEBHOOK(req as any);
  return { status: res.status, json: await res.json(), body };
};

beforeEach(() => {
  process.env = { ...savedEnv };
  delete process.env.LINE_CHANNEL_SECRET; // ไม่มี secret = ใช้ x-dev-bypass ได้
  delete process.env.LINE_RELAY_WEBHOOK_URL;
  delete process.env.LINE_BOT_ENABLED;
  delete process.env.SUPABASE_URL;
  process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-token"; // ให้ lineReply ยิง fetch จริง (จะได้ตรวจได้)
  stubFetch();
});

afterEach(() => {
  process.env = { ...savedEnv };
  vi.restoreAllMocks();
});

describe("การตั้งค่า relay + kill switch", () => {
  it("ไม่ตั้ง LINE_RELAY_WEBHOOK_URL = โหมดเดิม (เราเป็นบอทตัวเดียว)", () => {
    expect(relayTargetUrl()).toBeUndefined();
    expect(isRelayMode()).toBe(false);
  });

  it("ค่าว่าง/ช่องว่างล้วน ต้องนับเป็นไม่ได้ตั้ง", () => {
    process.env.LINE_RELAY_WEBHOOK_URL = "   ";
    expect(isRelayMode()).toBe(false);
  });

  it("kill switch: ไม่ตั้งค่า = เปิด (พฤติกรรมเดิม)", () => {
    expect(isBotEnabled()).toBe(true);
  });

  it.each(["0", "false", "off", "no", "OFF", " False "])("kill switch ปิดด้วยค่า %s", (v) => {
    process.env.LINE_BOT_ENABLED = v;
    expect(isBotEnabled()).toBe(false);
  });

  it.each(["1", "true", "on"])("kill switch เปิดด้วยค่า %s", (v) => {
    process.env.LINE_BOT_ENABLED = v;
    expect(isBotEnabled()).toBe(true);
  });
});

describe("relayToPartner — ส่งต่อของดิบ", () => {
  it("ไม่ตั้งปลายทาง = ไม่ยิงอะไรเลย", async () => {
    const r = await relayToPartner('{"a":1}', new Headers());
    expect(r).toEqual({ relayed: false, reason: "no-target", attempts: 0 });
    expect(calls).toHaveLength(0);
  });

  it("🔴 ส่ง body ตรงทุกไบต์ + header x-line-signature เดิม", async () => {
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;
    const raw = rawBody("สลิปครับ");
    const h = new Headers({ "x-line-signature": "SIG==", "content-type": "application/json", "user-agent": "LineBotWebhook/2.0" });

    const r = await relayToPartner(raw, h);

    expect(r).toEqual({ relayed: true, status: 200, attempts: 1 });
    expect(relayCalls()).toHaveLength(1);
    const sent = relayCalls()[0].init;
    expect(sent.body).toBe(raw); // ← หัวใจ: ต้องเป็นสตริงเดิมเป๊ะ ไม่ใช่ JSON ที่ประกอบใหม่
    expect(new Headers(sent.headers).get("x-line-signature")).toBe("SIG==");
    expect(new Headers(sent.headers).get("user-agent")).toBe("LineBotWebhook/2.0");
  });

  it("ปลายทางตอบ 4xx = ปฏิเสธของชิ้นนี้ ยิงซ้ำก็ไร้ผล → ไม่ retry", async () => {
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;
    stubFetch(401);
    const r = await relayToPartner("{}", new Headers());
    expect(r).toEqual({ relayed: false, reason: "http-401", attempts: 1 });
    expect(relayCalls()).toHaveLength(1);
  });

  it("ปลายทางตอบ 5xx = อาจแค่สะดุด → retry อีกครั้งเดียว", async () => {
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;
    stubFetch(503);
    const r = await relayToPartner("{}", new Headers());
    expect(r).toEqual({ relayed: false, reason: "http-503", attempts: 2 });
    expect(relayCalls()).toHaveLength(2);
  });

  it("เน็ตพัง = ต้องไม่โยน exception ออกมา (ห้ามลาก webhook ล้มไปด้วย)", async () => {
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;
    globalThis.fetch = vi.fn(async () => { throw new TypeError("fetch failed"); }) as any;
    const r = await relayToPartner("{}", new Headers());
    expect(r.relayed).toBe(false);
    expect((r as any).attempts).toBe(2);
  });
});

describe("webhook route — อยู่ร่วมกับบอทเช็คสลิปบน OA เดียวกัน", () => {
  it("🔴 โหมด relay: ข้อความทั่วไปต้องเงียบสนิท แต่ยังส่งต่อครบ", async () => {
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;

    const { status, body } = await hitWebhook("โอนแล้วครับ ส่งสลิปให้ดู");

    expect(status).toBe(200);
    expect(lineReplyCalls()).toHaveLength(0); // ← ไม่แย่ง replyToken ของบอทสลิป
    expect(relayCalls()).toHaveLength(1);
    expect(relayCalls()[0].init.body).toBe(body);
  });

  it("โหมดเดิม (ไม่มีบอทอื่น): ข้อความทั่วไปยังตอบทักทายเหมือนเก่า", async () => {
    await hitWebhook("สวัสดีค่ะ");
    expect(relayCalls()).toHaveLength(0);
    expect(lineReplyCalls()).toHaveLength(1);
  });

  it("โหมด relay: ข้อความที่เป็นของเราจริง ๆ ยังตอบตามปกติ", async () => {
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;

    await hitWebhook("แผนของฉัน");
    expect(lineReplyCalls()).toHaveLength(1);
    expect(relayCalls()).toHaveLength(1); // ส่งต่อด้วยเสมอ ไม่ว่าเราจะตอบหรือไม่

    stubFetch();
    await hitWebhook("รหัสของหนู MJ-A3K7P9 ค่ะ");
    expect(lineReplyCalls()).toHaveLength(1);
    expect(relayCalls()).toHaveLength(1);
  });

  it("🔴 kill switch ปิด: เราเงียบทุกกรณี แต่บอทสลิปต้องยังได้ของครบ", async () => {
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;
    process.env.LINE_BOT_ENABLED = "0";

    const { status, json, body } = await hitWebhook("แผนของฉัน"); // แม้เป็นคำสั่งของเราเองก็ต้องเงียบ

    expect(status).toBe(200);
    expect(json).toEqual({ ok: true, bot: "disabled" });
    expect(lineReplyCalls()).toHaveLength(0);
    expect(relayCalls()).toHaveLength(1);
    expect(relayCalls()[0].init.body).toBe(body);
  });

  it("ลายเซ็นไม่ผ่าน (มี secret จริง) = ตอบ 401 และไม่ส่งต่อขยะไปให้บอทอื่น", async () => {
    process.env.LINE_CHANNEL_SECRET = "real-secret";
    process.env.LINE_RELAY_WEBHOOK_URL = RELAY_URL;

    const req = new Request("http://localhost/api/line/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-line-signature": "bm90LWEtcmVhbC1zaWc=" },
      body: rawBody("อะไรก็ได้"),
    });
    const res = await WEBHOOK(req as any);

    expect(res.status).toBe(401);
    expect(relayCalls()).toHaveLength(0);
  });
});
