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
| D20 | **Filtro del link por producto.** Si en tu cuenta de MP cobrás otras cosas por el mismo monto o más, cargá en `settings.mp_link_match` una palabra del título del producto (por ejemplo "18/11") para que solo esos pagos generen entrada | Vacío: se acepta cualquier pago aprobado en ARS por $42.000 o más que vuelva a la web | — |
| D21 | **Cuándo cambiar el DNS.** Al apuntar `comunicatumarca.com` a Vercel, la web actual de Hostinger deja de verse y el inicio pasa a ser el provisional hasta que esté la landing principal (S8). ¿Se cambia ya (para vender la clase en `/evento`) o cuando esté el inicio nuevo? | Se cambia cuando Manu confirme | Difusión |
| D22 | **Microsoft Clarity** (proyecto `z96epwr8ri`). Instalado en las páginas públicas (`/` y `/evento`); no carga en el comprobante, panel, baja ni pruebas. Enmascara campos de formulario por defecto. Conviene sumar una línea de privacidad (cookies de medición) | Instalado | — |
| D14 | **Esfuerzo de las sesiones.** Las sesiones se crean con Opus 5.5. El nivel de esfuerzo "medio" no se puede fijar al crearlas: se ajusta en cada sesión con `/effort` | — | — |

## Decisiones de diseño (las suman las sesiones de bocetos)

_S1 (página) sigue en su rama `claude/bocetos-pagina` hasta que elijas versión._

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
