// Edge Function "clarity-sync": trae las métricas de Microsoft Clarity (Data Export API) y las guarda en
// public.clarity_insights para el panel. La llama pg_cron una vez por día con x-cron-secret (Vault).
// La API permite ~10 consultas por día por proyecto: acá se hacen 3 (totales, por URL y por fuente).
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
const DIMENSIONES: (string | null)[] = [null, "URL", "Source"];

Deno.serve(async (req) => {
  const secreto = req.headers.get("x-cron-secret") ?? "";
  const { data: ok } = await db.rpc("check_cron_secret", { p_secret: secreto });
  if (!ok) return json({ ok: false }, 401);

  const token = Deno.env.get("CLARITY_API_TOKEN");
  if (!token) return json({ ok: false, error: "falta CLARITY_API_TOKEN" }, 500);
  const numDays = 1;
  const resultados: Record<string, string> = {};
  for (const dim of DIMENSIONES) {
    const url = new URL("https://www.clarity.ms/export-data/api/v1/project-live-insights");
    url.searchParams.set("numOfDays", String(numDays));
    if (dim) url.searchParams.set("dimension1", dim);
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(20_000) });
      const data = await r.json().catch(() => null);
      if (!r.ok || data === null) { resultados[dim ?? "total"] = `error ${r.status}`; continue; }
      const { error } = await db.from("clarity_insights").insert({ num_days: numDays, dimension: dim, data });
      resultados[dim ?? "total"] = error ? `db: ${error.message}` : "ok";
    } catch (e) {
      resultados[dim ?? "total"] = e instanceof Error ? e.message : "error";
    }
  }
  return json({ ok: true, resultados });
});
