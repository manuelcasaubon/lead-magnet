import { NextResponse, type NextRequest } from "next/server";
import { validarFirma } from "@/lib/mercadopago/firma";
import { procesarPago } from "@/lib/pagos/procesar";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/mp/webhook (docs/SPEC.md §5.3.7)
//  - Valida x-signature. Firma inválida → 401 y queda registrada en mp_notifications.
//  - Nunca confía en el cuerpo: solo toma el id y consulta GET /v1/payments/{id}.
//  - Avisos repetidos: mp_notifications.request_id es único; si ya se procesó, termina ahí.
//    Además apply_payment es idempotente, así que aunque MP mande otro request-id para el mismo pago, no pasa nada nuevo.
//  - Topics que no son "payment" → 200 sin hacer nada. Error inesperado → 500 para que MP reintente.

export const dynamic = "force-dynamic";

type Cuerpo = { type?: string; action?: string; data?: { id?: string | number } };

export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const cuerpo = ((await req.json().catch(() => null)) ?? {}) as Cuerpo;
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? (cuerpo.data?.id != null ? String(cuerpo.data.id) : null);
  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? cuerpo.type ?? null;
  const requestId = req.headers.get("x-request-id");

  const firma = validarFirma({
    xSignature: req.headers.get("x-signature"), xRequestId: requestId, dataId,
    secreto: process.env.MP_WEBHOOK_SECRET,
  });

  const db = supabaseAdmin();
  const fila = { request_id: requestId, topic, resource_id: dataId?.slice(0, 64) ?? null, signature_ok: firma.ok, error: firma.ok ? null : `firma: ${firma.motivo}` };

  // Registro del aviso. Si el request-id ya existe: procesado → listo; si no, se reintenta sobre la misma fila.
  let notifId: number;
  const ins = await db.from("mp_notifications").insert(fila).select("id").single();
  if (ins.error) {
    if (ins.error.code !== "23505" || !requestId) {
      console.error("mp_notifications insert", ins.error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    const { data: previa } = await db.from("mp_notifications").select("id, processed_at, signature_ok").eq("request_id", requestId).single();
    if (!previa) return NextResponse.json({ ok: false }, { status: 500 });
    if (previa.processed_at) return NextResponse.json({ ok: true, repetido: true });
    notifId = previa.id;
    if (firma.ok && !previa.signature_ok) await db.from("mp_notifications").update({ signature_ok: true, error: null }).eq("id", notifId);
  } else {
    notifId = ins.data.id;
  }

  if (!firma.ok) return NextResponse.json({ ok: false, error: "firma" }, { status: 401 });

  const cerrar = (result: string, error: string | null = null) =>
    db.from("mp_notifications").update({ result, error, processed_at: new Date().toISOString() }).eq("id", notifId);

  if (topic !== "payment" || !dataId) {
    await cerrar(`ignorado: ${topic ?? "sin topic"}`);
    return NextResponse.json({ ok: true, ignorado: true });
  }

  try {
    const r = await procesarPago(dataId);
    const result = r.ok
      ? `mp=${r.mpStatus} orden=${r.orderId ?? "-"} estado=${r.estado ?? "-"}${r.nuevo ? " nuevo" : ""}${r.codigo ? ` ${r.codigo}` : ""}`
      : `mp=${r.mpStatus} ${r.motivo}`;
    await cerrar(result.slice(0, 500));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("webhook procesarPago", dataId, msg);
    // Sin processed_at: el reintento de MP (mismo request-id) vuelve a intentar.
    await db.from("mp_notifications").update({ error: msg.slice(0, 500) }).eq("id", notifId);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
