/** เครื่องมือที่ผลลัพธ์ถูกเก็บลงตาราง `tool_results` ได้
 *
 * 🔒 ต้องตรงกับ CHECK constraint ใน `supabase/migrations/0007_tool_results_widen.sql` เป๊ะ
 *    • ลิสต์นี้กว้างกว่า DB → insert ชน constraint → `/api/lead` คืน 500 → **ส่งแบบสอบถามไม่ได้ทั้งระบบ**
 *    • ลิสต์นี้แคบกว่า DB  → ผลเครื่องมือถูกทิ้งเงียบ ๆ ไม่มี error ให้เห็น
 *      (บั๊กที่ `exercise`/`labs` โดนมาตลอดจนเจอตอนทำ R14 — แอดมินไม่เคยเห็นข้อมูล 2 ตัวนี้เลย)
 *    → มี `lib/persisted-tools.test.ts` อ่าน migration จริงมาเทียบไว้ กันไม่ให้หลุดจากกันอีก
 *
 * ⚠️ อยู่แยกจาก `app/api/lead/route.ts` เพราะ Next.js App Router ห้าม route file export
 *    ตัวแปรอื่นนอกจาก HTTP method/`runtime`/`config` (จะพังตอน type-check ของ build)
 */
export const PERSISTED_TOOLS = [
  "ovulation", "protein", "nutrients", "sleep", "vitamins", "water",
  "exercise", "labs", "stress",
];
