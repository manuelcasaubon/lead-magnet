// Edge Function "pagos": verifica un pago de Mercado Pago contra la API y emite la entrada.
// POST { payment_id: "123", order_id?: "<uuid>" }
//  - Nunca confía en lo que trae la URL: consulta GET /v1/payments/{id} con MP_ACCESS_TOKEN (secreto de Supabase).
//  - Con order_id (checkout propio): solo aplica el pago si external_reference coincide.
//  - Sin orden nuestra (link fijo mpago.la): adopt_link_payment() valida monto/moneda/producto y crea persona, orden y entrada.
//  - Idempotente: se puede llamar N veces (página de retorno, reintentos, webhook).
//  - Al aprobarse manda confirmacion_entrada y aviso_manu (si están aprobadas) y registra eventos del embudo.
// Pública a propósito (verify_jwt=false): no devuelve datos personales, solo el id de orden si el pago es
// reciente (60 min) o vino con su order_id correcto. Lo llama el servidor de Vercel desde /evento/entrada.
import { createClient } from "npm:@supabase/supabase-js@2";
import { enviarPlantilla, saludo } from "../_shared/email.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VENTANA_MIN = 60;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
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

async function avisarEntrada(orderId: string, pago: Record<string, any>) {
  const { data: t } = await db.from("tickets").select("id, code, status, manu_notified_at, overbooked, person_id").eq("order_id", orderId).maybeSingle();
  if (!t || t.manu_notified_at || t.status === "cancelled") return;
  const [{ data: p }, { data: o }, { data: cupo }, { data: s }] = await Promise.all([
    db.from("people").select("id, email, name").eq("id", t.person_id).single(),
    db.from("orders").select("amount_ars, source").eq("id", orderId).single(),
    db.rpc("seats_status"),
    db.from("settings").select("site_url, manu_notify_email").eq("id", 1).single(),
  ]);
  if (!p) return;
  const c = cupo?.[0];
  const nombre = (p.name ?? "").trim().split(/\s+/)[0] ?? "";
  const link = `${(s?.site_url ?? "https://comunicatumarca.com").replace(/\/$/, "")}/evento/entrada?o=${orderId}`;

  const conf = p.email.endsWith(".invalid") ? { status: "skipped" as const } : await enviarPlantilla(db, {
    templateKey: "confirmacion_entrada", to: p.email, personId: p.id,
    vars: { nombre, saludo: saludo(nombre), codigo: t.code, link_entrada: link },
  });
  const aviso = s?.manu_notify_email ? await enviarPlantilla(db, {
    templateKey: "aviso_manu", to: s.manu_notify_email, personId: p.id,
    vars: {
      nombre: p.name ?? p.email, email: p.email, codigo: t.code + (t.overbooked ? " (pasado del tope)" : ""),
      monto: ars(pago.transaction_amount ?? o?.amount_ars ?? 0), origen: o?.source ?? "directo",
      vendidas: c?.sold ?? "?", cupo: c?.capacity_public ?? 30, tope: c?.capacity_max ?? 40,
    },
  }) : { status: "skipped" as const };
  if (conf.status !== "failed" && aviso.status !== "failed") {
    await db.from("tickets").update({ manu_notified_at: new Date().toISOString() }).eq("id", t.id).is("manu_notified_at", null);
  } else {
    console.error("avisarEntrada", orderId, conf, aviso);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const body = await req.json().catch(() => ({})) as { payment_id?: string | number; order_id?: string };
  const paymentId = String(body.payment_id ?? "").trim();
  const orderId = body.order_id ? String(body.order_id) : null;
  if (!/^\d{1,20}$/.test(paymentId) || (orderId && !UUID.test(orderId))) return json({ ok: false, error: "invalid" }, 400);

  try {
    const pago = await obtenerPago(paymentId);
    if (!pago) return json({ ok: false, motivo: "no_existe" }, 404);
    const extRef = typeof pago.external_reference === "string" ? pago.external_reference : null;
    if (orderId && extRef !== orderId) return json({ ok: false, motivo: "otra_orden", mpStatus: pago.status });

    const porLink = !(extRef && UUID.test(extRef));
    const { data, error } = porLink
      ? await db.rpc("adopt_link_payment", { p_payment: pago })
      : await db.rpc("apply_payment", { p_payment: pago });
    if (error) throw new Error(error.message);
    const r = data?.[0];
    const aprobadoEn: string | null = pago.date_approved ?? null;
    if (!r?.order_id) return json({ ok: true, orderId: null, estado: null, mpStatus: pago.status, porLink, aprobadoEn });

    if (r.order_status === "approved") await avisarEntrada(r.order_id, pago);
    if (r.newly_approved) await evento("payment_approved", r.order_id, { mp_status: pago.status, overbooked: r.overbooked, via: porLink ? "link" : "checkout" });
    else if (["pending", "in_process", "authorized"].includes(pago.status)) await evento("payment_pending", r.order_id, { mp_status: pago.status });
    else if (["rejected", "cancelled"].includes(pago.status)) await evento("payment_rejected", r.order_id, { mp_status: pago.status });

    // El id de orden habilita ver el comprobante: solo se devuelve si vino con su orden o si el pago es reciente.
    const reciente = !!aprobadoEn && Date.now() - new Date(aprobadoEn).getTime() < VENTANA_MIN * 60_000;
    const mostrar = !!orderId || reciente;
    return json({ ok: true, orderId: mostrar ? r.order_id : null, confirmado: r.order_status === "approved",
      estado: r.order_status, nuevo: r.newly_approved, mpStatus: pago.status, porLink, aprobadoEn });
  } catch (e) {
    console.error("pagos", paymentId, e instanceof Error ? e.message : e);
    return json({ ok: false, error: "server" }, 500);
  }
});
