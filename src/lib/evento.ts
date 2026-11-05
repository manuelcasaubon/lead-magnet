import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Datos fijos del evento. La fuente de verdad editable es la tabla settings (panel).
export const EVENTO = {
  nombre: "Cómo destacar con tu marca personal en 2027",
  bajada: "De que nadie te conozca a que te llamen a vos.",
  fechaLarga: "Miércoles 18/11/26, de 18 a 21 h",
  fechaCorta: "Miércoles 18/11",
  horario: "18 a 21 h",
  puertas: "17:45",
  lugar: "Niceto Vega 4601, Palermo Soho, CABA",
  barrio: "Palermo Soho",
  precioUsd: 27,
  instagramDm: "https://ig.me/m/casaubon.ar?text=TALLER",
} as const;

export type Cupo = {
  sold: number; holds: number; capacity_public: number; capacity_max: number;
  left_public: number; left_max: number; sales_open: boolean; price_ars: number | null;
};

// Cupo real. "Quedan N de 30" usa left_public (siempre el número real, regla de comunicación).
export async function getCupo(): Promise<Cupo> {
  const { data, error } = await supabaseAdmin().rpc("seats_status");
  if (error || !data?.[0]) throw new Error(`seats_status: ${error?.message ?? "sin datos"}`);
  return data[0] as Cupo;
}
