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

Bocetos de la página (S1): [Artifact privado](https://claude.ai/artifact/8hKkabJBiCZ42fVaQFAK8c) · archivo `bocetos/pagina.html`.

| # | Decisión | Por defecto mientras tanto | Bloquea |
|---|---|---|---|
| S1: 1 | **Versión de la landing.** ¿A "Fiel al boceto" (estructura completa, video debajo del hero, barra fija en el celular) o B "Video primero" (título → video → tira de datos → contador, cuerpo más corto, programa en acordeón)? ¿O una mezcla? | Ninguna: no se construye `src/` hasta que elijas | Landing final |
| S1: 2 | **Contador "Quedan N de 30" (solo en B).** ¿Se muestra desde el primer día o recién cuando quedan pocos (por ejemplo, menos de 15)? Con muchos lugares libres puede jugar en contra | Desde el primer día, con el número real de la base | Landing final |
| S1: 3 | **Alumnos en la versión B.** El orden de la spec para B no incluye "Algunos alumnos". ¿Los sumamos (cuando haya permiso) o B queda sin casos? | B sin casos; A con los 3 casos marcados "pendiente de permiso escrito" | Landing final |
| S1: 4 | **Dónde va el formulario.** En ambas versiones está al final (`#reservar`) y todos los botones bajan ahí. ¿Lo querés también arriba, en el hero? | Al final, con barra fija en el celular (A) | Landing final |
| S1: 5 | **Formulario de un paso o de dos.** Los bocetos usan la forma de un paso (formulario A de S2). Si elegís el de dos pasos de S2, cambia solo ese bloque | Un paso | Landing final |
| S1: 6 | **"Las reglas del juego cambiaron".** Hay 3 casilleros `[Cambio de 2027: lo define Manu]`. ¿Son 2 o 3 cambios, y van como sección propia (así está) o dentro del bloque de bienvenida del programa? | Sección propia después de las preguntas | Landing final |
| S1: 7 | **Póster del VSL.** Hoy es la escena en texto sobre fondo oscuro. Cuando grabes, ¿querés un cuadro tuyo de fondo en el póster, o se queda en texto? | Solo texto | VSL |
| S1: 8 | **Bio en B.** En B saqué la línea de "30.000 seguidores nuevos en Instagram" para acortar. ¿La dejamos? | Sin esa línea en B; completa en A | Landing final |
| S1: 9 | **Precio en la página.** Se muestra "USD 27" y "pagás en pesos". ¿Mostramos también el monto en pesos cuando esté definido (D3)? | Solo USD 27 | Landing final |
