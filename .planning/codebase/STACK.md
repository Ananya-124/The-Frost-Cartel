# Technology Stack

**Analysis Date:** 2026-11-06

## Languages

**Primary:**
- TypeScript 7.0 (`~7.0.2` via `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`) — Used across all client application components, game state managers, services, and backend server APIs.

**Secondary:**
- JavaScript / ESM — Configuration files (`tailwind.config.js`, `postcss.config.js`), client HTML template (`index.html`).
- SQL — Schema definitions and migrations (`database/schema.sql`).

## Runtime

**Environment:**
- Node.js `22.x` / `24.x` (enforced by `.github/workflows/ci.yml` matrix) with Node 26 native SQLite support (`node:sqlite`, `DatabaseSync`).
- Browser ECMAScript 2022+ targeting modern desktop and mobile browsers.

**Package Manager:**
- npm (Node Package Manager) with lockfile `package-lock.json` present.

## Frameworks

**Core:**
- React 19 (`^19.3.1`) — Core UI rendering and reactive component tree.
- React DOM (`^19.3.1`) — Web DOM mounting (`src/main.tsx`).
- Express 5 (`^5.3.0`) — Authoritative backend HTTP REST API server (`server/index.ts`).

**Testing:**
- Vitest (`^5.1.0`) — Primary fast unit and integration test runner (`vite.config.ts`).
- `@testing-library/react` (`^16.3.3`) — React component DOM assertion library.
- `@testing-library/jest-dom` (`^7.0.1`) — Custom DOM element matchers.
- jsdom (`^30.1.3`) — Browser DOM simulation environment for UI tests.

**Build/Dev:**
- Vite 8 (`^8.3.5`) — Frontend bundler and hot-module reloading server (`vite.config.ts`).
- `@vitejs/plugin-react` (`^6.1.2`) — Babel/SWC React JSX transformation.
- Tailwind CSS (`^3.4.19`) — Utility-first styling engine (`tailwind.config.js`).
- PostCSS (`^8.5.32`) & Autoprefixer (`^10.6.2`) — CSS parsing and vendor prefixing.
- Oxlint (`^1.89.0`) — High-performance Rust-based JavaScript/TypeScript linter (`.oxlintrc.json`).

## Key Dependencies

**Critical:**
- `node:sqlite` (`DatabaseSync`) — High-performance built-in synchronous SQLite engine for atomic state persistence and transaction journaling (`database/db.ts`).
- `node:crypto` (`scryptSync`, `randomBytes`, `timingSafeEqual`) — Cryptographically secure team and admin password hashing and token generation (`database/db.ts`, `server/auth.ts`).
- `cookie-parser` (`^1.4.7`) — HTTP cookie parsing for HttpOnly session authentication tokens (`server/index.ts`).
- `cors` (`^2.8.6`) — Strict origin validation middleware (`server/index.ts`).
- `dotenv` (`^18.0.9`) — Environment variable injection from `.env` (`server/index.ts`).

**Infrastructure & Assets:**
- `lucide-react` (`^1.66.0`) — High-clarity iconography for administration panels and game HUD controls.
- Web Audio API / HTML5 Audio — Custom synthesized procedural chime and click audio controller (`src/utils/soundController.ts`).

## Configuration

**Environment:**
- Configured via `.env` files (template documented in `.env.example`).
- Key variables required:
  - `PORT`: Authoritative HTTP server port (default: `3001`).
  - `NODE_ENV`: Runtime mode (`development` | `production`).
  - `SQLITE_DB_PATH`: SQLite database path (default: `./database/frost_cartel.db`).
  - `ADMIN_BOOTSTRAP_USER`: Root administrator username.
  - `ADMIN_BOOTSTRAP_PASSWORD`: Root administrator initial password.
  - `SESSION_SECRET`: HMAC signing secret for session cookies.
  - `VITE_API_URL`: Client-side target backend URL (default: `http://127.0.0.1:3001`).

**Build:**
- `package.json` — Scripts: `dev`, `server`, `build`, `lint`, `test`, `preview`.
- `tsconfig.json` — Root project references composite configuration.
- `tsconfig.app.json` — React DOM application TypeScript settings.
- `tsconfig.node.json` — Server and tooling TypeScript settings.
- `tsconfig.test.json` — Vitest and Testing Library type definitions.
- `vite.config.ts` — Vite bundle settings, reverse proxy (`/api` -> `http://127.0.0.1:3001`), and Vitest environment matchers (`server/**` -> `node`, `src/**` -> `jsdom`).

## Platform Requirements

**Development:**
- Node.js >= 22.0.0
- npm >= 10.0.0
- Modern Chromium / Firefox / WebKit browser with SVG and Canvas acceleration.

**Production:**
- Linux / Containerized Node 22+ or 24+ environment running `server/index.ts` alongside Vite static assets.
- Persistent file system volume mounted at `./database` for WAL-mode SQLite database files (`frost_cartel.db`, `frost_cartel.db-wal`, `frost_cartel.db-shm`).

---

*Stack analysis: 2026-11-06*

