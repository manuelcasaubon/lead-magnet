import type { Metadata } from "next";
import VideoBunny from "@/components/video/VideoBunny";
import { getVideo } from "@/lib/video/getVideo";

// Página de prueba del reproductor (no se indexa ni se enlaza). Siempre fresca: lee la base en cada visita.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Prueba del video",
  robots: { index: false, follow: false, nocache: true },
};

const USOS = ["vsl_evento", "vsl_inicio"] as const;

export default async function PruebaVideo() {
  const videos = await Promise.all(USOS.map((u) => getVideo(u)));
  return (
    <main style={{ paddingInline: "max(16px, env(safe-area-inset-left, 0px))", paddingBlock: "40px 64px", maxWidth: 880, margin: "0 auto", display: "grid", gap: 40 }}>
      <h1 style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.05em", lineHeight: .9, fontSize: "clamp(2rem, 7vw, 3.4rem)", margin: 0 }}>
        Prueba del video
      </h1>
      <p style={{ color: "var(--gris-o)", margin: 0, maxWidth: "40em" }}>
        Cada reproductor sale del uso asignado en la tabla <code>videos</code> y manda los eventos <code>vsl_*</code> a <code>/api/t</code>.
        Sin video listo se ve el póster de texto. Esta página no se indexa.
      </p>
      {USOS.map((uso, i) => (
        <section key={uso} aria-labelledby={`h-${uso}`} style={{ display: "grid", gap: 12 }}>
          <h2 id={`h-${uso}`} style={{ fontWeight: 800, margin: 0, color: "var(--mostaza)" }}>{uso}</h2>
          <VideoBunny
            video={videos[i]}
            uso={uso}
            titulo="Video de la clase"
            posterTexto={<p>¿Te pasó de estar en un evento y que otra persona hable de lo que vos sabés mejor?</p>}
          />
        </section>
      ))}
    </main>
  );
}
