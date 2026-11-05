-- Evita políticas permisivas duplicadas en SELECT (advisor 0006): "admins editan" pasa a insert/update/delete.
do $$
declare t text;
begin
  foreach t in array array['experiments','experiment_variants','email_templates'] loop
    execute format('drop policy "admins editan" on public.%I', t);
    execute format($p$create policy "admins crean" on public.%I for insert to authenticated with check ((select private.is_admin()))$p$, t);
    execute format($p$create policy "admins editan" on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))$p$, t);
    execute format($p$create policy "admins borran" on public.%I for delete to authenticated using ((select private.is_admin()))$p$, t);
  end loop;
end $$;
