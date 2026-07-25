"use client";
import type { Report } from "@/lib/report";
import { track } from "@/lib/track";
import { Wordmark } from "@/components/wordmark";

const LINE_OA_URL = process.env.NEXT_PUBLIC_LINE_OA_URL || "https://lin.ee/fBa4xkz";
const fmtTH = (iso: string) => {
  try { return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long" }); }
  catch { return iso; }
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="glass p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal text-xs text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// Renders the personalized "90-day plan" report. Order matters (research §3):
// greeting → strengths FIRST → quick win → gentle score → improvements → 90-day plan → 70/30 → partner → actions → LINE → close.
export default function ReportView({ report, code, ticketNote }: { report: Report; code?: string; ticketNote?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-6">
      {/* header */}
      <div className="glass-strong p-6 text-center">
        <Wordmark className="text-lg" />
        <p className="text-xs font-medium text-ink/50">by ครูก้อย</p>
        <h1 className="mt-1 text-2xl font-semibold text-teal-deep">{report.title}</h1>
        <p className="mt-1 text-sm text-ink/70">{report.tagline}</p>
        <p className="mt-3 text-sm">{report.greeting}</p>
        {code && ticketNote && (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-teal bg-teal-soft py-3 text-xl font-bold tracking-widest text-teal-deep">{code}</div>
        )}
      </div>

      {/* 1. strengths FIRST */}
      <Section n="1" title="จุดแข็งของคุณ 💪">
        <ul className="space-y-2 text-sm">
          {report.strengths.map((s, i) => (
            <li key={i} className="flex gap-2"><span className="text-teal-deep">✓</span>{s}</li>
          ))}
        </ul>
      </Section>

      {/* 2. quick win today */}
      <Section n="2" title="เริ่มได้เลยวันนี้ ⚡">
        <div className="rounded-xl bg-gold/15 p-4 text-sm font-medium">{report.quickWinToday}</div>
      </Section>

      {/* 3. gentle readiness + pillars */}
      <Section n="3" title="ความพร้อมโดยรวม">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-deep">{report.score}</div>
            <div className="text-xs text-ink/50">/100</div>
          </div>
          <div className="text-sm">{report.scoreLabel}<p className="text-xs text-ink/60">คะแนนนี้ไว้ติดตามพัฒนาการ ไม่ใช่การตัดสิน 💛</p></div>
        </div>
        <div className="mt-3 space-y-2">
          {report.pillars.map((p) => (
            <div key={p.key}>
              <div className="flex justify-between text-xs"><span>{p.label}</span><span>{p.score === null ? "—" : `${p.score}%`}</span></div>
              <div className="mt-1 h-2 rounded-full bg-black/5"><div className="h-2 rounded-full bg-teal" style={{ width: `${p.score ?? 0}%` }} /></div>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. improvements */}
      {report.improvements.length > 0 && (
        <Section n="4" title="จุดที่เสริมได้ (โอกาสพัฒนา) 🌱">
          <ul className="space-y-2 text-sm">
            {report.improvements.map((s, i) => (<li key={i} className="flex gap-2"><span className="text-gold">+</span>{s}</li>))}
          </ul>
        </Section>
      )}

      {/* 5. 90-day plan */}
      <Section n="5" title="แผนบำรุง 90 วัน ของคุณ 📅">
        <div className="space-y-3">
          {report.plan90.map((ph, i) => (
            <div key={i} className="rounded-xl bg-white/70 p-3">
              <div className="text-sm font-semibold text-teal-deep">{ph.phase} · {ph.title}</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-ink/80">{ph.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. 70/30 — fertile window + protein + vitamins */}
      <Section n="6" title="70% อยู่ในจาน · 30% วิตามินตรงจุด 🍽️">
        {report.fertileWindow && (
          <p className="mb-2 text-sm">🗓️ ช่วงมีโอกาสสูงรอบถัดไป: <b className="text-teal-deep">{fmtTH(report.fertileWindow.start)}–{fmtTH(report.fertileWindow.end)}</b></p>
        )}
        {report.protein && (
          <p className="mb-2 text-sm">🥚 เป้าโปรตีน: <b>{report.protein.min}–{report.protein.max} กรัม/วัน</b> (เติมด้วย Ferty ~{report.protein.ferty} ซองถ้าอาหารไม่ถึง)</p>
        )}
        <p className="mt-2 text-xs text-ink/60">{report.vitaminNote}</p>
        <div className="mt-2 space-y-2">
          {report.vitamins.map((v) => (
            <div key={v.id} className="rounded-xl bg-white/70 p-3">
              <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">{v.name}</span><span className="text-xs text-teal-deep">฿{v.price.toLocaleString()}</span></div>
              <p className="text-xs text-ink/70">{v.why}</p>
              {v.howto && <p className="text-xs text-teal-deep">วิธีทาน: {v.howto}</p>}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/50">แผนนี้มีค่าแม้คุณจะเลือกกินอาหารก่อนโดยไม่เสริมวิตามินก็ได้ค่ะ</p>
      </Section>

      {/* 7. partner nudge */}
      {report.partnerNudge && (
        <Section n="7" title="ชวนคู่ของคุณไปด้วยกัน 👫">
          <p className="text-sm">{report.partnerNudge}</p>
        </Section>
      )}

      {/* 8. this week + LINE + close */}
      <Section n="8" title="สัปดาห์นี้ทำ 3 อย่างนี้ ✅">
        <ul className="space-y-1 text-sm">{report.weeklyActions.map((a, i) => <li key={i}>• {a}</li>)}</ul>
        <a className="btn-primary mt-4 w-full" href={LINE_OA_URL} target="_blank" rel="noreferrer" onClick={() => track("line_click", { code })}>มีคำถามเรื่องแผนของคุณ? คุยกับทีมครูก้อย</a>
      </Section>

      {/* cautions / disclaimer */}
      <div className="glass p-4 text-xs text-ink/60">
        {report.cautions.map((c, i) => <p key={i} className="mb-1">⚠️ {c}</p>)}
      </div>
    </div>
  );
}
