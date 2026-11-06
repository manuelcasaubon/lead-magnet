import "server-only";
import { env } from "@/lib/env";

// Un pago se confirma SIEMPRE contra GET /v1/payments/{id}. Desde el 6/11/26 eso lo hace la Edge Function
// "pagos" de Supabase (supabase/functions/pagos), que tiene MP_ACCESS_TOKEN y RESEND_API_KEY como secretos
// de Supabase: Vercel ya no necesita esas claves. La función es idempotente, emite la entrada, manda los
// mails aprobados y registra los eventos del embudo. Lo usan /evento/entrada y el webhook.

export type ResultadoProceso =
  | { ok: true; orderId: string | null; confirmado?: boolean; estado: string | null; nuevo?: boolean; mpStatus: string; porLink: boolean; aprobadoEn: string | null }
  | { ok: false; motivo: string; mpStatus?: string };

export async function procesarPago(paymentId: string | number, opts: { ordenEsperada?: string } = {}): Promise<ResultadoProceso> {
  const r = await fetch(`${env.supabaseUrl()}/functions/v1/pagos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_id: String(paymentId), order_id: opts.ordenEsperada }),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (r.status >= 500) throw new Error(`Edge Function pagos: HTTP ${r.status}`);
  if (!j.ok) return { ok: false, motivo: String(j.motivo ?? j.error ?? `HTTP ${r.status}`), mpStatus: j.mpStatus as string | undefined };
  return j as unknown as ResultadoProceso;
}
