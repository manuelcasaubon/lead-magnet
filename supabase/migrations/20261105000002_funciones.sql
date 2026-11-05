-- Funciones del cupo, leads y pagos. Solo las ejecuta service_role (servidor de Next).
-- Contrato: docs/SPEC.md §3.3.

-- ---------------------------------------------------------------- estado del cupo
-- vendidas = entradas válidas. reservas = órdenes pendientes con reserva vigente.
create or replace function public.seats_status()
returns table (sold int, holds int, capacity_public int, capacity_max int,
               left_public int, left_max int, sales_open boolean, price_ars numeric)
language sql stable security invoker set search_path = '' as $$
  with s as (select * from public.settings where id = 1),
  v as (select count(*)::int n from public.tickets where status in ('valid','used')),
  h as (select count(*)::int n from public.orders
        where status in ('pending','in_process') and hold_expires_at > now())
  select v.n, h.n, s.capacity_public, s.capacity_max,
         greatest(s.capacity_public - v.n, 0), greatest(s.capacity_max - v.n - h.n, 0),
         s.sales_open and s.price_ars is not null and (v.n + h.n) < s.capacity_max,
         s.price_ars
  from s, v, h;
$$;

-- ---------------------------------------------------------------- lead sin duplicados
-- Crea o actualiza la persona por mail (citext: sin importar mayúsculas) y suma un "toque" con origen y UTM.
-- No pisa datos ya cargados con vacíos. El consentimiento solo se suma (la baja va por unsubscribe).
create or replace function public.upsert_lead(
  p_email text, p_name text default null, p_phone text default null,
  p_instagram text default null, p_brand_url text default null, p_goal text default null,
  p_source text default 'form', p_consent boolean default false, p_consent_text text default null,
  p_visitor_id uuid default null, p_utm jsonb default '{}', p_referrer text default null,
  p_path text default null, p_experiments jsonb default '{}')
returns table (person_id uuid, is_new boolean, status text)
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_new boolean; v_status text;
begin
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  insert into public.people as p (email, name, phone, instagram, brand_url, goal, first_source,
    first_utm, first_visitor_id, marketing_consent, consent_at, consent_text)
  values (lower(trim(p_email)), nullif(trim(p_name),''), nullif(trim(p_phone),''),
    nullif(trim(p_instagram),''), nullif(trim(p_brand_url),''), nullif(trim(p_goal),''), p_source,
    nullif(p_utm,'{}'::jsonb), p_visitor_id, coalesce(p_consent,false),
    case when p_consent then now() end, case when p_consent then p_consent_text end)
  on conflict (email) do update set
    name = coalesce(nullif(trim(excluded.name),''), p.name),
    phone = coalesce(nullif(trim(excluded.phone),''), p.phone),
    instagram = coalesce(nullif(trim(excluded.instagram),''), p.instagram),
    brand_url = coalesce(nullif(trim(excluded.brand_url),''), p.brand_url),
    goal = coalesce(nullif(trim(excluded.goal),''), p.goal),
    marketing_consent = p.marketing_consent or (excluded.marketing_consent and p.unsubscribed_at is null),
    consent_at = case when not p.marketing_consent and excluded.marketing_consent and p.unsubscribed_at is null
                      then now() else p.consent_at end,
    consent_text = case when not p.marketing_consent and excluded.marketing_consent and p.unsubscribed_at is null
                      then excluded.consent_text else p.consent_text end
  returning p.id, (xmax = 0), p.status into v_id, v_new, v_status;

  insert into public.lead_touches (person_id, source, visitor_id, utm_source, utm_medium,
    utm_campaign, utm_content, utm_term, referrer, path, experiments)
  values (v_id, p_source, p_visitor_id, p_utm->>'utm_source', p_utm->>'utm_medium',
    p_utm->>'utm_campaign', p_utm->>'utm_content', p_utm->>'utm_term', p_referrer, p_path,
    coalesce(p_experiments,'{}'));

  if p_visitor_id is not null then
    update public.visitors set person_id = v_id where id = p_visitor_id and person_id is null;
    update public.events set person_id = v_id where visitor_id = p_visitor_id and person_id is null;
  end if;

  return query select v_id, v_new, v_status;
