#!/usr/bin/env node
// CLI mínima de SOLO LECTURA para la Graph API / Marketing API de Meta.
// Uso: node scripts/meta/meta.mjs <comando> [--json]
// Comandos: yo | cuentas | campanas | insights | pixeles | ayuda
//
// Regla: este script solo hace GET. No crea, no modifica, no gasta.
// Cualquier escritura queda fuera de este archivo y requiere confirmación explícita de Manu.

import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const envLocal = join(aqui, ".env");
if (existsSync(envLocal)) process.loadEnvFile(envLocal);

const TOKEN = process.env.META_SYSTEM_USER_TOKEN?.trim();
const VERSION = process.env.META_GRAPH_VERSION?.trim() || "v25.0";
const APP_SECRET = process.env.META_APP_SECRET?.trim();
const BUSINESS_ID = process.env.META_BUSINESS_ID?.trim();
const AD_ACCOUNT = normalizarCuenta(process.env.META_AD_ACCOUNT_ID);
const BASE = `https://graph.facebook.com/${VERSION}`;

const args = process.argv.slice(2);
const comando = args.find((a) => !a.startsWith("--")) ?? "ayuda";
const comoJson = args.includes("--json");

function normalizarCuenta(id) {
  const v = id?.trim();
  if (!v) return undefined;
  return v.startsWith("act_") ? v : `act_${v}`;
}

