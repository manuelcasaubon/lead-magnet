-- Agenda de sesiones con Cal.com (6/11/26). La Edge Function cal-webhook recibe los avisos de Cal.com,
-- verifica la firma (X-Cal-Signature-256 con CAL_WEBHOOK_SECRET) y guarda la reserva y el lead.

alter table public.lead_touches drop constraint if exists lead_touches_source_check;
alter table public.lead_touches add constraint lead_touches_source_check
  check (source in ('form','instagram_dm','checkout','manual','mp_link','cal'));

create table public.bookings (
  uid text primary key,                 -- uid de la reserva en Cal.com
  booking_id bigint,
  event_type text,                      -- slug del tipo de evento
  event_type_id bigint,
  title text,
  status text not null default 'created' check (status in
    ('requested','created','rescheduled','cancelled','rejected','ended','no_show')),
  start_time timestamptz,
  end_time timestamptz,
  person_id uuid references public.people(id) on delete set null,
  attendee_email extensions.citext,
  attendee_name text,
  responses jsonb not null default '{}',
  metadata jsonb not null default '{}', -- incluye vid y UTM que manda el embed de la web
  rescheduled_to text,                  -- uid de la nueva reserva si se reprogramó
  reason text,                          -- motivo de cancelación o rechazo
  raw jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_person_idx on public.bookings(person_id);
create index bookings_start_idx on public.bookings(start_time);
create trigger bookings_touch before update on public.bookings
  for each row execute function private.touch_updated_at();

create table public.cal_webhook_events (
  id bigint generated always as identity primary key,
  trigger text not null,
  uid text,
  cal_created_at text,                  -- createdAt del aviso: con trigger y uid identifica un aviso repetido
  signature_ok boolean not null,
  payload jsonb not null,
  result text,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create unique index cal_webhook_events_unico on public.cal_webhook_events (trigger, coalesce(uid,''), coalesce(cal_created_at,''));

do $$
declare t text;
begin
  foreach t in array array['bookings','cal_webhook_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format($p$create policy "admins leen" on public.%I for select to authenticated using ((select private.is_admin()))$p$, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
