"use server";

import { cookies } from "next/headers";
import { z } from "zod";
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

async function vid(deLaOrden: string | null): Promise<string | null> {
  return (await cookies()).get("vid")?.value ?? deLaOrden;
}
