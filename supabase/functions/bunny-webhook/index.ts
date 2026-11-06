// Edge Function "bunny-webhook": recibe los avisos de Bunny Stream (cambios de estado del encoding).
//
// URL para configurar en Bunny → Stream → tu librería → Webhooks (campo "Webhook URL"):
//   https://qzfzswascgitycynwlkk.supabase.co/functions/v1/bunny-webhook
// Desplegar con verify_jwt=false (Bunny no manda JWT de Supabase).
//
// Firma (doc oficial de Bunny Stream): cada POST trae X-BunnyStream-Signature-Version: v1,
// X-BunnyStream-Signature-Algorithm: hmac-sha256 y X-BunnyStream-Signature = HMAC-SHA256 en hex del cuerpo
// crudo, con la API key de SOLO LECTURA de la librería como clave. Se valida con el secreto de Supabase
// BUNNY_STREAM_READONLY_KEY (esa misma key, copiada desde Bunny), si está cargado. Sin firma válida → 401.
//
// Idempotente: el EventId es el mismo en los reintentos. El estado nunca se toma del aviso: con el VideoGuid se
// vuelve a leer el video en la Stream API y se hace upsert, así que un aviso repetido o fuera de orden deja
// siempre el estado actual. El EventId se registra recién cuando terminó bien, para que un fallo se reintente.
import { db, json, leerConfig, leerVideo, guardarVideos, resolverHostname, secreto, FaltaSecreto, iguales, hex } from "../_shared/bunny.ts";

const BORRADO = 32;

// Si no está BUNNY_STREAM_READONLY_KEY (decisión de Manu, 6/11: no hace falta), el aviso se acepta sin verificar
// la firma: el estado nunca se toma del aviso, se vuelve a leer de la Stream API con BUNNY_STREAM_API_KEY, así que un
// aviso falso solo provoca una lectura de más. Si algún día se carga la clave, la firma pasa a ser obligatoria.
async function firmaValida(cuerpo: Uint8Array, h: Headers): Promise<boolean> {
  if (!Deno.env.get("BUNNY_STREAM_READONLY_KEY")) return true;
  const firma = (h.get("x-bunnystream-signature") ?? "").trim().toLowerCase();
  if (h.get("x-bunnystream-signature-version") !== "v1" || h.get("x-bunnystream-signature-algorithm") !== "hmac-sha256") return false;
  if (firma.length !== 64) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto("BUNNY_STREAM_READONLY_KEY")),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return iguales(hex(await crypto.subtle.sign("HMAC", key, cuerpo)), firma);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const cuerpo = new Uint8Array(await req.arrayBuffer());
  try {
    if (!(await firmaValida(cuerpo, req.headers))) return json({ ok: false }, 401);

    let p: { VideoLibraryId?: number; VideoGuid?: string; Status?: number; EventId?: string; IsLiveStreamWebhook?: boolean };
    try { p = JSON.parse(new TextDecoder().decode(cuerpo)); } catch { return json({ ok: false, error: "json" }, 400); }
    if (p.IsLiveStreamWebhook || !p.VideoGuid) return json({ ok: true, ignorado: true });

    const cfg = await leerConfig();
    if (p.VideoLibraryId && Number(p.VideoLibraryId) !== cfg.libraryId) return json({ ok: true, ignorado: "otra librería" });

    const eventId = p.EventId ?? `${p.VideoGuid}:${p.Status}`;
    const { data: ya } = await db.from("bunny_webhook_events").select("event_id").eq("event_id", eventId).maybeSingle();
    if (ya) return json({ ok: true, repetido: true });

    if (p.Status === BORRADO) {
      await db.from("videos").update({ estado: "borrado" }).eq("guid", p.VideoGuid);
    } else {
      const host = await resolverHostname(cfg);
      const v = await leerVideo(cfg, p.VideoGuid);
      if (!v) await db.from("videos").update({ estado: "borrado" }).eq("guid", p.VideoGuid);
      else await guardarVideos(cfg, host, [v]);
    }
    await db.from("bunny_webhook_events")
      .upsert({ event_id: eventId, video_guid: p.VideoGuid, status: p.Status ?? null }, { onConflict: "event_id", ignoreDuplicates: true });
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("bunny-webhook:", msg);
    // 5xx: Bunny reintenta (30 s, 2 min, 10 min, 30 min, 1 h, 2 h).
    return json({ ok: false, error: e instanceof FaltaSecreto ? msg : "error interno" }, 500);
  }
});
