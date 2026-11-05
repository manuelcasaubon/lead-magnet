-- Base de datos de la clase en vivo del 18/11/26.
-- Contrato compartido por todas las sesiones: leer docs/SPEC.md §3 antes de cambiar algo.
-- Regla: RLS activa en todas las tablas. Nada es público. El servidor escribe con service_role.
-- El panel lee con la sesión del admin (políticas "admins") o con service_role tras verificar admin.

create extension if not exists citext with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------- utilidades
create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------- admins
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------- settings (fila única)
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  event_name text not null default 'Cómo destacar con tu marca personal en 2027',
  event_tagline text not null default 'De que nadie te conozca a que te llamen a vos.',
  event_starts_at timestamptz not null default '2026-11-18 18:00:00-03',
  event_ends_at timestamptz not null default '2026-11-18 21:00:00-03',
  doors_label text not null default '17:45',
  venue text not null default 'Niceto Vega 4601, Palermo Soho, CABA',
  price_usd numeric(10,2) not null default 27,
  price_ars numeric(12,2),                 -- lo define Manu (DECISIONES.md D3). Null = venta cerrada.
  absorb_fee boolean not null default true,
  capacity_public int not null default 30, -- lo que se comunica
  capacity_max int not null default 40,    -- tope real de la sala
  hold_minutes int not null default 20,    -- reserva de lugar mientras paga
  sales_open boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);