end $$;

-- ---------------------------------------------------------------- reservar lugar al iniciar el pago
-- Bloquea la fila de settings para que dos pagos simultáneos no se pasen del tope.
-- Si la persona ya tiene una orden pendiente vigente, la reutiliza y renueva la reserva.
-- Errores: sales_closed | no_price | sold_out | already_has_ticket
create or replace function public.reserve_order(
  p_person_id uuid, p_visitor_id uuid default null, p_source text default null,
  p_utm jsonb default '{}', p_experiments jsonb default '{}')
returns public.orders
language plpgsql security invoker set search_path = '' as $$
declare s public.settings; v_sold int; v_holds int; o public.orders;
begin
  select * into s from public.settings where id = 1 for update;
  if not s.sales_open then raise exception 'sales_closed' using errcode = 'P0001'; end if;
  if s.price_ars is null then raise exception 'no_price' using errcode = 'P0001'; end if;

  if exists (select 1 from public.tickets t where t.person_id = p_person_id and t.status in ('valid','used')) then
    raise exception 'already_has_ticket' using errcode = 'P0001';
  end if;

  select * into o from public.orders
   where person_id = p_person_id and status in ('pending','in_process') and hold_expires_at > now()
   order by created_at desc limit 1;
  if found then
    update public.orders set hold_expires_at = now() + make_interval(mins => s.hold_minutes)
     where id = o.id returning * into o;
    return o;
  end if;

  select count(*) into v_sold from public.tickets where status in ('valid','used');
  select count(*) into v_holds from public.orders
   where status in ('pending','in_process') and hold_expires_at > now();
  if v_sold + v_holds >= s.capacity_max then raise exception 'sold_out' using errcode = 'P0001'; end if;

  insert into public.orders (person_id, amount_ars, hold_expires_at, visitor_id, source, utm, experiments)
  values (p_person_id, s.price_ars, now() + make_interval(mins => s.hold_minutes), p_visitor_id,
          p_source, nullif(p_utm,'{}'::jsonb), coalesce(p_experiments,'{}'))
  returning * into o;
  return o;
end $$;

create or replace function public.set_order_preference(p_order_id uuid, p_preference_id text)
returns void language sql security invoker set search_path = '' as $$
  update public.orders set mp_preference_id = p_preference_id where id = p_order_id;
$$;

-- ---------------------------------------------------------------- aplicar un pago ya verificado contra la API de MP
-- p_payment es el JSON de GET /v1/payments/{id}. Idempotente: se puede llamar N veces con el mismo pago.
-- Devuelve newly_approved = true solo la primera vez que la orden pasa a aprobada (para mandar mails una vez).
-- Un pago aprobado siempre genera entrada, aunque se pase del tope (overbooked = true): la plata ya entró.
create or replace function public.apply_payment(p_payment jsonb)
returns table (order_id uuid, order_status text, newly_approved boolean, ticket_code text, overbooked boolean)
language plpgsql security invoker set search_path = '' as $$
declare
  v_pid bigint := (p_payment->>'id')::bigint;
  v_status text := p_payment->>'status';
  v_order uuid;
  o public.orders;
  t public.tickets;
  s public.settings;
  v_new boolean := false;
  v_sold int;
  v_order_status text;
  v_amount numeric := (p_payment->>'transaction_amount')::numeric;
