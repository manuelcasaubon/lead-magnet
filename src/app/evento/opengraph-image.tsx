import { ImageResponse } from "next/og";

// Imagen para compartir /evento (1200×630): marca de Manu, título apretado y la tira con fecha y lugar.
export const alt = "Cómo destacar con tu marca personal en 2027. Clase en vivo con Manu Casaubon, miércoles 18/11 en Palermo Soho.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagen() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#2d2828", color: "#fffdf6", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#c9c2b6" }}>Manu Casaubon · Clase en vivo</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 900, lineHeight: 0.95, letterSpacing: -4, textTransform: "uppercase" }}>
            Cómo destacar con tu marca personal en 2027
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#dda51e", marginTop: 24 }}>
            De que nadie te conozca a que te llamen a vos.
          </div>
        </div>
        <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 34, fontWeight: 700, background: "#fffdf6", color: "#2d2828", padding: "14px 24px", borderRadius: 8 }}>
          Miércoles 18/11 · 18 a 21 h · Palermo Soho
        </div>
      </div>
    ),
    size,
  );
}
