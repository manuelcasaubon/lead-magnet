// Conversions API de Meta (único punto de envío). Secretos de Supabase:
//   META_PIXEL_ID            id del pixel/conjunto de datos
//   META_CAPI_ACCESS_TOKEN   token de la Conversions API (Events Manager → pixel → Configuración)
//   META_TEST_EVENT_CODE     opcional: código de "Probar eventos" para verlos en Events Manager sin ensuciar datos
// Sin pixel o sin token: no se manda nada y queda registrado como 'skipped'.
// Cada (event_name, event_id) se manda una sola vez (tabla meta_capi_events). El event_id es el mismo que usa el
// pixel del navegador para el mismo hecho, así Meta no lo cuenta dos veces.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v23.0";

async function sha256(v: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

export type EventoMeta = {
  nombre: "Lead" | "Purchase" | "Schedule" | "CompleteRegistration";
  eventId: string;
  personId?: string | null;
  url: string;                       // event_source_url
  cuando?: Date;
  valor?: { monto: number; moneda: string; contenido?: string };
  // Datos del navegador, solo si el evento viene de una request del visitante (no se guardan).
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  visitorId?: string | null;         // para buscar _fbp/_fbc guardados si no vinieron en la request
};

export async function enviarEventoMeta(db: SupabaseClient, ev: EventoMeta): Promise<"sent" | "skipped" | "failed" | "duplicate"> {
  const pixel = Deno.env.get("META_PIXEL_ID");
  const token = Deno.env.get("META_CAPI_ACCESS_TOKEN");

  // Reserva del envío: si ya existe, no se repite.
  const reg = await db.from("meta_capi_events")
    .insert({ event_name: ev.nombre, event_id: ev.eventId, person_id: ev.personId ?? null, status: "skipped" })
    .select("id").single();
  if (reg.error) {
    if (reg.error.code === "23505") {
      // Si quedó 'skipped' o 'failed' antes, se reintenta; si ya salió, no.
      const { data: previo } = await db.from("meta_capi_events").select("id,status")
        .eq("event_name", ev.nombre).eq("event_id", ev.eventId).single();
      if (!previo || previo.status === "sent") return "duplicate";
      return enviar(db, previo.id, ev, pixel, token);
    }
    console.error("meta_capi_events", reg.error.message);
    return "failed";
  }
  return enviar(db, reg.data.id, ev, pixel, token);
}

async function enviar(db: SupabaseClient, regId: number, ev: EventoMeta, pixel?: string, token?: string) {
  if (!pixel || !token) {
    await db.from("meta_capi_events").update({ status: "skipped", response: { motivo: "falta META_PIXEL_ID o META_CAPI_ACCESS_TOKEN" } }).eq("id", regId);
    return "skipped" as const;
  }

  let email = "", tel = "", nombre = "", apellido = "";
  if (ev.personId) {
    const { data: p } = await db.from("people").select("email, phone, name").eq("id", ev.personId).maybeSingle();
    email = norm(p?.email);
    tel = (p?.phone ?? "").replace(/\D/g, "");
    const partes = norm(p?.name).split(/\s+/).filter(Boolean);
    nombre = partes[0] ?? ""; apellido = partes.slice(1).join(" ");
  }
  let { fbp, fbc } = ev;
  if ((!fbp || !fbc) && ev.visitorId) {
    const { data: v } = await db.from("visitors").select("fbp, fbc").eq("id", ev.visitorId).maybeSingle();
    fbp = fbp ?? v?.fbp ?? null; fbc = fbc ?? v?.fbc ?? null;
  }

  const user_data: Record<string, unknown> = { country: [await sha256("ar")] };
  if (email && !email.endsWith(".invalid")) user_data.em = [await sha256(email)];
  if (tel.length >= 8) user_data.ph = [await sha256(tel)];
  if (nombre) user_data.fn = [await sha256(nombre)];
  if (apellido) user_data.ln = [await sha256(apellido)];
  if (ev.personId) user_data.external_id = [await sha256(ev.personId)];
  if (ev.ip) user_data.client_ip_address = ev.ip;
  if (ev.userAgent) user_data.client_user_agent = ev.userAgent;
  if (fbp) user_data.fbp = fbp;
  if (fbc) user_data.fbc = fbc;

  const evento: Record<string, unknown> = {
    event_name: ev.nombre,
    event_time: Math.floor((ev.cuando ?? new Date()).getTime() / 1000),
    event_id: ev.eventId,
    action_source: "website",
    event_source_url: ev.url,
    user_data,
  };
  if (ev.valor) evento.custom_data = { value: ev.valor.monto, currency: ev.valor.moneda, ...(ev.valor.contenido ? { content_name: ev.valor.contenido } : {}) };

  const cuerpo: Record<string, unknown> = { data: [evento] };
  const test = Deno.env.get("META_TEST_EVENT_CODE");
  if (test) cuerpo.test_event_code = test;

  try {
    const r = await fetch(`https://graph.facebook.com/${VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(10_000),
    });
    const j = await r.json().catch(() => ({}));
    await db.from("meta_capi_events").update({ status: r.ok ? "sent" : "failed", http_status: r.status, response: j }).eq("id", regId);
    if (!r.ok) console.error("meta capi", ev.nombre, r.status, JSON.stringify(j).slice(0, 300));
    return r.ok ? "sent" as const : "failed" as const;
  } catch (e) {
    await db.from("meta_capi_events").update({ status: "failed", response: { error: e instanceof Error ? e.message : String(e) } }).eq("id", regId);
    return "failed" as const;
  }
}