begin
  if v_pid is null or v_status is null then raise exception 'invalid_payment' using errcode = '22023'; end if;
  begin v_order := (p_payment->>'external_reference')::uuid;
  exception when others then v_order := null; end;

  insert into public.payments as p (mp_payment_id, order_id, status, status_detail, transaction_amount,
    net_received_amount, fee_amount, payer_email, payment_method, date_approved, raw)
  values (v_pid, v_order, v_status, p_payment->>'status_detail', v_amount,
    (p_payment->'transaction_details'->>'net_received_amount')::numeric,
    (select coalesce(sum((f->>'amount')::numeric),0) from jsonb_array_elements(coalesce(p_payment->'fee_details','[]')) f),
    p_payment->'payer'->>'email', p_payment->>'payment_method_id',
    (p_payment->>'date_approved')::timestamptz, p_payment)
  on conflict (mp_payment_id) do update set
    status = excluded.status, status_detail = excluded.status_detail,
    net_received_amount = excluded.net_received_amount, fee_amount = excluded.fee_amount,
    date_approved = excluded.date_approved, raw = excluded.raw,
    order_id = coalesce(p.order_id, excluded.order_id);

  if v_order is null then
    return query select null::uuid, null::text, false, null::text, false; return;
  end if;

  select * into o from public.orders where id = v_order for update;
  if not found then
    return query select null::uuid, null::text, false, null::text, false; return;
  end if;

  v_order_status := case v_status
    when 'approved' then 'approved' when 'authorized' then 'in_process'
    when 'in_process' then 'in_process' when 'pending' then 'pending'
    when 'rejected' then 'rejected' when 'cancelled' then 'cancelled'
    when 'refunded' then 'refunded' when 'charged_back' then 'charged_back'
    else o.status end;

  -- Una orden aprobada solo sale de aprobada por devolución o contracargo.
  if o.status = 'approved' and v_order_status not in ('refunded','charged_back') then
    v_order_status := 'approved';
  end if;
  -- Otro pago rechazado de la misma orden no pisa uno aprobado; uno nuevo aprobado sí manda.
  if v_order_status = 'approved' and o.status <> 'approved' then
    if v_amount is not null and v_amount + 0.01 < o.amount_ars then
      -- Pagó menos de lo que vale la orden: no se emite entrada, queda para revisar en el panel.
      v_order_status := 'in_process';
    else
      v_new := true;
    end if;
  end if;

  update public.orders set status = v_order_status,
    mp_payment_id = case when v_order_status = 'approved' and o.status <> 'approved' then v_pid else coalesce(o.mp_payment_id, v_pid) end,
    approved_at = case when v_new then now() else o.approved_at end
   where id = o.id returning * into o;

  if v_new then
    select * into s from public.settings where id = 1 for update;
    select count(*) into v_sold from public.tickets where status in ('valid','used');
    insert into public.tickets (order_id, person_id, code, overbooked)
    values (o.id, o.person_id,
            'CTM-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
            v_sold + 1 > s.capacity_max)
    on conflict on constraint tickets_order_id_key do nothing;
    update public.people set status = 'ticket' where id = o.person_id;
  elsif o.status in ('refunded','charged_back') then
    update public.tickets set status = 'cancelled' where tickets.order_id = o.id;
    update public.people pp set status = 'lead' where pp.id = o.person_id
      and not exists (select 1 from public.tickets x where x.person_id = pp.id and x.status in ('valid','used'));
  end if;

  select * into t from public.tickets where tickets.order_id = o.id;
  return query select o.id, o.status, v_new, t.code, coalesce(t.overbooked,false);
end $$;

-- Libera reservas vencidas (se llama desde el cron o al leer el cupo; no es obligatorio porque
-- seats_status ya ignora reservas vencidas).
create or replace function public.expire_holds() returns int
language sql security invoker set search_path = '' as $$
  with x as (update public.orders set status = 'expired'
             where status = 'pending' and hold_expires_at < now() - interval '1 day' returning 1)
  select count(*)::int from x;
$$;

-- ---------------------------------------------------------------- baja de mails por token
create or replace function public.unsubscribe(p_token uuid) returns boolean
language sql security invoker set search_path = '' as $$
  with x as (update public.people set marketing_consent = false, unsubscribed_at = coalesce(unsubscribed_at, now())
             where unsubscribe_token = p_token returning 1)
  select exists (select 1 from x);
$$;

-- Solo el servidor.
do $$
declare f text;
begin
  foreach f in array array['seats_status()','upsert_lead(text,text,text,text,text,text,text,boolean,text,uuid,jsonb,text,text,jsonb)',
    'reserve_order(uuid,uuid,text,jsonb,jsonb)','set_order_preference(uuid,text)','apply_payment(jsonb)',
    'expire_holds()','unsubscribe(uuid)']
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
