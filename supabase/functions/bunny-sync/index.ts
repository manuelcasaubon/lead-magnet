// Edge Function "bunny-sync": lista los videos de la librería de Bunny Stream y los guarda en public.videos.
// La llama pg_cron cada 30 minutos con x-cron-secret (Vault), igual que clarity-sync. Desplegar con verify_jwt=false.
// También se puede disparar a mano con ese mismo header. No toca el "uso" que se asignó a cada video.
import { db, json, leerConfig, listarVideos, guardarVideos, resolverHostname, FaltaSecreto } from "../_shared/bunny.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const { data: ok } = await db.rpc("check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return json({ ok: false }, 401);

  try {
    const cfg = await leerConfig();
    const host = await resolverHostname(cfg);
    const videos = await listarVideos(cfg);
    await guardarVideos(cfg, host, videos);

    // Los que ya no están en la librería se marcan como borrados (solo si el listado vino completo).
    const vigentes = new Set(videos.map((v) => v.guid));
    const { data: locales } = await db.from("videos").select("guid").eq("library_id", cfg.libraryId).neq("estado", "borrado");
    const sobran = (locales ?? []).map((r) => r.guid).filter((g) => !vigentes.has(g));
    if (sobran.length > 0) await db.from("videos").update({ estado: "borrado" }).in("guid", sobran);

    return json({ ok: true, videos: videos.length, borrados: sobran.length, cdn: host });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("bunny-sync:", msg);
    return json({ ok: false, error: msg }, e instanceof FaltaSecreto ? 500 : 502);
  }
});
