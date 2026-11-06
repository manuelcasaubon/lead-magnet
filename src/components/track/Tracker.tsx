"use client";

import { useEffect } from "react";
import { track } from "@/lib/track/cliente";

// Tracking mínimo de página (docs/SPEC.md §4 y §5.4.1), armado por S1 mientras no esté S4:
// page_view al montar, scroll_depth 25/50/75/100 una vez cada uno y click en elementos con data-track.
const MARCAS = [25, 50, 75, 100] as const;

export default function Tracker() {
  useEffect(() => {
    track("page_view", { ref: document.referrer ? new URL(document.referrer).host : "directo" });

    const vistos = new Set<number>();
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      const doc = document.documentElement;
      const alto = doc.scrollHeight - window.innerHeight;
      const pct = alto <= 0 ? 100 : Math.round((window.scrollY / alto) * 100);
      for (const m of MARCAS) {
        if (pct >= m && !vistos.has(m)) { vistos.add(m); track("scroll_depth", { pct: m }); }
      }
    };
    const onScroll = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      const target = el?.getAttribute("data-track");
      if (target) track("click", { target });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
