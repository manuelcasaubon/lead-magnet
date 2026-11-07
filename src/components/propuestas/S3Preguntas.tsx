import { PREGUNTAS_HOY } from "./Comun";
import c from "./comun.module.css";
import s from "./s3.module.css";

// Palabra clave de cada pregunta (va en rojo en la propuesta C).
const CLAVES = ["marca", "contenido", "estrategia", "2027"];
function conClave(q: string, clave: string, clase: string) {
  const i = q.lastIndexOf(clave);
  return <>{q.slice(0, i)}<span className={clase}>{clave}</span>{q.slice(i + clave.length)}</>;
}

// A · Globos de diálogo: las preguntas como lo que te decís a vos mismo, alternadas, y el remate escrito a mano.
export function PreguntasA() {
  return (
    <section id="s3-a" className={`${c.banda} ${c.lucesO} ${s.a}`}><div className={c.ancho}>
      <h2>Si hoy te preguntás esto</h2>
      <ul className={s.aGlobos}>
        {PREGUNTAS_HOY.map((q) => <li key={q}>{q}</li>)}
      </ul>
      <div className={s.aRemate}>
        <svg className={s.aFlecha} viewBox="0 0 60 60" aria-hidden="true"><path d="M10 6c4 22 16 36 38 40M48 46l-12 1M48 46l-4-11" stroke="var(--rojo)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <p>Esta clase es para vos. Eso es lo que vamos a trabajar.</p>
      </div>
    </div></section>
  );
}

// B · Lista numerada a mano: crema, cada pregunta con su número en círculo rojo (como los pasos) y el remate en una franja oscura.
export function PreguntasB() {
  return (
    <section id="s3-b" className={`${c.banda} ${c.lucesC} ${s.b}`}><div className={c.ancho}>
      <h2>Si hoy te preguntás esto</h2>
      <ol className={s.bLista}>
        {PREGUNTAS_HOY.map((q, i) => <li key={q}><span className={s.bNum} aria-hidden="true">{i + 1}</span>{q}</li>)}
      </ol>
      <p className={s.bRemate}>Esta clase es <span className={c.rojo}>para vos</span>. Eso es lo que vamos a trabajar.</p>
    </div></section>
  );
}

// C · Tipográfica: un signo de pregunta gigante de fondo, las preguntas enormes con la palabra clave en rojo y el remate en un bloque rojo.
export function PreguntasC() {
  return (
    <section id="s3-c" className={`${c.banda} ${c.oscuro} ${s.c}`}>
      <span className={s.cSigno} aria-hidden="true">?</span>
      <div className={c.ancho}>
        <h2 className={s.cTitulo}>Si hoy te preguntás esto</h2>
        <ul className={s.cLista}>
          {PREGUNTAS_HOY.map((q, i) => <li key={q}>{conClave(q, CLAVES[i], c.rojo)}</li>)}
        </ul>
      </div>
      <p className={s.cRemate}>Esta clase es para vos. Eso es lo que vamos a trabajar.</p>
    </section>
  );
}
