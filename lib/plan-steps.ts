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
    // R4 (0408) · PDF-06 — "ฝ่ายชาย" ตัดออกด้วย (client ยืนยัน "ต้องไม่มีส่วนนี้")
    // R4 (0408) · PDF-13 — "ตั้งครรภ์แล้ว" ตัดออกด้วย: เดิมโผล่ต่อจากคำถาม "ท้องนี้ตั้งครรภ์
    //    ด้วยวิธีไหน" (step "conception") ซ้ำซ้อนกัน ทำให้คนท้องที่ตอบ "เตรียมผนังมดลูก"/
    //    "IVF-ICSI" ได้ tier "full" + สินค้าบำรุงไข่ปนเข้าแผนหลังตั้งครรภ์แล้ว — client ยืนยัน
    //    ว่าคนท้องไม่จำเป็นต้องได้ tier "full" ผ่านทางนี้ (ได้แผนฉบับเต็มแบบคนท้องของตัวเองพอ)
    //    ผลคือ "art" เหลือแค่ stage "infertility" เท่านั้น (ดู PDF-10 ที่ปรับ UI ของขั้นนี้)
    if (s === "art") return stage === "infertility";
    if (s === "stage") return !skipStagePicker;
    return true;
  });
}

/** ฟิลด์ที่ "เป็นของ" ขั้นตอนไหน — ถ้าขั้นตอนนั้นไม่ได้ถูกถาม ค่าพวกนี้ต้องไม่ถูกส่ง */
const FIELDS_BY_STEP: Partial<Record<Step, string[]>> = {
  issues: ["infertility_issues"],
  partner: ["partner_profile"],
  conception: ["conception_method", "gestational_weeks", "has_gdm"],
  art: ["art_plan"],
};

/**
 * ล้างค่าของขั้นตอนที่ **ไม่ได้ถูกถามใน stage นี้** ก่อนส่งเข้า /api/lead
 *
 * ⚠️ บั๊กที่ทำให้ต้องมีฟังก์ชันนี้ (ต้นเจอเอง 1/8/2026 — "หน้าที่ให้ลูกค้าเลย กับ หน้าหลัง
 * ใส่เลข ticket ไม่ต่างกันเลย"):
 *   /plan prefill ค่าจากโปรไฟล์เดิมใน localStorage ทุกฟิลด์รวมทั้ง art_plan — แต่ stage
 *   "ให้นมบุตร"/"เตรียมตั้งครรภ์" ไม่มีขั้นตอน art ให้เห็นหรือแก้ ค่าเก่าจึงติดไปกับการส่ง
 *   ใครที่เคยตอบ "IVF-ICSI" มาก่อนในเบราว์เซอร์เดียวกัน (= คนทำแบบสอบถามซ้ำ ซึ่งเป็น
 *   ฟีเจอร์ที่เราตั้งใจรองรับ) พอมาทำ "ให้นมบุตร" จะได้ tier = "full" ทันที
 *   ผลที่ตามมา 3 ชั้น:
 *     1. ทะลุ gate — ได้แผนเต็มโดยไม่ต้องเข้า LINE ซึ่งคือกลไกเก็บ lead ทั้งหมด
 *        และทำให้หน้าหลังกรอกเสร็จ = หน้าเดียวกับหลังใส่ ticket เป๊ะ (ReportView ตัวเดียวกัน)
 *     2. ข้อมูลผิดลง DB — แม่ให้นมถูกบันทึกว่า art_plan = "IVF-ICSI" แอดมินอ่านผิด tag ผิด
 *     3. สินค้าผิด — recommendVitamins อ่าน artPlan ด้วย ("เตรียมผนังมดลูก" จะดึง
 *        ดอกคำฝอย/น้ำมันละหุ่งเข้าแผนของแม่หลังคลอด)
 *
 * กฎง่าย ๆ ที่ยึด: **ไม่ได้ถาม = ไม่มีคำตอบ** ห้ามเดาจากรอบก่อน
 */
export function sanitizeForStage<T extends Record<string, any>>(form: T, steps: Step[]): T {
  const out: Record<string, any> = { ...form };
  for (const [step, fields] of Object.entries(FIELDS_BY_STEP)) {
    if (steps.includes(step as Step)) continue;
    for (const f of fields) {
      // art_plan ใช้ "ยัง" เป็นค่าว่างของมันเอง (ไม่ใช่ undefined) เพราะ logic ปลายทาง
      // คาดหวังสตริงเสมอ — ดู reportTier()
      out[f] = f === "art_plan" ? "ยัง" : f === "partner_profile" ? { behaviors: [] } : Array.isArray(form[f]) ? [] : undefined;
    }
  }
  return out as T;
}
