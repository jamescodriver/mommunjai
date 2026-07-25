import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { sessionFromReq } from "@/lib/session-server";
import { hashPin, hasPerm, PERMISSIONS, Permission } from "@/lib/auth";

export const runtime = "nodejs";

// GET: list staff (requires manage_users). POST: create staff with PIN + role + permissions.
export async function GET(req: NextRequest) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "manage_users")) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });
  const sb = getServiceClient();
  const { data } = await sb.from("staff_users")
    .select("id, username, display_name, role, permissions, active, created_at, last_login")
    .order("created_at", { ascending: true });
  return NextResponse.json({ users: data || [] });
}

export async function POST(req: NextRequest) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "manage_users")) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as any;
  const username = String(body.username || "").trim();
  const pin = String(body.pin || "");
  if (!username || pin.length < 4) return NextResponse.json({ error: "กรอกชื่อผู้ใช้ + PIN (≥4 หลัก)" }, { status: 400 });
  const role = body.role === "admin" ? "admin" : "staff";
  const perms: Permission[] = Array.isArray(body.permissions)
    ? body.permissions.filter((p: string) => (PERMISSIONS as readonly string[]).includes(p))
    : [];

  const sb = getServiceClient();
  const { data, error } = await sb.from("staff_users").insert({
    username, display_name: body.display_name || username, pin_hash: hashPin(pin),
    role, permissions: perms, active: true, created_by: s!.sid,
  }).select("id, username, display_name, role, permissions, active").single();
  if (error) {
    const dup = (error as any).code === "23505";
    return NextResponse.json({ error: dup ? "ชื่อผู้ใช้นี้มีแล้ว" : "สร้างไม่สำเร็จ" }, { status: dup ? 409 : 500 });
  }
  await sb.from("staff_audit").insert({ staff_id: s!.sid, action: "create_user", target: username });
  return NextResponse.json({ user: data });
}
