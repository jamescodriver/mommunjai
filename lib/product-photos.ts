// R15 · TC-15-07 — รูปสินค้าในตารางแนะนำวิตามิน
//
// คอมเมนต์ TC-15-07 (ต้นฉบับ): *"ถ้ามีก็แสดง ไม่มีก็ไม่ต้องแสดง"*
//   → สินค้าที่ไม่มีรูป ต้อง **แสดงแถวโดยไม่มีรูป** ห้ามซ่อนสินค้า และห้ามปล่อยให้ <img> พัง
//
// ทำไมเป็น "รายชื่อที่รู้ล่วงหน้า" ไม่ใช่ onError ของ <img>:
//   การพึ่ง onError แปลว่าเบราว์เซอร์ต้องยิง request ที่ล้มเหลว 7 ครั้งทุกครั้งที่เปิดรายงาน
//   (404 ใน console + layout กระตุกตอน fallback) — ตรวจจากรายชื่อคือคำตอบที่แน่นอนกว่า
//
// ไฟล์จริงอยู่ที่ public/products/<id>.jpg โดย <id> = id ของสินค้าใน lib/calc/vitamins.ts เป๊ะ ๆ
// (ต้นฉบับความละเอียดสูงจากแบรนด์อยู่ที่ source/product photo/ · สำเนาที่ประมวลผลแล้ว
//  เก็บคู่ไว้ที่ assets/products/ · แต่ละไฟล์ถูก trim ขอบขาว + วางกลางผืนจัตุรัส 640×640
//  เพื่อให้ object-contain ในตารางไม่บิดและขนาดสินค้าดูสม่ำเสมอกัน)

/** 25 รายการที่มีไฟล์รูปจริงใน public/products/ */
export const PRODUCT_PHOTO_IDS = [
  "aos",
  "bananaflower",
  "castoroil",
  "collatelo",
  "ferta",
  "ferti9oil",
  "ferty",
  "ginger",
  "goatmilk",
  "goodgrain",
  "kaffirhoney",
  "kaffirshot",
  "motila1",
  "mzall",
  "nightshot",
  "ovaall",
  "pcovit",
  "phytocrystalc",
  "probiotics",
  "pureblack",
  "puregreen",
  "purered",
  "pureseed",
  "safflower",
  "varginaree",
] as const;

const PHOTO_SET: ReadonlySet<string> = new Set(PRODUCT_PHOTO_IDS);

/** เหลือรายการเดียวที่ยังไม่มีรูป: **blackchickensoup** (ซุปไก่ดำ)
 *  — ไม่มีอยู่ในชุดภาพที่แบรนด์ส่งมา (source/product photo, 1 ส.ค. 2026) */
export function hasProductPhoto(id: string): boolean {
  return PHOTO_SET.has(id);
}

/** path ของรูป หรือ null เมื่อยังไม่มี — หน้าจอต้องเช็ค null ก่อน render <img> */
export function productPhotoSrc(id: string): string | null {
  return hasProductPhoto(id) ? `/products/${id}.jpg` : null;
}
