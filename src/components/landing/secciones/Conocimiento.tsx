import Image from "next/image";
import { FOTOS } from "../contenido";
import s from "../landing.module.css";
import c from "./conocimiento.module.css";

// S2 · "Tenés mucho conocimiento…", variante B: la foto de tent de borde a borde que se funde con el fondo oscuro
// y la frase montada encima. Botón a #reservar (no sale si está agotado).
export default function Conocimiento({ agotado }: { agotado: boolean }) {
  const foto = FOTOS.charla;
  return (
    <section className={`${s.banda} ${c.seccion} ${foto ? c.conFoto : ""}`}>
      {foto && (
        <figure className={c.foto}>
          <Image src={foto.src} alt={foto.alt} width={foto.ancho} height={foto.alto} sizes="100vw" />
        </figure>
      )}
      <div>
        <p className={c.frase}>Tenés mucho conocimiento y experiencia, <em>pero pocas personas saben lo que sabés.</em></p>
        <p className={c.texto}>Lo que te falta es comunicar tu marca de manera genuina y auténtica para convertirte en el comunicador de tu sector: con claridad y un plan de comunicación, sabiendo qué tipo de contenido, formato y mejorando tu forma de comunicar <span className={s.mostaza}>(oratoria y storytelling)</span>.</p>
        {!agotado && (
          <div className={c.cta}>
            <a className={s.boton} href="#reservar" data-track="medio_reservar">Reservar mi lugar</a>
          </div>
        )}
      </div>
    </section>
  );
}
