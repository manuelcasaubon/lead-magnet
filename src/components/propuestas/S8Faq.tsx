import { FAQ, IcFlecha, IcMas } from "./Comun";
import c from "./comun.module.css";
import s from "./s8.module.css";

// A · Tarjetas en crema: cada pregunta en una tarjeta blanca redondeada con un "+" en círculo rojo.
export function FaqA() {
  return (
    <section id="s8-a" className={`${c.banda} ${c.lucesC} ${s.a}`}><div className={c.ancho}>
      <h2>Preguntas</h2>
      <div className={s.aLista}>
        {FAQ.map(([q, r], i) => (
          <details key={q} open={i === 0}>
            <summary><span>{q}</span><span className={s.aMas} aria-hidden="true"><IcMas t={16} /></span></summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
    </div></section>
  );
}

// B · Numeradas en oscuro: números mostaza grandes, líneas finas y una flecha que gira al abrir.
export function FaqB() {
  return (
    <section id="s8-b" className={`${c.banda} ${c.lucesO} ${s.b}`}><div className={c.ancho}>
      <h2>Preguntas</h2>
      <div className={s.bLista}>
        {FAQ.map(([q, r], i) => (
          <details key={q} open={i === 0}>
            <summary><span className={s.bNum} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><span className={s.bQ}>{q}</span><span className={s.bFlecha} aria-hidden="true"><IcFlecha /></span></summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
    </div></section>
  );
}

// C · Conversación: la pregunta como un mensaje oscuro y la respuesta como la burbuja blanca de Manu; en escritorio, título fijo a la izquierda.
export function FaqC() {
  return (
    <section id="s8-c" className={`${c.banda} ${c.crema} ${s.c}`}><div className={`${c.ancho} ${s.cGrid}`}>
      <h2 className={s.cTitulo}>Preguntas</h2>
      <div className={s.cLista}>
        {FAQ.map(([q, r], i) => (
          <details key={q} open={i < 2}>
            <summary>{q}</summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
    </div></section>
  );
}
