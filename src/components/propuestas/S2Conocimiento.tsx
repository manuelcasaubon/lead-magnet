/* eslint-disable @next/next/no-img-element */
import c from "./comun.module.css";
import s from "./s2.module.css";

const FOTO = { src: "/fotos/manu-tent.jpg", alt: "Manu Casaubon como host en el escenario de tent. Creator Summit, frente al público" };

// A · Polaroid: crema con luces, frase grande, la foto como una polaroid inclinada con cinta.
export function ConocimientoA() {
  return (
    <section id="s2-a" className={`${c.banda} ${c.lucesC} ${s.a}`}><div className={c.ancho}>
      <p className={s.frase}>Tenés mucho conocimiento y experiencia, <em>pero pocas personas saben lo que sabés.</em></p>
      <p className={s.aTexto}>Lo que te falta es comunicar tu marca de manera genuina y auténtica: con claridad y un plan de comunicación, sabiendo qué tipo de contenido, formato y mejorando tu forma de comunicar (oratoria y storytelling).</p>
      <figure className={s.aPolaroid}><span className={s.cinta} aria-hidden="true" /><img src={FOTO.src} alt={FOTO.alt} /></figure>
      <div className={s.cta}><a className={c.boton} href="#">Reservar mi lugar</a></div>
    </div></section>
  );
}

// B · Foto a sangre: oscuro, la foto arriba de borde a borde que se funde con el fondo y la frase montada encima.
export function ConocimientoB() {
  return (
    <section id="s2-b" className={`${c.banda} ${c.oscuro} ${s.b}`}>
      <figure className={s.bFoto}><img src={FOTO.src} alt={FOTO.alt} /></figure>
      <div className={c.ancho}>
        <p className={`${s.frase} ${s.bFrase}`}>Tenés mucho conocimiento y experiencia, <em>pero pocas personas saben lo que sabés.</em></p>
        <p className={s.bTexto}>Lo que te falta es comunicar tu marca de manera genuina y auténtica: con claridad y un plan de comunicación, sabiendo qué tipo de contenido, formato y mejorando tu forma de comunicar <span className={c.mostaza}>(oratoria y storytelling)</span>.</p>
        <div className={s.bCta}><a className={c.boton} href="#">Reservar mi lugar</a></div>
      </div>
    </section>
  );
}

// C · Cita con barra roja: la frase con una barra roja al costado, el texto en EB Garamond y la foto sobre un bloque mostaza desplazado.
export function ConocimientoC() {
  return (
    <section id="s2-c" className={`${c.banda} ${c.crema} ${s.c}`}><div className={`${c.ancho} ${s.cGrid}`}>
      <div className={s.cTextos}>
        <p className={`${s.frase} ${s.cFrase}`}>Tenés mucho conocimiento y experiencia, <em>pero pocas personas saben lo que sabés.</em></p>
        <p className={s.cTexto}>Lo que te falta es <b>comunicar tu marca de manera genuina y auténtica</b>: con claridad y un plan de comunicación, sabiendo qué tipo de contenido, formato y mejorando tu forma de comunicar (oratoria y storytelling).</p>
      </div>
      <figure className={s.cFoto}><img src={FOTO.src} alt={FOTO.alt} /></figure>
      <a className={`${c.boton} ${s.cBoton}`} href="#">Reservar mi lugar</a>
    </div></section>
  );
}
