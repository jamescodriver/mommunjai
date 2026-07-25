import { NextRequest } from "next/server";
import { verifySession, Session, SESSION_COOKIE } from "./auth";

export function sessionFromReq(req: NextRequest): Session | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}
