// M5 — Sleep calculator (pure). See docs/nutrition-protocol.md §3.
// 90-min cycles; Kru Koi rule: sleep before 22:00.

const CYCLE_MIN = 90;
const FALL_ASLEEP_MIN = 15;

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = +m[1],
    mm = +m[2];
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}
function fmt(mins: number): string {
  mins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Mode A: given a wake time, suggest bedtimes (5–6 cycles = 7.5–9h).
export function bedtimesForWake(wake: string): { error: string } | { bedtimes: string[] } {
  const w = toMinutes(wake);
  if (w === null) return { error: "เวลาตื่นไม่ถูกต้อง (เช่น 06:30)" };
  const bedtimes = [6, 5].map((cycles) =>
    fmt(w - cycles * CYCLE_MIN - FALL_ASLEEP_MIN),
  );
  return { bedtimes };
}

export interface SleepAssess {
  hours: number;
  goodDuration: boolean;
  beforeTen: boolean;
  status: "ดี" | "ควรปรับ";
  notes: string[];
}

// Mode B: assess actual bedtime/waketime.
export function assessSleep(
  bed: string,
  wake: string,
): { error: string } | SleepAssess {
  const b = toMinutes(bed),
    w = toMinutes(wake);
  if (b === null || w === null) return { error: "เวลาไม่ถูกต้อง (เช่น 22:00)" };
  let dur = w - b;
  if (dur <= 0) dur += 1440; // crossed midnight
  const hours = Math.round((dur / 60) * 10) / 10;
  const goodDuration = hours >= 7 && hours <= 9;
  // before 22:00 means bedtime in [18:00, 22:00]
  const beforeTen = b >= 18 * 60 && b <= 22 * 60;
  const notes: string[] = [];
  if (!beforeTen) notes.push("ครูก้อยแนะนำให้เข้านอนก่อน 4 ทุ่ม (22:00) ช่วงที่ฮอร์โมนซ่อมแซมทำงานดีที่สุด");
  if (hours < 7) notes.push("นอนน้อยไป ควรนอนให้ได้ 7–9 ชั่วโมง");
  if (hours > 9) notes.push("นอนมากผิดปกติ ลองสังเกตคุณภาพการนอน");
  return {
    hours,
    goodDuration,
    beforeTen,
    status: goodDuration && beforeTen ? "ดี" : "ควรปรับ",
    notes,
  };
}
