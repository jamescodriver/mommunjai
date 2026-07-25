import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { sessionFromReq } from "@/lib/session-server";
import { hashPin, hasPerm, PERMISSIONS, Permission } from "@/lib/auth";

export const runtime = "nodejs";

// PATCH: update role/permissions/active, or reset PIN. Requires manage_users.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = sessionFromReq(req);
  if (!hasPerm(s, "manage_users")) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase env ยังไม่ตั้ง" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as any;
  const patch: Record<string, unknown> = {};
  if (body.role) patch.role = body.role === "admin" ? "admin" : "staff";
  if (typeof body.active === "boolean") patch.active = body.active;
  if (Array.isArray(body.permissions))
    patch.permissions = body.permissions.filter((p: string) => (PERMISSIONS as readonly string[]).includes(p)) as Permission[];
  if (body.pin) {
    if (String(body.pin).length < 4) return NextResponse.json({ error: "PIN อย่างน้อย 4 หลัก" }, { status: 400 });
    patch.pin_hash = hashPin(String(body.pin));
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "ไม่มีข้อมูลให้แก้ไข" }, { status: 400 });

  // guard: don't let an admin lock themselves out (deactivate/demote self)
  if (params.id === s!.sid && (patch.active === false || patch.role === "staff"))
    return NextResponse.json({ error: "ไม่สามารถปิด/ลดสิทธิ์บัญชีตัวเองได้" }, { status: 400 });

  const sb = getServiceClient();
  const { error } = await sb.from("staff_users").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  await sb.from("staff_audit").insert({ staff_id: s!.sid, action: "update_user", target: params.id });
  return NextResponse.json({ ok: true });
}
