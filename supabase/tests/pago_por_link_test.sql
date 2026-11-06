-- Pagos con el link fijo de MP (adopt_link_payment). Correr después de funciones_test.sql o sobre una base nueva.
\set ON_ERROR_STOP on
reset role;
grant all on all tables in schema public to service_role;
set role service_role;
update settings set price_ars = 42000, capacity_max = 40, mp_link_match = null;

\set pago '{"id":777001,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"ARS","transaction_amount":42000,"description":"Clase en vivo 18/11","payer":{"email":"Link@Mail.com","first_name":"Lu","last_name":"Pérez"}}'
-- Primera vez (página de retorno): adopta, crea persona, orden y entrada
create temp table r as select * from adopt_link_payment(:'pago'::jsonb);
-- Aviso repetido (webhook) y otra vez: no crea nada nuevo
insert into r select * from adopt_link_payment(:'pago'::jsonb);
insert into r select * from adopt_link_payment(:'pago'::jsonb);
do $$ begin
  if (select count(*) from r where adopted) <> 1 then raise exception 'adopta una sola vez'; end if;
  if (select count(*) from r where newly_approved) <> 1 then raise exception 'aprobación nueva una sola vez'; end if;
  if (select count(distinct order_id) from r) <> 1 then raise exception 'una sola orden'; end if;
  if (select count(*) from tickets t join people p on p.id=t.person_id where p.email='link@mail.com') <> 1 then raise exception 'una entrada'; end if;
  if (select source from lead_touches lt join people p on p.id=lt.person_id where p.email='link@mail.com' limit 1) <> 'mp_link' then raise exception 'fuente'; end if;
  if (select name from people where email='link@mail.com') <> 'Lu Pérez' then raise exception 'nombre'; end if;
end $$;
-- Devolución posterior del mismo pago: cancela la entrada
select * from adopt_link_payment(jsonb_set(:'pago'::jsonb, '{status}', '"refunded"'));
do $$ begin if (select t.status from tickets t join people p on p.id=t.person_id where p.email='link@mail.com') <> 'cancelled' then raise exception 'devolución'; end if; end $$;

-- Monto menor, otra moneda o pendiente: no adopta
do $$ declare n int; begin
  select count(*) into n from adopt_link_payment('{"id":777002,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"ARS","transaction_amount":5000,"payer":{"email":"a@x.com"}}') where adopted;
  if n <> 0 then raise exception 'monto menor'; end if;
  select count(*) into n from adopt_link_payment('{"id":777003,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"USD","transaction_amount":42000,"payer":{"email":"b@x.com"}}') where adopted;
  if n <> 0 then raise exception 'moneda'; end if;
  select count(*) into n from adopt_link_payment('{"id":777004,"status":"pending","currency_id":"ARS","transaction_amount":42000,"payer":{"email":"c@x.com"}}') where adopted;
  if n <> 0 then raise exception 'pendiente'; end if;
end $$;
-- El pendiente, cuando se aprueba, sí se adopta
select adopted, newly_approved from adopt_link_payment('{"id":777004,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"ARS","transaction_amount":42000,"payer":{"email":"c@x.com"}}');

-- Otro monto (aunque sea mayor) o un pago anterior a la existencia del link: no se adopta
do $$ declare n int; begin
  select count(*) into n from adopt_link_payment('{"id":777010,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"ARS","transaction_amount":50000,"payer":{"email":"f@x.com"}}') where adopted;
  if n <> 0 then raise exception 'monto mayor'; end if;
  select count(*) into n from adopt_link_payment('{"id":777011,"status":"approved","date_approved":"2026-10-01T10:00:00-03:00","currency_id":"ARS","transaction_amount":42000,"payer":{"email":"g@x.com"}}') where adopted;
  if n <> 0 then raise exception 'pago viejo'; end if;
end $$;
-- Con filtro por título: otro producto de la misma cuenta no se adopta
update settings set mp_link_match = 'clase en vivo';
do $$ declare n int; begin
  select count(*) into n from adopt_link_payment('{"id":777005,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"ARS","transaction_amount":50000,"description":"Mentoría 1 a 1","payer":{"email":"d@x.com"}}') where adopted;
  if n <> 0 then raise exception 'otro producto'; end if;
  select count(*) into n from adopt_link_payment('{"id":777006,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"ARS","transaction_amount":42000,"description":"CLASE EN VIVO 18/11","payer":{"email":"e@x.com"}}') where adopted;
  if n <> 1 then raise exception 'producto correcto'; end if;
end $$;
-- Sin mail del pagador: entrada igual, con mail marcador
select adopted from adopt_link_payment('{"id":777007,"status":"approved","date_approved":"2026-11-07T10:00:00-03:00","currency_id":"ARS","transaction_amount":42000,"description":"Clase en vivo","payer":{}}');
do $$ begin if not exists (select 1 from people where email = 'mp-777007@sin-mail.invalid' and status = 'ticket') then raise exception 'sin mail'; end if; end $$;
update settings set mp_link_match = null;
reset role;
\echo OK LINK
