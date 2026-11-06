-- Pruebas de S9: tabla videos (RLS) y métricas del VSL. Se corre después de las migraciones.
begin;
-- visitantes: A reproduce 20 s y llega al 25%; B solo ve; C reproduce y termina.
insert into public.visitors (id) values
  ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c');
insert into public.events (visitor_id, name, props) values
  ('00000000-0000-0000-0000-00000000000a','vsl_view','{"video":"vsl_evento"}'),
  ('00000000-0000-0000-0000-00000000000a','vsl_play','{"video":"vsl_evento","sec":0}'),
  ('00000000-0000-0000-0000-00000000000a','vsl_progress','{"video":"vsl_evento","sec":5}'),
  ('00000000-0000-0000-0000-00000000000a','vsl_progress','{"video":"vsl_evento","sec":10}'),
  ('00000000-0000-0000-0000-00000000000a','vsl_quartile','{"video":"vsl_evento","q":25}'),
  ('00000000-0000-0000-0000-00000000000b','vsl_view','{"video":"vsl_evento"}'),
  ('00000000-0000-0000-0000-00000000000c','vsl_view','{"video":"vsl_evento"}'),
  ('00000000-0000-0000-0000-00000000000c','vsl_play','{"video":"vsl_evento","sec":0}'),
  ('00000000-0000-0000-0000-00000000000c','vsl_progress','{"video":"vsl_evento","sec":5}'),
  ('00000000-0000-0000-0000-00000000000c','vsl_quartile','{"video":"vsl_evento","q":100}'),
  ('00000000-0000-0000-0000-00000000000c','vsl_end','{"video":"vsl_evento"}'),
  ('00000000-0000-0000-0000-00000000000c','vsl_view','{"video":"otro"}');
do $$
declare m jsonb;
begin
  m := public.vsl_metricas('vsl_evento');
  assert (m->>'vieron')::int = 3, 'vieron ' || m::text;
  assert (m->>'reprodujeron')::int = 2, 'reprodujeron';
  assert (m->>'tasa_play')::numeric = 0.6667, 'tasa_play';
  assert (m->'cuartiles'->>'25')::int = 1 and (m->'cuartiles'->>'100')::int = 1, 'cuartiles';
  assert (m->>'terminaron')::int = 1, 'terminaron';
  assert (m->>'tiempo_visto_promedio_seg')::numeric = 7.5, 'tiempo ' || m::text;   -- A: 2 latidos=10 s, C: 1=5 s
  assert jsonb_array_length(m->'curva') = 3, 'curva';
  assert (m->'curva'->0->>'retencion')::numeric = 1, 'retencion bucket 0';
  assert (m->'curva'->1->>'visitantes')::int = 2, 'bucket 1';
  assert (m->'curva'->2->>'retencion')::numeric = 0.5, 'bucket 2';
  assert (public.vsl_metricas(null)->>'vieron')::int = 3, 'sin filtro';
  assert (public.vsl_metricas('nada')->>'tasa_play') is null, 'sin datos';
end $$;
-- RLS: anon no ve nada, un authenticated que no es admin tampoco.
insert into public.videos (guid, library_id, titulo, uso, estado) values ('g1', 801645, 'VSL', 'vsl_evento', 'listo');
set local role anon;
do $$ begin
  begin perform 1 from public.videos; raise exception 'anon pudo leer'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin assert (select count(*) from public.videos) = 0, 'no admin ve videos'; end $$;
reset role;
do $$ begin
  assert (select bunny_library_id from public.settings) = 801645, 'library id';
  assert (select relforcerowsecurity from pg_class where oid = 'public.videos'::regclass), 'force rls';
end $$;
rollback;
select 'OK videos';
