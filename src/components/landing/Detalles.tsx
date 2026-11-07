import type { ReactNode } from "react";
import { MARCAS } from "./contenido";
import s from "./landing.module.css";

// Toques tomados de comunicatumarca.com/v2: pasos con número en círculo y los logos de las marcas detrás del VSL.

export function Paso({ n, children, className }: { n: number; children: ReactNode; className?: string }) {
  return <p className={className ? `${s.paso} ${className}` : s.paso}><span aria-hidden="true">{n}</span>{children}</p>;
}

// Logos de las marcas alrededor del VSL, en movimiento (pedido de Manu, 7/11): una fila arriba y otra abajo que se
// deslizan en sentidos opuestos y, en pantallas anchas, una columna a cada lado que sube y baja. Nunca quedan debajo del video.
// Para lectores de pantalla las marcas van una sola vez, en el texto de abajo (MarcasTexto).
function Tira({ clase }: { clase: string }) {
  const doble = [...MARCAS, ...MARCAS];
  return (
    <div className={clase}>
      {doble.map((m, i) => (
        <img key={i} src={m.src} alt="" width={m.ancho} height={m.alto} loading="lazy" className={m.sinInvertir ? s.sinInvertir : undefined} /> // eslint-disable-line @next/next/no-img-element
      ))}
    </div>
  );
}

export function LogosFondo() {
  if (!MARCAS.length) return null;
  return (
    <div className={s.logosFondo} aria-hidden="true">
      <div className={`${s.logosFila} ${s.logosArriba}`}><Tira clase={s.tiraH} /></div>
      <div className={`${s.logosFila} ${s.logosAbajo}`}><Tira clase={`${s.tiraH} ${s.reversa}`} /></div>
      <div className={`${s.logosColumna} ${s.logosIzq}`}><Tira clase={s.tiraV} /></div>
      <div className={`${s.logosColumna} ${s.logosDer}`}><Tira clase={`${s.tiraV} ${s.reversa}`} /></div>
    </div>
  );
}

export function MarcasTexto() {
  if (!MARCAS.length) return null;
  return <p className={s.marcasTexto}>Con la confianza de marcas como {MARCAS.map((m) => m.nombre).join(", ").replace(/, ([^,]*)$/, " y $1")}.</p>;
}
