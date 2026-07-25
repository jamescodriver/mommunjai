import { NextRequest, NextResponse } from "next/server";
import { sessionFromReq } from "@/lib/session-server";

export const runtime = "nodejs";

// whoami — returns current session (or null) for client UI gating.
export async function GET(req: NextRequest) {
  const s = sessionFromReq(req);
  if (!s) return NextResponse.json({ authed: false });
  return NextResponse.json({ authed: true, name: s.name, role: s.role, perms: s.perms });
}
