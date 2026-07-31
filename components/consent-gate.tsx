"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_TEXT } from "@/lib/disclaimer";
import { readProfile, setConsentChoice, needsConsentAgain } from "@/lib/profile-store";

// R7 — moves the consent ask to the very start of the interaction, on every
// standalone tool (not just /plan). Declining never blocks the calculator
// itself (docs/legal-compliance.md client-only-first) — it only stops local
// memory, enforced centrally in lib/profile-store.ts's mergeProfile guard.
export function useConsentGate() {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const p = readProfile();
    setConsent(!!p.consent);
    // 🔒 R3 — "ตอบแล้ว" ต้องหมายถึงตอบ **ข้อความเวอร์ชันปัจจุบัน** ไม่ใช่แค่เคยตอบอะไรก็ได้
    // ไม่งั้นคนที่ยินยอมข้อความเก่า (ครอบแค่ภาวะการเจริญพันธุ์) จะไม่ถูกถามใหม่ แต่ระบบ
    // บันทึกว่าเขายินยอมข้อความใหม่ที่ครอบพฤติกรรม/ความเครียด/ข้อมูลคู่ — Lucifer 31/7
    setAnswered(!needsConsentAgain(p));
    setReady(true);
  }, []);

  const accept = () => { setConsentChoice(true); setConsent(true); setAnswered(true); };
  const decline = () => { setConsentChoice(false); setConsent(false); setAnswered(true); };

  return { ready, consent, answered, accept, decline };
}

// Rendered once, before the reader sees the tool's own questions. Shown only
// until they make a choice (accept OR decline) — never again after that on
// this device, and never a hard block either way.
export function ConsentGate() {
  const { ready, answered, accept, decline } = useConsentGate();
  if (!ready || answered) return null;
  return (
    <div className="glass-strong mt-4 mb-4 p-4 text-xs text-ink/70">
      <p className="font-medium text-ink">ก่อนเริ่ม ขออนุญาตสักนิดนะคะ 💛</p>
      <p className="mt-1 leading-relaxed">
        {CONSENT_TEXT} (<Link href="/privacy" className="underline">อ่านนโยบาย</Link>)
      </p>
      <div className="mt-2 flex gap-2">
        <button className="btn-primary !min-h-0 flex-1 !py-2 text-xs" onClick={accept}>ยินยอม</button>
        <button className="btn-ghost !min-h-0 flex-1 !py-2 text-xs" onClick={decline}>ใช้แบบไม่เก็บข้อมูล</button>
      </div>
    </div>
  );
}
