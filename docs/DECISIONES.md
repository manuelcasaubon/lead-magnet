# Decisiones que dependen de Manu

Cada sesión suma acá lo que necesita que decidas. Se revisa todo junto cuando esté construido. Mientras tanto, cada punto tiene un valor por defecto para no frenar el trabajo.

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| D1 | **Dominio: decidido (6/11).** `comunicatumarca.com` (inicio en `/`, clase en `/evento`). Reemplaza la web actual de Hostinger. En el DNS de Hostinger se cambian solo los registros A/AAAA de `@` y el de `www`; **no se tocan MX (Google Workspace), TXT ni `info.` (Resend)**. Ver los pasos en el SPEC | Hasta el cambio de DNS: dirección `.vercel.app` | Difusión |
| D1b | **Seguimiento de aperturas y clics en Resend.** Hoy está apagado en `info.comunicatumarca.com`. Prenderlo cambia la configuración del dominio y los links pasan por un redireccionador | Apagado: se miden entregas, rebotes, quejas y bajas, pero no aperturas ni clics | Métricas de mails |
| D2 | **Formulario y "Mandame TALLER".** ¿El formulario reemplaza al DM o conviven? | Conviven: formulario como CTA principal y "¿Preferís por Instagram?" como link secundario medido (`instagram_click`). Las ventas por DM se cargan en el panel con fuente `instagram_dm` | Landing final |
| D3 | **Precio: decidido (6/11).** ARS 42.000, cargado en `settings.price_ars`. Falta confirmar si absorbés la comisión de MP (hoy `absorb_fee = true`, solo informativo) | — | — |
| D4 | **Campos del formulario.** | Nombre, mail, WhatsApp (opcional), Instagram o web (opcional, para la auditoría) y consentimiento sin marcar. Ver bocetos A y B | Formulario final |
| D5 | **Auditoría personalizada para 30 personas.** | Tu opción preferida: se pide el perfil al pagar (en el comprobante) y se entrega impresa en la sala. El panel lista los perfiles para imprimir | Comprobante |
| D6 | **Los 2 o 3 cambios de 2027** que explican "las reglas del juego cambiaron". | Casilleros visibles `[Cambio de 2027: lo define Manu]`. No se inventan | Landing y mails |
| D7 | **VSL: cuándo llega el video y dónde se aloja.** | La landing funciona sin video (póster con la escena en texto). Propuesta: Vercel Blob o Bunny Stream con reproductor propio | VSL |
| D8 | **Cupo.** Se comunican 30 y el tope real es 40. ¿Se vende hasta 40 en silencio, o al llegar a 30 se muestra "agotado" y se abre una lista de espera? | Se vende hasta 40; el contador público muestra "quedan N de 30" y nunca baja de 0 | Landing y mails |
| D9 | **Reserva de lugar mientras paga.** | 20 minutos | — |
| D10 | **Quién entra al panel.** | Creás tu usuario en Supabase → Authentication → Users y lo sumo a `admins` | Panel |
| D11 | **Permisos de Joaco, Fer y Axel.** | Casos marcados "pendiente de permiso". No salen en producción sin el permiso | Landing final |
| D12 | **Sala.** Niceto Vega 4601 no figura entre las sedes de Working&Co | — | Logística |
| D13 | **Repo privado.** Hoy `lead-magnet` es público. Se cambia en GitHub → Settings → General → Danger Zone → *Change visibility* | — | Seguridad |
| D15 | **Plan de Vercel.** La cuenta está en Hobby, que es para uso no comercial. Para vender entradas conviene Pro (USD 20 por mes). En Hobby, el cron de mails corre una vez por día | Hobby | Venta |
| D16 | **Rama de producción.** La rama principal de GitHub quedó en `claude/charming-allen-ywp6of` porque fue la primera que se subió. Propuesta: crear `main` y usarla como rama de producción en Vercel | — | Deploys |
| D17 | **Inicio y plan de venta.** El plan dice que del 3 al 18/11 solo se comunica el taller y que el programa se presenta públicamente del 25 al 30/11. El inicio queda como puerta a la clase (y sin indexar) hasta el 25/11; la versión con el programa se publica ese día | Inicio mínimo que lleva a `/evento` | Inicio |
| D18 | **Protección de Vercel en Preview.** Las versiones de prueba piden login de Vercel, así que el aviso de Mercado Pago no llega ahí. Para probar el pago de punta a punta: usar la dirección de producción con claves de prueba, o activar "Protection Bypass for Automation" | Probar en producción con claves de prueba, antes de difundir | Prueba de pago |
| D19 | **Link fijo de MP** (`https://mpago.la/1cKaMGj`, ARS 42.000, creado por Manu el 6/11). Convive con el pago desde la web. Sirve para mandarlo por Instagram. Redirección después del pago: `https://comunicatumarca.com/evento/entrada` (MP le agrega `payment_id`). Esos pagos no reservan lugar ni controlan el tope: se emite la entrada aunque se pase de 40 (queda marcada) | Activo | — |
| D20 | **Filtro del link por producto.** Se acepta solo un pago por el precio exacto (ARS 42.000 ±1) aprobado desde el 5/11/26. Si cobrás otro producto por ese mismo monto, cargá en `settings.mp_link_match` una palabra del título del producto (por ejemplo "18/11") | Precio exacto + fecha | — |
| D21 | **Cuándo cambiar el DNS.** Al apuntar `comunicatumarca.com` a Vercel, la web actual de Hostinger deja de verse y el inicio pasa a ser el provisional hasta que esté la landing principal (S8). ¿Se cambia ya (para vender la clase en `/evento`) o cuando esté el inicio nuevo? | Se cambia cuando Manu confirme | Difusión |
| D22 | **Microsoft Clarity** (proyecto `z96epwr8ri`). Instalado en las páginas públicas (`/` y `/evento`); no carga en el comprobante, panel, baja ni pruebas. Enmascara campos de formulario por defecto. Conviene sumar una línea de privacidad (cookies de medición) | Instalado | — |
| D23 | **Cobro solo por link (6/11).** No se usa Checkout Pro desde la web: el formulario de `/evento` guarda el lead y redirige a `https://mpago.la/1cKaMGj`. Consecuencias: no hay reserva de lugar ni tope automático (si se pasa de 40, la entrada se emite y queda marcada); la entrada se emite cuando la persona vuelve a `/evento/entrada` y el pago se verifica con `MP_ACCESS_TOKEN` (producción, solo lectura). Sin webhook: si alguien paga y no vuelve a la web, se carga a mano desde el panel. `/api/checkout` queda en el código, sin uso | Activo | — |
| D24 | **Mails: a dónde llegan las pruebas y tu aviso de venta.** Ahora se configura en la base (`settings.email_test_recipients`, `settings.manu_notify_email`), sin tocar Vercel. ¿Qué mail uso? | Vacíos: no sale ningún mail | Mails |
| D25 | **Secretos que sobran.** `MP_ACCESS_TOKEN` en Vercel ya no se usa (lo usa la Edge Function); se puede borrar de Vercel. `MP_PUBLIC_KEY`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET` y `NEXT_PUBLIC_CLARITY_PROJECT_ID` en Supabase tampoco se usan | — | — |
| D26 | **Evento de Cal.com** creado el 6/11: 45 min, Google Meet, aviso mínimo de 12 h, 15 min de margen después, preguntas: WhatsApp, Instagram o web, a qué te dedicás y qué querés lograr en 6 meses (todas obligatorias). ¿Duración, aviso mínimo y preguntas están bien? | Como está | Inicio |
| D27 | **Webhook de Bunny sin firma (6/11, Manu).** No se carga `BUNNY_STREAM_READONLY_KEY`: el aviso se acepta sin verificar la firma, porque el estado del video siempre se relee de la API de Bunny. Webhook configurado por Manu en la librería 801645 | Activo | — |
| D28 | **Meta (6/11).** Pixel elegido al principio (reemplazado en D29): "Comunica tu marca Web" (`1541348264386482`, portafolio ᴍᴀɴᴜᴄᴀ/ Estudia conmigo!). Ya está en `/` y `/evento` (PageView + Lead deduplicado). Cuentas publicitarias: "Ads ManuelCasaubon" (`1929675617525189`, USD, en el portafolio) y `63695471` (ARS, sin portafolio). Con el conector de Meta Ads en Claude no hace falta el usuario del sistema ni la CLI (S10): alcanza para leer campañas, métricas y píxeles y para crear o pausar campañas con confirmación. El token de la Conversions API sigue haciendo falta, porque el servidor del sitio no usa el conector | Activo | — |
| D29 | **Cuentas de Meta a usar (6/11, Manu).** Portafolio comercial (Business): `330388412037713` (ᴍᴀɴᴜᴄᴀ/ Estudia conmigo!). Cuenta publicitaria: "Ads ManuelCasaubon" `1929675617525189` (`act_1929675617525189`, en USD, del mismo portafolio). Pixel/dataset: **"Comunica Tu Marca | Offer Nov 2026" `1821219275793871`** (corregido por Manu el 6/11; reemplaza a "Comunica tu marca Web" `1541348264386482`, que ya no se usa). La cuenta `63695471` (ARS, sin portafolio) no se usa. El token de la Conversions API y cualquier usuario del sistema se generan dentro de este portafolio | Activo | — |
| D14 | **Esfuerzo de las sesiones.** Las sesiones se crean con Opus 5.5. El nivel de esfuerzo "medio" no se puede fijar al crearlas: se ajusta en cada sesión con `/effort` | — | — |

## Decisiones de diseño (las suman las sesiones de bocetos)

### S1 — Página ([bocetos A/B](https://claude.ai/artifact/8hKkabJBiCZ42fVaQFAK8c), archivo `bocetos/pagina.html`)

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| S1: 1 | **Versión de la landing.** ¿A "Fiel al boceto" (estructura completa, video debajo del hero, barra fija en el celular) o B "Video primero" (título → video → tira de datos → contador, cuerpo más corto, programa en acordeón)? ¿O una mezcla? | **Resuelto (6/11, Manu): versión A.** Pago solo con el link fijo de MP (D19) | — |
| S1: 2 | **Contador "Quedan N de 30" (solo en B).** ¿Se muestra desde el primer día o recién cuando quedan pocos (por ejemplo, menos de 15)? Con muchos lugares libres puede jugar en contra | Desde el primer día, con el número real de la base | Landing final |
| S1: 3 | **Alumnos en la versión B.** El orden de la spec para B no incluye "Algunos alumnos". ¿Los sumamos (cuando haya permiso) o B queda sin casos? | B sin casos; A con los 3 casos marcados "pendiente de permiso escrito" | Landing final |
| S1: 4 | **Dónde va el formulario.** En ambas versiones está al final (`#reservar`) y todos los botones bajan ahí. ¿Lo querés también arriba, en el hero? | Al final, con barra fija en el celular (A) | Landing final |
| S1: 5 | **Formulario de un paso o de dos.** Los bocetos usan la forma de un paso (formulario A de S2). Si elegís el de dos pasos de S2, cambia solo ese bloque | Un paso | Landing final |
| S1: 6 | **"Las reglas del juego cambiaron".** Hay 3 casilleros `[Cambio de 2027: lo define Manu]`. ¿Son 2 o 3 cambios, y van como sección propia (así está) o dentro del bloque de bienvenida del programa? | Sección propia después de las preguntas | Landing final |
| S1: 7 | **Póster del VSL.** Hoy es la escena en texto sobre fondo oscuro. Cuando grabes, ¿querés un cuadro tuyo de fondo en el póster, o se queda en texto? | Solo texto | VSL |
| S1: 8 | **Bio en B.** En B saqué la línea de "30.000 seguidores nuevos en Instagram" para acortar. ¿La dejamos? | Sin esa línea en B; completa en A | Landing final |
| S1: 9 | **Precio en la página.** Se muestra "USD 27" y "pagás en pesos". ¿Mostramos también el monto en pesos cuando esté definido (D3)? | Solo USD 27 | Landing final |
| S1: 10 | **"Quedan N de 30" en la landing A.** Se muestra el número real recién cuando baja de 30; mientras tanto dice "Solo 30 lugares" | Así | — |
| S1: 11 | **Agotado.** Con `left_public` en 0 (o `sales_open` en false) el formulario se reemplaza por "Agotado" y el link "¿Querés que te avise si se libera un lugar? Mandame TALLER". El link fijo de MP no controla el tope: es solo visual | Así | — |
| S1: 12 | **Reglas de 2027 y casos de alumnos.** En producción están apagados (`MOSTRAR_REGLAS_2027` y `MOSTRAR_CASOS` en `src/components/landing/contenido.ts`). Las reglas se cargan en `REGLAS_2027` cuando las definas (D6); los casos salen con el permiso escrito (D11) | Apagados | — |

