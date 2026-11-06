import "server-only";
import { env } from "@/lib/env";

// Un pago se confirma SIEMPRE contra GET /v1/payments/{id}. Desde el 6/11/26 eso lo hace la Edge Function
// "pagos" de Supabase (supabase/functions/pagos), que tiene MP_ACCESS_TOKEN y RESEND_API_KEY como secretos
// de Supabase: Vercel ya no necesita esas claves. La función es idempotente, emite la entrada, manda los
// mails aprobados (y los reintenta) y registra los eventos del embudo. Lo usan /evento/entrada y el webhook.

// orderId: solo si el pago vino con su orden o se aprobó hace menos de 60 min (habilita ver el comprobante).
export type ResultadoProceso = { ok: true; orderId: string | null; confirmado: boolean; pendiente: boolean } | { ok: false; motivo: string };

// visitante: solo desde la página de retorno (el navegador de quien pagó). Une la compra con su visita y le da
// a la Conversions API de Meta las cookies _fbp/_fbc, la IP y el navegador para atribuir la compra al anuncio.
export type Visitante = { vid?: string | null; ip?: string | null; ua?: string | null };

export async function procesarPago(paymentId: string | number, opts: { ordenEsperada?: string; visitante?: Visitante } = {}): Promise<ResultadoProceso> {
  const r = await fetch(`${env.supabaseUrl()}/functions/v1/pagos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_id: String(paymentId), order_id: opts.ordenEsperada, visitante: opts.visitante }),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (r.status >= 500) throw new Error(`Edge Function pagos: HTTP ${r.status}`);
  if (!j.ok) return { ok: false, motivo: String(j.error ?? `HTTP ${r.status}`) };
  return { ok: true, orderId: (j.orderId as string | null) ?? null, confirmado: !!j.confirmado, pendiente: !!j.pendiente };
}
