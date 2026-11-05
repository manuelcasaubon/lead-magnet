// Formatos para el comprobante y los mails. Sin "server-only": lo usa también el cliente.
const ars = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

// "ARS 30.000": con el código explícito, para no confundir con el precio en dólares.
export function formatoArs(n: number | string): string {
  return `ARS ${ars.format(Number(n))}`;
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso)).replace(",", "");
}
