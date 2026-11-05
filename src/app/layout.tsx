import type { Metadata, Viewport } from "next";
import { Poppins, EB_Garamond } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "800", "900"], variable: "--font-poppins", display: "swap" });
const garamond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal"], variable: "--font-garamond", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Cómo destacar con tu marca personal en 2027 · Manu Casaubon",
  description: "Clase en vivo presencial de 3 horas. Miércoles 18/11, de 18 a 21 h, en Palermo Soho. De que nadie te conozca a que te llamen a vos.",
};

export const viewport: Viewport = { themeColor: "#2d2828", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${poppins.variable} ${garamond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
