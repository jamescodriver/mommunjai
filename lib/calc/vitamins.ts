// M6 — Vitamin recommender (pure). See docs/product-catalog-master.md §2–§4.
//
// Catalogue source of truth: docs/product-catalog-master.md (built from the brand's own
// "ชุดเตรียมตั้งครรภ์หญิง ตามสูตรครูก้อย" leaflet + Prod Ins.docx). Prices: docs/product-catalog.md.
// NEVER claim to cure or prevent disease. Never invent a dosage or a price — leave it null
// and say so, so the team notices and fills it in.
import type { Stage } from "./protein";
import type { BmiTier } from "./bmi";
import { BMI_TIER_NOTE } from "./bmi";

/** protein.ts's Stage has no "infertility" (it has no protein range of its own),
 *  but the questionnaire and leads.stage do — so widen it here. */
export type VitaminStage = Stage | "infertility";

// R4 (PRD-UPDATE-R2-2607.md) — "เข้าสู่กระบวนการทางการแพทย์ไหม?", 5 options exactly
// as client wrote them. The Thai label IS the stored/enum value (no separate i18n
// key) — simplest thing that can't drift out of sync with the UI.
export const ART_PLAN_VALUES = ["ยัง", "IUI", "IVF-ICSI", "บำรุงไข่", "เตรียมผนังมดลูก"] as const;
export type ArtPlan = (typeof ART_PLAN_VALUES)[number];

// R8 (PRD-UPDATE-R3-3107.md · TC-08-01/02) — ป้ายที่ "แสดง" เท่านั้น
// ⚠️ ค่าที่เก็บลง DB/tag/analytics ยังเป็น ART_PLAN_VALUES เดิมเป๊ะ ("IVF-ICSI")
// ห้ามเอา label ไปเขียนทับค่า ไม่งั้นข้อมูลเก่าและ lib/tagging.ts จะหลุดทันที
export const ART_PLAN_LABELS: Record<ArtPlan, string> = {
  ยัง: "ยัง",
  IUI: "IUI",
  "IVF-ICSI": "IVF-ICSI (เด็กหลอดแก้ว)",
  บำรุงไข่: "บำรุงไข่",
  เตรียมผนังมดลูก: "เตรียมผนังมดลูก",
};
export function artPlanLabel(v: string): string {
  return ART_PLAN_LABELS[v as ArtPlan] ?? v;
}

/** Old leads (pre-R4) stored "none"|"iui"|"ivf"|"icsi" — map them forward so
 *  existing rows keep reading/rendering correctly. Anything already a valid
 *  new value passes through unchanged; anything unrecognized defaults to "ยัง"
 *  (never throws — this runs on untrusted DB/body data). */
export function mapLegacyArtPlan(v: unknown): ArtPlan {
  if (typeof v === "string" && (ART_PLAN_VALUES as readonly string[]).includes(v)) return v as ArtPlan;
  const s = typeof v === "string" ? v.toLowerCase() : "";
  if (s === "none" || s === "") return "ยัง";
  if (s === "iui") return "IUI";
  if (s === "ivf" || s === "icsi") return "IVF-ICSI";
  return "ยัง";
}

// R2 — "มีบุตรยาก" 7-item checkbox (multi-select; "unsure" is exclusive — see
// app/plan/page.tsx). Values are internal keys; labels are what the UI shows.
export const INFERTILITY_ISSUES = [
  { v: "pcos", label: "PCOS (ถุงน้ำรังไข่)" },
  { v: "diminished_ovary", label: "รังไข่เสื่อมก่อนวัย" },
  { v: "low_hormone", label: "ฮอร์โมนเพศต่ำ" },
  { v: "thin_lining", label: "ผนังมดลูกบาง" },
  { v: "male_factor", label: "ปัญหาจากฝ่ายชาย" },
  { v: "overweight", label: "น้ำหนักเกิน" },
  { v: "unsure", label: "ไม่แน่ใจ" },
] as const;
export type InfertilityIssue = (typeof INFERTILITY_ISSUES)[number]["v"];
export const INFERTILITY_ISSUE_VALUES: InfertilityIssue[] = INFERTILITY_ISSUES.map((i) => i.v);

// ─────────────────────────────────────────────────────────────────────────────
// R3 (PRD-UPDATE-R3-3107.md) — ตัวเลือกของแบบสอบถามที่ logic ฝั่งสินค้าต้องรู้จัก
// เก็บไว้ที่เดียวกับ ART_PLAN_VALUES/INFERTILITY_ISSUES ตามแพตเทิร์นเดิมของโปรเจกต์
// (หน้าจอ · /api/lead · report ล้วน import จากไฟล์นี้ จึงไม่มีทางหลุดจากกัน)
// ─────────────────────────────────────────────────────────────────────────────

/** ช่วงอายุ — ค่าที่เก็บ = ข้อความไทยตรง ๆ เหมือนเดิม (มีข้อมูลเก่าอยู่แล้ว ห้ามเปลี่ยน) */
export const AGE_RANGES = ["ต่ำกว่า 30", "30–34", "35–39", "40+"] as const;

/** R2 · TC-02-01/02 — ช่วงอายุที่ทำให้ได้ A.O.S เพิ่ม (ไข่มีอายุ → เน้นสารต้านอนุมูลอิสระ)
 *  รับทั้ง en-dash "35–39" (ค่าที่ฟอร์มใช้) และ hyphen "35-39" (ข้อมูลที่พิมพ์มือจากหน้า /leads) */
export const AOS_AGE_RANGES = ["35–39", "40+"] as const;
export function isAosAgeRange(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const norm = v.replace(/-/g, "–").trim();
  return (AOS_AGE_RANGES as readonly string[]).includes(norm);
}

/** R4 · TC-04-03 — ความถี่ออกกำลังกาย (ค่าที่เก็บ = v, ที่แสดง = label) */
export const EXERCISE_FREQS = [
  { v: "0", label: "0 ครั้ง/สัปดาห์" },
  { v: "1-2", label: "1–2 ครั้ง/สัปดาห์" },
  { v: "3-4", label: "3–4 ครั้ง/สัปดาห์" },
  { v: "daily", label: "ทุกวัน" },
] as const;
export type ExerciseFreq = (typeof EXERCISE_FREQS)[number]["v"];
export const EXERCISE_FREQ_VALUES: ExerciseFreq[] = EXERCISE_FREQS.map((x) => x.v);

