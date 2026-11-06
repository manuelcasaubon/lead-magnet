import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Datos públicos de un video (sin nada secreto). Lo arma el servidor y se lo pasa a <VideoBunny />.
export type VideoPublico = {
  guid: string;
  titulo: string;
  uso: string | null;
  hlsUrl: string;
  posterUrl: string | null;
  duracionSeg: number | null;
  subtitulos: { lang: string; label: string; url: string }[];
};

type Subtitulo = { lang?: unknown; label?: unknown; url?: unknown };

// Devuelve el video LISTO asignado a ese uso (p. ej. "vsl_evento"), o null si no hay.
// Con null, <VideoBunny /> muestra el póster de texto y no rompe la página.
export async function getVideo(uso: string): Promise<VideoPublico | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("videos")
      .select("guid, titulo, uso, hls_url, thumbnail_url, duracion_seg, subtitulos")
      .eq("uso", uso)
      .eq("estado", "listo")
      .not("hls_url", "is", null)
      .order("subido_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (!data?.hls_url) return null;
    const subs = Array.isArray(data.subtitulos) ? (data.subtitulos as Subtitulo[]) : [];
    return {
      guid: data.guid,
      titulo: data.titulo,
      uso: data.uso,
      hlsUrl: data.hls_url,
      posterUrl: data.thumbnail_url,
      duracionSeg: data.duracion_seg,
      subtitulos: subs.flatMap((s) =>
        typeof s.lang === "string" && typeof s.url === "string"
          ? [{ lang: s.lang, label: typeof s.label === "string" ? s.label : s.lang, url: s.url }]
          : []),
    };
  } catch {
    return null;
  }
}
