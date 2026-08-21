// ตรวจสลิปโอนเงินด้วย Thunder Solution API (แทนการส่งต่อให้บอทของ Thunder)
//
// เอกสาร: https://document.thunder.in.th/th/v2/  ·  base URL https://api.thunder.in.th/v2
//
// ── ⚠️ เอกสารกับ API จริงไม่ตรงกัน (ทดสอบเอง 20 ส.ค. 2569) ────────────────
// เอกสารบอกว่า /verify/bank รับภาพได้ 3 ทาง (multipart `file`, base64 ฟิลด์ `image`, `url`)
// ยิงจริงแล้วพบว่า:
//   ❌ base64 ในฟิลด์ image → 400 "image: Invalid input: expected file, received string"
//   ❌ multipart ทุกชื่อฟิลด์ที่ลอง (image/file/slip/photo) ทั้งจาก curl และ FormData ของ Node
//      → 400 "Please provide either a payload string, a image file, ..." (เหมือนไม่ถูก parse เลย)
//   ✅ ฟิลด์ `url`     → API ไปดึงภาพเองจริง (ได้ IMAGE_URL_UNREACHABLE ตอนใส่ URL ปลอม)
//   ✅ ฟิลด์ `payload` → API พยายาม parse จริง (ได้ "Invalid bank slip format")
// จึงเลือกใช้ **โหมด url** ซึ่งเป็นทางเดียวที่ยืนยันแล้วว่าส่งภาพได้
//   → LINE ไม่เปิดให้ดึงภาพโดยไม่มี token เราจึงต้องเปิดทางให้ Thunder มาดึงจากเรา
//     ผ่าน /api/line/slip-image?t=<token> ที่เซ็น HMAC + หมดอายุใน 2 นาที
// (ถ้าวันหนึ่ง Thunder ยืนยันชื่อฟิลด์อัปโหลดที่ถูกต้อง เปลี่ยนมาส่งไฟล์ตรงจะง่ายกว่านี้มาก)
//
// ยืนยันจากการเรียกจริง: GET /health และ GET /info ใช้งานได้ · error แบบ VALIDATION_ERROR ไม่กินโควตา
//
// ── 🔴 กฎความปลอดภัยที่ห้ามผิด ──────────────────────────────────────────────
// 1. **API key ห้ามอยู่ในโค้ดหรือใน repo เด็ดขาด** — อ่านจาก env `THUNDER_API_KEY` เท่านั้น
//    (เอกสารของ Thunder เองก็ย้ำ: "Do not expose API Key in Client-side code or public repositories")
//    ห้าม log ค่า key และห้ามส่งกลับไปในคำตอบ LINE ไม่ว่ากรณีใด
// 2. **ห้ามเปิดทั้ง relay และตรวจสลิปเองพร้อมกัน** — replyToken ใช้ได้ครั้งเดียว
//    ถ้าเปิดคู่กัน บอทของ Thunder จะตอบด้วย แล้วฝ่ายใดฝ่ายหนึ่งจะพัง
//    (ดู isSlipCheckEnabled() + คำเตือนใน /api/line/webhook)
// 3. **ผลตรวจสลิปคือเรื่องเงิน** — ถ้าตรวจพลาด ลูกค้าอาจส่งของโดยไม่ได้รับเงินจริง
//    เมื่อไม่แน่ใจต้องตอบว่า "ตรวจไม่ได้ ให้แอดมินเช็ค" **ห้ามเดาว่าผ่าน**

import crypto from "node:crypto";

const BASE = "https://api.thunder.in.th/v2";
const TIMEOUT_MS = 20000;

export function slipApiKey(): string | undefined {
  const k = process.env.THUNDER_API_KEY?.trim();
  return k ? k : undefined;
}

/** ตั้งค่าไว้ให้เปิดไหม (เจตนาจาก env) — ต้องมีทั้งสวิตช์และ key */
export function isSlipCheckEnabled(): boolean {
  const v = process.env.SLIP_CHECK_ENABLED?.trim().toLowerCase();
  const on = v !== undefined && v !== "" && !["0", "false", "off", "no"].includes(v);
  return on && !!slipApiKey();
}

