"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { VideoPublico } from "@/lib/video/getVideo";
import { track } from "@/lib/track/cliente";
import s from "./VideoBunny.module.css";

type Props = {
  /** Resultado de getVideo(uso) (servidor). null = todavía no hay video listo. */
  video: VideoPublico | null;
  /** Etiqueta que viaja en props.video de cada evento (p. ej. "vsl_evento"). Si falta, se usa el guid. */
  uso?: string;
  /** Qué se muestra cuando no hay video (la escena en texto del guion). */
  posterTexto?: ReactNode;
  /** Descripción accesible del video. */
  titulo?: string;
};

const LATIDO_MS = 5000;

export default function VideoBunny({ video, uso, posterTexto, titulo }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const preparado = useRef(false);
  const cuartiles = useRef(new Set<number>());
  const ultimoT = useRef(0);
  const [iniciado, setIniciado] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [error, setError] = useState("");

  const etiqueta = uso ?? video?.guid ?? "";
  const evento = useCallback(
    (n: Parameters<typeof track>[0], extra: Record<string, number> = {}) => track(n, { video: etiqueta, ...extra }),
    [etiqueta],
  );
  const sec = () => Math.floor(el.current?.currentTime ?? 0);

  // vsl_view: una vez, cuando el reproductor se ve (50 %).
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || !video || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { evento("vsl_view"); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(nodo);
    return () => io.disconnect();
  }, [video, evento]);

  // Latido cada 5 s, solo mientras reproduce.
  useEffect(() => {
    if (!reproduciendo) return;
    const id = setInterval(() => evento("vsl_progress", { sec: sec() }), LATIDO_MS);
    return () => clearInterval(id);
  }, [reproduciendo, evento]);

  useEffect(() => () => { hlsRef.current?.destroy(); hlsRef.current = null; }, []);

  async function preparar(v: HTMLVideoElement, url: string) {
    if (preparado.current) return;
    preparado.current = true;
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; return; } // Safari / iOS
    const { default: Hls } = await import("hls.js"); // solo donde hace falta
    if (!Hls.isSupported()) throw new Error("sin soporte");
    const hls = new Hls({ enableWorker: true });
    hlsRef.current = hls;
    hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) setError("No pudimos cargar el video. Probá de nuevo en un rato."); });
    hls.loadSource(url);
    hls.attachMedia(v);
  }

  async function arrancar() {
    const v = el.current;
    if (!v || !video) return;
    setError("");
    setIniciado(true);
    try {
      await preparar(v, video.hlsUrl);
      await v.play();
    } catch (e) {
      // play() rechazado por el navegador (no por falta de soporte) no es un error del video.
      if (e instanceof Error && e.message === "sin soporte") setError("Tu navegador no puede reproducir este video.");
    }
  }

  function alAvanzar() {
    const v = el.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    const t = v.currentTime;
    // Cuartiles solo por reproducción natural: si saltó (seek), no se cuentan los que se salteó.
    if (t - ultimoT.current >= 0 && t - ultimoT.current < 2) {
      const pct = (t / v.duration) * 100;
      for (const q of [25, 50, 75]) {
        if (pct >= q && !cuartiles.current.has(q)) { cuartiles.current.add(q); evento("vsl_quartile", { q }); }
      }
    }
    ultimoT.current = t;
  }

  if (!video) {
    return (
      <div className={s.caja} ref={caja}>
        <div className={s.vacio} role="img" aria-label={titulo ?? "Video en camino"}>
          <div className={s.posterTexto}>{posterTexto ?? <p>El video está en camino.</p>}</div>
          <span className={s.etiqueta}>Video en camino</span>
        </div>
      </div>
    );
  }

  return (
    <div className={s.caja} ref={caja}>
      <video
        ref={el}
        className={s.video}
        poster={video.posterUrl ?? undefined}
        playsInline
        preload="none"
        controls={iniciado}
        crossOrigin="anonymous"
        aria-label={titulo ?? video.titulo}
        onPlay={() => { setReproduciendo(true); evento("vsl_play", { sec: sec() }); }}
        onPause={() => {
          setReproduciendo(false);
          const v = el.current;
          if (v && !v.ended) evento("vsl_pause", { sec: sec() });
        }}
        onTimeUpdate={alAvanzar}
        onSeeked={() => { ultimoT.current = el.current?.currentTime ?? 0; }}
        onEnded={() => {
          setReproduciendo(false);
          if (!cuartiles.current.has(100)) { cuartiles.current.add(100); evento("vsl_quartile", { q: 100 }); }
          evento("vsl_end");
        }}
        onError={() => { if (iniciado) setError("No pudimos cargar el video. Probá de nuevo en un rato."); }}
      >
        {video.subtitulos.map((t, i) => (
          <track key={t.lang} kind="subtitles" src={t.url} srcLang={t.lang} label={t.label} default={i === 0} />
        ))}
      </video>
      {!iniciado && (
        <button type="button" className={s.play} onClick={arrancar} aria-label={`Reproducir: ${titulo ?? video.titulo}`}>
          <span className={s.triangulo} aria-hidden="true" />
          <span className={s.textoPlay}>Ver la clase</span>
        </button>
      )}
      <p className={s.error} role="status" aria-live="polite">{error}</p>
    </div>
  );
}
