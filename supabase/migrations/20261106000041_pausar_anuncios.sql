-- Pausa automática de las campañas de Meta cuando se agotan los lugares públicos (left_public = 0) o se cierran
-- las ventas. La hace la Edge Function "pagos" con META_ADS_ACCESS_TOKEN (secreto de Supabase, usuario del
-- sistema "CTM CLI" con ads_management). Las campañas a pausar se editan acá, sin redeploy.
alter table public.settings
  add column if not exists meta_campaigns_pausar text[] not null default '{}',
  add column if not exists meta_campaigns_pausadas_at timestamptz;

update public.settings set meta_campaigns_pausar = array['120253860469940092'] where id = 1;
