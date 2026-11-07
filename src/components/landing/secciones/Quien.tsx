import Image from "next/image";
import { FOTOS } from "../contenido";
import s from "../landing.module.css";
import q from "./quien.module.css";

// S7 · "¿Por qué yo?" (antes "Quién la da"), variante A: retrato a sangre con el título encima y las cifras en mostaza.
// En escritorio, texto a la izquierda y foto a la derecha.
export default function Quien() {
  const foto = FOTOS.quien;
  return (
    <section className={`${s.banda} ${q.seccion} ${foto ? q.conFoto : ""}`}>
      {foto && (
        <figure className={q.foto}>
          <Image src={foto.src} alt={foto.alt} width={foto.ancho} height={foto.alto} sizes="(max-width: 820px) 100vw, 50vw" />
        </figure>
      )}
      <div className={q.texto}>
        <h2>¿Por qué yo?</h2>
        <div className={q.bio}>
          <p>Soy Manu Casaubon. Acompaño a personas cracks en lo que hacen a aprender a comunicarlo al mundo, logrando alcanzar nuevas oportunidades (ventas, charlas, medios, etc.).</p>
          <p>Con más de <b>89.000</b> seguidores en Instagram, <b>200.000</b> en TikTok y <b>130.000</b> en YouTube, soy speaker, conferencista y capacitador en universidades, empresas y eventos.</p>
        </div>
      </div>
    </section>
  );
}
