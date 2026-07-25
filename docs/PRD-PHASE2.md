# PRD — Mommunjai Phase 2

> เวอร์ชัน 2.0 · 2026-07-21 · PM/BA/SA (Angiris) · สถานะ: **Built** (ดู [TEST-REPORT-PHASE2](TEST-REPORT.html))
> ต่อยอดจาก [PRD.md](PRD.md) (เฟส 1) · อ้างงานวิจัยแรงจูงใจ MOTIVATION-RESEARCH.md
> HTML: [PRD-PHASE2.html](PRD-PHASE2.html) · สถาปัตย์: [ARCHITECTURE.md](ARCHITECTURE.md) · ข้อมูล: [DATA-MODEL.md](DATA-MODEL.md) + migration 0002

## สารบัญ
- [0. ภาพรวม 3 เสาของเฟส 2](#0-ภาพรวม)
- [1. Epic A — Personalized Report (แผน 90 วัน)](#1-epic-a)
- [2. Epic B — LINE Webhook Auto-tag](#2-epic-b)
- [3. Epic C — Admin + Auth + RBAC](#3-epic-c)
- [4. Data & API เพิ่มเติม](#4-data--api)
- [5. NFR + ความปลอดภัย/จริยธรรม](#5-nfr)
- [6. Open Questions & Phasing](#6-open-questions)

## 0. ภาพรวม
เฟส 2 แก้ "ปัญหาแรงจูงใจ" ที่เฟส 1 ทิ้งไว้ (ทำไมคนจะกรอกจนจบ?) + ทำให้ระบบหลังบ้านสมบูรณ์พอใช้งานจริงเป็นทีม
1. **Epic A — รางวัลที่ทำให้เขายอมกรอก:** "แผน 90 วัน มั่นใจก่อนมีลูก — ฉบับของคุณ" (personalized report) — ดูเหตุผลเชิงจิตวิทยาใน MOTIVATION-RESEARCH.md
2. **Epic B — LINE OA จับ ticket อัตโนมัติ:** ผู้ใช้ส่งรหัสในแชต → ระบบ bind + ให้รายงาน + tag ให้เอง
3. **Epic C — Admin/Auth/RBAC:** login, สร้าง user, admin ตั้ง PIN ให้ staff, กำหนดสิทธิ์รายคน

## 1. Epic A — Personalized Report "แผน 90 วัน ฉบับของคุณ"
### ข้อค้นพบที่ขับเคลื่อน design (จาก Uriel)
คนกลุ่มมีบุตรยาก **ไม่ได้กรอกเพื่อได้คุยกับ staff** แต่เพื่อ **กู้คืนความรู้สึกว่าตัวเองยังควบคุมอะไรได้** → รางวัลต้องเป็นแผน **มองไปข้างหน้า** (agency + ความหวังมีเหตุผล) ไม่ใช่ "คะแนน/ผลวินิจฉัย" ที่มองย้อนหลัง (เสี่ยงตอกย้ำความเจ็บ). กรอบ 90 วันซื่อสัตย์ทางวิทย์ (ไข่/อสุจิใช้เวลาสุก ~72–90 วัน)

### User Stories
- ในฐานะผู้เตรียมตั้งครรภ์ ฉันอยากได้ "แผนเฉพาะฉัน" ที่จับต้องได้ทันที เพื่อรู้สึกว่าลงมือเองได้ (ไม่ใช่แค่รอโชค)
- ในฐานะกลุ่มมีบุตรยาก ฉันอยากเห็น "จุดแข็งของฉัน" ก่อน เพื่อไม่ท้อ
- ในฐานะผู้ใช้ ฉันอยากได้ 1 อย่างที่ทำได้ "วันนี้เลย" เพื่อดับความอยากได้คำตอบทันที

### Requirements (P0)
- [ ] รายงานสร้างจากคำตอบ + ผลเครื่องมือ ผ่าน `lib/report.ts` (pure, testable)
- [ ] โครง 8 ส่วนตามวิจัย: คำทัก(ใส่ชื่อ) → **จุดแข็งก่อน** → **quick win วันนี้** → ความพร้อม+คะแนน(นุ่มนวล) → จุดที่เสริมได้ → แผน 90 วัน 3 ช่วง → 70% อาหาร+30% วิตามิน → ชวนคู่ → สัปดาห์นี้ทำ 3 อย่าง+CTA LINE → disclaimer
- [ ] **เปิดด้วยจุดแข็งเสมอ** ห้ามนำด้วยคะแนนต่ำ · คะแนน = "ไว้ติดตามพัฒนาการ ไม่ใช่การตัดสิน"
- [ ] "จุดที่เสริมได้" (ไม่ใช่ "จุดที่พลาด")
- [ ] ผูกสินค้าเป็น "30% ที่เสริม 70% อาหาร" แมปตามโปรไฟล์ (PCOS→PCO-VIT ฯลฯ) ไม่ยัดเยียด · **แผนมีค่าแม้ไม่ซื้อ**
- [ ] **ชวนคู่ (partner nudge)** สำหรับกลุ่มหญิง (ปัจจัยฝ่ายชาย ~40%)
- [ ] แสดงทันทีหลังกรอก (peak-end moment) + บันทึก snapshot ลง `reports` + แชร์ที่ `/r/[code]`
- [ ] **Safety:** กลุ่มทำ ART → เตือน "อย่าหยุด/ปรับยา-วิตามินเองก่อนปรึกษาแพทย์" · ไม่เคลมรักษา/การันตี

### UX completion mechanics (แบบสอบถามใหม่ /plan)
Endowed progress (เริ่ม >0%) · micro-commitment intro ("พร้อมลงมือ 90 วัน") · personalize ด้วยชื่อแต่เนิ่น · one-topic-per-screen · **ให้เหตุผลทุกคำถามอ่อนไหว** · micro-insight ระหว่างทาง (reciprocity) · goal-gradient ("อีก N ขั้นตอน") · เผยรายงานเป็นโมเมนต์

## 2. Epic B — LINE Webhook Auto-tag
### User Stories
- ในฐานะผู้ใช้ ฉันส่งรหัส MJ-XXXXXX ในแชต LINE OA แล้วได้รายงานกลับอัตโนมัติ + ทีมรู้ว่าฉันคือใคร
- ในฐานะทีม ฉันอยากให้ ticket ถูกจับและจัดหมวด (tag) ให้เองเมื่อลูกค้าทัก

### Requirements (P0)
- [ ] `POST /api/line/webhook`: **verify X-Line-Signature** (HMAC-SHA256 channel secret)
- [ ] จับรหัส MJ-XXXXXX จากข้อความ → หา ticket → **bind `line_user_id` ↔ lead** (`line_bindings` + `leads.line_user_id`)
- [ ] **auto-tag** `#line-connected` + คง auto-tag เดิมของ lead
- [ ] ตอบกลับด้วย **Flex card** สรุปรายงาน (คะแนน + 3 เสา + ปุ่มดูฉบับเต็ม `/r/[code]`) ผ่าน reply API
- [ ] ถ้าไม่พบรหัส → ตอบแนะนำวิธีเอารหัสมา · ถ้าไม่มี channel secret → dev-fallback (ทดสอบด้วย `x-dev-bypass`)
- [ ] ตอบ 200 เสมอ (LINE ต้องการ) · จัดการ error รายเหตุการณ์ไม่ให้ล้มทั้ง batch
### ⚠️ ข้อจำกัดจริง (โปร่งใส)
LINE OA **ไม่มี public API ตั้ง "chat tag" ในแอป LINE Manager โดยตรง** → เราจึง**จัด tag ในระบบของเราเอง** (`tag_assignments`) ที่ทีมเห็นผ่าน `/staff` + bind LINE user ให้รู้ว่าใครคือใคร. (การ sync tag เข้า LINE เนทีฟทำได้แค่ผ่าน manual หรือ audience — พิจารณาภายหลัง)

## 3. Epic C — Admin + Auth + RBAC
### User Stories
- ในฐานะ admin ฉันสร้างบัญชี staff พร้อมตั้ง PIN ให้ และกำหนดสิทธิ์ว่าเข้าถึงอะไรได้
- ในฐานะ staff ฉัน login ด้วยชื่อผู้ใช้+PIN แล้วเห็นเฉพาะสิ่งที่มีสิทธิ์
- ในฐานะเจ้าของระบบ ฉันตั้งค่า admin คนแรกได้เองครั้งเดียว

### Requirements (P0)
- [ ] **สร้าง user ง่าย:** admin กรอกชื่อ+PIN+role+สิทธิ์ → สร้างได้ทันที (`/admin`)
- [ ] **PIN:** hash ด้วย scrypt (salt ต่อคน) ไม่เก็บ plaintext · admin รีเซ็ต PIN ได้
- [ ] **สิทธิ์ (RBAC):** `view_leads · manage_tags · view_reports · manage_users · line_admin · export_data` · role `admin` = ทุกสิทธิ์ · `staff` = เลือกได้รายคน
- [ ] **Session:** signed cookie (HMAC, httpOnly, 8 ชม.) · ทุก API ตรวจสิทธิ์ (`hasPerm`)
- [ ] **Bootstrap:** ถ้ายังไม่มี user → หน้า setup สร้าง admin คนแรก (ครั้งเดียว)
- [ ] `/staff` (ต้อง `view_leads`), `/admin` (ต้อง `manage_users`) · guard self-lockout (ปิด/ลดสิทธิ์ตัวเองไม่ได้)
- [ ] **Audit:** บันทึกการเข้าถึง ticket/แก้ tag/สร้าง user (`staff_audit`)

## 4. Data & API
**ตารางใหม่ (migration 0002):** `staff_users` (pin_hash, role, permissions[]) · `line_bindings` · `reports` (snapshot payload) · `staff_audit` · `leads.line_user_id`
**API ใหม่:**
| Endpoint | สิทธิ์ | ทำอะไร |
|---|---|---|
| `POST /api/auth/login` · `/logout` · `GET /session` | — | login/logout/whoami |
| `GET/POST /api/admin/bootstrap` | ครั้งแรกเท่านั้น | สร้าง admin คนแรก |
| `GET/POST /api/admin/users` · `PATCH /users/[id]` | manage_users | จัดการ staff |
| `POST /api/line/webhook` | LINE signature | จับ ticket + tag + ตอบ Flex |
| `GET /api/ticket/[code]` (อัปเกรด) | view_leads | +report score +LINE status |
| `GET /r/[code]` | รหัส=ความลับ | รายงานแบบแชร์ |

## 5. NFR + จริยธรรม
- **Security:** PIN hash scrypt+timingSafeEqual · session HMAC + httpOnly + verify ทุก request · LINE signature verify · deny-by-default RLS · service key server-only · rate-limit login/lead
- **จริยธรรม (กลุ่มเปราะบาง):** จุดแข็งก่อน (กัน false-alarm) · ไม่เคลมรักษา/การันตี (กัน false hope) · empower ไม่กดดัน · **ห้ามบอกให้หยุด/เปลี่ยนการรักษาแพทย์เอง** · trauma-informed · รวมคู่ครอง · ไม่ฉวยความสิ้นหวัง
- **PDPA:** consent ก่อนเก็บ (มี) · ticket=ความลับสุ่ม · report snapshot เก็บเท่าที่จำเป็น · flow ขอลบ

## 6. Open Questions & Phasing
- Q: sync tag เข้า LINE เนทีฟ (audience API) จำเป็นไหม หรือใช้ระบบ tag เราพอ → **เริ่มด้วยระบบเรา**
- Q: ต้องมี rich menu / auto-greeting ใน LINE OA ด้วยไหม (เฟส 2.1)
- Q: หน้า dashboard analytics (funnel G1–G5) — เฟส 2.1
- ✅ ทำแล้วเฟสนี้: report, webhook, auth/RBAC, admin, stepped questionnaire, shareable report, screen mocks
- ⏳ ก่อน launch จริง: ยืนยันสเปกสินค้า (ล็อกการแมปวิตามิน) · LINE channel (secret/token) · SESSION_SECRET · CI จริง · privacy policy · red-team copy โดย Lucifer (หา false hope/กดดัน)
