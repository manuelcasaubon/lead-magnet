"use client";

import type { NombreEvento } from "./catalogo";

// Cliente de tracking (contrato: docs/SPEC.md §4). Junta eventos y los manda en lote a POST /api/t
// cada 2 s y al salir de la página (pagehide / pestaña oculta).
// Regla: NUNCA mandar mail, nombre, teléfono ni el valor de un campo en props.

export type PropValor = string | number | boolean;
export type Props = Record<string, PropValor>;

type Evento = { name: NombreEvento; props: Props; path: string; ts: number };

const ENDPOINT = "/api/t";
const INTERVALO_MS = 2000;
const MAX_LOTE = 50;
const CLAVES_PROHIBIDAS = /mail|name|nombre|phone|tel|whats|instagram|value|valor|dni|address/i;

const cola: Evento[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let escuchando = false;

function limpiar(props?: Props): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(props ?? {})) {
    if (CLAVES_PROHIBIDAS.test(k)) {
      if (process.env.NODE_ENV !== "production") console.warn(`[track] prop "${k}" descartada: posible dato personal`);
      continue;
    }
    out[k] = typeof v === "string" ? v.slice(0, 200) : v;
  }
  return out;
}

function enviar(eventos: Evento[], alSalir: boolean) {
  const body = JSON.stringify({ events: eventos });
  try {
    if (alSalir && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    // El tracking nunca rompe la página.
  }
}

export function flush(alSalir = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  while (cola.length > 0) enviar(cola.splice(0, MAX_LOTE), alSalir);
}

function escuchar() {
  if (escuchando || typeof window === "undefined") return;
  escuchando = true;
  window.addEventListener("pagehide", () => flush(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

export function track(name: NombreEvento, props?: Props) {
  if (typeof window === "undefined") return;
  escuchar();
  cola.push({ name, props: limpiar(props), path: window.location.pathname, ts: Date.now() });
  if (cola.length >= MAX_LOTE) flush();
  else if (!timer) timer = setTimeout(() => flush(), INTERVALO_MS);
}
