# DESIGN.md — มาตรฐานการออกแบบ Mommunjai (Design System)

> เอกสารมาตรฐานสำหรับออกแบบ/สร้างหน้าจอทุกหน้าให้สอดคล้องกัน · อ้างอิง CI จริงที่ BRAND.md (จาก brand guideline) — **token สีต้อง sync กับ BRAND.md เสมอ**
> แนวทาง UI/UX: อิง `/ui-ux-pro-max` (glass, spacing, a11y) · โค้ดจริงอยู่ใน `tailwind.config.ts` + `app/globals.css`
>
> ⚠️ **สถานะ Figma (เว็บใหม่):** ไฟล์ Figma `Baby-Mom` (node 520-6466) **เข้าถึงไม่ได้ในเซสชันนี้** (ต้อง login / เชื่อม Figma) — §9 คือช่องที่ต้องเติมจาก Figma เมื่อ export/เชื่อมได้ ส่วน §1–§8 คือมาตรฐานที่ใช้ได้เลยตอนนี้

---

## 1. หลักการออกแบบ (Design Principles)
1. **อ่อนโยน–ให้กำลังใจ** (กลุ่มเปราะบาง: มีบุตรยาก) — ไม่กดดัน ไม่ขายความกลัว
2. **Mobile-first** — แม่ๆ ใช้มือถือเป็นหลัก ออกแบบ 375px ก่อน แล้วขยาย
3. **Glassmorphism อบอุ่น** — การ์ดโปร่งแสง มุมโค้ง เงานุ่ม บนพื้น gradient rose→teal
4. **ให้คุณค่าก่อน ค่อยชวน** — เครื่องมือ/ผลลัพธ์เด่นก่อน CTA
5. **ชัด เชื่อถือได้ มีวิทย์รองรับ** — ตัวเลขมีที่มา + disclaimer เสมอ
6. **เข้าถึงได้ (a11y)** — contrast, ปุ่มใหญ่, keyboard, ภาษาไทยอ่านง่าย

## 2. Design Tokens — **CI จริงจาก BRAND.md** (⚠️ โค้ดยังใช้ starter อยู่ ต้องอัปเดต)
> Gabriel ถอดจาก brand guideline จริง — **ต่างจาก starter เดิม (rose/teal) อย่างมาก** · dev อัปเดต `tailwind.config.ts` + `app/globals.css` แล้ว · โลโก้ทางการติดตั้งแล้ว (2026-07-26)
```
สี CI จริง (ใช้อันนี้):
  PRIMARY  เขียว  #1BC0BA  (RGB 27/192/186 · CMYK 70/0/34/0) — สีหลัก/โลโก้
  SECONDARY ชมพู #F978B3  (RGB 249/120/179 · CMYK 0/68/0/0)
  ดำ #000000 (ตัวอักษรโลโก้) · ขาว #FFFFFF · (Pantone ไกด์ไม่ระบุเลข)
  สถานะ (คงเดิม): pass #3C9A5F · warn #C9930F · LINE #06C755
  ⛔ starter เดิม rose #E8A0BF / teal #5FB3B3 = ค่าที่เดา — เลิกใช้
Typography (ล็อกแล้ว):
  อังกฤษ = Poppins · ไทย = Prompt (ทั้งคู่ Google Fonts, SIL OFL, ฟรีเชิงพาณิชย์)
  scale: h1 22–36 / h2 18–20 / body 14–16 / caption 12
Spacing: ฐาน 4px · การ์ด padding 20–28 · gap 12–16
Radius: การ์ด xl2 (1.25rem) · ปุ่ม full (pill) · input xl (0.75rem)
Shadow: glass = 0 8px 30px rgba(20,120,110,.12)  (ปรับเงาให้เข้าโทนเขียว)
Glass: bg white/60 + backdrop-blur-md + border white/70
```
> โทนแบรนด์จริง: **สด/คอนทราสต์สูงกว่า** ที่ starter เดา · พื้น gradient ควรปรับเป็นเขียว#1BC0BA→ชมพู#F978B3 อ่อน

