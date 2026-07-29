"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

// Leads Dashboard — all registrations (docs/PRD-PHASE2.md §3.5). Requires view_leads.
const STAGE_TH: Record<string, string> = {
  prep: "เตรียมตั้งครรภ์", infertility: "มีบุตรยาก", pregnant: "ตั้งครรภ์", lactating: "ให้นม", male: "ฝ่ายชาย",
};
const fmt = (iso: string) => new Date(iso).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function LeadsPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [f, setF] = useState<any>({ q: "", stage: "", pcos: "", art: "", tag: "", line: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((d) => {
      if (!d.authed) return router.push("/login");
      if (!(d.role === "admin" || (d.perms || []).includes("view_leads"))) return router.push("/staff");
      setMe(d);
    });
  }, [router]);

  const qs = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams();
    Object.entries({ ...f, page: String(page), limit: String(limit), ...extra }).forEach(([k, v]) => v && p.set(k, String(v)));
    return p.toString();
  }, [f, page, limit]);

  const load = useCallback(() => {
    setLoading(true); setErr(null);
    fetch(`/api/leads?${qs()}`).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "โหลดไม่สำเร็จ");
      setRows(d.rows || []); setTotal(d.total || 0);
    }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [qs]);

  useEffect(() => { if (me) load(); }, [me, page, load]);

  const set = (k: string, v: string) => { setPage(1); setF((x: any) => ({ ...x, [k]: v })); };
  const canExport = me && (me.role === "admin" || (me.perms || []).includes("export_data"));
  const pages = Math.max(1, Math.ceil(total / limit));

  if (!me) return <main className="p-8 text-center text-sm text-ink/60">กำลังตรวจสอบสิทธิ์…</main>;

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wordmark height={26} /><span className="text-sm text-ink/60">รายชื่อผู้ลงทะเบียน</span></div>
        <div className="flex gap-3 text-sm">
          <Link href="/staff" className="text-teal-deep">ค้น Ticket</Link>
          {(me.role === "admin" || (me.perms || []).includes("manage_users")) && <Link href="/admin" className="text-teal-deep">จัดการผู้ใช้</Link>}
        </div>
      </div>

      {/* filters */}
      <div className="glass mt-3 p-4">
        <div className="flex flex-wrap gap-2">
          <input className="field !w-auto flex-1 min-w-[180px]" placeholder="ค้น ชื่อเล่น / ติดต่อ / MJ-XXXXXX"
            value={f.q} onChange={(e) => set("q", e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <select className="field !w-auto" value={f.stage} onChange={(e) => set("stage", e.target.value)}>
            <option value="">สเตจ: ทั้งหมด</option>
            {Object.entries(STAGE_TH).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="field !w-auto" value={f.art} onChange={(e) => set("art", e.target.value)}>
            <option value="">ART: ทั้งหมด</option>
            <option value="ยัง">ยัง</option><option value="IUI">IUI</option><option value="IVF-ICSI">IVF-ICSI</option>
            <option value="บำรุงไข่">บำรุงไข่</option><option value="เตรียมผนังมดลูก">เตรียมผนังมดลูก</option>
          </select>
          <select className="field !w-auto" value={f.pcos} onChange={(e) => set("pcos", e.target.value)}>
            <option value="">PCOS: ทั้งหมด</option><option value="true">PCOS เท่านั้น</option>
          </select>
          <select className="field !w-auto" value={f.line} onChange={(e) => set("line", e.target.value)}>
            <option value="">LINE: ทั้งหมด</option><option value="yes">เชื่อมแล้ว</option><option value="no">ยังไม่เชื่อม</option>
          </select>
          <input className="field !w-auto" placeholder="tag (เช่น #PCOS)" value={f.tag} onChange={(e) => set("tag", e.target.value)} />
          <button className="btn-primary" onClick={load}>ค้นหา</button>
          {canExport && <a className="btn-ghost" href={`/api/leads?${qs({ format: "csv" })}`}>⬇ CSV</a>}
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-rose-deep">{err}</p>}

      <div className="glass-strong mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink/60">
            <tr className="border-b border-black/5">
              <th className="p-3">เวลา</th><th className="p-3">ชื่อเล่น</th><th className="p-3">ติดต่อ</th>
              <th className="p-3">สเตจ</th><th className="p-3">PCOS</th><th className="p-3">ART</th>
              <th className="p-3">คะแนน</th><th className="p-3">Tags</th><th className="p-3">LINE</th><th className="p-3">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="p-6 text-center text-ink/50">กำลังโหลด…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-ink/50">ยังไม่มีข้อมูลตามเงื่อนไข</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id} className="cursor-pointer border-b border-black/5 hover:bg-teal/5"
                onClick={() => r.ticket && router.push(`/staff?code=${r.ticket}`)}>
                <td className="p-3 whitespace-nowrap text-ink/60">{fmt(r.created_at)}</td>
                <td className="p-3 font-medium">{r.nickname || "—"}</td>
                <td className="p-3 whitespace-nowrap">{r.contact_channel} · {r.contact_value}</td>
                <td className="p-3 whitespace-nowrap">{STAGE_TH[r.stage] || r.stage || "—"}</td>
                <td className="p-3">{r.has_pcos ? "✓" : ""}</td>
                <td className="p-3">{r.art_plan && r.art_plan !== "ยัง" && r.art_plan !== "none" ? r.art_plan : ""}</td>
                <td className="p-3">{r.score ?? "—"}</td>
                <td className="p-3">{r.tag_count || ""}</td>
                <td className="p-3">{r.line_bound ? <span className="chip !bg-[#06C755]/15 !text-[#06843c] !border-[#06C755]/30">🟢</span> : ""}</td>
                <td className="p-3 whitespace-nowrap font-mono text-xs text-teal-deep">{r.ticket}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-ink/60">
        <span>ทั้งหมด {total.toLocaleString()} คน</span>
        <div className="flex items-center gap-2">
          <button className="btn-ghost !px-3 !py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>ก่อนหน้า</button>
          <span>หน้า {page}/{pages}</span>
          <button className="btn-ghost !px-3 !py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>ถัดไป</button>
        </div>
      </div>
    </main>
  );
}
