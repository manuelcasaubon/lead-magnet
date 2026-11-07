-- VSL final de la clase 18/11 (export 1920x1080 desde el ORICO, subido a Bunny el 7/11): reemplaza al del 6/11.
update public.videos set uso = null where uso = 'vsl_evento' and guid <> '073854a1-5e95-4dfe-b030-9a70f309998f';
update public.videos set uso = 'vsl_evento' where guid = '073854a1-5e95-4dfe-b030-9a70f309998f';
