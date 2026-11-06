// Edge Function "pagos": verifica un pago de Mercado Pago contra la API y emite la entrada.
//
// POST { payment_id: "123", order_id?: "<uuid>" }   (pública: la llama /evento/entrada desde Vercel)
//  - Nunca confía en lo que trae la URL: consulta GET /v1/payments/{id} con MP_ACCESS_TOKEN (secreto de Supabase).
//  - Con order_id (checkout propio): solo aplica el pago si external_reference coincide.
//  - Sin orden nuestra (link fijo mpago.la): adopt_link_payment() valida precio exacto, moneda, fecha y producto,
//    y crea persona, orden y entrada.
//  - Idempotente. Responde lo mínimo: { ok, orderId, confirmado, pendiente }. orderId (que habilita ver el
//    comprobante) solo si vino con su orden o si el pago se aprobó hace menos de 60 min.
//
// POST { pendientes: true } + header x-cron-secret   (pg_cron cada 10 min)
//  - Reintenta los mails de las entradas sin avisar (plantillas recién aprobadas, modo test → live, fallas).
import { createClient } from "npm:@supabase/supabase-js@2";
import { enviarPlantilla, resuelto, saludo } from "../_shared/email.ts";
import { enviarEventoMeta } from "../_shared/meta.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VENTANA_MIN = 60;
const PENDIENTE = ["pending", "in_process", "authorized"];
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
// Origen legible para el aviso de venta.
const ORIGENES: Record<string, string> = {
  mp_link: "Link de Mercado Pago", form: "Formulario de la web", checkout: "Pago desde la web",
  instagram_dm: "Instagram (mensaje)", manual: "Carga manual", cal: "Agenda (Cal.com)", directo: "Directo",
};
const origenLegible = (s?: string | null) => (s ? ORIGENES[s] ?? s : "Directo");
const ars = (n: number | string) => `ARS ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Number(n))}`;

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function obtenerPago(id: string) {
  const token = Deno.env.get("MP_ACCESS_TOKEN");
  if (!token) throw new Error("falta MP_ACCESS_TOKEN");
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) return j as Record<string, any>;
      if (r.status === 404) return null;
      if (r.status < 500) throw new Error(`Mercado Pago ${r.status}`);
    } catch (e) { if (i === 1) throw e; }
  }
  throw new Error("Mercado Pago no respondió");
}

async function evento(name: string, orderId: string, props: Record<string, unknown>) {
  const { data: o } = await db.from("orders").select("visitor_id, person_id, source, utm, experiments").eq("id", orderId).maybeSingle();
  await db.from("events").insert({
    name, visitor_id: o?.visitor_id ?? crypto.randomUUID(), person_id: o?.person_id ?? null, path: "/evento/entrada",
    props: { order_id: orderId, ...props }, source: o?.source ?? null, utm: o?.utm ?? null, experiments: o?.experiments ?? {},
  });
}

// Confirmación a quien compró + aviso a Manu. Marca manu_notified_at solo cuando los dos quedaron resueltos
// (enviados, ya enviados antes, o que no corresponde mandar). Si alguno está pendiente o falló, se reintenta.
async function avisarEntrada(orderId: string) {
  const { data: t } = await db.from("tickets").select("id, code, status, manu_notified_at, overbooked, person_id").eq("order_id", orderId).maybeSingle();
  if (!t || t.manu_notified_at || t.status === "cancelled") return;
  const [{ data: p }, { data: o }, { data: cupo }, { data: s }] = await Promise.all([
    db.from("people").select("id, email, name").eq("id", t.person_id).single(),
    db.from("orders").select("amount_ars, source, mp_payment_id").eq("id", orderId).single(),
    db.rpc("seats_status"),
    db.from("settings").select("site_url, manu_notify_email").eq("id", 1).single(),
  ]);
  if (!p || !o) return;
  const { data: pago } = o.mp_payment_id
    ? await db.from("payments").select("transaction_amount").eq("mp_payment_id", o.mp_payment_id).maybeSingle()
    : { data: null };
  const c = cupo?.[0];
  const nombre = (p.name ?? "").trim().split(/\s+/)[0] ?? "";
  const link = `${(s?.site_url ?? "https://comunicatumarca.com").replace(/\/$/, "")}/evento/entrada?o=${orderId}`;

  const conf = p.email.endsWith(".invalid")
    ? { status: "skipped" as const, error: "sin mail" }
    : await enviarPlantilla(db, {
        templateKey: "confirmacion_entrada", to: p.email, personId: p.id,
        vars: { nombre, saludo: saludo(nombre), codigo: t.code, link_entrada: link },
      });
  const aviso = s?.manu_notify_email
    ? await enviarPlantilla(db, {
        templateKey: "aviso_manu", to: s.manu_notify_email, personId: p.id,
        vars: {
          nombre: p.name ?? p.email, email: p.email, codigo: t.code + (t.overbooked ? " (pasado del tope)" : ""),
          monto: ars(pago?.transaction_amount ?? o.amount_ars), origen: origenLegible(o.source),
          vendidas: c?.sold ?? "?", cupo: c?.capacity_public ?? 30, tope: c?.capacity_max ?? 40,
        },
      })
    : { status: "pending" as const, error: "falta settings.manu_notify_email" };

  if (resuelto(conf) && resuelto(aviso)) {
    await db.from("tickets").update({ manu_notified_at: new Date().toISOString() }).eq("id", t.id).is("manu_notified_at", null);
  } else if (conf.status === "failed" || aviso.status === "failed") {
    console.error("avisarEntrada", orderId, conf, aviso);
  }
}

