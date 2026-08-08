// "จังหวะของวันนี้" — บรรทัดบนสุดของหน้าแรก ปรับตาม stage (PRD §3.3 / R-B1)
//
// 🔴 กฎ R-B1: ถ้าข้อมูลไม่พอคำนวณ ต้องบอกว่าต้องกรอกอะไรเพิ่ม
//    **ห้ามแสดง 0 หรือค่าเดา** — กฎเดียวกับฝั่งเว็บ ("ยังไม่ได้ประเมิน ≠ 0")
import { calcOvulation } from "@shared/calc/ovulation";
import { calcWater } from "@shared/calc/water";
import { calcProtein } from "@shared/calc/protein";
import type { Profile } from "./store";
import { todayISO, daysBetween } from "./store";

export interface Rhythm {
  /** บรรทัดใหญ่ เช่น "วันที่ 12 ของรอบเดือน" */
  headline: string;
  /** บรรทัดรอง เช่น "ช่วงมีโอกาสอีก 3 วัน" — null ได้ถ้าไม่มีอะไรจะบอก */
  sub: string | null;
  /** ถ้าข้อมูลไม่พอ: บอกว่าต้องกรอกอะไร (แทนที่จะเดา) */
  needs?: { label: string; field: "period" | "gestational" | "weight" };
  /** ช่วงมีโอกาสตั้งครรภ์อยู่ในวันนี้ไหม (ใช้เน้นสีการ์ด) */
  inFertileWindow?: boolean;
}

export function buildRhythm(p: Profile): Rhythm {
  const today = todayISO();

  if (p.stage === "pregnant") {
    if (!p.gestationalWeeks || !p.gestationalSetOn) {
      return {
        headline: "ยังไม่รู้อายุครรภ์ของคุณ",
        sub: null,
        needs: { label: "กรอกอายุครรภ์", field: "gestational" },
      };
    }
    // เดินอายุครรภ์ต่อจากวันที่กรอกไว้ ไม่ให้ค้างอยู่ที่ตัวเลขเดิม
    const weeksPassed = Math.floor(daysBetween(p.gestationalSetOn, today) / 7);
    const wk = p.gestationalWeeks + weeksPassed;
    const tri = wk <= 13 ? 1 : wk <= 27 ? 2 : 3;
    return {
      headline: `อายุครรภ์ ${wk} สัปดาห์`,
      sub: `ไตรมาสที่ ${tri}`,
    };
  }

  if (p.stage === "lactating") {
    if (!p.planStartedOn) return { headline: "ช่วงฟื้นฟูหลังคลอด", sub: null };
    const wk = Math.floor(daysBetween(p.planStartedOn, today) / 7);
    return {
      headline: `สัปดาห์ที่ ${wk + 1} ของการดูแลตัวเอง`,
      sub: "ช่วงฟื้นฟูร่างกายคุณแม่",
    };
  }

  if (p.stage === "male") {
    const d = p.planStartedOn ? daysBetween(p.planStartedOn, today) + 1 : 1;
    return {
      headline: `วันที่ ${d} ของแผนบำรุง 90 วัน`,
      sub: "อสุจิใช้เวลาพัฒนาจนสมบูรณ์ราว 90 วัน",
    };
  }

  // prep / infertility — ใช้รอบเดือน
  if (!p.lastPeriodStart) {
    return {
      headline: "ยังไม่รู้จังหวะรอบเดือนของคุณ",
      sub: null,
      needs: { label: "กรอกวันแรกของประจำเดือนล่าสุด", field: "period" },
    };
  }

  const cycleLength = p.cycleLength || 28;
  const res = calcOvulation({ lastPeriodStart: p.lastPeriodStart, cycleLength });
  if ("error" in res) {
    return {
      headline: "ยังคำนวณจังหวะรอบเดือนไม่ได้",
      sub: res.error,
      needs: { label: "แก้ไขวันแรกของประจำเดือน", field: "period" },
    };
  }

  const dayOfCycle = (daysBetween(p.lastPeriodStart, today) % cycleLength) + 1;
  const toFertileStart = daysBetween(today, res.fertileStart);
  const toFertileEnd = daysBetween(today, res.fertileEnd);
  const inWindow = toFertileStart <= 0 && toFertileEnd >= 0;

  let sub: string | null;
  if (inWindow) sub = `กำลังอยู่ในช่วงมีโอกาส (อีก ${toFertileEnd} วัน)`;
  else if (toFertileStart > 0) sub = `ช่วงมีโอกาสอีก ${toFertileStart} วัน`;
  else sub = "ช่วงมีโอกาสของรอบนี้ผ่านไปแล้ว";

  return {
    headline: `วันที่ ${dayOfCycle} ของรอบเดือน`,
    sub,
    inFertileWindow: inWindow,
  };
}