/** R4 — PCOS 3 สถานะ แทน boolean เดิม
 *  "unsure" = ผู้ใช้ติ๊ก "ไม่แน่ใจ" → **ไม่แนะนำ PCO-VIT** แต่ชวนไปตรวจยืนยันกับแพทย์
 *  (คอลัมน์ has_pcos เดิมยังถูกเขียนคู่กันไว้ที่ /api/lead: has_pcos = pcos_status === "yes") */
export const PCOS_STATUS_VALUES = ["yes", "unsure", "no"] as const;
export type PcosStatus = (typeof PCOS_STATUS_VALUES)[number];

/** R6 · R7 — พฤติกรรมฝ่ายชาย (เลือกได้หลายข้อ) */
export const MALE_BEHAVIORS = [
  { v: "smoke", label: "สูบบุหรี่" },
  { v: "alcohol", label: "ดื่มแอลกอฮอล์" },
  { v: "stress", label: "เครียด" },
] as const;
export type MaleBehavior = (typeof MALE_BEHAVIORS)[number]["v"];
export const MALE_BEHAVIOR_VALUES: MaleBehavior[] = MALE_BEHAVIORS.map((x) => x.v);

/** R9 · TC-09-01/03 — "ท้องด้วยวิธีไหน" เริ่ม 2 ตัวเลือก แต่ต้องเติมข้อ 3 ได้โดยแก้ที่เดียว
 *  (เช่น IUI / บำรุงไข่ ตาม P2 ใน PRD) — logic ทุกที่อ่านจาก array นี้ ห้าม hardcode ซ้ำ */
export const CONCEPTION_METHODS = ["ท้องธรรมชาติ", "ท้องด้วย ICSI"] as const;
export type ConceptionMethod = (typeof CONCEPTION_METHODS)[number];

export interface VitaminProfile {
  stage: VitaminStage;
  hasPcos: boolean;
  artPlan: ArtPlan;
  /** R2 — only meaningful when stage === "infertility"; other stages leave it empty. */
  infertilityIssues?: InfertilityIssue[];
  /** R3 — internal-only qualitative signal from height+weight; never a raw BMI number. */
  weightTier?: BmiTier;
  /** R2 (R3 rev.) — ช่วงอายุ 35–39 / 40+ เพิ่ม A.O.S (ยังต้องผ่าน allowedIn() ตามปกติ) */
  ageRange?: string;
  /** R4 — 3 สถานะ; ถ้าไม่ส่งมาจะ fallback ไป hasPcos/issues เพื่อ backward compat */
  pcosStatus?: PcosStatus;
  /** R6 — พฤติกรรมของผู้กรอกเอง เมื่อ stage === "male" */
  behaviors?: MaleBehavior[];
  /** R7 — พฤติกรรมของ "คู่" (ฝ่ายชาย) เมื่อผู้หญิง stage infertility ติ๊ก male_factor
   *  แยกจาก behaviors เพราะเป็นคนละคน ห้ามปนกัน */
  partnerBehaviors?: MaleBehavior[];
  /** R9 — เบาหวานขณะตั้งครรภ์ → ต้องมีข้อความให้อยู่ในการดูแลของแพทย์ */
  hasGdm?: boolean;
}

/** Which life stages this product must be stopped in — from the Safety Matrix (§4). */
export interface StopRules {
  ovulation?: boolean;       // หยุดช่วงวันไข่ตก
  embryoTransfer?: boolean;  // หยุดหลังใส่ตัวอ่อน
  pregnant?: boolean;        // หยุดช่วงตั้งครรภ์
  lactating?: boolean;       // หยุดช่วงให้นม
}

export type ProductGroup = "core" | "targeted" | "nutrition" | "external";

