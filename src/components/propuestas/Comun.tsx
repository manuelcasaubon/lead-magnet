import type { ReactNode } from "react";
import { MARCAS } from "@/components/landing/contenido";
import c from "./comun.module.css";

// Piezas compartidas por las propuestas visuales (página /prueba/propuestas). Los textos son los de la landing real
// (src/components/landing/Landing.tsx), sin cambios. Nada de esto se usa en /evento.

export const PRECIO = "ARS 42.000";

export const PREGUNTAS_HOY = [
  "¿Qué debería hacer con mi marca?",
  "¿Qué tipo de contenido tendría que hacer?",
  "¿Qué estrategia tendría que seguir?",
  "¿Qué va a funcionar en 2027?",
];

export const DATOS: [string, string][] = [
  ["Cuándo", "Miércoles 18/11"],
  ["Horario", "18 a 21 h"],
  ["Dónde", "Palermo Soho"],
  ["Entrada", "USD 27"],
];

export const ES_PARA = [
  "Ya tenés una marca personal o la querés empezar.",
  "Querés una estrategia clara y saber hacia dónde ir en 2027.",
  "Sabés de lo tuyo y querés que tu sector te conozca.",
  "Ya vivís de tu marca o de tu profesión y querés potenciarla.",
];
export const NO_ES_PARA = [
  "Buscás hacerte viral o famoso.",
  "Esperás resultados de un día para el otro.",
  "Querés desarrollar tu marca personal solo para ganar más dinero y nada más.",
];

// [hora, bloque, título, qué pasa, qué se lleva]
export const PROGRAMA: [string, string, string, string, string | null][] = [
  ["18:00", "Bienvenida", "Las reglas cambiaron", "Qué cambió en las redes sociales y en la estrategia de marca para 2027.", "Qué cambió y qué deja de funcionar en 2027, para no poner energía donde ya no rinde."],
  ["18:20", "Comunicación estratégica", "Qué decís", "Trabajás tu mensaje: qué hacés, para quién y por qué te tienen que escuchar a vos.", "Tu mensaje claro, a quién le hablás y en qué etapa está hoy tu comunicación estratégica."],
  ["18:50", "Comunicación creativa", "Cómo lo mostrás", "Definís qué tipo de contenido te conviene hacer y cuál es el formato que te sale natural.", "Los formatos de contenido que mejor te quedan: los que te salen fácil, disfrutás y funcionan."],
  ["19:20", "Pausa", "Break", "15 minutos para descansar y conocer a quienes están en la sala.", null],
  ["19:35", "Comunicación de impacto", "Cómo lo decís", "Practicamos en vivo. Dos o tres personas pasan al frente y las corrijo ahí mismo, para que todos vean qué cambia.", "Las correcciones en vivo y qué practicar para hablar frente a cámara y en un escenario igual que como sos en persona."],
  ["20:05", "Plan 2027", "Tu foco y tus preguntas", "Armamos tu planificación para 2027 y me hacés tus preguntas en vivo.", "Tu planificación 2027 y tus dudas respondidas en persona."],
  ["20:35", "Cierre", "La definición final de tu marca para 2027", "Juntamos todo: qué decís, cómo lo mostrás y cómo lo decís. A las 21 h terminamos.", "Tu marca definida para 2027 y el próximo paso concreto."],
];

export const FAQ: [string, ReactNode][] = [
  ["¿Dónde es?", "En Niceto Vega 4601, Palermo Soho, CABA."],
  ["¿Cuánto dura?", "3 horas, de 18 a 21 h. Las puertas abren a las 17:45."],
  ["Recién empiezo con mi marca, ¿me sirve?", "Sí, siempre que tengas experiencia en lo que hacés. Te llevás una estrategia clara para arrancar y saber dónde poner el foco. Lo importante es que no estés empezando en tu profesión."],
  ["¿Tengo que tener muchos seguidores?", "No."],
  ["¿Vamos a aprender a vender por redes?", "No. Vamos a aprender a generar oportunidades: entre ellas, ventas, pero también charlas, capacitaciones y más."],
  ["¿Cómo pago?", `Con Mercado Pago, en pesos (${PRECIO}).`],
  ["¿Y si ese día no puedo ir porque no estoy en Buenos Aires?", <><a href="#">Escribime TALLER</a> y te cuento cómo seguir.</>],
];

export const MARCAS_TEXTO = `Con la confianza de marcas como ${MARCAS.map((m) => m.nombre).join(", ").replace(/, ([^,]*)$/, " y $1")}.`;

/** "① Mirá el video": letra a mano con el número en círculo rojo. */
export function Paso({ n, children, className }: { n: number; children: ReactNode; className?: string }) {
  return <p className={`${c.paso} ${className ?? ""}`}><span aria-hidden="true">{n}</span>{children}</p>;
}

