import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";
import { enviarPlantilla } from "@/lib/email/enviar";
import { crearPreferencia } from "@/lib/mercadopago/cliente";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { CONSENT_TEXT } from "@/components/form/reglas";
import { esUuid, registrarEvento } from "./eventos";

// Inicio del pago (docs/SPEC.md §2.5): upsert_lead → reserve_order → preferencia → set_order_preference → checkout_start.

const opcional = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const EntradaCheckout = z.object({
  email: z.string().trim().toLowerCase().max(200).email(),
  name: opcional(120),
  phone: z.string().trim().max(40).regex(/^[0-9+\s()-]*$/).optional().transform((v) => (v ? v : undefined)),
  instagram: opcional(200),
  brand_url: opcional(300),
  goal: opcional(1000),
  consent: z.boolean().optional(),
  consent_text: opcional(300),
});
export type EntradaCheckout = z.infer<typeof EntradaCheckout>;

export type Contexto = { visitorId?: string | null; utm?: Record<string, string>; experiments?: Record<string, string>; referrer?: string | null; path?: string };

export type CodigoError = "sold_out" | "sales_closed" | "no_price" | "already_has_ticket" | "invalid" | "mp_error" | "error";
export type ResultadoCheckout = { ok: true; url: string; orderId: string } | { ok: false; code: CodigoError };

const CODIGOS_DB = ["sold_out", "sales_closed", "no_price", "already_has_ticket"] as const;

export function fuenteDe(utm: Record<string, string> | undefined): string {
  return utm?.utm_source || utm?.referrer || "directo";
}

export async function iniciarCheckout(entrada: Pick<EntradaCheckout, "email"> & Partial<EntradaCheckout>, ctx: Contexto): Promise<ResultadoCheckout> {
  const db = supabaseAdmin();
  const vid = esUuid(ctx.visitorId) ? ctx.visitorId : null;
  const utm = ctx.utm ?? {};
  const exps = ctx.experiments ?? {};
  const source = fuenteDe(utm);

  // 1. El pago también cuenta como lead.
  const { data: lead, error: e1 } = await db.rpc("upsert_lead", {
    p_email: entrada.email, p_name: entrada.name, p_phone: entrada.phone, p_instagram: entrada.instagram,
    p_brand_url: entrada.brand_url, p_goal: entrada.goal, p_source: "checkout", p_consent: entrada.consent ?? false,
    // El texto aceptado lo fija el servidor: no se guarda lo que mande el navegador.
    p_consent_text: entrada.consent ? CONSENT_TEXT : undefined, p_visitor_id: vid ?? undefined,
    p_utm: utm as Json, p_referrer: ctx.referrer ?? undefined, p_path: ctx.path ?? "/api/checkout", p_experiments: exps as Json,
  });
  if (e1 || !lead?.[0]) {
    if (e1?.message?.includes("invalid_email")) return { ok: false, code: "invalid" };
    console.error("upsert_lead", e1?.message);
    return { ok: false, code: "error" };
  }
  const personId = lead[0].person_id;

  // 2. Reserva del lugar (respeta el tope; reutiliza la orden pendiente vigente).
  const { data: order, error: e2 } = await db.rpc("reserve_order", {
    p_person_id: personId, p_visitor_id: vid ?? undefined, p_source: source, p_utm: utm as Json, p_experiments: exps as Json,
  });
  if (e2 || !order) {
    const code = CODIGOS_DB.find((c) => e2?.message?.includes(c));
    if (code === "already_has_ticket") await reenviarEntrada(personId);
    if (!code) console.error("reserve_order", e2?.message);
    await registrarEvento({ name: "checkout_error", visitorId: vid, personId, path: ctx.path, props: { code: code ?? "error" }, source, utm: utm as Json, experiments: exps as Json });
    return { ok: false, code: code ?? "error" };
  }

  // 3 y 4. Preferencia de Checkout Pro (una por orden: X-Idempotency-Key = order.id).
  let url: string;
  try {
    const pref = await crearPreferencia(
      { id: order.id, amount_ars: Number(order.amount_ars), hold_expires_at: order.hold_expires_at },
      { email: entrada.email, name: entrada.name ?? null },
    );
    url = pref.init_point;
    if (!order.mp_preference_id || order.mp_preference_id !== pref.id) {
      const { error } = await db.rpc("set_order_preference", { p_order_id: order.id, p_preference_id: pref.id });
      if (error) console.error("set_order_preference", error.message);
    }
  } catch (e) {
    console.error("crearPreferencia", e);
    await registrarEvento({ name: "checkout_error", visitorId: vid, personId, path: ctx.path, props: { code: "mp_error" }, source, utm: utm as Json, experiments: exps as Json });
    return { ok: false, code: "mp_error" };
  }

  // 5.
  await registrarEvento({ name: "checkout_start", visitorId: vid, personId, path: ctx.path, props: { order_id: order.id }, source, utm: utm as Json, experiments: exps as Json });
  return { ok: true, url, orderId: order.id };
}

// "Ya tenés tu entrada, te la reenvío". Solo sale si la plantilla está aprobada y no se mandó antes
// (enviarPlantilla no repite una plantilla a la misma persona; ver pregunta S3 en DECISIONES.md).
async function reenviarEntrada(personId: string) {
  const db = supabaseAdmin();
  const { data: t } = await db.from("tickets").select("code, order_id, person_id").eq("person_id", personId)
    .in("status", ["valid", "used"]).limit(1).maybeSingle();
  if (!t) return;
  const { data: p } = await db.from("people").select("email, name").eq("id", personId).single();
  if (!p) return;
  await enviarPlantilla({
    templateKey: "confirmacion_entrada", to: p.email, personId,
    vars: { nombre: (p.name ?? "").split(/\s+/)[0], codigo: t.code, link_entrada: `${env.siteUrl()}/entrada?o=${t.order_id}` },
  }).catch((e) => console.error("reenviarEntrada", e));
}

// Cookies del middleware: utm va como JSON con encodeURIComponent. exp (la agrega S7) se acepta como JSON {exp: variante}.
export function leerJsonCookie(v: string | undefined): Record<string, string> {
  if (!v) return {};
  for (const intento of [() => decodeURIComponent(v), () => v]) {
    try {
      const o = JSON.parse(intento());
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return Object.fromEntries(Object.entries(o).filter(([, x]) => typeof x === "string").map(([k, x]) => [k.slice(0, 40), (x as string).slice(0, 120)]));
      }
    } catch { /* sigue */ }
  }
  return {};
}
