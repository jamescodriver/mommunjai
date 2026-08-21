// R15 Part 2 — ตารางอ้างอิงอาหาร (ค่าคงที่ ไม่มีการคำนวณ)
//
// 🔒 ทุกตัวเลข/รายการในไฟล์นี้มาจากเอกสารของโปรเจกต์เท่านั้น ห้ามเติมจากความจำ:
//   - ตารางโปรตีนในอาหาร → source/ตารางโปรตีนอาหาร.xlsx (ทีม Baby & Mom ส่งให้ 2026-08-21)
//     อ้างอิง USDA FoodData Central · ค่าประมาณของ "วัตถุดิบดิบต่อ 100 กรัม"
//     ⚠️ ข้อยกเว้นเดียว: "อะโวคาโด" ไม่มีในไฟล์ต้นฉบับ — ต้นสั่งเพิ่มเอง ค่าที่ใช้ (~2 ก./100 ก.)
//        มาจาก USDA ซึ่งเป็นแหล่งเดียวกับที่ไฟล์ต้นฉบับประกาศไว้ ถ้าทีมแบรนด์มีตัวเลขของตัวเอง ให้ทับได้
//   - หน่วยที่กินจริง (PROTEIN_SERVINGS) → คอลัมน์หมายเหตุในไฟล์เดียวกัน
//     + docs/nutrition-protocol.md §1 (อกไก่สุก 100g ≈ 30g · Ferty 1 ซอง ≈ 25g)
//     💡 "อกไก่ดิบ ~23 ก." กับ "อกไก่สุก ~30 ก." ไม่ได้ขัดกัน — คนละฐานน้ำหนัก (ดิบ vs สุก)
//        จึงเก็บไว้คนละตาราง พร้อมคำอธิบาย ไม่ใช่เลือกอันใดอันหนึ่งทิ้ง
//   - ผัก/ผลไม้ → docs/nutrition-protocol.md §2 + docs/BOOK-INSIGHTS.md §3.6–3.7 (เมนูจากหนังสือครูก้อย)
//   - โครงจาน → docs/BOOK-INSIGHTS.md §3.7 "1 จานต้องมี คาร์โบไฮเดรต + โปรตีน + ผัก + ไขมันดี"

export type ProteinFoodGroup = "meat" | "sea" | "dairy" | "nut";

export interface ProteinFoodGroupInfo {
  key: ProteinFoodGroup;
  label: string;
  emoji: string;
}

/** ลำดับหมวดในตาราง — เรียงตามค่าโปรตีนสูงสุดของหมวด */
export const PROTEIN_FOOD_GROUPS: ProteinFoodGroupInfo[] = [
  { key: "meat", label: "เนื้อสัตว์", emoji: "🥩" },
  { key: "sea", label: "อาหารทะเล / ปลา", emoji: "🦐" },
  { key: "nut", label: "ถั่ว · เมล็ด · ผลไม้ไขมันดี", emoji: "🌰" },
  { key: "dairy", label: "ไข่ · นม · โยเกิร์ต", emoji: "🥚" },
];

export interface ProteinFoodRow {
  food: string;
  /** หน่วยที่เอกสารต้นทางอ้างอิงจริง */
  per: string;
  /** กรัมโปรตีนตามหน่วยข้างต้น (ข้อความที่แสดง) */
  protein: string;
  /** ค่ากลางเป็นตัวเลข — ใช้เรียงลำดับ + วาดแถบเปรียบเทียบเท่านั้น ไม่ได้เอาไปคำนวณอะไรต่อ */
  proteinAvg: number;
  group: ProteinFoodGroup;
  /** คอลัมน์ "หมายเหตุ" จากไฟล์ต้นฉบับ */
  note?: string;
  /** true = เอกสารต้นทางอ้างอิงที่ 100 กรัมพอดี */
  per100g: boolean;
}

