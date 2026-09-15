# Despliegue en Railway

La app es un servidor Next.js 14 (`next start`) desplegado como un servicio de Railway
construido con **Railpack**. La configuración vive en `.railway/railway.ts`
(Infrastructure as Code; se revisa con `railway config plan` y se aplica con `railway config apply`).

- Proyecto: `calculadora-laboral` · Servicio: `calculadora-laboral`
- URL: https://calculadora-laboral-production.up.railway.app

## Qué hace Railway
- **Build**: `npm run build` (Node 20, según `.nvmrc` y `engines`).
- **Start**: `npm run start` → `next start -H 0.0.0.0 -p $PORT`.
- **Healthcheck**: `GET /api/health` (sin auth ni DB).
- **Autodeploy**: cada push a `main`.

## Variables de entorno del servicio
| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase (navegador, server y middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cliente admin (rutas API) |
| `ANTHROPIC_API_KEY` | Extracción de documentos con Claude |
| `RESEND_API_KEY`, `FROM_EMAIL` | Envío de magic links |
| `NEXT_PUBLIC_ADMIN_CODE` | Modo administrador |
| `NEXT_PUBLIC_SITE_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}`: links de email y llamadas internas |

Las `NEXT_PUBLIC_*` se incrustan al compilar: si cambian, hay que **redeployar**.
Si falta `NEXT_PUBLIC_SITE_URL`, `lib/site.ts` usa `RAILWAY_PUBLIC_DOMAIN`.

Los secretos **no** van en el repo: se cargan con `echo "valor" | railway variable set CLAVE --stdin`
y se declaran en `.railway/railway.ts` con `preserve()`. Si falta esa declaración, `railway config apply` borra la variable.

> Pendiente: `ANTHROPIC_API_KEY` (extracción de documentos). Hay que cargarla y agregarla con `preserve()`.

## Supabase Auth
En *Authentication → URL Configuration*:
- **Site URL**: el dominio de Railway.
- **Redirect URLs**: `https://calculadora-laboral-production.up.railway.app/auth/callback`.

## Comandos útiles
```bash
# plan/apply necesitan Node >= 22.6 (el proyecto usa Node 20: PATH=/usr/bin:$PATH o nvm)
railway config plan     # preview de cambios de infraestructura
railway config apply    # aplicar
railway link            # vincular el directorio al proyecto/servicio
railway variables       # ver variables
railway logs            # logs del deploy actual
railway up              # deploy manual desde el directorio local
```

## Probar localmente como en producción
```bash
npm run build && PORT=4000 npm start
curl localhost:4000/api/health
```
