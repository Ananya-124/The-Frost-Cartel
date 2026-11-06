# Codebase Structure

**Analysis Date:** 2026-11-06

## Directory Layout

```text
winter-arc/
├── .github/
│   └── workflows/              # GitHub Actions CI pipeline (`ci.yml`)
├── .planning/
│   └── codebase/               # GSD codebase maps (STACK, ARCHITECTURE, STRUCTURE, etc.)
├── database/                   # SQLite schema, bootstrap data, and DB connection
│   ├── db.ts                   # SQLite `DatabaseSync` connection, WAL mode, scrypt crypto
│   ├── schema.sql              # Relational schema (teams, rounds, stages, logs, events)
│   └── frost_cartel.db         # Persistent SQLite database file (WAL mode)
├── public/                     # Static production assets served by Vite/Express
│   ├── assets/
│   │   ├── halloween/          # Atmospheric icons, particles, candles, bats
│   │   ├── round-04/           # Latest campus building art, floor maps, cutouts, SVG overlays
│   │   ├── round-4/            # Dove flight animations, parchment textures, letter assets
│   │   ├── stage-2/            # High-res horror photographs, target icons, evidence board
│   │   └── stage-3/            # Coffin illustrations, relics, investigator graphics
│   └── vite.svg                # Application favicon
├── server/                     # Authoritative Node.js + Express 5 backend
│   ├── index.ts                # Express app setup, middleware, route mounting, server listen
│   ├── middleware/
│   │   └── auth.ts             # Session verification (`requireTeamAuth`, `requireAdminAuth`)
│   ├── routes/
│   │   ├── admin.routes.ts     # Admin metrics, round controls, team management, audit logs
│   │   ├── auth.routes.ts      # Team and admin authentication endpoints
│   │   ├── events.routes.ts    # SSE stream (`/api/events/stream`) and event broadcasting
│   │   └── round1.routes.ts    # Stage progress, submissions, hints, score mutations
│   ├── services/
│   │   └── eventBus.ts         # In-memory EventEmitter for SSE real-time notifications
│   └── __tests__/              # Server integration and restart persistence tests
├── src/                        # Client-side React 19 application
│   ├── app/
│   │   ├── App.tsx             # Root router, active view state, session bootstrap
│   │   ├── app.types.ts        # App view state definitions (`home`, `game`, `admin`)
│   │   └── routes.ts           # Navigation route identifiers
│   ├── components/             # UI component library split by operational domain
│   │   ├── admin/              # Game Master administration portal & dashboard tabs
│   │   ├── game/               # Stages 1 to 4 interactive gameplay interfaces
│   │   ├── home/               # Landing page, hero visuals, round portal selection
│   │   ├── layout/             # Minimal gothic navigation bar and corner quick controls
│   │   ├── leaderboard/        # Real-time tournament leaderboard modal
│   │   ├── player/             # Squad login dialog and personal team status dashboard
│   │   └── __tests__/          # UI unit tests (Vitest + React Testing Library)
│   ├── constants/              # Scored credits (`credits.constants.ts`), rounds configuration
│   ├── hooks/                  # Custom React hooks (`useNativeDialog.ts`, `useRoundFourIntro.ts`)
│   ├── services/               # Client-side business logic and API client wrappers
│   ├── styles/                 # Tailwind CSS directives and gothic metallic layers (`index.css`)
│   ├── test/                   # Vitest setup harness (`setup.ts`)
│   ├── types/                  # TypeScript interface contracts for all game entities
│   ├── utils/                  # Sound synthesizer, form validators, date formatters
│   ├── App.tsx                 # Barrel re-export of `src/app/App.tsx`
│   └── main.tsx                # Client DOM hydration entry point (`createRoot`)
├── index.html                  # HTML template hosting Google Fonts and viewport tags
├── package.json                # Project dependencies, scripts, and package metadata
├── tsconfig.json               # TypeScript project reference root
├── tsconfig.app.json           # Client TypeScript configuration
├── tsconfig.node.json          # Server and build tool TypeScript configuration
└── vite.config.ts              # Vite 8 bundling, dev proxy, and Vitest test config
```

## Directory Purposes

**`src/`:**
- Purpose: Complete frontend SPA written in React 19 and TypeScript.
- Contains: React components, state services, custom hooks, sound engine, utility functions, styling, and client-side unit tests.
- Key files: `src/main.tsx`, `src/app/App.tsx`, `src/styles/index.css`.

**`server/`:**
- Purpose: Authoritative tournament backend server running on Express 5.
- Contains: REST API endpoints, session authorization middleware, real-time Server-Sent Events (SSE) broadcaster, and server integration test suites.
- Key files: `server/index.ts`, `server/middleware/auth.ts`, `server/services/eventBus.ts`.

**`database/`:**
- Purpose: Data persistence layer powered by Node.js built-in `node:sqlite`.
- Contains: SQLite table schema, index definitions, database bootstrap logic, and cryptographic scrypt password verification.
- Key files: `database/db.ts`, `database/schema.sql`, `database/frost_cartel.db`.

**`public/`:**
- Purpose: Static assets served directly without Vite transformation.
- Contains: High-resolution Ghibli college artwork, floor cutouts, SVG overlays, photographic evidence textures, atmospheric sound samples, and parchment textures.
- Key directories: `public/assets/round-04/`, `public/assets/stage-2/`, `public/assets/stage-3/`.

**`.github/workflows/`:**
- Purpose: Automated CI pipeline configuration.
- Contains: `ci.yml` which installs dependencies, runs TypeScript compilation (`tsc -b`), executes Oxlint linter, and runs all Vitest test suites.
- Key files: `.github/workflows/ci.yml`.

