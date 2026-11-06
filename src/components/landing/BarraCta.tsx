"use client";

import { useEffect, useState } from "react";
import s from "./landing.module.css";

// Barra de CTA fija en el celular: aparece cuando el hero sale de la pantalla y se esconde
// cuando el formulario está a la vista. En escritorio no se muestra (CSS).
export default function BarraCta({ heroId, destinoId, texto, detalle, agotado }: {
  heroId: string; destinoId: string; texto: string; detalle: string; agotado: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const destino = document.getElementById(destinoId);
    if (!hero || !destino || typeof IntersectionObserver === "undefined") return;
    let heroFuera = false;
    let destinoVisible = false;
    const actualizar = () => setVisible(heroFuera && !destinoVisible);
    const a = new IntersectionObserver(([e]) => { heroFuera = !e.isIntersecting && e.boundingClientRect.top < 0; actualizar(); });
    const b = new IntersectionObserver(([e]) => { destinoVisible = e.isIntersecting; actualizar(); });
    a.observe(hero);
    b.observe(destino);
    return () => { a.disconnect(); b.disconnect(); };
  }, [heroId, destinoId]);

  if (!visible) return null;
  return (
    <div className={s.barra}>
      <p>{texto}<span>{detalle}</span></p>
      <a className={`${s.boton} ${agotado ? s.agotado : ""}`} href={`#${destinoId}`} data-track="barra_reservar">
        {agotado ? "Agotado" : "Reservar"}
      </a>
    </div>
  );
}