### S2 — Formulario ([boceto A/B](https://claude.ai/artifact/E9BUStmJjqnDZaLe1pXB7u))

| # | Pregunta | Por defecto mientras tanto |
|---|---|---|
| S2:1 | **¿A (un paso) o B (dos pasos)?** ¿O los dos en el A/B del final (S7)? | A en la landing; B queda lista para el A/B |
| S2:2 | **En B, el mail del paso 1 se guarda antes del nombre y del consentimiento.** Sirve para escribirle a quien no terminó. ¿Te parece bien? | Se guarda como lead sin consentimiento: no recibe la campaña de venta hasta que marque la casilla |
| S2:3 | **WhatsApp.** A lo pide como opcional, con la ayuda "Por si hay un cambio de último momento". B no lo pide. ¿Lo pedimos? ¿Te sirve ese texto? | Opcional en A, fuera de B |
| S2:4 | **"¿Qué te gustaría resolver en la clase?"** está solo en B. ¿Lo sumamos a A? Te puede servir para preparar la clase y la auditoría | Solo en B |
| S2:5 | **Texto del botón final.** A dice "Reservar mi lugar" y B "Ir a pagar". Con el pago conectado (S3), los dos llevan a Mercado Pago | Se mantienen así |
| S2:6 | **Mensaje si el pago todavía no está conectado:** "¡Listo! Te escribimos con el link de pago". Promete un mail que hoy nadie manda. Con S3 conectado no aparece | Solo se ve en `/prueba/formulario` |
| S2:7 | **Instagram o web en un solo campo.** "@usuario" o "usuario" va como Instagram; algo con punto, como "juan.perez", se toma como web. ¿Preferís dos campos separados? | Un campo |

