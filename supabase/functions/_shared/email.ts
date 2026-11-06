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

// Estilo de la marca (mismo lenguaje que comunicatumarca.com): crema, oscuro, rojo y Poppins negrita.
const C = { oscuro: "#2d2828", crema: "#fffdf6", rojo: "#d0443f", mostaza: "#dda51e", gris: "#5e5757", borde: "#ece6da", blanco: "#ffffff" };
const SANS = "'Poppins','Helvetica Neue',Helvetica,Arial,sans-serif";

// Marcas simples en el cuerpo de la plantilla (así el texto se edita como texto plano desde el panel):
//   "# Título con **palabra**"   → título grande; lo que va entre ** sale en rojo.
//   "[Texto](https://…)" solo     → botón rojo.
//   Líneas "Clave: valor" (2 o más) → tarjeta de datos.
//   **texto** en un párrafo        → negrita en rojo.  [texto](url) en un párrafo → link.
const enLinea = (t: string) =>
  t.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.rojo};font-weight:800">$1</strong>`)
   .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, `<a href="$2" style="color:${C.rojo};font-weight:700;text-decoration:underline">$1</a>`)
   .replace(/\n/g, "<br>");

function bloque(p: string): string {
  const e = esc(p.trim());
  if (e.startsWith("# ")) {
    const t = e.slice(2).replace(/\*\*(.+?)\*\*/g, `<span style="color:${C.rojo};white-space:nowrap">$1</span>`);
    return `<h1 style="margin:0 0 20px;font-family:${SANS};font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-0.03em;color:${C.oscuro}">${t}</h1>`;
  }
  const boton = e.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
  if (boton) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${C.rojo}">
<a href="${boton[2]}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:700;color:${C.blanco};text-decoration:none;border-radius:999px">${boton[1]}</a></td></tr></table>`;
  }
  const lineas = e.split("\n");
  const filas = lineas.map((l) => l.match(/^([^:]{1,24}):\s+(.+)$/));
  if (lineas.length >= 2 && filas.every(Boolean)) {
    const trs = filas.map((m, i) => `<tr><td style="padding:12px 18px;${i ? `border-top:1px solid ${C.borde};` : ""}font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${C.gris};width:34%;vertical-align:top">${m![1]}</td>
<td style="padding:12px 18px;${i ? `border-top:1px solid ${C.borde};` : ""}font-family:${SANS};font-size:15px;font-weight:600;color:${C.oscuro}">${enLinea(m![2])}</td></tr>`).join("");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:${C.blanco};border:1px solid ${C.borde};border-radius:14px;border-collapse:separate">${trs}</table>`;
  }
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.oscuro}">${enLinea(e)}</p>`;
}

export function renderHtml(body: string, preheader?: string | null): string {
  const contenido = body.trim().split(/\n{2,}/).map(bloque).join("\n");
  const pre = preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>` : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${C.crema}">${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.crema}"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="background:${C.oscuro};padding:16px 24px;font-family:${SANS};font-size:15px;font-weight:800;color:${C.crema};letter-spacing:-0.02em">CTM<span style="color:${C.rojo}">.</span>
<span style="float:right;font-size:12px;font-weight:600;color:${C.mostaza};letter-spacing:0">Manu Casaubon</span></td></tr>
<tr><td style="padding:32px 24px 16px">${contenido}</td></tr>
<tr><td style="background:${C.oscuro};padding:20px 24px;font-family:${SANS};font-size:12px;line-height:1.5;color:#c9c2b6">
Comunica Tu Marca · Manu Casaubon<br>¿Dudas? Respondé este mail y te contesto yo.</td></tr>
</table></td></tr></table></body></html>`;
}

// Versión de texto plano: sin las marcas de formato.
export const textoPlano = (body: string) =>
  body.replace(/^# /gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1: $2");

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
      html: renderHtml(body, tpl.preheader ? renderTexto(tpl.preheader, vars) : null), text: textoPlano(body), headers,
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