**`.planning/codebase/`:**
- Purpose: Get-Shit-Done (GSD) structured codebase maps and architectural audits.
- Contains: `STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Client DOM mount point, attaches React 19 root into `#root` with `StrictMode`.
- `src/app/App.tsx`: Top-level application coordinator managing active views (`home`, `game`, `admin`), active rounds, audio mute state, and real-time SSE subscriptions.
- `server/index.ts`: Backend entry point, initializes SQLite database, registers JSON body parsing and cookie parsing, mounts API routers, and listens on port 3001.

**Configuration:**
- `vite.config.ts`: Vite 8 build settings, dev proxy forwarding `/api` to `127.0.0.1:3001`, and Vitest configuration with dual `jsdom`/`node` environments.
- `tsconfig.app.json` & `tsconfig.node.json`: TypeScript strict compiler targets for frontend DOM and backend Node.js.
- `tailwind.config.ts`: Tailwind CSS theme configuration specifying font families (Cinzel, MedievalSharp, Inter) and custom color palettes.

**Core Logic:**
- `database/db.ts`: Direct SQLite connection with WAL journal mode, foreign keys, busy timeout, and scrypt password hashing functions.
- `src/services/adminService.ts`: Admin API orchestration (team resets, stage unlocking, round pause/resume, audit log retrieval).
- `src/services/round1Service.ts`: Round 1, 2, and 3 state management, stage scoring, hint deductions, and offline fallback cache.
- `src/services/round4Service.ts`: Round 4 Campus Expedition route progression, clue unlocking, target discovery, and answer verification.
- `src/utils/soundController.ts`: Web Audio API synthetic audio engine generating procedural sound effects without external MP3 files.

**Testing:**
- `src/test/setup.ts`: Vitest global setup extending expect with `@testing-library/jest-dom/vitest`.
- `server/__tests__/database_and_api.test.ts`: Server integration test suite validating REST endpoints, sessions, and SQLite durability.
- `src/components/__tests__/FloorInteriorView.test.tsx`: Component test suite validating the Round 4 cooperative campus expedition interface.

## Naming Conventions

**Files:**
- React Components: PascalCase ending with `.tsx` (e.g. `CollegeBuildingView.tsx`, `FloorInteriorView.tsx`, `AdminPortal.tsx`).
- Services and Controllers: camelCase ending with `.ts` or `.service.ts` (e.g. `round4Service.ts`, `adminService.ts`, `soundController.ts`).
- Types and Interfaces: camelCase ending with `.types.ts` or `.ts` (e.g. `round4Expedition.types.ts`, `admin.types.ts`).
- Constants: camelCase ending with `.constants.ts` (e.g. `credits.constants.ts`, `rounds.constants.ts`).
- Utilities: camelCase ending with `.utils.ts` or `.ts` (e.g. `validation.utils.ts`, `date.utils.ts`).
- Tests: PascalCase or camelCase matching target file, ending with `.test.ts` or `.test.tsx` (e.g. `FloorInteriorView.test.tsx`, `round1Service.test.ts`).

**Directories:**
- Feature Domains: kebab-case or lower-case singular (e.g. `round4/`, `stage1/`, `stage2/`, `stage3/`, `haunted/`, `dashboard/`).
- General Categorical Folders: lower-case plural (e.g. `components/`, `services/`, `hooks/`, `types/`, `utils/`, `constants/`).
- Asset Categories: kebab-case (e.g. `round-04/`, `stage-2/`, `floor-cutouts/`, `evidence-board/`).

## Where to Add New Code

**New Feature / Stage:**
- Component UI: Place in `src/components/game/roundX/` or `src/components/game/stageX/`. Create focused sub-components rather than monolithic files.
- Types: Add domain interfaces in `src/types/roundX.types.ts`.
- State & Business Logic: Create a dedicated service in `src/services/roundXService.ts`.
- Backend Routes: Add route handler in `server/routes/roundX.routes.ts` and mount in `server/index.ts`.
- Tests: Place unit tests in `src/components/__tests__/` and backend integration tests in `server/__tests__/`.

**New Admin Tool / Metric Tab:**
- Component UI: Add tab component in `src/components/admin/` (or subdirectories like `src/components/admin/rounds/`).
- Actions: Add API helper methods in `src/services/adminService.ts`.
- Endpoints: Expose secure routes in `server/routes/admin.routes.ts` protected by `requireAdminAuth`.

**Shared Utilities & Hooks:**
- Custom React Hooks: Place in `src/hooks/use<HookName>.ts`.
- Generic Helpers: Place in `src/utils/<name>.utils.ts`.
- Sound Effects: Add synthetic audio methods into `src/utils/soundController.ts`.

## Special Directories

**`database/`:**
- Purpose: Houses the live runtime SQLite database file (`frost_cartel.db`), WAL temporary logs (`frost_cartel.db-wal`, `frost_cartel.db-shm`), and seed script.
- Generated: Database file is created on first boot if absent; schema is initialized automatically.
- Committed: `schema.sql` is tracked in git; `*.db`, `*.db-wal`, and `*.db-shm` are ignored in `.gitignore`.

**`dist/`:**
- Purpose: Production client build output generated by `npm run build` (`vite build`).
- Generated: Yes.
- Committed: No (listed in `.gitignore`).

**`node_modules/`:**
- Purpose: Installed third-party packages for npm.
- Generated: Yes (via `npm install`).
- Committed: No.

**`.planning/`:**
- Purpose: Project roadmap, execution plans, phase progress, and codebase architecture documentation.
- Generated: Yes (via GSD commands).
- Committed: Yes.

---

*Structure analysis: 2026-11-06*

