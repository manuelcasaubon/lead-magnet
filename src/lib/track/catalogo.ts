// Catálogo de eventos de tracking (contrato: docs/SPEC.md §4). Cualquier sesión que mida algo
// usa estos nombres; si hace falta uno nuevo, se agrega acá y en el SPEC.
export const EVENTOS = {
  page_view: "Vista de página",
  scroll_depth: "Scroll (props.pct: 25|50|75|100)",
  click: "Clic en elemento con data-track (props.target)",
  instagram_click: "Clic en 'Mandame TALLER' (props.place)",
  form_view: "Formulario visible (props.form, props.variant)",
  form_start: "Primer foco en el formulario",
  form_field_focus: "Foco en campo (props.field)",
  form_field_blur: "Sale del campo (props.field, props.filled, props.valid)",
  form_error: "Error de validación (props.field, props.code)",
  form_submit: "Envío del formulario",
  lead_created: "Lead guardado en la base (servidor)",
  checkout_start: "Se creó la preferencia de MP (servidor)",
  checkout_error: "No se pudo iniciar el pago (props.code)",
  payment_approved: "Pago aprobado verificado contra la API de MP (servidor)",
  payment_pending: "Pago pendiente o en proceso (servidor)",
  payment_rejected: "Pago rechazado (servidor)",
  ticket_view: "Vio su comprobante",
  pdf_download: "Bajó el PDF del comprobante",
  audit_profile_sent: "Mandó su perfil para la auditoría",
  vsl_view: "Reproductor visible",
  vsl_play: "Play (props.sec)",
  vsl_pause: "Pausa (props.sec)",
  vsl_progress: "Latido cada 5 s mientras se reproduce (props.sec, bucket de 5 s)",
  vsl_quartile: "Cuartil alcanzado (props.q: 25|50|75|100)",
  vsl_end: "Terminó el video",
  exp_exposure: "Vio una variante (props.exp, props.variant)",
} as const;

export type NombreEvento = keyof typeof EVENTOS;
export const NOMBRES_EVENTOS = Object.keys(EVENTOS) as NombreEvento[];
