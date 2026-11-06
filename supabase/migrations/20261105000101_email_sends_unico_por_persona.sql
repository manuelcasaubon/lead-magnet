-- S3 (pagos). Revisada y aplicada en Supabase por S0 el 6/11/26.
-- Problema: unique (template_id, to_email) hace que 'aviso_manu' (siempre al mismo mail, MANU_NOTIFY_EMAIL)
-- salga una sola vez en toda la venta: desde la segunda compra enviarPlantilla devuelve 'duplicate'.
-- Cambio: la unicidad pasa a (plantilla, mail, persona). procesarPago manda aviso_manu con person_id = quien compró,
-- así hay un aviso por compra. Para el resto no cambia nada: people.email es único, así que para cada mail hay
-- una sola persona y "nadie recibe dos veces la misma plantilla" se sigue cumpliendo.
-- enviarPlantilla no necesita cambios: sigue recibiendo el 23505 del índice único.

alter table public.email_sends drop constraint if exists email_sends_template_id_to_email_key;

create unique index if not exists email_sends_plantilla_mail_persona_key
  on public.email_sends (template_id, to_email, coalesce(person_id, '00000000-0000-0000-0000-000000000000'::uuid));
