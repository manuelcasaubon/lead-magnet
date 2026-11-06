"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Microsoft Clarity (mapas de calor y grabaciones de sesión) en las páginas públicas.
// El id de proyecto es público (va en el HTML de todas formas): no es una clave secreta.
// No se carga donde hay datos personales en pantalla (comprobante, panel, baja) ni en páginas de prueba.
// Clarity enmascara los campos de formulario por defecto (modo "Balanced"); conviene dejarlo así o en "Strict".
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "z96epwr8ri";
const EXCLUIDAS = /^\/(evento\/entrada|entrada|panel|baja|prueba)(\/|$)/;

export default function Clarity() {
  const path = usePathname() ?? "/";
  if (!CLARITY_ID || EXCLUIDAS.test(path)) return null;
  return (
    <Script id="ms-clarity" strategy="lazyOnload">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
