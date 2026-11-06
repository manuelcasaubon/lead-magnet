"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/track/cliente";
import { EVENTO_DM } from "./datos";

// "Mandame TALLER": alternativa secundaria al formulario (D2). Mide instagram_click con el lugar.
export default function LinkInstagram({ place, children, className }: { place: string; children: ReactNode; className?: string }) {
  return (
    <a href={EVENTO_DM} target="_blank" rel="noopener noreferrer" className={className}
      onClick={() => track("instagram_click", { place })}>
      {children}
    </a>
  );
}
