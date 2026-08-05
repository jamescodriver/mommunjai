# Mommunjai — แอปเตรียมตั้งครรภ์ (Baby & Mom / ครูก้อย)

เครื่องมือฟรี lead-gen: นับวันไข่ตก · คำนวณโปรตีน · เช็กสารอาหาร · คำนวณการนอน · แนะนำวิตามินครูก้อย → แบบสอบถาม + consent + **เลข Ticket** ส่งเข้า LINE OA + ระบบ **Tag**

- **Stack:** Next.js 14 (App Router) · Tailwind (glass UI) · Supabase · Vercel · สถาปัตย์ **BFF**
- **เอกสาร:** [PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA-MODEL.md) · [Design system](docs/DESIGN.md)
- **รายงานเทสต์:** [docs/TEST-PLAN.md](docs/TEST-PLAN.md) · [docs/TEST-REPORT.html](docs/TEST-REPORT.html)

## Dev
```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase/LINE (ไม่ใส่ก็รันได้ — lead API เข้าโหมด dev fallback)
npm run dev                  # http://localhost:3000
npm test                     # unit tests (vitest) — 340 เคส
npm run build                # production build
```
> ไม่มี env Supabase → `/api/lead` คืนเลข ticket จำลอง (ไม่บันทึกจริง) เพื่อให้ทดสอบ UI ได้

## Deploy (Vercel) / ติดตั้งเองในบัญชีใหม่
คู่มือเต็ม (fork → Supabase project ใหม่ → migration 7 ไฟล์ → LINE OA → Vercel env → verify): **[docs/SELF-HOST-SETUP.md](docs/SELF-HOST-SETUP.md)**

สรุปสั้น: สร้าง Supabase project ใหม่เฉพาะงานนี้ → รัน `supabase/migrations/0001_init.sql` ถึง `0007_tool_results_widen.sql` ตามลำดับ → เชื่อม GitHub repo เข้า Vercel → ตั้ง env ตาม [`.env.example`](.env.example) ให้ครบ (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `RESUME_TOKEN_SECRET`, `NEXT_PUBLIC_APP_URL`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `ALLOWED_ORIGINS`, `ALLOWED_FRAME_ANCESTORS`, `NEXT_PUBLIC_LINE_OA_URL`) → Deploy → สร้างแอดมินคนแรกที่ `/login`

## หน้า
| Path | คือ |
|---|---|
| `/` | หน้าหลัก 4 หมวดชีวิต (เตรียมตั้งครรภ์/มีบุตรยาก/ตั้งครรภ์แล้ว/ให้นมบุตร) + เครื่องมือแยก 9 ตัว |
| `/tools/{ovulation,protein,nutrients,sleep,water,exercise,vitamins,labs,stress}` | เครื่องมือ (เปิด `?embed=1` เป็น widget) |
| `/plan` | แบบสอบถาม + consent + รับ ticket |
| `/r/[code]` | แผนฉบับเต็ม (เข้าถึงผ่านลิงก์ใน LINE เท่านั้น) |
| `/login`, `/leads`, `/staff`, `/admin` | งานฝั่งทีม — ต้องล็อกอิน (สร้างแอดมินคนแรกที่ `/login`) |
| `/privacy` | นโยบายความเป็นส่วนตัว (ร่าง) |

## ฝังเป็น Widget บนเว็บแบรนด์
```html
<iframe data-mmj src="https://<app>/tools/ovulation?embed=1" style="width:100%;border:0" scrolling="no"></iframe>
<script src="https://<app>/embed.js" async></script>
```
ตัวอย่าง: [`public/widget-demo.html`](public/widget-demo.html) · iframe จะ auto-resize ตามเนื้อหา

## ⚠️ ก่อน launch จริง
ยืนยัน CI จริง (สี/โลโก้/ฟอนต์) · สถานะ อย./ฆอ. สินค้า · privacy policy ฉบับสมบูรณ์ · ตั้งค่าบัญชี Supabase/Vercel
