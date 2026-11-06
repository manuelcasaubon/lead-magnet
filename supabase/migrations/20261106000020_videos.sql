-- S9: videos con Bunny Stream (aditiva: solo tablas, columnas y funciones nuevas).
-- Los secretos de Bunny viven en Supabase (Edge Functions → Secrets); acá solo va lo que no es secreto.

alter table public.settings
  add column if not exists bunny_library_id bigint,
  add column if not exists bunny_cdn_hostname text;   -- ej. vz-xxxxxxxx-xxx.b-cdn.net (lo completa bunny-sync)
update public.settings set bunny_library_id = 801645 where id = 1 and bunny_library_id is null;

create table if not exists public.videos (
  guid text primary key,                         -- id del video en Bunny
  library_id bigint not null,
  titulo text not null default '',
  uso text check (uso is null or uso ~ '^[a-z][a-z0-9_]{1,40}$'),   -- vsl_evento, vsl_inicio...
  estado text not null default 'creado'
    check (estado in ('creado','subido','procesando','codificando','listo','error','borrado')),
  bunny_status smallint,                         -- código crudo de la Stream API
  duracion_seg integer,
  thumbnail_url text,
  hls_url text,
  subtitulos jsonb not null default '[]',        -- [{ lang, label, url }]
  resoluciones text[] not null default '{}',
  subido_at timestamptz,
  sincronizado_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists videos_uso_idx on public.videos(uso) where uso is not null;
-- Un solo video "listo" por uso es lo que sirve la web; asignar el uso es decisión del panel.
alter table public.videos enable row level security;
alter table public.videos force row level security;
create policy "admins leen" on public.videos for select to authenticated using ((select private.is_admin()));
create policy "admins editan" on public.videos for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
revoke all on public.videos from anon;
create trigger videos_touch before update on public.videos
  for each row execute function private.touch_updated_at();

-- Avisos del webhook de Bunny: EventId único (los reintentos llevan el mismo).
create table if not exists public.bunny_webhook_events (
  event_id text primary key,
  video_guid text,
  status smallint,
  received_at timestamptz not null default now()
);
alter table public.bunny_webhook_events enable row level security;
alter table public.bunny_webhook_events force row level security;
create policy "admins leen" on public.bunny_webhook_events for select to authenticated using ((select private.is_admin()));
revoke all on public.bunny_webhook_events from anon;

-- Métricas del VSL (para el panel). Solo service_role, como el resto de las funciones.
-- Devuelve: espectadores (vsl_view), reproductores (vsl_play), tasa de play, cuartiles, terminaron,
-- tiempo visto promedio (cada vsl_progress = 5 s) y la curva de retención por tramo de 5 s.
create or replace function public.vsl_metricas(
  p_video text default null,
  p_desde timestamptz default now() - interval '30 days',
  p_hasta timestamptz default now()
) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with ev as (
    select visitor_id, name, props,
           case when props->>'sec' ~ '^[0-9]+(\.[0-9]+)?$' then floor((props->>'sec')::numeric / 5)::int end as bucket
    from public.events
    where name in ('vsl_view','vsl_play','vsl_progress','vsl_quartile','vsl_end')
      and created_at >= p_desde and created_at <= p_hasta
      and (p_video is null or props->>'video' = p_video)
  ),
  base as (
    select
      count(distinct visitor_id) filter (where name = 'vsl_view') as vieron,
      count(distinct visitor_id) filter (where name = 'vsl_play') as reprodujeron,
      count(distinct visitor_id) filter (where name = 'vsl_quartile' and props->>'q' = '25') as q25,
      count(distinct visitor_id) filter (where name = 'vsl_quartile' and props->>'q' = '50') as q50,
      count(distinct visitor_id) filter (where name = 'vsl_quartile' and props->>'q' = '75') as q75,
      count(distinct visitor_id) filter (where name = 'vsl_quartile' and props->>'q' = '100') as q100,
      count(distinct visitor_id) filter (where name = 'vsl_end') as terminaron
    from ev
  ),
  por_visitante as (
    select visitor_id, count(*) * 5 as seg
    from ev where name = 'vsl_progress' group by visitor_id
  ),
  curva as (
    select bucket, count(distinct visitor_id) as visitantes
    from ev where name in ('vsl_play','vsl_progress') and bucket is not null
    group by bucket
  )
  select jsonb_build_object(
    'video', p_video,
    'vieron', b.vieron,
    'reprodujeron', b.reprodujeron,
    'tasa_play', case when b.vieron > 0 then round(b.reprodujeron::numeric / b.vieron, 4) end,
    'cuartiles', jsonb_build_object('25', b.q25, '50', b.q50, '75', b.q75, '100', b.q100),
    'terminaron', b.terminaron,
    'tiempo_visto_promedio_seg', (select round(avg(seg), 1) from por_visitante),
    'curva', coalesce((
      select jsonb_agg(jsonb_build_object(
        'desde_seg', c.bucket * 5,
        'visitantes', c.visitantes,
        'retencion', case when b.reprodujeron > 0 then round(least(c.visitantes::numeric / b.reprodujeron, 1), 4) end
      ) order by c.bucket) from curva c), '[]'::jsonb)
  )
  from base b;
$$;
revoke all on function public.vsl_metricas(text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.vsl_metricas(text, timestamptz, timestamptz) to service_role;
