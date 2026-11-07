import { IcFlecha, IcMas, IcRegalo, PROGRAMA } from "./Comun";
import c from "./comun.module.css";
import s from "./s5.module.css";

// Minutos de cada bloque (para la barra de la C): de la hora de cada uno a la del siguiente; el último, hasta las 21.
const aMin = (h: string) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const DUR = PROGRAMA.map(([h], i) => (i < PROGRAMA.length - 1 ? aMin(PROGRAMA[i + 1][0]) : 21 * 60) - aMin(h));

// A · Línea de tiempo: puntos rojos sobre una línea, la hora escrita a mano y el bloque abierto con "Te llevás" en crema.
export function ProgramaA() {
  return (
    <section id="s5-a" className={`${c.banda} ${c.lucesO} ${s.a}`}><div className={c.ancho}>
      <h2>Qué pasa en las 3 horas</h2>
      <div className={s.aLinea}>
        {PROGRAMA.map(([hora, nivel, titulo, texto, lleva], i) => (
          <details key={hora} className={`${s.aItem} ${lleva ? "" : s.aPausa}`} open={i === 0}>
            <summary>
              <span className={s.aPunto} aria-hidden="true" />
              <span className={s.aHora}>{hora}</span>
              <span className={s.aTit}><span className={s.nivel}>{nivel}</span><h3>{titulo}</h3></span>
              <span className={s.aMas} aria-hidden="true"><IcMas /></span>
            </summary>
            <div className={s.aCuerpo}>
              <p>{texto}</p>
              {lleva && <p className={s.aLleva}><b>Te llevás:</b> {lleva}</p>}
            </div>
          </details>
        ))}
      </div>
    </div></section>
  );
}

// B · Tarjetas en crema: cada bloque es una tarjeta blanca con la hora en una pastilla oscura; "Te llevás" en un recuadro mostaza.
export function ProgramaB() {
  return (
    <section id="s5-b" className={`${c.banda} ${c.lucesC} ${s.b}`}><div className={c.ancho}>
      <h2>Qué pasa en las <span className={c.rojo}>3 horas</span></h2>
      <div className={s.bLista}>
        {PROGRAMA.map(([hora, nivel, titulo, texto, lleva], i) => (
          <details key={hora} className={`${s.bCard} ${lleva ? "" : s.bPausa}`} open={i === 0}>
            <summary>
              <span className={s.bHora}>{hora}</span>
              <span className={s.bTit}><span className={s.nivel}>{nivel}</span><h3>{titulo}</h3></span>
              <span className={s.bFlecha} aria-hidden="true"><IcFlecha /></span>
            </summary>
            <div className={s.bCuerpo}>
              <p>{texto}</p>
              {lleva && <p className={s.bLleva}><span aria-hidden="true"><IcRegalo /></span><span><b>Te llevás:</b> {lleva}</span></p>}
            </div>
          </details>
        ))}
      </div>
    </div></section>
  );
}

// C · Barra de las 3 horas: una barra proporcional al tiempo de cada bloque arriba y filas numeradas que se despliegan.
export function ProgramaC() {
  return (
    <section id="s5-c" className={`${c.banda} ${c.oscuro} ${s.c}`}><div className={c.ancho}>
      <h2>Qué pasa en las 3 horas</h2>
      <div className={s.cBarra} aria-hidden="true">
        {PROGRAMA.map(([hora, , , , lleva], i) => (
          <span key={hora} style={{ flexGrow: DUR[i] }} className={lleva ? "" : s.cBarraPausa}><b>{i + 1}</b></span>
        ))}
      </div>
      <div className={s.cExtremos} aria-hidden="true">
        {[0, 3, 5].map((i) => <span key={i} style={{ left: `${((aMin(PROGRAMA[i][0]) - 18 * 60) / 180) * 100}%` }}>{PROGRAMA[i][0]}</span>)}
      </div>
      <div className={s.cLista}>
        {PROGRAMA.map(([hora, nivel, titulo, texto, lleva], i) => (
          <details key={hora} className={`${s.cFila} ${lleva ? "" : s.cPausa}`} open={i === 0}>
            <summary>
              <span className={s.cNum} aria-hidden="true">{i + 1}</span>
              <span className={s.cTit}><span className={s.cMeta}><b>{hora}</b> · {nivel}</span><h3>{titulo}</h3></span>
              <span className={s.cMas} aria-hidden="true"><IcMas /></span>
            </summary>
            <div className={s.cCuerpo}>
              <p>{texto}</p>
              {lleva && <p className={s.cLleva}><b>Te llevás:</b> {lleva}</p>}
            </div>
          </details>
        ))}
      </div>
    </div></section>
  );
}
