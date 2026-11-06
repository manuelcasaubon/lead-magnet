-- S3 (pagos). Revisada y aplicada en Supabase por S0 el 6/11/26.
-- Bug: upsert_lead() devuelve una columna llamada person_id, y dentro hace
--   update public.visitors set person_id = v_id where id = p_visitor_id and person_id is null
-- PL/pgSQL no sabe si "person_id" es la columna o la variable de salida y falla con
-- 'column reference "person_id" is ambiguous' CADA VEZ que se pasa p_visitor_id
-- (o sea, en todo lead que llega con la cookie vid: formulario de S2 y checkout de S3).
-- Las pruebas de la base no lo vieron porque nunca pasan p_visitor_id.
-- Arreglo: mismas sentencias con alias de tabla. El resto de la función queda igual.
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
    update public.visitors vi set person_id = v_id where vi.id = p_visitor_id and vi.person_id is null;
    update public.events ev set person_id = v_id where ev.visitor_id = p_visitor_id and ev.person_id is null;
  end if;

  return query select v_id, v_new, v_status;
end $$;

-- create or replace conserva los permisos; se repiten por las dudas.
revoke all on function public.upsert_lead(text,text,text,text,text,text,text,boolean,text,uuid,jsonb,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.upsert_lead(text,text,text,text,text,text,text,boolean,text,uuid,jsonb,text,text,jsonb) to service_role;
