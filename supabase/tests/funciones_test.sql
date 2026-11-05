-- Prueba de cupo, leads e idempotencia de pagos. Correr: ver supabase/tests/README.md
\set ON_ERROR_STOP on
set role service_role;
grant all on all tables in schema public to service_role;
reset role;
grant all on all tables in schema public to service_role;
set role service_role;

update settings set price_ars = 40000, capacity_max = 3, capacity_public = 2;

-- Lead sin duplicados (mayúsculas distintas = misma persona) y sin pisar datos con vacíos
select * from upsert_lead('Ana@Mail.com', 'Ana', null, '@ana', null, null, 'form', true, 'acepto', null, '{"utm_source":"ig"}');
select * from upsert_lead('ana@mail.com', '', '1155', null, null, null, 'instagram_dm');
select email, name, phone, instagram, marketing_consent, first_source from people;
select count(*) as toques from lead_touches;

-- Reserva: reutiliza la orden pendiente de la misma persona
select id as o1 from reserve_order((select id from people limit 1)) \gset
select id as o1b from reserve_order((select id from people limit 1)) \gset
select :'o1' = :'o1b' as reutiliza;

-- Pago aprobado, repetido 3 veces: una sola entrada, newly_approved solo la primera
select * from apply_payment(jsonb_build_object('id', 111, 'status','approved','external_reference', :'o1','transaction_amount',40000,'payer',jsonb_build_object('email','ana@mail.com')));
select * from apply_payment(jsonb_build_object('id', 111, 'status','approved','external_reference', :'o1','transaction_amount',40000));
select * from apply_payment(jsonb_build_object('id', 112, 'status','rejected','external_reference', :'o1','transaction_amount',40000));
select count(*) entradas, (select status from orders where id = :'o1') estado, (select status from people limit 1) persona from tickets;

-- Ya tiene entrada: no puede reservar otra
do $$ begin perform reserve_order((select id from people where email='ana@mail.com')); raise exception 'debió fallar';
exception when others then if sqlerrm <> 'already_has_ticket' then raise; end if; end $$;

-- Tope: capacity_max 3 → 1 vendida + 2 reservas, la 4ta falla
select person_id as p2 from upsert_lead('b@x.com') \gset
select person_id as p3 from upsert_lead('c@x.com') \gset
select person_id as p4 from upsert_lead('d@x.com') \gset
select id as o2 from reserve_order(:'p2') \gset
select id as o3 from reserve_order(:'p3') \gset
do $$ begin perform reserve_order((select id from people where email='d@x.com')); raise exception 'debió fallar';
exception when others then if sqlerrm <> 'sold_out' then raise; end if; end $$;
select * from seats_status();

-- Monto menor: no emite entrada
select * from apply_payment(jsonb_build_object('id', 200, 'status','approved','external_reference', :'o2','transaction_amount',10));
-- Pago que llega tarde aunque esté lleno: entrada igual, marcada overbooked si se pasa del tope
update settings set capacity_max = 1;
select * from apply_payment(jsonb_build_object('id', 300, 'status','approved','external_reference', :'o3','transaction_amount',40000));
-- Devolución: cancela la entrada y la persona vuelve a lead
select * from apply_payment(jsonb_build_object('id', 300, 'status','refunded','external_reference', :'o3','transaction_amount',40000));
select p.email, p.status, t.status, t.overbooked from tickets t join people p on p.id=t.person_id order by p.email;
-- Pago sin orden válida no rompe
select * from apply_payment(jsonb_build_object('id', 999, 'status','approved','external_reference','no-es-uuid'));
-- Baja
select unsubscribe((select unsubscribe_token from people where email='ana@mail.com'));
select marketing_consent, unsubscribed_at is not null baja from people where email='ana@mail.com';
-- Re-suscripción por formulario no revive el consentimiento de quien se dio de baja
select * from upsert_lead('ana@mail.com', p_consent => true);
select marketing_consent from people where email='ana@mail.com';
reset role;

-- RLS: anon no ve nada; authenticated sin ser admin no ve nada
set role anon;
do $$ begin perform 1 from people; raise exception 'anon pudo leer';
exception when insufficient_privilege then null; end $$;
reset role;
set role authenticated;
select count(*) as autenticado_no_admin_ve from people;
reset role;
\echo OK
