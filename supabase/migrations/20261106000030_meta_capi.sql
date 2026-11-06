-- Conversions API de Meta (6/11/26). Los eventos importantes (Lead, Purchase, Schedule) se mandan a Meta desde
-- el servidor (Edge Functions) con META_PIXEL_ID y META_CAPI_ACCESS_TOKEN (secretos de Supabase).
-- Para atribuir bien se guardan las cookies de Meta del visitante (_fbp, _fbc). No se guarda la IP.

alter table public.visitors
  add column if not exists fbp text,
  add column if not exists fbc text;

create table if not exists public.meta_capi_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  event_id text not null,            -- el mismo que usa el pixel del navegador (deduplicación)
  person_id uuid references public.people(id) on delete set null,
  status text not null check (status in ('sent','failed','skipped')),
  http_status int,
  response jsonb,
  created_at timestamptz not null default now(),
  unique (event_name, event_id)      -- cada evento se manda una sola vez
);
alter table public.meta_capi_events enable row level security;
alter table public.meta_capi_events force row level security;
create policy "admins leen" on public.meta_capi_events for select to authenticated using ((select private.is_admin()));
revoke all on public.meta_capi_events from anon;
