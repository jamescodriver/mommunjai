// M6 — Vitamin recommender (pure). See docs/product-catalog-master.md §2–§4.
//
// Catalogue source of truth: docs/product-catalog-master.md (built from the brand's own
// "ชุดเตรียมตั้งครรภ์หญิง ตามสูตรครูก้อย" leaflet + Prod Ins.docx). Prices: docs/product-catalog.md.
// NEVER claim to cure or prevent disease. Never invent a dosage or a price — leave it null
// and say so, so the team notices and fills it in.
import type { Stage } from "./protein";

/** protein.ts's Stage has no "infertility" (it has no protein range of its own),
 *  but the questionnaire and leads.stage do — so widen it here. */
export type VitaminStage = Stage | "infertility";

export interface VitaminProfile {
  stage: VitaminStage;
  hasPcos: boolean;
  artPlan: "none" | "iui" | "ivf" | "icsi";
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

  // ---------- บำรุงชาย ----------
  // ⏳ Motila1 ไม่แนะนำในแอปจนกว่าแบรนด์จะยืนยันวิธีรับประทาน (product-catalog-master.md §3)
  // อย่าเดา dosage เอง — สินค้าที่ไม่มี howto จะแสดงในรายงานแบบไม่มีวิธีทาน
  motila1: {
    id: "motila1", name: "Motila1 โมทิล่าวัน", price: 1990, group: "core",
    why: "บำรุงสเปิร์มสำหรับฝ่ายชาย",
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
  /** เสริมตามโปรไฟล์ (PCOS / ART / การนอน ฯลฯ) */
  targeted: Product[];
  /** โภชนาการเสริมจากชุดครูก้อย */
  nutrition: Product[];
  /** ใช้ภายนอก */
  external: Product[];
  /** core + targeted — ชุดย่อที่ใช้ในรายงาน 90 วัน (ไม่เทกระจาดทั้ง 19 ตัว) */
  primary: Product[];
  note: string;
  /** คำเตือนระดับโปรไฟล์ จาก Safety Matrix */
  cautions: string[];
}

/** ตัดสินค้าที่ต้องหยุดสำหรับช่วงชีวิตนี้ออก (Safety Matrix §4) */
function allowedIn(stage: VitaminStage, p: Product): boolean {
  if (stage === "pregnant" && p.stop?.pregnant) return false;
  if (stage === "lactating" && p.stop?.lactating) return false;
  return true;
}

export function recommendVitamins(p: VitaminProfile): VitaminResult {
  if (p.stage === "male") {
    // ใช้ M-Z All แทน Motila1 ชั่วคราว: ทุกตัวที่แนะนำต้องมีวิธีรับประทานที่แบรนด์ยืนยันแล้ว
    const core = [PRODUCTS.mzall, PRODUCTS.ferta];
    const nutrition = [PRODUCTS.pureseed];
    return {
      core, targeted: [], nutrition, external: [],
      primary: [...core, ...nutrition],
      note: "บำรุงฝ่ายชายควบคู่ฝ่ายหญิง เพื่อเตรียมความพร้อมของร่างกายทั้งคู่ · ทานต่อเนื่องได้ในฐานะอาหารเสริม หากมีโรคประจำตัวหรือใช้ยาอยู่ ปรึกษาแพทย์/เภสัชกรก่อน",
      cautions: [],
    };
  }

  const core = [PRODUCTS.ovaall, PRODUCTS.ferty, PRODUCTS.collatelo, PRODUCTS.ferti9oil];

  const targeted: Product[] = [];
  if (p.hasPcos) targeted.push(PRODUCTS.pcovit);
  if (p.artPlan !== "none" || p.stage === "infertility") targeted.push(PRODUCTS.aos);
  targeted.push(PRODUCTS.varginaree, PRODUCTS.nightshot);

  const nutrition = [
    PRODUCTS.phytocrystalc, PRODUCTS.pureseed, PRODUCTS.goodgrain, PRODUCTS.pureblack,
    PRODUCTS.purered, PRODUCTS.puregreen, PRODUCTS.kaffirshot, PRODUCTS.kaffirhoney,
    PRODUCTS.ginger, PRODUCTS.probiotics, PRODUCTS.safflower,
  ];

  const external = [PRODUCTS.castoroil];

  const keep = (list: Product[]) => list.filter((x) => allowedIn(p.stage, x));

  const cautions: string[] = [];
  if (p.artPlan !== "none") {
    cautions.push(
      "คุณอยู่ระหว่างวางแผนกับแพทย์ — ปรึกษาแพทย์ที่ดูแลคุณก่อนเริ่มอาหารเสริมทุกตัว เพราะอาจมีผลต่อยาที่ได้รับ",
      "หลังใส่ตัวอ่อนแล้วต้องหยุด: A.O.S · น้ำมะกรูด Shot · Pure Green · Varginaree · ดอกคำฝอย · แพ็คน้ำมันละหุ่ง (Ferti 9 Oil ลดเหลือวันละ 1–2 เม็ด)",
    );
  }
  cautions.push("ช่วงวันไข่ตก ให้หยุดดอกคำฝอยและแพ็คน้ำมันละหุ่ง");
  if (p.stage === "pregnant") cautions.push("รายการที่ต้องหยุดช่วงตั้งครรภ์ถูกตัดออกจากคำแนะนำนี้แล้ว");
  if (p.stage === "lactating") cautions.push("รายการที่ต้องหยุดช่วงให้นมถูกตัดออกจากคำแนะนำนี้แล้ว");

  const note = p.hasPcos
    ? "เน้นบำรุงไข่ + งดหวานเพื่อสมดุลฮอร์โมน (คำแนะนำทั่วไป ไม่ใช่การรักษาโรค)"
    : p.artPlan !== "none"
      ? "บำรุงไข่ให้พร้อมก่อนเข้าสู่กระบวนการ เพิ่มความพร้อมของร่างกาย"
      : "เริ่มบำรุงล่วงหน้าอย่างน้อย 3 เดือนเพื่อเตรียมความพร้อม";

  const c = keep(core);
  const t = keep(targeted);
  return {
    core: c, targeted: t, nutrition: keep(nutrition), external: keep(external),
    primary: [...c, ...t],
    note: note + " · ยึดหลัก 70% อยู่ในจาน 30% วิตามินเสริม — แผนมีค่าแม้ยังไม่ซื้ออะไรเลย",
    cautions,
  };
}
