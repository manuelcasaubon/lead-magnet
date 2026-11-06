-- Mails con el estilo de comunicatumarca.com (6/11/26). Marcas de formato: ver supabase/functions/_shared/email.ts.
update public.email_templates set body =
'# Tu lugar está **reservado**

{{saludo}}

Ya tenés tu lugar para la clase en vivo "Cómo destacar con tu marca personal en 2027".

Cuándo: Miércoles 18/11, de 18 a 21 h
Puertas: 17:45
Dónde: Niceto Vega 4601, Palermo Soho, CABA
Tu entrada: **{{codigo}}**

[Ver mi entrada]({{link_entrada}})

Si tenés cualquier duda, respondé este mail.

Te espero el 18.
Manu'
where key = 'confirmacion_entrada';

update public.email_templates set body =
'# Nueva entrada: **{{codigo}}**

Entró un pago aprobado.

Nombre: {{nombre}}
Mail: {{email}}
Monto: {{monto}}
Origen: {{origen}}

Vendidas: **{{vendidas}} de {{cupo}}** (tope de sala: {{tope}})'
where key = 'aviso_manu';
