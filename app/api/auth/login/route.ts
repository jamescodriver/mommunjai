import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { verifyPin, signSession, SESSION_COOKIE, SESSION_TTL_SEC, Permission } from "@/lib/auth";
import { rateLimit } from "@/lib/ticket";

export const runtime = "nodejs";

// Login with username + PIN. Sets an httpOnly signed session cookie.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`login:${ip}`, 8, 60_000))
    return NextResponse.json({ error: "พยายามเข้าสู่ระบบถี่เกินไป" }, { status: 429 });

  const { username, pin } = (await req.json().catch(() => ({}))) as any;
  if (!username || !pin) return NextResponse.json({ error: "กรอกชื่อผู้ใช้และ PIN" }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "ระบบยังไม่ได้ตั้งค่า (Supabase env)" }, { status: 503 });

  const sb = getServiceClient();
  const { data: u } = await sb.from("staff_users").select("*").eq("username", username).eq("active", true).single();
  if (!u || !verifyPin(String(pin), u.pin_hash))
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง" }, { status: 401 });

  await sb.from("staff_users").update({ last_login: new Date().toISOString() }).eq("id", u.id);

  const token = signSession({
    sid: u.id,
    name: u.display_name,
    role: u.role,
    perms: (u.permissions || []) as Permission[],
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
  });
  const res = NextResponse.json({ ok: true, name: u.display_name, role: u.role, perms: u.permissions || [] });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: SESSION_TTL_SEC,
  });
  return res;
}
