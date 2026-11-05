# Clase en vivo 18/11 — landing, leads, pagos y mails

App de la clase **"Cómo destacar con tu marca personal en 2027"** de Manu Casaubon: landing, formulario de leads, pago con Mercado Pago, comprobante de entrada, tracking propio, VSL, A/B testing, panel privado y mails con Resend.

- **Spec y reparto en sesiones:** [`docs/SPEC.md`](docs/SPEC.md)
- **Decisiones pendientes de Manu:** [`docs/DECISIONES.md`](docs/DECISIONES.md)
- **Contexto (foto del 5/11/26):** [`docs/contexto/`](docs/contexto) y [`docs/referencia/`](docs/referencia)
- **Bocetos para elegir diseño:** `bocetos/`

## Stack
Next.js 15 (App Router, TypeScript) en Vercel · Supabase (Postgres, Auth, RLS) · Mercado Pago Checkout Pro · Resend.

## Desarrollo
```bash
npm install
cp .env.example .env.local   # completar con claves de PRUEBA
npm run dev
```

## Base de datos
Migraciones en `supabase/migrations/` (ya aplicadas en el proyecto `backend - comunica tu marca`). Pruebas en `supabase/tests/`.
