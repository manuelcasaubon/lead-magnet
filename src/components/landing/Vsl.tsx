import s from "./landing.module.css";

// Lugar del mini VSL. Sin NEXT_PUBLIC_VSL_URL: póster con la escena en texto (muchos lo ven sin sonido).
// Con la variable: un <video> simple. La medición completa (vsl_*) la suma S4.
export default function Vsl() {
  const url = process.env.NEXT_PUBLIC_VSL_URL;
  const poster = process.env.NEXT_PUBLIC_VSL_POSTER || undefined;
  if (url) {
    return (
      <video className={s.video} src={url} poster={poster} controls playsInline preload="metadata"
        aria-label="Video de presentación de la clase" />
    );
  }
  return (
    <div className={s.vsl}>
      <span className={s.vslTitulo} aria-hidden="true">La escena</span>
      <p className={s.escena}>
        ¿Te pasó de estar en un evento, escuchar al speaker y pensar: <em>«sabe, pero no sabe tanto como yo»</em>? ¿Por qué lo llaman a él y a mí no?
      </p>
    </div>
  );
}
