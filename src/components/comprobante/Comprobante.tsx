"use client";

import { useEffect, useRef, useState } from "react";
import { registrarDescarga } from "@/app/entrada/acciones";
import type { DatosComprobante } from "@/app/entrada/datos";
import s from "./comprobante.module.css";

// Comprobante de entrada con la animación de impresión y el PDF (portado de docs/referencia/comprobante-demo.html).
// Es un comprobante de entrada, no una factura. jsPDF se importa recién al tocar el botón.

type Props = { datos: DatosComprobante; instagram?: boolean };

export default function Comprobante({ datos, instagram = false }: Props) {
  const [fase, setFase] = useState<"imprime" | "listo">("imprime");
  const [aviso, setAviso] = useState("También te llega la confirmación a tu mail.");
  const [bajando, setBajando] = useState(false);
  const ticket = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setFase("listo"); return; }
    const el = ticket.current;
    const fin = () => setFase("listo");
    el?.addEventListener("animationend", fin, { once: true });
    const t = window.setTimeout(fin, 2600); // por si el navegador no dispara animationend
    return () => { el?.removeEventListener("animationend", fin); window.clearTimeout(t); };
  }, []);

  const filas: [string, string][] = ([
    ["Nombre", datos.nombre],
    ["Mail", datos.email],
    ["Cuándo", datos.cuando],
    ["Puertas", datos.puertas],
    ["Dónde", datos.donde],
    ["Pagaste", datos.monto],
    ["Fecha de pago", datos.fechaPago],
    ["Operación", datos.operacion],
  ] as [string, string][]).filter(([, v]) => v);

  async function bajarPdf() {
    setBajando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: [105, 170] });
      const rojo: [number, number, number] = [208, 68, 63], oscuro: [number, number, number] = [45, 40, 40];
      const gris: [number, number, number] = [94, 87, 87], crema: [number, number, number] = [255, 253, 246];
      doc.setFillColor(...crema); doc.rect(0, 0, 105, 170, "F");
      doc.setFillColor(...oscuro); doc.rect(0, 0, 105, 24, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...crema);
      doc.text("Manu Casaubon", 10, 11);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text("Comprobante de entrada", 10, 17);
      doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...oscuro);
      const tit = doc.splitTextToSize(datos.evento, 85);
      doc.text(tit, 10, 36);
      let y = 36 + tit.length * 7 + 2;
      doc.setDrawColor(...oscuro); doc.setLineDashPattern([1.2, 1.2], 0); doc.line(10, y, 95, y); doc.setLineDashPattern([], 0);
      y += 8;
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...gris);
      doc.text("ENTRADA", 10, y);
      doc.setFontSize(18); doc.setTextColor(...rojo);
      doc.text(datos.codigo, 37, y + 1);
      y += 10;
      for (const [k, v] of filas) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...gris);
        doc.text(k.toUpperCase(), 10, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...oscuro);
        const val = doc.splitTextToSize(String(v), 58);
        doc.text(val, 37, y);
        y += Math.max(1, val.length) * 4.6 + 3;
      }
      doc.setFontSize(7.5); doc.setTextColor(...gris);
      doc.text("Este comprobante no es una factura. Mostralo el día del evento.", 10, 162);
      doc.save(`entrada-18-11-${datos.codigo}.pdf`);
      registrarDescarga(datos.orderId).catch(() => {});
    } catch {
      setAviso("No se pudo armar el PDF. Sacale una captura a tu comprobante.");
    } finally {
      setBajando(false);
    }
  }

  return (
    <div className={fase === "listo" ? s.listo : s.imprime} style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 className={s.titulo}>Tu lugar está reservado</h1>
        <p className={s.bajada}>Te espero el 18/11. Guardá tu comprobante.</p>
      </div>
      <div className={s.impresora}>
        <div className={s.ranura} />
        <div className={s.salida}>
          <section className={s.ticket} aria-label="Comprobante de entrada" ref={ticket}>
            <h2>{datos.evento}</h2>
            <p className={s.sub}>Comprobante de entrada</p>
            <dl className={s.lista}>
              <div className={`${s.dato} ${s.codigo}`}><dt>Entrada</dt><dd>{datos.codigo}</dd></div>
              {filas.map(([k, v]) => (
                <div className={s.dato} key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <p className={s.nota}>Este comprobante no es una factura. Mostralo el día del evento.</p>
          </section>
        </div>
      </div>
      <div className={s.acciones}>
        <button className={s.boton} type="button" onClick={bajarPdf} disabled={bajando}>
          {bajando ? "Armando el PDF…" : "Descargar comprobante en PDF"}
        </button>
        {instagram && (
          <a className={`${s.boton} ${s.sec}`} href="https://ig.me/m/casaubon.ar?text=PAGU%C3%89">Avisarme por Instagram</a>
        )}
        <p className={s.aviso} aria-live="polite">{aviso}</p>
      </div>
    </div>
  );
}
