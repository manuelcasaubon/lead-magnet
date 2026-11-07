import { IconoCalendario, IconoCharla, IconoLupa, IconoObjetivo } from "@/components/landing/Iconos";
import c from "./comun.module.css";
import s from "./s4.module.css";

const ITEMS = [
  { Ic: IconoCalendario, t: "Tu planificación para 2027", p: "Una planificación completa para saber exactamente dónde poner el foco en tus redes y en tu marca personal." },
  { Ic: IconoLupa, t: "Una auditoría personalizada", p: "La auditoría de tu marca, mirada en los 3 niveles de comunicación." },
  { Ic: IconoObjetivo, t: "Cómo diferenciarte", p: "Entendés cómo cambiaron las reglas del juego y cómo diferenciar tu marca en 2027." },
  { Ic: IconoCharla, t: "Tus preguntas, en persona", p: "Me preguntás lo que necesites en vivo, cara a cara." },
];

// A · Tarjetas 2x2: tarjetas blancas con sombra suave, ícono en un círculo rojo claro y número chico.
export function LlevasA() {
  return (
    <section id="s4-a" className={`${c.banda} ${c.lucesC} ${s.a}`}><div className={c.ancho}>
      <h2>Qué te llevás</h2>
      <div className={s.aGrid}>
        {ITEMS.map(({ Ic, t, p }, i) => (
          <div key={t} className={s.aCard}>
            <div className={s.aCabeza}><span className={s.aIc} aria-hidden="true"><Ic /></span><span className={s.aNum} aria-hidden="true">0{i + 1}</span></div>
            <h3>{t}</h3><p>{p}</p>
          </div>
        ))}
      </div>
    </div></section>
  );
}

// B · Recorrido en oscuro: lista vertical con íconos mostaza en círculos unidos por una línea punteada.
export function LlevasB() {
  return (
    <section id="s4-b" className={`${c.banda} ${c.lucesO} ${s.b}`}><div className={c.ancho}>
      <h2>Qué te <span className={c.rojo}>llevás</span></h2>
      <ol className={s.bLista}>
        {ITEMS.map(({ Ic, t, p }) => (
          <li key={t}>
            <span className={s.bIc} aria-hidden="true"><Ic /></span>
            <div><h3>{t}</h3><p>{p}</p></div>
          </li>
        ))}
      </ol>
    </div></section>
  );
}

// C · Destacado + lista: la planificación 2027 como tarjeta oscura grande y las otras tres como filas con ícono rojo.
export function LlevasC() {
  const [primero, ...resto] = ITEMS;
  const P = primero.Ic;
  return (
    <section id="s4-c" className={`${c.banda} ${c.crema} ${s.c}`}><div className={c.ancho}>
      <h2>Qué te llevás</h2>
      <div className={s.cGrid}>
        <div className={s.cGrande}>
          <span className={s.cIcG} aria-hidden="true"><P /></span>
          <h3>{primero.t}</h3><p>{primero.p}</p>
          <span className={s.cAno} aria-hidden="true">2027</span>
        </div>
        <ul className={s.cResto}>
          {resto.map(({ Ic, t, p }) => (
            <li key={t}><span className={s.cIc} aria-hidden="true"><Ic /></span><div><h3>{t}</h3><p>{p}</p></div></li>
          ))}
        </ul>
      </div>
    </div></section>
  );
}
