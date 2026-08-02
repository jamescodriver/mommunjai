import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { IconSprout, IconBelly, IconHeart, IconCalendar, IconEgg, IconSalad, IconMoon, IconDroplet, IconPill, IconRun, IconClipboard } from "@/components/icons";

// R1 (PRD-UPDATE-R2-2607.md) — 4 real categories, no sub-picker except
// "เตรียมตั้งครรภ์" which gets an inline "ฝ่ายชาย" sub-link (moved here from
// "มีบุตรยาก", which now goes straight to /plan's own 7-item issue checklist —
// see R2 — instead of a gender split on the home page).
const CATEGORIES = [
  { icon: <IconSprout />, title: "เตรียมตั้งครรภ์", desc: "อยากมีลูก บำรุงร่างกายให้พร้อมล่วงหน้า", href: "/plan?stage=prep" },
  { icon: <IconHeart />, title: "มีบุตรยาก", desc: "กำลังพยายามอยู่ ต้องการบำรุงเฉพาะทาง", href: "/plan?stage=infertility" },
  { icon: <IconBelly />, title: "ตั้งครรภ์แล้ว", desc: "ดูแลครรภ์ต่อเนื่อง เตรียมพร้อมสำหรับลูก", href: "/plan?stage=pregnant" },
  // 🔴 พ.ร.บ.นมผง (legal-compliance §2) — ห้ามใช้ไอคอนขวดนม/จุกนม และห้ามเคลมเรื่องน้ำนม
  // ผูกกับ funnel สินค้า · เดิมใช้ IconBottle + "บำรุงคุณภาพน้ำนม" ซึ่งเข้าข่ายทั้งสองข้อ
  // (มาตรา ๑๔ ผูกกับ "ผู้ใด" = ตัวแอปเองก็เป็นผู้กระทำได้) — Lucifer red-team 31/7
  { icon: <IconSprout />, title: "ให้นมบุตร", desc: "ฟื้นฟูร่างกายหลังคลอด ดูแลตัวคุณแม่", href: "/plan?stage=lactating" },
];

