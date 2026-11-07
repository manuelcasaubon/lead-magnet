import s from "../landing.module.css";
import p from "./preguntas.module.css";

// S3 · "Si hoy te preguntás esto", variante A: las preguntas como globos de diálogo alternados y el remate a mano.
const PREGUNTAS = [
  "¿Qué debería hacer con mi marca?",
  "¿Qué tipo de contenido tendría que hacer?",
  "¿Qué estrategia tendría que seguir?",
  "¿Qué va a funcionar en 2027?",
];

export default function Preguntas() {
  return (
    <section className={`${s.banda} ${s.luces}`}><div>
      <h2>Si hoy te preguntás esto</h2>
      <ul className={p.globos}>
        {PREGUNTAS.map((q) => <li key={q}>{q}</li>)}
      </ul>
      <div className={p.remate}>
        <svg className={p.flecha} viewBox="0 0 60 60" aria-hidden="true"><path d="M10 6c4 22 16 36 38 40M48 46l-12 1M48 46l-4-11" stroke="var(--rojo)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <p>Esta clase es para vos. Eso es lo que vamos a trabajar.</p>
      </div>
    </div></section>
  );
}