/** สเกลของแถบเปรียบเทียบ = ค่าสูงสุดในตาราง (เนื้อวัว 26 ก.) */
export const PROTEIN_BAR_MAX = 26;

export const PROTEIN_FOODS: ProteinFoodRow[] = [
  // 🥩 เนื้อสัตว์
  { food: "เนื้อวัว (สันใน/เนื้อล้วน)", per: "100 กรัม", protein: "22–26 ก.", proteinAvg: 24, group: "meat", note: "ยิ่งไขมันน้อยยิ่งโปรตีนสูง", per100g: true },
  { food: "อกไก่ (ไม่มีหนัง)", per: "100 กรัม", protein: "≈ 23 ก.", proteinAvg: 23, group: "meat", note: "ไขมันต่ำสุดในกลุ่มไก่", per100g: true },
  { food: "เนื้อหมูสันใน", per: "100 กรัม", protein: "21–22 ก.", proteinAvg: 21.5, group: "meat", note: "นุ่ม ไขมันต่ำ", per100g: true },
  { food: "ตับไก่ / ตับหมู", per: "100 กรัม", protein: "≈ 20 ก.", proteinAvg: 20, group: "meat", note: "ได้ธาตุเหล็ก + วิตามินเอสูงด้วย", per100g: true },
  { food: "สะโพก / น่องไก่ (ไม่มีหนัง)", per: "100 กรัม", protein: "19–20 ก.", proteinAvg: 19.5, group: "meat", note: "ไขมันสูงกว่าอกไก่เล็กน้อย", per100g: true },
  { food: "หมูสามชั้น", per: "100 กรัม", protein: "≈ 14 ก.", proteinAvg: 14, group: "meat", note: "ไขมันแทรกเยอะ", per100g: true },

  // 🦐 อาหารทะเล / ปลา
  { food: "กุ้ง (ขาว/แชบ๊วย)", per: "100 กรัม", protein: "20–24 ก.", proteinAvg: 22, group: "sea", note: "โปรตีนสูง ไขมันต่ำ", per100g: true },
  { food: "ปลานิล / ปลาทับทิม", per: "100 กรัม", protein: "18–20 ก.", proteinAvg: 19, group: "sea", note: "ปลาน้ำจืด ราคาถูก หาง่าย", per100g: true },
  { food: "ปลาหมึก", per: "100 กรัม", protein: "15–18 ก.", proteinAvg: 16.5, group: "sea", note: "มีคอเลสเตอรอลด้วย", per100g: true },

  // 🌰 ถั่ว · เมล็ด · ผลไม้ไขมันดี
  { food: "อัลมอนด์ (ดิบ)", per: "100 กรัม", protein: "≈ 21 ก.", proteinAvg: 21, group: "nut", note: "≈ 23 เม็ด (28 ก.) ได้โปรตีน 6 ก.", per100g: true },
  { food: "วอลนัต (ดิบ)", per: "100 กรัม", protein: "≈ 15 ก.", proteinAvg: 15, group: "nut", note: "โอเมกา-3 สูงกว่าอัลมอนด์", per100g: true },
  { food: "อะโวคาโด", per: "100 กรัม", protein: "≈ 2 ก.", proteinAvg: 2, group: "nut", note: "กินเพื่อไขมันดี ไม่ใช่แหล่งโปรตีน — ครึ่งผลใหญ่ ≈ 100 ก.", per100g: true },

  // 🥚 ไข่ · นม · โยเกิร์ต
  { food: "ไข่ไก่", per: "100 กรัม", protein: "≈ 13 ก.", proteinAvg: 13, group: "dairy", note: "1 ฟองใหญ่ (50 ก.) ได้โปรตีน 6 ก.", per100g: true },
  { food: "กรีกโยเกิร์ต", per: "100 กรัม", protein: "≈ 10 ก.", proteinAvg: 10, group: "dairy", note: "รสธรรมชาติ — โปรตีนสูงกว่าโยเกิร์ตธรรมดา ~2 เท่า", per100g: true },
  { food: "โยเกิร์ตธรรมดา", per: "100 กรัม", protein: "3.5–5 ก.", proteinAvg: 4.25, group: "dairy", note: "รสธรรมชาติ — มากน้อยแล้วแต่ไขมัน (whole / low-fat)", per100g: true },
  { food: "นมแพะ", per: "100 มล.", protein: "3.1–3.6 ก.", proteinAvg: 3.35, group: "dairy", per100g: true },
  { food: "นมวัว (whole milk)", per: "100 มล.", protein: "≈ 3.2 ก.", proteinAvg: 3.2, group: "dairy", note: "1 แก้ว (240 มล.) ได้โปรตีน 7.7 ก.", per100g: true },
];