/**
 * ทำงานจริงไหม — ต่างจาก isSlipCheckEnabled() ตรงที่ตัดกรณีตั้งค่าชนกันออกด้วย
 *
 * 🔴 ทำไมต้องมี: ถ้าเปิดทั้ง relay และ slip พร้อมกัน บอท 2 ตัวจะแย่งกันตอบภาพสลิป
 *    (replyToken ใช้ได้ครั้งเดียว) ผลลัพธ์ที่ลูกค้าได้จะคาดเดาไม่ได้ — และนี่คือ "เรื่องเงิน"
 *
 * เดิมมีแค่คำเตือนใน diagnostic ซึ่งพึ่งให้คนเห็นแล้วไปแก้ env ให้ถูก
 * แต่เกิดขึ้นจริงบน production 20 ส.ค. 69 แล้วแก้ env ไม่ติดอยู่พักใหญ่
 * → เปลี่ยนเป็น **ปิดตัวเองอัตโนมัติ** เมื่อ relay ยังเปิดอยู่ แล้วถอยไปสถานะเดิม
 *   ที่รู้ว่าปลอดภัย (ปล่อยให้บอทของ Thunder ตรวจสลิปเหมือนเดิม)
 *
 * ⚠️ ไม่ได้ปิดเงียบ ๆ — diagnostic จะขึ้น slipActive:false พร้อมเหตุผลให้เห็นชัด
 *    ถ้าตั้งใจจะให้เราตรวจเอง ต้องล้าง LINE_RELAY_WEBHOOK_URL ให้ว่างก่อน
 */
export function isSlipCheckActive(relayOn: boolean): boolean {
  return isSlipCheckEnabled() && !relayOn;
}

/**
 * เลขบัญชีผู้รับที่ถูกต้องของแบรนด์ (ตัวเลขล้วน) — ใส่ได้หลายบัญชีคั่นด้วยจุลภาค
 *
 * 🔴 นี่คือกันโกงที่สำคัญที่สุด: ถ้าไม่เทียบผู้รับ ลูกค้าส่งสลิปโอนเข้าบัญชีใครก็ได้
 *    ที่เป็นสลิปจริง แล้วระบบจะตอบว่า "ถูกต้อง" ทั้งที่เงินไม่ได้เข้าบัญชีแบรนด์
 */
export function expectedReceiverAccounts(): string[] {
  return (process.env.THUNDER_RECEIVER_ACCOUNT || "")
    .split(",")
    .map((s) => s.replace(/\D/g, ""))
    .filter((s) => s.length >= 4);
}

export interface SlipData {
  transRef?: string;
  date?: string;
  amount?: number;
  currency?: string;
  senderName?: string;
  receiverName?: string;
  receiverAccount?: string;
  /** เทียบเลขบัญชีผู้รับกับที่ตั้งไว้แล้วหรือยัง — undefined = เทียบไม่ได้ */
  receiverMatched?: boolean;
  /** ยืนยันปลายทางด้วยวิธีไหน — "thunder" = Thunder เทียบเลขบัญชีเต็มให้ (แข็งแรงกว่า)
   *  · "digits" = เราเทียบเองจากเลขท้ายที่สลิปเปิดให้เห็น (อ่อนกว่า) */
  verifiedBy?: "thunder" | "digits";
}

export type SlipResult =
  /** อ่านสลิปได้ และ (ถ้าตั้งค่าไว้) เงินเข้าบัญชีที่ถูกต้อง */
  | { ok: true; data: SlipData }
  /** อ่านไม่ได้/สลิปไม่ถูกต้อง/ระบบมีปัญหา — reason ใช้ตัดสินใจ, message เอาไปโชว์ผู้ใช้ได้เลย */
  | { ok: false; reason: SlipFailReason; message: string };

export type SlipFailReason =
  | "disabled"       // ยังไม่เปิดใช้/ไม่มี key
  | "not-a-slip"     // อ่านสลิปจากภาพไม่ได้
  | "duplicate"      // สลิปนี้เคยถูกใช้แล้ว
  | "wrong-receiver"      // เงินไม่ได้เข้าบัญชีของแบรนด์ (รู้แน่)
  | "unverified-receiver" // ยืนยันปลายทางไม่ได้ → ห้ามตอบว่าผ่าน
  | "quota"          // โควตา API หมด
  | "auth"           // key ผิด/หมดอายุ
  | "network"        // ต่อไม่ติด/หมดเวลา
  | "unknown";

