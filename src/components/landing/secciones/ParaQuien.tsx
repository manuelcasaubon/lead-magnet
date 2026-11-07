import { IconoCheck } from "../Iconos";
import s from "../landing.module.css";
import q from "./paraQuien.module.css";

// S6 · "Para quién es", variante A: "Es para vos" en tarjeta blanca con checks en círculo rojo; "No es para vos" en tarjeta oscura.
const ES_PARA = [
  "Ya tenés una marca personal o la querés empezar.",
  "Querés una estrategia clara y saber hacia dónde ir en 2027.",
  "Sabés de lo tuyo y querés que tu sector te conozca.",
  "Ya vivís de tu marca o de tu profesión y querés potenciarla.",
];
const NO_ES_PARA = [
  "Buscás hacerte viral o famoso.",
  "Esperás resultados de un día para el otro.",
  "Querés desarrollar tu marca personal solo para ganar más dinero y nada más.",
];

export default function ParaQuien() {
  return (
    <section className={`${s.banda} ${s.lucesC}`}><div>
      <h2>Para quién es</h2>
      <div className={q.dos}>
        <div className={q.si}>
          <h3>Es para vos si</h3>
          <ul>{ES_PARA.map((t) => <li key={t}><span className={q.check} aria-hidden="true"><IconoCheck t={16} /></span>{t}</li>)}</ul>
        </div>
        <div className={q.no}>
          <h3>No es para vos si</h3>
          <ul>{NO_ES_PARA.map((t) => <li key={t}><span className={q.punto} aria-hidden="true" />{t}</li>)}</ul>
        </div>
      </div>
    </div></section>
  );
}
