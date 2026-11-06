// Edge Function "meta-prueba": diagnóstico de la Conversions API. Solo con header x-cron-secret (Vault).
// POST { pixels?: string[] } → para cada pixel: lee su nombre con el token y manda un Lead de prueba
// (siempre con META_TEST_EVENT_CODE; sin código no manda nada). Nunca devuelve el token.
const VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v23.0";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b, null, 1), { status, headers: { "Content-Type": "application/json" } });
const sha = async (v: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v))), (b) => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: ok } = await db.rpc("check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return json({ ok: false }, 401);

  const token = Deno.env.get("META_CAPI_ACCESS_TOKEN") ?? Deno.env.get("ETA_CAPI_ACCESS_TOKEN"); // 2º: nombre mal tipeado (6/11), solo para diagnóstico
  const test = Deno.env.get("META_TEST_EVENT_CODE");
  const configurado = Deno.env.get("META_PIXEL_ID") ?? null;
  const body = await req.json().catch(() => ({})) as { pixels?: string[] };
  const pixels = [...new Set([configurado, ...(body.pixels ?? [])].filter((p): p is string => !!p && /^\d{10,20}$/.test(p)))];
  const nombres = Object.keys(Deno.env.toObject()).filter((k) => /META|CAPI|FACEBOOK|FB_|PIXEL/i.test(k)).sort();
  const out: Record<string, unknown> = { secretos_meta: nombres, META_PIXEL_ID: configurado, hay_token: !!token, test_event_code: test ?? null, pixels: {} };
  if (!token || !test) return json(out);

  for (const px of pixels) {
    const r1 = await fetch(`https://graph.facebook.com/${VERSION}/${px}?fields=id,name&access_token=${encodeURIComponent(token)}`);
    const info = await r1.json().catch(() => ({}));
    const r2 = await fetch(`https://graph.facebook.com/${VERSION}/${px}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test_event_code: test,
        data: [{
          event_name: "Lead", event_time: Math.floor(Date.now() / 1000), event_id: `prueba-${px}-${Date.now()}`,
          action_source: "website", event_source_url: "https://comunicatumarca.com/evento",
          user_data: { em: [await sha("prueba-capi@comunicatumarca.com")], country: [await sha("ar")], external_id: [await sha("prueba-capi")] },
        }],
      }),
    });
    (out.pixels as Record<string, unknown>)[px] = { lectura: { status: r1.status, body: info }, envio: { status: r2.status, body: await r2.json().catch(() => ({})) } };
  }
  return json(out);
});
