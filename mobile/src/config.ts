// ปลายทางที่แอปคุยด้วย — รวมไว้ที่เดียว ห้ามกระจาย URL ไปตามไฟล์
//
// 🔴 กฎที่ผิดแล้วผู้ใช้เจอ "รหัสนี้ใช้ไม่ได้" ใน LINE:
//    API_BASE_URL ต้องเป็น **deployment ตัวเดียวกับที่ LINE OA ชี้ webhook ไปหา**
//    เพราะ ticket ที่ออกจากแอปถูกเขียนลง Supabase ของ deployment นั้น
//    ถ้าแอปยิง lead ไปที่ A แต่ LINE webhook อยู่ที่ B (คนละ Supabase)
//    ผู้ใช้จะพิมพ์รหัสในแชทแล้วบอทตอบว่า "ไม่พบรหัสนี้" — หาสาเหตุยากมาก
//    ตรวจได้เร็ว ๆ ด้วย: curl <API_BASE_URL>/api/line/webhook
//
// ทำไมไม่ใช้ env: Expo ฝังค่า env ตอน build ตัวที่ขึ้นร้านต้องชี้ production เสมอ
// เขียนตรง ๆ ตรวจสอบง่ายกว่าและพลาดยากกว่า — เปลี่ยนโดเมนเมื่อไหร่ แก้ที่นี่ที่เดียว
export const API_BASE_URL = "https://mommunjai-dev.vercel.app";

/** ลิงก์ LINE OA เดียวกับที่เว็บใช้ (NEXT_PUBLIC_LINE_OA_URL) */
export const LINE_OA_URL = "https://lin.ee/fBa4xkz";
