import "server-only";
import { env } from "@/lib/env";
import { EVENTO } from "@/lib/evento";
import { urlEntrada } from "@/lib/rutas";

// Mercado Pago por REST, sin SDK (docs/SPEC.md §1 y §5.3.3). Solo dos llamadas:
// crear la preferencia de Checkout Pro y leer un pago. 10 s de espera y un reintento en 5xx o error de red.

// MP_API_BASE solo sirve para la simulación local (src/lib/pagos/pruebas); en producción se ignora.
const API = (process.env.NODE_ENV !== "production" && process.env.MP_API_BASE) || "https://api.mercadopago.com";

export class ErrorMp extends Error {
  constructor(message: string, public status: number, public detalle?: unknown) { super(message); }
}

async function llamar<T>(path: string, init: RequestInit & { idempotencyKey?: string }): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.mpAccessToken()}`,
    "Content-Type": "application/json",
  };
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;

  let ultimo: unknown;
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
      const json = await r.json().catch(() => ({}));
      if (r.ok) return json as T;
      ultimo = new ErrorMp(`Mercado Pago ${r.status} en ${path}`, r.status, json);
      if (r.status < 500) break; // 4xx: no tiene sentido reintentar
    } catch (e) {
      ultimo = e; // tiempo de espera o red: se reintenta una vez
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error(String(ultimo));
}

// Mercado Pago pide la fecha con la zona horaria explícita. Se manda en hora argentina (UTC-3, sin horario de verano).
export function fechaMp(d: Date): string {
  const ar = new Date(d.getTime() - 3 * 3600_000);
  return ar.toISOString().replace("Z", "-03:00");
}

export type Preferencia = { id: string; init_point: string; sandbox_init_point?: string };

export async function crearPreferencia(
  order: { id: string; amount_ars: number; hold_expires_at: string | null },
  person: { email: string; name: string | null },
): Promise<Preferencia> {
  const site = env.siteUrl();
  const vuelta = urlEntrada(site, order.id);
  const vence = new Date(new Date(order.hold_expires_at ?? Date.now() + 20 * 60_000).getTime() + 10 * 60_000);
  return llamar<Preferencia>("/checkout/preferences", {
    method: "POST",
    idempotencyKey: order.id,
    body: JSON.stringify({
      items: [{ id: "clase-18-11", title: EVENTO.nombre, quantity: 1, unit_price: Number(order.amount_ars), currency_id: "ARS" }],
      payer: { email: person.email, ...(person.name ? { name: person.name } : {}) },
      external_reference: order.id,
      back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
      auto_return: "approved",
      notification_url: `${site}/api/mp/webhook?source_news=webhooks`,
      statement_descriptor: "MANU CASAUBON",
      expires: true,
      expiration_date_to: fechaMp(vence),
      binary_mode: false,
      metadata: { order_id: order.id },
    }),
  });
}

// Lo mínimo que usamos del pago. El JSON completo se guarda tal cual en payments.raw.
export type PagoMp = {
  id: number;
  status: string;
  status_detail?: string | null;
  external_reference?: string | null;
  transaction_amount?: number | null;
  currency_id?: string | null;
  date_approved?: string | null;
  date_created?: string | null;
  live_mode?: boolean;
  payer?: { email?: string | null; first_name?: string | null } | null;
  [k: string]: unknown;
};

export async function obtenerPago(id: string | number): Promise<PagoMp> {
  const limpio = String(id).trim();
  if (!/^\d{1,20}$/.test(limpio)) throw new ErrorMp("id de pago inválido", 400);
  return llamar<PagoMp>(`/v1/payments/${limpio}`, { method: "GET" });
}
