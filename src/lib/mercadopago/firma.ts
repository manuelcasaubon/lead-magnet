import { createHmac, timingSafeEqual } from "node:crypto";

// Validación de la cabecera x-signature de los webhooks de Mercado Pago (docs/SPEC.md §5.3.4).
//   x-signature: ts=<timestamp>,v1=<hmac sha256 en hex>
//   manifiesto:  id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// data.id sale de la query de la URL (en minúsculas si es alfanumérico). Si falta data.id o
// x-request-id, esa parte se omite del manifiesto (así lo indica la doc de MP).
// Sin imports de "@/…" ni "server-only" para poder probarlo con `node --test`.

export type MotivoFirma = "sin_secreto" | "sin_firma" | "formato" | "vencida" | "no_coincide";
export type ResultadoFirma = { ok: true; ts: number } | { ok: false; motivo: MotivoFirma };

export function parsearFirma(header: string | null | undefined): { ts?: string; v1?: string } {
  const out: { ts?: string; v1?: string } = {};
  if (!header) return out;
  for (const parte of header.split(",")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    const k = parte.slice(0, i).trim();
    const v = parte.slice(i + 1).trim();
    if (k === "ts") out.ts = v;
    else if (k === "v1") out.v1 = v;
  }
  return out;
}

export function normalizarDataId(id: string): string {
  return /^[a-z0-9]+$/i.test(id) ? id.toLowerCase() : id;
}

export function armarManifiesto(p: { dataId?: string | null; requestId?: string | null; ts: string }): string {
  let m = "";
  if (p.dataId) m += `id:${normalizarDataId(p.dataId)};`;
  if (p.requestId) m += `request-id:${p.requestId};`;
  m += `ts:${p.ts};`;
  return m;
}

export function firmar(manifiesto: string, secreto: string): string {
  return createHmac("sha256", secreto).update(manifiesto).digest("hex");
}

// ts puede venir en segundos o en milisegundos: se aceptan los dos.
function tsEnMs(ts: string): number | null {
  if (!/^\d{9,14}$/.test(ts)) return null;
  const n = Number(ts);
  return ts.length >= 12 ? n : n * 1000;
}

export function validarFirma(p: {
  xSignature: string | null | undefined;
  xRequestId: string | null | undefined;
  dataId: string | null | undefined;
  secreto: string | null | undefined;
  ahoraMs?: number;
  toleranciaSeg?: number;
}): ResultadoFirma {
  if (!p.secreto) return { ok: false, motivo: "sin_secreto" };
  if (!p.xSignature) return { ok: false, motivo: "sin_firma" };
  const { ts, v1 } = parsearFirma(p.xSignature);
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return { ok: false, motivo: "formato" };
  const ms = tsEnMs(ts);
  if (ms === null) return { ok: false, motivo: "formato" };

  const esperado = Buffer.from(firmar(armarManifiesto({ dataId: p.dataId, requestId: p.xRequestId, ts }), p.secreto), "hex");
  const recibido = Buffer.from(v1.toLowerCase(), "hex");
  if (esperado.length !== recibido.length || !timingSafeEqual(esperado, recibido)) return { ok: false, motivo: "no_coincide" };

  // La antigüedad se mira después de la firma: un ts adulterado nunca llega acá.
  const ahora = p.ahoraMs ?? Date.now();
  const tol = (p.toleranciaSeg ?? 300) * 1000;
  if (Math.abs(ahora - ms) > tol) return { ok: false, motivo: "vencida" };
  return { ok: true, ts: ms };
}