/** ข้อความไทยที่ส่งให้ผู้ใช้เห็นได้เลย — ห้ามมีรายละเอียดทางเทคนิคหรือ key */
const FAIL_TEXT: Record<SlipFailReason, string> = {
  disabled: "ระบบตรวจสลิปยังไม่เปิดใช้งานค่ะ แอดมินจะตรวจให้เองนะคะ",
  "not-a-slip": "อ่านสลิปจากภาพนี้ไม่ได้ค่ะ 🙏 รบกวนส่งภาพสลิปเต็มใบที่เห็น QR ชัด ๆ อีกครั้ง หรือรอแอดมินตรวจให้ค่ะ",
  duplicate: "สลิปนี้เคยถูกใช้ยืนยันไปแล้วค่ะ 🙏 รบกวนตรวจสอบอีกครั้ง หรือทักแอดมินได้เลยค่ะ",
  "wrong-receiver": "สลิปนี้เป็นการโอนเข้าบัญชีอื่น ไม่ใช่บัญชีของร้านค่ะ 🙏 รบกวนตรวจสอบอีกครั้ง หรือทักแอดมินนะคะ",
  "unverified-receiver": "ระบบยังยืนยันปลายทางของสลิปนี้ไม่ได้ค่ะ 🙏 แอดมินจะตรวจสอบให้อีกครั้งนะคะ",
  quota: "ระบบตรวจสลิปอัตโนมัติใช้งานครบโควตาแล้วค่ะ แอดมินจะตรวจให้เองนะคะ 🙏",
  auth: "ระบบตรวจสลิปอัตโนมัติขัดข้องชั่วคราวค่ะ แอดมินจะตรวจให้เองนะคะ 🙏",
  network: "ระบบตรวจสลิปตอบช้าผิดปกติค่ะ แอดมินจะตรวจให้เองนะคะ 🙏",
  unknown: "ตรวจสลิปอัตโนมัติไม่สำเร็จค่ะ แอดมินจะตรวจให้เองนะคะ 🙏",
};

export function slipFailMessage(reason: SlipFailReason): string {
  return FAIL_TEXT[reason];
}

/** map error code ของ Thunder → เหตุผลฝั่งเรา (เอกสาร §Common Error Codes) */
function reasonFromApi(httpStatus: number, code?: string): SlipFailReason {
  const c = (code || "").toUpperCase();
  if (c === "MISSING_API_KEY" || c === "INVALID_API_KEY" || httpStatus === 401) return "auth";
  if (c === "QUOTA_EXCEEDED" || httpStatus === 403) return "quota";
  if (c === "SLIP_NOT_FOUND" || httpStatus === 404) return "not-a-slip";
  if (c.includes("DUPLICATE")) return "duplicate";
  if (c === "IMAGE_URL_UNREACHABLE") return "network"; // Thunder ดึงภาพจากเราไม่ได้
  if (c === "VALIDATION_ERROR" || httpStatus === 400) return "not-a-slip";
  return "unknown";
}

/** เก็บเฉพาะตัวเลขจากเลขบัญชี (ของจริงมักถูกปิดบางหลักเป็น x เช่น "xxx-x-xx789-x") */
function digitsOf(v: unknown): string {
  return typeof v === "string" ? v.replace(/\D/g, "") : "";
}

/**
 * เทียบเลขบัญชีผู้รับกับบัญชีร้าน
 *
 * 🔴 บทเรียน 20 ส.ค. 69 — **แต่ละสลิปปิดเลขบัญชีคนละตำแหน่งกัน**
 *    บัญชีร้าน 0528766609 (= 052-8-76660-9) ปรากฏบนสลิปได้อย่างน้อย 2 แบบ:
 *      • สลิปกรุงไทย→กสิกร : "XXX-X-XX660-9"  ← เห็น 660 กับหลักสุดท้าย 9
 *      • สลิปกสิกร→กสิกร   : "xxx-x-x6660-x"  ← เห็น 6660 แต่ **ปิดหลักสุดท้าย**
 *
 *    เดิมใช้ endsWith(ตัวเลขที่เห็น) ซึ่งใช้ได้กับแบบแรกเท่านั้น
 *    แบบที่สองให้ "6660" ที่ไม่ใช่ส่วนท้ายของ 0528766609 → ระบบตอบว่า
 *    **"โอนเข้าบัญชีอื่น"** ใส่ลูกค้าที่จ่ายเงินจริง ซึ่งแย่กว่าเงียบมาก
 *
 *    → เปลี่ยนมา **เทียบทีละตำแหน่ง** โดยจัดแนวจากความยาวที่เท่ากัน
 *      (ตัดขีดออกแล้วนับ ต้องยาวเท่าเลขบัญชีจริงถึงจะจัดแนวได้)
 *
 * ⚖️ ผลลัพธ์ 3 แบบ และความหมาย:
 *   • true      → ทุกหลักที่สลิปเปิดให้เห็น ตรงกับบัญชีร้านตามตำแหน่ง
 *   • false     → จัดแนวได้ แต่มีหลักที่ขัดกัน = **คนละบัญชีแน่นอน** (ใช้ปฏิเสธได้)
 *   • undefined → จัดแนวไม่ได้/เห็นน้อยเกินไป = **ตัดสินไม่ได้ ห้ามกล่าวหา**
 */
