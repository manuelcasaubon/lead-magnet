-- Saludo sin "Hola, , ¿cómo estás?" cuando la persona no dejó nombre: {{saludo}} lo arma la Edge Function.
update public.email_templates
   set body = replace(body, 'Hola, {{nombre}}, ¿cómo estás?', '{{saludo}}')
 where key = 'confirmacion_entrada' and body like 'Hola, {{nombre}}, ¿cómo estás?%';
