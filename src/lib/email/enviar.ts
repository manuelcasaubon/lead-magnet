import "server-only";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

// Único punto de salida de mails (contrato: docs/SPEC.md §6). Reglas que garantiza:
//  1. Solo se manda una plantilla con status 'approved' (cada mail se aprueba antes de salir).
//  2. EMAIL_MODE=test: solo a EMAIL_TEST_RECIPIENTS; el resto queda 'skipped'.
//  3. Nadie recibe dos veces la misma plantilla (unique template_id + to_email).
//  4. Campaña: no se manda a quien se dio de baja, rebotó o se quejó.
//  5. Todo queda en email_sends con el id de Resend para medir aperturas, clics, rebotes y bajas.

export type Vars = Record<string, string | number | null | undefined>;

export function renderTexto(tpl: string, vars: Vars): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] ?? "").toString());
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Cuerpo en texto plano con párrafos separados por línea en blanco y links [texto](url).
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

export type Resultado = { status: "sent" | "skipped" | "failed" | "duplicate"; resendId?: string; error?: string };

export async function enviarPlantilla(opts: {
  templateKey: string;
  to: string;
  personId?: string | null;
  vars: Vars;
  unsubscribeUrl?: string;     // obligatorio en campaña
}): Promise<Resultado> {
  const db = supabaseAdmin();
  const to = opts.to.trim().toLowerCase();

  const { data: tpl } = await db.from("email_templates").select("*").eq("key", opts.templateKey).maybeSingle();
  if (!tpl) return { status: "failed", error: `no existe la plantilla ${opts.templateKey}` };
  if (tpl.status !== "approved") return { status: "skipped", error: "plantilla sin aprobar" };

  if (tpl.kind === "campaign") {
    if (!opts.unsubscribeUrl) return { status: "failed", error: "campaña sin link de baja" };
    if (opts.personId) {
      const { data: p } = await db.from("people").select("marketing_consent,unsubscribed_at,email_status").eq("id", opts.personId).single();
      if (!p || !p.marketing_consent || p.unsubscribed_at || p.email_status !== "ok") return { status: "skipped", error: "sin consentimiento o dado de baja" };
    }
  }

  const { data: send, error: insErr } = await db.from("email_sends")
    .insert({ template_id: tpl.id, template_version: tpl.version, person_id: opts.personId ?? null, to_email: to })
    .select().single();
  if (insErr) {
    if (insErr.code === "23505") return { status: "duplicate" };
    return { status: "failed", error: insErr.message };
  }

  if (env.emailMode() === "test" && !env.emailTestRecipients().includes(to)) {
    await db.from("email_sends").update({ status: "skipped", error: "EMAIL_MODE=test" }).eq("id", send.id);
    return { status: "skipped", error: "EMAIL_MODE=test" };
  }

  const vars = { ...opts.vars, link_baja: opts.unsubscribeUrl ?? "" };
  const subject = renderTexto(tpl.subject, vars);
  const body = renderTexto(tpl.body, vars);
  const headers: Record<string, string> = {};
  if (opts.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl.replace("/baja?", "/api/baja?")}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendApiKey()}`, "Content-Type": "application/json", "Idempotency-Key": send.id },
    body: JSON.stringify({
      from: env.emailFrom(), to: [to], reply_to: env.emailReplyTo(), subject,
      html: renderHtml(body, tpl.preheader ? renderTexto(tpl.preheader, vars) : null), text: body, headers,
      tags: [{ name: "template", value: tpl.key.replace(/[^a-zA-Z0-9_-]/g, "_") }],
    }),
  });
  const json = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!r.ok || !json.id) {
    await db.from("email_sends").update({ status: "failed", error: json.message ?? `HTTP ${r.status}` }).eq("id", send.id);
    return { status: "failed", error: json.message ?? `HTTP ${r.status}` };
  }
  await db.from("email_sends").update({ status: "sent", resend_id: json.id, sent_at: new Date().toISOString() }).eq("id", send.id);
  return { status: "sent", resendId: json.id };
}

export type Plantilla = Tables<"email_templates">;
