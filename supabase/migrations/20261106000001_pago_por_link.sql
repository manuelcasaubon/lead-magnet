-- Pagos hechos con el link fijo de Mercado Pago (mpago.la), creado por Manu el 6/11/26 a ARS 42.000.
-- Esos pagos no traen nuestra orden en external_reference: no hay reserva previa ni lead del sitio.
-- adopt_link_payment() recibe el JSON ya verificado contra GET /v1/payments/{id} y:
--   1. si ese pago ya tiene orden, solo actualiza su estado (idempotente);
--   2. si es nuevo y está aprobado, en ARS, por al menos el precio vigente (y, si está configurado,
--      con el título del producto), crea la persona con el mail del pagador, una orden con source 'mp_link'
--      y aplica el pago con apply_payment() (que emite la entrada, aunque se pase del tope).
-- Un candado por id de pago evita que el webhook y la página de retorno creen dos órdenes a la vez.

alter table public.lead_touches drop constraint if exists lead_touches_source_check;
alter table public.lead_touches add constraint lead_touches_source_check
  check (source in ('form','instagram_dm','checkout','manual','mp_link'));

-- Texto que debe aparecer en el título o la descripción del pago para aceptarlo como pago del link.
-- Null = se acepta por monto (>= price_ars) y moneda. Se carga desde el panel o con SQL.
alter table public.settings add column if not exists mp_link_match text;

-- Precio decidido por Manu el 6/11/26.
update public.settings set price_ars = 42000 where id = 1;

create or replace function public.adopt_link_payment(p_payment jsonb)
returns table (order_id uuid, order_status text, newly_approved boolean, ticket_code text,
               overbooked boolean, adopted boolean)
language plpgsql security invoker set search_path = '' as $$
declare
  v_pid bigint := (p_payment->>'id')::bigint;
  v_existing uuid;
  s public.settings;
  v_amount numeric := (p_payment->>'transaction_amount')::numeric;
  v_texto text := concat_ws(' ', p_payment->>'description',
                    p_payment->'additional_info'->'items'->0->>'title');
  v_email text := lower(trim(p_payment->'payer'->>'email'));
  v_name text := nullif(trim(concat_ws(' ', p_payment->'payer'->>'first_name', p_payment->'payer'->>'last_name')), '');
  v_person uuid;
  v_order uuid;
begin
  if v_pid is null then raise exception 'invalid_payment' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(v_pid);

  -- 1. Ya adoptado antes: solo actualizar estado.
  select p.order_id into v_existing from public.payments p where p.mp_payment_id = v_pid and p.order_id is not null;
  if v_existing is not null then
    return query select a.order_id, a.order_status, a.newly_approved, a.ticket_code, a.overbooked, false
      from public.apply_payment(jsonb_set(p_payment, '{external_reference}', to_jsonb(v_existing::text))) a;
    return;
  end if;

  -- 2. Solo se adoptan pagos aprobados que correspondan a la entrada.
  select * into s from public.settings where id = 1;
  if p_payment->>'status' <> 'approved'
     or coalesce(p_payment->>'currency_id','ARS') <> 'ARS'
     or s.price_ars is null or v_amount is null or v_amount + 1 < s.price_ars
     or (s.mp_link_match is not null and v_texto not ilike '%' || s.mp_link_match || '%') then
    return query select null::uuid, null::text, false, null::text, false, false;
    return;
  end if;

  -- Sin mail del pagador: se guarda igual con un mail marcador para no perder la entrada (se ve en el panel).
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
