// Rutas públicas del sitio central (docs/SPEC.md §1). Un solo lugar para no dejar links viejos.
export const RUTAS = {
  inicio: "/",                 // landing de la oferta principal
  evento: "/evento",           // landing de la clase del 18/11
  entrada: "/evento/entrada",  // retorno de Mercado Pago y comprobante
} as const;

export const urlEntrada = (site: string, orderId: string) => `${site}${RUTAS.entrada}?o=${orderId}`;

// Link de pago fijo de Mercado Pago (ARS 42.000, creado por Manu el 6/11/26). Decisión del 6/11: se cobra
// SOLO con este link (sin Checkout Pro). Al pagar, MP redirige a /evento/entrada, donde el pago se verifica
// contra la API (necesita MP_ACCESS_TOKEN de producción) y se emite la entrada (adopt_link_payment).
export const LINK_PAGO_MP = "https://mpago.la/1cKaMGj";