// Purchase a la Conversions API de Meta (event_id = id de la orden). Idempotente: se manda una sola vez.
async function compraMeta(orderId: string) {
  const { data: o } = await db.from("orders").select("person_id, visitor_id, amount_ars, mp_payment_id, approved_at, status").eq("id", orderId).maybeSingle();
  if (!o || o.status !== "approved") return;
  const [{ data: p }, { data: pago }, { data: s }] = await Promise.all([
    db.from("people").select("first_visitor_id").eq("id", o.person_id).maybeSingle(),
    o.mp_payment_id ? db.from("payments").select("transaction_amount").eq("mp_payment_id", o.mp_payment_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("settings").select("site_url").eq("id", 1).single(),
  ]);
  await enviarEventoMeta(db, {
    nombre: "Purchase", eventId: orderId, personId: o.person_id,
    url: `${(s?.site_url ?? "https://comunicatumarca.com").replace(/\/$/, "")}/evento`,
    cuando: o.approved_at ? new Date(o.approved_at) : undefined,
    valor: { monto: Number(pago?.transaction_amount ?? o.amount_ars), moneda: "ARS", contenido: "Clase en vivo 18/11" },
    visitorId: o.visitor_id ?? p?.first_visitor_id ?? null,
  });
}

async function pendientes(req: Request) {
  const { data: ok } = await db.rpc("check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return json({ ok: false }, 401);
  const { data: lista } = await db.from("tickets").select("order_id")
    .is("manu_notified_at", null).in("status", ["valid", "used"]).order("created_at").limit(50);
  for (const t of lista ?? []) await avisarEntrada(t.order_id);
  // Compras que no llegaron a Meta (sin token todavía o error): se reintentan.
  const { data: meta } = await db.from("meta_capi_events").select("event_id")
    .eq("event_name", "Purchase").in("status", ["skipped", "failed"]).order("created_at").limit(50);
  for (const m of meta ?? []) await compraMeta(m.event_id);
  return json({ ok: true, revisadas: lista?.length ?? 0, meta: meta?.length ?? 0 });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const body = await req.json().catch(() => ({})) as { payment_id?: string | number; order_id?: string; pendientes?: boolean };
  if (body.pendientes) return pendientes(req);

  const paymentId = String(body.payment_id ?? "").trim();
  const orderId = body.order_id ? String(body.order_id) : null;
  if (!/^\d{1,20}$/.test(paymentId) || (orderId && !UUID.test(orderId))) return json({ ok: false, error: "invalid" }, 400);

  try {
    const pago = await obtenerPago(paymentId);
    // Respuesta mínima para pagos que no son de la entrada: no se revela si existen ni su estado.
    const nada = { ok: true, orderId: null, confirmado: false, pendiente: false };
    if (!pago) return json(nada);
    const extRef = typeof pago.external_reference === "string" ? pago.external_reference : null;
    if (orderId && extRef !== orderId) return json(nada);

    const porLink = !(extRef && UUID.test(extRef));
    const { data, error } = porLink
      ? await db.rpc("adopt_link_payment", { p_payment: pago })
      : await db.rpc("apply_payment", { p_payment: pago });
    if (error) throw new Error(error.message);
    const r = data?.[0];
    if (!r?.order_id) {
      // Un pago del link pendiente todavía no se adopta (se adopta cuando se aprueba).
      const pareceDelLink = porLink && PENDIENTE.includes(pago.status);
      return json({ ...nada, pendiente: pareceDelLink });
    }

    if (r.order_status === "approved") await avisarEntrada(r.order_id);
    if (r.order_status === "approved") await compraMeta(r.order_id);
    if (r.newly_approved) await evento("payment_approved", r.order_id, { mp_status: pago.status, overbooked: r.overbooked, via: porLink ? "link" : "checkout" });
    else if (PENDIENTE.includes(pago.status)) await evento("payment_pending", r.order_id, { mp_status: pago.status });
    else if (["rejected", "cancelled"].includes(pago.status)) await evento("payment_rejected", r.order_id, { mp_status: pago.status });

    const aprobadoEn: string | null = pago.date_approved ?? null;
    const reciente = !!aprobadoEn && Date.now() - new Date(aprobadoEn).getTime() < VENTANA_MIN * 60_000;
    return json({
      ok: true,
      orderId: orderId || reciente ? r.order_id : null,
      confirmado: r.order_status === "approved",
      pendiente: r.order_status === "pending" || r.order_status === "in_process",
    });
  } catch (e) {
    console.error("pagos", paymentId, e instanceof Error ? e.message : e);
    return json({ ok: false, error: "server" }, 500);
  }
});