create trigger settings_touch before update on public.settings
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- personas y leads
create table public.people (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique,
  name text,
  phone text,
  instagram text,
  brand_url text,
  goal text,
  status text not null default 'lead' check (status in ('lead','ticket')),
  first_source text,
  first_utm jsonb,
  first_visitor_id uuid,
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  consent_text text,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  email_status text not null default 'ok' check (email_status in ('ok','bounced','complained')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger people_touch before update on public.people
  for each row execute function private.touch_updated_at();

create table public.lead_touches (
  id bigint generated always as identity primary key,
  person_id uuid not null references public.people(id) on delete cascade,
  source text not null check (source in ('form','instagram_dm','checkout','manual')),
  visitor_id uuid,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  referrer text,
  path text,
  experiments jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index lead_touches_person_idx on public.lead_touches(person_id);
create index lead_touches_created_idx on public.lead_touches(created_at);

-- ---------------------------------------------------------------- visitantes y eventos
create table public.visitors (
  id uuid primary key,                      -- cookie "vid", la pone el middleware
  person_id uuid references public.people(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  first_referrer text,
  first_path text,
  first_utm jsonb,
  device text check (device in ('mobile','tablet','desktop'))
);
create index visitors_person_idx on public.visitors(person_id);

create table public.events (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  session_id uuid,
  person_id uuid references public.people(id) on delete set null,
  name text not null check (name ~ '^[a-z][a-z0-9_]{1,40}$'),
  path text,
  props jsonb not null default '{}',
  source text,                              -- utm_source, dominio del referrer o 'directo'
  utm jsonb,
  experiments jsonb not null default '{}',  -- {exp_key: variant_key}
  created_at timestamptz not null default now()
);
create index events_name_created_idx on public.events(name, created_at);
create index events_visitor_idx on public.events(visitor_id);
create index events_person_idx on public.events(person_id);

-- ---------------------------------------------------------------- experimentos
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_-]{2,40}$'),
  name text not null,
  surface text not null check (surface in ('landing','vsl','form')),
  hypothesis text,
  primary_metric text not null default 'lead_created',
  status text not null default 'draft' check (status in ('draft','running','stopped')),
  min_sample_per_variant int not null default 100,
  started_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Un experimento por vez.
create unique index experiments_one_running on public.experiments ((true)) where status = 'running';
create trigger experiments_touch before update on public.experiments
  for each row execute function private.touch_updated_at();

create table public.experiment_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9_-]{1,20}$'),
  name text not null,
  weight int not null default 50 check (weight between 0 and 100),
  config jsonb not null default '{}',
  unique (experiment_id, key)
);

create table public.experiment_assignments (
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  visitor_id uuid not null,
  variant_key text not null,
  assigned_at timestamptz not null default now(),
  primary key (experiment_id, visitor_id)
);

-- ---------------------------------------------------------------- órdenes, pagos y entradas
create table public.orders (
  id uuid primary key default gen_random_uuid(),   -- = external_reference en Mercado Pago
  person_id uuid not null references public.people(id) on delete restrict,
  status text not null default 'pending' check (status in
    ('pending','in_process','approved','rejected','cancelled','expired','refunded','charged_back')),
  amount_ars numeric(12,2) not null check (amount_ars > 0),
  mp_preference_id text,
  mp_payment_id bigint,
  hold_expires_at timestamptz,
  visitor_id uuid,
  source text,
  utm jsonb,
  experiments jsonb not null default '{}',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_person_idx on public.orders(person_id);
create index orders_status_idx on public.orders(status, hold_expires_at);
create trigger orders_touch before update on public.orders
  for each row execute function private.touch_updated_at();

create table public.payments (
  mp_payment_id bigint primary key,
  order_id uuid references public.orders(id) on delete set null,
  status text not null,
  status_detail text,
  transaction_amount numeric(12,2),
  net_received_amount numeric(12,2),
  fee_amount numeric(12,2),
  payer_email text,
  payment_method text,
  date_approved timestamptz,
  raw jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments(order_id);
create trigger payments_touch before update on public.payments
  for each row execute function private.touch_updated_at();

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  person_id uuid not null references public.people(id) on delete restrict,
  code text not null unique,
  status text not null default 'valid' check (status in ('valid','cancelled','used')),
  overbooked boolean not null default false,
  audit_profile text,           -- perfil para la auditoría (DECISIONES.md D5)
  audit_notes text,
  checked_in_at timestamptz,
  manu_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_person_idx on public.tickets(person_id);
create trigger tickets_touch before update on public.tickets
  for each row execute function private.touch_updated_at();

create table public.mp_notifications (
  id bigint generated always as identity primary key,
  request_id text unique,       -- x-request-id: avisos repetidos no se procesan dos veces
  topic text,
  resource_id text,
  signature_ok boolean not null,
  result text,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ---------------------------------------------------------------- mails
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  kind text not null check (kind in ('campaign','transactional')),
  audience text not null check (audience in ('leads_sin_pago','con_entrada','todos','manu')),
  objection text,
  subject text not null,
  preheader text,
  body text not null,           -- texto con {{nombre}}, {{lugares}}, {{link_pago}}, {{link_entrada}}, {{link_baja}}
  send_at timestamptz,          -- solo campaña
  status text not null default 'draft' check (status in ('draft','approved','paused','sent')),
  approved_at timestamptz,
  approved_by text,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create trigger email_templates_touch before update on public.email_templates
  for each row execute function private.touch_updated_at();

-- Cambiar asunto o cuerpo de un mail aprobado lo vuelve a borrador: cada versión se aprueba.
create or replace function private.email_template_reapprove() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.subject is distinct from old.subject or new.body is distinct from old.body
      or new.preheader is distinct from old.preheader) then
    new.version := old.version + 1;
    if old.status = 'approved' and new.status = 'approved' then
      new.status := 'draft'; new.approved_at := null; new.approved_by := null;
    end if;
  end if;
  return new;
end $$;
create trigger email_templates_reapprove before update on public.email_templates
  for each row execute function private.email_template_reapprove();

create table public.email_sends (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.email_templates(id) on delete restrict,
  template_version int not null,
  person_id uuid references public.people(id) on delete set null,
  to_email extensions.citext not null,
  resend_id text unique,
  status text not null default 'queued' check (status in
    ('queued','sent','delivered','opened','clicked','bounced','complained','failed','skipped')),
  error text,
  opened_at timestamptz,
  clicked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (template_id, to_email)   -- nadie recibe dos veces el mismo mail
);
create index email_sends_person_idx on public.email_sends(person_id);

create table public.email_events (
  id bigint generated always as identity primary key,
  svix_id text unique,              -- avisos repetidos de Resend no se duplican
  resend_id text,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index email_events_resend_idx on public.email_events(resend_id);

-- ---------------------------------------------------------------- RLS
do $$
declare t text;
begin
  foreach t in array array['admins','settings','people','lead_touches','visitors','events',
    'experiments','experiment_variants','experiment_assignments','orders','payments','tickets',
    'mp_notifications','email_templates','email_sends','email_events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format($p$create policy "admins leen" on public.%I for select to authenticated
                     using ((select private.is_admin()))$p$, t);
  end loop;
end $$;

-- Lo que el admin edita desde el panel con su propia sesión.
create policy "admins editan" on public.settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins editan" on public.experiments for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins editan" on public.experiment_variants for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins editan" on public.email_templates for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins editan" on public.tickets for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins editan" on public.people for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Sin acceso anónimo a nada.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;
