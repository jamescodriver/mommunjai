# คู่มือติดตั้งเอง — Fork ไป GitHub/Vercel/Supabase บัญชีใหม่

> สำหรับบัญชีที่ fork repo นี้ไปตั้งเป็นของตัวเอง (คนละ GitHub/Vercel/Supabase account จากที่ทีมพัฒนาใช้อยู่)
> ไม่มีขั้นตอนไหนต้องรอทีมเดิม — ทำได้ครบในบัญชีของตัวเอง ยกเว้นหัวข้อ 6 (ไฟล์ที่ต้องขอส่งต่างหาก)

---

## 0. ภาพรวมสิ่งที่จะได้

Repo นี้เป็น **Next.js 14 app เดียว** (ไม่มี backend แยก) เชื่อมกับ **Supabase** (ฐานข้อมูล) ผ่าน BFF (Backend-for-Frontend — โค้ด API ในแอปเรียก Supabase เอง ฝั่งเบราว์เซอร์ไม่เห็น credential) และเชื่อม **LINE Official Account** (Messaging API) สำหรับส่งแผนฉบับเต็ม

Repo เป็น **public** บน GitHub — กด Fork ได้เลยไม่ต้องขอสิทธิ์

---

## 1. Fork repo (GitHub)

1. เปิด `https://github.com/jamescodriver/mommunjai` (หรือ `https://github.com/tonpalearn/mommunjai` — เนื้อหาเหมือนกัน sync กันอยู่)
2. กด **Fork** มุมขวาบน → เลือกบัญชี/organization ปลายทางของตัวเอง
3. Clone มาเครื่อง (ไม่บังคับ แต่สะดวกเวลาต้องรัน migration/แก้โค้ด):
   ```bash
   git clone https://github.com/<your-account>/mommunjai.git
   cd mommunjai
   npm install
   ```

---

## 2. สร้าง Supabase project ใหม่ + รัน migration

**ห้ามใช้ Supabase project เดิมร่วมกับทีมอื่น** — ต้องเป็น project แยกเฉพาะของบัญชีนี้ (ข้อมูลลูกค้าเป็นข้อมูลสุขภาพ อ่อนไหวตาม PDPA)

