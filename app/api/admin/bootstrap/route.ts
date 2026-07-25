import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { hashPin, signSession, SESSION_COOKIE, SESSION_TTL_SEC } from "@/lib/auth";

export const runtime = "nodejs";

// One-time: create the FIRST admin. Allowed only when no staff_users exist.
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });
  const { username, display_name, pin } = (await req.json().catch(() => ({}))) as any;
  if (!username || !pin || String(pin).length < 4)
    return NextResponse.json({ error: "กรอกชื่อผู้ใช้ + PIN (อย่างน้อย 4 หลัก)" }, { status: 400 });

  const sb = getServiceClient();
  const { count } = await sb.from("staff_users").select("*", { count: "exact", head: true });
  if ((count || 0) > 0) return NextResponse.json({ error: "มีผู้ดูแลระบบแล้ว ใช้การเข้าสู่ระบบปกติ" }, { status: 409 });

  const { data: u, error } = await sb.from("staff_users").insert({
    username, display_name: display_name || username, pin_hash: hashPin(String(pin)),
    role: "admin", permissions: [], active: true,
  }).select("*").single();
  if (error || !u) return NextResponse.json({ error: "สร้างผู้ดูแลไม่สำเร็จ" }, { status: 500 });

  const token = signSession({ sid: u.id, name: u.display_name, role: "admin", perms: [], exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC });
  const res = NextResponse.json({ ok: true, name: u.display_name });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_SEC });
  return res;
}

// helper for UI: is bootstrap needed?
export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json({ needsBootstrap: false, noEnv: true });
  const sb = getServiceClient();
  const { count } = await sb.from("staff_users").select("*", { count: "exact", head: true });
  return NextResponse.json({ needsBootstrap: (count || 0) === 0 });
}