## 2.5 กฎการใช้สี (color roles — บังคับใช้ทั้งแอป)
> ถอดจากเว็บจริง: **teal = การกระทำหลัก/ตัวเลข/ลิงก์** · **pink = accent + เตือน** · ใช้กฎนี้เสมอ อย่าสลับ
| บทบาท | สี | ใช้ที่ |
|---|---|---|
| Primary action | **teal** `.btn-primary` | ปุ่มหลักทุกหน้า, ปุ่มค้นหา, ส่งฟอร์ม |
| Outline action | **teal border** `.btn-ghost` | ปุ่มรอง "ย้อน", คัดลอกรหัส |
| Secondary/accent action | **pink** `.btn-secondary` | CTA เน้นพิเศษ (ใช้เท่าที่จำเป็น) |
| ตัวเลข/สถิติ/คะแนน | **teal-deep** | ผลคำนวณ (โปรตีน/ชั่วโมงนอน/%/คะแนน 100) |
| ลิงก์ & ลูกศร | **teal-deep** | "← กลับหน้าหลัก", "ดูรายงาน →", "เริ่มเลย →" |
| สถานะเลือกอยู่ (selected) | **teal border + teal-soft bg** | ปุ่มตัวเลือกในแบบสอบถาม/วิตามิน |
| Error / คำเตือน | **rose-deep (pink)** | ข้อความ error, "ควรเลี่ยง", ปิดใช้งาน user |
| Ticket code | **teal dashed + teal-soft** | หน้า success + หัวรายงาน |
| Progress bar / pillar | **teal** | แบบสอบถาม, 4 เสาในรายงาน |

## 3. Components (design system — มีใน `components/ui.tsx`)
| Component | ใช้ตอนไหน | สเปก |
|---|---|---|
| `Wordmark` | หัวหน้า/รายงาน/login/footer | **โลโก้ทางการ** (`components/wordmark.tsx` → `public/logo.png`) · prop: `height` (px) และ `white` สำหรับพื้น teal · ⛔ ห้ามเปลี่ยนสี/บิดสัดส่วน (BRAND.md §1.7) |
| `.card-feature` | บล็อกเน้น/footer แบรนด์ | teal gradient + ตัวอักษรขาว (แบบ feature card เว็บ) |
| `.btn-secondary` | CTA accent | pill ชมพู |
| `ToolShell` | กรอบเครื่องมือทุกตัว | หัว emoji+title, intro, เนื้อหา, disclaimer, back link (ซ่อนใน embed) |
| `ResultCard` | แสดงผลคำนวณ | glass-strong, `aria-live=polite` |
| `Field` | input + label | label ชัด, hint เล็ก |
| `btn-primary/ghost` | ปุ่ม | min-h 44px, pill, active:scale |
| `chip` | tag/สถานะ | teal อ่อน, โค้งเต็ม |
| `ProductChip` | แนะนำสินค้า | ชื่อ + ราคา |
| `Disclaimer` | ท้ายทุกผลสุขภาพ | 12px, สีจาง, มาจาก config เดียว |
| `StepProgress` | แบบสอบถาม/report | endowed progress ("อีก N ขั้น") |
| `TicketBadge` | หน้า success | โค้ด MJ- ตัวใหญ่ เส้นประ |

## 4. Layout & Responsive
- Breakpoints (Tailwind): mobile ≤640 (1 คอลัมน์) · sm 640 (2) · lg 1024 (3)
- Container: เครื่องมือ `max-w-xl` · หน้าหลัก `max-w-5xl` · form `max-w-md`
- แตะง่าย: ปุ่ม/ช่องติ๊ก ≥44px · ระยะห่าง element ≥8px
- หน้าเนื้อห้ากว้าง (ตาราง) → scroll ในกรอบตัวเอง ไม่ให้ body scroll แนวนอน

## 5. Motion
- ทรานสิชันนุ่ม 150–200ms · hover การ์ด ยก -2px + เงาเข้ม · ปุ่ม active scale .98
- progress bar / คะแนน: animate width · หลีกเลี่ยง motion แรงกับกลุ่มเปราะบาง

## 6. Accessibility (WCAG 2.1 AA เป็นเป้า)
- Contrast ≥4.5:1 (ตรวจ ink บน glass · gold บนพื้นอ่อนระวัง)
- ทุก input มี `<label>` · ปุ่มมีข้อความ/aria · โฟกัสมองเห็น (ring teal)
- ผลลัพธ์ `aria-live` · ลำดับ heading ถูกต้อง · ภาษา `lang="th"`
- ⏳ ยังต้อง audit ด้วย axe/Lighthouse ก่อน launch

## 7. เนื้อหา & Voice
- เรียก "คุณ/คุณแม่ๆ" อบอุ่น · อธิบาย "ทำไม" · ห้ามเคลมรักษา/การันตี (ดู legal-compliance.md)
- disclaimer สุขภาพทุกผล · นับไข่ตก = "คุมกำเนิดไม่ได้"

