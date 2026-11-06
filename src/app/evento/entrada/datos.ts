import "server-only";
import { EVENTO } from "@/lib/evento";
import { esUuid } from "@/lib/pagos/eventos";
import { fechaCorta, formatoArs } from "@/lib/pagos/formato";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Lectura de la orden para /entrada. Solo devuelve lo que se muestra en el comprobante.
export type Vista =
  | { tipo: "no_existe" }
  | { tipo: "aprobada"; datos: DatosComprobante; perfilGuardado: string | null; perfilSugerido: string }
  | { tipo: "pendiente" | "rechazada" | "sin_pago" | "cancelada"; nombre: string };

export type DatosComprobante = {
  orderId: string;
  nombre: string;
  email: string;
  cuando: string;
  puertas: string;
  donde: string;
  monto: string;
  fechaPago: string;
  operacion: string;
  codigo: string;
  evento: string;
};

export async function leerOrden(o: string | undefined): Promise<Vista & { personId?: string; visitorId?: string | null }> {
  if (!esUuid(o)) return { tipo: "no_existe" };
  const db = supabaseAdmin();
  const { data: orden } = await db.from("orders")
    .select("id, status, amount_ars, mp_payment_id, approved_at, person_id, visitor_id").eq("id", o).maybeSingle();
  if (!orden) return { tipo: "no_existe" };

  const { data: p } = await db.from("people").select("name, email, instagram, brand_url").eq("id", orden.person_id).single();
  const nombre = p?.name ?? "";
  const base = { personId: orden.person_id, visitorId: orden.visitor_id };

  if (orden.status === "approved") {
    const [{ data: t }, { data: pago }] = await Promise.all([
      db.from("tickets").select("code, status, audit_profile").eq("order_id", orden.id).maybeSingle(),
      orden.mp_payment_id
        ? db.from("payments").select("transaction_amount, date_approved").eq("mp_payment_id", orden.mp_payment_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (!t || t.status === "cancelled") return { tipo: "cancelada", nombre, ...base };
    return {
      tipo: "aprobada",
      ...base,
      perfilGuardado: t.audit_profile ?? null,
      perfilSugerido: p?.instagram ?? p?.brand_url ?? "",
      datos: {
        orderId: orden.id,
        nombre: nombre || "—",
        email: p?.email ?? "",
        cuando: EVENTO.fechaLarga,
        puertas: `${EVENTO.puertas} h`,
        donde: EVENTO.lugar,
        monto: formatoArs(pago?.transaction_amount ?? orden.amount_ars),
        fechaPago: fechaCorta(pago?.date_approved ?? orden.approved_at),
        operacion: orden.mp_payment_id ? String(orden.mp_payment_id) : "",
        codigo: t.code,
        evento: EVENTO.nombre,
      },
    };
  }
  if (orden.status === "pending" && !orden.mp_payment_id) return { tipo: "sin_pago", nombre, ...base };
  if (orden.status === "pending" || orden.status === "in_process") return { tipo: "pendiente", nombre, ...base };
  if (orden.status === "refunded" || orden.status === "charged_back") return { tipo: "cancelada", nombre, ...base };
  return { tipo: "rechazada", nombre, ...base }; // rejected, cancelled, expired
}
