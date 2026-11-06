// Edge Function "meta-capi": la llama el servidor de Vercel (/api/lead) para mandar el Lead a la Conversions API.
// verify_jwt=false: la autorización la hace la función. Solo pasa quien manda la clave de servidor de Supabase
// (la de Vercel, en formato legacy eyJ… o sb_secret_…): se comprueba usándola contra una función que solo
// service_role puede ejecutar. Nunca se decodifica un JWT sin verificar.
// POST { nombre: "Lead", event_id, person_id, url, ip?, user_agent?, fbp?, fbc?, visitor_id? }
import { createClient } from "npm:@supabase/supabase-js@2";
import { enviarEventoMeta } from "../_shared/meta.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function esServidor(req: Request): Promise<boolean> {
  const clave = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (clave.length < 20) return false;
  if (clave === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;
  const c = createClient(Deno.env.get("SUPABASE_URL")!, clave, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.rpc("seats_status"); // revocada para anon y authenticated
  return !error;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  if (!(await esServidor(req))) return json({ ok: false }, 403);
  const b = await req.json().catch(() => ({})) as Record<string, string | undefined>;
  if (b.nombre !== "Lead" || !b.event_id || !b.person_id || !UUID.test(b.person_id) || !b.url) return json({ ok: false, error: "invalid" }, 400);
  const r = await enviarEventoMeta(db, {
    nombre: "Lead", eventId: String(b.event_id).slice(0, 100), personId: b.person_id, url: String(b.url).slice(0, 500),
    ip: b.ip ?? null, userAgent: b.user_agent ?? null, fbp: b.fbp ?? null, fbc: b.fbc ?? null,
    visitorId: b.visitor_id && UUID.test(b.visitor_id) ? b.visitor_id : null,
  });
  return json({ ok: true, resultado: r });
});
