/* eslint-disable @next/next/no-img-element */
import { FormMaqueta, Paso, PRECIO } from "./Comun";
import c from "./comun.module.css";
import s from "./s9.module.css";

const BAJADA = "Solo 30 lugares, miércoles de 18 a 21 h, en Palermo Soho.";
const AVISO = `Niceto Vega 4601, CABA. Pagás ${PRECIO} por Mercado Pago.`;

// A · Cálido en dos columnas: oscuro con luces, el texto a la izquierda y el formulario en una tarjeta crema a la derecha.
export function CierreA() {
  return (
    <section id="s9-a" className={`${c.banda} ${c.lucesO} ${s.a}`}><div className={`${c.ancho} ${s.aGrid}`}>
      <div className={s.aTexto}>
        <h2>Nos vemos el <span className={c.mostaza}>18/11</span></h2>
        <p className={s.bajada}>{BAJADA}</p>
        <Paso n={2} className={s.izq}>Reservá tu lugar</Paso>
        <p className={s.aviso}>{AVISO}</p>
      </div>
      <FormMaqueta tono="crema" />
    </div></section>
  );
}

// B · Bloque rojo: el cierre entero en rojo de marca, el título en crema y el formulario en una tarjeta oscura.
export function CierreB() {
  return (
    <section id="s9-b" className={`${c.banda} ${s.b}`}><div className={`${c.ancho} ${s.bInner}`}>
      <h2>Nos vemos el 18/11</h2>
      <p className={s.bBajada}>{BAJADA}</p>
      <Paso n={2} className={s.bPaso}>Reservá tu lugar</Paso>
      <p className={s.bAviso}>{AVISO}</p>
      <FormMaqueta tono="oscuro" className={s.bForm} />
    </div></section>
  );
}

// C · Entrada troquelada: sobre la foto de la clase, una entrada crema con el título y los datos, y el formulario debajo.
export function CierreC() {
  return (
    <section id="s9-c" className={`${c.banda} ${c.oscuro} ${s.c}`}>
      <img className={s.cFondo} src="/fotos/manu-clase.jpg" alt="" />
      <div className={`${c.ancho} ${s.cInner}`}>
        <div className={s.cEntrada}>
          <h2>Nos vemos el <span className={c.rojo}>18/11</span></h2>
          <p className={s.cBajada}>{BAJADA}</p>
          <div className={s.cCorte} aria-hidden="true" />
          <Paso n={2} className={s.izq}>Reservá tu lugar</Paso>
          <p className={s.cAviso}>{AVISO}</p>
        </div>
        <FormMaqueta tono="blanco" className={s.cForm} />
      </div>
    </section>
  );
}
