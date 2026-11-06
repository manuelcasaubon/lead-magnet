// Edge Function "cal-webhook": recibe los avisos de Cal.com (reservas de la sesión desde la página principal).
//
// URL para configurar en Cal.com → Settings → Developer → Webhooks:
//   https://qzfzswascgitycynwlkk.supabase.co/functions/v1/cal-webhook
// Secreto: el mismo valor en el campo "Secret" del webhook de Cal.com y en el secreto de Supabase CAL_WEBHOOK_SECRET.
//
//  - Verifica X-Cal-Signature-256 (HMAC-SHA256 en hex del cuerpo crudo). Sin firma válida → 401 y queda registrado.
//  - Avisos repetidos (mismo trigger + uid + createdAt) no se procesan dos veces.
//  - BOOKING_CREATED / REQUESTED / RESCHEDULED / CANCELLED / REJECTED / MEETING_ENDED / BOOKING_NO_SHOW_UPDATED:
//    guarda o actualiza la reserva, crea o actualiza el lead (fuente "cal") y registra el evento del embudo.
//  - El embed de la web manda metadata[vid] y metadata[utm_*] para unir la reserva con la visita.
import { createClient } from "npm:@supabase/supabase-js@2";
import { enviarEventoMeta } from "../_shared/meta.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

const ESTADOS: Record<string, string> = {
  BOOKING_REQUESTED: "requested", BOOKING_CREATED: "created", BOOKING_RESCHEDULED: "created",
  BOOKING_CANCELLED: "cancelled", BOOKING_REJECTED: "rejected", MEETING_ENDED: "ended",
};
const EVENTOS: Record<string, string> = {
  BOOKING_CREATED: "booking_created", BOOKING_RESCHEDULED: "booking_rescheduled", BOOKING_CANCELLED: "booking_cancelled",
};

async function firmaValida(cuerpo: string, firma: string | null): Promise<boolean> {
  const secreto = Deno.env.get("CAL_WEBHOOK_SECRET");
  if (!secreto || !firma) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(cuerpo)));
  const esperado = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  const recibido = firma.trim().toLowerCase().replace(/^sha256=/, "");
  if (recibido.length !== esperado.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ recibido.charCodeAt(i);
  return dif === 0;
}

// responses de Cal.com: { campo: { label, value } } o { campo: valor }.
function valor(r: unknown): string | undefined {
  if (r == null) return undefined;
  if (typeof r === "object" && "value" in (r as Record<string, unknown>)) return valor((r as Record<string, unknown>).value);
  if (typeof r === "string") return r.trim() || undefined;
  if (typeof r === "number") return String(r);
  return undefined;
}
function buscar(resp: Record<string, unknown>, patron: RegExp): string | undefined {
  for (const [k, v] of Object.entries(resp)) {
    const label = typeof v === "object" && v && "label" in v ? String((v as Record<string, unknown>).label) : "";
    if (patron.test(k) || patron.test(label)) { const x = valor(v); if (x) return x; }
  }
  return undefined;
}