const MIN_VISIBLE_DIGITS = 3;

/** ตัดตัวคั่นออก เหลือ mask ที่นับตำแหน่งได้ (เลขจริง + x ที่ถูกปิด) */
function normalizeMask(masked: string): string {
  return (masked || "").replace(/[\s\-–—.]/g, "");
}

export function receiverMatches(masked: string, expected: string[]): boolean | undefined {
  const mask = normalizeMask(masked);
  const visible = digitsOf(mask);
  if (!expected.length) return undefined;
  if (visible.length < MIN_VISIBLE_DIGITS) return undefined;

  // จัดแนวได้เมื่อความยาวเท่ากัน → เทียบทีละตำแหน่ง (แม่นที่สุด)
  const alignable = expected.filter((acc) => acc.length === mask.length);
  if (alignable.length) {
    return alignable.some((acc) =>
      [...mask].every((c, i) => !/\d/.test(c) || c === acc[i]),
    );
  }

  // จัดแนวไม่ได้ (คนละความยาว เช่นบัญชีต่างธนาคาร) → ลองแบบเลขท้ายเป็นทางสำรอง
  // ถ้าไม่ตรงก็ **ไม่ฟันธงว่าผิด** เพราะอาจแค่จัดแนวไม่ได้ ไม่ใช่คนละบัญชี
  return expected.some((acc) => acc.endsWith(visible)) ? true : undefined;
}

// ── โทเคนสำหรับให้ Thunder มาดึงภาพจากเรา ───────────────────────────────────
//
// 🔒 ทำไมต้องเซ็นและหมดอายุ: URL นี้ "เปิดสาธารณะชั่วคราว" และปลายทางเป็นภาพสลิป
//    ซึ่งมีชื่อผู้โอน/ผู้รับและเลขบัญชีบางส่วน = ข้อมูลส่วนบุคคล
//    จึงต้องเดา URL ไม่ได้ · ใช้ได้สั้นมาก · และไม่มีการเก็บไฟล์ไว้ที่ไหนเลย (stream ผ่าน)
const TOKEN_TTL_SEC = 120;

function tokenSecret(): string | undefined {
  // ใช้ secret แยกถ้าตั้งไว้ · ไม่งั้นยืมของ LINE ซึ่งเป็น server-only และอยู่ในขอบเขตงานเดียวกัน
  return process.env.SLIP_IMAGE_SECRET?.trim() || process.env.LINE_CHANNEL_SECRET?.trim() || undefined;
}

