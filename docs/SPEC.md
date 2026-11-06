# SPEC — Sitio central de Manu Casaubon y clase en vivo del 18/11/26

> **Cambio del 6/11/26 (Manu):** el proyecto de Vercel `lead-magnet` es el **sitio central**.
> - `/` es la landing de la oferta principal: ayudar a personas expertas en un tema a comunicar lo que saben y tener su marca personal online (redes) y offline (eventos). Sesión S8, §5.8.
> - `/evento` es la landing de la clase del 18/11.
> - `/evento/entrada` es el retorno de Mercado Pago y el comprobante. `/entrada` redirige ahí.
> - Las rutas viven en `src/lib/rutas.ts`; los links nunca se escriben a mano.
>
> **Dominio (6/11/26):** `comunicatumarca.com`. `NEXT_PUBLIC_SITE_URL=https://comunicatumarca.com`. Webhook de MP: `https://comunicatumarca.com/api/mp/webhook`. Redirección del link fijo: `https://comunicatumarca.com/evento/entrada`.
>
> **Microsoft Clarity (6/11/26):** `src/components/track/Clarity.tsx`, cargado desde el layout raíz con `NEXT_PUBLIC_CLARITY_PROJECT_ID` (por defecto `z96epwr8ri`, es público). Excluye `/evento/entrada`, `/entrada`, `/panel`, `/baja` y `/prueba`. Complementa el tracking propio (§4), no lo reemplaza: los embudos y conversiones salen de Supabase. El panel (S5) puede traer métricas de Clarity con la Data Export API usando `CLARITY_API_TOKEN` (variable de Vercel, secreta). Esa API permite unas 10 consultas por día y devuelve datos de los últimos 1 a 3 días, así que se consulta una vez por día desde el cron y el resultado se guarda en Supabase.
>
> **Edge Functions de Supabase (6/11/26):** los secretos de Mercado Pago, Resend y Clarity viven en **Supabase → Edge Functions → Secrets** (`MP_ACCESS_TOKEN`, `RESEND_API_KEY`, `CLARITY_API_TOKEN`), no en Vercel.
> - `supabase/functions/pagos` (pública, `verify_jwt=false`): `POST { payment_id, order_id? }`. Verifica el pago contra la API de MP, aplica `apply_payment` o `adopt_link_payment`, manda `confirmacion_entrada` y `aviso_manu` si están aprobadas, y registra `payment_*`. Devuelve el id de orden solo si vino con su orden o si el pago es de los últimos 60 min. En Vercel, `src/lib/pagos/procesar.ts` solo la llama.
> - `supabase/functions/clarity-sync`: la llama pg_cron todos los días a las 9:07 UTC con `x-cron-secret`, una clave generada dentro de Vault que valida `check_cron_secret()`. Hace 3 consultas (totales, URL, Source) y las guarda en `public.clarity_insights` para el panel.
> - `supabase/functions/_shared/email.ts`: el mismo envío protegido que `src/lib/email/enviar.ts`, pero lee la configuración no secreta de `settings`: `email_mode`, `email_test_recipients`, `manu_notify_email`, `email_from`, `site_url`.
> - Deploy con el MCP de Supabase (`deploy_edge_function`) o `supabase functions deploy`. Chequeo de tipos: `npx deno@2.1.4 check supabase/functions/*/index.ts`.
> - En Vercel quedan solo `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (leads, tracking y lectura del comprobante). Pasar esas tres a funciones públicas acotadas, para que Vercel quede sin secretos, queda para después del 18/11.
>
> **Link fijo de Mercado Pago (6/11/26):** además de Checkout Pro desde la web, existe `https://mpago.la/1cKaMGj` (ARS 42.000) para Instagram. Al volver a `/evento/entrada?payment_id=…` sin `?o=`, o por webhook, `procesarPago` detecta que no hay orden nuestra en `external_reference` y llama a `adopt_link_payment()`. Esa función valida que el pago esté aprobado, en ARS, por el precio vigente y, si está configurado, con el producto correcto (`settings.mp_link_match`). Después crea persona (fuente `mp_link`), orden y entrada. El comprobante con datos se muestra solo si el pago se aprobó hace menos de 60 min; si no, la persona tiene su link por mail. Pruebas: `supabase/tests/pago_por_link_test.sql`.

Producto: landing + leads + pago con Mercado Pago + comprobante + tracking + VSL + A/B + panel + mails, para la clase **"Cómo destacar con tu marca personal en 2027. De que nadie te conozca a que te llamen a vos."** (miércoles 18/11/26, 18 a 21 h, puertas 17:45, Niceto Vega 4601, Palermo Soho, CABA. USD 27 en pesos. Se comunican 30 lugares; la sala admite hasta 40).

Escrito el 5/11/26. Si algo de acá choca con lo que diga Manu, vale lo que diga Manu. Las decisiones abiertas están en [`DECISIONES.md`](DECISIONES.md).

**Lectura obligatoria antes de tocar nada:**
- `docs/contexto/reglas-y-metodo.md`: tono, restricciones, marca y dominio de mails. Es ley.
- `docs/contexto/evento-18-11.md`: datos, timing, etapas, flujo de pago y guion del VSL.
- `docs/referencia/landing-boceto.html`: fuente de textos y diseño.
- `docs/referencia/comprobante-demo.html`: animación de impresión y PDF.

