// Edge Function "bunny-upload" (para el panel): solo admins. Crea el video en la librería de Bunny y devuelve la
// firma TUS para que el navegador suba el archivo directo a Bunny (la API key nunca sale de Supabase).
//
// POST { titulo: string, uso?: string }  con  Authorization: Bearer <access_token de Supabase del admin>
// → { ok, guid, libraryId, endpoint, expire, signature }
// El navegador sube con tus-js-client a `endpoint`, con los headers:
//   AuthorizationSignature = signature, AuthorizationExpire = expire, VideoId = guid, LibraryId = libraryId
//   y metadata { filetype, title }.
// Firma: SHA256(library_id + api_key + expiration + video_id) (doc oficial de Bunny Stream, TUS).
import { db, json, leerConfig, crearVideo, secreto, hex, FaltaSecreto } from "../_shared/bunny.ts";

const ENDPOINT = "https://video.bunnycdn.com/tusupload";
const TTL_SEG = 24 * 3600;

async function origenPermitido(origin: string | null): Promise<string | null> {
  if (!origin) return null;
  const { data } = await db.from("settings").select("site_url").eq("id", 1).single();
  const ok = [data?.site_url, "http://localhost:3000"].filter(Boolean).map((u) => String(u).replace(/\/$/, ""));
  return ok.includes(origin) ? origin : null;
}

Deno.serve(async (req) => {
  const origen = await origenPermitido(req.headers.get("origin"));
  const cors: Record<string, string> = origen
    ? { "Access-Control-Allow-Origin": origen, "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" }
    : {};
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ ok: false }, 405, cors);

  // 1) Quién es: JWT de Supabase → usuario → tiene que estar en admins.
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ ok: false, error: "sin sesión" }, 401, cors);
  const { data: u, error: eu } = await db.auth.getUser(jwt);
  if (eu || !u?.user) return json({ ok: false, error: "sesión inválida" }, 401, cors);
  const { data: admin } = await db.from("admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
  if (!admin) return json({ ok: false, error: "no sos admin" }, 403, cors);

  // 2) Datos.
  let body: { titulo?: unknown; uso?: unknown };
  try { body = await req.json(); } catch { return json({ ok: false, error: "json" }, 400, cors); }
  const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
  const uso = typeof body.uso === "string" && body.uso ? body.uso : null;
  if (titulo.length < 1 || titulo.length > 200) return json({ ok: false, error: "titulo: 1 a 200 caracteres" }, 400, cors);
  if (uso !== null && !/^[a-z][a-z0-9_]{1,40}$/.test(uso)) return json({ ok: false, error: "uso inválido" }, 400, cors);

  try {
    const cfg = await leerConfig();
    const apiKey = secreto("BUNNY_STREAM_API_KEY");
    const guid = await crearVideo(cfg, titulo);
    const { error } = await db.from("videos").upsert(
      { guid, library_id: cfg.libraryId, titulo, estado: "creado", ...(uso ? { uso } : {}) }, { onConflict: "guid" });
    if (error) throw new Error(`db: ${error.message}`);

    const expire = Math.floor(Date.now() / 1000) + TTL_SEG;
    const data = new TextEncoder().encode(`${cfg.libraryId}${apiKey}${expire}${guid}`);
    const signature = hex(await crypto.subtle.digest("SHA-256", data));
    return json({ ok: true, guid, libraryId: cfg.libraryId, endpoint: ENDPOINT, expire, signature }, 200, cors);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("bunny-upload:", msg);
    return json({ ok: false, error: e instanceof FaltaSecreto ? msg : "no se pudo crear el video" }, e instanceof FaltaSecreto ? 500 : 502, cors);
  }
});
