import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/permissions";

// Edge-level coarse gate: redirect to /login if no session cookie on staff/admin areas.
// Full HMAC verification + RBAC still happens in the API routes / pages (node runtime).
export function middleware(req: NextRequest) {
  const hasCookie = !!req.cookies.get(SESSION_COOKIE)?.value;
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
