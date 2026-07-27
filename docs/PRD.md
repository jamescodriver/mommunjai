# PRD — Mommunjai (แอปเตรียมตั้งครรภ์ by Baby & Mom / ครูก้อย)

> เวอร์ชัน 1.0 · 2026-07-20 · ผู้เขียน: PM/BA/SA (Angiris) · สถานะ: **Draft พร้อม review**
> อ่านคู่กับ [ARCHITECTURE.md](ARCHITECTURE.md) · [DATA-MODEL.md](DATA-MODEL.md)
> เอกสารเวอร์ชันดูง่าย (แบ่ง section พับได้) ที่ [PRD.html](PRD.html)

---

## สารบัญ
- [0. บทสรุปผู้บริหาร](#0-บทสรุปผู้บริหาร)
- [1. Problem Statement](#1-problem-statement)
- [2. Goals & Success Metrics](#2-goals--success-metrics)
- [3. Non-Goals](#3-non-goals)
- [4. Personas & User Stories](#4-personas--user-stories)
- [5. ภาพรวมระบบ & Module Map](#5-ภาพรวมระบบ--module-map)
- [6. Requirements รายโมดูล (M1–M8)](#6-requirements-รายโมดูล)
- [7. Brand CI & Design System](#7-brand-ci--design-system)
- [8. Widget Embed Spec](#8-widget-embed-spec)
- [9. Non-Functional Requirements (NFR)](#9-non-functional-requirements-nfr)
- [10. Analytics & Event Tracking](#10-analytics--event-tracking)
- [11. Open Questions](#11-open-questions)
- [12. Timeline & Phasing](#12-timeline--phasing)

---

## 0. บทสรุปผู้บริหาร
**Mommunjai** = ชุดเครื่องมือฟรีบนเว็บ (mobile-first, ฝังเป็น widget ได้) สำหรับผู้หญิง/คู่รักที่ **อยากมีลูก / เตรียมตั้งครรภ์ / มีบุตรยาก** ภายใต้แบรนด์ Baby & Mom (ครูก้อย)
เป้าคือ **หา lead ใหม่** เข้าระบบแบรนด์ (LINE OA/เพจ/เว็บ) และ **ผูกใจลูกค้าเดิม** โดยให้คุณค่าจริงก่อน (คำนวณ + ความรู้ตามคัมภีร์ครูก้อย) แล้วเก็บ lead ผ่านแบบสอบถาม → consent → **ออกเลข Ticket** → **ระบบ Tag** → ทีมครูก้อยรับช่วงคุยต่อใน LINE OA ได้ตรงจุด
- **สแตก:** Next.js (App Router) + Tailwind + Supabase → Vercel · สถาปัตย์ **BFF** (Backend-for-Frontend)
- **8 โมดูล:** Shell/Brand · 4 เครื่องคำนวณ (ไข่ตก/โปรตีน/สารอาหาร/การนอน) · แนะนำวิตามิน · Lead+Ticket · Tagging+BFF
- **โมเดลงาน:** พัฒนาให้แบรนด์ Baby & Mom

---

## 1. Problem Statement
ผู้หญิงที่พยายามมีลูก โดยเฉพาะกลุ่มมีบุตรยาก/PCOS เจอข้อมูลเตรียมตัวที่ **กระจัดกระจาย น่ากลัว และขายของเกินจริง** ทำให้ตัดสินใจยากและรู้สึกโดดเดี่ยว ขณะเดียวกันแบรนด์ Baby & Mom มีความรู้ (คัมภีร์ครูก้อย) และสินค้าอยู่แล้ว แต่ **ยังไม่มีเครื่องมือดิจิทัลที่เปลี่ยนคนแปลกหน้า → lead ที่ระบุตัวตนได้** อย่างเป็นระบบ ทำให้เสียโอกาสเปลี่ยนผู้สนใจเป็นลูกค้า และดูแลลูกค้าเดิมได้ไม่ทั่วถึง
> ต้นทุนของการไม่ทำ: lead หลุดมือ · ทีมตอบแชตซ้ำ ๆ โดยไม่รู้บริบทคนถาม · แข่งกับเพจคู่แข่งที่มีเครื่องมือ

## 2. Goals & Success Metrics
### เป้าหมาย (outcomes)
| # | เป้าหมาย | ตัววัด | เป้า (90 วันแรก) |
|---|---|---|---|
| G1 | เปลี่ยนผู้เข้าชม → lead ที่ระบุตัวตน (มี ticket) | conversion rate (เข้าเครื่องมือ→ได้ ticket) | ≥ 12% |
| G2 | ดึงเข้า LINE OA | % ของ ticket ที่กด/แจ้งใน LINE OA | ≥ 60% ของ ticket |
| G3 | ทีมคุยต่อได้ตรงจุด (retention/ปิดการขาย) | เวลาเฉลี่ยที่ทีมใช้ระบุตัวตนลูกค้า | < 30 วินาที/เคส |
| G4 | เครื่องมือมีคุณค่าจริง (ใช้ซ้ำ) | สัดส่วนผู้กลับมาใช้ ≥ 2 เครื่องมือ | ≥ 25% |
| G5 | ฝัง widget บนเว็บ/แลนดิ้งได้ | # เว็บ/หน้าที่ฝัง widget | ≥ 3 จุด |

### Leading indicators (เห็นเร็ว)
adoption (คนเริ่มใช้เครื่องมือ/วัน) · completion (ทำแบบสอบถามจบ) · error rate · time-to-result
### Lagging indicators (เห็นช้า)
retention · # lead→ปิดการขาย · ยอดขายสินค้าที่ผูกกับผลเครื่องมือ (OvaAll/Ferty)

## 3. Non-Goals (เฟส 1)
| Non-goal | เหตุผล |
|---|---|
| ตะกร้า/ชำระเงินในแอป | ใช้ช่องทางขายเดิม (LINE/เว็บ) — ลดความซับซ้อน/PCI |
| ระบบ login ผู้ใช้ทั่วไป | ใช้ **ticket** แทน — ลดแรงเสียดทาน, ลดภาระ PDPA |
| หน้า admin เต็มรูป + เชื่อม LINE Messaging API ตรง (bot/rich menu อัตโนมัติ) | เฟส 2 — เฟส 1 มีหน้า staff ค้น ticket แบบง่ายพอ |
| กลุ่มหลังคลอด/ให้นม/ผลิตภัณฑ์ทารก | ติด พ.ร.บ.นมผง — เฟสหลัง |
| แชตบอต AI / คอมมูนิตี้ / สกินแคร์-แฮร์แคร์ | นอกโฟกัส lead-gen เตรียมตั้งครรภ์ |
| Native app (iOS/Android) | เว็บ + widget ครอบคลุมพอสำหรับ lead-gen |

## 4. Personas & User Stories
### Personas
- **P1 — "หมิว" ผู้เตรียมตั้งครรภ์ทั่วไป** (30–38 ปี) วางแผนมีลูก อยากรู้วันไข่ตก/กินอะไรดี · ใช้มือถือ · อยากได้ความมั่นใจ
- **P2 — "แนน" กลุ่มมีบุตรยาก/PCOS** (35–43 ปี) เคยผิดหวัง กำลังจะทำ/เพิ่งทำ IUI/IVF/ICSI · อ่อนไหว · ต้องการกำลังใจ+ความแม่นยำ
- **P3 — "คุณพ่อ" ฝ่ายชาย** ต้องบำรุงสเปิร์ม · อยากรู้ต้องกินโปรตีน/วิตามินเท่าไร
- **P4 — "พี่ทีมครูก้อย" (staff)** รับ lead ต่อใน LINE OA · ต้องรู้ทันทีว่าคนนี้คือใคร สเตจไหน เพื่อคุยให้ตรง
- **P5 — "แอดมินเว็บแบรนด์"** เอาโค้ด widget ไปแปะบนเว็บ/แลนดิ้ง

### User Stories (เรียงตามความสำคัญ)
1. **P1/P2:** ในฐานะผู้เตรียมตั้งครรภ์ ฉันอยากรู้ช่วงวันไข่ตกของฉัน เพื่อวางแผนมีลูกได้แม่นขึ้น
2. **P1/P2:** ฉันอยากรู้ว่าต้องกินโปรตีน/สารอาหารเท่าไรต่อวัน เพื่อบำรุงไข่ให้สมบูรณ์
3. **P1/P2:** ฉันอยากรู้ว่าควรกินวิตามินตัวไหนของครูก้อย เพื่อไม่ต้องเดา
4. **P2:** ฉันอยากได้แผนเฉพาะตัว + คุยกับทีมครูก้อย เพื่อความมั่นใจก่อน/หลังทำเด็กหลอดแก้ว
5. **P4:** ในฐานะทีมครูก้อย ฉันอยากค้นเลข ticket แล้วเห็นโปรไฟล์+ผล+tag ทันที เพื่อคุยให้ตรงและปิดการขาย
6. **P3:** ในฐานะคุณพ่อ ฉันอยากรู้วิธีบำรุงสเปิร์ม เพื่อช่วยภรรยาเพิ่มโอกาส
7. **P5:** ในฐานะแอดมินเว็บ ฉันอยากก็อปโค้ดสั้น ๆ ไปแปะ เพื่อให้เครื่องมือโผล่บนเว็บแบรนด์
8. **Edge/empty/error:** ผู้ใช้กรอกข้อมูลไม่ครบ/รอบเดือนไม่ปกติ/ปฏิเสธ consent → ระบบต้องจัดการอย่างสุภาพและปลอดภัย

---

## 5. ภาพรวมระบบ & Module Map
| Module | ชื่อ | P | สรุป |
|---|---|---|---|
| **M1** | App Shell + Brand + Design System | P0 | โครงแอป, nav, glass UI, responsive, i18n(TH), widget host |
| **M2** | Ovulation Calculator (นับวันไข่ตก) | P0 | คำนวณช่วงไข่ตก/วันมีโอกาส จากรอบเดือน |
| **M3** | Protein Calculator (คำนวณโปรตีน) | P0 | เป้าโปรตีน/วัน ตามน้ำหนัก+สเตจ → แปลงอาหาร/Ferty |
| **M4** | Nutrient Checklist (คำนวณสารอาหาร) | P0 | เทียบการกินวันนี้กับคัมภีร์ 3 เสา + ของต้องงด |
| **M5** | Sleep Calculator (คำนวณการนอน) | P0 | เวลานอน/ตื่นตามรอบ 90 นาที + กฎก่อน 4 ทุ่ม |
| **M6** | Vitamin Recommender (แนะนำวิตามินครูก้อย) | P0 | โปรไฟล์ → สินค้าจริง (OvaAll/PCO-VIT/Motila1…) |
| **M7** | Lead Capture + Consent + Ticket | P0 | แบบสอบถาม → consent(PDPA) → Supabase → gen ticket |
| **M8** | Tagging + BFF API + Staff Lookup | P0 | auto/manual tag · BFF endpoints · หน้าค้น ticket (ทีม) |

> ทุกเครื่องคำนวณ (M2–M6) แชร์ "โปรไฟล์ผู้ใช้" (สเตจ/อายุ/น้ำหนัก/PCOS/แผนทำเด็กหลอดแก้ว) เพื่อส่งต่อเข้า M7 ได้ไร้รอยต่อ

---

## 6. Requirements รายโมดูล

### M1 — App Shell + Brand + Design System (P0)
**คำอธิบาย:** โครงหลักของแอป: หน้า Home ที่รวม 6 เครื่องมือเป็นการ์ด, แถบนำทาง, ระบบดีไซน์ glass, รองรับ desktop+mobile, ภาษาไทย, และเป็น "host" ให้ widget แต่ละตัวทำงานเดี่ยว ๆ ได้
**Acceptance Criteria**
- [ ] Home แสดง 6 การ์ดเครื่องมือ (ไข่ตก/โปรตีน/สารอาหาร/นอน/วิตามิน/รับแผนเฉพาะคุณ) + hero โทนครูก้อย
- [ ] Responsive: มือถือ (≤480px) 1 คอลัมน์, แท็บเล็ต 2, เดสก์ท็อป 3 · ทุกปุ่มแตะง่าย ≥44px
- [ ] Design system glass: การ์ดโปร่งแสง, มุมโค้ง, เงานุ่ม, พื้นหลัง gradient ตาม CI (§7) · dark/light (อย่างน้อย light เป๊ะ)
- [ ] มี layout รองรับโหมด `?embed=1` (ซ่อน nav/footer เพื่อฝัง widget) — ดู §8
- [ ] disclaimer แพทย์อยู่ท้ายทุกหน้าเครื่องมือ (มาจาก config เดียว)
- [ ] โหลดหน้าแรก < 2.5s (4G), LCP < 2.5s
**Technical notes:** Next.js App Router, Tailwind, shared `<ToolShell>` component, config โทน/disclaimer รวมศูนย์, no PII ในหน้า tool จนกว่าจะถึง M7

### M2 — Ovulation Calculator / นับวันไข่ตก (P0)
**คำอธิบาย:** ผู้ใช้กรอกวันแรกของประจำเดือนล่าสุด + ความยาวรอบ (เฉลี่ย) → คำนวณ **วันไข่ตกโดยประมาณ**, **fertile window (ช่วงมีโอกาสสูง)**, และรอบถัดไป
**สูตร (client-side):**
- วันไข่ตก ≈ วันแรกรอบถัดไป − 14 (luteal phase คงที่ ~14 วัน)
- fertile window = ไข่ตก −5 ถึง +1 วัน
- รองรับรอบ 21–35 วัน; ถ้ากรอกนอกช่วง/ไม่รู้ → เตือนว่าผลอาจคลาดเคลื่อน + แนะปรึกษาแพทย์ (โดยเฉพาะ PCOS รอบไม่สม่ำเสมอ)
**Acceptance Criteria**
- [ ] Input: วันประจำเดือนล่าสุด (date picker), ความยาวรอบ (default 28, 21–35), (optional) ระยะ luteal
- [ ] แสดง: วันไข่ตก, fertile window (ช่วงวันที่), วันมีโอกาสสูงสุด, ปฏิทินไฮไลต์ 1–2 เดือนข้างหน้า
- [ ] **Disclaimer เด่น: "ใช้คุมกำเนิดไม่ได้" + "ผลโดยประมาณ ไม่แทนการตรวจ/คำวินิจฉัยแพทย์"**
- [ ] เคส PCOS/รอบไม่ปกติ: แสดงหมายเหตุพิเศษ + CTA รับแผนเฉพาะคุณ (→M7)
- [ ] Empty/invalid: validation สุภาพ, ไม่ crash
- [ ] ผลลัพธ์ส่งต่อเข้าโปรไฟล์กลาง (เก็บ client) เพื่อใช้ที่ M7
**Negative cases:** วันที่อนาคต, รอบ <21 หรือ >35, เว้นว่าง → error message ชัดเจน

### M3 — Protein Calculator / คำนวณโปรตีน (P0)
**คำอธิบาย:** คำนวณ **เป้าโปรตีนต่อวัน** จากน้ำหนัก + สเตจ แล้วแปลงเป็นอาหารจริง/จำนวนซอง Ferty (ตาม nutrition-protocol.md §1)
**สูตร:** เป้า(กรัม/วัน) = น้ำหนัก(กก.) × ค่าต่อกก. ตามสเตจ
| สเตจ | ค่าต่อกก. |
|---|---|
| เตรียมตั้งครรภ์/บำรุงไข่ | **1.2–1.5** (เคาะ 2026-07-25 — ครอบค่าคลินิก ~1.2 ถึงสูตรแบรนด์ 1.5) |
| ตั้งครรภ์ | 1.1–1.3 |
| ให้นม | ~1.3 |
| ชาย บำรุงสเปิร์ม | 1.2–1.6 |
**Acceptance Criteria**
- [ ] Input: น้ำหนัก(กก.), สเตจ (dropdown) · แสดงเป้าเป็นช่วง (min–max กรัม/วัน)
- [ ] แปลงเป็น "≈ ไข่กี่ฟอง / ปลา·อกไก่กี่กรัม / Ferty กี่ซอง" (ไข่ต้ม ~6.5g, อกไก่ 100g ~30g, ปลา 100g ~20g, Ferty 1 ซอง ~25g)
- [ ] tie-in นุ่ม: "ถ้าอาหารไม่ถึงเป้า เติมด้วยโปรตีนเฟอร์ตี้" (→ product-catalog)
- [ ] แสดงที่มาตัวเลข (อ้างครูก้อย/โภชนาการ) + disclaimer
- [ ] Validation: น้ำหนัก 30–150 กก., นอกช่วง → เตือน
**Negative:** น้ำหนัก 0/ติดลบ/ตัวอักษร → error

### M4 — Nutrient Checklist / คำนวณสารอาหาร (P0)
**คำอธิบาย:** ผู้ใช้ติ๊กว่าวันนี้กินอะไรบ้างจากรายการคัมภีร์ → ระบบสรุป "ครบ/ขาดอะไร" ตาม **3 เสา (คุณภาพไข่ · ผนังมดลูก · สมดุลฮอร์โมน)** + เช็กลิสต์ **ของต้องงด**
**Acceptance Criteria**
- [ ] รายการกิน (ติ๊ก): ไข่ต้ม 2 ฟอง, ปลา 1 ตัว, อะโวคาโด+น้ำผึ้งชันโรง, ข้าวกล้อง, ผักสด, น้ำ 2–3L, ผงผักเพียวเรด/กรีน, น้ำมะกรูด
- [ ] รายการงด (เตือนถ้าเผลอ): น้ำตาล, น้ำเย็น, ชา/กาแฟ/คาเฟอีน, ไขมันทรานส์, อาหารแปรรูป
- [ ] ผลลัพธ์: progress ต่อเสา + คำแนะนำเติม (อาหารก่อน แล้วค่อยผงผัก/วิตามิน) + disclaimer
- [ ] tie-in สินค้าเฉพาะที่ขาด (เช่น ขาดผัก→Pure Green/Red) แบบไม่ยัดเยียด
- [ ] Empty state: ยังไม่ติ๊กอะไร → ชวนเริ่ม

### M5 — Sleep Calculator / คำนวณการนอน (P0)
**คำอธิบาย:** 2 โหมด (A) คำนวณเวลาเข้านอน/ตื่นตามรอบหลับ 90 นาที (B) กรอกเวลานอนจริง → ให้สถานะเทียบเป้า "ก่อน 4 ทุ่ม + 7–9 ชม." พร้อมเหตุผลเชิงฮอร์โมน
**Acceptance Criteria**
- [ ] โหมด A: เลือกเวลาตื่น → เสนอเวลาเข้านอน (5–6 รอบ = 7.5–9 ชม.) หรือเลือกเวลานอน → เวลาตื่นที่เหมาะ
- [ ] โหมด B: กรอกเวลานอน-ตื่นจริง → คำนวณชั่วโมง + สถานะ (ดี/ควรปรับ) + **เตือนถ้าเข้านอนหลัง 22:00**
- [ ] อธิบายสั้น ๆ ว่านอนดีช่วยฮอร์โมนเจริญพันธุ์อย่างไร + disclaimer
- [ ] tie-in นุ่ม: นอนยาก → Night Shot/A.O.S
- [ ] Validation เวลา, ข้ามเที่ยงคืนได้

### M6 — Vitamin Recommender / แนะนำวิตามินครูก้อย (P0)
**คำอธิบาย:** ถามโปรไฟล์สั้น ๆ (สเตจ, PCOS?, แผนทำ IUI/IVF/ICSI?, ชาย/หญิง) → map เป็นชุดสินค้าแนะนำจริง (nutrition-protocol.md §4)
**กติกา map**
| โปรไฟล์ | แนะนำหลัก |
|---|---|
| เตรียมตั้งครรภ์ทั่วไป | OvaAll + Ferty |
| PCOS | OvaAll + PCO-VIT + เน้นงดหวาน |
| ก่อนทำ IUI/IVF/ICSI | OvaAll + Ferty 2 ซอง + คัมภีร์บำรุงไข่ |
| ตั้งครรภ์/ให้นม | คัมภีร์บำรุงครรภ์-น้ำนม |
| ชาย | **M-Z All + Ferta + Pure Seed** (ทุกตัวต้องมีวิธีรับประทานที่แบรนด์ยืนยัน · Motila1 ถอดออกชั่วคราวจนกว่าจะได้ dosage — 2026-07-27) |
**Acceptance Criteria**
- [ ] Flow คำถาม 3–5 ข้อ (ทีละข้อ, ก้าวหน้าเห็นชัด)
- [ ] ผล: 1–3 สินค้าหลัก + เหตุผล + องค์ประกอบ (เช่น OvaAll: โฟลิก400/CoQ10 30/น้ำมันปลา500/มัลติ) + วิธีกิน
- [ ] **ห้ามเคลมรักษา** · ใช้ "ช่วยบำรุง/เตรียมพร้อม" + disclaimer
- [ ] CTA → รับแผนเฉพาะคุณ (M7) + ลิงก์ LINE OA
- [ ] ผลผูกเข้าโปรไฟล์กลาง → prefill M7

### M7 — Lead Capture + Consent + Ticket (P0) ⭐
**คำอธิบาย:** หัวใจ lead-gen — รวมโปรไฟล์จากเครื่องมือ + แบบสอบถามเสริม → ขอ consent → บันทึก Supabase → **ออกเลข ticket** ให้ผู้ใช้ไปแจ้งใน LINE OA
**Acceptance Criteria**
- [ ] แบบสอบถาม: ชื่อเล่น, ช่องทางติดต่อ (LINE/เบอร์ — อย่างน้อย 1), สเตจ, อายุ(ช่วง), PCOS?, แผนทำเด็กหลอดแก้ว?, ความสนใจสินค้า, สรุปผลเครื่องมือที่ทำ
- [ ] **Consent (PDPA ม.26):** checkbox ไม่ติ๊กมาก่อน + ข้อความยินยอมเก็บ "ข้อมูลสุขภาพ" + วัตถุประสงค์ (ให้ทีมครูก้อยติดต่อผ่าน LINE OA) + ลิงก์ privacy policy · **บันทึกไม่ได้ถ้าไม่ยินยอม**
- [ ] เก็บ consent (ข้อความ+timestamp+เวอร์ชัน) เป็นหลักฐาน
- [ ] gen **ticket code** สั้น อ่านง่าย ไม่ซ้ำ (เช่น `MJ-4X7K2P`) · โชว์หน้า success + ปุ่ม "เปิด LINE OA" + คัดลอกรหัส
- [ ] ผ่าน **BFF** (ไม่เรียก Supabase ตรงจาก client — key อยู่ server)
- [ ] rate-limit / anti-spam กันยิงถี่
- [ ] error: บันทึกล้มเหลว → ข้อความสุภาพ + retry, ไม่หลอกว่าสำเร็จ
- [ ] รองรับสิทธิถอนยินยอม/ขอลบ (อย่างน้อยมีช่องทาง/อีเมลติดต่อในหน้า privacy)

### M8 — Tagging + BFF API + Staff Lookup (P0)
**คำอธิบาย:** ระบบ tag (auto จากคำตอบ + เพิ่มมือ) + ชุด BFF API + หน้าให้ทีมค้น ticket เพื่อดูโปรไฟล์/tag
**Auto-tag rules (ตัวอย่าง):** PCOS→`#PCOS` · แผน ICSI→`#ICSI` · สเตจชาย→`#บำรุงชาย` · สนใจ OvaAll→`#สนใจ-OvaAll` · ทำครบ 4 เครื่องมือ→`#engaged`
**Acceptance Criteria**
- [ ] BFF endpoints: `POST /api/lead` (สร้าง lead+ticket+auto-tag), `GET /api/ticket/:code` (staff, ต้องยืนยันตัวตน), `POST /api/ticket/:code/tags` (เพิ่ม/ลบ tag)
- [ ] หน้า `/staff` (gate ด้วยรหัส/PIN เฟส 1): ค้น ticket → เห็นโปรไฟล์+ผลเครื่องมือ+tag · เพิ่ม tag มือได้
- [ ] auto-tag ทำงานตอนสร้าง lead · แก้ rule ได้จาก config
- [ ] ทุก endpoint ตรวจ input + ไม่รั่ว PII เกินจำเป็น · log การเข้าถึง (audit เบื้องต้น)
- [ ] (เฟส 2 hook) เผื่อ webhook ส่งเข้า LINE OA — ออกแบบ API ให้ต่อยอดได้

---

## 7. Brand CI & Design System
> ✅ **อัปเดต 2026-07-24 — ใช้ CI จริงแล้ว** (จาก brand guideline + mockup เว็บใหม่) · รายละเอียดเต็ม: BRAND.md + [DESIGN.md](DESIGN.md) §2, §2.5, §9 · ✅ ติดตั้ง **โลโก้ทางการ** แล้ว (2026-07-26)
- **Palette (CI จริง):** **PRIMARY เขียว `#1BC0BA`** · **SECONDARY ชมพู `#F978B3`** · ดำ `#000000` / ขาว · ครีม/พื้น `#FFF8FB` · ทอง accent `#E7B84B` · ink `#3D3D4D`
  - + สี 5 sub-brand stage: PRIME มินต์ · FERTI ม่วง · PREG ฟ้า · REVIVE พีช · BLOOM เหลือง
  - ⛔ เลิกใช้ starter เดิม (rose `#E8A0BF` / teal `#5FB3B3`) — เป็นค่าที่เดาไว้ตอนยังไม่มีไกด์
- **กฎบทบาทสี:** teal = ปุ่มหลัก/ตัวเลข/ลิงก์ · pink = accent + error (ตาราง DESIGN.md §2.5)
- **Glassmorphism:** การ์ด `rgba(255,255,255,.6)` + `backdrop-blur` + border ขาวโปร่ง + เงานุ่ม · พื้นหลัง gradient **มินต์→ชมพู** · ปุ่ม **pill** · feature card **teal gradient**
- **Typography:** **Poppins** (อังกฤษ/หัวเรื่อง/ตัวเลข) + **Prompt** (ไทย) — ทั้งคู่ Google Fonts (SIL OFL)
- **Logo:** ✅ **โลโก้ทางการของแบรนด์** — symbol (แม่อุ้มลูก เขียว+ชมพู) + wordmark `baby&mom+` ตัวอักษรดำ · ใช้ผ่าน `components/wordmark.tsx` (`public/logo.png` / `logo-white.png` สำหรับพื้น teal) · favicon+app icon จาก symbol
- **โทนภาพ/อีโมจิ:** อบอุ่น ให้กำลังใจ · เลี่ยงภาพทารกถี่เกินจนกดดันกลุ่มมีบุตรยาก
- **Components:** ToolCard, ResultCard, StepProgress, ConsentBox, TicketBadge, ProductChip, Disclaimer — ทำเป็น design system เดียวใช้ซ้ำ
- ใช้ **/ui-ux-pro-max** เป็นแนวทางดีไซน์ (glass, spacing, a11y) ตอน build

## 8. Widget Embed Spec
เป้าหมาย: เอาเครื่องมือไปแปะบนเว็บปัจจุบันของแบรนด์ได้ด้วยโค้ดสั้น ๆ
- **วิธี:** `<iframe src="https://<app>/tools/<tool>?embed=1" ...>` + สคริปต์ auto-resize (postMessage ส่งความสูง) เพื่อไม่มี scrollbar ซ้อน
- โหมด `embed=1`: ซ่อน global nav/footer, โปร่งใสพื้นหลังได้, ธีมสืบทอดจาก query (`?theme=light`)
- ตัวอย่าง snippet (ให้แอดมินก็อป): iframe + `<script>` ฟัง `message` แล้วปรับ height
- **Acceptance:** ฝังใน HTML ภายนอกแล้วทำงานครบ (คำนวณ + ส่ง lead ผ่าน BFF ข้ามโดเมนได้ด้วย CORS ที่คุมโดเมน allowlist) · responsive ในกรอบแคบ
- **Security:** CORS allowlist โดเมนแบรนด์เท่านั้นสำหรับ POST /api/lead · CSP frame-ancestors จำกัดโดเมนที่ฝังได้

## 9. Non-Functional Requirements (NFR)
| ด้าน | ข้อกำหนด |
|---|---|
| **Performance** | LCP < 2.5s, TTI < 3.5s (4G) · เครื่องคำนวณตอบ < 100ms (client) · API p95 < 500ms |
| **Responsive** | ใช้ได้ 320–1440px+ · ทดสอบ iPhone SE, Pixel, iPad, desktop |
| **Accessibility** | WCAG 2.1 AA เบื้องต้น: contrast ≥4.5:1, keyboard nav, label ครบ, ปุ่ม ≥44px, aria สำหรับ step |
| **Security** | BFF ซ่อน service key · input validation ทุก endpoint · rate-limit · CORS/CSP allowlist · ไม่มี secret ใน client bundle |
| **Privacy/PDPA** | consent ก่อนเก็บข้อมูลอ่อนไหว · เก็บเท่าที่จำเป็น · RLS ที่ Supabase · ticket สุ่ม · flow ขอลบ |
| **Reliability** | บันทึก lead ต้อง atomic (lead+ticket+tags) · ล้มเหลวไม่หลอกว่าสำเร็จ · idempotency สำหรับ submit ซ้ำ |
| **SEO/Share** | meta/OG ต่อเครื่องมือ (หน้า full, ไม่ใช่ embed) เพื่อ organic lead |
| **i18n** | ไทยเป็นหลัก · โครงสร้างพร้อมเพิ่มภาษา |
| **Compliance content** | disclaimer ทุกผล · ไม่มีคำเคลมรักษา/การันตีท้อง (ตรวจอัตโนมัติในเทสต์) |

## 10. Analytics & Event Tracking
- events: `tool_open`, `tool_complete`, `lead_submit`, `consent_given`, `ticket_created`, `line_click`, `widget_view`
- เก็บแบบไม่ผูก PII เกินจำเป็น (ใช้ ticket id/anon id) · ใช้ทำ funnel G1–G5
- (เลือก) Vercel Analytics / เก็บ event ลง Supabase table `events`

## 11. Open Questions
| # | คำถาม | ใคร | บล็อก? |
|---|---|---|---|
| Q1 | บัญชี Supabase/Vercel/GitHub เฉพาะของแอปนี้ | ต้น/แบรนด์ | บล็อก deploy |
| Q2 | CI จริง (สี/โลโก้/ฟอนต์) + สิทธิ์ใช้ภาพครูก้อย/สินค้า | แบรนด์/Gabriel | บล็อกงานภาพ ไม่บล็อก dev |
| Q3 | หน้า staff เฟส 1: PIN-gate พอ หรือขอ auth จริง? | ต้น | ไม่บล็อก (เริ่ม PIN) |
| Q4 | สถานะ อย./ฆอ. ของสินค้าที่จะแนะนำ | แบรนด์/legal | บล็อกคอนเทนต์ขาย |
| Q5 | data controller/นโยบายเก็บ-ลบข้อมูล (PDPA) | แบรนด์/legal | ต้องได้ก่อน launch |
| Q6 | LINE OA: เฟส 1 แค่ deep link หรือทำ webhook เชื่อม? | ต้น | ไม่บล็อก (เริ่ม deep link) |
| Q7 | โดเมน widget ที่จะอนุญาตฝัง (CORS allowlist) | แบรนด์ | ก่อนเปิด widget |

## 12. Timeline & Phasing
- **Phase 1 (MVP):** M1 + M2–M6 (เครื่องมือ + วิตามิน) + M7 (lead/ticket) + M8 (BFF+auto-tag+staff lookup แบบ PIN) → **นี่คือขอบเขต build รอบนี้**
- **Phase 2:** เชื่อม LINE Messaging API (webhook/rich menu/bot), หน้า admin เต็ม, dashboard analytics, กลุ่มตั้งครรภ์/หลังคลอด (ทบทวน พ.ร.บ.นมผง)
- **Dependencies:** Q1 (บัญชี) ก่อน deploy จริง · Q2 (CI) ก่อน finalize ภาพ · dev เริ่มได้ทันทีด้วย CI ตั้งต้น
