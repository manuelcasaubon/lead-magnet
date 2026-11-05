-- Simulación del flujo de S3 contra un Postgres local (no contra Supabase).
-- Correr después de aplicar las migraciones como indica supabase/tests/README.md:
--   $P -d t -f src/lib/pagos/pruebas/simulacion.sql      # termina en "OK S3"
\set ON_ERROR_STOP on
reset role;
grant all on all tables in schema public to service_role;
set role service_role;
update settings set price_ars = 30000, capacity_max = 2, capacity_public = 2, sales_open = true;
delete from email_sends; delete from tickets; delete from payments; delete from orders; delete from mp_notifications;

-- /api/checkout: lead con source=checkout + reserva
select person_id as pa from upsert_lead('compra@x.com', 'Compra Uno', p_source => 'checkout') \gset
select person_id as pb from upsert_lead('compra2@x.com', 'Compra Dos', p_source => 'checkout') \gset
select person_id as pc from upsert_lead('compra3@x.com', p_source => 'checkout') \gset
select id as oa from reserve_order(:'pa', null, 'ig') \gset
select id as ob from reserve_order(:'pb', null, 'directo') \gset
select set_order_preference(:'oa', '123-pref');
-- Tope bajo (capacity_max 2): la tercera persona no puede reservar
do $$ begin perform reserve_order((select id from people where email='compra3@x.com')); raise exception 'debió fallar';
exception when others then if sqlerrm <> 'sold_out' then raise; end if; end $$;

-- El webhook llega 3 veces con el mismo x-request-id: solo la primera fila entra
insert into mp_notifications (request_id, topic, resource_id, signature_ok) values ('req-1','payment','900001', true);
do $$ begin insert into mp_notifications (request_id, topic, resource_id, signature_ok) values ('req-1','payment','900001', true);
  raise exception 'debió fallar'; exception when unique_violation then null; end $$;

-- JSON con la forma real de GET /v1/payments/{id} (recortado)
\set pago '{"id":900001,"status":"approved","status_detail":"accredited","currency_id":"ARS","transaction_amount":30000,"date_approved":"2026-11-06T15:04:05.000-04:00","payment_method_id":"master","live_mode":false,"payer":{"email":"test_user_123@testuser.com"},"transaction_details":{"net_received_amount":28500},"fee_details":[{"type":"mercadopago_fee","amount":1500}],"metadata":{"order_id":"x"}}'
create temp table r as select * from apply_payment(jsonb_set(:'pago'::jsonb, '{external_reference}', to_jsonb(:'oa'::text)));
insert into r select * from apply_payment(jsonb_set(:'pago'::jsonb, '{external_reference}', to_jsonb(:'oa'::text)));
insert into r select * from apply_payment(jsonb_set(:'pago'::jsonb, '{external_reference}', to_jsonb(:'oa'::text)));
do $$ begin
  if (select count(*) from r where newly_approved) <> 1 then raise exception 'newly_approved debe salir 1 vez'; end if;
  if (select count(distinct ticket_code) from r) <> 1 then raise exception 'debe haber un solo código'; end if;
  if (select count(*) from tickets) <> 1 then raise exception 'una sola entrada'; end if;
  if (select fee_amount from payments where mp_payment_id = 900001) <> 1500 then raise exception 'comisión'; end if;
  if (select status from people where email='compra@x.com') <> 'ticket' then raise exception 'persona a ticket'; end if;
end $$;

-- Pago de otra orden (external_reference ajena): /entrada no lo aplica (lo filtra procesarPago antes de llamar a la base).
-- Un pago sin orden se guarda pero no toca nada:
select * from apply_payment('{"id":900009,"status":"approved","transaction_amount":30000}'::jsonb);

-- Mails: aviso_manu una vez POR COMPRA (migración 20261105000101); confirmación una sola vez por persona
insert into email_sends (template_id, template_version, person_id, to_email)
  select id, 1, :'pa', 'manu@x.com' from email_templates where key = 'aviso_manu';
insert into email_sends (template_id, template_version, person_id, to_email)
  select id, 1, :'pb', 'manu@x.com' from email_templates where key = 'aviso_manu';
insert into email_sends (template_id, template_version, person_id, to_email)
  select id, 1, :'pa', 'compra@x.com' from email_templates where key = 'confirmacion_entrada';
do $$ begin
  insert into email_sends (template_id, template_version, person_id, to_email)
    select id, 1, (select id from people where email='compra@x.com'), 'compra@x.com' from email_templates where key = 'confirmacion_entrada';
  raise exception 'debió fallar'; exception when unique_violation then null; end $$;
do $$ begin
  insert into email_sends (template_id, template_version, person_id, to_email)
    select id, 1, (select id from people where email='compra@x.com'), 'manu@x.com' from email_templates where key = 'aviso_manu';
  raise exception 'debió fallar'; exception when unique_violation then null; end $$;

-- Devolución → entrada cancelada y la persona vuelve a lead
select * from apply_payment(jsonb_set(jsonb_set(:'pago'::jsonb, '{status}', '"refunded"'), '{external_reference}', to_jsonb(:'oa'::text)));
do $$ begin
  if (select status from tickets) <> 'cancelled' then raise exception 'devolución'; end if;
  if (select status from people where email='compra@x.com') <> 'lead' then raise exception 'persona a lead'; end if;
end $$;
select 'OK S3' as resultado;
