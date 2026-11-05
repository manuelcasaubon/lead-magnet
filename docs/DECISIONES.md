# Decisiones que dependen de Manu

Cada sesión suma acá lo que necesita que decidas. Se revisa todo junto cuando esté construido. Mientras tanto, cada punto tiene un valor por defecto para no frenar el trabajo.

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| D1 | **Dominio de la landing.** ¿Subdominio de `comunicatumarca.com` (p. ej. `clase.comunicatumarca.com`) o el `.vercel.app`? | Se trabaja en `*.vercel.app` (preview) | Difusión |
| D1b | **Seguimiento de aperturas y clics en Resend.** Hoy está apagado en `info.comunicatumarca.com`. Prenderlo cambia la configuración del dominio y los links pasan por un redireccionador | Apagado: se miden entregas, rebotes, quejas y bajas, pero no aperturas ni clics | Métricas de mails |
| D2 | **Formulario y "Mandame TALLER".** ¿El formulario reemplaza al DM o conviven? | Conviven: formulario como CTA principal y "¿Preferís por Instagram?" como link secundario medido (`instagram_click`). Las ventas por DM se cargan en el panel con fuente `instagram_dm` | Landing final |
| D3 | **Precio en pesos y comisión.** ¿Cuántos ARS? ¿Absorbés la comisión de MP? | `price_ars` vacío = no se puede pagar. `absorb_fee = true` | **Cobrar** |
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
| D14 | **Esfuerzo de las sesiones.** Las sesiones se crean con Opus 5.5. El nivel de esfuerzo "medio" no se puede fijar al crearlas: se ajusta en cada sesión con `/effort` | — | — |

## Decisiones de diseño (las suman las sesiones de bocetos)

_Pendiente: las agregan S1 y S2._

### S3 — Pago y comprobante (boceto: https://claude.ai/artifact/MPTpXVf7zC2SYCWAJna4fR)

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| S3: 1 | **¿Versión A "Directo" o B "Con pausa"?** A va del formulario a Mercado Pago. B pide solo nombre y mail, muestra "Ya estás anotado/a, falta el pago" y ofrece "Pagar después: te mando el link por mail" | El backend sirve para las dos. Recomiendo A para el lanzamiento (menos pasos con una fecha tan cerca) y probar B como A/B si hay tráfico | Landing final |
| S3: 2 | **Si elegís B: plantilla `link_pago`** para "Pagar después". Hay que escribirla y aprobarla, y decidir si sale aunque la persona no marque el consentimiento (es un mail que pidió) | No existe: el botón "Pagar después" no se construye hasta que decidas | Versión B |
| S3: 3 | **Plantillas `confirmacion_entrada` y `aviso_manu`.** Están en borrador. Sin aprobar, la entrada se emite y se ve en `/entrada`, pero no sale ningún mail. Si la persona no dejó nombre, el saludo queda "Hola, , ¿cómo estás?": ¿lo cambiamos a "Hola, ¿cómo estás?" | Borrador | **Cobrar** |
| S3: 4 | **Reenvío "ya tenés tu entrada".** Como nadie recibe dos veces la misma plantilla, si la persona ya recibió la confirmación, el reenvío no sale. ¿Querés una plantilla aparte (`reenvio_entrada`)? | Se intenta con `confirmacion_entrada`; si ya salió, la pantalla dice "Ya tenés tu entrada" y la persona puede escribirte | — |
| S3: 5 | **Botón "Avisarme por Instagram" en el comprobante** (D2) | Apagado: la confirmación llega por mail y a vos te llega el aviso | — |
| S3: 6 | **Reservas falsas.** Cada mail nuevo que toca "pagar" reserva un lugar 20 min. Alguien con mala intención podría agotar el cupo un rato con mails inventados. Hay un límite de 5 intentos por minuto por IP | Límite por IP + reserva de 20 min (D9). Si pasa, se baja `hold_minutes` desde el panel | — |
| S3: 7 | **Dos migraciones para que S0 revise y aplique** (no están aplicadas): `20261105000102` corrige un bug de `upsert_lead`, que falla con "person_id is ambiguous" cada vez que llega con la cookie `vid` (rompe el formulario y el pago); `20261105000101` hace que `aviso_manu` salga una vez por compra y no una sola vez en toda la venta | Sin aplicar. **La 102 es urgente**: sin ella no se guarda ningún lead que venga de la web | **Cobrar** y formulario |
| S3: 8 | **Perfil de auditoría por server action** en `/entrada` en vez de `POST /api/entrada/perfil`, para no salir de las carpetas de S3. Mismo contrato `{ o, perfil }` | Server action | — |