---

## 0. Cómo se reparte el trabajo

| # | Sesión | Modelo | Rama | Es dueña de | Estado |
|---|---|---|---|---|---|
| S0 | Base de datos y contratos (esta) | Opus 5.5 | `claude/charming-allen-ywp6of` | `supabase/`, `src/lib/supabase/`, `src/lib/env.ts`, `src/lib/evento.ts`, `src/lib/email/enviar.ts`, `src/lib/track/catalogo.ts`, `src/middleware.ts`, `docs/SPEC.md`, `docs/DECISIONES.md` | Hecha |
| S1 | Bocetos de la página | Opus 5.5, esfuerzo medio | `claude/bocetos-pagina` | `bocetos/pagina*.html` (y después `src/app/(landing)/`, `src/components/landing/`) | Bocetos listos, esperando elección |
| S2 | Formulario | Opus 5.5, esfuerzo medio | `claude/formulario` | `bocetos/formulario*.html`, `src/components/form/`, `src/app/api/lead/`, `src/lib/track/cliente.ts`, `src/app/api/t/` | Unida a `main` el 6/11 (falta elegir boceto A/B) |
| S3 | Pagos con Mercado Pago y comprobante | Opus 5.5, esfuerzo medio | `claude/pagos-mp` | `bocetos/conexion*.html`, `src/lib/mercadopago/`, `src/app/api/checkout/`, `src/app/api/mp/`, `src/app/entrada/`, `src/components/comprobante/`, `src/lib/pagos/` | Unida a `main` el 6/11 (falta elegir boceto A/B y probar con claves de prueba) |
| S4 | Tracking completo y VSL | Opus 5.5 | `claude/tracking-vsl` | `src/components/track/`, `src/components/vsl/`, consultas de métricas | Después de S1–S3 |
| S5 | Panel privado | Opus 5.5 | `claude/panel` | `src/app/panel/`, `src/app/api/panel/` | Después de S1–S3 |
| S6 | Mails con Resend | Opus 5.5 | `claude/mails` | `src/lib/email/` (salvo `enviar.ts`), `src/app/api/resend/`, `src/app/api/cron/`, `src/app/baja/`, `src/app/api/baja/`, plantillas de campaña | Después de S1–S3 |
| S7 | A/B testing | Opus 5.5 | `claude/ab` | `src/lib/ab/`, cambios mínimos en landing/form/VSL | Al final |
| S8 | Landing principal (oferta) | Opus 5.5, esfuerzo medio | `claude/landing-principal` | `bocetos/inicio*.html`, después `src/app/page.tsx` y `src/components/inicio/` | Se lanza el 6/11 |

**Reglas para todas las sesiones**
1. Cada sesión trabaja solo en su rama y en sus carpetas. Si necesita tocar algo de otra, lo anota en su resumen final en vez de cambiarlo.
2. El esquema de la base es de S0. Si una sesión necesita una columna o función nueva, escribe una migración nueva en `supabase/migrations/` con fecha posterior, la prueba local (ver `supabase/tests/README.md`) y **no** la aplica en Supabase: la deja anotada para que S0 la revise y la aplique.
3. Claves solo en variables de entorno (§7). Nunca se piden por chat ni se escriben en el código.
4. **Confirmar con Manu antes de:** tocar producción o el dominio, cobrar de verdad, mandar mails a personas reales. Mercado Pago siempre con credenciales de prueba y Resend con `EMAIL_MODE=test`.
5. Textos en español rioplatense, siguiendo `reglas-y-metodo.md`: corto, claro, amable; urgencia solo con fecha y número real; sin "último workshop"; no mencionar la clase online del 24/11 antes del 19/11; nada de Joaco, Fer y Axel sin permiso escrito (se muestra con la marca "pendiente de permiso" en los bocetos); no inventar reglas de 2027 (usar el texto visible `[Cambio de 2027: lo define Manu]`).
6. Marca: oscuro `#2d2828`, crema `#fffdf6`, rojo `#d0443f`, mostaza `#dda51e`; Poppins 900 apretada en mayúsculas para títulos; EB Garamond para detalles, **nunca en itálica**. Tokens en `src/app/globals.css`.
7. Celular primero (375 px), accesible (contraste AA, foco visible, `aria-live` en errores, respeta `prefers-reduced-motion`), rápido (sin librerías pesadas en la landing).
8. Antes de terminar: `npx tsc --noEmit`, `npm run lint` y `npm run build` sin errores, commit con mensaje claro y push a la rama propia. Al final, un resumen con lo hecho, lo pendiente y las preguntas para Manu (para sumar a `DECISIONES.md`).

**Orden de llegada a producción.** La fecha manda. Primero landing + formulario + pago + comprobante + tracking básico. Después panel, VSL y mails. El A/B va al final. Cualquier cosa que ponga en riesgo el 18/11 se avisa.

---

## 1. Arquitectura