export function signSlipImageToken(messageId: string, nowSec = Math.floor(Date.now() / 1000)): string | null {
  const secret = tokenSecret();
  if (!secret || !messageId) return null;
  const body = `${messageId}.${nowSec + TOKEN_TTL_SEC}`;
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${Buffer.from(body).toString("base64url")}.${sig}`;
}

export function verifySlipImageToken(token: string, nowSec = Math.floor(Date.now() / 1000)): string | null {
  const secret = tokenSecret();
  if (!secret || !token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  let body: string;
  try { body = Buffer.from(b64, "base64url").toString("utf8"); } catch { return null; }
  const expect = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  try {
    if (expect.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  } catch { return null; }
  const i = body.lastIndexOf(".");
  const messageId = body.slice(0, i);
  const exp = Number(body.slice(i + 1));
  if (!messageId || !Number.isFinite(exp) || nowSec > exp) return null;
  return messageId;
}

/**
 * ให้ Thunder ไปดึงภาพสลิปจาก URL แล้วตรวจให้
 * @param imageUrl URL สาธารณะชั่วคราวที่ Thunder เข้าถึงได้
 *
 * 🔒 ฟังก์ชันนี้ **ไม่โยน exception** — คืน SlipResult เสมอ เพื่อไม่ให้ทำ webhook ทั้งตัวล้ม
 */
export async function verifySlipByUrl(imageUrl: string): Promise<SlipResult> {
  const key = slipApiKey();
  if (!key) return { ok: false, reason: "disabled", message: FAIL_TEXT.disabled };

  let res: Response;
  try {
    res = await fetch(`${BASE}/verify/bank`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        // กันสลิปเดิมถูกส่งซ้ำเพื่อเคลมสองรอบ — เปิดไว้เสมอ
        checkDuplicate: true,
        // 🔴 ให้ Thunder เทียบผู้รับกับบัญชีร้านที่ลงทะเบียนไว้ในระบบเขา (POST /bank-accounts)
        //    แข็งแรงกว่าที่เราเทียบเองมาก เพราะเขาเห็นเลขบัญชีเต็ม ส่วนเราเห็นแค่ 3 หลักท้าย
        //    ถ้ายังไม่ได้ลงทะเบียนบัญชีไว้กับ Thunder จะไม่มี matchedAccount กลับมา
        //    → โค้ดข้างล่างจะถือว่า "ยืนยันไม่ได้" ไม่ใช่ "ผ่าน"
        matchAccount: true,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "network", message: FAIL_TEXT.network };
  }

  let body: any = null;
  try { body = await res.json(); } catch { /* ปล่อยเป็น null */ }

  // เอกสารแสดง success ไว้ 2 แบบไม่ตรงกัน ({success:true,data} กับ {status:200,data}) จึงรับทั้งคู่
  const okFlag = body?.success === true || body?.status === 200;
  if (!res.ok || !okFlag || !body?.data) {
    const reason = reasonFromApi(res.status, body?.error?.code || body?.code);
    return { ok: false, reason, message: FAIL_TEXT[reason] };
  }

  // ── 🔴 โครงสร้างคำตอบจริง ไม่ตรงกับที่เอกสารเขียนไว้เลย (ยิงของจริง 20 ส.ค. 69) ──
  //
  // เอกสารเขียนว่า data.transRef / data.sender.displayName / data.receiver.account.value
  // ของจริงคือ:
  //   data.isDuplicate      ← สลิปซ้ำ (มาแบบ success ปกติ ไม่ใช่ error code!)
  //   data.matchedAccount   ← ผลเทียบบัญชีจาก matchAccount (เป็น null ถ้าเทียบไม่ได้)
  //   data.amountInSlip
  //   data.rawSlip.transRef
  //   data.rawSlip.sender.account.name.th / .en
  //   data.rawSlip.receiver.account.name.th / .en
  //   data.rawSlip.receiver.account.bank.account  ← เลขบัญชีแบบปิดบางหลัก
  //
  // ผลของการอ่านผิด: ทุกฟิลด์เป็น undefined → ข้อความตอบกลับว่างเปล่าเหมือนกันหมด
  // ไม่ว่าสลิปจริงหรือปลอม (ต้นเจอเอง 20 ส.ค. 69) และเทียบเลขบัญชีไม่ได้เลย
  //
  // ยังรองรับโครงเดิมตามเอกสารไว้ด้วย เผื่อ API คืนคนละแบบตามโหมด input
  const d = body.data;
  const raw = d?.rawSlip ?? d;

  // 🔴 สลิปซ้ำมาแบบ success + isDuplicate:true ไม่ได้มาเป็น error
  //    ถ้าไม่ดัก จะตอบว่า "ตรวจเรียบร้อย" ให้สลิปที่ถูกใช้ไปแล้ว = เปิดช่องเคลมซ้ำ
  if (d?.isDuplicate === true) {
    return { ok: false, reason: "duplicate", message: FAIL_TEXT.duplicate };
  }

  const pickName = (n: any): string | undefined =>
    typeof n === "string" ? n : n?.th || n?.en || undefined;

  // เลขบัญชีผู้รับ — ห้ามเอา proxy (พร้อมเพย์/เบอร์โทร) มาเทียบกับเลขบัญชี
  const receiverAccount: string | undefined =
    raw?.receiver?.account?.bank?.account ?? raw?.receiver?.account?.value;
  const matched = receiverMatches(receiverAccount || "", expectedReceiverAccounts());
  // Thunder เทียบให้แล้วหรือยัง (ต้องลงทะเบียนบัญชีร้านไว้ที่ POST /bank-accounts ก่อน)
  const thunderMatched = !!d?.matchedAccount;

  const data: SlipData = {
    transRef: raw?.transRef,
    date: raw?.date,
    amount: typeof d?.amountInSlip === "number" ? d.amountInSlip
      : typeof raw?.amount?.amount === "number" ? raw.amount.amount
      : raw?.amount?.local?.amount,
    currency: raw?.amount?.local?.currency || "THB",
    senderName: pickName(raw?.sender?.account?.name) ?? raw?.sender?.displayName ?? raw?.sender?.name,
    receiverName: pickName(raw?.receiver?.account?.name) ?? raw?.receiver?.displayName ?? raw?.receiver?.name,
    receiverAccount,
    receiverMatched: matched,
    verifiedBy: thunderMatched ? "thunder" : matched === true ? "digits" : undefined,
  };

  // 🔴 เงินไม่ได้เข้าบัญชีแบรนด์ = ไม่ผ่าน ถึงสลิปจะเป็นของจริงก็ตาม
  if (matched === false) return { ok: false, reason: "wrong-receiver", message: FAIL_TEXT["wrong-receiver"] };

  // 🔴🔴 กฎสำคัญที่สุดของไฟล์นี้ — **ต้องมีการยืนยันฝั่งบวกเท่านั้นถึงจะตอบว่าผ่าน**
  //
  // เดิมเขียนไว้ว่า "ถ้าไม่พบว่าผิด = ผ่าน" ซึ่งทำให้กรณี "เทียบไม่ได้" (undefined)
  // เช่นสลิปที่ผู้รับเป็นพร้อมเพย์/ไม่มีเลขบัญชีให้เทียบ ถูกตอบว่า "✅ ตรวจเรียบร้อย"
  // เหมือนสลิปจริงทุกประการ → ต้นเจอเองว่าสลิปปลอมก็ได้คำตอบแบบเดียวกัน (20 ส.ค. 69)
  //
  // เรื่องเงินต้องกลับด้าน: **ไม่มีหลักฐานว่าถูก = ยังไม่ผ่าน** ไม่ใช่ "ไม่มีหลักฐานว่าผิด = ผ่าน"
  if (!thunderMatched && matched !== true) {
    return { ok: false, reason: "unverified-receiver", message: FAIL_TEXT["unverified-receiver"] };
  }

  return { ok: true, data };
}

/** จัดข้อความผลตรวจให้ผู้ใช้อ่าน — ตัวเลขทั้งหมดมาจาก API ไม่มีการเดา */
export function slipReplyText(d: SlipData): string {
  const lines = ["✅ ตรวจสลิปเรียบร้อยค่ะ"];
  if (typeof d.amount === "number") {
    lines.push(`ยอดเงิน ${d.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ${d.currency || "THB"}`);
  }
  if (d.senderName) lines.push(`ผู้โอน ${d.senderName}`);
  if (d.receiverName) lines.push(`ผู้รับ ${d.receiverName}`);
  if (d.date) {
    try {
      lines.push(`เวลา ${new Date(d.date).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}`);
    } catch { /* วันที่รูปแบบแปลก ข้ามไป ไม่ต้องเดา */ }
  }
  if (d.transRef) lines.push(`เลขอ้างอิง ${d.transRef}`);
  // 🔒 บอกตามจริงว่ายืนยันปลายทางด้วยวิธีไหน — ความแข็งแรงต่างกันมาก
  //    ห้ามเขียนให้เข้าใจว่า "ยืนยันการโอนกับธนาคารแล้ว" เพราะเรายังไม่รู้ว่า Thunder
  //    ตรวจกับธนาคารจริงหรือแค่อ่าน QR (ยังไม่ได้คำตอบจากซัพพอร์ต)
  lines.push(
    d.verifiedBy === "thunder"
      ? "\n(ตรงกับบัญชีร้านที่ลงทะเบียนไว้ — แอดมินจะยืนยันยอดอีกครั้งค่ะ)"
      : "\n(เลขท้ายบัญชีผู้รับตรงกับของร้าน — แอดมินจะยืนยันยอดอีกครั้งค่ะ)",
  );
  return lines.join("\n");
}
