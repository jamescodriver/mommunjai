"use client";
import Link from "next/link";
import { MEDICAL_DISCLAIMER } from "@/lib/disclaimer";
import { ReactNode, useEffect } from "react";

// Emits its own height to a parent frame so the brand site can auto-resize the widget.
export function EmbedAutoResize() {
  useEffect(() => {
    const send = () =>
      window.parent?.postMessage(
        { type: "mmj:height", height: document.body.scrollHeight },
        "*",
      );
    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);
  return null;
}

export function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="mt-4 text-xs leading-relaxed text-ink/60 border-t border-black/5 pt-3">
      ⚠️ {text || MEDICAL_DISCLAIMER}
    </p>
  );
}

export function ToolShell({
  title,
  emoji,
  intro,
  children,
  disclaimer,
  embed,
}: {
  title: string;
  emoji: string;
  intro?: string;
  children: ReactNode;
  disclaimer?: string;
  embed?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      {!embed && (
        <Link href="/" className="text-sm text-teal-deep">
          ← กลับหน้าหลัก
        </Link>
      )}
      <div className="glass mt-3 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {emoji}
          </span>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        {intro && <p className="mt-2 text-sm text-ink/70">{intro}</p>}
        <div className="mt-5">{children}</div>
        <Disclaimer text={disclaimer} />
      </div>
    </div>
  );
}

export function ResultCard({ children }: { children: ReactNode }) {
  return (
    <div className="glass-strong mt-5 p-4" role="status" aria-live="polite">
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}

export function PlanCta() {
  return (
    <Link href="/plan" className="btn-primary mt-4 w-full">
      💛 รับแผนบำรุงเฉพาะคุณ + คุยกับทีม Baby & Mom
    </Link>
  );
}

export function ProductChip({ name, price }: { name: string; price: number }) {
  return (
    <div className="chip">
      {name} · ฿{price.toLocaleString()}
    </div>
  );
}
