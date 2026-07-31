"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ART_PLAN_VALUES, INFERTILITY_ISSUES } from "@/lib/calc/vitamins";

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
  const [editing, setEditing] = useState<any>(null);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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
  const canManage = me && (me.role === "admin" || (me.perms || []).includes("manage_leads"));
  const pages = Math.max(1, Math.ceil(total / limit));

  const openEdit = (r: any) => setEditing({ ...r, contact_channel: r.contact_channel || "line", infertility_issues: r.infertility_issues || [] });

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true); setEditErr(null);
    try {
      const r = await fetch(`/api/leads/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: editing.nickname,
          contact_channel: editing.contact_channel,
          contact_value: editing.contact_value,
          stage: editing.stage || null,
          age_range: editing.age_range || null,
          has_pcos: !!editing.has_pcos,
          art_plan: editing.art_plan,
          infertility_issues: editing.stage === "infertility" ? editing.infertility_issues : [],
          height_cm: editing.height_cm || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "แก้ไขไม่สำเร็จ");
      setEditing(null);
      load();
    } catch (e: any) {
      setEditErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: string) => {
    setDeleting(true);
    try {
      const r = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "ลบไม่สำเร็จ");
      setConfirmDeleteId(null);
      setConfirmText("");
      load();
    } catch (e: any) {
      setErr(e.message);
      setConfirmDeleteId(null);
      setConfirmText("");
    } finally {
      setDeleting(false);
    }
  };

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
              <th className="p-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={11} className="p-6 text-center text-ink/50">กำลังโหลด…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={11} className="p-6 text-center text-ink/50">ยังไม่มีข้อมูลตามเงื่อนไข</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id} className="cursor-pointer border-b border-black/5 hover:bg-teal/5"
                onClick={() => r.ticket && router.push(`/staff?code=${r.ticket}`)}>
                <td className="p-3 whitespace-nowrap text-ink/60">{fmt(r.created_at)}</td>
                <td className="p-3 font-medium">
                  {r.nickname || "—"}
                  {r.submission_count > 1 && (
                    <span className="ml-1 chip !py-0 !text-[10px]" title="คนนี้มีหลายรายการที่กรอกไว้ — เช็คให้ครบก่อนลบตามคำขอ PDPA">{r.submission_count}×</span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">{r.contact_channel} · {r.contact_value}</td>
                <td className="p-3 whitespace-nowrap">{STAGE_TH[r.stage] || r.stage || "—"}</td>
                <td className="p-3">{r.has_pcos ? "✓" : ""}</td>
                <td className="p-3">{r.art_plan && r.art_plan !== "ยัง" && r.art_plan !== "none" ? r.art_plan : ""}</td>
                <td className="p-3">{r.score ?? "—"}</td>
                <td className="p-3">{r.tag_count || ""}</td>
                <td className="p-3">{r.line_bound ? <span className="chip !bg-[#06C755]/15 !text-[#06843c] !border-[#06C755]/30">🟢</span> : ""}</td>
                <td className="p-3 whitespace-nowrap font-mono text-xs text-teal-deep">{r.ticket}</td>
                <td className="p-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {canManage && (
                    <div className="flex gap-2">
                      <button className="text-xs text-teal-deep" onClick={() => openEdit(r)}>แก้ไข</button>
                      <button className="text-xs text-rose-deep" onClick={() => setConfirmDeleteId(r.id)}>ลบ</button>
                    </div>
                  )}
                </td>
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setEditing(null)}>
          <div className="glass-strong w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">แก้ไขข้อมูลลูกค้า</h2>
            <p className="mt-1 text-xs text-ink/50">แก้ได้เฉพาะข้อมูลที่ลูกค้าตอบเอง — ไม่กระทบ ticket/รายงาน/ประวัติเครื่องมือเดิม</p>
            <div className="mt-3 space-y-2">
              <input className="field" placeholder="ชื่อเล่น" value={editing.nickname || ""} onChange={(e) => setEditing({ ...editing, nickname: e.target.value })} />
              <div className="flex gap-2">
                <select className="field !w-auto" value={editing.contact_channel} onChange={(e) => setEditing({ ...editing, contact_channel: e.target.value })}>
                  <option value="line">LINE</option><option value="phone">เบอร์โทร</option><option value="other">อื่น ๆ</option>
                </select>
                <input className="field flex-1" placeholder="ช่องทางติดต่อ" value={editing.contact_value || ""} onChange={(e) => setEditing({ ...editing, contact_value: e.target.value })} />
              </div>
              <select className="field" value={editing.stage || ""} onChange={(e) => setEditing({ ...editing, stage: e.target.value })}>
                <option value="">สเตจ: ไม่ระบุ</option>
                {Object.entries(STAGE_TH).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {editing.stage === "infertility" && (
                <div className="rounded-xl border border-black/10 bg-white/60 p-2">
                  <p className="text-xs text-ink/60">ปัญหาที่ติ๊กไว้</p>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {INFERTILITY_ISSUES.map((it) => (
                      <label key={it.v} className="flex items-center gap-1 text-xs">
                        <input type="checkbox" className="accent-teal"
                          checked={(editing.infertility_issues || []).includes(it.v)}
                          onChange={() => {
                            const cur: string[] = editing.infertility_issues || [];
                            setEditing({ ...editing, infertility_issues: cur.includes(it.v) ? cur.filter((x) => x !== it.v) : [...cur, it.v] });
                          }} />
                        {it.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <select className="field" value={editing.art_plan || "ยัง"} onChange={(e) => setEditing({ ...editing, art_plan: e.target.value })}>
                {ART_PLAN_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" className="accent-teal" checked={!!editing.has_pcos} onChange={(e) => setEditing({ ...editing, has_pcos: e.target.checked })} />
                  PCOS
                </label>
                <input className="field !w-28" type="text" placeholder="ช่วงอายุ" value={editing.age_range || ""} onChange={(e) => setEditing({ ...editing, age_range: e.target.value })} />
                <input className="field !w-24" type="number" placeholder="ส่วนสูง" value={editing.height_cm || ""} onChange={(e) => setEditing({ ...editing, height_cm: e.target.value ? +e.target.value : null })} />
              </div>
            </div>
            {editErr && <p className="mt-2 text-sm text-rose-deep">{editErr}</p>}
            <div className="mt-4 flex gap-2">
              <button className="btn-ghost flex-1" disabled={saving} onClick={() => setEditing(null)}>ยกเลิก</button>
              <button className="btn-primary flex-1" disabled={saving} onClick={saveEdit}>{saving ? "กำลังบันทึก…" : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (() => {
        const r = rows.find((x) => x.id === confirmDeleteId);
        const confirmKey = r?.ticket || "ลบ"; // no ticket (dev-mode row) → type "ลบ" instead
        const matched = confirmText.trim().toUpperCase() === confirmKey.toUpperCase();
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && (setConfirmDeleteId(null), setConfirmText(""))}>
          <div className="glass-strong w-full max-w-sm p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-rose-deep">⚠️ ลบข้อมูลลูกค้านี้ถาวร?</p>
            <p className="mt-2 text-sm text-ink/70">{r ? `${r.nickname || "—"} · ${r.ticket || "ไม่มี ticket"}` : ""}</p>
            {r?.submission_count > 1 && (
              <p className="mt-2 rounded-lg bg-gold/10 p-2 text-xs text-ink/70">
                ⚠️ ลูกค้าคนนี้มีทั้งหมด {r.submission_count} รายการ — รายการนี้เป็นแค่ 1 ใน {r.submission_count} ถ้าเป็นคำขอลบข้อมูลตามสิทธิ์ PDPA ต้องเช็คและลบให้ครบทุกรายการของคนเดิม ไม่ใช่แค่รายการนี้
              </p>
            )}
            <p className="mt-2 text-xs text-ink/50">ลบแล้วกู้คืนไม่ได้ — Ticket, รายงาน 90 วัน, ประวัติเครื่องมือ, และ log ความยินยอมของรายการนี้จะถูกลบไปด้วย (การเชื่อม LINE และรายการ submission อื่นของคนเดิมไม่ถูกลบ)</p>
            <p className="mt-3 text-xs font-medium text-ink">พิมพ์ <span className="font-mono text-rose-deep">{confirmKey}</span> เพื่อยืนยัน</p>
            <input className="field mt-1 text-center" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={confirmKey} />
            <div className="mt-4 flex gap-2">
              <button className="btn-ghost flex-1" disabled={deleting} onClick={() => { setConfirmDeleteId(null); setConfirmText(""); }}>ยกเลิก</button>
              <button className="btn-primary !bg-rose-deep flex-1 disabled:opacity-40" disabled={deleting || !matched} onClick={() => doDelete(confirmDeleteId)}>{deleting ? "กำลังลบ…" : "ลบถาวร"}</button>
            </div>
          </div>
        </div>
        );
      })()}
    </main>
  );
}
