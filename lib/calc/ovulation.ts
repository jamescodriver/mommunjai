// M2 — Ovulation calculator (client-only, pure). See docs/PRD.md §6 M2.
// Luteal phase assumed ~14 days. fertile window = ovulation -5..+1.

export interface OvulationInput {
  lastPeriodStart: string; // ISO date (yyyy-mm-dd)
  cycleLength: number; // days, 21..35
  lutealLength?: number; // default 14
}

export interface OvulationResult {
  ovulationDate: string;
  fertileStart: string;
  fertileEnd: string;
  peakDate: string;
  nextPeriod: string;
  irregularWarning: boolean;
}

export interface OvulationError {
  error: string;
}

function addDays(iso: string, days: number): string {
  // Parse and format in UTC to avoid timezone shifting the calendar day.
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function calcOvulation(
  input: OvulationInput,
): OvulationResult | OvulationError {
  const { lastPeriodStart, cycleLength } = input;
  const luteal = input.lutealLength ?? 14;

  if (!lastPeriodStart || !/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodStart)) {
    return { error: "กรุณาระบุวันแรกของประจำเดือนล่าสุด" };
  }
  const [sy, sm, sd] = lastPeriodStart.split("-").map(Number);
  const start = new Date(Date.UTC(sy, sm - 1, sd));
  if (Number.isNaN(start.getTime())) return { error: "วันที่ไม่ถูกต้อง" };
  if (start.getTime() > Date.now() + 86400000) {
    return { error: "วันประจำเดือนต้องไม่เป็นวันในอนาคต" };
  }
  if (!Number.isFinite(cycleLength) || cycleLength < 21 || cycleLength > 35) {
    return { error: "ความยาวรอบเดือนควรอยู่ระหว่าง 21–35 วัน" };
  }

  const nextPeriod = addDays(lastPeriodStart, cycleLength);
  const ovulationDate = addDays(nextPeriod, -luteal);
  return {
    ovulationDate,
    peakDate: ovulationDate,
    fertileStart: addDays(ovulationDate, -5),
    fertileEnd: addDays(ovulationDate, 1),
    nextPeriod,
    // Irregular if cycle is at the extreme ends — advise caution.
    irregularWarning: cycleLength < 24 || cycleLength > 32,
  };
}
