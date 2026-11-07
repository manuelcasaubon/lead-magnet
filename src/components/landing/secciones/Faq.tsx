import type { ReactNode } from "react";
import LinkInstagram from "../LinkInstagram";
import { IconoMas } from "../Iconos";
import s from "../landing.module.css";
import f from "./faq.module.css";

// S8 · Preguntas, variante A: cada pregunta en una tarjeta blanca con un "+" en círculo rojo. La primera, abierta.
export default function Faq({ precio }: { precio: string }) {
  const preguntas: [string, ReactNode][] = [
    ["¿Dónde es?", "En Niceto Vega 4601, Palermo Soho, CABA."],
    ["¿Cuánto dura?", "3 horas, de 18 a 21 h. Las puertas abren a las 17:45."],
    ["Recién empiezo con mi marca, ¿me sirve?", "Sí, siempre que tengas experiencia en lo que hacés. Te llevás una estrategia clara para arrancar y saber dónde poner el foco. Lo importante es que no estés empezando en tu profesión."],
    ["¿Cómo sé si NO es para mí?", "Si estás arrancando, si hoy no vivís bien de tu profesión o si querés ser influencer, no es para vos. Esto es para emprendedores, profesionales y dueños de negocios."],
    ["¿Tengo que tener muchos seguidores?", "No."],
    ["¿Vamos a aprender a vender por redes?", "No. Vamos a aprender a generar oportunidades: entre ellas, ventas, pero también charlas, capacitaciones y más."],
    ["¿Cómo pago?", `Con Mercado Pago, en pesos (${precio}).`],
    ["¿Y si ese día no puedo ir porque no estoy en Buenos Aires?", <><LinkInstagram place="faq_no_puedo">Escribime TALLER</LinkInstagram> y te cuento cómo seguir.</>],
  ];
  return (
    <section className={`${s.banda} ${s.lucesC}`}><div>
      <h2>Preguntas</h2>
      <div className={f.lista}>
        {preguntas.map(([q, r], i) => (
          <details key={q} open={i === 0}>
            <summary><span>{q}</span><span className={f.mas} aria-hidden="true"><IconoMas t={16} /></span></summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
    </div></section>
  );
}
