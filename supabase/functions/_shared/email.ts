// Envío de mails (único punto de salida del proyecto desde el 6/11/26):
//  1. Solo plantillas 'approved'.  2. email_mode='test' → solo email_test_recipients.
//  3. Nadie recibe dos veces la misma plantilla (índice único); si falló, se reintenta.  4. Campaña: solo con consentimiento.
// Config no secreta en public.settings; RESEND_API_KEY en los secretos de Supabase.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type Vars = Record<string, string | number | null | undefined>;
// sent: salió ahora. duplicate: ya había salido antes. skipped: no corresponde mandarlo nunca (sin consentimiento,
// sin mail). pending: todavía no se puede (plantilla sin aprobar, modo test, falta config): se reintenta.
// failed: error al mandar: se reintenta.
export type Resultado = { status: "sent" | "duplicate" | "skipped" | "pending" | "failed"; error?: string };
export const resuelto = (r: Resultado) => r.status === "sent" || r.status === "duplicate" || r.status === "skipped";
const YA_SALIO = ["sent", "delivered", "opened", "clicked", "bounced", "complained"];

export const renderTexto = (tpl: string, vars: Vars) =>
  tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] ?? "").toString());

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderHtml(body: string, preheader?: string | null): string {
  const parrafos = body.trim().split(/\n{2,}/).map((p) => {
    const html = esc(p).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) =>
      `<a href="${u}" style="color:#d0443f;font-weight:600">${t}</a>`).replace(/\n/g, "<br>");
    return `<p style="margin:0 0 16px">${html}</p>`;
  }).join("");
  const pre = preheader ? `<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>` : "";
  return `<!doctype html><html lang="es"><body style="margin:0;background:#fffdf6">${pre}
<div style="max-width:560px;margin:0 auto;padding:28px 20px;font:16px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2d2828">
${parrafos}</div></body></html>`;
}

// "Hola, Ana, ¿cómo estás?" o "Hola, ¿cómo estás?" si no hay nombre.
export const saludo = (nombre?: string | null) => (nombre && nombre.trim() ? `Hola, ${nombre.trim()}, ¿cómo estás?` : "Hola, ¿cómo estás?");

export async function enviarPlantilla(db: SupabaseClient, o: {
  templateKey: string; to: string; personId?: string | null; vars: Vars; unsubscribeUrl?: string;
}): Promise<Resultado> {
  const to = o.to.trim().toLowerCase();
  const { data: s } = await db.from("settings").select("email_mode,email_test_recipients,email_from,email_reply_to").eq("id", 1).single();
  const { data: tpl } = await db.from("email_templates").select("*").eq("key", o.templateKey).maybeSingle();
  if (!tpl) return { status: "failed", error: `no existe la plantilla ${o.templateKey}` };
  if (tpl.status !== "approved") return { status: "pending", error: "plantilla sin aprobar" };

  if (tpl.kind === "campaign") {
    if (!o.unsubscribeUrl) return { status: "failed", error: "campaña sin link de baja" };
    if (o.personId) {
      const { data: p } = await db.from("people").select("marketing_consent,unsubscribed_at,email_status").eq("id", o.personId).single();
      if (!p || !p.marketing_consent || p.unsubscribed_at || p.email_status !== "ok") return { status: "skipped", error: "sin consentimiento" };
    }
  }

  // Modo test: no se registra nada, así cuando pase a "live" el mail sale.
  const prueba = (s?.email_mode ?? "test") !== "live";
  const permitidos: string[] = (s?.email_test_recipients ?? []).map((x: string) => x.toLowerCase());
  if (prueba && !permitidos.includes(to)) return { status: "pending", error: "email_mode=test" };

  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { status: "pending", error: "falta RESEND_API_KEY" };

  // Un registro por (plantilla, mail, persona). Si ya existe y no salió (falló antes), se reintenta sobre ese registro.
  let sendId: string;
  let reintento = false;
  const ins = await db.from("email_sends")
    .insert({ template_id: tpl.id, template_version: tpl.version, person_id: o.personId ?? null, to_email: to })
    .select("id").single();
  if (ins.error) {
    if (ins.error.code !== "23505") return { status: "failed", error: ins.error.message };
    let q = db.from("email_sends").select("id,status").eq("template_id", tpl.id).eq("to_email", to);
    q = o.personId ? q.eq("person_id", o.personId) : q.is("person_id", null);
    const { data: previo } = await q.maybeSingle();
    if (!previo) return { status: "failed", error: "registro de envío no encontrado" };
    if (YA_SALIO.includes(previo.status)) return { status: "duplicate" };
    sendId = previo.id;
    reintento = true;
    await db.from("email_sends").update({ status: "queued", error: null, template_version: tpl.version }).eq("id", sendId);
  } else {
    sendId = ins.data.id;
  }

  const vars = { ...o.vars, link_baja: o.unsubscribeUrl ?? "" };
  const subject = renderTexto(tpl.subject, vars);
  const body = renderTexto(tpl.body, vars);
  const headers: Record<string, string> = {};
  if (o.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${o.unsubscribeUrl.replace("/baja?", "/api/baja?")}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`, "Content-Type": "application/json",
      // En un reintento la clave cambia: Resend devolvería la misma respuesta fallida si se repite.
      "Idempotency-Key": reintento ? `${sendId}-${Date.now()}` : sendId,
    },
    body: JSON.stringify({
      from: s?.email_from ?? "Manu Casaubon <manu@info.comunicatumarca.com>", to: [to],
      reply_to: s?.email_reply_to ?? undefined, subject,
      html: renderHtml(body, tpl.preheader ? renderTexto(tpl.preheader, vars) : null), text: body, headers,
      tags: [{ name: "template", value: tpl.key.replace(/[^a-zA-Z0-9_-]/g, "_") }],
    }),
  });
  const json = await r.json().catch(() => ({})) as { id?: string; message?: string };
  if (!r.ok || !json.id) {
    await db.from("email_sends").update({ status: "failed", error: json.message ?? `HTTP ${r.status}` }).eq("id", sendId);
    return { status: "failed", error: json.message ?? `HTTP ${r.status}` };
  }
  await db.from("email_sends").update({ status: "sent", resend_id: json.id, sent_at: new Date().toISOString(), error: null }).eq("id", sendId);
  return { status: "sent" };
}
