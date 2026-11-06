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

_Pendiente: las agregan S1, S2 y S3._

### S2 — Formulario ([boceto A/B](https://claude.ai/artifact/E9BUStmJjqnDZaLe1pXB7u))

Respuestas de Manu del 6/11/26:

| # | Pregunta | Decidido |
|---|---|---|
| S2:1 | ¿A (un paso) o B (dos pasos)? | **B.** Es la variante por defecto del componente. A queda en el código solo por si se usa en el A/B (S7) |
| S2:2 | En B, ¿se guarda el mail del paso 1 antes del nombre y del consentimiento? | **Sí**, por si la persona no termina. Sin la casilla marcada no recibe la campaña |
| S2:3 | ¿WhatsApp? ¿Sirve la ayuda "Por si hay un cambio de último momento"? | **Obligatorio** (en el paso 2 de B y también en A), con esa ayuda |
| S2:4 | "¿Qué te gustaría resolver en la clase?" | Queda en B, opcional |
| S2:5 | Texto del botón final | B: "Ir a pagar" |
| S2:6 | ¿"Te escribimos con el link de pago"? | **No.** Al terminar se llama a `POST /api/checkout` (S3) y se redirige a Mercado Pago. Si el pago no abre, el formulario muestra "Tus datos están guardados" con el botón "Pagar con Mercado Pago" ahí mismo |
| S2:7 | Instagram y web, ¿un campo o dos? | **Un campo** |
