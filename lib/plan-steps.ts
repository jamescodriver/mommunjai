// ลำดับขั้นของแบบสอบถาม /plan — แยกออกจาก page.tsx เพื่อให้เขียนเทสต์ได้
//
// ⚠️ เหตุผลที่ต้องมีไฟล์นี้: QA รอบ 31/7 เจอว่า `stage="lactating"` ยังเจอคำถาม
// "เข้าสู่กระบวนการทางการแพทย์" ทั้งที่ R11 สั่งให้ตัดออก — บั๊กรอดเทสต์ 295 ตัวมาได้
// เพราะตอนนั้น stepsFor() อยู่ใน page.tsx และ **ไม่มีเทสต์คลุมเลยสักตัว**
//
// (แยกเป็น lib ไม่ใช่ export จาก page.tsx เพราะ Next.js จำกัดสิ่งที่ไฟล์ใน app/ export ได้)

// R2 — "issues" โผล่เฉพาะ stage === "infertility"
// R3 batch — "partner" (R7) เฉพาะ infertility ที่ติ๊ก male_factor · "conception" (R9) เฉพาะ pregnant
export const ALL_STEPS = [
  "intro", "name", "stage", "issues", "health", "partner", "conception", "art", "contact",
] as const;
export type Step = (typeof ALL_STEPS)[number];

export function stepsFor(
  stage: string | undefined,
  skipStagePicker: boolean,
  issues: string[] = [],
): Step[] {
  return ALL_STEPS.filter((s) => {
    if (s === "issues") return stage === "infertility";
    // R7 · TC-07-02 — ติ๊ก "ปัญหาจากฝ่ายชาย" เท่านั้นถึงจะเจอฟอร์มฝ่ายชาย
    // (ไม่ติ๊ก = ไม่ต้องเพิ่มความยาว flow ให้คนที่ไม่เกี่ยว)
    if (s === "partner") return stage === "infertility" && issues.includes("male_factor");
    if (s === "conception") return stage === "pregnant";
    // R5 · TC-05-01 — "เตรียมตั้งครรภ์" ไม่ต้องเจอคำถามกระบวนการทางการแพทย์
    // R11 · TC-11-01 — "ให้นมบุตร" ก็ต้องตัดออกเหมือนกัน (QA 31/7 จับได้ว่าตกหล่น)
    // 🔒 ผลตามมาถ้าไม่ตัด: แม่ให้นมที่เผลอเลือก IVF-ICSI จะได้ tier "full" ทันที แผนจะมี
    //    A.O.S ("ดูแลคุณภาพไข่และตัวอ่อน") + พาดหัว "บำรุงไข่ให้พร้อมก่อนเข้าสู่กระบวนการ"
    //    และถ้าเลือก "เตรียมผนังมดลูก" จะได้ดอกคำฝอย/น้ำมันละหุ่งเข้าแผนหลังคลอด
    //    (ทั้งคู่ไม่มี stop.lactating จึงไม่ถูก Safety Matrix กรองออก)
    if (s === "art") return stage !== "prep" && stage !== "lactating";
    if (s === "stage") return !skipStagePicker;
    return true;
  });
}
