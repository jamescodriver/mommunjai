"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/wordmark";

// Staff/admin login. If no admin exists yet, shows one-time setup for the first admin.
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"loading" | "login" | "setup" | "noenv">("loading");
  const [f, setF] = useState<any>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/bootstrap").then((r) => r.json()).then((d) => {
      setMode(d.noEnv ? "noenv" : d.needsBootstrap ? "setup" : "login");
    }).catch(() => setMode("login"));
  }, []);

  const login = async () => {
    setErr(null); setBusy(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: f.username, pin: f.pin }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push(d.role === "admin" ? "/admin" : "/staff");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const setup = async () => {
    setErr(null); setBusy(true);
    try {
      const r = await fetch("/api/admin/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: f.username, display_name: f.display_name, pin: f.pin }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push("/admin");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm items-center p-4">
      <div className="glass w-full p-6">
        <div className="mb-4 text-center">
          <Wordmark className="text-xl" />
          <p className="mt-1 text-xs text-ink/50">ระบบทีมงาน</p>
        </div>
        {mode === "loading" && <p className="text-center text-sm text-ink/60">กำลังโหลด…</p>}
        {mode === "noenv" && <p className="text-center text-sm">ยังไม่ได้ตั้งค่าฐานข้อมูล (Supabase env) — ระบบผู้ดูแลจะใช้ได้เมื่อ deploy จริง</p>}

        {mode === "setup" && (
          <div className="space-y-3">
            <h1 className="text-lg font-semibold">ตั้งค่าผู้ดูแลระบบคนแรก</h1>
            <p className="text-xs text-ink/60">สร้างบัญชี Admin คนแรกเพื่อเริ่มใช้งาน (ทำครั้งเดียว)</p>
            <input className="field" placeholder="ชื่อผู้ใช้ (เช่น admin)" onChange={(e) => setF({ ...f, username: e.target.value })} />
            <input className="field" placeholder="ชื่อที่แสดง" onChange={(e) => setF({ ...f, display_name: e.target.value })} />
            <input className="field" type="password" placeholder="PIN (อย่างน้อย 4 หลัก)" onChange={(e) => setF({ ...f, pin: e.target.value })} />
            {err && <p className="text-sm text-rose-deep">{err}</p>}
            <button className="btn-primary w-full" onClick={setup} disabled={busy}>{busy ? "กำลังสร้าง…" : "สร้าง Admin"}</button>
          </div>
        )}

        {mode === "login" && (
          <div className="space-y-3">
            <h1 className="text-lg font-semibold">เข้าสู่ระบบทีมงาน</h1>
            <input className="field" placeholder="ชื่อผู้ใช้" onChange={(e) => setF({ ...f, username: e.target.value })} />
            <input className="field" type="password" placeholder="PIN" onChange={(e) => setF({ ...f, pin: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && login()} />
            {err && <p className="text-sm text-rose-deep">{err}</p>}
            <button className="btn-primary w-full" onClick={login} disabled={busy}>{busy ? "…" : "เข้าสู่ระบบ"}</button>
          </div>
        )}
      </div>
    </main>
  );
}
