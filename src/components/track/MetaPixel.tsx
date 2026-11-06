"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Pixel de Meta ("Comunica tu marca Web") en las páginas públicas: PageView en cada vista.
// El Lead lo dispara el formulario con el mismo eventID que manda el servidor por la Conversions API
// (deduplicación). Purchase y Schedule van solo por la Conversions API (el comprobante lleva la orden en la URL
// y no se le pasa a terceros). Mismas exclusiones que Clarity.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1821219275793871";
const EXCLUIDAS = /^\/(evento\/entrada|entrada|panel|baja|prueba)(\/|$)/;

type Fbq = (...args: unknown[]) => void;
export function metaLead(eventId: string) {
  try { (window as unknown as { fbq?: Fbq }).fbq?.("track", "Lead", {}, { eventID: eventId }); } catch { /* nunca rompe */ }
}

export default function MetaPixel() {
  const path = usePathname() ?? "/";
  if (!META_PIXEL_ID || EXCLUIDAS.test(path)) return null;
  return (
    <Script id="meta-pixel" strategy="lazyOnload">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}
