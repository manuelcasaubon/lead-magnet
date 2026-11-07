import { IconoCalendario, IconoCharla, IconoLupa, IconoObjetivo } from "../Iconos";
import s from "../landing.module.css";
import l from "./llevas.module.css";

// S4 · "Qué te llevás", variante C: la planificación 2027 como tarjeta oscura destacada y las otras tres como filas con ícono rojo.
const PRIMERO = { Ic: IconoCalendario, t: "Tu planificación para 2027", p: "Una planificación completa para saber exactamente dónde poner el foco en tus redes y en tu marca personal." };
const RESTO = [
  { Ic: IconoLupa, t: "Una auditoría personalizada", p: "La auditoría de tu marca, mirada en los 3 niveles de comunicación." },
  { Ic: IconoObjetivo, t: "Cómo diferenciarte", p: "Entendés cómo cambiaron las reglas del juego y cómo diferenciar tu marca en 2027." },
  { Ic: IconoCharla, t: "Tus preguntas, en persona", p: "Me preguntás lo que necesites en vivo, cara a cara." },
];

export default function Llevas() {
  const P = PRIMERO.Ic;
  return (
    <section className={`${s.banda} ${s.crema}`}><div>
      <h2>Qué te llevás</h2>
      <div className={l.grid}>
        <div className={l.grande}>
          <span className={l.icG} aria-hidden="true"><P /></span>
          <h3>{PRIMERO.t}</h3><p>{PRIMERO.p}</p>
          <span className={l.ano} aria-hidden="true">2027</span>
        </div>
        <ul className={l.resto}>
          {RESTO.map(({ Ic, t, p }) => (
            <li key={t}><span className={l.ic} aria-hidden="true"><Ic /></span><div><h3>{t}</h3><p>{p}</p></div></li>
          ))}
        </ul>
      </div>
    </div></section>
  );
}
