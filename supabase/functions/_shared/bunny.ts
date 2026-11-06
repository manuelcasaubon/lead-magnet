// Utilidades compartidas de las Edge Functions bunny-* (S9).
// Secretos (solo en Supabase → Edge Functions → Secrets):
//   BUNNY_API_KEY            clave de la cuenta de Bunny (para averiguar el hostname del CDN)
//   BUNNY_STREAM_API_KEY     API key de la librería de Stream (listar, crear y leer videos)
//   BUNNY_STREAM_READONLY_KEY  API key de solo lectura de la librería (firma el webhook, HMAC-SHA256)
// Lo que no es secreto (library id, hostname del CDN) vive en public.settings.
import { createClient } from "npm:@supabase/supabase-js@2";

export const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const json = (b: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", ...extra } });

export class FaltaSecreto extends Error {
  constructor(public nombre: string) {
    super(`Falta el secreto ${nombre}. Cargalo en Supabase → Edge Functions → Secrets.`);
  }
}
export function secreto(nombre: string): string {
  const v = Deno.env.get(nombre);
  if (!v) throw new FaltaSecreto(nombre);
  return v;
}

const STREAM = "https://video.bunnycdn.com";
const API = "https://api.bunny.net";

export type Config = { libraryId: number; cdnHostname: string | null };

export async function leerConfig(): Promise<Config> {
  const { data, error } = await db.from("settings").select("bunny_library_id, bunny_cdn_hostname").eq("id", 1).single();
  if (error || !data?.bunny_library_id) throw new Error("settings.bunny_library_id no está cargado");
  return { libraryId: Number(data.bunny_library_id), cdnHostname: data.bunny_cdn_hostname };
}

async function bunnyFetch(url: string, key: string, init: RequestInit = {}) {
  const r = await fetch(url, {
    ...init,
    headers: { AccessKey: key, Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}) },
    signal: AbortSignal.timeout(20_000),
  });
  const texto = await r.text();
  let data: unknown = null;
  try { data = texto ? JSON.parse(texto) : null; } catch { /* respuesta no JSON */ }
  if (!r.ok) throw new Error(`Bunny ${r.status} en ${new URL(url).pathname}: ${texto.slice(0, 200)}`);
  return data;
}

// Hostname del CDN de la librería (vz-xxxx.b-cdn.net): biblioteca → pull zone → hostname del sistema.
export async function resolverHostname(cfg: Config): Promise<string> {
  if (cfg.cdnHostname) return cfg.cdnHostname;
  const cuenta = secreto("BUNNY_API_KEY");
  const lib = (await bunnyFetch(`${API}/videolibrary/${cfg.libraryId}`, cuenta)) as { PullZoneId?: number };
  if (!lib?.PullZoneId) throw new Error("La librería no devolvió PullZoneId");
  const pz = (await bunnyFetch(`${API}/pullzone/${lib.PullZoneId}`, cuenta)) as {
    Hostnames?: { Value: string; IsSystemHostname?: boolean }[];
  };
  const hosts = pz?.Hostnames ?? [];
  const h = hosts.find((x) => x.IsSystemHostname) ?? hosts.find((x) => x.Value.endsWith(".b-cdn.net"));
  if (!h) throw new Error("No encontré el hostname del CDN en la pull zone de la librería");
  await db.from("settings").update({ bunny_cdn_hostname: h.Value }).eq("id", 1);
  cfg.cdnHostname = h.Value;
  return h.Value;
}

export type VideoBunny = {
  guid: string; title?: string; length?: number; status?: number; thumbnailFileName?: string;
  availableResolutions?: string | null; captions?: { srclang: string; label?: string }[];
  dateUploaded?: string;
};

export async function listarVideos(cfg: Config): Promise<VideoBunny[]> {
  const key = secreto("BUNNY_STREAM_API_KEY");
  const todos: VideoBunny[] = [];
  for (let page = 1; page <= 50; page++) {
    const d = (await bunnyFetch(`${STREAM}/library/${cfg.libraryId}/videos?page=${page}&itemsPerPage=100&orderBy=date`, key)) as
      { items?: VideoBunny[]; totalItems?: number };
    const items = d?.items ?? [];
    todos.push(...items);
    if (items.length === 0 || todos.length >= (d?.totalItems ?? 0)) break;
  }
  return todos;
}

export async function leerVideo(cfg: Config, guid: string): Promise<VideoBunny | null> {
  const key = secreto("BUNNY_STREAM_API_KEY");
  try {
    return (await bunnyFetch(`${STREAM}/library/${cfg.libraryId}/videos/${guid}`, key)) as VideoBunny;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Bunny 404")) return null;
    throw e;
  }
}

export async function crearVideo(cfg: Config, titulo: string): Promise<string> {
  const key = secreto("BUNNY_STREAM_API_KEY");
  const v = (await bunnyFetch(`${STREAM}/library/${cfg.libraryId}/videos`, key, {
    method: "POST", body: JSON.stringify({ title: titulo }),
  })) as VideoBunny;
  if (!v?.guid) throw new Error("Bunny no devolvió el guid del video");
  return v.guid;
}

// Códigos de la Stream API (video.status) → nuestro estado.
const ESTADOS: Record<number, string> = {
  0: "creado", 1: "subido", 2: "procesando", 3: "codificando", 4: "listo", 5: "error", 6: "error", 7: "codificando", 8: "listo",
};

export function aFila(cfg: Config, host: string, v: VideoBunny) {
  const base = `https://${host}/${v.guid}`;
  const estado = ESTADOS[v.status ?? 0] ?? "procesando";
  const resoluciones = (v.availableResolutions ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    guid: v.guid,
    library_id: cfg.libraryId,
    titulo: v.title ?? "",
    estado,
    bunny_status: v.status ?? null,
    duracion_seg: v.length ? Math.round(v.length) : null,
    thumbnail_url: `${base}/${v.thumbnailFileName || "thumbnail.jpg"}`,
    hls_url: `${base}/playlist.m3u8`,
    subtitulos: (v.captions ?? []).map((c) => ({ lang: c.srclang, label: c.label || c.srclang, url: `${base}/captions/${c.srclang}.vtt` })),
    resoluciones,
    subido_at: v.dateUploaded ?? null,
    sincronizado_at: new Date().toISOString(),
  };
}
// Nota: la fila NO incluye "uso": el upsert no pisa el uso que se asignó a mano.

export async function guardarVideos(cfg: Config, host: string, videos: VideoBunny[]) {
  if (videos.length === 0) return;
  const { error } = await db.from("videos").upsert(videos.map((v) => aFila(cfg, host, v)), { onConflict: "guid" });
  if (error) throw new Error(`db: ${error.message}`);
}

// Comparación en tiempo constante de dos strings.
export function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
