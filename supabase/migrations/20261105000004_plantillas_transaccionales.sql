-- Plantillas que usa el flujo de pago. Quedan en borrador: Manu las aprueba en el panel antes de que salgan.
insert into public.email_templates (key, kind, audience, subject, preheader, body) values
('confirmacion_entrada', 'transactional', 'con_entrada',
 'Tu lugar para el 18/11 está reservado',
 'Tu entrada: {{codigo}}. Miércoles 18/11, de 18 a 21 h, en Palermo Soho.',
 'Hola, {{nombre}}, ¿cómo estás?

Ya tenés tu lugar para la clase en vivo "Cómo destacar con tu marca personal en 2027".

Cuándo: miércoles 18/11, de 18 a 21 h. Las puertas abren a las 17:45.
Dónde: Niceto Vega 4601, Palermo Soho, CABA.
Tu entrada: {{codigo}}

Acá podés ver y bajar tu comprobante: [ver mi entrada]({{link_entrada}})

Si tenés cualquier duda, respondé este mail.

Te espero el 18.
Manu'),
('aviso_manu', 'transactional', 'manu',
 'Nueva entrada: {{nombre}} ({{codigo}})',
 'Vendidas {{vendidas}} de {{cupo}}.',
 'Entró un pago aprobado.

Nombre: {{nombre}}
Mail: {{email}}
Monto: {{monto}}
Entrada: {{codigo}}
Origen: {{origen}}

Vendidas: {{vendidas}} de {{cupo}} (tope de sala: {{tope}}).')
on conflict (key) do nothing;