const TOOLS = [
  { href: "/tools/ovulation", icon: <IconCalendar />, title: "นับวันไข่ตก", desc: "หาช่วงวันมีโอกาสมีลูกจากรอบเดือน — กรอกแทนคู่ได้" },
  { href: "/tools/protein", icon: <IconEgg />, title: "คำนวณโปรตีน", desc: "โปรตีนต่อวันเพื่อบำรุงไข่ให้สมบูรณ์" },
  { href: "/tools/nutrients", icon: <IconSalad />, title: "เช็กสารอาหาร", desc: "วันนี้กินครบตามหลักโภชนาการไหม" },
  { href: "/tools/sleep", icon: <IconMoon />, title: "คำนวณการนอน", desc: "เวลานอนที่ดีต่อฮอร์โมนเจริญพันธุ์" },
  { href: "/tools/water", icon: <IconDroplet />, title: "เช็คปริมาณน้ำ", desc: "ควรดื่มน้ำวันละเท่าไหร่ตามน้ำหนักตัว" },
  { href: "/tools/exercise", icon: <IconRun />, title: "แนะนำการออกกำลังกาย", desc: "โปรแกรมที่เหมาะกับช่วงของคุณ อ้างอิง WHO/ACOG" },
  { href: "/tools/vitamins", icon: <IconPill />, title: "แนะนำวิตามินครูก้อย", desc: "เลือกวิตามินให้ตรงกับคุณ" },
  { href: "/tools/labs", icon: <IconClipboard />, title: "ตรวจร่างกาย ควรตรวจอะไรบ้าง", desc: "ความรู้เบื้องต้นเรื่องฮอร์โมน/ค่าน้ำเชื้อ อ้างอิง ASRM/WHO" },
  // R14 · TC-14-01 — การ์ดตำแหน่งสุดท้ายเปลี่ยนจาก "รับแผนเฉพาะคุณ" เป็นแบบประเมินความเครียด
  // ตามที่ต้นยืนยัน · ทางเข้า /plan ยังอยู่ครบที่การ์ดหมวดชีวิต 4 ใบด้านบน + ปุ่ม CTA ท้ายทุก
  // เครื่องมือ (PlanCta) จึงไม่เสียทางเข้าหลักไป
  { href: "/tools/stress", icon: <IconHeart />, title: "แบบประเมินความเครียด", desc: "5 ข้อสั้น ๆ จากแบบประเมินกรมสุขภาพจิต (ST-5)" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      {/* Hero — สโลแกนไทย "วิทยาศาสตร์ของความเป็นแม่" (ต้นสั่งเปลี่ยนจากอังกฤษ 1/8/2026 —
          เดิม "Where Science Meets Motherhood" อิงเว็บแบรนด์ ดู docs/DESIGN.md §9) */}
      <section className="glass relative overflow-hidden p-6 text-center sm:p-10">
        <span className="pointer-events-none absolute -right-6 top-6 text-4xl text-rose/40">＋</span>
        <span className="pointer-events-none absolute left-6 bottom-6 text-2xl text-teal/40">＋</span>
        <Wordmark height={40} />
        <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-4xl">
          <span className="text-teal">วิทยาศาสตร์</span>ของ<span className="text-rose">ความเป็นแม่</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">
          เครื่องมือฟรีช่วยเตรียมร่างกายให้พร้อมตั้งครรภ์ — ดูแลด้วยความรู้ที่มีวิทยาศาสตร์รองรับ
          ใช้ง่ายบนมือถือ แล้วรับ<b>แผนเฉพาะคุณ</b>จากทีม Baby & Mom
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/plan" className="btn-primary">💛 รับคำแนะนำเฉพาะคุณ</Link>
          <Link href="#tools" className="btn-ghost">เริ่มใช้เครื่องมือ</Link>
        </div>
      </section>

      <h2 className="mt-10 text-center text-xl font-semibold sm:text-2xl">
        ตอนนี้คุณอยู่ช่วงไหน?
      </h2>
      <p className="mt-1 text-center text-base text-ink/60">เลือกช่วงชีวิตของคุณ แล้วเราจะพาไปแบบสอบถามที่ตรงกับคุณ</p>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* เตรียมตั้งครรภ์ — R1: gets an inline "ฝ่ายชาย" sub-link (reachable from
            here now too, not only from "มีบุตรยาก" like before). */}
        <div className="glass p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft text-teal-deep" aria-hidden>
            {CATEGORIES[0].icon}
          </div>
          <h3 className="mt-3 text-lg font-semibold">{CATEGORIES[0].title}</h3>
          <p className="mt-1 text-base text-ink/70">{CATEGORIES[0].desc}</p>
          {/* บนจอ lg ขึ้นไปการ์ดนี้กว้างแค่ ~258px (กริด 4 คอลัมน์) เหลือที่ให้ตัวอักษร
              ในปุ่มแค่ ~57px → "ฝ่ายหญิง →" ตกเป็น 3 บรรทัดจนปุ่มกลายเป็นวงกลม
              จึงให้เรียงลงแทนตอนการ์ดแคบ + กันตกบรรทัดด้วย whitespace-nowrap ทุกกรณี
              (แก้ที่ padding อย่างเดียวไม่พอ — พอขนาดตัวอักษรฐานโตขึ้นก็กลับมาตกอีก) */}
          <div className="mt-3 flex gap-2 lg:flex-col">
            {/* R1 (PRD-UPDATE-R3-3107 · TC-01-01) — ปุ่มหลักของการ์ดนี้ใบเดียวเปลี่ยนเป็น
                "ฝ่ายหญิง →" ให้เป็นคู่กับปุ่มรอง "ฝ่ายชาย →" · การ์ดอีก 3 ใบยังเป็น
                "เริ่มเลย →" เหมือนเดิม (TC-01-02) */}
            <Link href={CATEGORIES[0].href} className="btn-primary !min-h-0 flex-1 whitespace-nowrap !px-3 !py-2 text-sm">ฝ่ายหญิง →</Link>
            <Link href="/plan?stage=male" className="btn-ghost !min-h-0 flex-1 whitespace-nowrap !px-3 !py-2 text-sm">ฝ่ายชาย →</Link>
          </div>
        </div>

        {/* มีบุตรยาก — R2 replaced the old ฝ่ายหญิง/ฝ่ายชาย sub-split with a
            7-item issue checklist that now lives inside /plan itself. */}
        <Link
          href={CATEGORIES[1].href}
          className="glass group p-5 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-rose/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft text-rose-deep" aria-hidden>
            {CATEGORIES[1].icon}
          </div>
          <h3 className="mt-3 text-lg font-semibold">{CATEGORIES[1].title}</h3>
          <p className="mt-1 text-base text-ink/70">{CATEGORIES[1].desc}</p>
          <span className="mt-3 inline-block text-sm font-medium text-rose-deep">เริ่มเลย →</span>
        </Link>

        {CATEGORIES.slice(2).map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="glass group p-5 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-teal/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft text-teal-deep" aria-hidden>
              {c.icon}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
            <p className="mt-1 text-base text-ink/70">{c.desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-teal-deep">เริ่มเลย →</span>
          </Link>
        ))}
      </section>

      <h2 id="tools" className="mt-10 text-center text-xl font-semibold sm:text-2xl">
        หรือใช้เครื่องมือแยกทีละอัน
      </h2>
      <p className="mt-1 text-center text-base text-ink/60">เลือกเครื่องมือที่ตรงกับคุณ ใช้ฟรี ไม่ต้องสมัคร</p>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="glass group p-5 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-teal/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft text-teal-deep" aria-hidden>
              {t.icon}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
            <p className="mt-1 text-base text-ink/70">{t.desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-teal-deep">
              เริ่มเลย →
            </span>
          </Link>
        ))}
      </section>

      {/* Brand footer band — echoes website teal footer */}
      <footer className="card-feature mt-10 text-center">
        <Wordmark height={30} white />
        <p className="mt-1 text-sm text-white/90">วิทยาศาสตร์ของความเป็นแม่</p>
        <p className="mx-auto mt-3 max-w-md text-xs text-white/80">
          ข้อมูลเพื่อการดูแลสุขภาพเบื้องต้น ไม่แทนคำวินิจฉัยของแพทย์
        </p>
        <Link href="/privacy" className="mt-2 inline-block text-xs text-white/90 underline">
          นโยบายความเป็นส่วนตัว
        </Link>
      </footer>
    </main>
  );
}
