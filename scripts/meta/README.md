# Meta: CLI de solo lectura (usuario del sistema "CTM CLI")

Herramientas para consultar anuncios, páginas, Instagram y píxeles de Meta desde la terminal.
**No tiene nada que ver con la Conversions API del sitio** (esa usa el "Conversions API System User", que no se toca).

> Regla: lo de esta carpeta solo **lee**. Nada crea, modifica, pausa ni gasta. Cualquier escritura
> (crear o editar campañas, cambiar presupuestos, conectar píxeles) se hace aparte y solo con la confirmación explícita de Manu.

---

## 1. Crear "CTM CLI" y generar el token (lo hace Manu)

En [business.facebook.com/settings](https://business.facebook.com/settings), portafolio **"ᴍᴀɴᴜᴄᴀ/ Estudia conmigo!"**:

1. **Usuarios > Usuarios del sistema > Agregar.** Nombre: `CTM CLI`. Rol: **Empleado** (no Administrador). Meta acepta los dos roles para la CLI.
2. **Asignar activos** al usuario `CTM CLI`, con **control total**, solo sobre:
   - Cuentas publicitarias (incluida la `63695471`, si está en el portafolio; si sigue en "Otros activos", primero hay que reclamarla o compartirla).
   - Páginas.
   - Cuentas de Instagram.
   - Conjuntos de datos (píxeles): "Comunica tu marca Web" y "Comunica Tu Marca | Offer Nov 2026".
3. **Cuentas > Apps:** elegí la app de Meta Developers vinculada al portafolio (si hay varias, elegí cuál; si no hay ninguna, avisá antes de crear una) y en **Asignar personas** sumá a `CTM CLI` a esa app.
4. Volvé a **Usuarios del sistema > CTM CLI > Generar token**:
   - App: la del paso 3.
   - Vencimiento: **Nunca** (o 60 días, si preferís rotarlo).
   - Permisos:
     - Anuncios: `ads_management`, `ads_read`, `business_management`, `read_insights`
     - Páginas: `pages_show_list`, `pages_read_engagement`, `pages_manage_ads`
     - Instagram: `instagram_basic`, `instagram_manage_insights`
     - Conversiones: los píxeles no tienen un permiso propio. Alcanza con `ads_management` y con tener los dos píxeles asignados en el paso 2.
5. **Copiá el token en el momento** (Meta no lo vuelve a mostrar) y guardalo:
   - ✅ En tu gestor de contraseñas (1Password, Bitwarden, etc.), y/o
   - ✅ En `scripts/meta/.env` en tu compu (git lo ignora: lo cubre la regla `.env*` del `.gitignore`).
   - ❌ **Nunca** en el repo, en Vercel, en Supabase, en un chat ni en un issue.

Si el token se filtra: en el usuario del sistema, **Revocar tokens** y generar uno nuevo.

## 2. Configurar

```bash
cp scripts/meta/.env.example scripts/meta/.env
# completá META_SYSTEM_USER_TOKEN, META_AD_ACCOUNT_ID y META_BUSINESS_ID
```

Requiere Node 20.12 o más nuevo (usa `fetch` y `process.loadEnvFile`, sin dependencias).

## 3. Verificar el token

```bash
node scripts/meta/meta.mjs yo
```

Hace `GET /me` y `GET /debug_token` y muestra el usuario (tiene que decir `CTM CLI`), la app, el tipo (`SYSTEM_USER`), si es válido, cuándo vence, los permisos y a qué activos llega cada uno.

Lo mismo a mano, con curl (el token va en el header, no en la URL):

```bash
set -a; . scripts/meta/.env; set +a
curl -s -H "Authorization: Bearer $META_SYSTEM_USER_TOKEN" "https://graph.facebook.com/v25.0/me?fields=id,name"
curl -s -H "Authorization: Bearer $META_SYSTEM_USER_TOKEN" "https://graph.facebook.com/v25.0/debug_token?input_token=$META_SYSTEM_USER_TOKEN"
```

## 4. Comandos (todos de solo lectura)

| Comando | Qué muestra | Endpoint |
|---|---|---|
| `yo` | Usuario, app, vencimiento y permisos del token | `GET /me`, `GET /debug_token` |
| `cuentas` | Cuentas publicitarias a las que llega el token | `GET /me/adaccounts` |
| `campanas` | Campañas **activas** de `META_AD_ACCOUNT_ID`, con presupuesto y gasto de 7 días | `GET /act_X/campaigns?effective_status=["ACTIVE"]` |
| `insights` | Gasto, impresiones, alcance, clics, CTR, CPC, CPM, leads y compras por campaña, últimos 7 días | `GET /act_X/insights?level=campaign&date_preset=last_7d` |
| `pixeles` | Píxeles con su último evento (`last_fired_time`) | `GET /{business}/owned_pixels` (o `/act_X/adspixels` sin `META_BUSINESS_ID`) |

```bash
node scripts/meta/meta.mjs cuentas
node scripts/meta/meta.mjs campanas
node scripts/meta/meta.mjs insights --json | jq '.[] | {campaña, gasto}'
node scripts/meta/meta.mjs pixeles
```

Opcionales en `.env`: `META_GRAPH_VERSION` (por defecto `v25.0`) y `META_APP_SECRET` (solo si la app exige `appsecret_proof`).

`meta.mjs` solo hace `GET`: no hay ningún otro método HTTP en el archivo.

---

## 5. Para ir más allá: la CLI oficial de Meta (recomendada)

**Recomendación: [Meta Ads CLI](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-cli/setup/get-started)** (`meta`), porque es la herramienta oficial que Meta publicó en 2026 para manejar la Marketing API desde la terminal, y usa justo un token de usuario del sistema.

- Está en **beta abierta**. Para los datos que importan, contrastá con el Administrador de anuncios.
- Instalación: `pip install meta-ads` (Python 3.12+) o con Homebrew: `brew tap facebook/fb && brew trust facebook/fb && brew install facebook/fb/meta-ads`. Verificar con `meta --version` y `meta auth status`.
- Usa otros nombres de variables. Se pueden mapear desde el mismo `.env`:

  ```bash
  set -a; . scripts/meta/.env; set +a
  export ACCESS_TOKEN="$META_SYSTEM_USER_TOKEN" AD_ACCOUNT_ID="$META_AD_ACCOUNT_ID" BUSINESS_ID="$META_BUSINESS_ID"
  # APP_ID / APP_SECRET de la app, si los pide
  ```

- Comandos de lectura: `meta ads adaccount list`, `meta ads campaign list`, `meta ads page list`, `meta ads dataset list`, `meta ads insights get --fields spend,impressions,ctr,cpc`. Usá `-o json` para pasarle la salida a `jq`.
- ⚠️ Esa CLI **también crea, edita y borra** (campañas, conjuntos de anuncios, anuncios, creatividades, catálogos, píxeles). Según la documentación, solo el borrado pide confirmación: crear o editar puede no preguntar nada. Regla del proyecto: no se corre ningún `create`, `update`, `delete`, `connect` ni `disconnect` sin la confirmación explícita de Manu. Para probar una campaña sin crearla, `--execution-options validate_only`.

Las otras opciones oficiales: el [Explorador de la Graph API](https://developers.facebook.com/tools/explorer/) (web, sirve para probar consultas sueltas) y los SDK `facebook-business` (Python o Node), que convienen si esto crece y se vuelve código.