/** เทียบเป็น "หน่วยที่กินจริง" — คนกะน้ำหนัก 100 กรัมไม่ออก แต่กะเป็นฟอง/แก้ว/ซองได้
 *  ⚠️ ทุกบรรทัดมีที่มาชัดเจน: 3 บรรทัดแรกมาจากคอลัมน์หมายเหตุในไฟล์ต้นฉบับ
 *     2 บรรทัดหลังมาจาก docs/nutrition-protocol.md §1 (คัมภีร์ครูก้อย) */
export interface ProteinServingRow {
  serving: string;
  protein: string;
  hint?: string;
}

export const PROTEIN_SERVINGS: ProteinServingRow[] = [
  { serving: "ไข่ไก่ 1 ฟองใหญ่", protein: "≈ 6 ก.", hint: "50 กรัม" },
  { serving: "นมวัว 1 แก้ว", protein: "≈ 7.7 ก.", hint: "240 มล." },
  { serving: "อัลมอนด์ 1 กำมือ", protein: "≈ 6 ก.", hint: "~23 เม็ด (28 กรัม)" },
  { serving: "อกไก่สุก 100 กรัม", protein: "≈ 30 ก.", hint: "สุกแล้วน้ำหนักหด ตัวเลขจึงสูงกว่าเนื้อดิบ" },
  { serving: "โปรตีนเฟอร์ตี้ 1 ซอง", protein: "≈ 25 ก.", hint: "Ferty" },
];

export const PROTEIN_FOODS_NOTE =
  "ตัวเลขเป็นค่าประมาณของวัตถุดิบดิบก่อนปรุง ต่อ 100 กรัม (รายการนม/โยเกิร์ต = ต่อ 100 มิลลิลิตร) ปรุงสุกแล้วน้ำหนักจะหด โปรตีนต่อ 100 กรัมจึงสูงขึ้นกว่านี้";

export const PROTEIN_FOODS_SOURCE = "USDA FoodData Central · ตารางโปรตีนอาหาร (ทีม Baby & Mom)";

/** ผักแนะนำ — จากเช็กลิสต์สารอาหารประจำวัน + เมนูตามรอบเดือนในหนังสือ */
export const RECOMMENDED_VEGETABLES = [
  "ผักใบเขียว (คะน้า ผักโขม ตำลึง) — แหล่งธาตุเหล็กจากพืช",
  "ผักหลากสี 1 ถ้วย/วัน (แครอท พริกหวาน มะเขือเทศ ฟักทอง)",
  "ผักสดในสลัด คู่กับไขมันดี เช่น อะโวคาโด",
  "ผัดผักน้ำมันน้อย — เมนูอุ่น ย่อยง่าย",
];

/** ผลไม้แนะนำ — จากสูตรสมูทตี้/เมนูในหนังสือครูก้อย
 *  ⚠️ ถ้อยคำในลิสต์นี้ต้องเป็นกลางทางเพศ — รายงานฉบับเดียวกันใช้กับ stage "male" ด้วย
 *  (มีเทสต์ "a man is never told about egg quality" กันไว้: ห้ามมีคำว่า คุณภาพไข่/บำรุงไข่) */
