import type { Metadata } from "next";

// Landing de la clase del 18/11 en /evento. Placeholder: la construye la sesión S1 (docs/SPEC.md §5.1)
// a partir del boceto que elija Manu.
export const metadata: Metadata = {
  title: "Cómo destacar con tu marca personal en 2027",
  description: "Clase en vivo presencial de 3 horas. Miércoles 18/11, de 18 a 21 h, en Palermo Soho. De que nadie te conozca a que te llamen a vos.",
  alternates: { canonical: "/evento" },
};

export default function Evento() {
  return (
    <main style={{ padding: "48px 16px", maxWidth: 720, margin: "0 auto" }}>
      <p style={{ fontWeight: 800 }}>Manu Casaubon</p>
      <h1 style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.05em", lineHeight: 0.92 }}>
        Cómo destacar con tu marca personal en 2027
      </h1>
      <p style={{ fontFamily: "var(--serif)", color: "var(--mostaza)", fontSize: "1.4rem" }}>En construcción.</p>
    </main>
  );
}
