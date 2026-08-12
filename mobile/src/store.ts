// เก็บข้อมูลในเครื่องทั้งหมด (โหมด guest ตาม PRD R-A1/R-A3)
//
// 🔴 PDPA — ยังไม่มีอะไรถูกส่งขึ้น server ในเวอร์ชันนี้เลย
//    ข้อมูลสุขภาพจะออกจากเครื่องได้ก็ต่อเมื่อผู้ใช้กด consent + ผูกบัญชี (R-P1)
//    ซึ่งยังไม่ได้ทำในรุ่นทดลองนี้ — ดู PRD §7 คำถาม A4 (LINE Login channel)
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

const K_PROFILE = "mmj.profile.v1";
const K_LOGS = "mmj.dailyLogs.v1";

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

export async function resetAll(): Promise<void> {
  await AsyncStorage.multiRemove([K_PROFILE, K_LOGS]);
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
