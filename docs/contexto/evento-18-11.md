# Evento 18 del 11

Evento presencial pago para vender Comunica Tu Marca. Forma parte del Plan de venta de noviembre 2026. Datos cargados el 5/11/26.

- **Doc completo:** [Evento 18 del 11](https://claude.ai/artifact/RLaKc2zTLkLMxdp47teppC#8002ed11-25a6)
- **Landing:** [De experto a comunicador](https://claude.ai/artifact/F5qnzFjDKGomAejW1kfY1k), privada hasta que Manu la comparta
- **Cómo armar otro:** Manual de eventos y charlas propias

## Datos
- **Cuándo:** miércoles 18/11/26, de 18 a 21 h. Puertas a las 17:45.
- **Dónde:** Niceto Vega 4601, Palermo Soho, CABA. Esta dirección no figura entre las 4 sedes del acuerdo con Working&Co: confirmar si la sala es de ellos.
- **Entrada:** USD 27 en pesos por Mercado Pago. Se descuenta si entra al programa.
- **Cupos:** comunicamos 30. La sala admite entre 30 y 40 (Manu, 5/11/26): si llegan más, mejor.
- **Graba:** Manu ya eligió a la persona.
- **A la mañana:** simposio de Pablo, a las 10 h.

## Nombre y propuesta de valor
Elegido por Manu el 5/11/26: **Cómo destacar con tu marca personal en 2027. De que nadie te conozca a que te llamen a vos.**
- **Formato:** clase en vivo presencial de 3 horas. No se comunica como "último" workshop: si va bien, puede haber otro en diciembre.
- **Escena central:** el speaker del que pensás "sabe, pero no sabe tanto como yo". ¿Por qué lo llaman a él? Porque comunica.
- **Se lleva:** planificación completa para 2027, auditoría personalizada de su marca y preguntas en vivo.
- **Regla de nombres:** en "de X a Y", X es una situación de dolor e Y la aspiracional.

## Timing
| Hora | Min | Bloque |
|---|---|---|
| 18:00 | 20 | Bienvenida |
| 18:20 | 30 | Comunicación estratégica |
| 18:50 | 30 | Comunicación creativa |
| 19:20 | 15 | Break, con testimonios |
| 19:35 | 30 | Comunicación de impacto |
| 20:05 | 30 | Plan 2027 y preguntas en vivo |
| 20:35 | 20 | Pitch de la oferta |
| 20:55 | 5 | Cierre y foto |
| 21:00 | | Salida |

## Venta
- **Pedido único:** "Mandame TALLER". Si no puede ir, escribe igual y entra al grupo para la clase online del 24/11.
- **Historias:** desde el 5/11, 3 por día. Del 15 al 17/11, lugares que quedan, siempre con el número real.
- **Pago:** botón de la landing, Mercado Pago en pesos, comprobante por Instagram con la palabra PAGUÉ, confirmación y grupo.

## Comprobante después del pago (idea de Ezequiel, 5/11/26)
- La persona paga, vuelve sola y le sale su entrada impresa en pantalla, con PDF. A Manu le llega el aviso.
- Es un comprobante de entrada, no una factura.
- Demo lista en `/Volumes/Trabajo IA/Descargas/taller-18-11/comprobante.html`, sin conectar a Mercado Pago.
- Propuesta: preferencia de Checkout Pro con URL de retorno a Make, que verifica el pago, guarda a la persona y muestra el comprobante. Las credenciales las cargan Manu o Ezequiel.

## Lo que falta de Manu (5/11/26)
- Definir el precio en pesos.
- Definir cómo se hace la auditoría personalizada con 30 personas.
- Grabar el mini VSL (guion en el doc).
- Crear el link de pago de Mercado Pago y pasar solo la URL.
- Permiso escrito de Joaco, Fer y Axel para usar su caso.
- Compartir la landing con link público y ponerla en la bio.

La checklist completa, con casilleros, está en el [doc](https://claude.ai/artifact/RLaKc2zTLkLMxdp47teppC#8002ed11-25a6).

## Precios del programa
- USD 2.000 hasta el 20/11 y USD 2.200 hasta el 30/11. Inicio 1/12.
- Clase online gratis: martes 24/11, 19:30 h. No se anuncia antes del 19/11.

## Qué se comunica en cada etapa
| Fechas | Se comunica | Pedido |
|---|---|---|
| 3 al 18/11 | Solo el taller | Comentá o mandame TALLER |
| 18 al 20/11 | Quienes fueron: el programa, de forma privada | Llamada o mensaje antes del 20/11 |
| 19 al 24/11 | Solo la clase online | Anotate |
| 25 al 30/11 | Solo el programa | Hablemos antes del 30/11 |

## Flujo de pago y comprobante

Idea de Ezequiel, 5/11/26: la persona paga, vuelve sola a la web, ve su entrada imprimirse en pantalla y baja el PDF. A Manu le llega el aviso y el dato queda guardado.

- Checkout Pro se crea desde el servidor, con URL de retorno y `auto_return`.
- El retorno trae `payment_id`, `status` y `external_reference`, pero esos datos se pueden falsificar. Siempre se confirma contra la API de Mercado Pago.
- No todos vuelven a la web, así que hace falta también el webhook. Debe tolerar avisos repetidos.
- Es un comprobante de entrada, no una factura. La factura es un trámite aparte.
- `docs/referencia/comprobante-demo.html` tiene la animación y el PDF con datos de ejemplo. Lo de Make que se menciona en otros documentos queda reemplazado por esta infraestructura.
- Docs: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/web-integration/configure-back-urls

## Guion del mini VSL

Dura 1:30, unas 215 palabras. Va a cámara y arranca con la escena, sin saludo. Sin nombres de alumnos hasta tener los permisos. La escena va también en texto, porque muchos lo ven sin sonido. El video todavía no está grabado.

| Tiempo | Bloque | Qué dice Manu |
| --- | --- | --- |
| 0:00 | La escena | ¿Te pasó de estar en un evento, escuchar al speaker y pensar: "sabe, pero no sabe tanto como yo"? Y enseguida aparece la otra pregunta: ¿por qué lo llaman a él y a mí no? |
| 0:12 | El motivo | La respuesta es simple: él está comunicando y vos todavía no. Sabés mucho, pero tu sector no lo sabe. Y las reglas del juego cambiaron, en las redes y en la estrategia de marca. |
| 0:25 | Las preguntas | Capaz ya tenés tu marca personal, o la querés empezar, y te preguntás: ¿qué hago con mi marca? ¿Qué contenido tendría que hacer? ¿Qué estrategia debería seguir? ¿Qué va a funcionar en 2027? |
| 0:40 | La clase | Para eso armé esta clase en vivo. Es presencial, en Palermo, el miércoles 18 de noviembre, de 18 a 21. Durante 3 horas trabajamos tus 3 niveles de comunicación: qué decís, cómo lo mostrás y cómo lo decís. |
| 0:58 | Qué te llevás | Te vas a llevar una auditoría personalizada de tu marca y una planificación completa para saber exactamente dónde poner el foco en 2027. Y me vas a poder hacer todas tus preguntas, en persona. |
| 1:10 | Quién soy | Soy Manu Casaubon. Trabajo con personas que tienen algo importante para decir, para que aprendan a comunicarlo siendo ellas mismas. |
| 1:18 | El pedido | Son solo 30 lugares y la entrada sale 27 dólares. Si querés que la próxima vez te llamen a vos, tocá el botón y reservá tu lugar. Nos vemos el 18. |
