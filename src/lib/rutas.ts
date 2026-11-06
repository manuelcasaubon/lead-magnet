// Rutas públicas del sitio central (docs/SPEC.md §1). Un solo lugar para no dejar links viejos.
export const RUTAS = {
  inicio: "/",                 // landing de la oferta principal
  evento: "/evento",           // landing de la clase del 18/11
  entrada: "/evento/entrada",  // retorno de Mercado Pago y comprobante
} as const;

export const urlEntrada = (site: string, orderId: string) => `${site}${RUTAS.entrada}?o=${orderId}`;
