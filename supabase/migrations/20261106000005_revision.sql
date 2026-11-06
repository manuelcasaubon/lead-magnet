-- Correcciones de la revisión de código (6/11/26).

-- 1. Pagos del link: solo se adopta un pago por el precio exacto (±1 peso) aprobado desde que existe el link.
--    Antes bastaba "≥ precio": un pago de otro producto de la misma cuenta podía convertirse en entrada.
alter table public.settings add column if not exists link_valid_from timestamptz not null default '2026-11-05 00:00:00-03';

create or replace function public.adopt_link_payment(p_payment jsonb)
returns table (order_id uuid, order_status text, newly_approved boolean, ticket_code text,
               overbooked boolean, adopted boolean)
language plpgsql security invoker set search_path = '' as $$
declare
  v_pid bigint := (p_payment->>'id')::bigint;
  v_existing uuid;
  s public.settings;
  v_amount numeric := (p_payment->>'transaction_amount')::numeric;
  v_aprobado timestamptz := (p_payment->>'date_approved')::timestamptz;
  v_texto text := concat_ws(' ', p_payment->>'description',
                    p_payment->'additional_info'->'items'->0->>'title');
  v_email text := lower(trim(p_payment->'payer'->>'email'));
  v_name text := nullif(trim(concat_ws(' ', p_payment->'payer'->>'first_name', p_payment->'payer'->>'last_name')), '');
  v_person uuid;
  v_order uuid;
begin
  if v_pid is null then raise exception 'invalid_payment' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(v_pid);

  select p.order_id into v_existing from public.payments p where p.mp_payment_id = v_pid and p.order_id is not null;
  if v_existing is not null then
    return query select a.order_id, a.order_status, a.newly_approved, a.ticket_code, a.overbooked, false
      from public.apply_payment(jsonb_set(p_payment, '{external_reference}', to_jsonb(v_existing::text))) a;
    return;
  end if;

  select * into s from public.settings where id = 1;
  if p_payment->>'status' <> 'approved'
     or coalesce(p_payment->>'currency_id','ARS') <> 'ARS'
     or s.price_ars is null or v_amount is null or abs(v_amount - s.price_ars) > 1
     or v_aprobado is null or v_aprobado < s.link_valid_from
     or (s.mp_link_match is not null and v_texto not ilike '%' || s.mp_link_match || '%') then
    return query select null::uuid, null::text, false, null::text, false, false;
    return;
  end if;

  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    v_email := 'mp-' || v_pid || '@sin-mail.invalid';
  end if;

  select l.person_id into v_person from public.upsert_lead(v_email, v_name, p_source => 'mp_link') l;

  insert into public.orders (person_id, status, amount_ars, source, mp_payment_id)
  values (v_person, 'pending', v_amount, 'mp_link', v_pid)
  returning id into v_order;

  return query select a.order_id, a.order_status, a.newly_approved, a.ticket_code, a.overbooked, true
    from public.apply_payment(jsonb_set(p_payment, '{external_reference}', to_jsonb(v_order::text))) a;
end $$;
revoke all on function public.adopt_link_payment(jsonb) from public, anon, authenticated;
grant execute on function public.adopt_link_payment(jsonb) to service_role;

-- 2. Tracking: alta o actualización del visitante en una sola operación (antes: upsert + update en serie).
--    La primera atribución no se pisa; solo last_seen_at y device.
create or replace function public.touch_visitor(p_id uuid, p_referrer text, p_path text, p_utm jsonb, p_device text)
returns void language sql security invoker set search_path = '' as $$
  insert into public.visitors as v (id, first_referrer, first_path, first_utm, device)
  values (p_id, nullif(p_referrer, ''), nullif(p_path, ''), nullif(p_utm, '{}'::jsonb), nullif(p_device, ''))
  on conflict (id) do update set last_seen_at = now(), device = coalesce(excluded.device, v.device);
$$;
revoke all on function public.touch_visitor(uuid,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.touch_visitor(uuid,text,text,jsonb,text) to service_role;
