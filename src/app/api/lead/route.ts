import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { contexto, eventoServidor, hostDe } from "@/app/api/t/contexto";
import {
  CONSENT_TEXT, LIMITES, RE_EMAIL, RE_INSTAGRAM, RE_TELEFONO, RE_URL, separarMarca, type Campo,
} from "@/components/form/reglas";

// POST /api/lead — guarda el lead (contrato: docs/SPEC.md §2 y §5.2).
// Responde { ok: true } o { ok: false, code, field? }. Nunca devuelve datos personales.
export const runtime = "nodejs";

const opcional = (max: number, re?: RegExp) =>
  z.string().trim().max(max, "too_long")
    .refine((v) => !v || !re || re.test(v), "invalid")
    .optional().transform((v) => v || undefined);

const Lead = z.object({
  // "mail": paso 1 de la versión de dos pasos (solo el mail). "final": el envío completo.
  paso: z.enum(["mail", "final"]).default("final"),
  variante: z.enum(["un-paso", "dos-pasos"]).optional(),
  email: z.string().trim().toLowerCase().min(1, "required").max(LIMITES.email, "too_long").regex(RE_EMAIL, "invalid"),
  nombre: opcional(LIMITES.nombre),
  telefono: opcional(LIMITES.telefono, RE_TELEFONO),
  marca: opcional(LIMITES.marca).refine((v) => !v || RE_INSTAGRAM.test(v) || RE_URL.test(v), "invalid"),
  objetivo: opcional(LIMITES.objetivo),
  consentimiento: z.boolean().default(false),
  // Trampa para bots: campo oculto que una persona nunca completa.
  website: z.string().optional(),
}).superRefine((d, ctx) => {
  if (d.paso === "final" && !d.nombre) ctx.addIssue({ code: "custom", path: ["nombre"], message: "required" });
});

// Límite simple: 5 envíos por minuto por vid (en memoria de la instancia; alcanza contra el abuso casual).
const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 5;
const envios = new Map<string, number[]>();
function limitado(clave: string): boolean {
  const ahora = Date.now();
  const recientes = (envios.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MS);
  recientes.push(ahora);
  envios.set(clave, recientes);
  if (envios.size > 5000) for (const [k, ts] of envios) if (ts.every((t) => ahora - t >= VENTANA_MS)) envios.delete(k);
  return recientes.length > MAX_POR_VENTANA;
}

const CAMPOS: Record<string, Campo> = { email: "email", nombre: "nombre", telefono: "telefono", marca: "marca", objetivo: "objetivo" };
const falla = (status: number, code: string, field?: Campo) =>
  NextResponse.json(field ? { ok: false, code, field } : { ok: false, code }, { status });

export async function POST(req: NextRequest) {
  const ctx = contexto(req);
  const clave = ctx.vid ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
  if (limitado(clave)) return falla(429, "rate_limited");

  let body: unknown;
  try { body = await req.json(); } catch { return falla(400, "invalid_json"); }
  const r = Lead.safeParse(body);
  if (!r.success) {
    const issue = r.error.issues[0];
    const campo = CAMPOS[String(issue?.path[0])];
    return falla(422, ["required", "invalid", "too_long"].includes(issue?.message) ? issue.message : "invalid", campo);
  }
  const d = r.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot: se le dice que sí y no se guarda nada

  const marca = separarMarca(d.marca ?? "");
  const path = hostDe(req.headers.get("referer")) ? new URL(req.headers.get("referer")!).pathname : null;

  try {
    const { data, error } = await supabaseAdmin().rpc("upsert_lead", {
      p_email: d.email,
      p_name: d.nombre,
      p_phone: d.telefono?.replace(/\s+/g, " "),
      p_instagram: marca.instagram,
      p_brand_url: marca.brandUrl,
      p_goal: d.objetivo,
      p_source: "form",
      p_consent: d.consentimiento,
      p_consent_text: d.consentimiento ? CONSENT_TEXT : undefined,
      p_visitor_id: ctx.vid ?? undefined,
      p_utm: ctx.utm,
      p_referrer: ctx.referrer ?? undefined,
      p_path: path ?? undefined,
      p_experiments: ctx.experiments,
    });
    if (error || !data?.[0]) {
      if (error?.message.includes("invalid_email")) return falla(422, "invalid", "email");
      console.error(`[api/lead] upsert_lead: ${error?.message ?? "sin datos"}`);
      return falla(500, "server_error");
    }
    const { person_id, is_new } = data[0];
    await eventoServidor("lead_created", ctx, {
      personId: person_id,
      path,
      props: { source: "form", step: d.paso, variant: d.variante ?? "sin_variante", is_new, consent: d.consentimiento },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[api/lead] ${(err as Error).message}`);
    return falla(500, "server_error");
  }
}
