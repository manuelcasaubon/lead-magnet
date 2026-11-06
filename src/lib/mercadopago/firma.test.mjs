// Tests unitarios de la firma del webhook de Mercado Pago.
// Correr con:  node --test --experimental-strip-types src/lib/mercadopago/firma.test.mjs
// Los vectores se armaron a mano y se verificaron con:
//   printf '%s' 'id:123456789;request-id:bb56a2f1-6aae-46ac-982e-9dcd3581d08e;ts:1704908010;' \
//     | openssl dgst -sha256 -hmac 'secreto-de-prueba'
import { test } from "node:test";
import assert from "node:assert/strict";
import { armarManifiesto, parsearFirma, validarFirma } from "./firma.ts";

const SECRETO = "secreto-de-prueba";
const REQ = "bb56a2f1-6aae-46ac-982e-9dcd3581d08e";
const TS = "1704908010";
const V1 = "d0e223fdbac489fb4f4578c32ca393d5982555088d0ccfed8122b82d685c3145";
const AHORA = 1704908010 * 1000 + 60_000; // 1 min después

const base = { xSignature: `ts=${TS},v1=${V1}`, xRequestId: REQ, dataId: "123456789", secreto: SECRETO, ahoraMs: AHORA };

test("manifiesto con el formato de MP", () => {
  assert.equal(armarManifiesto({ dataId: "123456789", requestId: REQ, ts: TS }), `id:123456789;request-id:${REQ};ts:${TS};`);
});

test("data.id alfanumérico va en minúsculas", () => {
  assert.equal(armarManifiesto({ dataId: "ABC123xyz", requestId: "req-1", ts: TS }), `id:abc123xyz;request-id:req-1;ts:${TS};`);
  const r = validarFirma({ ...base, dataId: "ABC123xyz", xRequestId: "req-1",
    xSignature: `ts=${TS},v1=658ad02307042e3e8782ba7f7eb3675bf2b865460b4d00291f14392678977f83` });
  assert.equal(r.ok, true);
});

test("sin data.id se omite esa parte", () => {
  const r = validarFirma({ ...base, dataId: null, xRequestId: "req-1",
    xSignature: `ts=${TS},v1=ac6a696f1dfedf3274639b822cf50f9e0645b6b61dc86cd5ee14da4a6636d624` });
  assert.equal(r.ok, true);
});

test("parsea con espacios y en otro orden", () => {
  assert.deepEqual(parsearFirma(` v1=${V1} , ts=${TS} `), { ts: TS, v1: V1 });
});

test("firma válida", () => {
  assert.deepEqual(validarFirma(base), { ok: true, ts: Number(TS) * 1000 });
});

test("v1 en mayúsculas también vale", () => {
  assert.equal(validarFirma({ ...base, xSignature: `ts=${TS},v1=${V1.toUpperCase()}` }).ok, true);
});

test("ts en milisegundos", () => {
  // Con ts en ms el manifiesto cambia, así que la firma de arriba no sirve: debe fallar por no coincidir, no por formato.
  const r = validarFirma({ ...base, xSignature: `ts=${TS}000,v1=${V1}` });
  assert.deepEqual(r, { ok: false, motivo: "no_coincide" });
});

test("otro secreto, otro id u otro request-id → no coincide", () => {
  assert.deepEqual(validarFirma({ ...base, secreto: "otro" }), { ok: false, motivo: "no_coincide" });
  assert.deepEqual(validarFirma({ ...base, dataId: "123456780" }), { ok: false, motivo: "no_coincide" });
  assert.deepEqual(validarFirma({ ...base, xRequestId: "otro" }), { ok: false, motivo: "no_coincide" });
});

test("ts adulterado → no coincide", () => {
  assert.deepEqual(validarFirma({ ...base, xSignature: `ts=1704908011,v1=${V1}` }), { ok: false, motivo: "no_coincide" });
});

test("más de 5 minutos → vencida (hacia atrás y hacia adelante)", () => {
  assert.deepEqual(validarFirma({ ...base, ahoraMs: Number(TS) * 1000 + 301_000 }), { ok: false, motivo: "vencida" });
  assert.deepEqual(validarFirma({ ...base, ahoraMs: Number(TS) * 1000 - 301_000 }), { ok: false, motivo: "vencida" });
  assert.equal(validarFirma({ ...base, ahoraMs: Number(TS) * 1000 + 299_000 }).ok, true);
});

test("cabecera ausente o rota", () => {
  assert.deepEqual(validarFirma({ ...base, xSignature: null }), { ok: false, motivo: "sin_firma" });
  assert.deepEqual(validarFirma({ ...base, xSignature: "basura" }), { ok: false, motivo: "formato" });
  assert.deepEqual(validarFirma({ ...base, xSignature: `ts=${TS}` }), { ok: false, motivo: "formato" });
  assert.deepEqual(validarFirma({ ...base, xSignature: `ts=abc,v1=${V1}` }), { ok: false, motivo: "formato" });
  assert.deepEqual(validarFirma({ ...base, xSignature: `ts=${TS},v1=zz` }), { ok: false, motivo: "formato" });
});

test("sin secreto configurado no valida nada", () => {
  assert.deepEqual(validarFirma({ ...base, secreto: "" }), { ok: false, motivo: "sin_secreto" });
});
