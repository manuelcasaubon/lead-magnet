import type { Metadata } from "next";
import Link from "next/link";
import { RUTAS } from "@/lib/rutas";

// Inicio del sitio central: landing de la oferta principal (docs/SPEC.md §5.8).
// Placeholder hasta que Manu elija el boceto. Por el plan de venta, hasta el 25/11 el inicio
// no presenta el programa: solo lleva a la clase del 18/11 (DECISIONES.md D17).
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function Inicio() {
  return (
    <main style={{ padding: "48px 16px", maxWidth: 720, margin: "0 auto", display: "grid", gap: 24 }}>
      <p style={{ fontWeight: 800 }}>Manu Casaubon</p>
      <h1 style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.05em", lineHeight: 0.92, margin: 0 }}>
        Comunicá lo que sabés
      </h1>
      <p style={{ fontFamily: "var(--serif)", color: "var(--mostaza)", fontSize: "1.4rem", margin: 0 }}>
        En redes y arriba del escenario, siendo vos.
      </p>
      <Link href={RUTAS.evento} style={{ color: "var(--crema)", fontWeight: 800 }}>
        Clase en vivo, miércoles 18/11 en Palermo Soho →
      </Link>
    </main>
  );
}
