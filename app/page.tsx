import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

// PDF-03 — 4 life-stage categories, client's own order. "มีบุตรยาก" sub-splits
// into ฝ่ายชาย/ฝ่ายหญิง — both route to /plan?stage=..., reusing the stage
// values the calc/report layer already understands (no schema change needed;
// see docs/MAPPING-JOURNEY-2607.xlsx journeys ③/⑥ — infertility-male and
// general-male already resolve to identical product logic in code).
const CATEGORIES = [
  { emoji: "🌱", title: "เตรียมตั้งครรภ์", desc: "อยากมีลูก บำรุงร่างกายให้พร้อมล่วงหน้า", href: "/plan?stage=prep" },
  { emoji: "🤰", title: "ตั้งครรภ์แล้ว", desc: "ดูแลครรภ์ต่อเนื่อง เตรียมพร้อมสำหรับลูก", href: "/plan?stage=pregnant" },
  { emoji: "🍼", title: "ให้นมบุตร", desc: "ฟื้นฟูร่างกายหลังคลอด บำรุงคุณภาพน้ำนม", href: "/plan?stage=lactating" },
];

const TOOLS = [
  { href: "/tools/ovulation", emoji: "📅", title: "นับวันไข่ตก", desc: "หาช่วงวันมีโอกาสมีลูกจากรอบเดือน — กรอกแทนคู่ได้" },
  { href: "/tools/protein", emoji: "🥚", title: "คำนวณโปรตีน", desc: "โปรตีนต่อวันเพื่อบำรุงไข่ให้สมบูรณ์" },
  { href: "/tools/nutrients", emoji: "🥗", title: "เช็กสารอาหาร", desc: "วันนี้กินครบตามหลักโภชนาการไหม" },
  { href: "/tools/sleep", emoji: "🌙", title: "คำนวณการนอน", desc: "เวลานอนที่ดีต่อฮอร์โมนเจริญพันธุ์" },
  { href: "/tools/water", emoji: "💧", title: "เช็คปริมาณน้ำ", desc: "ควรดื่มน้ำวันละเท่าไหร่ตามน้ำหนักตัว" },
  { href: "/tools/vitamins", emoji: "💊", title: "แนะนำวิตามินครูก้อย", desc: "เลือกวิตามินให้ตรงกับคุณ" },
  { href: "/plan", emoji: "💛", title: "รับแผนเฉพาะคุณ", desc: "คุยกับทีม Baby & Mom ผ่าน LINE OA" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      {/* Hero — echoes website "Where Science Meets Motherhood" (see docs/DESIGN.md §9) */}
      <section className="glass relative overflow-hidden p-6 text-center sm:p-10">
        <span className="pointer-events-none absolute -right-6 top-6 text-4xl text-rose/40">＋</span>
        <span className="pointer-events-none absolute left-6 bottom-6 text-2xl text-teal/40">＋</span>
        <Wordmark height={40} />
        <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-4xl">
          Where <span className="text-teal">Science</span> Meets{" "}
          <span className="text-rose">Motherhood</span>
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
      <p className="mt-1 text-center text-sm text-ink/60">เลือกช่วงชีวิตของคุณ แล้วเราจะพาไปแบบสอบถามที่ตรงกับคุณ</p>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={CATEGORIES[0].href}
          className="glass group p-5 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-teal/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft text-2xl">
            {CATEGORIES[0].emoji}
          </div>
          <h3 className="mt-3 text-lg font-semibold">{CATEGORIES[0].title}</h3>
          <p className="mt-1 text-sm text-ink/70">{CATEGORIES[0].desc}</p>
          <span className="mt-3 inline-block text-sm font-medium text-teal-deep">เริ่มเลย →</span>
        </Link>

        {/* มีบุตรยาก — sub-splits ฝ่ายชาย/ฝ่ายหญิง per PDF-03; "general male, not
            infertility" routing stays an explicit open question (client's own
            reply: "แบ่งตามนี้ไปก่อน แล้ว Open Q นี้ไว้") — no card invented for it. */}
        <div className="glass p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft text-2xl">💗</div>
          <h3 className="mt-3 text-lg font-semibold">มีบุตรยาก</h3>
          <p className="mt-1 text-sm text-ink/70">กำลังพยายามอยู่ ต้องการบำรุงเฉพาะทาง</p>
          <div className="mt-3 flex gap-2">
            <Link href="/plan?stage=infertility" className="btn-ghost !min-h-0 flex-1 !py-2 text-sm">ฝ่ายหญิง →</Link>
            <Link href="/plan?stage=male" className="btn-ghost !min-h-0 flex-1 !py-2 text-sm">ฝ่ายชาย →</Link>
          </div>
        </div>

        {CATEGORIES.slice(1).map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="glass group p-5 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-teal/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft text-2xl">
              {c.emoji}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-ink/70">{c.desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-teal-deep">เริ่มเลย →</span>
          </Link>
        ))}
      </section>

      <h2 id="tools" className="mt-10 text-center text-xl font-semibold sm:text-2xl">
        หรือใช้เครื่องมือแยกทีละอัน
      </h2>
      <p className="mt-1 text-center text-sm text-ink/60">เลือกเครื่องมือที่ตรงกับคุณ ใช้ฟรี ไม่ต้องสมัคร</p>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="glass group p-5 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-teal/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft text-2xl">
              {t.emoji}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
            <p className="mt-1 text-sm text-ink/70">{t.desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-teal-deep">
              เริ่มเลย →
            </span>
          </Link>
        ))}
      </section>

      {/* Brand footer band — echoes website teal footer */}
      <footer className="card-feature mt-10 text-center">
        <Wordmark height={30} white />
        <p className="mt-1 text-sm text-white/90">Where Science Meets Motherhood</p>
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
