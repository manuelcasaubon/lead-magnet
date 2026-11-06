# Decisiones que dependen de Manu

Cada sesión suma acá lo que necesita que decidas. Se revisa todo junto cuando esté construido. Mientras tanto, cada punto tiene un valor por defecto para no frenar el trabajo.

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| D1 | ~~Dominio de la landing~~ **Decidido (5/11):** `evento.comunicatumarca.com`. DNS en Hostinger: un CNAME `evento` al valor que muestra Vercel. Proyecto Vercel `lead-magnet` (`prj_LiVXyC6pnvJarxq7e0PxztlpTqzc`), creado por Manu | — | — |
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
| D15 | **Plan de Vercel.** La cuenta está en Hobby, que es para uso no comercial. Para vender entradas conviene Pro (USD 20 por mes). En Hobby, el cron de mails corre una vez por día | Hobby | Venta |
| D16 | **Rama de producción.** La rama principal de GitHub quedó en `claude/charming-allen-ywp6of` porque fue la primera que se subió. Propuesta: crear `main` y usarla como rama de producción en Vercel | — | Deploys |
| D14 | **Esfuerzo de las sesiones.** Las sesiones se crean con Opus 5.5. El nivel de esfuerzo "medio" no se puede fijar al crearlas: se ajusta en cada sesión con `/effort` | — | — |

## Decisiones de diseño (las suman las sesiones de bocetos)

_Pendiente: las agregan S1, S2 y S3._

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
