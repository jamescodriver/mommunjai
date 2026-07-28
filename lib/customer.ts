// Customer identity (PDF-05/06, server-only): self-contained resume tokens so
// the LINE webhook can hand someone a link back to /plan without a DB-backed
// session, plus LINE-user-id -> customer resolution for the webhook's menu path.
import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const RESUME_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

function secret(): string {
  const s = process.env.RESUME_TOKEN_SECRET;
  if (!s) throw new Error("Missing RESUME_TOKEN_SECRET (set in Vercel env; never expose to client)");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** customerId.issuedAtEpoch, HMAC-signed — no DB row needed to mint or check one. */
export function signResumeToken(customerId: string): string {
  const payload = `${customerId}.${Date.now()}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload)}`;
}

export function verifyResumeToken(token: string): { customerId: string } | null {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, sig] = token.split(".");
  if (!encodedPayload || !sig) return null;
  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(payload);
  try {
    if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
      return null;
    }
  } catch {
    return null;
  }
  const [customerId, issuedAtStr] = payload.split(".");
  const issuedAt = Number(issuedAtStr);
  if (!customerId || !Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > RESUME_TOKEN_TTL_MS) return null;
  return { customerId };
}

export interface CustomerRow {
  id: string;
  primary_lead_id: string | null;
  line_user_id: string | null;
  current_stage: string | null;
}

/**
 * Resolve a LINE user to a customer. Prefers `customers.line_user_id` (the
 * new source of truth); falls back to the legacy `line_bindings` upsert path
 * for anyone who linked before this migration, lazily backfilling `customers`
 * so they only need to fall back once.
 */
export async function resolveCustomerByLineUserId(
  sb: SupabaseClient,
  lineUserId: string,
): Promise<CustomerRow | null> {
  const { data: direct } = await sb
    .from("customers")
    .select("id, primary_lead_id, line_user_id, current_stage")
    .eq("line_user_id", lineUserId)
    .maybeSingle();
  if (direct) return direct as CustomerRow;

  const { data: binding } = await sb
    .from("line_bindings")
    .select("lead_id")
    .eq("line_user_id", lineUserId)
    .maybeSingle();
  if (!binding?.lead_id) return null;

  const { data: lead } = await sb
    .from("leads")
    .select("customer_id, stage")
    .eq("id", binding.lead_id)
    .maybeSingle();
  if (!lead?.customer_id) return null;

  const { data: customer } = await sb
    .from("customers")
    .select("id, primary_lead_id, line_user_id, current_stage")
    .eq("id", lead.customer_id)
    .maybeSingle();
  if (!customer) return null;

  // Backfill so next time this resolves via the direct path.
  await sb.from("customers").update({ line_user_id: lineUserId }).eq("id", customer.id);
  await sb.from("line_bindings").update({ customer_id: customer.id }).eq("line_user_id", lineUserId);

  return { ...customer, line_user_id: lineUserId } as CustomerRow;
}

/**
 * Called from the existing "type your ticket code" webhook path: stamps
 * `line_user_id` onto that lead's customer (creating one if this lead
 * predates the customers table). Returns the resolved customer id so the
 * caller can also stamp `line_bindings.customer_id`.
 */
export async function linkLeadToCustomerViaLine(
  sb: SupabaseClient,
  leadId: string,
  lineUserId: string,
): Promise<string | null> {
  const { data: lead } = await sb.from("leads").select("customer_id").eq("id", leadId).maybeSingle();
  if (lead?.customer_id) {
    await sb.from("customers").update({ line_user_id: lineUserId, last_active_at: new Date().toISOString() }).eq("id", lead.customer_id);
    return lead.customer_id;
  }
  const { data: customer } = await sb
    .from("customers")
    .insert({ primary_lead_id: leadId, line_user_id: lineUserId })
    .select("id")
    .single();
  if (!customer) return null;
  await sb.from("leads").update({ customer_id: customer.id }).eq("id", leadId);
  return customer.id;
}