```
Visitante ──> Vercel (Next.js 15, App Router, TypeScript)
                │  middleware: cookies vid / sid / utm (sin datos personales)
                │  landing SSR (variante A/B resuelta en el servidor → sin parpadeo)
                │
                ├─ POST /api/t            tracking por lotes (sendBeacon) ──> events
                ├─ POST /api/lead         formulario ──> upsert_lead() ──> people + lead_touches
                ├─ POST /api/checkout     lead + reserve_order() + preferencia de Checkout Pro ──> redirect a MP
                ├─ POST /api/mp/webhook   firma x-signature + GET /v1/payments/{id} ──> apply_payment()
                ├─ GET  /entrada?o=…      retorno de MP: verifica contra la API, muestra comprobante + PDF
                ├─ POST /api/resend/webhook  aperturas, clics, rebotes, quejas ──> email_events / email_sends
                ├─ GET  /api/cron/mails   Vercel Cron: campaña aprobada y recordatorios
                ├─ /baja?t=…              baja de mails (confirmación con botón; one-click por POST)
                └─ /panel/*               login de Supabase Auth + tabla admins
                         │
                         ▼
               Supabase (Postgres 17, RLS en todo, service_role solo en el servidor)
               Resend (info.comunicatumarca.com, sa-east-1)
               Mercado Pago Checkout Pro (pesos argentinos)
```

- **Stack:** Next.js 15 + React 19 + TypeScript en Vercel; Supabase (base, auth, RLS); Resend; Mercado Pago por REST (`fetch`, sin SDK); jsPDF para el comprobante; `zod` para validar entradas.
- **Por qué sin SDK de Mercado Pago:** son 2 llamadas (crear preferencia, leer pago) y así controlamos tiempos de espera y errores.
- **Sin parpadeo en el A/B:** la variante se calcula en el servidor con hash(`vid` + clave del experimento) y pesos; la página ya sale renderizada con su variante.
- **VSL propio:** `<video>` HTML5 con el archivo en Vercel Blob o Bunny Stream (D7). Así medimos cuartiles, tiempo visto y abandono cada 5 s. YouTube no deja medir eso bien.
- **Cron:** Vercel Cron diario a las 10 h (13 UTC), compatible con el plan Hobby. Si el plan es Pro, se puede pasar a cada 15 minutos. Además, el panel tiene el botón "Enviar ahora" para lo aprobado.

---

## 2. Flujo completo (contrato entre S2 y S3)

1. Llega con o sin UTM. El middleware crea `vid`, `sid` y guarda la primera atribución en la cookie `utm`.
2. La landing registra `page_view`, `scroll_depth` y `click`.
3. **Formulario (S2).** Al primer foco registra `form_start`; por campo, `form_field_focus` y `form_field_blur`; si hay errores, `form_error`; al enviar, `form_submit`.
4. **`POST /api/lead` (S2)** valida con zod, llama a `upsert_lead()` con `source='form'`, UTM, `vid` y experimentos, registra `lead_created` en el servidor y responde `{ ok, personId }`. **No devuelve datos personales.**
5. **Pago (S3).** El front llama a `POST /api/checkout` con `{ email }` (o con el formulario completo si la versión del flujo es "directo"). El servidor:
   1. vuelve a hacer `upsert_lead()` con `source='checkout'` (el pago también cuenta como lead);
   2. llama a `reserve_order(person_id, vid, source, utm, experiments)`, que reserva el lugar 20 min y respeta el tope;
   3. crea la preferencia de Checkout Pro (§5.3);
   4. guarda `mp_preference_id` con `set_order_preference()`;
   5. registra `checkout_start` y responde `{ url: init_point }`.

   Errores con texto amable: `sold_out`, `sales_closed`, `no_price`, `already_has_ticket` (este último lleva a "ya tenés tu entrada, te la reenvío").
6. La persona paga en Mercado Pago y vuelve a `/entrada?o=<order_id>` (`auto_return=approved`; también en pendiente o error).
7. **Webhook (S3).** Valida la firma. Con el `data.id`, consulta `GET /v1/payments/{id}` y pasa el JSON a `apply_payment()`. Si `newly_approved`, manda el mail `confirmacion_entrada` a la persona y `aviso_manu` a Manu, y registra `payment_approved`. Los avisos repetidos no hacen nada nuevo (`mp_notifications.request_id` único + idempotencia de `apply_payment`).
8. **`/entrada` (S3).** Busca la orden. Si no está aprobada y la URL trae `payment_id`, **consulta ese pago a la API** (nunca confía en `status` de la URL), verifica que `external_reference` coincida con la orden y llama a `apply_payment()`. Muestra:
   - aprobado → la entrada se imprime (animación del demo) + PDF + pedido de perfil para la auditoría (D5);
   - pendiente → "Tu pago está en proceso";
   - rechazado → "No se pudo cobrar" + reintentar.
9. Desde ese momento la persona pasa a `status='ticket'`: sale de la campaña de venta y entra a la de recordatorios.

---

## 3. Base de datos (S0, ya aplicada en Supabase)

Proyecto: `backend - comunica tu marca` (`qzfzswascgitycynwlkk`, us-east-1). Migraciones en `supabase/migrations/`, en orden. Tipos en `src/lib/supabase/database.types.ts`. Si cambia el esquema, se regeneran con el MCP de Supabase (`generate_typescript_types`).

### 3.1 Tablas

