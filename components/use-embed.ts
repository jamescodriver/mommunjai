"use client";
import { useEffect, useState } from "react";

// Reads ?embed=1 from the URL without useSearchParams (avoids CSR-bailout / Suspense
// requirement during static prerender). Hydration-safe: starts false, updates on mount.
export function useEmbed(): boolean {
  const [embed, setEmbed] = useState(false);
  useEffect(() => {
    const on = new URLSearchParams(window.location.search).get("embed") === "1";
    setEmbed(on);
    document.body.classList.toggle("embed", on);
  }, []);
  return embed;
}
