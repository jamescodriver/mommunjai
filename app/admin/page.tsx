"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PERMISSIONS, PERMISSION_LABELS, Permission } from "@/lib/permissions";

// Admin console — manage staff users: create with PIN + role + permissions, toggle active, reset PIN.
export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [nf, setNf] = useState<any>({ role: "staff", permissions: [] as Permission[] });
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users || []));

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((d) => {
      if (!d.authed) return router.push("/login");
      if (d.role !== "admin" && !(d.perms || []).includes("manage_users")) return router.push("/staff");
      setMe(d); load();
    });
  }, [router]);

  const togglePerm = (p: Permission) =>
    setNf((x: any) => ({ ...x, permissions: x.permissions.includes(p) ? x.permissions.filter((q: string) => q !== p) : [...x.permissions, p] }));

  const create = async () => {
    setErr(null); setMsg(null);
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nf) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error);
    setMsg(`สร้างผู้ใช้ ${d.user.username} แล้ว`); setNf({ role: "staff", permissions: [] }); load();
  };
  const patch = async (id: string, body: any) => {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  if (!me) return <main className="p-8 text-center text-sm text-ink/60">กำลังตรวจสอบสิทธิ์…</main>;

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">👑 จัดการผู้ใช้ทีมงาน</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/leads" className="text-teal-deep">รายชื่อทั้งหมด</Link>
          <Link href="/staff" className="text-teal-deep">ค้น Ticket</Link>
          <button className="btn-ghost !py-1.5" onClick={logout}>ออกจากระบบ</button>
        </div>
      </div>

      {/* create */}
      <div className="glass mt-4 p-5">
        <h2 className="font-semibold">➕ เพิ่มผู้ใช้ใหม่</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input className="field" placeholder="ชื่อผู้ใช้" value={nf.username || ""} onChange={(e) => setNf({ ...nf, username: e.target.value })} />
          <input className="field" placeholder="ชื่อที่แสดง" value={nf.display_name || ""} onChange={(e) => setNf({ ...nf, display_name: e.target.value })} />
          <input className="field" type="password" placeholder="PIN (≥4 หลัก)" value={nf.pin || ""} onChange={(e) => setNf({ ...nf, pin: e.target.value })} />
          <select className="field" value={nf.role} onChange={(e) => setNf({ ...nf, role: e.target.value })}>
            <option value="staff">Staff</option><option value="admin">Admin (ทุกสิทธิ์)</option>
          </select>
        </div>
        {nf.role === "staff" && (
          <div className="mt-3">
            <p className="text-xs text-ink/60">สิทธิ์การเข้าถึง</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {PERMISSIONS.map((p) => (
                <label key={p} className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm cursor-pointer ${nf.permissions.includes(p) ? "border-teal bg-teal/10" : "border-black/10 bg-white/60"}`}>
                  <input type="checkbox" className="accent-teal" checked={nf.permissions.includes(p)} onChange={() => togglePerm(p)} />
                  {PERMISSION_LABELS[p]}
                </label>
              ))}
            </div>
          </div>
        )}
        {err && <p className="mt-2 text-sm text-rose-deep">{err}</p>}
        {msg && <p className="mt-2 text-sm text-teal-deep">{msg}</p>}
        <button className="btn-primary mt-3" onClick={create}>สร้างผู้ใช้ + PIN</button>
      </div>

      {/* list */}
      <div className="glass mt-4 p-5">
        <h2 className="font-semibold">ผู้ใช้ทั้งหมด ({users.length})</h2>
        <div className="mt-3 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl bg-white/70 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div><b>{u.display_name}</b> <span className="text-ink/50">@{u.username}</span> <span className="chip ml-1">{u.role}</span> {!u.active && <span className="chip !bg-rose-soft !text-rose-deep">ปิดใช้งาน</span>}</div>
                <div className="flex gap-2">
                  <button className="text-xs text-teal-deep" onClick={() => { const pin = prompt("PIN ใหม่ (≥4 หลัก)"); if (pin) patch(u.id, { pin }); }}>รีเซ็ต PIN</button>
                  <button className="text-xs text-rose-deep" onClick={() => patch(u.id, { active: !u.active })}>{u.active ? "ปิด" : "เปิด"}</button>
                </div>
              </div>
              {u.role === "staff" && <div className="mt-1 text-xs text-ink/50">สิทธิ์: {(u.permissions || []).map((p: Permission) => PERMISSION_LABELS[p] || p).join(" · ") || "—"}</div>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
