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
// (ตัดจาก leaflet ของแบรนด์ · ต้นฉบับสำรองไว้ที่ assets/products/)

/** 19 รายการที่มีไฟล์รูปจริงใน public/products/ */
export const PRODUCT_PHOTO_IDS = [
  "aos",
  "castoroil",
  "collatelo",
  "ferti9oil",
  "ferty",
  "ginger",
  "goodgrain",
  "kaffirhoney",
  "kaffirshot",
  "nightshot",
  "ovaall",
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

/** สินค้าที่ยังไม่มีรูป (PRD R3 Open Question #3 — รอ leaflet ชุดใหม่/ถ่ายใหม่จากทีมครูก้อย):
 *  pcovit · ferta · mzall · motila1 · goatmilk · blackchickensoup · bananaflower */
export function hasProductPhoto(id: string): boolean {
  return PHOTO_SET.has(id);
}

/** path ของรูป หรือ null เมื่อยังไม่มี — หน้าจอต้องเช็ค null ก่อน render <img> */
export function productPhotoSrc(id: string): string | null {
  return hasProductPhoto(id) ? `/products/${id}.jpg` : null;
}
