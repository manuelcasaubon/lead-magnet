import type { Metadata } from "next";
import FormularioReserva from "@/components/form/FormularioReserva";
import { EVENTO } from "@/lib/evento";

// Página de prueba del formulario (docs/SPEC.md §5.2.6). No se indexa ni se enlaza.
export const metadata: Metadata = {
  title: "Prueba del formulario",
  robots: { index: false, follow: false, nocache: true },
};

export default function PruebaFormulario() {
  return (
    <main style={{ paddingInline: "max(16px, env(safe-area-inset-left, 0px))", paddingBlock: "40px 64px", maxWidth: 1040, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.05em", lineHeight: .9, fontSize: "clamp(2rem, 7vw, 3.4rem)", margin: 0 }}>
        Prueba del formulario
      </h1>
      <p style={{ color: "var(--gris-o)", maxWidth: "40em", marginTop: 12 }}>
        Las dos variantes guardan de verdad en Supabase (con <code>source=&apos;form&apos;</code>) y mandan eventos a <code>/api/t</code>.
        Usá mails de prueba. Esta página no se indexa.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 32, marginTop: 32, alignItems: "start" }}>
        <section aria-labelledby="va" style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <h2 id="va" style={{ fontWeight: 800, margin: 0, color: "var(--mostaza)" }}>A · Un paso</h2>
          <FormularioReserva variante="un-paso" instagramUrl={EVENTO.instagramDm} lugar="prueba_a" />
        </section>
        <section aria-labelledby="vb" style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <h2 id="vb" style={{ fontWeight: 800, margin: 0, color: "var(--mostaza)" }}>B · Dos pasos</h2>
          <FormularioReserva variante="dos-pasos" instagramUrl={EVENTO.instagramDm} lugar="prueba_b" />
        </section>
      </div>
    </main>
  );
}
