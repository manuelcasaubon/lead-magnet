import { NextResponse, type NextRequest } from "next/server";
import { EntradaCheckout, iniciarCheckout, leerJsonCookie } from "@/lib/pagos/checkout";

// POST /api/checkout { email, name?, phone?, instagram?, brand_url?, goal?, consent?, consent_text? }
// → { url } para redirigir a Mercado Pago, o { ok:false, code } (docs/SPEC.md §2.5 y §5.3.6).
// code: sold_out | sales_closed | no_price | already_has_ticket | invalid | rate_limited | mp_error | error

export const dynamic = "force-dynamic";

// Límite simple por IP (en memoria, por instancia): frena que alguien reserve todos los lugares con mails falsos.
const golpes = new Map<string, number[]>();
function limitado(ip: string): boolean {
  const ahora = Date.now();
  const lista = (golpes.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  lista.push(ahora);
  golpes.set(ip, lista);
  if (golpes.size > 5000) golpes.clear();
  return lista.length > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limitado(ip)) return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const p = EntradaCheckout.safeParse(body);
  if (!p.success) return NextResponse.json({ ok: false, code: "invalid", field: String(p.error.issues[0]?.path[0] ?? "") }, { status: 400 });

  const r = await iniciarCheckout(p.data, {
    visitorId: req.cookies.get("vid")?.value,
    utm: leerJsonCookie(req.cookies.get("utm")?.value),
    experiments: leerJsonCookie(req.cookies.get("exp")?.value),
    referrer: req.headers.get("referer"),
    path: "/api/checkout",
  });
  if (r.ok) return NextResponse.json({ url: r.url }, { headers: { "Cache-Control": "no-store" } });

  const status = r.code === "invalid" ? 400 : r.code === "mp_error" || r.code === "error" ? 502 : 409;
  return NextResponse.json({ ok: false, code: r.code }, { status, headers: { "Cache-Control": "no-store" } });
}