export const RECOMMENDED_FRUITS = [
  "กล้วย — ฐานของสูตรสมูทตี้พื้นฐานในคัมภีร์ครูก้อย",
  "เบอร์รี — สูตรฮอร์โมนบาลานซ์ (สารต้านอนุมูลอิสระ)",
  "อะโวคาโด ครึ่งผล/วัน — ไขมันดี (คู่กับน้ำผึ้งชันโรงตามคัมภีร์)",
  "ผลไม้ย่อยง่าย เช่น กล้วย มะละกอสุก",
];

export const FOOD_SOURCE_NOTE =
  "รายการอาหารด้านบนมาจากคัมภีร์โภชนาการของครูก้อย (docs/nutrition-protocol.md · docs/BOOK-INSIGHTS.md) เป็นแนวทางทั่วไป ไม่ใช่การกำหนดอาหารเฉพาะโรค";

/** ตัวอย่างจานอาหารจริง (ภาพถ่ายจากทีมแบรนด์ Baby & Mom) — ใช้แทน pie chart เดิม
 *  ตาม PDF-05 (0408): "เอาตัวอย่างเป็นรูปจานอาหารเลย ไม่เอา pie chart"
 *  ที่มาภาพ: source/AW_ความรู้โภชนาการ_12-19/ (คัดมา 3 จาน คนละสไตล์มื้อ — เอเชีย/ไทย/ตะวันตก) */
export interface MealExample {
  key: string;
  /** path ใต้ public/ */
  image: string;
  alt: string;
  title: string;
  items: string[];
}

export const MEAL_EXAMPLES: MealExample[] = [
  {
    key: "salmon-rice",
    image: "/food-plates/plate-01-salmon-rice.jpg",
    alt: "จานตัวอย่าง: ข้าวกล้อง แซลมอนย่าง ไข่ต้ม บรอกโคลีลวก ฝรั่ง",
    title: "แซลมอนย่าง + ข้าวกล้อง",
    items: ["ข้าวกล้อง 1 ทัพพี", "แซลมอนย่าง 90 ก. (โปรตีน~19 ก.)", "ไข่ต้ม 1 ฟอง (โปรตีน~6 ก.)", "บรอกโคลีลวก", "ฝรั่ง 1 ผลเล็ก"],
  },
  {
    key: "tomyum-shrimp",
    image: "/food-plates/plate-02-tomyum-shrimp.jpg",
    alt: "จานตัวอย่าง: ต้มยำกุ้งใส่เห็ด ข้าวกล้อง ฝรั่ง",
    title: "ต้มยำกุ้งใส่เห็ด + ข้าวกล้อง",
    items: ["ข้าวกล้อง 1 ทัพพี", "ต้มยำกุ้งใส่เห็ด", "กุ้ง 125 ก. (โปรตีน~25 ก.)", "ฝรั่ง 1 ผลเล็ก"],
  },
  {
    key: "mackerel-rice",
    image: "/food-plates/plate-03-mackerel-rice.jpg",
    alt: "จานตัวอย่าง: ข้าวกล้อง ปลาซาบะย่าง ยำแตงกวาสาหร่ายวากาเมะ ส้ม",
    title: "ปลาซาบะย่าง + ข้าวกล้อง",
    items: ["ข้าวกล้อง 1 ทัพพี", "ปลาซาบะ 125 ก. (โปรตีน~25 ก.)", "ยำแตงกวา + สาหร่ายวากาเมะ", "ส้ม 1 ผล"],
  },
];

export const MEAL_EXAMPLES_DISCLAIMER =
  "ภาพตัวอย่างมื้ออาหารจากทีม Baby & Mom เพื่อให้เห็นว่า 1 มื้อที่มีคาร์โบไฮเดรต + โปรตีน + ผัก/ผลไม้ครบหน้าตาเป็นแบบไหน ไม่ใช่เมนูตายตัวที่ต้องทำตามเป๊ะ ปรับเปลี่ยนวัตถุดิบตามที่หาได้จริงได้เสมอ";
