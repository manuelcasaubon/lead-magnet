import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HeroA, HeroB, HeroC } from "@/components/propuestas/S1Hero";
import { ConocimientoA, ConocimientoB, ConocimientoC } from "@/components/propuestas/S2Conocimiento";
import { PreguntasA, PreguntasB, PreguntasC } from "@/components/propuestas/S3Preguntas";
import { LlevasA, LlevasB, LlevasC } from "@/components/propuestas/S4Llevas";
import { ProgramaA, ProgramaB, ProgramaC } from "@/components/propuestas/S5Programa";
import { ParaQuienA, ParaQuienB, ParaQuienC } from "@/components/propuestas/S6ParaQuien";
import { QuienA, QuienB, QuienC } from "@/components/propuestas/S7Quien";
import { FaqA, FaqB, FaqC } from "@/components/propuestas/S8Faq";
import { CierreA, CierreB, CierreC } from "@/components/propuestas/S9Cierre";
import c from "@/components/propuestas/comun.module.css";

// Propuestas visuales para la landing /evento: 3 por sección para que Manu elija (no se indexa ni se mide).
// Cada propuesta es una banda con id "s<n>-<a|b|c>". Formularios y video son maquetas estáticas.
export const metadata: Metadata = {
  title: "Propuestas visuales /evento",
  robots: { index: false, follow: false, nocache: true },
};

const SECCIONES: [string, (() => ReactNode)[]][] = [
  ["Hero", [HeroA, HeroB, HeroC]],
  ["Tenés mucho conocimiento", [ConocimientoA, ConocimientoB, ConocimientoC]],
  ["Si hoy te preguntás esto", [PreguntasA, PreguntasB, PreguntasC]],
  ["Qué te llevás", [LlevasA, LlevasB, LlevasC]],
  ["Qué pasa en las 3 horas", [ProgramaA, ProgramaB, ProgramaC]],
  ["Para quién es", [ParaQuienA, ParaQuienB, ParaQuienC]],
  ["Quién la da", [QuienA, QuienB, QuienC]],
  ["Preguntas", [FaqA, FaqB, FaqC]],
  ["Nos vemos el 18/11", [CierreA, CierreB, CierreC]],
];

const rotulo: React.CSSProperties = {
  background: "#151212", color: "var(--gris-o)", fontSize: 13, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
  padding: "10px 16px", borderBlock: "1px solid var(--linea-o)", margin: 0,
};

export default function Propuestas() {
  return (
    <main className={c.raiz}>
      {SECCIONES.map(([nombre, props], i) => props.map((P, j) => (
        <div key={`${i}-${j}`}>
          <p style={rotulo}>{i + 1} · {nombre} · Propuesta {"ABC"[j]}</p>
          <P />
        </div>
      )))}
    </main>
  );
}
