-- Solo Supabase (pg_cron, pg_net y Vault no están en el Postgres local de pruebas).
-- Genera la clave del cron dentro de la base (nadie la ve) y programa clarity-sync todos los días a las 9:07 UTC (6:07 AR).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'cron_secret',
      'Clave compartida entre pg_cron y las Edge Functions programadas');
  end if;
end $$;

select cron.schedule('clarity-sync-diario', '7 9 * * *', $cron$
  select net.http_post(
    url := 'https://qzfzswascgitycynwlkk.supabase.co/functions/v1/clarity-sync',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000);
$cron$);