async function procesar(trigger: string, p: Record<string, any>) {
  const uid: string | undefined = p.uid;
  if (!uid) return "sin uid";
  const resp: Record<string, unknown> = p.responses ?? {};
  const asistente = (p.attendees ?? [])[0] ?? {};
  const email = (valor(resp.email) ?? asistente.email ?? "").toLowerCase();
  const nombre = valor(resp.name) ?? asistente.name ?? null;
  const meta: Record<string, unknown> = p.metadata ?? {};
  const vid = typeof meta.vid === "string" && UUID.test(meta.vid) ? meta.vid : null;
  const utm = Object.fromEntries(Object.entries(meta).filter(([k, v]) => /^utm_/.test(k) && typeof v === "string"));

  let personId: string | null = null;
  if (email) {
    const marca = buscar(resp, /instagram|web|marca/i);
    const { data, error } = await db.rpc("upsert_lead", {
      p_email: email, p_name: nombre, p_phone: buscar(resp, /whats|tel|phone|celular/i) ?? null,
      p_instagram: marca && !marca.includes(".") ? marca.replace(/^@/, "") : null,
      p_brand_url: marca && marca.includes(".") ? marca : null,
      p_goal: buscar(resp, /lograr|objetivo|resolver|notes|notas/i) ?? null,
      p_source: "cal", p_visitor_id: vid, p_utm: utm, p_path: "/",
    });
    if (error) throw new Error(`upsert_lead: ${error.message}`);
    personId = data?.[0]?.person_id ?? null;
  }

  const estado = trigger === "BOOKING_NO_SHOW_UPDATED" ? "no_show" : ESTADOS[trigger];
  if (estado) {
    const { error } = await db.from("bookings").upsert({
      uid, booking_id: p.bookingId ?? null, event_type: p.type ?? p.eventTypeSlug ?? null, event_type_id: p.eventTypeId ?? null,
      title: p.title ?? null, status: estado, start_time: p.startTime ?? null, end_time: p.endTime ?? null,
      person_id: personId, attendee_email: email || null, attendee_name: nombre, responses: resp, metadata: meta,
      reason: p.cancellationReason ?? p.rejectionReason ?? null, raw: p,
    }, { onConflict: "uid" });
    if (error) throw new Error(`bookings: ${error.message}`);
  }
  // Reprogramación: la reserva vieja queda marcada y apunta a la nueva.
  const anterior: string | undefined = p.rescheduleUid ?? p.fromReschedule;
  if (trigger === "BOOKING_RESCHEDULED" && anterior && anterior !== uid) {
    await db.from("bookings").update({ status: "rescheduled", rescheduled_to: uid }).eq("uid", anterior);
  }

  const nombreEvento = EVENTOS[trigger];
  if (nombreEvento) {
    await db.from("events").insert({
      name: nombreEvento, visitor_id: vid ?? crypto.randomUUID(), person_id: personId, path: "/",
      props: { uid, event_type: p.type ?? null, start: p.startTime ?? null }, source: (utm.utm_source as string) ?? "cal",
      utm: Object.keys(utm).length ? utm : null,
    });
  }
  // Schedule a la Conversions API de Meta (event_id = uid de la reserva). Se manda una sola vez.
  if (trigger === "BOOKING_CREATED" && personId) {
    const { data: s } = await db.from("settings").select("site_url").eq("id", 1).single();
    await enviarEventoMeta(db, {
      nombre: "Schedule", eventId: uid, personId, visitorId: vid,
      url: `${(s?.site_url ?? "https://comunicatumarca.com").replace(/\/$/, "")}/`,
    });
  }
  return `${trigger} ${uid}${personId ? "" : " sin mail"}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const cuerpo = await req.text();
  if (cuerpo.length > 256_000) return json({ ok: false }, 413);
  const ok = await firmaValida(cuerpo, req.headers.get("x-cal-signature-256"));
  let datos: Record<string, any>;
  try { datos = JSON.parse(cuerpo); } catch { return json({ ok: false, error: "json" }, 400); }

  const trigger = String(datos.triggerEvent ?? "DESCONOCIDO");
  const p: Record<string, any> = datos.payload ?? {};
  const ins = await db.from("cal_webhook_events").insert({
    trigger, uid: p.uid ?? null, cal_created_at: datos.createdAt ?? null, signature_ok: ok, payload: datos,
    error: ok ? null : "firma inválida o falta CAL_WEBHOOK_SECRET",
  }).select("id").single();

  if (!ok) return json({ ok: false, error: "firma" }, 401);
  if (trigger === "PING") return json({ ok: true, ping: true });

  let id: number;
  if (ins.error) {
    if (ins.error.code !== "23505") return json({ ok: false }, 500);
    const { data: previo } = await db.from("cal_webhook_events").select("id, processed_at")
      .eq("trigger", trigger).eq("uid", p.uid ?? "").eq("cal_created_at", datos.createdAt ?? "").maybeSingle();
    if (!previo || previo.processed_at) return json({ ok: true, repetido: true });
    id = previo.id;
  } else {
    id = ins.data.id;
  }

  try {
    const result = await procesar(trigger, p);
    await db.from("cal_webhook_events").update({ result, error: null, processed_at: new Date().toISOString() }).eq("id", id);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("cal-webhook", trigger, msg);
    await db.from("cal_webhook_events").update({ error: msg.slice(0, 500) }).eq("id", id);
    return json({ ok: false }, 500); // Cal.com reintenta
  }
});