### S3 — Pago y comprobante (boceto: https://claude.ai/artifact/MPTpXVf7zC2SYCWAJna4fR)

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| S3: 1 | **¿Versión A "Directo" o B "Con pausa"?** A va del formulario a Mercado Pago. B pide solo nombre y mail, muestra "Ya estás anotado/a, falta el pago" y ofrece "Pagar después: te mando el link por mail" | El backend sirve para las dos. Recomiendo A para el lanzamiento (menos pasos con una fecha tan cerca) y probar B como A/B si hay tráfico | Landing final |
| S3: 2 | **Si elegís B: plantilla `link_pago`** para "Pagar después". Hay que escribirla y aprobarla, y decidir si sale aunque la persona no marque el consentimiento (es un mail que pidió) | No existe: el botón "Pagar después" no se construye hasta que decidas | Versión B |
| S3: 3 | **Plantillas `confirmacion_entrada` y `aviso_manu`.** Están en borrador. Sin aprobar, la entrada se emite y se ve en `/entrada`, pero no sale ningún mail. Si la persona no dejó nombre, el saludo queda "Hola, , ¿cómo estás?": ¿lo cambiamos a "Hola, ¿cómo estás?" | Borrador | **Cobrar** |
| S3: 4 | **Reenvío "ya tenés tu entrada".** Como nadie recibe dos veces la misma plantilla, si la persona ya recibió la confirmación, el reenvío no sale. ¿Querés una plantilla aparte (`reenvio_entrada`)? | Se intenta con `confirmacion_entrada`; si ya salió, la pantalla dice "Ya tenés tu entrada" y la persona puede escribirte | — |
| S3: 5 | **Botón "Avisarme por Instagram" en el comprobante** (D2) | Apagado: la confirmación llega por mail y a vos te llega el aviso | — |
| S3: 6 | **Reservas falsas.** Cada mail nuevo que toca "pagar" reserva un lugar 20 min. Alguien con mala intención podría agotar el cupo un rato con mails inventados. Hay un límite de 5 intentos por minuto por IP | Límite por IP + reserva de 20 min (D9). Si pasa, se baja `hold_minutes` desde el panel | — |
| S3: 7 | **Dos migraciones para que S0 revise y aplique** (no están aplicadas): `20261105000102` corrige un bug de `upsert_lead`, que falla con "person_id is ambiguous" cada vez que llega con la cookie `vid` (rompe el formulario y el pago); `20261105000101` hace que `aviso_manu` salga una vez por compra y no una sola vez en toda la venta | **Resuelto (6/11, S0):** revisadas, probadas y aplicadas en Supabase. La prueba de la base ahora pasa `p_visitor_id` | — |
| S3: 8 | **Perfil de auditoría por server action** en `/entrada` en vez de `POST /api/entrada/perfil`, para no salir de las carpetas de S3. Mismo contrato `{ o, perfil }` | Server action | — |

