"use client";

import { useState } from "react";
import FormularioReserva from "@/components/form/FormularioReserva";
import { track } from "@/lib/track/cliente";
import { LINK_PAGO_MP } from "@/lib/rutas";
import { EVENTO_DM } from "./datos";
import s from "./landing.module.css";

// Formulario "un paso" (A) encadenado al link fijo de Mercado Pago (decisión de Manu, 6/11: sin Checkout Pro).
// 1) /api/lead guarda a la persona (lo hace el formulario). 2) Se mide el clic. 3) Mensaje corto y a MP.
const ESPERA_MS = 1200;

function irAPagar(origen: string) {
  track("click", { target: "ir_a_pagar_link", from: origen });
}

export default function Reserva() {
  const [yendo, setYendo] = useState(false);

  async function onLead() {
    irAPagar("formulario");
    setYendo(true);
    await new Promise((r) => setTimeout(r, ESPERA_MS));
    window.location.href = LINK_PAGO_MP;
  }

  return (
    <div className={s.reserva}>
      {yendo ? (
        <div className={s.mensaje} role="status">
          <strong>Te llevo a Mercado Pago</strong>
          <p>Te llevo a Mercado Pago para pagar. Después del pago volvés acá y ves tu entrada.</p>
          <p>Si no pasa nada, <a href={LINK_PAGO_MP} onClick={() => irAPagar("mensaje")}>tocá acá para pagar</a>.</p>
        </div>
      ) : (
        <FormularioReserva
          variante="un-paso"
          lugar="final"
          instagramUrl={EVENTO_DM}
          onLead={onLead}
          alFallar={
            <p className={s.pagoDirecto}>
              Igual podés pagar ahora: <a href={LINK_PAGO_MP} onClick={() => irAPagar("error_lead")}>ir a Mercado Pago</a>.
            </p>
          }
        />
      )}
    </div>
  );
}
