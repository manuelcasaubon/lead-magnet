-- Solo Supabase. Cada 10 minutos la función "pagos" reintenta los avisos de entradas pendientes
-- (plantillas recién aprobadas, modo test → live, Resend caído, mail de Manu recién configurado).
select cron.schedule('mails-entradas-pendientes', '*/10 * * * *', $cron$
  select net.http_post(
    url := 'https://qzfzswascgitycynwlkk.supabase.co/functions/v1/pagos',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{"pendientes": true}'::jsonb,
    timeout_milliseconds := 60000);
$cron$);
