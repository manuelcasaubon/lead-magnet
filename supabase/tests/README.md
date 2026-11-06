# Pruebas de la base

Corren contra un Postgres local descartable (no contra Supabase). `stub_supabase.sql` imita los esquemas `auth` y `extensions` y los roles de Supabase.

```bash
B=/usr/lib/postgresql/16/bin; D=/var/tmp/pgdata
mkdir -p $D && chown postgres $D
su postgres -c "$B/initdb -D $D -A trust -U postgres && $B/pg_ctl -D $D -o '-p 55432 -k /var/tmp' -l $D/log start"
P="psql -h /var/tmp -p 55432 -U postgres -q -v ON_ERROR_STOP=1"
$P -c 'drop database if exists t' -c 'create database t'
$P -d t -f supabase/tests/stub_supabase.sql
for f in supabase/migrations/*.sql; do case "$f" in *_cron_*) continue;; esac; $P -d t -f "$f"; done   # las *_cron_* son solo de Supabase
$P -d t -f supabase/tests/funciones_test.sql   # termina en "OK"
```
