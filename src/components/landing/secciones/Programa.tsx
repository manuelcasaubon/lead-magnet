import { PROGRAMA } from "../contenido";
import { IconoMas } from "../Iconos";
import s from "../landing.module.css";
import p from "./programa.module.css";

// S5 · "Qué pasa en las 3 horas", variante A: línea de tiempo con puntos rojos y la hora a mano. Cada bloque es un
// desplegable (<details>): cerrado se ve la hora, el bloque y el título; abierto, qué pasa y qué te llevás. El primero, abierto.
export default function Programa() {
  return (
    <section className={`${s.banda} ${s.luces}`}><div>
      <h2>Qué pasa en las 3 horas</h2>
      <div className={p.linea}>
        {PROGRAMA.map(([hora, nivel, titulo, texto, lleva], i) => (
          <details key={hora} className={`${p.item} ${lleva ? "" : p.pausa}`} open={i === 0}>
            <summary>
              <span className={p.punto} aria-hidden="true" />
              <span className={p.hora}>{hora}</span>
              <span className={p.tit}><span className={p.nivel}>{nivel}</span><h3>{titulo}</h3></span>
              <span className={p.mas} aria-hidden="true"><IconoMas /></span>
            </summary>
            <div className={p.cuerpo}>
              <p>{texto}</p>
              {lleva && <p className={p.lleva}><b>Te llevás:</b> {lleva}</p>}
            </div>
          </details>
        ))}
      </div>
    </div></section>
  );
}
