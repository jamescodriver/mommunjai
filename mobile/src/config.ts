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
//
// ── ผังสภาพแวดล้อม (ต้นยืนยัน 19 ส.ค. 69) ────────────────────────────────
//   production : https://mommunjai.vercel.app      ← บัญชี jamescodriver · repo mommunjai
//   dev        : https://mommunjai-dev.vercel.app  ← บัญชี tonpalearn   · repo mommunjai
//
// 🔴 ตอนนี้ตั้งเป็น **dev** โดยตั้งใจ เพราะแอปยังเป็นรุ่นทดลอง ยังไม่ขึ้นร้าน
//    lead ที่เกิดจากการทดสอบจึงไม่ไปปนกับข้อมูลลูกค้าจริง
//
// ⚠️ ก่อนส่งขึ้นร้านจริง **ต้องเปลี่ยนเป็น production** และต้องเปลี่ยน "พร้อมกัน" กับ
//    Webhook URL ของ LINE OA ด้วย — ถ้าแอปเขียน ticket ลงฐานของ dev แต่ LINE webhook
//    อยู่ที่ production (คนละฐานข้อมูล) ผู้ใช้จะพิมพ์รหัสในแชทแล้วบอทตอบ "ไม่พบรหัสนี้"
//    เช็คว่าตัวไหนเป็นตัวไหนได้ด้วย: curl <url>/api/line/webhook
export const API_BASE_URL = "https://mommunjai-dev.vercel.app";

/** ลิงก์ LINE OA เดียวกับที่เว็บใช้ (NEXT_PUBLIC_LINE_OA_URL) */
export const LINE_OA_URL = "https://lin.ee/fBa4xkz";
