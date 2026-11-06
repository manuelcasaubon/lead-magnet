import { type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { EVENTOS, type NombreEvento } from "@/lib/track/catalogo";
import { contexto } from "./contexto";

// POST /api/t — tracking por lotes (contrato: docs/SPEC.md §4). Siempre responde 204.
export const runtime = "nodejs";

// Estos los registra solo el servidor: el navegador no puede inventarlos.
const SOLO_SERVIDOR = new Set<NombreEvento>([
  "lead_created", "checkout_start", "payment_approved", "payment_pending", "payment_rejected",
]);
// Defensa extra: claves que podrían traer datos personales se descartan aunque el cliente las mande.
const CLAVES_PROHIBIDAS = /mail|name|nombre|phone|tel|whats|instagram|value|valor|dni|address/i;

const Lote = z.object({
  events: z.array(z.object({
    name: z.string().max(41),
    props: z.record(z.string(), z.unknown()).optional(),
    path: z.string().max(300).optional(),
    ts: z.number().optional(),
  })).max(50),
});

const nada = () => new Response(null, { status: 204 });

function limpiarProps(props: Record<string, unknown> | undefined): Record<string, Json> | null {
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(props ?? {})) {
    if (CLAVES_PROHIBIDAS.test(k) || !/^[a-z][a-z0-9_]{0,30}$/i.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 200);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  return JSON.stringify(out).length <= 2048 ? out : null;
}

function soloPath(p: string | undefined): string | null {
  if (!p) return null;
  // Solo el pathname: sin query (puede traer tokens) ni hash.
  return p.split(/[?#]/)[0].slice(0, 200) || null;
}

export async function POST(req: NextRequest) {
  const ctx = contexto(req);
  if (ctx.bot || !ctx.vid) return nada();

  const raw = await req.text();
  if (raw.length > 64_000) return nada();
  let parsed;
  try { parsed = Lote.safeParse(JSON.parse(raw)); } catch { return nada(); }
  if (!parsed.success) return nada();

  const filas = parsed.data.events.flatMap((e) => {
    if (!(e.name in EVENTOS) || SOLO_SERVIDOR.has(e.name as NombreEvento)) return [];
    const props = limpiarProps(e.props);
    if (!props) return [];
    return [{
      visitor_id: ctx.vid!,
      session_id: ctx.sid,
      name: e.name,
      path: soloPath(e.path),
      props,
      source: ctx.source,
      utm: Object.keys(ctx.utm).length ? ctx.utm : null,
      experiments: ctx.experiments,
    }];
  });
  if (filas.length === 0) return nada();

  try {
    const db = supabaseAdmin();
    // Visitante (alta o last_seen_at, sin pisar la primera atribución) y eventos, en paralelo.
    const [v, { error }] = await Promise.all([
      db.rpc("touch_visitor", {
        p_id: ctx.vid!, p_referrer: ctx.referrer ?? "", p_path: filas[0].path ?? "",
        p_utm: ctx.utm as Json, p_device: ctx.device,
      }),
      db.from("events").insert(filas),
    ]);
    if (v.error) console.error(`[api/t] touch_visitor: ${v.error.message}`);
    if (error) console.error(`[api/t] ${error.message}`);
  } catch (err) {
    // Sin claves en local o base caída: el tracking nunca rompe la página.
    console.error(`[api/t] ${(err as Error).message}`);
  }
  return nada();
}