// ── งานประจำวัน ────────────────────────────────────────────────────────────
// 🔴 กฎเหล็ก (PRD §3.3): รายการนี้ **ห้ามเป็นสินค้า** ต้องเป็นพฤติกรรมเท่านั้น
//    สินค้าอยู่ในแผนฉบับเต็มซึ่งต้องผ่าน LINE OA — ไม่ใช่ใน checklist รายวัน

export interface DailyTask {
  key: string;
  label: string;
  hint?: string;
}

export function buildTasks(p: Profile): DailyTask[] {
  const tasks: DailyTask[] = [];

  // น้ำ — ใช้เครื่องคำนวณชุดเดียวกับเว็บ
  if (p.weightKg && p.stage) {
    const w = calcWater({ weightKg: p.weightKg, stage: p.stage });
    if (!("error" in w)) {
      tasks.push({
        key: "water",
        label: `ดื่มน้ำ ${w.targetMinMl.toLocaleString()}–${w.targetMaxMl.toLocaleString()} มล.`,
        hint: `ประมาณ ${w.glasses[0]}–${w.glasses[1]} แก้ว`,
      });
    }
  } else {
    tasks.push({ key: "water", label: "ดื่มน้ำให้พอตลอดวัน", hint: "กรอกน้ำหนักเพื่อดูเป้าที่แม่นขึ้น" });
  }

  // โปรตีน — calcProtein รองรับ stage prep/pregnant/lactating/male
  // (infertility ไม่มีใน type ของสูตรโปรตีน จึงเทียบเป็น prep ตามที่เว็บทำ)
  if (p.weightKg && p.stage) {
    const stageForProtein = p.stage === "infertility" ? "prep" : p.stage;
    const pr = calcProtein({ weightKg: p.weightKg, stage: stageForProtein });
    if (!("error" in pr)) {
      tasks.push({
        key: "protein",
        label: `กินโปรตีนให้ถึง ${pr.minGrams}–${pr.maxGrams} ก.`,
        hint: "ไข่ · ปลา · อกไก่ · เต้าหู้",
      });
    }
  } else {
    tasks.push({ key: "protein", label: "กินโปรตีนให้ครบทุกมื้อ", hint: "กรอกน้ำหนักเพื่อดูเป้าที่แม่นขึ้น" });
  }

  // การนอน — เกณฑ์เดียวกับเว็บ (7–9 ชม. · เข้านอนก่อน 22:00)
  tasks.push({ key: "sleep", label: "เข้านอนก่อน 4 ทุ่ม", hint: "นอน 7–9 ชั่วโมง" });

  // ผัก/ผลไม้ — พฤติกรรมพื้นฐาน ไม่ผูกสินค้า
  tasks.push({ key: "veg", label: "กินผัก/ผลไม้อย่างน้อย 2 มื้อ" });

  return tasks;
}

export const STAGE_LABEL: Record<string, string> = {
  prep: "เตรียมตั้งครรภ์",
  infertility: "มีบุตรยาก",
  pregnant: "ตั้งครรภ์แล้ว",
  lactating: "ให้นมบุตร",
  male: "ฝ่ายชาย",
};

export const STAGE_DESC: Record<string, string> = {
  prep: "อยากมีลูก บำรุงร่างกายให้พร้อมล่วงหน้า",
  infertility: "กำลังพยายามอยู่ ต้องการบำรุงเฉพาะทาง",
  pregnant: "ดูแลครรภ์ต่อเนื่อง",
  lactating: "ฟื้นฟูร่างกายหลังคลอด ดูแลตัวคุณแม่",
  male: "บำรุงฝ่ายชาย เตรียมพร้อมไปด้วยกัน",
};
