import VideoBunny from "@/components/video/VideoBunny";
import { getVideo } from "@/lib/video/getVideo";
import s from "./landing.module.css";

// Mini VSL de /evento con Bunny Stream (S9). Se muestra el video "listo" con uso = 'vsl_evento'
// (se asigna en la tabla videos). Mientras no haya uno, el reproductor muestra la escena en texto:
// muchos lo ven sin sonido. Mide vsl_view/play/pause/progress/quartile/end (props.video = "vsl_evento").
// La página se regenera cada minuto (revalidate), así que el video aparece solo cuando termina de procesarse.
export default async function Vsl() {
  const video = await getVideo("vsl_evento");
  return (
    <VideoBunny
      video={video}
      uso="vsl_evento"
      titulo="Video de presentación de la clase"
      posterTexto={
        <p className={s.escena}>
          ¿Te pasó de estar en un evento, escuchar al speaker y pensar: <em>«sabe, pero no sabe tanto como yo»</em>? ¿Por qué lo llaman a él y a mí no?
        </p>
      }
    />
  );
}