| Tabla | Para qué | Claves |
|---|---|---|
| `settings` | Fila única: datos del evento, `price_ars` (null = no se vende), `capacity_public` 30, `capacity_max` 40, `hold_minutes` 20, `sales_open` | `id=1` |
| `people` | Una persona por mail (`citext`, sin importar mayúsculas). `status` `lead` o `ticket`. Consentimiento, baja (`unsubscribe_token`), `email_status` | `email` único |
| `lead_touches` | Cada vez que deja datos: `source` (`form`, `instagram_dm`, `checkout`, `manual`), UTM, referrer, experimentos | → people |
| `visitors` | Visitante anónimo por cookie `vid`, primera atribución, dispositivo | `id` = vid |
| `events` | Todo el tracking (§4) | índice (name, created_at) |
| `experiments` / `experiment_variants` / `experiment_assignments` | A/B. **Solo uno `running` a la vez** (índice único parcial) | |
| `orders` | Intento de compra = `external_reference` de MP. Reserva con `hold_expires_at` | → people |
| `payments` | Último estado de cada pago de MP (JSON crudo en `raw`) | `mp_payment_id` |
| `tickets` | Entrada emitida: `code` (`CTM-XXXXXX`), `overbooked`, `audit_profile`, `checked_in_at` | `order_id` único |
| `mp_notifications` | Registro de avisos del webhook | `request_id` único |
| `email_templates` | Plantillas: `kind` (`campaign` o `transactional`), `audience`, `objection`, `send_at`, `status` (`draft` → `approved`). **Editar asunto o cuerpo de una aprobada la vuelve a borrador** (trigger) | `key` único |
| `email_sends` | Cada envío, con `resend_id` | único (plantilla, mail) |
| `email_events` | Webhooks de Resend | `svix_id` único |
| `admins` | Quiénes entran al panel (`auth.users`) | |

### 3.2 Seguridad
- RLS activa y **forzada** en las 16 tablas. `anon` no tiene permisos sobre ninguna tabla ni función.
- `authenticated` solo lee si está en `admins` (`private.is_admin()`). Puede editar `settings`, `experiments`, `experiment_variants`, `email_templates`, `tickets` y `people`.
- Toda escritura pública pasa por el servidor de Next con `SUPABASE_SERVICE_ROLE_KEY` (`src/lib/supabase/admin.ts`, marcado `server-only`).
- Advisors de seguridad y rendimiento: sin avisos al 5/11/26 (solo "índice sin usar", esperable con la base vacía).

### 3.3 Funciones (solo `service_role`)

| Función | Qué hace |
|---|---|
| `seats_status()` | `sold`, `holds`, `capacity_public`, `capacity_max`, `left_public` (para "quedan N de 30"), `left_max`, `sales_open`, `price_ars` |
| `upsert_lead(p_email, p_name, p_phone, p_instagram, p_brand_url, p_goal, p_source, p_consent, p_consent_text, p_visitor_id, p_utm, p_referrer, p_path, p_experiments)` | Crea o actualiza sin duplicar y sin pisar datos con vacíos. Suma un `lead_touch`. Une visitante y eventos previos a la persona. Quien se dio de baja no vuelve a quedar suscripto por el formulario |
| `reserve_order(p_person_id, p_visitor_id, p_source, p_utm, p_experiments)` | Bloquea `settings`, reutiliza la orden pendiente vigente y controla el tope (`vendidas + reservas < capacity_max`). Errores: `sales_closed`, `no_price`, `sold_out`, `already_has_ticket` |
| `set_order_preference(p_order_id, p_preference_id)` | Guarda la preferencia |
| `apply_payment(p_payment jsonb)` | Recibe el JSON de `GET /v1/payments/{id}`. Idempotente. `newly_approved=true` solo la primera vez. Emite la entrada aunque se pase del tope (`overbooked`) porque la plata ya entró. Si pagó menos, deja `in_process` sin entrada. Una devolución o un contracargo cancelan la entrada |
| `expire_holds()` | Marca `expired` las reservas vencidas hace más de 1 día (limpieza) |
| `unsubscribe(p_token)` | Baja de mails |

Pruebas: `supabase/tests/funciones_test.sql` (ver `supabase/tests/README.md`). Cubren duplicados, reserva, tope, idempotencia, monto menor, sobreventa, devolución, baja y RLS.

---

## 4. Tracking propio (contrato)

- **Catálogo de eventos:** `src/lib/track/catalogo.ts`. Si hace falta un nombre nuevo, se agrega ahí y acá.
- **Cliente (S2 lo crea, S4 lo completa):** `src/lib/track/cliente.ts` exporta `track(name, props?)`. Junta eventos y los manda en lote a `POST /api/t` con `navigator.sendBeacon` (o `fetch keepalive`) cada 2 s y en `pagehide`. Nunca manda mail, nombre ni teléfono en `props`.
- **`POST /api/t` (S2):**
  - acepta `{ events: [{ name, props, path, ts }] }`, hasta 50 por lote;
  - valida contra el catálogo y limita `props` a 2 KB;
  - toma `vid`, `sid` y `utm` de las cookies y calcula `source` (`utm_source`, si no el host del referrer, si no `directo`);
  - hace upsert de `visitors` (`last_seen_at`, `device` según el user-agent) e inserta en `events`;
  - responde 204;
  - ignora bots evidentes por user-agent.
