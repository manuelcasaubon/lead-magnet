import type { ReactNode } from "react";
import { MARCAS } from "./contenido";
import s from "./landing.module.css";

// Toques tomados de comunicatumarca.com/v2: pasos con número en círculo y los logos de las marcas detrás del VSL.

export function Paso({ n, children }: { n: number; children: ReactNode }) {
  return <p className={s.paso}><span aria-hidden="true">{n}</span>{children}</p>;
}


// Logos de las marcas de fondo, detrás del VSL: todos visibles, quietos y tenues (pedido de Manu, 7/11).
// La lista se repite para llenar el fondo; para lectores de pantalla va una sola vez, en el texto de abajo.
export function LogosFondo() {
  if (!MARCAS.length) return null;
  const relleno = Array.from({ length: 4 }, () => MARCAS).flat();
  return (
    <div className={s.logosFondo} aria-hidden="true">
      {relleno.map((m, i) => (
        <img key={i} src={m.src} alt="" width={m.ancho} height={m.alto} loading="lazy" className={m.sinInvertir ? s.sinInvertir : undefined} /> // eslint-disable-line @next/next/no-img-element
      ))}
    </div>
  );
}

export function MarcasTexto() {
  if (!MARCAS.length) return null;
  return <p className={s.marcasTexto}>Con la confianza de marcas como {MARCAS.map((m) => m.nombre).join(", ").replace(/, ([^,]*)$/, " y $1")}.</p>;
}
