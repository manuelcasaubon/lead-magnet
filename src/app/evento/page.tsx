import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { PRECIO_ARS_POR_DEFECTO } from "@/components/landing/contenido";
import Tracker from "@/components/track/Tracker";
import { EVENTO, getCupo, type Cupo } from "@/lib/evento";
import { RUTAS } from "@/lib/rutas";

// Landing de la clase del 18/11 (S1, versión A elegida por Manu el 6/11/26).
// El cupo se vuelve a leer cada minuto; si la base no responde, la página sale igual sin el número.
export const revalidate = 60;

const DESCRIPCION = "Clase en vivo presencial de 3 horas. Miércoles 18/11, de 18 a 21 h, en Palermo Soho. Salís con tu planificación 2027 y una auditoría de tu marca. 30 lugares.";

export const metadata: Metadata = {
  title: { absolute: "Cómo destacar con tu marca personal en 2027 · Clase en vivo con Manu Casaubon" },
  description: DESCRIPCION,
  alternates: { canonical: RUTAS.evento },
  openGraph: {
    type: "website",
    url: RUTAS.evento,
    locale: "es_AR",
    siteName: "Manu Casaubon · Comunica Tu Marca",
    title: "Cómo destacar con tu marca personal en 2027",
    description: "De que nadie te conozca a que te llamen a vos. Clase en vivo, miércoles 18/11 en Palermo Soho.",
  },
  twitter: { card: "summary_large_image" },
};

async function leerCupo(): Promise<Cupo | null> {
  try {
    return await getCupo();
  } catch {
    return null;
  }
}

export default async function Evento() {
  const cupo = await leerCupo();
  const precioArs = cupo?.price_ars ?? PRECIO_ARS_POR_DEFECTO;
  const agotado = cupo !== null && (!cupo.sales_open || cupo.left_public <= 0);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EVENTO.nombre,
    description: `${EVENTO.bajada} ${DESCRIPCION}`,
    startDate: "2026-11-18T18:00:00-03:00",
    endDate: "2026-11-18T21:00:00-03:00",
    doorTime: "2026-11-18T17:45:00-03:00",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    inLanguage: "es-AR",
    image: [`${site}${RUTAS.evento}/opengraph-image`],
    location: {
      "@type": "Place",
      name: EVENTO.barrio,
      address: { "@type": "PostalAddress", streetAddress: "Niceto Vega 4601", addressLocality: "Ciudad Autónoma de Buenos Aires", addressRegion: "CABA", addressCountry: "AR" },
    },
    organizer: { "@type": "Person", name: "Manu Casaubon", url: site },
    performer: { "@type": "Person", name: "Manu Casaubon" },
    offers: {
      "@type": "Offer",
      price: String(precioArs),
      priceCurrency: "ARS",
      availability: agotado ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${site}${RUTAS.evento}`,
      validThrough: "2026-11-18T18:00:00-03:00",
    },
    maximumAttendeeCapacity: 30,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Landing cupo={cupo} precioArs={precioArs} agotado={agotado} />
      <Tracker />
    </>
  );
}
