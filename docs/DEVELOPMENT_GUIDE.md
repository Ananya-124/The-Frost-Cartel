# Frost Cartel Development Guide

## Requirements

- Node.js 22.18 or later within the version range in `package.json`.
- npm 10 or later.
- A separate local PostgreSQL database for development and integration tests.

## Setup

```powershell
npm ci
$env:DATABASE_URL = '<local PostgreSQL connection URI>'
$env:PG_TEST_DATABASE_URL = '<isolated local PostgreSQL test database URI>'
$env:PGSSLMODE = 'disable'
npm run db:migrate
```

Never use the production Supabase URL for development or tests. PostgreSQL integration tests create isolated temporary schemas and refuse remote test hosts.

## Run the application

```powershell
npm run server
npm run dev
```

The Express API listens on port 3001. Vite runs on port 5173 and proxies `/api` requests to the local API. The server requires PostgreSQL configuration; `/api/ready` reports whether PostgreSQL is reachable and migrations 001–012 are present.

For local admin login, configure `ADMIN_BOOTSTRAP_USER` and `ADMIN_BOOTSTRAP_PASSWORD`. Bootstrap creates an account only when the PostgreSQL `admins` table is empty; it does not seed sample teams or development credentials.

## Verification

```powershell
npm test
npm run lint
npm run build
```

PostgreSQL-backed test files require `PG_TEST_DATABASE_URL` to point to an isolated local database. They create and remove temporary schemas; they do not reset the database.

## Database layout

- `database/postgres/migrations/`: ordered PostgreSQL schema and catalog migrations.
- `database/postgres/`: connection, transaction, ledger, progression, and round repositories.
- `server/routes/`: authenticated Express APIs backed by PostgreSQL.

The PostgreSQL database is the persistent source for identities, sessions, scores, credits, progression, and rounds 1–4. Round 2 remains disabled by its PostgreSQL configuration.
