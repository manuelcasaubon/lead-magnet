import "server-only";
import { env } from "@/lib/env";
import { enviarPlantilla } from "@/lib/email/enviar";
import { obtenerPago, type PagoMp } from "@/lib/mercadopago/cliente";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { registrarEvento } from "./eventos";
import { formatoArs } from "./formato";

// Un pago se confirma SIEMPRE contra GET /v1/payments/{id} y se aplica con apply_payment(), que es
// idempotente (docs/SPEC.md §5.3.5). Lo usan el webhook y /entrada.

export type ResultadoProceso =
  | { ok: true; orderId: string | null; estado: string | null; nuevo: boolean; codigo: string | null; mpStatus: string }
  | { ok: false; motivo: "otra_orden"; mpStatus: string };

export async function procesarPago(paymentId: string | number, opts: { ordenEsperada?: string } = {}): Promise<ResultadoProceso> {
  const pago = await obtenerPago(paymentId);

  // En /entrada solo se aplica un pago que pertenezca a la orden de la URL.
  if (opts.ordenEsperada && pago.external_reference !== opts.ordenEsperada) {
    return { ok: false, motivo: "otra_orden", mpStatus: pago.status };
  }

  const db = supabaseAdmin();
  const { data, error } = await db.rpc("apply_payment", { p_payment: pago as unknown as Json });
  if (error) throw new Error(`apply_payment: ${error.message}`);
  const r = data?.[0];
  if (!r?.order_id) return { ok: true, orderId: null, estado: null, nuevo: false, codigo: null, mpStatus: pago.status };

  if (r.order_status === "approved") {
    // Se avisa mientras la entrada no tenga manu_notified_at: si un intento anterior se cortó a la mitad,
    // el siguiente aviso lo completa. enviarPlantilla no manda dos veces la misma plantilla.
    await avisarEntrada(r.order_id, pago);
  }

  if (r.newly_approved) {
    await evento("payment_approved", r.order_id, { mp_status: pago.status, overbooked: r.overbooked });
  } else if (["pending", "in_process", "authorized"].includes(pago.status)) {
    await evento("payment_pending", r.order_id, { mp_status: pago.status, detail: pago.status_detail ?? null });
  } else if (["rejected", "cancelled"].includes(pago.status)) {
    await evento("payment_rejected", r.order_id, { mp_status: pago.status, detail: pago.status_detail ?? null });
  }

  return { ok: true, orderId: r.order_id, estado: r.order_status, nuevo: r.newly_approved, codigo: r.ticket_code, mpStatus: pago.status };
}

async function evento(name: "payment_approved" | "payment_pending" | "payment_rejected", orderId: string, props: Record<string, unknown>) {
  const { data: o } = await supabaseAdmin().from("orders")
    .select("visitor_id, person_id, source, utm, experiments").eq("id", orderId).maybeSingle();
  await registrarEvento({
    name, visitorId: o?.visitor_id, personId: o?.person_id, path: "/api/mp/webhook",
    props: { order_id: orderId, ...props }, source: o?.source, utm: o?.utm, experiments: o?.experiments,
  });
}

async function avisarEntrada(orderId: string, pago: PagoMp) {
  const db = supabaseAdmin();
  const { data: t } = await db.from("tickets")
    .select("id, code, status, manu_notified_at, overbooked, person_id, order_id").eq("order_id", orderId).maybeSingle();
  if (!t || t.manu_notified_at || t.status === "cancelled") return;

  const [{ data: p }, { data: o }, { data: cupo }] = await Promise.all([
    db.from("people").select("id, email, name").eq("id", t.person_id).single(),
    db.from("orders").select("amount_ars, source").eq("id", orderId).single(),
    db.rpc("seats_status"),
  ]);
  if (!p) return;
  const c = cupo?.[0];
  const nombre = primerNombre(p.name);

  const conf = await enviarPlantilla({
    templateKey: "confirmacion_entrada", to: p.email, personId: p.id,
    vars: { nombre, codigo: t.code, link_entrada: `${env.siteUrl()}/entrada?o=${orderId}` },
  });

  const manu = env.manuNotifyEmail();
  // personId = quien compró: así el aviso a Manu es único por compra y no uno solo en toda la venta
  // (requiere la migración 20261105000101, ver docs/DECISIONES.md S3).
  const aviso = manu ? await enviarPlantilla({
    templateKey: "aviso_manu", to: manu, personId: p.id,
    vars: {
      nombre: p.name ?? p.email, email: p.email, codigo: t.code + (t.overbooked ? " (pasado del tope)" : ""),
      monto: formatoArs(pago.transaction_amount ?? o?.amount_ars ?? 0),
      origen: o?.source ?? "directo",
      vendidas: c?.sold ?? "?", cupo: c?.capacity_public ?? 30, tope: c?.capacity_max ?? 40,
    },
  }) : { status: "skipped" as const, error: "sin MANU_NOTIFY_EMAIL" };

  // Se marca solo si los dos mails quedaron resueltos (enviados, ya enviados antes o salteados a propósito).
  // Si alguno falló, el próximo aviso de MP vuelve a intentar.
  const resuelto = (s: string) => s !== "failed";
  if (resuelto(conf.status) && resuelto(aviso.status)) {
    await db.from("tickets").update({ manu_notified_at: new Date().toISOString() }).eq("id", t.id).is("manu_notified_at", null);
  } else {
    console.error("avisarEntrada", orderId, conf, aviso);
  }
}

function primerNombre(n: string | null): string {
  return (n ?? "").trim().split(/\s+/)[0] ?? "";
}
