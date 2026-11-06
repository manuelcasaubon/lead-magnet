"use client";

import { useEffect, useRef, useState } from "react";
import s from "./inicio.module.css";

// Animación al hacer scroll (pedido de Manu, 6/11): un panel fijo que muestra la transformación
// "de que nadie te conozca a que te llamen a vos": identidad → imagen → reputación.
// Con "reducir movimiento" se muestra la misma secuencia como lista, sin animar.

type Paso = { palabra: React.ReactNode; desc: string; miran: number };
const PASOS: Paso[] = [
  { palabra: <>Nadie te <em>conoce</em></>, desc: "Sabés mucho. Pero tu sector todavía no lo sabe.", miran: 0 },
  { palabra: "Identidad", desc: "Qué hacés y quién sos.", miran: 2 },
  { palabra: "Imagen", desc: "Cómo te percibe el mundo.", miran: 5 },
  { palabra: "Reputación", desc: "Esa imagen a lo largo del tiempo. Lo que hace que tu sector piense en vos.", miran: 9 },
  { palabra: <>Te llaman <em>a vos</em></>, desc: "La señal de que vas bien: querés ver tu video 3, 4 o 5 veces antes de subirlo.", miran: 12 },
];
const NIVELES = ["Identidad", "Imagen", "Reputación"];
const SALA = 12;

export default function Transformacion() {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [quieto, setQuieto] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cambiar = () => setQuieto(mq.matches);
    cambiar();
    mq.addEventListener("change", cambiar);
    return () => mq.removeEventListener("change", cambiar);
  }, []);

  useEffect(() => {
    if (quieto) return;
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      const el = ref.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const r = el.getBoundingClientRect();
      setP(total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total)));
    };
    const onScroll = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } };
    medir();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [quieto]);

  if (quieto) {
    return (
      <section className={`${s.banda} ${s.oscuro}`} aria-labelledby="transf-titulo">
        <div className={`${s.in} ${s.pila} ${s.amplia}`}>
          <h2 id="transf-titulo" className={s.grande}>De que nadie te conozca a que te llamen a vos</h2>
          <div className={s.estatica}>
            {PASOS.map((x, i) => <div key={i}><b>{x.palabra}</b><span>{x.desc}</span></div>)}
          </div>
        </div>
      </section>
    );
  }

  const x = p * PASOS.length;
  const paso = Math.min(PASOS.length - 1, Math.floor(x));
  const final = paso === PASOS.length - 1;

  return (
    <section ref={ref} className={s.transf} aria-labelledby="transf-titulo">
      <div className={s.transfPanel} data-final={final}>
        <div className={s.transfIn}>
          <h2 id="transf-titulo" className={s.transfEtiqueta}>Qué cambia cuando comunicás</h2>
          <div className={s.transfEscena} aria-live="polite">
            {PASOS.map((q, i) => (
              <div key={i} className={s.transfPaso} data-activo={i === paso} data-pasado={i < paso} aria-hidden={i !== paso}>
                <p className={s.transfPalabra}>{q.palabra}</p>
                <p className={s.transfDesc}>{q.desc}</p>
              </div>
            ))}
          </div>
          <div className={s.riel} aria-hidden="true">
            {NIVELES.map((n, i) => {
              const avance = Math.min(1, Math.max(0, x - (i + 1)));
              return (
                <div key={n} data-ok={avance > 0}>
                  <i style={{ ["--p" as string]: avance } as React.CSSProperties} />
                  <span>{n}</span>
                </div>
              );
            })}
          </div>
          <div className={s.pila} style={{ gap: 8 }} aria-hidden="true">
            <div className={s.sala}>
              {Array.from({ length: SALA }, (_, i) => <span key={i} data-mira={i < PASOS[paso].miran} />)}
            </div>
            <p className={s.salaTexto}>La sala de tu sector: cuántos piensan en vos.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
