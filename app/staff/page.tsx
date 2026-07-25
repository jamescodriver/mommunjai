"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Staff ticket lookup — session-authenticated (see /login). Shows profile, tags, report link, LINE status.
export default function StaffPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [code, setCode] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((d) => {
      if (!d.authed) return router.push("/login");
      setMe(d);
      // auto-lookup when arriving from Leads Dashboard (/staff?code=MJ-XXXXXX)
      const c = new URLSearchParams(window.location.search).get("code");
      if (c) { setCode(c.toUpperCase()); lookup(c); }
    });
  }, [router]);

  const lookup = async (c = code) => {
    setErr(null); setData(null);
    const res = await fetch(`/api/ticket/${encodeURIComponent(c.toUpperCase())}`);
    const d = await res.json();
    if (!res.ok) return setErr(d.error || "ผิดพลาด");
    setData(d);
  };
  const addTag = async () => {
    if (!newTag.trim()) return;
    const slug = newTag.startsWith("#") ? newTag : "#" + newTag;
    const r = await fetch(`/api/ticket/${code.toUpperCase()}/tags`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, action: "add" }) });
    if (r.ok) { setNewTag(""); lookup(); } else setErr((await r.json()).error);
  };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  if (!me) return <main className="p-8 text-center text-sm text-ink/60">กำลังตรวจสอบสิทธิ์…</main>;

  return (
    <main className="mx-auto w-full max-w-lg p-4 sm:p-6">
      <div className="flex items-center justify-between text-sm">
        <span>สวัสดีค่ะ <b>{me.name}</b> <span className="chip ml-1">{me.role}</span></span>
        <div className="flex gap-3">
          {(me.role === "admin" || (me.perms || []).includes("view_leads")) && <Link href="/leads" className="text-teal-deep">รายชื่อทั้งหมด</Link>}
          {(me.role === "admin" || (me.perms || []).includes("manage_users")) && <Link href="/admin" className="text-teal-deep">จัดการผู้ใช้</Link>}
          <button className="text-ink/60" onClick={logout}>ออกจากระบบ</button>
        </div>
      </div>

      <div className="glass mt-3 p-5">
        <h1 className="text-lg font-semibold">🔎 ค้นหา Ticket ลูกค้า</h1>
        <div className="mt-3 flex gap-2">
          <input className="field" placeholder="MJ-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} />
          <button className="btn-primary" onClick={() => lookup()}>ค้นหา</button>
        </div>
        {err && <p className="mt-2 text-sm text-rose-deep">{err}</p>}
      </div>

      {data && (
        <div className="glass-strong mt-4 p-5 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{data.lead?.nickname || "—"}</h2>
            <span className="chip">{data.ticket?.status}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-ink/70">
            <div>ช่องทาง: {data.lead?.contact_channel} — {data.lead?.contact_value}</div>
            <div>ช่วง: {data.lead?.stage}</div>
            <div>อายุ: {data.lead?.age_range || "—"}</div>
            <div>PCOS: {data.lead?.has_pcos ? "ใช่" : "ไม่"}</div>
            <div>แผน ART: {data.lead?.art_plan}</div>
            <div>คะแนนพร้อม: {data.reportScore ?? "—"}/100</div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {data.line ? <span className="chip !bg-[#06C755]/15 !text-[#06843c] !border-[#06C755]/30">🟢 เชื่อม LINE แล้ว</span> : <span className="chip !bg-black/5 !text-ink/50">ยังไม่เชื่อม LINE</span>}
            <a className="text-xs text-teal-deep underline" href={`/r/${data.ticket?.code}`} target="_blank" rel="noreferrer">ดูรายงานของลูกค้า →</a>
          </div>

          <div className="mt-3">
            <p className="font-medium">Tags</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {data.tags?.map((t: any, i: number) => (
                <span key={i} className="chip" style={{ background: (t.tags?.color || "#1BC0BA") + "22" }}>{t.tags?.label || t.tags?.slug}</span>
              ))}
              {(!data.tags || data.tags.length === 0) && <span className="text-xs text-ink/40">ยังไม่มี tag</span>}
            </div>
            {data.canTag && (
              <div className="mt-2 flex gap-2">
                <input className="field" placeholder="เพิ่ม tag (เช่น พร้อมซื้อ)" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} />
                <button className="btn-ghost" onClick={addTag}>เพิ่ม</button>
              </div>
            )}
          </div>

          {data.results?.length > 0 && (
            <div className="mt-3">
              <p className="font-medium">เครื่องมือที่ทำ ({data.results.length})</p>
              <div className="mt-1 flex flex-wrap gap-1">{data.results.map((r: any, i: number) => <span key={i} className="chip">{r.tool}</span>)}</div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