- **Eventos de servidor** (`lead_created`, `checkout_start`, `payment_*`): se insertan directo desde el route handler con el `vid` de la cookie (o el de la orden en el webhook).
- **Conversiones por etapa (S4/S5):** visitantes únicos con `page_view` → `form_start` → `form_submit` → `lead_created` → `checkout_start` → `payment_approved`, por `source` y por variante.
- **Abandono por campo (S2 mide, S5 muestra):** para quien tiene `form_start` y no `form_submit`, el campo abandonado es el último `form_field_focus`.

---

## 5. Paso a paso por sesión

### 5.1 S1 — Bocetos de la página (rama `claude/bocetos-pagina`)

Objetivo: 2 versiones navegables de la landing para que Manu elija y pula **antes** de construir la definitiva.

1. Leer el contexto obligatorio y `src/app/globals.css`.
2. La landing final va en **`/evento`** (`src/app/evento/page.tsx`), no en `/`. Crear `bocetos/pagina.html`: un archivo autocontenido con un selector fijo arriba "Versión A / Versión B" (accesible, recuerda la elección en `localStorage` dentro de try/catch) y un selector "Celular / Escritorio" que encierra la vista en un marco de 390 px.
3. **Versión A, "Fiel al boceto":**
   - misma estructura y textos que `landing-boceto.html`;
   - el CTA del talón baja al formulario embebido `#reservar` (con la forma del formulario de la versión A de S2, solo visual) en lugar de abrir Instagram;
   - debajo del hero, un lugar para el VSL: póster con la escena en texto ("¿Te pasó de estar en un evento…?"), porque muchos lo ven sin sonido, botón de play y la etiqueta "Video en camino". La página funciona sin el video;
   - en el celular, una barra de CTA fija abajo que aparece cuando el hero sale de la pantalla;
   - "Mandame TALLER" queda como link secundario.
4. **Versión B, "Video primero":**
   - título y promesa, el VSL inmediatamente después y los datos de la entrada en una tira compacta;
   - contador "Quedan N de 30 lugares", con nota visible de que N sale de la base;
   - CTA y cuerpo más corto: preguntas → qué te llevás → programa en acordeón → para quién → quién la da → FAQ → cierre.
5. Sección "Las reglas del juego cambiaron" en ambas versiones, con 2 o 3 casilleros `[Cambio de 2027: lo define Manu]` (D6).
6. Alumnos: dejar los 3 casos con la marca "pendiente de permiso escrito". No sumar datos nuevos.
7. SEO previsto: título, descripción, OG image (bosquejo de 1200×630 con el título en la marca) y JSON-LD `Event` en un comentario, para la versión final.
8. Publicar como Artifact (privado) con la herramienta Artifact y devolver la URL.
9. Commit y push. Resumen: qué cambia entre A y B y preguntas de diseño para Manu.
10. **Cuando Manu elija** (otra vuelta de esta misma sesión): construir `src/app/evento/page.tsx` y `src/components/landing/*` como server components con el cupo real (`getCupo()`), metadata, JSON-LD `Event`, OG image (`opengraph-image.tsx`), `sitemap.ts`, `robots.ts` y el VSL (S4). Lighthouse en celular ≥ 90 en rendimiento y accesibilidad.

### 5.2 S2 — Formulario (rama `claude/formulario`)

Objetivo: bocetos A/B del formulario y, en paralelo, el formulario funcional con su endpoint y su medición, porque el backend no depende del diseño.

1. Leer el contexto, el §2 y el §4.
2. **Bocetos:** `bocetos/formulario.html` con selector A/B y marco de celular, publicado como Artifact.
   - **A, un paso:** Nombre, Mail, WhatsApp (opcional), Instagram o web de tu marca ("para tu auditoría", opcional), consentimiento sin marcar ("Quiero recibir mails sobre la clase. Me puedo dar de baja cuando quiera.") y el botón "Reservar mi lugar".
   - **B, dos pasos:** paso 1, solo el mail y "Seguir"; paso 2, nombre, Instagram o web, "¿Qué te gustaría resolver en la clase?" (opcional), consentimiento y "Ir a pagar". Indicador "Paso 1 de 2".
   - Validación en línea, errores con `aria-live`, estados de carga y de error del servidor.
   - En ambas versiones, el link secundario "¿Preferís por Instagram? Mandame TALLER".
   - Una nota gris "Qué medimos" junto a cada versión.
3. **Cliente de tracking** `src/lib/track/cliente.ts` y endpoint `src/app/api/t/route.ts`, según el §4.
4. **Endpoint `src/app/api/lead/route.ts`:**
   - valida con zod: mail obligatorio y normalizado, nombre obligatorio en el paso final, teléfono opcional (solo dígitos, `+` y espacios), Instagram o URL opcional y textos acotados;
   - trampa para bots (campo oculto) y límite simple de 5 envíos por minuto por `vid`;
   - lee `vid` y `utm` de las cookies y el experimento de la cookie `exp` si existe (la agrega S7);
   - llama a `upsert_lead` e inserta el evento de servidor `lead_created`;
   - responde `{ ok: true }`, o `{ ok:false, code, field? }` si falla.
