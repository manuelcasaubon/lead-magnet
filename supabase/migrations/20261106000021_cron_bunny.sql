-- Solo Supabase (pg_cron, pg_net y Vault no están en el Postgres local de pruebas).
-- bunny-sync cada 30 minutos, con la misma clave del cron (Vault) que valida check_cron_secret().
select cron.schedule('bunny-sync-30min', '*/30 * * * *', $cron$
  select net.http_post(
    url := 'https://qzfzswascgitycynwlkk.supabase.co/functions/v1/bunny-sync',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000);
$cron$);
