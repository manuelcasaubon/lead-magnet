import { NextResponse, type NextRequest } from "next/server";

// Identidad anónima del visitante, sin datos personales:
//  - vid: id de visitante (1 año). Es la llave del A/B (variante fija por visitante) y del tracking.
//  - sid: id de sesión (30 min de inactividad).
//  - utm: primera atribución con UTM y referrer (30 días), para guardar el origen del lead.
// Se pasan también como headers de la request para que el server component los lea en la misma visita.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  const vid = req.cookies.get("vid")?.value ?? crypto.randomUUID();
  const sid = req.cookies.get("sid")?.value ?? crypto.randomUUID();
  headers.set("x-vid", vid);
  headers.set("x-sid", sid);

  const url = req.nextUrl;
  let utmCookie = req.cookies.get("utm")?.value;
  const utm: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = url.searchParams.get(k);
    if (v) utm[k] = v.slice(0, 120);
  }
  if (Object.keys(utm).length > 0 || !utmCookie) {
    const ref = req.headers.get("referer");
    const refHost = ref ? safeHost(ref) : null;
    if (refHost && refHost !== url.host) utm.referrer = refHost;
    if (Object.keys(utm).length > 0) utmCookie = encodeURIComponent(JSON.stringify(utm));
  }
  if (utmCookie) headers.set("x-utm", utmCookie);

  const res = NextResponse.next({ request: { headers } });
  const secure = url.protocol === "https:";
  res.cookies.set("vid", vid, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure, path: "/" });
  res.cookies.set("sid", sid, { maxAge: 60 * 30, sameSite: "lax", secure, path: "/" });
  if (utmCookie) res.cookies.set("utm", utmCookie, { maxAge: 60 * 60 * 24 * 30, sameSite: "lax", secure, path: "/" });
  return res;
}

function safeHost(u: string): string | null {
  try { return new URL(u).host; } catch { return null; }
}

export const config = {
  // Solo páginas: no APIs, assets ni el panel.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|panel|.*\\.(?:png|jpg|jpeg|svg|webp|mp4|pdf|ico|txt|xml)$).*)"],
};
