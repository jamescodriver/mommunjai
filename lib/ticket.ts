// Ticket code generator (server). base32 without confusing chars. See docs/DATA-MODEL.md.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function genTicketCode(): string {
  let s = "MJ-";
  for (let i = 0; i < 6; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

// naive in-memory rate limiter (per instance). For prod scale, use Vercel KV / Upstash.
const hits = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now - cur.t > windowMs) {
    hits.set(key, { n: 1, t: now });
    return true;
  }
  if (cur.n >= limit) return false;
  cur.n++;
  return true;
}
