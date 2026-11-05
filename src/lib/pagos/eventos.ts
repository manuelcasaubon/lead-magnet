import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { NombreEvento } from "@/lib/track/catalogo";
import type { Json } from "@/lib/supabase/database.types";

// Eventos de servidor del flujo de pago (docs/SPEC.md §4). events.visitor_id es obligatorio:
// si no hay vid (p. ej. el webhook de una orden sin cookie), se usa uno nuevo para no perder el dato.
export async function registrarEvento(e: {
  name: NombreEvento;
  visitorId?: string | null;
  personId?: string | null;
  path?: string;
  props?: Record<string, unknown>;
  source?: string | null;
  utm?: Json | null;
  experiments?: Json | null;
}): Promise<void> {
  const { error } = await supabaseAdmin().from("events").insert({
    name: e.name,
    visitor_id: e.visitorId && esUuid(e.visitorId) ? e.visitorId : crypto.randomUUID(),
    person_id: e.personId ?? null,
    path: e.path ?? null,
    props: (e.props ?? {}) as Json,
    source: e.source ?? null,
    utm: e.utm ?? null,
    experiments: e.experiments ?? {},
  });
  if (error) console.error("registrarEvento", e.name, error.message);
}

export function esUuid(s: string | null | undefined): s is string {
  return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
