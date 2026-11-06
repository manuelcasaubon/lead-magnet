import type { Metadata, Viewport } from "next";
import { Poppins, EB_Garamond, Caveat } from "next/font/google";
import "./globals.css";
import Clarity from "@/components/track/Clarity";
import MetaPixel from "@/components/track/MetaPixel";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "800", "900"], variable: "--font-poppins", display: "swap" });
const garamond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal"], variable: "--font-garamond", display: "swap" });
// Letra a mano para los pasos y acentos (estética de comunicatumarca.com/v2).
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Manu Casaubon · Comunica Tu Marca", template: "%s · Manu Casaubon" },
  description: "Ayudo a personas que saben mucho de un tema a comunicarlo, en redes y arriba del escenario, siendo ellas mismas.",
};

export const viewport: Viewport = { themeColor: "#2d2828", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${poppins.variable} ${garamond.variable} ${caveat.variable}`}>
      <body>
        {children}
        <Clarity />
        <MetaPixel />
      </body>
    </html>
  );
}