function cortar(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

// Único punto de salida a la red. Solo GET, a propósito.
async function get(path, params = {}) {
  if (!TOKEN) cortar("Falta META_SYSTEM_USER_TOKEN (scripts/meta/.env).");
  const url = new URL(`${BASE}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  if (APP_SECRET) {
    url.searchParams.set("appsecret_proof", createHmac("sha256", APP_SECRET).update(TOKEN).digest("hex"));
  }
  const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${TOKEN}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    cortar(`Graph API ${res.status} en ${path}: ${e.message ?? res.statusText} (code ${e.code ?? "?"}${e.error_subcode ? `/${e.error_subcode}` : ""})`);
  }
  return body;
}

// Recorre la paginación de Graph (paging.next), con tope de seguridad.
async function getTodo(path, params = {}, tope = 500) {
  const out = [];
  let after;
  do {
    const page = await get(path, { limit: "100", ...params, ...(after ? { after } : {}) });
    out.push(...(page.data ?? []));
    after = page.paging?.next ? page.paging?.cursors?.after : undefined;
  } while (after && out.length < tope);
  return out;
}

function mostrar(filas) {
  if (comoJson) return console.log(JSON.stringify(filas, null, 2));
  if (!filas.length) return console.log("(sin resultados)");
  console.table(filas);
}

const plata = (v, moneda) => (v === undefined || v === null || v === "" ? "-" : `${Number(v).toFixed(2)} ${moneda ?? ""}`.trim());
const centavos = (v) => (v ? (Number(v) / 100).toFixed(2) : "-");

function requiereCuenta() {
  if (!AD_ACCOUNT) cortar("Falta META_AD_ACCOUNT_ID (scripts/meta/.env).");
  return AD_ACCOUNT;
}

const comandos = {
  async yo() {
    const me = await get("me", { fields: "id,name" });
    const dbg = await get("debug_token", { input_token: TOKEN });
    const d = dbg.data ?? {};
    const resumen = {
      usuario: `${me.name} (${me.id})`,
      app: `${d.application ?? "?"} (${d.app_id ?? "?"})`,
      tipo: d.type,
      valido: d.is_valid,
      vence: d.expires_at ? new Date(d.expires_at * 1000).toISOString() : "nunca",
      permisos: (d.scopes ?? []).join(", "),
    };
    if (comoJson) return console.log(JSON.stringify({ me, debug: d }, null, 2));
    for (const [k, v] of Object.entries(resumen)) console.log(`${k.padEnd(9)} ${v}`);
    if (d.granular_scopes?.length) {
      console.log("\nActivos por permiso:");
      for (const g of d.granular_scopes) console.log(`  ${g.scope}: ${(g.target_ids ?? ["(todos)"]).join(", ")}`);
    }
  },

  async cuentas() {
    const campos = "id,name,account_status,currency,timezone_name,amount_spent,business{id,name}";
    const filas = await getTodo("me/adaccounts", { fields: campos });
    const estados = { 1: "ACTIVA", 2: "DESHABILITADA", 3: "SIN PAGAR", 7: "EN REVISIÓN", 9: "EN GRACIA", 101: "CERRADA" };
    mostrar(
      filas.map((c) => ({
        id: c.id,
        nombre: c.name,
        estado: estados[c.account_status] ?? c.account_status,
        moneda: c.currency,
        zona: c.timezone_name,
        gasto_historico: centavos(c.amount_spent),
        portafolio: c.business?.name ?? "-",
      })),
    );
  },

  async campanas() {
    const cuenta = requiereCuenta();
    const filas = await getTodo(`${cuenta}/campaigns`, {
      effective_status: ["ACTIVE"],
      fields: "id,name,objective,daily_budget,lifetime_budget,insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,account_currency}",
    });
    mostrar(
      filas.map((c) => {
        const i = c.insights?.data?.[0] ?? {};
        return {
          id: c.id,
          campaña: c.name,
          objetivo: c.objective,
          presupuesto_diario: centavos(c.daily_budget),
          presupuesto_total: centavos(c.lifetime_budget),
          gasto_7d: plata(i.spend, i.account_currency),
          impresiones_7d: i.impressions ?? "-",
          clics_7d: i.clicks ?? "-",
        };
      }),
    );
  },

  async insights() {
    const cuenta = requiereCuenta();
    const filas = await getTodo(`${cuenta}/insights`, {
      level: "campaign",
      date_preset: "last_7d",
      fields: "campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,account_currency",
    });
    mostrar(
      filas.map((r) => ({
        campaña: r.campaign_name,
        gasto: plata(r.spend, r.account_currency),
        impresiones: r.impressions,
        alcance: r.reach,
        clics: r.clicks,
        ctr: r.ctr ? `${Number(r.ctr).toFixed(2)}%` : "-",
        cpc: plata(r.cpc),
        cpm: plata(r.cpm),
        leads: r.actions?.find((a) => a.action_type === "lead" || a.action_type === "offsite_conversion.fb_pixel_lead")?.value ?? "-",
        compras: r.actions?.find((a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase")?.value ?? "-",
      })),
    );
  },

  async pixeles() {
    const campos = "id,name,last_fired_time,is_unavailable,creation_time";
    const origen = BUSINESS_ID ? `${BUSINESS_ID}/owned_pixels` : `${requiereCuenta()}/adspixels`;
    const filas = await getTodo(origen, { fields: campos });
    mostrar(
      filas.map((p) => ({
        id: p.id,
        nombre: p.name,
        ultimo_evento: p.last_fired_time ?? "nunca",
        hace: p.last_fired_time ? hace(p.last_fired_time) : "-",
        disponible: p.is_unavailable ? "no" : "sí",
      })),
    );
  },

  ayuda() {
    console.log(`CLI de solo lectura para Meta (Graph API ${VERSION})

  node scripts/meta/meta.mjs yo         Token: GET /me + /debug_token (app, vencimiento, permisos)
  node scripts/meta/meta.mjs cuentas    Cuentas publicitarias a las que llega el token
  node scripts/meta/meta.mjs campanas   Campañas activas de META_AD_ACCOUNT_ID con gasto de 7 días
  node scripts/meta/meta.mjs insights   Insights por campaña, últimos 7 días
  node scripts/meta/meta.mjs pixeles    Píxeles con su último evento

  --json   salida en JSON (para jq)`);
  },
};

function hace(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `${min} min`;
  if (min < 60 * 48) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} días`;
}

const fn = comandos[comando];
if (!fn) cortar(`Comando desconocido: ${comando}. Probá "ayuda".`);
await fn();
