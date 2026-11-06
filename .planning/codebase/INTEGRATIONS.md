# External Integrations

**Analysis Date:** 2026-11-06

## APIs & External Services

**HTTP Server API:**
- Authoritative Express 5 HTTP API Server running on port `3001` (`server/index.ts`).
  - SDK/Client: Native Browser `fetch` encapsulated in `src/services/apiService.ts`, `src/services/authService.ts`, `src/services/adminService.ts`.
  - Auth: `credentials: 'include'` with HttpOnly cookies (`admin_session`, `team_session`).
- Vite Dev Server Proxy:
  - Proxies `/api` requests to `http://127.0.0.1:3001` with `changeOrigin: true` (`vite.config.ts`).

## Data Storage

**Databases:**
- **SQLite 3 (`node:sqlite`)**
  - Engine: Built-in `DatabaseSync` (`node:sqlite`).
  - Storage: File-based persistence in `database/frost_cartel.db`.
  - Concurrency: Write-Ahead Logging (`PRAGMA journal_mode = WAL;`), foreign keys enforced (`PRAGMA foreign_keys = ON;`), busy timeout 5000ms (`PRAGMA busy_timeout = 5000;`).
  - Connection Config: `SQLITE_DB_PATH` in `.env` (defaults to `./database/frost_cartel.db`).
  - Schema Migration: Declarative initialization from `database/schema.sql` via `initDatabase()` in `database/db.ts`.

**Client-Side Persistence:**
- Browser `localStorage` for offline gameplay state and client-side progress caching (`src/services/round4Service.ts`, `src/services/round1Service.ts`).
- Authoritative sync pushes client state updates to `/api/round1/progress` and receives server timestamps.

**File Storage:**
- Local filesystem only (`database/`, `public/assets/`).
- Transparent floor cutouts, audio samples, and artwork loaded from `public/assets/round-04/` and `src/assets/`.

**Caching:**
- In-memory event bus and prepared statement caching via SQLite compiled statements (`database/db.ts`).
- Server-Sent Events (SSE) stream buffer for live admin dashboard broadcasts (`server/routes/events.routes.ts`).

## Authentication & Identity

**Auth Provider:**
- Custom cryptographically secured session manager (`server/auth.ts`, `database/db.ts`).
  - Password Hashing: `scrypt` key derivation function with 16-byte cryptographically random salt and 64-byte key length (`crypto.scryptSync`).
  - Password Verification: Constant-time comparison using `crypto.timingSafeEqual` to eliminate timing attack vectors.
  - Session Tokens: 32-byte cryptographically random hex strings (`crypto.randomBytes(32)`).
  - Cookie Transmission: SameSite HTTP cookies signed with `SESSION_SECRET`.

**Role-Based Access Control:**
- **Superadmin / Admin:** Authenticated via `/api/admin/login` (`server/routes/admin.routes.ts`), validated with `requireAdmin` middleware.
- **Team / Player:** Authenticated via `/api/auth/login` (`server/routes/auth.routes.ts`), validated with `requireTeam` middleware.

## Monitoring & Observability

**Error Tracking:**
- Local structured error logging via Express error handling middlewares and JSON response wrappers (`{ success: false, error: "..." }`).
- Client-side error boundary reporting in React component trees (`src/components/common/ErrorBoundary.tsx`).

**Logs:**
- Standard output (`console.log`, `console.error`) with ISO-8601 timestamps and subsystem prefixes (`[DB]`, `[AUTH]`, `[SSE]`).

## CI/CD & Deployment

**Hosting:**
- Containerized or VM Node.js runtime supporting Node 22+ with SQLite WAL volumes.
- Frontend static bundle generated via `vite build` into `dist/`.

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`).
  - Workflow Name: `FROST CARTEL CI`.
  - Matrix: Node.js `22.x`, `24.x` on `ubuntu-latest`.
  - Steps: Checkout -> Setup Node -> `npm ci` -> `npm run lint` (`oxlint`) -> `npm test` (`vitest`) -> `npm run build` (`tsc -b && vite build`).

## Environment Configuration

**Required env vars:**
- `PORT`: Server port (`3001`).
- `SQLITE_DB_PATH`: SQLite database file path (`./database/frost_cartel.db`).
- `ADMIN_BOOTSTRAP_USER`: Initial admin username (`admin123`).
- `ADMIN_BOOTSTRAP_PASSWORD`: Initial admin password (`admin@1`).
- `SESSION_SECRET`: Cryptographic cookie signing secret.
- `VITE_API_URL`: Backend API base URL for client fetch requests (`http://127.0.0.1:3001`).

**Secrets location:**
- Stored exclusively in local uncommitted `.env` file (modeled in `.env.example`).
- Strictly excluded from version control via `.gitignore`.

## Webhooks & Callbacks

**Incoming:**
- None (internal closed tournament network).

**Outgoing:**
- Server-Sent Events (SSE) live push stream on `/api/events/stream` broadcasting live score updates, stage unlocks, and team status changes to administrative monitors (`server/routes/events.routes.ts`).

---

*Integration audit: 2026-11-06*

