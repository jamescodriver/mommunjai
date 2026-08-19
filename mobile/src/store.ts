// เก็บข้อมูลในเครื่องทั้งหมด (โหมด guest ตาม PRD R-A1/R-A3)
//
// 🔴 PDPA — โดยปริยายข้อมูลทุกอย่างอยู่ในเครื่องผู้ใช้เท่านั้น
//    มีทางเดียวที่ข้อมูลออกจากเครื่องได้: ผู้ใช้กดยินยอมเองในหน้า "รับแผนฉบับเต็ม"
//    แล้วแอปยิงไป POST /api/lead (ดู src/lead.ts) — นอกจากนั้นไม่มีการส่งออกเลย
//    ไม่ต้องมี LINE Login (A4) เพราะเว็บก็เก็บ lead แบบไม่ต้องล็อกอินเหมือนกัน
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Stage = "prep" | "infertility" | "pregnant" | "lactating" | "male";

export interface Profile {
  stage?: Stage;
  nickname?: string;
  weightKg?: number;
  heightCm?: number;
  ageRange?: string;
  /** วันแรกของประจำเดือนล่าสุด (yyyy-mm-dd) — ใช้หาจังหวะรอบเดือน */
  lastPeriodStart?: string;
  cycleLength?: number;
  /** อายุครรภ์ (สัปดาห์) ตอนที่บันทึก + วันที่บันทึก เพื่อคำนวณต่อไปเองได้ */
  gestationalWeeks?: number;
  gestationalSetOn?: string;
  /** วันแรกที่เริ่มแผน 90 วัน */
  planStartedOn?: string;
  sleepBedtime?: string;
  sleepWaketime?: string;
}

/** บันทึกรายวัน: key = yyyy-mm-dd, value = รายการที่ติ๊กแล้ว */
export type DailyLogs = Record<string, string[]>;

/**
 * หลักฐานว่าเคยส่งข้อมูลขึ้น server แล้ว + รหัส ticket ที่ได้กลับมา
 *
 * ทำไมต้องเก็บ: ผู้ใช้ต้องเปิดดูรหัสตัวเองได้ตลอด ไม่ใช่เห็นครั้งเดียวตอนส่งเสร็จ
 * (ถ้าปิดแอปไปก่อนพิมพ์เข้า LINE แล้วรหัสหาย = lead หลุดทั้งที่เก็บข้อมูลไปแล้ว)
 *
 * 🔒 ห้ามเก็บช่องทางติดต่อ (เบอร์/LINE ID) ซ้ำลงเครื่อง — server เก็บให้แล้ว
 *    เก็บซ้ำที่นี่มีแต่เพิ่มพื้นที่ข้อมูลส่วนบุคคลที่ต้องดูแลโดยไม่ได้ประโยชน์
 */
export interface Submission {
  ticketCode: string;
  /** ISO timestamp ตอนที่ส่งสำเร็จ */
  submittedAt: string;
}

const K_PROFILE = "mmj.profile.v1";
const K_LOGS = "mmj.dailyLogs.v1";
const K_SUBMISSION = "mmj.submission.v1";

export function todayISO(): string {
  const d = new Date();
  // ใช้เวลาท้องถิ่นของเครื่อง — "วันนี้" ของผู้ใช้คือวันตามนาฬิกาเขา ไม่ใช่ UTC
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(K_PROFILE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(K_PROFILE, JSON.stringify(p));
}

export async function loadLogs(): Promise<DailyLogs> {
  try {
    const raw = await AsyncStorage.getItem(K_LOGS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveLogs(l: DailyLogs): Promise<void> {
  await AsyncStorage.setItem(K_LOGS, JSON.stringify(l));
}

export async function loadSubmission(): Promise<Submission | null> {
  try {
    const raw = await AsyncStorage.getItem(K_SUBMISSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSubmission(s: Submission): Promise<void> {
  await AsyncStorage.setItem(K_SUBMISSION, JSON.stringify(s));
}

export async function resetAll(): Promise<void> {
  // ⚠️ ล้างรหัส ticket ในเครื่องด้วย แต่ **ข้อมูลที่ส่งไป server แล้วไม่ได้ถูกลบ**
  //    หน้าจอที่เรียกฟังก์ชันนี้ต้องบอกผู้ใช้ให้ชัด + ชี้ทางขอลบข้อมูลจริงตาม PDPA
  await AsyncStorage.multiRemove([K_PROFILE, K_LOGS, K_SUBMISSION]);
}

/** จำนวนวันที่บันทึกอย่างน้อย 1 อย่าง (ใช้โชว์ความคืบหน้า ไม่ใช่ตัดสินผู้ใช้) */
export function activeDays(logs: DailyLogs): number {
  return Object.values(logs).filter((v) => v && v.length > 0).length;
}

/** ทำติดกันกี่วันจนถึงวันนี้ — นับถอยหลังจากวันนี้ ขาดวันไหนหยุดนับ */
export function streak(logs: DailyLogs): number {
  let n = 0;
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  for (let i = 0; i < 400; i++) {
    const iso = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    if (logs[iso] && logs[iso].length > 0) n++;
    else if (i > 0) break; // วันนี้ยังไม่บันทึกไม่ถือว่าขาด (วันยังไม่จบ)
    d.setDate(d.getDate() - 1);
  }
  return n;
}