### S9 — Videos con Bunny Stream

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| S9:1 | **D7 resuelto: Bunny Stream** (librería 801645), con reproductor propio `VideoBunny`. Ver SPEC §5.9 | Activo | — |
| S9:2 | **Cargar dos secretos en Supabase** (Edge Functions → Secrets): `BUNNY_STREAM_API_KEY` y `BUNNY_STREAM_READONLY_KEY` (esta última firma el webhook: Bunny sí firma, con la key de solo lectura de la librería). Hasta entonces `bunny-sync` y `bunny-upload` responden "Falta el secreto …" y el webhook responde 500 | Sin videos: la web muestra el póster de texto | Videos |
| S9:3 | **Configurar el webhook en Bunny** (librería → Webhooks): `https://qzfzswascgitycynwlkk.supabase.co/functions/v1/bunny-webhook` | Sin webhook, `bunny-sync` actualiza el estado cada 30 min | Estado en vivo |
| S9:4 | **El `uso` de cada video se asigna a mano** (`vsl_evento`, `vsl_inicio`): la sincronización no lo pisa. Si hay varios listos con el mismo uso, la web usa el más nuevo. S5 puede hacerlo desde el panel | SQL a mano | Mostrar el video |
| S9:5 | **Seguridad del CDN de Bunny.** Los videos se sirven por URL directa del CDN (`vz-….b-cdn.net`), sin firmar, así que quien tenga el link puede verlos. Si el VSL tiene que ser privado, hay que activar Token Authentication en Bunny y firmar las URLs desde el servidor | URLs directas | — |
| S9:6 | **Archivos de otras sesiones que toqué** (mínimo, a revisar por S0): `src/lib/supabase/database.types.ts` (sumé `videos`, `bunny_webhook_events`, `vsl_metricas` y 2 columnas de `settings` a mano; conviene regenerar los tipos) y `package.json` (dependencia `hls.js`) | — | — |