1. ไปที่ [supabase.com](https://supabase.com) → **New Project** → ตั้งชื่อ + รหัสผ่าน DB (เก็บไว้ใช้ต่อ) → เลือก region ใกล้ผู้ใช้ (เช่น Singapore)
2. รอ project provision เสร็จ (~2 นาที)
3. เปิด **SQL Editor** ในโปรเจกต์ → รันไฟล์ migration **ตามลำดับเลขจากน้อยไปมาก** (ห้ามข้าม ห้ามสลับลำดับ — แต่ละไฟล์ additive-only ต่อจากไฟล์ก่อนหน้า):

   | ลำดับ | ไฟล์ | เนื้อหา |
   |---|---|---|
   | 1 | `supabase/migrations/0001_init.sql` | ตารางหลัก: leads, tickets, tag_assignments, consent_log, tool_results, events, line_bindings, reports |
   | 2 | `supabase/migrations/0002_phase2.sql` | staff_users (ระบบแอดมิน/สิทธิ์) |
   | 3 | `supabase/migrations/0003_customer_identity.sql` | ตาราง customers (จำลูกค้าข้าม session ผ่าน LINE) |
   | 4 | `supabase/migrations/0004_r2607_batch.sql` | ฟิลด์เพิ่มเติมรอบ R2 |
   | 5 | `supabase/migrations/0005_leads_audit_detail.sql` | audit log ละเอียดขึ้นสำหรับแก้ไข lead |
   | 6 | `supabase/migrations/0006_r3_profile_fields.sql` | ฟิลด์โปรไฟล์สุขภาพรอบ R3 (BMI, ไขมัน, ฯลฯ) |
   | 7 | `supabase/migrations/0007_tool_results_widen.sql` | ขยาย tool_results รองรับเครื่องมือใหม่ |

   วิธีรัน: เปิดไฟล์ → copy เนื้อหาทั้งไฟล์ → วางใน SQL Editor → Run ทีละไฟล์ (แต่ละไฟล์ใช้เวลาไม่กี่วินาที)

4. ยืนยันว่าตารางถูกสร้างครบ: ไปที่ **Table Editor** ควรเห็น `leads`, `tickets`, `tag_assignments`, `consent_log`, `tool_results`, `events`, `line_bindings`, `reports`, `staff_users`, `customers` เป็นอย่างน้อย
5. เก็บ 2 ค่านี้ไว้ (จะใช้ในขั้นตอน Vercel): **Settings → API**
   - `Project URL` → ใช้เป็น `SUPABASE_URL`
   - `service_role` key (ไม่ใช่ `anon` key — ต้องเป็น service_role เพราะแอปเป็น BFF) → ใช้เป็น `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **RLS (Row Level Security)** ทุกตารางเปิดไว้แบบ deny-by-default ไม่มี policy เลย — เข้าถึงได้ทางเดียวคือผ่าน `service_role` key จากโค้ด BFF เท่านั้น ห้ามสร้าง policy เพิ่มเองโดยไม่เข้าใจผลกระทบ (จะเปิดช่องให้เบราว์เซอร์อ่านข้อมูลตรงได้)

---

## 3. ตั้งค่า LINE Official Account (Messaging API)

ถ้ายังไม่มี LINE OA เป็นของตัวเอง:

1. สร้าง LINE Official Account ที่ [LINE Official Account Manager](https://manager.line.biz/)
2. เปิดใช้ **Messaging API** ที่บัญชีนั้น → จะได้ **Provider** + **Channel** ใน [LINE Developers Console](https://developers.line.biz/console/)
3. ในหน้า Channel → แท็บ **Basic settings**: คัดลอก **Channel secret** → ใช้เป็น `LINE_CHANNEL_SECRET`
4. ในหน้า Channel → แท็บ **Messaging API**: กด **Issue** ที่ Channel access token (long-lived) → คัดลอก → ใช้เป็น `LINE_CHANNEL_ACCESS_TOKEN`
5. หา **LINE OA ลิงก์เพิ่มเพื่อน** (`https://lin.ee/xxxxx`) จากหน้า Messaging API เดียวกัน → ใช้เป็น `NEXT_PUBLIC_LINE_OA_URL`

⚠️ Webhook URL (`https://<โดเมนแอป>/api/line/webhook`) ต้องตั้งหลัง deploy ขึ้น Vercel เสร็จแล้ว (ขั้นตอน 5) เพราะต้องรู้โดเมนจริงก่อน

---

## 4. Deploy ขึ้น Vercel

1. ไปที่ [vercel.com](https://vercel.com) → **Add New Project** → เลือก repo ที่ fork มา (บัญชี Vercel ต้องเชื่อม GitHub บัญชีเดียวกับที่ fork ไว้)
2. Framework preset: Vercel จะจับ **Next.js** ให้อัตโนมัติ ไม่ต้องแก้ build command
3. ก่อนกด Deploy — ตั้ง **Environment Variables** (Project Settings → Environment Variables) ให้ครบตามตารางนี้:

   | ตัวแปร | มาจากไหน | หมายเหตุ |
   |---|---|---|
   | `SUPABASE_URL` | ขั้นตอน 2.5 | Server only |
   | `SUPABASE_SERVICE_ROLE_KEY` | ขั้นตอน 2.5 | Server only — **ห้ามใส่ `NEXT_PUBLIC_` นำหน้า** |
   | `SESSION_SECRET` | สร้างเอง: `openssl rand -base64 32` | เซ็นชื่อ session คุกกี้ของแอดมิน/สตาฟ |
   | `RESUME_TOKEN_SECRET` | สร้างเอง: `openssl rand -base64 32` | เซ็นชื่อลิงก์ "แก้ไขคำตอบ" ที่ส่งจาก LINE |
   | `NEXT_PUBLIC_APP_URL` | โดเมนแอปจริง เช่น `https://mommunjai-xxx.vercel.app` | ใช้สร้างลิงก์ในการ์ด LINE Flex |
   | `LINE_CHANNEL_SECRET` | ขั้นตอน 3.3 | |
   | `LINE_CHANNEL_ACCESS_TOKEN` | ขั้นตอน 3.4 | |
   | `NEXT_PUBLIC_LINE_OA_URL` | ขั้นตอน 3.5 | |
   | `ALLOWED_ORIGINS` | โดเมนเว็บแบรนด์ที่จะยิง POST `/api/lead` ข้าม origin (ถ้ามี) เช่น `https://www.yourbrand.com` | ถ้ายังไม่มีเว็บแบรนด์ ใส่ `https://<โดเมนแอปตัวเอง>` ไปก่อนได้ |
   | `ALLOWED_FRAME_ANCESTORS` | โดเมนที่จะฝัง `/tools/*` เป็น iframe widget เช่น `'self' https://www.yourbrand.com` | ค่าเริ่มต้นปลอดภัย: `'self'` |
   | `LINE_RELAY_WEBHOOK_URL` | ใส่เฉพาะถ้า LINE channel นี้เคยมี webhook อื่นผูกอยู่ก่อน (เช่น บริการตรวจสลิปโอนเงิน) — ไม่บังคับ | LINE อนุญาต webhook URL เดียวต่อ channel เท่านั้น เมื่อผูก webhook เข้ากับแอปนี้แล้ว (ขั้นตอน 5.1) แอปจะ relay raw event ทุกตัวต่อไปยัง URL นี้ให้อัตโนมัติ พร้อมเงียบกับข้อความที่ไม่ใช่ของแอปนี้ — รายละเอียดเต็ม: [`docs/LINE-WEBHOOK-RELAY.md`](LINE-WEBHOOK-RELAY.md) |
   | `LINE_BOT_ENABLED` | `1` (ค่าเริ่มต้น) | kill switch ปิดงานฝั่งแอปนี้ฉุกเฉินโดยไม่ต้องแตะ LINE Console — ดู [`docs/LINE-WEBHOOK-RELAY.md`](LINE-WEBHOOK-RELAY.md) |

4. กด **Deploy** — รอ build (~1-2 นาที)
5. ได้โดเมน `https://<project>.vercel.app` → กลับไปอัปเดต `NEXT_PUBLIC_APP_URL` ให้ตรงกับโดเมนจริงถ้ายังไม่ได้ใส่ (แล้ว redeploy)

---

## 5. เชื่อม LINE Webhook + ตั้งค่าหลัง deploy

1. กลับไป [LINE Developers Console](https://developers.line.biz/console/) → Channel เดิม → แท็บ Messaging API → **Webhook URL**: ใส่ `https://<โดเมนแอป>/api/line/webhook` → กด **Verify** (ควรได้ Success) → เปิด **Use webhook**
2. ปิด **Auto-reply messages** และ **Greeting messages** ของ LINE OA เอง (แอปนี้ตอบเองผ่าน webhook อยู่แล้ว เปิดพร้อมกันจะซ้ำ)
3. เปิดแอปที่ `https://<โดเมนแอป>/login` → ระบบจะเห็นว่ายังไม่มีแอดมิน → กรอกฟอร์ม **สร้างผู้ดูแลระบบคนแรก** (username + PIN อย่างน้อย 4 หลัก) — หลังจากนี้บัญชีนี้ล็อกอินจัดการ lead/tag ได้ที่ `/leads`
4. **Rich Menu (ทางเลือก แต่แนะนำ):** ใน LINE Official Account Manager → Rich Menu → สร้างเมนู → เพิ่มปุ่ม action ประเภท **Text** ข้อความ `แผนของฉัน` (ข้อความนี้ตรงกับที่ webhook ในโค้ดดักฟังไว้ที่ `lib/line.ts`/`app/api/line/webhook/route.ts`) — ถ้าเปลี่ยนข้อความ ต้องแก้ในโค้ดให้ตรงกันด้วย

---

## 6. ⚠️ ไฟล์/ข้อมูลที่ "ไม่ได้ติดไปกับ git fork" — ต้องขอจากทีมเดิมแยกต่างหาก

Repo นี้ตั้งใจ `.gitignore` ไฟล์ที่มีเนื้อหาอ่อนไหว/เฉพาะลูกค้าไว้ **ไม่ให้ขึ้น GitHub public** เพราะฉะนั้น fork แล้วจะ **ไม่มี** ไฟล์กลุ่มนี้ (โค้ดแอปยังรันได้ปกติ — ไฟล์กลุ่มนี้เป็นเอกสารอ้างอิง ไม่ใช่โค้ด):

| ไฟล์/โฟลเดอร์ | เนื้อหา | ผลถ้าไม่มี |
|---|---|---|
| `docs/legal-compliance.md` | เส้นแดง compliance (ห้ามเคลม/พ.ร.บ.นมผง ฯลฯ) ที่โค้ดทั้งระบบยึดตาม | โค้ดยังทำงานถูกตามกฎเดิม แต่ทีมใหม่จะไม่รู้ที่มา/เหตุผลเวลาต้องแก้เนื้อหาใหม่ |
| `docs/product-catalog-master.md` | แคตตาล็อกสินค้า 19 รายการ + Safety Matrix "หยุดเมื่อไหร่" | โค้ด `lib/calc/vitamins.ts` ล็อกกฎไว้ในโค้ดแล้ว (ไม่พังทันที) แต่แก้ไข/เพิ่มสินค้าต่อไม่ได้ถ้าไม่มีตารางนี้ |
| `docs/nutrition-protocol.md`, `docs/BOOK-INSIGHTS.md` | ที่มาความรู้โภชนาการจากหนังสือครูก้อย | เนื้อหาที่โค้ดอ้างอิงคอมเมนต์ไว้ แต่ตัวไฟล์ต้นฉบับไม่มี |
| `docs/BRAND.md`, `docs/BRAND-STORY.md`, `docs/brand-voice.md` | อัตลักษณ์แบรนด์ (CI สี/ฟอนต์/โทนเสียง) | `docs/DESIGN.md` (ที่ tracked อยู่) มีค่าสี/ฟอนต์ที่ดึงมาใช้แล้วพอสำหรับแก้ UI ต่อ แต่ไม่มีเอกสารต้นฉบับเต็ม |
| `docs/company.md`, `docs/profile-krukoy.md` | ข้อมูลบริษัท/โปรไฟล์ครูก้อย | ใช้อ้างอิงตอนเขียนคอนเทนต์เท่านั้น ไม่กระทบโค้ด |
| `assets/` | โลโก้/รูปต้นฉบับความละเอียดสูง, product shot ต้นฉบับก่อนตัดต่อ | **ไม่กระทบแอป** — โลโก้ที่แอปใช้จริง (`public/logo.png`, `public/logo-white.png`) และรูปสินค้า (`public/products/*.jpg`) ติดไปกับ fork ครบอยู่แล้ว `assets/` เป็นแค่ไฟล์ทำงานสำรอง |
| `PROJECT-SCOPE.md`, `PROGRESS.md`, `DEPLOY-CHECKLIST.md`, `CLAUDE.md` (root) | บริบทงาน/ความคืบหน้า/เช็กลิสต์ภายในของทีมเดิม | ไม่กระทบแอป — เป็นไฟล์บริหารโปรเจกต์ภายใน |

**คำแนะนำ:** ถ้าบัญชีใหม่นี้จะดูแลแอปต่อจริงจัง (ไม่ใช่แค่รันทดสอบ) ควรขอให้ทีมเดิมส่งไฟล์ในตารางนี้มาให้แยกต่างหาก (เช่น zip ผ่านช่องทางที่ปลอดภัย ไม่ใช่ git) โดยเฉพาะ `legal-compliance.md` และ `product-catalog-master.md` เพราะเป็นฐานที่ทุกคำแนะนำสุขภาพในแอปอ้างอิงอยู่

---

## 7. เช็กก่อนบอกว่า "ติดตั้งเสร็จ"

- [ ] `npm run build` ผ่านในเครื่อง (หรือดู build log บน Vercel ว่า Compiled successfully)
- [ ] `npm test` ผ่านครบ (ตอนแยก fork ควรได้ 340/340 เท่ากับต้นทาง)
- [ ] เปิดหน้าแรก `https://<โดเมนแอป>` เห็นโลโก้/4 การ์ดหมวดชีวิตปกติ
- [ ] กรอกแบบสอบถาม `/plan` จนจบ ได้เลขรหัส `MJ-XXXXXX` (ยืนยันว่าต่อ Supabase สำเร็จจริง ไม่ใช่โหมด dev fallback)
- [ ] เปิด Supabase → Table Editor → ตาราง `leads` เห็นแถวใหม่ที่เพิ่งกรอก
- [ ] พิมพ์รหัส `MJ-XXXXXX` ในแชท LINE OA ของบัญชีนี้ → ได้การ์ดแผนตอบกลับ (ยืนยันว่า LINE webhook เชื่อมสำเร็จ)
- [ ] เปิด `/login` → สร้างแอดมินคนแรกสำเร็จ → เข้า `/leads` เห็นข้อมูลที่กรอกไว้

---

## 8. โครงสร้างแอปโดยสรุป (อ้างอิงเร็ว)

- **หน้าเว็บ:** `/` หน้าแรก · `/plan` แบบสอบถาม · `/tools/*` เครื่องมือ 9 ตัว (ฝังเป็น widget ได้ผ่าน `?embed=1`) · `/r/[code]` แผนฉบับเต็ม (เข้าถึงผ่านลิงก์ใน LINE เท่านั้น) · `/leads`, `/staff`, `/admin` งานฝั่งทีม (ต้องล็อกอิน)
- **API หลัก:** `/api/lead` (รับแบบสอบถาม) · `/api/lead/measure` (กรอกน้ำหนัก/ส่วนสูงย้อนหลัง) · `/api/line/webhook` (LINE) · `/api/customer/resume` (ลิงก์แก้ไขคำตอบจาก LINE) · `/api/leads/[id]` (แก้ไข/ลบ lead — ต้องสิทธิ์)
- **เอกสารอื่นที่ tracked อยู่แล้ว (อ่านต่อได้):** [`docs/PRD.md`](PRD.md) ภาพรวมทั้งระบบ · [`docs/DATA-MODEL.md`](DATA-MODEL.md) · [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) · [`docs/DESIGN.md`](DESIGN.md) ค่าสี/ฟอนต์แบรนด์ที่ใช้จริงในโค้ด
