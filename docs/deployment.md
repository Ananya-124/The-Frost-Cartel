# Deployment configuration

## Domains and browser sessions

The current `SameSite=Lax` session-cookie setup requires HTTPS custom domains for the frontend and API under the same registrable domain, for example `game.example.com` on Vercel and `api.example.com` on Render. The default Vercel and Render hostnames do not meet this requirement. Set Vercel's public `VITE_API_URL=https://api.example.com` and Render's backend-only `CORS_ALLOWED_ORIGINS=https://game.example.com` (plus any separate admin frontend origin). Use exact origins without paths or wildcards.

The API issues host-only `fc_team_token` and `fc_admin_token` cookies with `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`. Browser requests include credentials. Do not set a cookie `Domain`. For local development, leave `VITE_API_URL` empty and use the Vite `/api` proxy.

`VITE_API_URL` is public and is compiled into the frontend. PostgreSQL connection strings, TLS/CA material, and admin bootstrap credentials are backend/operator secrets; never configure them as Vercel variables.

## Render web service

`render.yaml` defines the Node web service. Configure these values in Render:

| Variable | Value |
| --- | --- |
| `CORS_ALLOWED_ORIGINS` | Exact HTTPS frontend origins, comma-separated |
| `DATABASE_URL` | Supabase PostgreSQL URI; use the Session pooler when required by network topology |
| `PGSSLMODE` | `verify-full` |
| `PGSSLROOTCERT_CONTENT` | Supabase root CA certificate PEM |
| `ADMIN_BOOTSTRAP_USER` | Chosen initial admin username; needed only if no administrator exists yet |
| `ADMIN_BOOTSTRAP_PASSWORD` | Unique initial admin password; needed only if no administrator exists yet |
| `ROUND2_AUCTION_ENABLED` | `false` |

The service has no persistent disk. PostgreSQL is the persistent source for identity, sessions, scores, credits, progression and all four rounds. Build with `npm ci && npm run build`; start with `npm start`; Render readiness uses `/api/ready`. `/api/health` is a liveness endpoint. Readiness requires PostgreSQL connectivity and all migrations 001–012.

Keep Round 2 disabled. `ROUND2_AUCTION_ENABLED=false` is a deployment marker in the Render configuration; the authoritative runtime gate is PostgreSQL `round2_auction_config.enabled`, seeded as `false`. Do not enable the database setting without separate approval.

## Explicit PostgreSQL migration

Do not run migrations from Render startup or release commands. Apply them explicitly from a trusted machine after configuring the Supabase connection and CA certificate:

```powershell
$env:DATABASE_URL = '<Supabase Session pooler connection URI>'
$env:PGSSLMODE = 'verify-full'
$env:PGSSLROOTCERT_CONTENT = Get-Content -Raw .\supabase-root-ca.crt
npm run db:migrate
```

The runner applies migrations 001–012 in filename order, recording each migration in the same PostgreSQL transaction. Check the result and `/api/ready` before routing players to the service. Never use the production URI for tests.

## First administrator

On startup, the PostgreSQL bootstrap creates an administrator only when the `admins` table is empty and both bootstrap variables are configured. It does not recreate or reset an existing admin. After first login, remove the bootstrap variables from Render. Do not use sample or development credentials in production.

## Vercel frontend

Set production `VITE_API_URL` to the Render API custom domain. Build with `npm run build`; output directory is `dist` and `vercel.json` supplies the SPA fallback. Vite's local proxy routes `/api` to `http://127.0.0.1:3001`.

After deployment, check `/api/health`, `/api/ready`, team/admin login, authenticated requests, session refresh and logout using the configured same-site custom domains.

## Local PostgreSQL verification

Use a separate local PostgreSQL test database. Set `DATABASE_URL`, `PG_TEST_DATABASE_URL` and `PGSSLMODE=disable`, then run `npm test`, `npm run lint` and `npm run build`. Apply migrations only to that local test database. Do not point verification commands at production Supabase.
