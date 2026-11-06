"use client";

import { useState, useTransition } from "react";
import { reintentarPago } from "@/app/entrada/acciones";
import s from "./comprobante.module.css";

const MENSAJES: Record<string, string> = {
  sold_out: "Se agotaron los lugares. Escribime por Instagram y te aviso si se libera uno.",
  sales_closed: "La venta está cerrada por ahora.",
  no_price: "La venta todavía no está abierta.",
  already_has_ticket: "Ya tenés tu entrada. Te la reenvié por mail.",
};

export default function Reintentar({ o, texto }: { o: string; texto: string }) {
  const [error, setError] = useState("");
  const [pendiente, start] = useTransition();
  return (
    <>
      <button
        className={s.boton} type="button" disabled={pendiente}
        onClick={() => start(async () => {
          setError("");
          const r = await reintentarPago(o);
          if (r.url) window.location.assign(r.url);
          else setError(MENSAJES[r.code ?? ""] ?? "No pudimos abrir Mercado Pago. Probá de nuevo en un rato.");
        })}
      >
        {pendiente ? "Abriendo Mercado Pago…" : texto}
      </button>
      <p className={s.error} aria-live="polite">{error}</p>
    </>
  );
}
