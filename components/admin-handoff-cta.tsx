"use client";
import { useState } from "react";
import { readProfile } from "@/lib/profile-store";
import { CONSENT_TEXT } from "@/lib/disclaimer";
import { track } from "@/lib/track";

const LINE_OA_URL = process.env.NEXT_PUBLIC_LINE_OA_URL || "https://lin.ee/fBa4xkz";

interface AdminHandoffCtaProps {
  stage?: string;
  artPlan?: string;
  infertilityIssues?: string[];
  interests?: string[];
  /** key used for tool_results, e.g. "vitamins" | "water" | "protein" */
  tool: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  /** R10 red-team — default text mentions "โปรโมชั่น" (fits the vitamins page,
   *  where it means product discounts). On the labs tool that phrase could
   *  read as "lab-test package promotion", which is out of scope (GFC
   *  partnership still blocked — see PDF-18) — override it there. */
  label?: string;
}

type Phase = "idle" | "submitting" | "done";

// R2 comment-round-3 — "สอบถามรายละเอียดเพิ่มเติม และโปรโมชั่นได้ที่ LINE OA" per
// client feedback: standalone quick-tool result pages should route to an admin
// chat instead of showing full price/detail. The open question that came with
// it ("ทำยังไงให้แอดมินมีข้อมูลอยู่แล้ว ไม่ต้องถามซ้ำ") is answered the same way
// /plan's teaser tier already does it — mint a ticket (via the existing
// /api/lead pipeline) before handing off, so the code the customer quotes in
// LINE (or the "แผนของฉัน" menu trigger) pulls up everything they just answered.
// Never collects anything without consent already granted (ConsentGate, shown
// once at the top of every ToolShell page, gates this).
export default function AdminHandoffCta({ stage, artPlan, infertilityIssues, interests, tool, toolInput, toolOutput, label }: AdminHandoffCtaProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [nickname, setNickname] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const ctaLabel = label || "สอบถามรายละเอียดเพิ่มเติม และโปรโมชั่นได้ที่ LINE OA";
  const consent = typeof window !== "undefined" ? !!readProfile().consent : false;

  // Declined (or never asked) consent — still let them reach an admin, just
  // without carrying any answers forward; nothing gets sent to the server.
  if (!consent) {
    return (
      <a
        className="btn-secondary mt-2 w-full"
        href={LINE_OA_URL}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("line_click", { source: `${tool}_no_consent` })}
      >
        💬 {ctaLabel}
      </a>
    );
  }

  if (phase === "done" && ticket) {
    return (
      <div className="mt-2 rounded-xl border border-teal/30 bg-teal-soft/40 p-3 text-center">
        <p className="text-xs text-ink/70">รหัสของคุณ — แอดมินจะเห็นคำตอบที่คุณตอบไว้แล้ว ไม่ต้องเล่าซ้ำ</p>
        <div className="mx-auto my-2 w-fit rounded-xl border-2 border-dashed border-teal bg-white px-4 py-1.5 text-lg font-bold tracking-widest text-teal-deep">{ticket}</div>
        <a
          className="btn-primary w-full"
          href={LINE_OA_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("line_click", { source: tool, code: ticket })}
        >
          💬 คุยกับแอดมิน Baby & Mom ที่ LINE OA
        </a>
        <p className="mt-1 text-xs text-ink/50">พิมพ์รหัส {ticket} ในแชท หรือกด “แผนของฉัน” ในเมนู LINE</p>
      </div>
    );
  }

  const submit = async () => {
    if (!nickname.trim()) return setErr("ขอชื่อเล่นสักนิดนะคะ");
    if (!contactValue.trim()) return setErr("ขอ LINE ID หรือเบอร์โทรไว้ติดต่อกลับนะคะ");
    setErr(null);
    setPhase("submitting");
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          consent_text: CONSENT_TEXT,
          nickname: nickname.trim(),
          contact_channel: "line",
          contact_value: contactValue.trim(),
          stage,
          art_plan: artPlan,
          infertility_issues: infertilityIssues || [],
          interests: interests || [],
          tools: { [tool]: { input: toolInput ?? null, output: toolOutput ?? null } },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "ส่งข้อมูลไม่สำเร็จ");
      setTicket(data.ticket_code);
      setPhase("done");
      track("admin_handoff", { tool, code: data.ticket_code });
    } catch (e: any) {
      setErr(e.message || "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      setPhase("idle");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-3">
      <p className="text-xs font-medium text-ink">💬 {ctaLabel}</p>
      <p className="mt-0.5 text-xs text-ink/50">ฝากชื่อเล่น + LINE ไว้ก่อน แอดมินจะได้เห็นคำตอบที่คุณตอบไว้แล้ว ไม่ต้องเล่าใหม่</p>
      <div className="mt-2 space-y-2">
        <input
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
          placeholder="ชื่อเล่น"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
          placeholder="LINE ID หรือเบอร์โทร"
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
        />
        {err && <p className="text-xs text-rose-deep">{err}</p>}
        <button className="btn-primary w-full" onClick={submit} disabled={phase === "submitting"}>
          {phase === "submitting" ? "กำลังส่ง..." : "ส่งให้แอดมินดูแลต่อ"}
        </button>
      </div>
    </div>
  );
}