/** Maqueta estática del VSL (el reproductor real lee Bunny/Supabase). Muestra el póster de texto de la landing. */
export function VslMaqueta({ className }: { className?: string }) {
  return (
    <div className={`${c.vsl} ${className ?? ""}`} role="img" aria-label="Video de presentación de la clase (maqueta)">
      <p className={c.escena}>¿Te pasó de estar en un evento, escuchar al speaker y pensar: <em>«sabe, pero no sabe tanto como yo»</em>? ¿Por qué lo llaman a él y a mí no?</p>
      <span className={c.play} aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>
    </div>
  );
}

/** Logos de las marcas. tono "claro" = en blanco (fondo oscuro), "oscuro" = en negro (fondo crema). */
export function Logos({ tono = "claro", className, doble }: { tono?: "claro" | "oscuro"; className?: string; doble?: boolean }) {
  const lista = doble ? [...MARCAS, ...MARCAS] : MARCAS;
  return (
    <div className={`${className ?? ""} ${tono === "claro" ? c.logosClaros : c.logosOscuros}`} aria-hidden="true">
      {lista.map((m, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={m.src} alt="" width={m.ancho} height={m.alto} className={m.sinInvertir ? c.sinInvertir : undefined} />
      ))}
    </div>
  );
}

/** Maqueta estática del formulario "un paso" (mismos campos, ayudas y textos que FormularioReserva). */
export function FormMaqueta({ tono = "crema", className }: { tono?: "crema" | "oscuro" | "blanco"; className?: string }) {
  const campos: [string, string, string?][] = [
    ["Nombre", ""],
    ["Mail", ""],
    ["WhatsApp", "+54 9 11 1234 5678", "Por si hay un cambio de último momento."],
    ["Instagram o web de tu marca", "@tuusuario o tuweb.com", "Para tu auditoría."],
  ];
  return (
    <form className={`${c.form} ${c["form_" + tono]} ${className ?? ""}`} aria-label="Reservá tu lugar (maqueta)">
      {campos.map(([l, ph, ayuda]) => (
        <div className={c.campo} key={l}>
          <label>{l} <span aria-hidden="true">*</span></label>
          {ayuda && <p className={c.ayuda}>{ayuda}</p>}
          <input type="text" placeholder={ph} readOnly tabIndex={-1} />
        </div>
      ))}
      <label className={c.consent}><input type="checkbox" readOnly tabIndex={-1} /> Quiero recibir mails sobre la clase.</label>
      <button type="button" className={c.boton}>Reservar mi lugar</button>
      <p className={c.ig}>¿Preferís por Instagram? <a href="#">Mandame TALLER</a></p>
    </form>
  );
}

// Íconos de línea extra (mismo trazo que src/components/landing/Iconos.tsx).
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const IcCheck = ({ t = 22 }: { t?: number }) => <svg {...base} width={t} height={t} strokeWidth={2.6}><path d="m4.5 12.5 4.8 4.8L19.5 7" /></svg>;
export const IcCheckCirculo = ({ t = 26 }: { t?: number }) => <svg {...base} width={t} height={t}><circle cx="12" cy="12" r="9.5" /><path d="m7.8 12.3 3 3 5.6-6" strokeWidth={2.2} /></svg>;
export const IcCalendarioChico = ({ t = 20 }: { t?: number }) => <svg {...base} width={t} height={t}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
export const IcReloj = ({ t = 20 }: { t?: number }) => <svg {...base} width={t} height={t}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IcPin = ({ t = 20 }: { t?: number }) => <svg {...base} width={t} height={t}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
export const IcTicket = ({ t = 20 }: { t?: number }) => <svg {...base} width={t} height={t}><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3Z" /><path d="M14 6v12" strokeDasharray="2 2.5" /></svg>;
export const IcMas = ({ t = 18 }: { t?: number }) => <svg {...base} width={t} height={t} strokeWidth={2.2}><path d="M12 5v14M5 12h14" /></svg>;
export const IcFlecha = ({ t = 18 }: { t?: number }) => <svg {...base} width={t} height={t} strokeWidth={2.2}><path d="m6 9 6 6 6-6" /></svg>;
export const IcRegalo = ({ t = 18 }: { t?: number }) => <svg {...base} width={t} height={t}><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7S10.5 3 8 3.5 7.5 7 12 7ZM12 7s1.5-4 4-3.5S16.5 7 12 7Z" /></svg>;

export const ICONOS_DATOS = [IcCalendarioChico, IcReloj, IcPin, IcTicket];

/** Subrayado hecho a mano (SVG) para resaltar una palabra. */
export function Subrayado({ children, color = "var(--rojo)" }: { children: ReactNode; color?: string }) {
  return (
    <span className={c.subrayado}>
      {children}
      <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9.5C40 4 90 3 197 7.5" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
    </span>
  );
}

/** Círculo hecho a mano alrededor de una palabra o número. */
export function Circulado({ children, color = "var(--rojo)" }: { children: ReactNode; color?: string }) {
  return (
    <span className={c.circulado}>
      {children}
      <svg viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden="true"><path d="M70 6C40 3 6 12 6 31s34 25 60 24 49-9 48-26C113 13 86 4 52 7" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" /></svg>
    </span>
  );
}
