# PostgreSQL initialization and deployment procedure

This is an operator procedure, not permission to reset a database or connect to Supabase. Never drop, truncate, or reset a database as part of initialization. Use a dedicated local development database and a separate local PostgreSQL test database.

## Migration order and execution

The migration runner sorts `.sql` filenames and applies each unapplied migration in its own PostgreSQL transaction. It is invoked explicitly with `npm run db:migrate`; backend startup does not run migrations. Do not configure migrations as a Render startup or release command.

The current sequence is:

1. `001_foundation.sql`
2. `002_seed_catalog.sql`
3. `003_team_progression.sql`
4. `004_round1_and_shared_ledgers.sql`
5. `005_round2_auction.sql`
6. `006_round3_state.sql`
7. `007_round4_expedition.sql`
8. `008_round1_prelaunch_default.sql`
9. `009_round1_configuration.sql`
10. `010_round2_admin_audit.sql`
11. `011_round3_timer_initialization.sql`
12. `012_round4_catalog_seed.sql`

The runner records successful filenames in `schema_migrations`. Run readiness checks after migration; `/api/ready` requires all twelve migration records and PostgreSQL connectivity.

## Fresh-database defaults

On an empty database after migrations:

- Round 1 is inactive pending coordinator release.
- Round 2 auction configuration exists and is disabled.
- Round 4 settings exist and the round is unreleased.
- No sample teams or administrator are seeded.
- Catalog/configuration reference rows are seeded by migrations; these are not demo team or account data.

The migrations initialize the per-team progression and game-state records when teams are created. They do not automatically qualify teams, create a winner, or add demo progress.

## Local development and tests

Copy `.env.example` to `.env` and replace its obvious placeholders with values for local use only. Set `DATABASE_URL` to a dedicated local development database and set local TLS mode as documented in the example. Uncomment bootstrap variables only if a local administrator must be created. Apply migrations explicitly:

```powershell
npm run db:migrate
npm start
```

In a second terminal, leave `VITE_API_URL` empty so Vite uses the local `/api` proxy:

```powershell
npm run dev
```

Set `PG_TEST_DATABASE_URL` only to a separate isolated PostgreSQL test database on `localhost`, `127.0.0.1`, or `::1`. Never point it at Supabase or another remote host. The integration tests use temporary schemas within that local test database; do not use a production database for tests. Run the suite with:

```powershell
npm test
```

Use a dedicated database for each environment. The tests may change `DATABASE_URL` in their own process to address an isolated schema; they do not need or permit connecting the test target to production.

## Production initialization (separate approval required)

1. Confirm the intended Supabase project and that its database is newly provisioned or otherwise explicitly approved for this initialization. This procedure never authorizes resetting an existing database.
2. Configure the approved `DATABASE_URL`, `PGSSLMODE=verify-full`, and PostgreSQL root CA material in a trusted operator environment. Keep credentials and certificates out of source, logs, shell history, Vercel, and this document.
3. From the approved operator environment, explicitly run `npm run db:migrate` once. The command applies unapplied migrations in the 001–012 order above. Review its output and `schema_migrations`; do not add an automatic migration command to Render.
4. Configure Render with the backend-only variables described in [deployment.md](./deployment.md). Confirm `/api/ready` reports ready before routing users to the service.
5. For the first backend startup on a database without an administrator, configure `ADMIN_BOOTSTRAP_USER` and `ADMIN_BOOTSTRAP_PASSWORD`. The password must be at least 16 characters. Startup creates one admin only if `admins` is empty; it does not reset or recreate an existing administrator.
6. After confirming the first administrator was created and can authenticate, remove both bootstrap variables from Render. Store the chosen administrator credentials only in the approved password manager.
7. Keep Round 2 disabled. Record the migration versions and operator/time in the deployment record. Recover from problems using a reviewed backup/restore procedure, never by resetting the database.

## Domain and secret placement

The current `SameSite=Lax` cookie setup requires the Vercel frontend and Render API to use HTTPS custom domains under the same registrable domain, such as `game.example.com` and `api.example.com`. Configure exact CORS origins for the frontend. The public `VITE_API_URL` contains only the API address. Database connection strings, PostgreSQL TLS/CA settings, and administrator bootstrap values belong only in the backend/operator secret environment and must never be set as Vercel frontend variables.

See [deployment.md](./deployment.md) for Render, Vercel, CORS, cookie, readiness, and build settings.