## 8. Screen Inventory (มาตรฐานหน้าจอ — ดูภาพที่ SCREEN-MOCKS.html)
17 จอ 5 กลุ่ม: A เครื่องมือ 6 · B แบบสอบถาม/consent/ticket 3 · C รายงาน 90 วัน + LINE 3 · D staff/admin 4 · E widget embed 1

## 9. Website Design Language — เว็บใหม่ (ถอดจาก mockup จริง `source/website guide/`)
> ที่มา: mockup เว็บ 4 หน้า (Homepage, ให้ BabyAndMom แนะนำคุณ, เส้นทางการเป็นแม่, ผลิตภัณฑ์) · Figma p9EF9CdoHyYOMORItHyb9C เข้าได้แต่ **View-only** (MCP ต้อง edit) → ใช้ mockup แทน · **นี่คือมาตรฐานจริงที่ UI แอปต้องล้อตาม**

### 9.1 Logo & Brand mark
- ✅ **โลโก้ทางการ (ติดตั้งแล้ว 2026-07-26)** — lockup แนวนอน: **symbol** (แม่โอบลูก โค้งมน เขียว #1BC0BA + ตัวเชื่อมชมพู #F978B3) + **wordmark "baby&mom" ตัวอักษรสีดำ** + **"+" ชมพูตัวยก**
  - ⚠️ แก้ความเข้าใจเดิม: ตัวอักษร wordmark เป็น **สีดำ** ไม่ใช่เขียว/ชมพู (ตรงกับ BRAND.md §2.1 ที่ระบุ "ตัวอักษรโลโก้เป็นสีดำ")
  - ไฟล์: `public/logo.png` (สี) · `public/logo-white.png` (ขาวล้วน — ใช้บนพื้น teal/footer) · `app/icon.png` + `app/apple-icon.png` (favicon/app icon ตัด symbol เดี่ยว) · ต้นฉบับ `assets/brand/BAM-Logo-master.png`
  - เรียกใช้ผ่าน `<Wordmark height={40} />` หรือ `<Wordmark height={30} white />`
- Tagline: **"Where Science Meets Motherhood"** (EN, Poppins) · sub "ยึดหลักวิทยาศาสตร์"

### 9.2 สี (ยืนยัน + เพิ่มสี stage)
- Primary **เขียว #1BC0BA** (top bar, ปุ่มหลัก, footer, feature card gradient) · Secondary **ชมพู #F978B3** (accent, active state, "+"/molecule)
- **สี 5 sub-brand (stage cards):** PRIME=มินต์เขียวอ่อน · FERTI=ม่วง · PREG=ฟ้า · REVIVE=พีช/ส้มอ่อน · BLOOM(BABY)=เหลือง — ใช้เป็น theme ต่อ stage (เก็บใน token `stage.*`)
- พื้น: ขาว + gradient hero มินต์→ชมพูอ่อน · Neutral: เทาเข้ม #3D3D4D หัวข้อ, เทากลางเนื้อหา

### 9.3 Typography
- EN = **Poppins** (หัวเรื่องใหญ่, ตัวเลข stat) · TH = **Prompt** · หัวเรื่องผสมสี (เทา + คำเน้นเขียว/ชมพู เช่น "Where **Science** Meets **Motherhood**")
- Stat ตัวเลขใหญ่ (98%/95%) เขียว bold + เงานุ่ม

### 9.4 Components (เว็บ → map เข้าแอป)
| เว็บ | สเปก | ใช้ในแอป |
|---|---|---|
| **Top bar** | เขียวเต็มแถบ + social icons ขาว + TH/ภาษา | (แอปไม่ต้องมี แต่ปุ่ม/สีให้ตรง) |
| **Nav** | ขาว, เมนู active ชมพู, ปุ่มคู่ "ติดต่อเรา"(outline teal) + "สมัครสมาชิก"(filled teal) | ปุ่ม pill teal |
| **Hero** | glass card + headline ผสมสี + 2 ปุ่ม pill (filled teal + outline teal, มีไอคอน) + รูปคนจริง + molecule/+ /blob | หน้า Home |
| **Stage card** | สี solid pastel ต่อ stage, ไอคอนในวงกลมขาว, ชื่อ sub-brand bold, desc, "ดูหน้า X →", รูปด้านล่าง, radius ~20px | การ์ดเครื่องมือ/สเตจ |
| **Feature card** | **teal gradient** + ไอคอนวงกลมขาว + หัวข้อ EN ขาว bold + desc กลาง | ResultCard/จุดขายวิทย์ |
| **Stat block** | ตัวเลขใหญ่เขียว + คำอธิบาย | รายงาน/หน้า Home |
| **Article card** | ขาว, รูปบน (radius), pill tag สี stage, หัวข้อเทา bold, "อ่านต่อ →" teal | คอนเทนต์/บทความ |
| **ปุ่ม** | **pill เต็มโค้ง** · filled = เขียว #1BC0BA ตัวอักษรขาว · outline = ขอบเขียว ตัวอักษรเขียว · มักมีไอคอน+ลูกศร → | `.btn-primary`/`.btn-ghost` |
| **Footer** | พื้น **เขียวเต็ม** ตัวอักษรขาว, logo ขาว, tagline, ที่อยู่บริษัท, 4 คอลัมน์ลิงก์ (รวมผลิตภัณฑ์ BBM), social icons วงกลมขาว, ช่องฝากคำถาม | footer แอป |
| **Decorative** | molecule/atom (วิทย์), เครื่องหมาย "+" ชมพู, blob โค้งมน เขียว/ชมพูจาง, watermark symbol | ใช้ประดับเบา ๆ |

### 9.5 จังหวะ/เลย์เอาต์
- Section กว้าง เว้นช่องเยอะ (whitespace สูง) · หัวข้อ section กึ่งกลาง + subtitle เทา · การ์ด grid 3–5 คอลัมน์ (desktop) → 1 (mobile)
- radius ใหญ่ (การ์ด ~20–24px, ปุ่ม pill เต็ม) · เงานุ่มฟุ้ง · ภาพคนจริงโทนพาสเทล

### 9.6 สิ่งที่ต้องขอเพิ่ม
- ✅ โลโก้ทางการ (ได้แล้ว — PNG) · ⏳ vector สำหรับงานพิมพ์ · icon set (heart/sparkle/pregnant/lotus/baby ในวงกลม) · ภาพถ่ายลิขสิทธิ์ · หน้า mockup "ให้ BabyAndMom แนะนำคุณ" = แนวทาง flow แบบสอบถาม/แนะนำ (ล้อกับ /plan ของแอป)
> หมายเหตุ: footer เขียน sub-brand baby-care เป็น "BMM BABY" แต่ hero เขียน "BBM BLOOM" — ให้ยืนยันชื่อทางการกับแบรนด์

## 9.7 สถานะการนำไปใช้ในแอป (2026-07-24) — ✅ ครบทุกหน้า
| หน้า | สถานะ |
|---|---|
| `/` Home | ✅ wordmark + "Where Science Meets Motherhood" + ปุ่ม teal + tool cards + footer teal gradient |
| `/tools/*` (5 เครื่องมือ) | ✅ ปุ่ม teal · **ตัวเลขผลลัพธ์ teal-deep** · back link teal · selected chip teal |
| `/plan` (แบบสอบถาม) | ✅ progress teal · selected chip teal · consent/checkbox teal · **ticket badge teal** · error ชมพู |
| รายงาน 90 วัน (`components/report-view.tsx`, `/r/[code]`) | ✅ wordmark หัวรายงาน · หมายเลขหัวข้อวงกลม teal · คะแนน+เสา teal · ticket teal |
| `/staff` · `/admin` | ✅ ลิงก์ teal · ปุ่ม teal · error/ปิดใช้งาน ชมพู · แก้ fallback tag color → `#1BC0BA` |
| `/login` | ✅ + เพิ่ม Wordmark หัวการ์ด |
| `/privacy` | ✅ back link teal |
> ⚠️ **Dev gotcha:** อย่ารัน `npm run build` ขณะ dev server เปิดอยู่ (ใช้ `.next` โฟลเดอร์เดียวกัน) — จะทำให้ dev พัง `__webpack_modules__[moduleId] is not a function` · แก้: หยุด server → `rm -rf .next` → start ใหม่

## 10. หลักปฏิบัติเมื่อออกแบบหน้าใหม่
1. เริ่มจาก mobile · ใช้ token §2 (อย่า hardcode สี) · ประกอบจาก component §3
2. ทุกผลสุขภาพใส่ disclaimer · ทุกหน้ามี CTA เข้าระบบแบรนด์อย่างนุ่มนวล
3. ผ่าน a11y check + red-team copy (กลุ่มเปราะบาง) ก่อน ship
4. sync token กับ BRAND.md · ผูกภาพกับ assets/ (ขอ vector จริงจากแบรนด์)