5. **Componente `src/components/form/FormularioReserva.tsx`** (client component):
   - prop `variante: "un-paso" | "dos-pasos"`;
   - mide `form_view` (IntersectionObserver), `form_start`, `form_field_focus` y `form_field_blur` (con `filled`/`valid`, nunca el valor), `form_error` y `form_submit`;
   - al terminar llama a una prop `onLead({ email })` para que S3 encadene el pago. Mientras S3 no esté, muestra "¡Listo! Te escribimos con el link de pago";
   - accesible: labels visibles, `autocomplete` correcto (`email`, `name`, `tel`), `inputmode` y tamaño táctil ≥ 44 px.
6. **Página de prueba** `src/app/prueba/formulario/page.tsx` (no indexable) con las dos variantes, para probarlo sin la landing.
7. **Medición de las dos fuentes (D2):** el botón de Instagram registra `instagram_click` con `place`. Las personas que pagan por DM se cargan a mano desde el panel con `source='instagram_dm'` (S5), y el mail las une al lead si ya existía.
8. Probar en local con `.env.local` contra Supabase (la base ya está aplicada) o, si no hay claves, con mocks. Commit, push y resumen.

### 5.3 S3 — Pagos con Mercado Pago y comprobante (rama `claude/pagos-mp`)

Objetivo: cobrar en pesos con Checkout Pro creado desde el servidor, confirmar siempre contra la API, tolerar avisos repetidos, controlar el cupo y mostrar el comprobante real. Además, bocetos A/B de "cómo se conecta".

1. Leer el contexto, el §2, el §3 y `docs/referencia/comprobante-demo.html`. Docs de MP: back URLs (link en `evento-18-11.md`), webhooks con `x-signature` y `GET /v1/payments/{id}`.
2. **Bocetos `bocetos/conexion.html`** (Artifact, selector A/B, prototipo clickeable en marco de celular más un diagrama de pasos):
   - **A, "Directo":** formulario → Mercado Pago (pantalla simulada) → `/entrada` con la impresión → campo "Pasame tu Instagram para la auditoría" si no lo dejó.
   - **B, "Con pausa":** formulario → pantalla "Ya estás anotado/a, falta el pago" con precio, qué incluye y lugares que quedan → "Pagar con Mercado Pago" o "Pagar después: te mando el link por mail" → Mercado Pago → `/entrada` → "Te llega la confirmación por mail". Incluye el estado "Tu pago está en proceso".
   - En ambos, una nota de cómo se miden las fuentes (formulario o DM).
3. **`src/lib/mercadopago/cliente.ts`:**
   - `crearPreferencia(order, person)` → `POST https://api.mercadopago.com/checkout/preferences` con `Authorization: Bearer MP_ACCESS_TOKEN` y `X-Idempotency-Key: order.id`. Cuerpo:
     - `items: [{ id: "clase-18-11", title: EVENTO.nombre, quantity: 1, unit_price: order.amount_ars, currency_id: "ARS" }]`;
     - `payer: { email, name }` y `external_reference: order.id`;
     - `back_urls: { success|pending|failure: SITE_URL/entrada?o=<id> }` y `auto_return: "approved"`;
     - `notification_url: SITE_URL/api/mp/webhook?source_news=webhooks`;
     - `statement_descriptor: "MANU CASAUBON"` y `expires: true`, con `expiration_date_to` igual al vencimiento de la reserva más 10 min;
     - `binary_mode: false` y `metadata: { order_id }`.
   - `obtenerPago(id)` → `GET /v1/payments/{id}`.
   - Tiempo de espera de 10 s y un reintento en errores 5xx.
4. **`src/lib/mercadopago/firma.ts`:** valida `x-signature` (`ts=…,v1=…`). El manifiesto es `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` (`data.id` de la query, en minúsculas si es alfanumérico) y se firma con HMAC-SHA256 y `MP_WEBHOOK_SECRET`. Comparación en tiempo constante y tolerancia de 5 min sobre `ts`. Con tests unitarios (vector armado a mano).
5. **`src/lib/pagos/procesar.ts`:** `procesarPago(paymentId)`:
   - consulta `obtenerPago` y llama a `apply_payment`;
   - si `newly_approved`:
     - `enviarPlantilla('confirmacion_entrada', …)` con `{ nombre, codigo, link_entrada }`;
     - `enviarPlantilla('aviso_manu', …)` a `MANU_NOTIFY_EMAIL`;
     - marca `tickets.manu_notified_at`;
     - inserta `payment_approved` con el `vid` de la orden.
   - Si `pending`/`in_process` → `payment_pending`; si `rejected` → `payment_rejected`.
   - La usan el webhook y `/entrada`.
6. **`POST /api/checkout`:** según el §2.5.
   - Valida el mail y el resto de los campos opcionales del formulario.
   - Si la persona ya tiene entrada, responde `already_has_ticket` y reenvía el link de su entrada por mail, si la plantilla está aprobada.
   - Formato de respuesta: `{ url }` o `{ ok:false, code }`.
