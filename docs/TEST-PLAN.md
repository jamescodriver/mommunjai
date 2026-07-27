# Test Plan — Mommunjai (Functional + NFR)

> เวอร์ชัน 1.0 · 2026-07-21 · Tester (Angiris) · อ่านคู่กับ [PRD.md](PRD.md)
> รายงานผลจริง (พร้อม evidence): [TEST-REPORT.html](TEST-REPORT.html)
> ระดับ: unit (vitest) · integration/API (curl) · UI/e2e (browser) · NFR (perf/security/PDPA/a11y/responsive)

## 1. Test Scenarios (ระดับสูง)
| SC | สถานการณ์ | ครอบคลุมโมดูล |
|---|---|---|
| SC-1 | ผู้ใช้คำนวณเครื่องมือแล้วได้ผลถูกต้อง + มี disclaimer | M2–M6 |
| SC-2 | ผู้ใช้กรอกข้อมูลผิด/ขอบเขต → ระบบเตือนอย่างสุภาพ ไม่ crash | M2–M7 |
| SC-3 | ผู้ใช้ทำแบบสอบถาม + ยินยอม → ได้เลข ticket + auto-tag | M7, M8 |
| SC-4 | ผู้ใช้ไม่ยินยอม/ข้อมูลไม่ครบ → บันทึกไม่ได้ | M7 |
| SC-5 | ทีมงานค้น ticket → เห็นโปรไฟล์/tag (ต้องมี PIN) | M8 |
| SC-6 | ฝังเครื่องมือเป็น widget บนเว็บอื่น (embed) | M1, M8 |
| SC-7 | NFR: เร็ว · ปลอดภัย · PDPA · เข้าถึงได้ · responsive | ทั้งระบบ |

## 2. Functional Test Cases
### M2 นับวันไข่ตก
| TC | Input | Expected |
|---|---|---|
| TC-OV-01 | 1 ก.ค. 2026, รอบ 28 | ไข่ตก 15 ก.ค., fertile 10–16 ก.ค., รอบถัดไป 29 ก.ค. |
| TC-OV-02 | วันในอนาคต | error "ต้องไม่เป็นวันในอนาคต" |
| TC-OV-03 | รอบ 12 / 40 | error "21–35 วัน" |
| TC-OV-04 | รอบ 34 | irregularWarning = true + หมายเหตุ |
| TC-OV-05 | UI กรอก+กด | result card แสดง + disclaimer "คุมกำเนิดไม่ได้" |

### M3 คำนวณโปรตีน
| TC | Input | Expected |
|---|---|---|
| TC-PR-01 | 55 กก. prep | 55–66 กรัม · Ferty ≥2 ซอง |
| TC-PR-02 | 60 กก. pregnant | 66–78 กรัม |
| TC-PR-03 | 0 / 200 กก. | error ช่วง 30–150 |
| TC-PR-04 | UI 55 กก. | แสดง 55–66 กรัม + ไข่ 9 ฟอง + Ferty 2 ซอง (browser) |

### M4 เช็กสารอาหาร
| TC | Input | Expected |
|---|---|---|
| TC-NU-01 | ติ๊กครบ + น้ำตาล | overall 100% · violation "ของหวาน/น้ำตาล" |
| TC-NU-02 | ติ๊กแค่ไข่ | overall < 100 · missing list ไม่ว่าง |

### M5 คำนวณการนอน
| TC | Input | Expected |
|---|---|---|
| TC-SL-01 | ตื่น 06:30 (โหมด A) | เสนอ 2 เวลาเข้านอน (7.5/9 ชม.) |
| TC-SL-02 | นอน 22:00–06:00 | 8 ชม. · status "ดี" · beforeTen true |
| TC-SL-03 | นอน 01:00–08:00 | status "ควรปรับ" + เตือนก่อน 4 ทุ่ม |
| TC-SL-04 | เวลาผิดรูปแบบ | error |

### M6 แนะนำวิตามิน
| TC | Input | Expected |
|---|---|---|
| TC-VI-01 | prep + PCOS | แนะนำ OvaAll + PCO-VIT |
| TC-VI-02 | male | แนะนำ M-Z All + Ferta + Pure Seed **และทุกตัวต้องมี `howto`** (regression: เคยไม่มีวิธีรับประทานเลย) |
| TC-VI-03 | ทุกเคส | note + ข้อความสินค้า ไม่มีคำเคลมรักษา/ป้องกันโรค/การันตี (รวม "มะเร็ง", "หย่อนสมรรถภาพ", "ไม่มีผลข้างเคียง") |

### M7 Lead + Consent + Ticket
| TC | Input | Expected |
|---|---|---|
| TC-LE-01 | consent + ครบ | 200 + ticket MJ-XXXXXX |
| TC-LE-02 | consent=false | 400 "ต้องยินยอม" |
| TC-LE-03 | ไม่มี contact | 400 |
| TC-LE-04 | PCOS+ICSI+ovaall | tags: #PCOS #มีบุตรยาก #ICSI #สนใจ-OvaAll |

### M8 Tag + Staff
| TC | Input | Expected |
|---|---|---|
| TC-ST-01 | GET ticket ไม่มี PIN | 401 |
| TC-ST-02 | auto-tag ตอนสร้าง lead | tags ถูกผูก |
| TC-ST-03 | เพิ่ม manual tag | upsert สำเร็จ (staff) |

### M1 Shell + Widget
| TC | Input | Expected |
|---|---|---|
| TC-SH-01 | เปิด / | 6 การ์ด + hero + disclaimer |
| TC-SH-02 | /tools/x?embed=1 | 200 + ซ่อน nav |
| TC-SH-03 | header /tools/* | CSP frame-ancestors |

## 3. NFR Test Cases
| TC | ด้าน | Expected |
|---|---|---|
| TC-NFR-P1 | Performance | first-load JS ≤ ~100kB · tool pages static · home TTFB < 50ms |
| TC-NFR-S1 | Security | staff endpoint 401 ไม่มี PIN |
| TC-NFR-S2 | Security | rate-limit /api/lead (5/นาที → 429) |
| TC-NFR-S3 | Security | service key server-only (ไม่อยู่ใน client bundle) |
| TC-NFR-S4 | Security | CSP frame-ancestors + CORS allowlist |
| TC-NFR-D1 | PDPA | บันทึกไม่ได้ถ้าไม่ consent · เก็บ consent_log · ticket สุ่ม |
| TC-NFR-A1 | Accessibility | label ครบ · ปุ่ม ≥44px · โครงสร้าง heading |
| TC-NFR-R1 | Responsive | grid 1/2/3 คอลัมน์ mobile→desktop |
| TC-NFR-C1 | Compliance | disclaimer ทุกผล · ไม่มีคำเคลมรักษา/การันตีท้อง |

## 4. Out-of-scope (เทสต์เพิ่มก่อน launch)
- Load test จริง (คู่กับ Supabase prod), penetration test, a11y audit ด้วยเครื่องมือ (axe), cross-browser matrix, การทดสอบ integration กับ Supabase จริง (เฟสนี้ทดสอบด้วย dev-fallback + logic ผ่าน service layer)
