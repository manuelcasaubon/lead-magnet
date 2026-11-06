"use client";

import { LINK_PAGO_MP } from "@/lib/rutas";
import s from "./comprobante.module.css";

// Desde el 6/11/26 se cobra solo con el link fijo de Mercado Pago (DECISIONES.md D23): reintentar = volver al link.
// Al pagar, MP redirige a /evento/entrada y la Edge Function "pagos" emite la entrada.
export default function Reintentar({ texto }: { texto: string }) {
  return <a className={s.boton} href={LINK_PAGO_MP}>{texto}</a>;
}
