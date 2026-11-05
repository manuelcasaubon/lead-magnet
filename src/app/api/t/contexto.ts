import "server-only";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { NombreEvento } from "@/lib/track/catalogo";

// Contexto anónimo de una request (cookies del middleware). Lo usan /api/t y /api/lead.
// Nunca lleva datos personales.
export type Contexto = {
  vid: string | null;
  sid: string | null;
  utm: Record<string, string>;
  experiments: Record<string, string>;
  referrer: string | null;
  source: string;
  device: "mobile" | "tablet" | "desktop";
  bot: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UTM_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer"]);

function uuidOrNull(v: string | undefined): string | null {
  return v && UUID.test(v) ? v.toLowerCase() : null;
}

// Cookie con JSON codificado con encodeURIComponent → objeto plano de strings (filtrado).
function cookieJson(raw: string | undefined, keyOk: (k: string) => boolean, max = 120): Record<string, string> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(decodeURIComponent(raw));
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (keyOk(k) && typeof v === "string" && v) out[k] = v.slice(0, max);
    }
    return out;
  } catch {
    return {};
  }
}

export function hostDe(u: string | null | undefined): string | null {
  if (!u) return null;
  try { return new URL(u).host; } catch { return null; }
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|curl|wget|python-requests|axios|node-fetch|go-http/i;

export function contexto(req: NextRequest): Contexto {
  const ua = req.headers.get("user-agent") ?? "";
  const utm = cookieJson(req.cookies.get("utm")?.value, (k) => UTM_KEYS.has(k));
  // La cookie "exp" la agrega S7: {exp_key: variant_key}.
  const experiments = cookieJson(req.cookies.get("exp")?.value, (k) => /^[a-z0-9_-]{2,40}$/.test(k), 40);
  const pageHost = hostDe(req.headers.get("referer"));
  const ownHost = req.nextUrl.host;
  const referrer = utm.referrer ?? (pageHost && pageHost !== ownHost ? pageHost : null);
  const source = utm.utm_source || referrer || "directo";
  return {
    vid: uuidOrNull(req.cookies.get("vid")?.value),
    sid: uuidOrNull(req.cookies.get("sid")?.value),
    utm,
    experiments,
    referrer,
    source: source.slice(0, 120),
    device: /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop",
    bot: !ua || BOT.test(ua),
  };
}

// Evento de servidor (lead_created, checkout_start, payment_*). No tira: el tracking nunca rompe el flujo.
export async function eventoServidor(
  name: NombreEvento,
  ctx: Contexto,
  opts: { props?: Record<string, Json>; path?: string | null; personId?: string | null } = {},
): Promise<void> {
  if (!ctx.vid) return;
  const { error } = await supabaseAdmin().from("events").insert({
    visitor_id: ctx.vid,
    session_id: ctx.sid,
    person_id: opts.personId ?? null,
    name,
    path: opts.path ?? null,
    props: opts.props ?? {},
    source: ctx.source,
    utm: Object.keys(ctx.utm).length ? ctx.utm : null,
    experiments: ctx.experiments,
  });
  if (error) console.error(`[track] ${name}: ${error.message}`);
}
