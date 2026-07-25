"use client";
// Lightweight, best-effort analytics beacon (PRD §10). Never blocks UX; no PII.
export function track(name: string, props: Record<string, unknown> = {}) {
  try {
    let anon = localStorage.getItem("mmj_anon");
    if (!anon) {
      anon = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("mmj_anon", anon);
    }
    const body = JSON.stringify({ name, anon_id: anon, props });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {
    /* analytics must never break the app */
  }
}