7. **`POST /api/mp/webhook`:**
   - responde 200 rápido, también ante topics que no son `payment`;
   - inserta en `mp_notifications` (si `request_id` ya existe y está procesado, termina ahí);
   - con la firma inválida responde 401 y deja el registro;
   - si la firma es válida, llama a `procesarPago` y guarda el resultado;
   - ante un error inesperado responde 500 para que MP reintente.
   - **Nunca** confía en el cuerpo del aviso: solo usa el `id` para consultar la API.
8. **`/entrada` (server component) + `src/components/comprobante/Comprobante.tsx` (client):**
   - toma `o` (uuid de la orden); si no existe, muestra un 404 amable;
   - si la orden no está aprobada y viene `payment_id`, llama a `procesarPago(payment_id)` solo si el pago pertenece a esa orden (`external_reference`);
   - porta la animación de impresión, el sello y el PDF de `comprobante-demo.html` con datos reales: nombre, mail, cuándo, puertas, dónde, monto en ARS, fecha de pago, operación y **código de entrada**. jsPDF va desde npm, importado de forma dinámica al tocar el botón;
   - lleva el texto "Este comprobante no es una factura. Mostralo el día del evento.";
   - el link "Avisarme por Instagram" queda opcional (D2);
   - registra `ticket_view` y `pdf_download`;
   - `noindex` y `Cache-Control: no-store`.
9. **Perfil para la auditoría (D5, opción preferida de Manu):**
   - en `/entrada` aprobada, si `tickets.audit_profile` está vacío, muestra el formulario "Pasame tu Instagram (o web) para tu auditoría" → `POST /api/entrada/perfil` con `{ o, perfil }`;
   - el endpoint valida que la orden esté aprobada y guarda el perfil;
   - registra `audit_profile_sent`.
10. **Pruebas:**
    - unitarias de la firma;
    - simulación local del webhook con un pago de prueba;
    - pago de prueba de punta a punta con credenciales de **prueba** y usuarios de prueba de MP, en un deploy de preview de Vercel (sin tocar producción);
    - aviso repetido (reenviar el mismo webhook 3 veces → una sola entrada y un solo mail);
    - tope con `capacity_max` bajo en la base local.
11. Commit, push y resumen. Incluir los pasos para que Manu cargue las credenciales y configure el webhook en el panel de MP (URL `SITE_URL/api/mp/webhook`, evento "Pagos") y la lista de verificación de la **compra real** antes de difundir.

### 5.4 S4 — Tracking completo y VSL (después)
1. `src/components/track/Tracker.tsx`: `page_view`, `scroll_depth` (25/50/75/100, una vez cada uno) y clics con `data-track`.
2. `src/components/vsl/Vsl.tsx`:
   - `<video playsinline preload="metadata">` con póster, subtítulos (`<track>` VTT con el guion) y botón grande;
   - mide `vsl_view`, `vsl_play`, `vsl_pause`, `vsl_progress` cada 5 s (solo mientras reproduce), `vsl_quartile` y `vsl_end`;
   - sin `NEXT_PUBLIC_VSL_URL` muestra el póster con la escena en texto y no rompe nada.
3. Funciones SQL de métricas (migración nueva, la aplica S0):
   - embudo por etapa y fuente;
   - curva de retención del VSL (visitantes únicos por bucket de 5 s / reproducciones);
   - tiempo visto promedio;
   - conversión de quienes vieron más del 50 % contra quienes no lo vieron.

### 5.5 S5 — Panel privado (después)
1. Login con Supabase Auth (mail y contraseña) en `/panel/login`. Middleware propio del panel: sin sesión → login; con sesión pero sin estar en `admins` → 403.
2. Secciones (celular primero, tablas que pasan a tarjetas, exportar a CSV en cada una):
   - **Resumen:** vendidas / 30 / tope 40, reservas, ingresos netos, leads, conversión.
   - **Leads:** búsqueda, filtro por fuente, estado y consentimiento; alta manual por DM.
   - **Pagos y entradas:** check-in el día del evento y perfiles de auditoría para imprimir.
   - **Embudo y fuentes.**
   - **VSL:** curva de abandono.
   - **Experimentos:** crear, arrancar y apagar; muestra n por variante y no declara ganador por debajo del mínimo.
   - **Mails:** editar, aprobar, mandar prueba; aperturas, clics, rebotes y bajas.
   - **Ajustes:** precio en pesos, cupos, venta abierta.
3. Lecturas con la sesión del admin (RLS) o con service_role después de verificar que es admin. Exportar CSV con streaming.

### 5.6 S6 — Mails con Resend (después)
1. Webhook `/api/resend/webhook`:
   - verifica la firma Svix (`svix-id`, `svix-timestamp`, `svix-signature`, secreto `whsec_…`);
   - guarda en `email_events` (`svix_id` único) y actualiza `email_sends` (`delivered`, `opened`, `clicked`, `bounced`, `complained`);
   - un rebote o una queja ponen `people.email_status`.
2. Baja: `/baja?t=…` (botón de confirmar) y `POST /api/baja?t=…` (one-click, RFC 8058) → `unsubscribe()`.
3. Cron `/api/cron/mails` (con `CRON_SECRET`): manda las plantillas `approved` con `send_at <= now()`.
   - **Venta** (`leads_sin_pago`): `status='lead'` + consentimiento.
   - **Con entrada** (`con_entrada`): recordatorios.
   - Quien pagó deja de recibir los de venta en ese mismo momento, porque el filtro se hace al enviar.
   - Lotes de 50, respetando el límite de Resend.
