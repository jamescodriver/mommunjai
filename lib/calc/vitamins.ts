// M6 — Vitamin recommender (pure). See docs/nutrition-protocol.md §4 + product-catalog.md.
// Recommend real products. NEVER claim to cure disease.
import type { Stage } from "./protein";

export interface VitaminProfile {
  stage: Stage;
  hasPcos: boolean;
  artPlan: "none" | "iui" | "ivf" | "icsi";
}

export interface Product {
  id: string;
  name: string;
  price: number;
  why: string;
  detail?: string;
  howto?: string;
}

export const PRODUCTS: Record<string, Product> = {
  ovaall: {
    id: "ovaall",
    name: "OvaAll วิตามินโอวาออลล์",
    price: 2490,
    why: "วิตามินรวมบำรุงไข่ ครบในซองเดียว",
    detail: "โฟลิก 400mcg · CoQ10 30mg · น้ำมันปลา 500mg · มัลติวิตามิน&แร่ธาตุ 20+ ชนิด",
    howto: "วันละ 1 ซอง (4 เม็ด) พร้อมอาหาร อย่างน้อย 3 เดือนก่อนตั้งครรภ์",
  },
  ferty: {
    id: "ferty",
    name: "Ferty โปรตีนเฟอร์ตี้",
    price: 1590,
    why: "เสริมโปรตีนเพื่อโภชนาการในการเตรียมพร้อม",
    howto: "วันละ 2 ซอง ได้โปรตีน ~50 กรัม",
  },
  pcovit: {
    id: "pcovit",
    name: "PCO-VIT พีซีโอวิท",
    price: 1990,
    why: "วิตามินสำหรับผู้ที่ต้องการดูแลสมดุลในกลุ่ม PCOS (เสริมโภชนาการ ไม่ใช่ยารักษา)",
    howto: "ทานคู่กับการดูแลเรื่องน้ำตาล (ปรึกษาแพทย์/เภสัชกรถ้าใช้ยาอยู่)",
  },
  motila1: {
    id: "motila1",
    name: "Motila1 โมทิล่าวัน",
    price: 1990,
    why: "บำรุงสเปิร์มสำหรับฝ่ายชาย",
  },
  mzall: { id: "mzall", name: "M-Z All", price: 1990, why: "วิตามินรวมบำรุงชาย" },
  ferta: { id: "ferta", name: "Ferta เวย์โปรตีน", price: 1980, why: "โปรตีนสำหรับฝ่ายชาย" },
  pureseed: {
    id: "pureseed",
    name: "Pure Seed เมล็ดฟักทองอบ",
    price: 500,
    why: "แหล่งซิงก์ ช่วยสุขภาพสเปิร์ม",
  },
};

export function recommendVitamins(p: VitaminProfile): {
  primary: Product[];
  note: string;
} {
  if (p.stage === "male") {
    return {
      primary: [PRODUCTS.motila1, PRODUCTS.ferta, PRODUCTS.pureseed],
      note: "บำรุงฝ่ายชายควบคู่ฝ่ายหญิง เพื่อเตรียมความพร้อมของร่างกายทั้งคู่",
    };
  }
  const primary: Product[] = [PRODUCTS.ovaall];
  if (p.hasPcos) primary.push(PRODUCTS.pcovit);
  if (p.artPlan !== "none") primary.push(PRODUCTS.ferty);
  else primary.push(PRODUCTS.ferty);
  // de-dup keep order, max 3
  const seen = new Set<string>();
  const uniq = primary.filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
  const note = p.hasPcos
    ? "เน้นบำรุงไข่ + งดหวานเพื่อสมดุลฮอร์โมน (คำแนะนำทั่วไป ไม่ใช่การรักษาโรค)"
    : p.artPlan !== "none"
      ? "บำรุงไข่ให้พร้อมก่อนเข้าสู่กระบวนการ เพิ่มความพร้อมของร่างกาย"
      : "เริ่มบำรุงล่วงหน้าอย่างน้อย 3 เดือนเพื่อเตรียมความพร้อม";
  return { primary: uniq.slice(0, 3), note };
}
