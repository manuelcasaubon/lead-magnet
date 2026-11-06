-- Edge Functions (6/11/26): los secretos de Mercado Pago, Resend y Clarity viven en Supabase (Edge Function secrets).
-- La configuración NO secreta de los mails pasa a settings para editarla desde el panel sin redeploy.

alter table public.settings
  add column if not exists site_url text not null default 'https://comunicatumarca.com',
  add column if not exists email_from text not null default 'Manu Casaubon <manu@info.comunicatumarca.com>',
  add column if not exists email_reply_to text,
  add column if not exists email_mode text not null default 'test' check (email_mode in ('test','live')),
  add column if not exists email_test_recipients text[] not null default '{}',
  add column if not exists manu_notify_email text;

-- Datos diarios de Microsoft Clarity (Data Export API). Los trae la Edge Function clarity-sync una vez por día.
create table if not exists public.clarity_insights (
  id bigint generated always as identity primary key,
  fetched_at timestamptz not null default now(),
  num_days int not null,
  dimension text,                 -- null = totales; 'URL', 'Source', 'Device'...
  data jsonb not null
);
create index if not exists clarity_insights_fetched_idx on public.clarity_insights(fetched_at desc);
alter table public.clarity_insights enable row level security;
alter table public.clarity_insights force row level security;
create policy "admins leen" on public.clarity_insights for select to authenticated using ((select private.is_admin()));
revoke all on public.clarity_insights from anon;

-- Clave compartida entre pg_cron y la función clarity-sync. Vive en Vault; nunca sale de la base.
-- La función la valida llamando a check_cron_secret() con service_role.
create or replace function public.check_cron_secret(p_secret text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets
                 where name = 'cron_secret' and decrypted_secret = p_secret);
$$;
revoke all on function public.check_cron_secret(text) from public, anon, authenticated;
grant execute on function public.check_cron_secret(text) to service_role;
