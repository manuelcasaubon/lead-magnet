"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { iniciarCheckout, leerJsonCookie } from "@/lib/pagos/checkout";
import { esUuid, registrarEvento } from "@/lib/pagos/eventos";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Acciones de /entrada. Todas reciben el id de la orden (el mismo uuid que habilita ver el comprobante).
// El perfil para la auditoría va como server action en lugar de POST /api/entrada/perfil para quedar
// dentro de las carpetas de S3 (docs/SPEC.md §0); el contrato es el mismo: { o, perfil }.

const Perfil = z.object({
  o: z.string().uuid(),
  perfil: z.string().trim().min(2, "Escribí tu usuario o tu web.").max(200, "Es muy largo."),
});

export type EstadoPerfil = { ok: boolean; error?: string; perfil?: string };

export async function guardarPerfil(_prev: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const p = Perfil.safeParse({ o: form.get("o"), perfil: form.get("perfil") });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Revisá el dato." };

  const db = supabaseAdmin();
  const { data: orden } = await db.from("orders").select("id, status, person_id, visitor_id").eq("id", p.data.o).maybeSingle();
  if (!orden || orden.status !== "approved") return { ok: false, error: "No encontramos una entrada aprobada para este link." };

  const perfil = normalizarPerfil(p.data.perfil);
  const { data: t, error } = await db.from("tickets").update({ audit_profile: perfil })
    .eq("order_id", orden.id).neq("status", "cancelled").select("id").maybeSingle();
  if (error || !t) return { ok: false, error: "No se pudo guardar. Probá de nuevo en un rato." };

  await registrarEvento({ name: "audit_profile_sent", visitorId: await vid(orden.visitor_id), personId: orden.person_id, path: "/evento/entrada" });
  return { ok: true, perfil };
}

// "@usuario", "usuario", "instagram.com/usuario" o una web: se guarda tal cual, solo prolijo.
function normalizarPerfil(s: string): string {
  const t = s.trim().replace(/\s+/g, "");
  const ig = t.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i);
  if (ig) return `@${ig[1]}`;
  if (/^@?[A-Za-z0-9._]{1,30}$/.test(t) && !t.includes("..") && !/\.[a-z]{2,}$/i.test(t)) return t.startsWith("@") ? t : `@${t}`;
  return t;
}

export async function registrarDescarga(o: string): Promise<void> {
  if (!esUuid(o)) return;
  const { data: orden } = await supabaseAdmin().from("orders").select("person_id, visitor_id, status").eq("id", o).maybeSingle();
  if (!orden || orden.status !== "approved") return;
  await registrarEvento({ name: "pdf_download", visitorId: await vid(orden.visitor_id), personId: orden.person_id, path: "/evento/entrada" });
}

export type EstadoReintento = { url?: string; code?: string };

// "Reintentar": arma una preferencia nueva para la misma persona sin exponer su mail en la página.
export async function reintentarPago(o: string): Promise<EstadoReintento> {
  if (!esUuid(o)) return { code: "invalid" };
  const db = supabaseAdmin();
  const { data: orden } = await db.from("orders").select("person_id").eq("id", o).maybeSingle();
  if (!orden) return { code: "invalid" };
  const { data: p } = await db.from("people").select("email, name").eq("id", orden.person_id).single();
  if (!p) return { code: "invalid" };
  const c = await cookies();
  const r = await iniciarCheckout({ email: p.email, name: p.name ?? undefined }, {
    visitorId: c.get("vid")?.value, utm: leerJsonCookie(c.get("utm")?.value), experiments: leerJsonCookie(c.get("exp")?.value),
    referrer: (await headers()).get("referer"), path: "/evento/entrada",
  });
  return r.ok ? { url: r.url } : { code: r.code };
}

async function vid(deLaOrden: string | null): Promise<string | null> {
  return (await cookies()).get("vid")?.value ?? deLaOrden;
}