4. Secuencia en borrador, un mail por objeción, hasta el 17/11. Cada uno se aprueba en el panel:
   - "¿Me sirve si recién empiezo?";
   - "No tengo muchos seguidores";
   - "Nunca di una charla";
   - "¿Vale la pena pagar por una clase?";
   - "No sé si llego / ¿y si no puedo ir?" (sin anunciar el 24/11);
   - "Quedan N lugares" (número real, 15 al 17/11).

   Recordatorios para quienes tienen entrada: 17/11 y 18/11 a la mañana.
5. Aperturas y clics: necesitan prender el tracking del dominio en Resend (D1b, decisión de Manu).

### 5.7 S7 — A/B testing (al final)
1. `src/lib/ab/asignar.ts`: experimento `running` (cache de 60 s) y variante = hash(`vid` + key) % 100 según los pesos. Guarda en `experiment_assignments` (con `after()`), expone la cookie `exp` y registra `exp_exposure`.
2. Superficies: landing (titular, orden de secciones), VSL (con o sin, posición) y formulario (`un-paso` / `dos-pasos`).
3. Resultados: n por variante, tasa de la métrica principal e intervalo de confianza del 95 % (Wilson). "Sin datos suficientes" mientras alguna variante esté por debajo de `min_sample_per_variant`. Un experimento por vez (la base lo impide).

### 5.8 S8 — Landing principal de la oferta (rama `claude/landing-principal`)

Objetivo: la página de inicio del sitio central. Presenta la oferta principal de Manu: ayudar a personas que saben mucho de un tema (emprendedores, profesionales, especialistas) a **comunicar lo que saben** y tener su marca personal **online** (redes, contenido) y **offline** (eventos, charlas, escenario), con su método de los 3 niveles.

1. Leer `docs/contexto/reglas-y-metodo.md` (tono, marca y método completo), `docs/contexto/evento-18-11.md` (programa, precios y **qué se comunica en cada etapa**) y `docs/referencia/landing-boceto.html` (lenguaje visual).
2. **Bocetos `bocetos/inicio.html`** (Artifact privado, selector A/B y marco de celular):
   - **A, "Método primero":** promesa → el problema (sabés, pero tu sector no lo sabe) → los 3 niveles (estratégica, creativa, de impacto) con sus etapas → online y offline → cómo trabajo (programa) → quién soy → próxima clase en vivo → contacto;
   - **B, "Escenario primero":** abre con la escena del speaker ("sabe, pero no sabe tanto como yo") → qué cambia cuando comunicás → online + offline lado a lado → método en una línea por nivel → resultados (casos pendientes de permiso) → próxima clase → contacto.
3. **Regla de etapas (D17):** hasta el 25/11 el inicio **no presenta ni vende el programa** de 4 meses; solo lleva a la clase del 18/11. Los bocetos muestran el bloque del programa con una marca visible "se publica desde el 25/11". No se mencionan precios del programa ni la clase online del 24/11.
4. No inventar resultados, testimonios ni reglas de 2027. Casos de alumnos con la marca "pendiente de permiso".
5. CTA principal: hoy, la clase del 18/11 (`/evento`). Secundario: Instagram (`ig.me/m/casaubon.ar`). Sin formulario propio por ahora.
6. Publicar el Artifact, commit y push a la rama propia, y dejar las preguntas para Manu en `docs/DECISIONES.md` con el prefijo "S8:". **No construir en `src/` hasta que Manu elija.**

---

## 6. Mails: reglas que ya garantiza `src/lib/email/enviar.ts`
- Solo salen plantillas `approved`. Editar una aprobada la vuelve a borrador.
- `EMAIL_MODE=test` (por defecto) → solo a `EMAIL_TEST_RECIPIENTS`. Pasar a `live` requiere el OK de Manu.
- Nadie recibe dos veces la misma plantilla.
- Campaña: solo con consentimiento, sin baja y sin rebotes. Siempre con link de baja y `List-Unsubscribe`.
- Remitente: `manu@info.comunicatumarca.com` (dominio verificado, sa-east-1). **No** agregar `comunicatumarca.com` como dominio de envío.

## 7. Variables de entorno (Vercel → Project → Settings → Environment Variables)
Ver `.env.example`. Las carga Manu. Preview usa las credenciales de prueba de MP; Production usa las reales recién con el OK de Manu.

## 8. Antes de difundir (checklist)
- [ ] Precio en pesos cargado en `settings.price_ars`.
- [ ] Credenciales reales de MP en Production y webhook configurado.
- [ ] Plantillas `confirmacion_entrada` y `aviso_manu` aprobadas.
- [ ] Compra real completa: pago → retorno → comprobante → PDF → mail → aviso a Manu → aparece en el panel.
- [ ] Devolución de esa compra desde MP → la entrada queda cancelada.
- [ ] Dominio `evento.comunicatumarca.com` verificado en Vercel y `NEXT_PUBLIC_SITE_URL=https://evento.comunicatumarca.com` en Production.
- [ ] Plan de Vercel apto para uso comercial (D15).
- [ ] Repo privado.
