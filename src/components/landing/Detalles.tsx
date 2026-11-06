import type { ReactNode } from "react";
import { MARCAS } from "./contenido";
import s from "./landing.module.css";

// Toques "a mano" tomados de comunicatumarca.com/v2: pasos con número en círculo, subrayado de trazo y la tira de marcas.

export function Paso({ n, children }: { n: number; children: ReactNode }) {
  return <p className={s.paso}><span aria-hidden="true">{n}</span>{children}</p>;
}

// Subrayado dibujado a mano debajo de una palabra clave.
export function Subrayado({ children }: { children: ReactNode }) {
  return (
    <span className={s.subrayado}>
      {children}
      <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M3 9 C 40 3, 80 4, 120 7 S 180 11, 197 5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// Marcas con las que trabajó Manu, pasando en loop (se duplica la lista para que el giro no tenga corte).
// Sin logos cargados no se muestra; con FOTOS_BOCETO=1 se ven recuadros con el lugar.
export function Marcas() {
  const boceto = process.env.FOTOS_BOCETO === "1";
  const lista = MARCAS.length ? MARCAS : boceto ? Array.from({ length: 8 }, (_, i) => ({ nombre: `Logo ${i + 1}`, src: "", ancho: 120, alto: 40 })) : [];
  if (!lista.length) return null;
  return (
    <div className={s.marcas}>
      <p className={s.marcasTitulo}>Con la confianza de +40 marcas como:</p>
      <div className={s.cinta} role="list" aria-label="Marcas con las que trabajé">
        <div className={s.cintaIn}>
          {[...lista, ...lista].map((m, i) => (
            <span key={i} role="listitem" aria-hidden={i >= lista.length} className={s.logo}>
              {m.src
                ? <img src={m.src} alt={m.nombre} width={m.ancho} height={m.alto} loading="lazy" /> // eslint-disable-line @next/next/no-img-element
                : <span className={s.logoFalta}>{m.nombre}</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