export interface Product {
  id: string;
  name: string;
  /** null = ยังไม่มีราคายืนยันในเอกสาร — UI ต้องแสดง "สอบถามราคา" ห้ามเดา */
  price: number | null;
  why: string;
  detail?: string;
  howto?: string;
  group?: ProductGroup;
  stop?: StopRules;
  /** ข้อควรระวังที่ต้องแสดงเสมอ (แพ้อาหาร, โรคประจำตัว, ใช้ภายนอก ฯลฯ) */
  caution?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ชุดเตรียมตั้งครรภ์หญิง — 19 รายการตาม leaflet + PCO-VIT
// ─────────────────────────────────────────────────────────────────────────────
export const PRODUCTS: Record<string, Product> = {
  // ---------- แกนหลัก ----------
  ovaall: {
    id: "ovaall", name: "OvaAll วิตามินโอวาออลล์", price: 2490, group: "core",
    why: "วิตามินรวมบำรุงไข่ ครบในซองเดียว",
    detail: "โฟลิก 400mcg · CoQ10 30mg · น้ำมันปลา 500mg · มัลติวิตามิน&แร่ธาตุ 21 ชนิด",
    howto: "วันละ 1 ซอง (4 เม็ด) พร้อมอาหารมื้อใดก็ได้ · เริ่มล่วงหน้าอย่างน้อย 3 เดือน",
    caution: "ตั้งครรภ์แล้วทานต่อได้ภายใต้คำแนะนำแพทย์",
  },
  ferty: {
    id: "ferty", name: "Ferty โปรตีนเฟอร์ตี้", price: 1590, group: "core",
    why: "โปรตีนพืช + มัลติวิตามิน/แร่ธาตุ + superfood 33 ชนิด บำรุงไข่และผนังมดลูก",
    detail: "1 ซอง = โปรตีน 25 กรัม · มีโฟลิก/CoQ10/วิตามินดี/บีรวม/อิโนซิทอล",
    howto: "วันละ 2 ซอง (เช้า/เย็น) ชงน้ำ นมแพะ หรือนมอัลมอนด์ · ผนังมดลูกบางไม่ถึง 7 มม. ใช้วันละ 3 ซอง",
  },
  collatelo: {
    id: "collatelo", name: "Colla Telo คอลลา เทโล", price: 1990, group: "core",
    why: "คอลลาเจน Type 1&3 ช่วยบำรุงไข่และเตรียมผนังมดลูก",
    detail: "Wellnex (ญี่ปุ่น) + Collective (ฝรั่งเศส) + Delphinol สารสกัดมากิเบอร์รี",
    howto: "วันละ 1 ซอง ละลายน้ำอุณหภูมิปกติ/เย็น 250 มล. หลังตื่นนอนทันทีหรือช่วงท้องว่าง · เร่งฟื้นฟู 2 ซอง",
    caution: "⚠️ มีส่วนประกอบจากปลา — ผู้แพ้อาหารทะเลต้องระวัง",
  },
  ferti9oil: {
    id: "ferti9oil", name: "Ferti 9 Oil เฟอร์ติ ไนน์ ออยล์", price: 1590, group: "core",
    why: "9 น้ำมันดี ตั้งต้นฮอร์โมนเพศหญิง บำรุงมดลูก",
    detail: "อีฟนิ่งพริมโรส · มะรุม DHA · สาหร่าย · ฟักทอง · แฟล็กซีด",
    howto: "วันละ 2 เม็ด พร้อมอาหาร หรือพร้อม OvaAll · ช่วงกระตุ้นไข่ 4 เม็ด · เตรียมผนังบาง 2–4 เม็ด",
    caution: "ใส่ตัวอ่อนแล้วลดเหลือวันละ 1–2 เม็ด · ทานยาวถึงช่วงให้นมได้",
  },

  // ---------- เสริมตามโปรไฟล์ ----------
  pcovit: {
    id: "pcovit", name: "PCO-VIT พีซีโอวิท", price: 1990, group: "targeted",
    why: "สำหรับผู้ที่ต้องการดูแลสมดุลในกลุ่ม PCOS (เสริมโภชนาการ ไม่ใช่ยารักษา)",
    howto: "ทานคู่กับการดูแลเรื่องน้ำตาล",
    caution: "ถ้าใช้ยาอยู่ ปรึกษาแพทย์/เภสัชกรก่อน",
  },
  aos: {
    id: "aos", name: "A.O.S เอ โอ เอส", price: 1690, group: "targeted",
    why: "สารต้านอนุมูลอิสระเข้มข้น ดูแลคุณภาพไข่และตัวอ่อน",
    detail: "AstaZine astaxanthin (ญี่ปุ่น) + SOD (ฝรั่งเศส) + NMN องุ่นแดง รวม 10 ชนิด",
    howto: "วันละ 2 แคปซูล หลังตื่นนอน (active dose แอสตาแซนธิน ~12 มก./วัน)",
    stop: { embryoTransfer: true, pregnant: true },
  },
  varginaree: {
    id: "varginaree", name: "Varginaree วาร์จินนารี", price: 1990, group: "targeted",
    why: "ดูแลภายในสตรี 3 ระบบ — สมดุลฮอร์โมน ภายใน และผิว",
    detail: "Solgen ES + ไฟโตเอสโตรเจน 14 ชนิด (ตังกุย/โสม)",
    howto: "วันละ 1–2 แคปซูล ก่อนนอน · ไข่เสื่อม/เอสโตรเจนต่ำ หรือเตรียมผนัง ใช้ 2 เม็ด",
    stop: { embryoTransfer: true, pregnant: true, lactating: true },
  },
  nightshot: {
    id: "nightshot", name: "Night Shot ไนท์ ชอท", price: 1590, group: "targeted",
    why: "วิตามินน้ำช่วยเรื่องการนอน — การนอนดีคือฐานของฮอร์โมน",
    detail: "Pharmagaba (ญี่ปุ่น) + L-Theanine AlphaWave (สหรัฐฯ) + ซิงก์ + แบล็คเคอแรนท์",
    howto: "วันละ 1 ซอง 30 นาทีก่อนนอน",
    caution: "อาจทำให้ง่วง — ไม่ควรขับรถหลังทาน",
  },

  // ---------- โภชนาการเสริม ----------
  phytocrystalc: {
    id: "phytocrystalc", name: "Phyto Crystal C ไฟโตคริสตัลซี", price: null, group: "nutrition",
    why: "วิตามินซีจากผลไม้ 16 ชนิด ปกป้องเซลล์ไข่และเสริมภูมิคุ้มกัน",
    detail: "3 รส: องุ่นไซบัคคัล · ลิ้นจี่ · ส้มสีเลือด",
    howto: "วันละ 2–3 ซอง ผสมน้ำ 150 มล. · หลังตื่นนอนหรือช่วงท้องว่าง",
  },
  kaffirshot: {
    id: "kaffirshot", name: "น้ำมะกรูด Shot 100%", price: 600, group: "nutrition",
    why: "สารต้านอนุมูลอิสระ 3 ชนิด ช่วยการไหลเวียนเลือด",
    detail: "ไบโอฟลาโวนอยด์ · เควอซิทิน · วิตามินซี",
    howto: "วันละ 1–2 ขวด ผสมน้ำเจือจางหรือแบ่งทานได้ · ควรดูดผ่านหลอดเพื่อลดการสึกกร่อนของฟัน",
    stop: { embryoTransfer: true, pregnant: true },
    caution: "ผู้เป็นโรคกระเพาะหรือกรดไหลย้อน ไม่แนะนำ · เก็บตู้เย็น 20 วัน / ช่องฟรีซ 1 ปี",
  },
  kaffirhoney: {
    id: "kaffirhoney", name: "น้ำมะกรูด 70% + น้ำผึ้งชันโรง", price: 2376, group: "nutrition",
    why: "ต้านอนุมูลอิสระ บำรุงเลือด และมีโพรไบโอติกส์ธรรมชาติ",
    howto: "วันละ 1–2 ขวด หรือผสมกับสูตรคั้นสด 100%",
    caution: "เปิดขวดแล้วเก็บในตู้เย็น",
  },
  goodgrain: {
    id: "goodgrain", name: "Good Grain ธัญพืชออร์แกนิค", price: 550, group: "nutrition",
    why: "โปรตีนและกรดไขมันดี เสริมผนังมดลูก",
    detail: "อัลมอนด์ · แฟล็กซีด · ลูกเดือย",
    howto: "ผสมกับ Ferty 2 ช้อนชาพูน",
    caution: "เปิดแล้วแช่เย็น (ไม่มีสารกันบูด)",
  },
  pureblack: {
    id: "pureblack", name: "Pure Black งาดำออร์แกนิค", price: 450, group: "nutrition",
    why: "เซซามินและแคลเซียม ช่วยเรื่องสมดุลฮอร์โมน",
    howto: "ผสมกับ Ferty 2 ช้อนชาพูน",
    caution: "เปิดแล้วแช่เย็น",
  },
  pureseed: {
    id: "pureseed", name: "Pure Seed เมล็ดฟักทองอบ", price: 500, group: "nutrition",
    why: "โปรตีนพืช วิตามินอี และซิงก์ บำรุงทั้งไข่และสเปิร์ม",
    howto: "วันละ 1 กำมือ · โรยข้าว ผสมซุป หรือปั่นรวมกับโปรตีนได้",
    caution: "แนะนำให้สามีทานด้วย (ซิงก์บำรุงสเปิร์ม)",
  },
  purered: {
    id: "purered", name: "Pure Red ผงผักเพียวเรด", price: 550, group: "nutrition",
    why: "ต้านอนุมูลอิสระและช่วยการไหลเวียนเลือด มีโฟเลตช่วยสร้างเม็ดเลือด",
    detail: "แครอท · ทับทิม · มะเขือเทศ · บีทรูท",
    howto: "น้ำมะเขือเทศ 1 กล่อง + ผง 2 ช้อนชา · ช่วงท้องว่างดีที่สุด",
    caution: "เปิดแล้วแช่เย็น",
  },
  puregreen: {
    id: "puregreen", name: "Pure Green ผงผักเพียวกรีน", price: 550, group: "nutrition",
    why: "คลอโรฟิลล์สูง ช่วยดีท็อกซ์",
    detail: "อัลฟาฟา · สาหร่าย · มะรุม · วีทกลาส",
    howto: "น้ำมะเขือเทศ 1 กล่อง + ผง 2 ช้อนชา",
    stop: { embryoTransfer: true, pregnant: true },
    caution: "เปิดแล้วแช่เย็น",
  },
  ginger: {
    id: "ginger", name: "Gold Ginger & ขิงดำ", price: 650, group: "nutrition",
    why: "จินเจอรอลต้านอนุมูลอิสระ ช่วยให้มดลูกอุ่น",
    howto: "ดื่มวันละ 1–2 แก้ว (ขิง 1 ซอง)",
    caution: "ช่วงตั้งครรภ์ทานขิงดำได้ (ช่วยเรื่องแพ้ท้อง)",
  },
  probiotics: {
    id: "probiotics", name: "Ferty Probiotics โพรไบโอติกส์", price: 1990, group: "nutrition",
    why: "ปรับสมดุลลำไส้และภายใน",
    detail: "9 สายพันธุ์ HAWARU (สหรัฐฯ) + Morinaga (ญี่ปุ่น) + พรีไบโอติก",
    howto: "วันละ 1 ซอง หลังอาหารเย็น 2 ชั่วโมง",
    caution: "เก็บตู้เย็นเพื่อรักษาจุลินทรีย์",
  },
  safflower: {
    id: "safflower", name: "ดอกคำฝอยออร์แกนิค", price: 250, group: "nutrition",
    why: "คาร์ทามินช่วยการไหลเวียนและเคลียร์เลือดเก่าค้างในมดลูก",
    howto: "ดอกคำฝอย 1 หยิบมือ + น้ำร้อน 250 มล. · ทานช่วงเริ่มมีประจำเดือน 7–10 วัน",
    stop: { ovulation: true, embryoTransfer: true, pregnant: true },
  },

  // ---------- ใช้ภายนอก ----------
  castoroil: {
    id: "castoroil", name: "น้ำมันละหุ่งออร์แกนิคสกัดเย็น (+ ผ้าคอตตอนแฟลนเนล)", price: 385, group: "external",
    why: "แพ็คน้ำมันละหุ่ง ช่วยการไหลเวียนเลือดบริเวณมดลูก",
    howto: "ชุบผ้าคอตตอนแฟลนเนล วางบนหน้าท้อง + กระเป๋าน้ำร้อน 45–60 นาที · ทำช่วงหมดประจำเดือน 2–3 วัน/ครั้ง",
    stop: { ovulation: true, embryoTransfer: true, pregnant: true },
    caution: "‼️ ใช้ภายนอกเท่านั้น ห้ามรับประทาน · ผ้าคอตตอนแฟลนเนลแยกจำหน่าย ฿295",
  },

  // ---------- อาหาร/เครื่องดื่มบำรุง (เพิ่มรอบ R3) ----------
  // ราคาจาก docs/product-catalog.md · ทั้ง 3 ตัวยังไม่มี howto — ดู NO_DOSAGE_YET ด้านล่าง
  goatmilk: {
    id: "goatmilk", name: "นมแพะคัดเกรด Goats Milk", price: 650, group: "nutrition",
    why: "แคลเซียมและโปรตีนจากนมแพะ ย่อยง่ายกว่านมวัวสำหรับบางคน",
    // TODO(dosage): แบรนด์ยังไม่ยืนยันวิธีรับประทาน/ปริมาณต่อวัน — client อนุมัติให้
    // แสดงสินค้าโดยไม่มีวิธีทานไปก่อน (PRD R3 §Reversals · คอมเมนต์ TC-06-08 / TC-10-04)
    // ห้ามเดาเอง: เติมเมื่อทีมครูก้อยส่ง dosage มา (Open Question #2)
  },
  blackchickensoup: {
    id: "blackchickensoup", name: "ซุปไก่ดำ BY ครูก้อยเข้าครัว", price: 1800, group: "nutrition",
    why: "อาหารบำรุงกำลังสำหรับช่วงฟื้นฟูร่างกาย",
    // TODO(dosage): ยังไม่มีวิธีรับประทานยืนยันจากแบรนด์ — เหตุผลเดียวกับ goatmilk ข้างบน
  },
  bananaflower: {
    id: "bananaflower", name: "น้ำหัวปลี มามอง", price: 1850, group: "nutrition",
    why: "เครื่องดื่มบำรุงจากหัวปลี นิยมใช้ในช่วงหลังคลอด/ให้นม",
    // TODO(dosage): ยังไม่มีวิธีรับประทานยืนยันจากแบรนด์ — เหตุผลเดียวกับ goatmilk ข้างบน
  },

  // ---------- บำรุงชาย ----------
  motila1: {
    id: "motila1", name: "Motila1 โมทิล่าวัน", price: 1990, group: "core",
    why: "บำรุงสเปิร์มสำหรับฝ่ายชาย",
    // TODO(dosage): 🔄 R3 กลับมติเดิม — เดิม (R2) ถอด Motila1 ออกจากแอปทั้งหมดจนกว่าจะมี
    // dosage ยืนยัน ตอนนี้ client อนุมัติแล้วว่า *"ยินยอมให้แสดงแบบไม่มี Dosage ไปก่อน
    // แต่ mark flag ไว้เติมทีหลัง"* (คอมเมนต์ TC-06-08) → แนะนำได้ แต่ **ห้ามเดา howto เอง**
    // รอทีมครูก้อยยืนยัน (Open Question #2 · product-catalog-master.md §3)
  },
  mzall: {
    id: "mzall", name: "M-Z All", price: 1990, group: "core",
    why: "วิตามินรวมบำรุงชาย",
    // ⚠️ เอกสารการตลาดของแบรนด์เคลม "กันมะเร็งต่อมลูกหมาก / หย่อนสมรรถภาพ / ไม่มีผลข้างเคียง"
    // ห้ามนำมาใส่ในแอป — เป็นการเคลมป้องกันโรค ผิด legal-compliance.md จนกว่าจะมีเลข ฆอ. รองรับ
    howto: "วันละ 1 เม็ด ก่อนนอนหรือเวลาใดก็ได้ (บำรุงต่อเนื่อง) · สูตรเร่งรัด 2 เม็ด ก่อนมีเพศสัมพันธ์ 45 นาที",
  },
  ferta: {
    id: "ferta", name: "Ferta เวย์โปรตีน", price: 1980, group: "core",
    why: "โปรตีนสำหรับฝ่ายชาย",
    howto: "วันละ 2 ซอง ชงกับน้ำเปล่า ก่อนออกกำลังกาย หรือเวลาใดก็ได้",
  },
};

export interface VitaminResult {
  /** ชุดแกนหลัก — ทานประจำทุกวัน */
  core: Product[];
  /** เสริมตามโปรไฟล์ (PCOS / ART / อายุ / พฤติกรรมฝ่ายชาย ฯลฯ) */
  targeted: Product[];
  /** โภชนาการเสริมจากชุดครูก้อย */
  nutrition: Product[];
  /** ใช้ภายนอก */
  external: Product[];
  /** ชุดย่อที่ใช้ในรายงาน 90 วัน (ไม่เทกระจาดทั้ง 19 ตัว) — core + targeted + ชุดตาม artPlan (R3) */
  primary: Product[];
  note: string;
  /** คำเตือนระดับโปรไฟล์ จาก Safety Matrix */
  cautions: string[];
}

/** สินค้าที่ "อนุมัติให้แนะนำได้ทั้งที่ยังไม่มีวิธีรับประทาน" (R3 §Reversals · คอมเมนต์ TC-06-08)
 *  ทุก id ในลิสต์นี้ต้องมี `TODO(dosage)` กำกับไว้ใน PRODUCTS ด้านบน
 *  ⚠️ ห้ามเพิ่มชื่อใหม่เข้ามาเองโดยไม่มีคำยืนยันจากทีมครูก้อย — unit test ใช้ลิสต์นี้เป็น
 *  ข้อยกเว้น *เดียว* ของกฎเดิม "ทุกสินค้าที่แนะนำต้องมี howto" */
export const NO_DOSAGE_YET: string[] = ["motila1", "goatmilk", "blackchickensoup", "bananaflower"];

// ─────────────────────────────────────────────────────────────────────────────
// R12 · TS-12 — ตาราง product mapping ของ "มีบุตรยาก" (คัดจากตารางที่ทีมครูก้อยให้ ตรงช่อง)
// ทุกการแก้ mapping ให้แก้ที่ 2 ค่านี้ที่เดียว แล้ว unit test จะไล่ตรวจทีละแถวให้เอง
// ─────────────────────────────────────────────────────────────────────────────

/** ชุดพื้นฐาน (base 4) ของทุกคนที่อยู่ stage "มีบุตรยาก"
 *  หมายเหตุ "น้ำมะกรูด" = SKU **Shot 100% (฿600)** ไม่ใช่สูตร 70%+น้ำผึ้งชันโรง (฿2,376)
 *  — สมมติฐานที่ระบุไว้ใน PRD Open Question #1 (non-blocking) แก้ได้ที่บรรทัดนี้จุดเดียว */
export const INFERTILITY_BASE_SET: string[] = ["ferty", "ovaall", "kaffirshot", "ferti9oil"];

/** สินค้าที่ "เพิ่ม" ต่อจาก base 4 ตามปัญหาที่ติ๊ก (union แบบ dedupe เมื่อติ๊กหลายข้อ) */
export const INFERTILITY_PRODUCT_MAP: Record<InfertilityIssue, string[]> = {
  pcos: ["pcovit"],                          // TC-12-01 — ยืนยันแล้วว่า *ไม่* มี Colla Telo/Varginaree
  diminished_ovary: ["varginaree"],          // TC-12-02
  low_hormone: ["varginaree"],               // TC-12-03
  thin_lining: ["collatelo", "varginaree"],  // TC-12-04
  male_factor: ["ferta", "mzall", "motila1"],// TC-07-01 (+ A.O.S ถ้าคู่ติ๊ก "เครียด" — ดู R6/R7)
  overweight: ["pcovit"],                    // TC-13-02 (+ คำแนะนำโภชนาการ/ออกกำลังกายใน cautions)
  unsure: [],                                // TC-12-06 — base 4 เท่านั้น
};

/** R3 · TS-03 — "เตรียมผนังมดลูก" ได้ชุดเฉพาะ 4 ตัว
 *  ⚠️ ผูกกับ **ค่า artPlan** ไม่ใช่ stage === "prep" เพราะ R5 ตัดคำถาม ART ออกจาก prep แล้ว
 *  ถ้าไปผูกกับ stage กฎนี้จะไม่มีวันทำงาน (ดู PRD §Reversals ย่อหน้า "ผลพวงที่ต้องรู้") */
export const LINING_PREP_SET: string[] = ["collatelo", "safflower", "castoroil", "probiotics"];

/** R10/R11 — ชุดสินค้าประจำ stage ตั้งครรภ์/ให้นม
 *  🔒 ต้องตรงกับ PREGNANCY_PRODUCT_IDS / LACTATION_PRODUCT_IDS ใน lib/calc/pregnancy.ts
 *  และ lactation.ts เป๊ะ (มีเทสต์ล็อกไว้) — ประกาศซ้ำที่นี่เพื่อเลี่ยง circular import
 *  เพราะ 2 โมดูลนั้น import productsForStage() จากไฟล์นี้อยู่แล้ว
 *  ⚠️ น้ำหัวปลีของ pregnant ถูกเพิ่มตามอายุครรภ์ ≥16 สัปดาห์ในชั้น R10 ไม่ใช่ที่นี่ */
export const STAGE_CORE_PREGNANT: string[] = ["goatmilk", "ferty", "ferti9oil", "probiotics"];
export const STAGE_CORE_LACTATING: string[] = [
  "goatmilk", "ferty", "ferti9oil", "probiotics", "bananaflower", "ginger", "blackchickensoup",
];

/** ตัดสินค้าที่ต้องหยุดสำหรับช่วงชีวิตนี้ออก (Safety Matrix §4)
 *  🔒 นี่คือด่านความปลอดภัยเดียวของไฟล์นี้ — ทุกกฎใหม่ต้องไหลผ่านฟังก์ชันนี้เสมอ
 *  ห้ามมีเส้นทางไหน push สินค้าเข้าผลลัพธ์โดยข้าม keep() ท้ายฟังก์ชัน */
function allowedIn(stage: VitaminStage, p: Product): boolean {
  if (stage === "pregnant" && p.stop?.pregnant) return false;
  if (stage === "lactating" && p.stop?.lactating) return false;
  return true;
}

/** R10/R11 — ชุดสินค้าของ "หน้าความรู้" (ตั้งครรภ์ / ให้นมบุตร)
 *  🔒 ต้องไหลผ่าน allowedIn() เหมือนทุกเส้นทางที่แนะนำสินค้า — ห้ามให้หน้าความรู้
 *  หยิบ PRODUCTS ตรง ๆ ไม่งั้น Safety Matrix จะถูกข้าม (เช่น Varginaree ที่ stop.lactating)
 *  คืนตามลำดับ id ที่ส่งเข้ามา · ตัด id ที่ไม่มีจริงและตัวซ้ำออกให้ */
export function productsForStage(stage: VitaminStage, ids: string[]): Product[] {
  return dedupe(byId(ids)).filter((x) => allowedIn(stage, x));
}

/** R6 · TC-06-03..07 — กฎสินค้าจากพฤติกรรม 3 ข้อ (คอมเมนต์ TC-06-07 ระบุ `>= 2` ชัดเจน)
 *    ติ๊ก >= 2 ข้อ            → A.O.S + Motila1
 *    มิฉะนั้น ติ๊ก "เครียด"      → A.O.S
 *    มิฉะนั้น ติ๊กบุหรี่/ดื่ม     → Motila1
 *  ใช้ Set เพื่อกันค่าซ้ำจาก client (["stress","stress"] ต้องนับเป็น 1 ไม่ใช่ 2) */
export function behaviorProductIds(behaviors?: MaleBehavior[] | string[]): string[] {
  const picked = new Set(
    (behaviors || []).filter((b): b is MaleBehavior => (MALE_BEHAVIOR_VALUES as string[]).includes(b as string)),
  );
  if (picked.size >= 2) return ["aos", "motila1"];
  if (picked.has("stress")) return ["aos"];
  if (picked.has("smoke") || picked.has("alcohol")) return ["motila1"];
  return [];
}

/** R4 — สรุปสถานะ PCOS จากทุกทางเข้า (ช่องใหม่ 3 สถานะ / checklist / boolean เดิม)
 *  ลำดับความสำคัญ: checklist ของ "มีบุตรยาก" > ช่อง pcos_status ใหม่ > has_pcos เดิม
 *  (ข้อมูลเก่าที่มีแต่ has_pcos จึงยังทำงานเหมือนเดิมทุกประการ) */
export function resolvePcosStatus(p: {
  pcosStatus?: PcosStatus;
  hasPcos?: boolean;
  infertilityIssues?: InfertilityIssue[];
}): PcosStatus {
  if (p.infertilityIssues?.includes("pcos")) return "yes";
  if (p.pcosStatus && (PCOS_STATUS_VALUES as readonly string[]).includes(p.pcosStatus)) return p.pcosStatus;
  return p.hasPcos ? "yes" : "no";
}

const byId = (ids: string[]): Product[] => ids.map((id) => PRODUCTS[id]).filter(Boolean);
const dedupe = (list: Product[]): Product[] => Array.from(new Map(list.map((x) => [x.id, x])).values());

export function recommendVitamins(p: VitaminProfile): VitaminResult {
  const issues = p.infertilityIssues || [];
  const pcosStatus = resolvePcosStatus(p);
  const effectivePcos = pcosStatus === "yes";
  // R2 — กฎอายุใหม่: 35–39 / 40+ → A.O.S (เดิมผูกกับ artPlan/stage เท่านั้น)
  const agedAos = isAosAgeRange(p.ageRange);
  // R3 — ชุด "เตรียมผนังมดลูก" ผูกกับค่า artPlan ไม่ใช่ stage
  // ไม่ใช้กับ stage "male": คำถาม ART ของฝ่ายชายถามถึงการรักษา *ของคู่* สินค้าบำรุงผนังมดลูก
  // จึงไม่ควรไปโผล่ในแผนของเขาเอง (จุดที่ PRD ไม่ได้ระบุ — บันทึกไว้เพื่อให้ทีมเคาะทีหลังได้)
  const liningPrep = p.artPlan === "เตรียมผนังมดลูก" && p.stage !== "male";

  const keep = (list: Product[]) => dedupe(list).filter((x) => allowedIn(p.stage, x));
  const cautions: string[] = [];

  // ── stage "ฝ่ายชาย" ────────────────────────────────────────────────────────
  if (p.stage === "male") {
    const core = byId(["mzall", "ferta"]);
    // R6 — พฤติกรรม + อายุ เพิ่มของเข้ากลุ่ม targeted (ผ่าน keep() เหมือนกลุ่มอื่น)
    const targeted = byId(behaviorProductIds(p.behaviors));
    if (agedAos) targeted.push(PRODUCTS.aos);
    if (p.artPlan !== "ยัง") targeted.push(PRODUCTS.aos);
    const nutrition = byId(["pureseed"]);

    const c = keep(core);
    const t = keep(targeted);
    if (p.artPlan !== "ยัง") {
      cautions.push("คู่ของคุณอยู่ระหว่างวางแผนกับแพทย์ — ปรึกษาแพทย์ที่ดูแลก่อนเริ่มอาหารเสริมทุกตัว");
    }
    return {
      core: c, targeted: t, nutrition: keep(nutrition), external: [],
      primary: dedupe([...c, ...t, ...keep(nutrition)]),
      note: "บำรุงฝ่ายชายควบคู่ฝ่ายหญิง เพื่อเตรียมความพร้อมของร่างกายทั้งคู่ · ทานต่อเนื่องได้ในฐานะอาหารเสริม หากมีโรคประจำตัวหรือใช้ยาอยู่ ปรึกษาแพทย์/เภสัชกรก่อน",
      cautions,
    };
  }

  // ── stage ฝ่ายหญิง ─────────────────────────────────────────────────────────
  const targeted: Product[] = [];
  let core: Product[];

  if (p.stage === "infertility") {
    // R12 — ยึดตาราง mapping ของทีมเป๊ะ: base 4 + ของที่เพิ่มตามปัญหาที่ติ๊ก
    core = byId(INFERTILITY_BASE_SET);
    for (const issue of issues) targeted.push(...byId(INFERTILITY_PRODUCT_MAP[issue] || []));
    // R7 — ติ๊ก "ปัญหาจากฝ่ายชาย" แล้วคู่กรอกฟอร์มฝ่ายชายมาด้วย: กฎพฤติกรรม R6 ทำงานกับ
    // ข้อมูลชุดนั้น (ติ๊ก "เครียด" → A.O.S เข้ารายการ ตามตาราง R12 แถว "ปัญหาจากฝ่ายชาย")
    if (issues.includes("male_factor")) targeted.push(...byId(behaviorProductIds(p.partnerBehaviors)));
    // ข้อมูลเก่า/resume ที่มีแต่ has_pcos และ *ยังไม่ได้ตอบเช็กลิสต์เลย* — ยังควรได้ PCO-VIT
    // เหมือนที่เคยได้ แต่ถ้าตอบเช็กลิสต์แล้ว ให้เช็กลิสต์เป็นใหญ่เสมอ (TC-12-06: ติ๊ก
    // "ไม่แน่ใจ" ต้องได้ base 4 เท่านั้น แม้ has_pcos เดิมจะเป็น true)
    if (effectivePcos && issues.length === 0) targeted.push(PRODUCTS.pcovit);
  } else if (p.stage === "pregnant" || p.stage === "lactating") {
    // 🔒 R10/R11 — 2 stage นี้มีชุดสินค้าของตัวเองตาม PRD
    // เดิมตกลงมาที่ else-branch ของ prep ทำให้แม่ท้อง/ให้นมเห็น "วิตามินที่แนะนำสำหรับคุณ"
    // เป็น OvaAll ("บำรุงไข่") + Colla Telo ("เตรียมผนังมดลูก") อยู่เหนือบล็อกความรู้ที่
    // แนะนำอีกชุดหนึ่ง = สินค้า 2 ชุดขัดกันในหน้าเดียว ซึ่งคือ Problem Statement ของ R3 เอง
    // (Lucifer red-team 31/7) — รายการต้องตรงกับ PREGNANCY_PRODUCT_IDS / LACTATION_PRODUCT_IDS
    // ใน lib/calc/pregnancy.ts และ lactation.ts · มีเทสต์ล็อกไว้ไม่ให้ 2 ที่หลุดจากกัน
    core = byId(p.stage === "pregnant" ? STAGE_CORE_PREGNANT : STAGE_CORE_LACTATING);
  } else {
    // prep — ชุดเดิมของแบรนด์ตามที่ทำมาตั้งแต่ R2
    core = byId(["ovaall", "ferty", "collatelo", "ferti9oil"]);
    if (effectivePcos) targeted.push(PRODUCTS.pcovit);
    targeted.push(PRODUCTS.varginaree, PRODUCTS.nightshot);
  }

  if (p.artPlan !== "ยัง") targeted.push(PRODUCTS.aos);
  if (agedAos) targeted.push(PRODUCTS.aos); // R2 — dedupe ด้านล่างทำให้ปรากฏครั้งเดียว (TC-02-04)
  if (liningPrep) targeted.push(...byId(LINING_PREP_SET));

  const nutrition = byId([
    "phytocrystalc", "pureseed", "goodgrain", "pureblack",
    "purered", "puregreen", "kaffirshot", "kaffirhoney",
    "ginger", "probiotics", "safflower",
  ]);
  const external = byId(["castoroil"]);

  const c = keep(core);
  const t = keep(targeted).filter((x) => !c.some((y) => y.id === x.id));
  const usedIds = new Set([...c, ...t].map((x) => x.id));
  // สินค้าที่ถูกยกขึ้นไปเป็น core/targeted แล้ว ไม่ต้องโชว์ซ้ำในกลุ่มโภชนาการ/ใช้ภายนอก
  const n = keep(nutrition).filter((x) => !usedIds.has(x.id));
  const e = keep(external).filter((x) => !usedIds.has(x.id));

  // ----- cautions (Safety Matrix + เส้นแดง compliance) -----
  if (p.artPlan !== "ยัง") {
    cautions.push(
      "คุณอยู่ระหว่างวางแผนกับแพทย์ — ปรึกษาแพทย์ที่ดูแลคุณก่อนเริ่มอาหารเสริมทุกตัว เพราะอาจมีผลต่อยาที่ได้รับ",
      "หลังใส่ตัวอ่อนแล้วต้องหยุด: A.O.S · น้ำมะกรูด Shot · Pure Green · Varginaree · ดอกคำฝอย · แพ็คน้ำมันละหุ่ง (Ferti 9 Oil ลดเหลือวันละ 1–2 เม็ด)",
    );
  }
  // คำเตือนนี้พูดถึง "ช่วงวันไข่ตก" จึงมีความหมายเฉพาะคนที่กำลังพยายามมีลูก
  // เดิม push แบบไม่มีเงื่อนไข → แม่ให้นมและคนตั้งครรภ์ได้อ่านคำเตือนเรื่องวันไข่ตก
  // ทั้งที่สินค้า 2 ตัวนี้ถูก Safety Matrix กรองออกจากชุดของเขาไปแล้วด้วยซ้ำ
  // (ต้นเจอเอง 1/8/2026 ตอนไล่ดูหน้า teaser ของ "ให้นมบุตร")
  if (!["pregnant", "lactating"].includes(p.stage)) {
    cautions.push("ช่วงวันไข่ตก ให้หยุดดอกคำฝอยและแพ็คน้ำมันละหุ่ง");
  }
  // R3 · TC-03-02 🔒 — ดอกคำฝอย/น้ำมันละหุ่งเป็นตัวกระตุ้นมดลูก และ "เตรียมผนัง" มักอยู่ใกล้
  // ช่วงใส่ตัวอ่อนมาก คำเตือนจึงต้องมาพร้อมคำแนะนำเสมอ ห้ามหายไปเพราะกฎใหม่นี้
  if (liningPrep) {
    cautions.push(
      // ⚠️ ห้ามใส่ markdown (**bold**) — report-view.tsx render cautions เป็น plain text
      // ผู้ใช้จะเห็นดอกจันโผล่กลางคำเตือนที่สำคัญที่สุดในแอป
      "ชุดเตรียมผนังมดลูก: ดอกคำฝอยและแพ็คน้ำมันละหุ่ง ต้องหยุดทันที เมื่อถึงวันไข่ตก · หลังใส่ตัวอ่อน · และตลอดช่วงตั้งครรภ์",
      "น้ำมันละหุ่งใช้ประคบภายนอกเท่านั้น ห้ามรับประทาน",
    );
  }
  if (p.stage === "pregnant") cautions.push("รายการที่ต้องหยุดช่วงตั้งครรภ์ถูกตัดออกจากคำแนะนำนี้แล้ว");
  if (p.stage === "lactating") cautions.push("รายการที่ต้องหยุดช่วงให้นมถูกตัดออกจากคำแนะนำนี้แล้ว");
  // R4 — "ไม่แน่ใจ" ต้องไม่ได้ PCO-VIT และต้องไม่ถูกบอกว่า "คุณเป็น PCOS"
  if (pcosStatus === "unsure") {
    cautions.push("คุณระบุว่ายังไม่แน่ใจเรื่องภาวะ PCOS — แนะนำตรวจยืนยันกับแพทย์ก่อนค่ะ เราจึงยังไม่แนะนำวิตามินเฉพาะกลุ่ม PCOS ให้");
  }
  // R9 🔒 — เบาหวานขณะตั้งครรภ์ต้องอยู่ในการดูแลของแพทย์ ห้ามให้คำแนะนำที่ทำให้ชะลอการพบแพทย์
  if (p.hasGdm) {
    cautions.push("คุณระบุว่ามีภาวะเบาหวานขณะตั้งครรภ์ — ต้องอยู่ในการดูแลของแพทย์/นักโภชนาการที่ดูแลครรภ์ของคุณ อาหารเสริมทุกตัวให้ปรึกษาแพทย์ก่อนเสมอ");
  }
  // R13 — คำแนะนำสำหรับคนที่ติ๊ก "น้ำหนักเกิน" (ตัวเลข BMI แสดงในรายงาน ดู lib/calc/bmi.ts)
  if (issues.includes("overweight")) {
    cautions.push("แนะนำลดคาร์บขัดสี เพิ่มโปรตีนให้ถึงเป้าต่อวัน และขยับร่างกายตามคำแนะนำในเครื่องมือ ‘แนะนำการออกกำลังกาย’ ควบคู่ไปกับการบำรุง");
    if (p.weightTier) cautions.push(BMI_TIER_NOTE[p.weightTier]);
  }

  const note = effectivePcos
    ? "เน้นบำรุงไข่ + งดหวานเพื่อสมดุลฮอร์โมน (คำแนะนำทั่วไป ไม่ใช่การรักษาโรค)"
    : p.artPlan !== "ยัง"
      ? "บำรุงไข่ให้พร้อมก่อนเข้าสู่กระบวนการ เพิ่มความพร้อมของร่างกาย"
      : "เริ่มบำรุงล่วงหน้าอย่างน้อย 3 เดือนเพื่อเตรียมความพร้อม";

  return {
    core: c, targeted: t, nutrition: n, external: e,
    // R3 — ชุด "เตรียมผนังมดลูก" ปกติกระจายอยู่คนละกลุ่ม (ดอกคำฝอย = โภชนาการ,
    // น้ำมันละหุ่ง = ใช้ภายนอก) จึงถูกยกขึ้นมาไว้ใน targeted ด้านบน แล้วกรองออกจากกลุ่มเดิม
    // เพื่อไม่ให้แสดงซ้ำ — ผลคือรายงาน (primary) เห็นครบทั้ง 4 ตัวตาม TC-03-01
    primary: dedupe([...c, ...t]),
    note: note + " · ยึดหลัก 70% อยู่ในจาน 30% วิตามินเสริม — แผนมีค่าแม้ยังไม่ซื้ออะไรเลย",
    cautions,
  };
}
