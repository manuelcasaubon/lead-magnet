// Íconos de línea de la landing (reemplazan a los emojis, pedido de Manu, 7/11). Toman el color del texto.
const base = { width: 32, height: 32, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const chico = (t: number) => ({ ...base, width: t, height: t });

// "Qué te llevás"
export const IconoCalendario = () => (
  <svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M8 14h3M8 17h6" /></svg>
);
export const IconoLupa = () => (
  <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M8 11h6M11 8v6" /></svg>
);
export const IconoObjetivo = () => (
  <svg {...base}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>
);
export const IconoCharla = () => (
  <svg {...base}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /><path d="M9 10.5h6M9 13.5h4" /></svg>
);

// Datos de la entrada (hero)
export const IconoFecha = ({ t = 20 }: { t?: number }) => (
  <svg {...chico(t)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const IconoReloj = ({ t = 20 }: { t?: number }) => (
  <svg {...chico(t)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconoPin = ({ t = 20 }: { t?: number }) => (
  <svg {...chico(t)}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const IconoTicket = ({ t = 20 }: { t?: number }) => (
  <svg {...chico(t)}><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3Z" /><path d="M14 6v12" strokeDasharray="2 2.5" /></svg>
);

// Desplegables y listas
export const IconoMas = ({ t = 18 }: { t?: number }) => (
  <svg {...chico(t)} strokeWidth={2.2}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconoCheck = ({ t = 22 }: { t?: number }) => (
  <svg {...chico(t)} strokeWidth={2.6}><path d="m4.5 12.5 4.8 4.8L19.5 7" /></svg>
);
