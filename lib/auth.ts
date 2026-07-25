// Server-only auth: PIN hashing (scrypt) + signed session cookie (HMAC) + RBAC.
// No external deps. NEVER import in client components (uses node:crypto).
// Client-safe constants/types live in ./permissions.
import crypto from "node:crypto";
import { Permission, Session, SESSION_COOKIE, SESSION_TTL_SEC } from "./permissions";
export { PERMISSIONS, PERMISSION_LABELS, SESSION_COOKIE, SESSION_TTL_SEC } from "./permissions";
export type { Permission, Session } from "./permissions";

// ---- PIN hashing (scrypt) ----
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function verifyPin(pin: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const test = crypto.scryptSync(pin, salt, 32);
  const known = Buffer.from(hash, "hex");
  return test.length === known.length && crypto.timingSafeEqual(test, known);
}

// ---- signed session cookie ----
function secret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}
function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}
export function signSession(s: Session): string {
  const payload = b64url(Buffer.from(JSON.stringify(s)));
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
export function verifySession(token: string | undefined): Session | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expect = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!s.exp || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

export function hasPerm(s: Session | null, p: Permission): boolean {
  if (!s) return false;
  if (s.role === "admin") return true; // admin has all
  return s.perms.includes(p);
}
