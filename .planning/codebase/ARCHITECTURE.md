<!-- refreshed: 2026-11-06 -->
# Architecture

**Analysis Date:** 2026-11-06

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Client Frontend (React 19 + Vite)                     │
├───────────────────────────────┬───────────────────────────────┬─────────────┤
│      Public Team Portal       │      Game Stage Engines       │ Admin Suite │
│ `src/components/home/`        │ `src/components/game/`        │ `admin/`    │
│  - Team Auth & Crypt Entrance │  - Stage 1: Graveyard Escape  │  - Dashboard│
│  - Stage Selection HUD        │  - Stage 2: Haunted Image Hunt│  - Teams    │
│  - Sound & Theme Controller   │  - Stage 3: Forgotten Grave   │  - Rounds   │
│                               │  - Round 4: Campus Expedition │  - Results  │
└───────────────────────────────┴───────────────┬───────────────┴─────────────┘
                                                │
                                    HTTP / REST │ Cookies / SSE
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Authoritative Server Layer (Express 5)                  │
│ `server/index.ts`                                                           │
├───────────────────────────────┬───────────────────────────────┬─────────────┤
│      Auth & Session Guard     │      Game Logic & Routes      │  SSE Bus    │
│ `server/middleware/auth.ts`   │ `server/routes/`              │ `eventBus.ts│
│  - requireAdmin / requireTeam │  - auth, admin, round1        │             │
└───────────────────────────────┴───────────────┬───────────────┴─────────────┘
                                                │
                                  Synchronous   │ WAL Journaling
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Data Persistence (Node 26 SQLite Database)                │
│ `database/db.ts` & `database/schema.sql`                                    │
│  - teams, admins, stages_progress, score_transactions, global_round_state   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Root view router switching between Public and Admin views based on route path/hash | `src/app/App.tsx` |
| `FrostCartelHomePage` | Public team login, atmospheric gothic entrance, and round hub | `src/components/home/FrostCartelHomePage.tsx` |
| `AdminPortal` | Tournament management console (teams, pause states, live scores, round duration) | `src/components/admin/AdminPortal.tsx` |
| `Round1GraveyardEscape` | Stage 1 gameplay wrapper (haunted image investigation & tomb crypt puzzles) | `src/components/game/Round1GraveyardEscape.tsx` |
| `Stage2HauntedImageHunt` | Stage 2 evidence table examination, target search, and credit-deducted hints | `src/components/game/stage2/Stage2HauntedImageHunt.tsx` |
| `Stage3ForgottenGraveyard` | Stage 3 grave puzzle hub, skeleton bone assembly, and testament ciphers | `src/components/game/stage3/Stage3ForgottenGraveyard.tsx` |
| `RoundFourIntro` | Round 4 messenger dove cinematic reveal, sealed parchment modal, and transition | `src/components/game/round4/RoundFourIntro.tsx` |
| `CollegeBuildingView` | Round 4 academic block façade, curved SVG floor selection, and drone camera zoom | `src/components/game/round4/CollegeBuildingView.tsx` |
| `FloorInteriorView` | Round 4 cooperative campus expedition, route selector, map canvas, and riddle console | `src/components/game/round4/FloorInteriorView.tsx` |
| `CampusFloorMap` | Real-time keyboard-driven top-down avatar explorer with collision boundaries | `src/components/game/round4/CampusFloorMap.tsx` |
| `round4Service` | Round 4 client-side team progress, route unlocking, and code verification | `src/services/round4Service.ts` |
| `adminService` | Admin client communicating with backend `/api/admin` with mock-fallback support | `src/services/adminService.ts` |
| `authService` | Team authentication client managing active login session and player slots | `src/services/authService.ts` |
| `soundController` | Synthesized Web Audio sound effects (click, chime, hover, error, victory) | `src/utils/soundController.ts` |
| `server/index.ts` | Express 5 HTTP server mounting CORS, JSON, cookies, health, and sub-routers | `server/index.ts` |
| `database/db.ts` | SQLite database initialization, scrypt hashing, and prepared statements | `database/db.ts` |

## Pattern Overview

**Overall:** Client-Server Monorepo with Authoritative Database Backend and Rich Interactive React 19 Frontend.

**Key Characteristics:**
- **Authoritative Integrity:** Core team state, credentials, scoring transactions, and round locks are authoritatively validated in the backend SQLite store.
- **Client Offline-First Graceful Fallback:** Frontend services (`adminService.ts`, `round1Service.ts`, `round4Service.ts`) support local mock/fallback states to ensure tournament gameplay remains responsive even under network degradation.
- **Modular Stage Encapsulation:** Each tournament round/stage operates as an independent self-contained game module with dedicated assets, configuration manifests, and test suites.

## Layers

**UI Presentation Layer:**
- Purpose: Render immersive gothic tournament visuals, interactive maps, and responsive HUDs.
- Location: `src/components/`
- Contains: React components, SVG graphic overlays, CSS animations, dialogs.
- Depends on: `src/services/`, `src/utils/`, `src/types/`.
- Used by: Browser DOM root (`src/main.tsx`).

**Client Service Layer:**
- Purpose: Manage API communication, local session caching, and state change listeners.
- Location: `src/services/`
- Contains: Singletons (`authService`, `adminService`, `round1Service`, `round4Service`).
- Depends on: Browser `fetch`, `localStorage`, `src/types/`.
- Used by: `src/components/`.

**Server Route & Middleware Layer:**
- Purpose: Route incoming requests, authenticate HttpOnly session tokens, enforce admin/team authorization.
- Location: `server/routes/`, `server/middleware/`
- Contains: Express routers (`authRouter`, `adminRouter`, `round1Router`, `eventsRouter`), middlewares (`requireAdmin`, `requireTeam`).
- Depends on: `database/db.ts`, `node:crypto`.
- Used by: `server/index.ts`.

**Database & Persistence Layer:**
- Purpose: Provide durable, ACID-compliant storage with WAL concurrency.
- Location: `database/`
- Contains: Database instance (`db`), SQL schema (`schema.sql`), helper functions (`hashPassword`, `verifyPassword`, `initDatabase`).
- Depends on: `node:sqlite`, `node:crypto`, `node:fs`.
- Used by: `server/`.

## Data Flow

### Primary Authentication Flow

1. User submits team credentials on home screen (`src/components/home/FrostCartelHomePage.tsx`).
2. Client calls `authService.login(teamName, password)` (`src/services/authService.ts`).
3. HTTP POST dispatched to `/api/auth/login` (`server/routes/auth.routes.ts`).
4. Server queries team from database, verifies password via `verifyPassword()` with `crypto.timingSafeEqual` (`database/db.ts`).
5. Server generates 32-byte session token, stores it in `team_sessions`, sets HttpOnly cookie (`server/routes/auth.routes.ts`).
6. Client updates local session state and unlocks tournament round selection.

### Round 4 Cooperative Expedition Flow

1. Player selects floor on academic block façade (`src/components/game/round4/CollegeBuildingView.tsx`).
2. Drone camera animates flight directly through window aperture into interior (`src/components/game/round4/FloorCameraTransition.tsx`).
3. Interior mounts with active route step and spawn coordinates (`src/components/game/round4/FloorInteriorView.tsx`).
4. Desktop Explorer navigates avatar using WASD/arrows; delta-time movement checks boundary collisions in real-time (`src/components/game/round4/CampusFloorMap.tsx`).
5. Avatar arrives at golden target marker within trigger radius; chime plays and `round4Service.markTargetDiscovered()` reveals riddle.
6. Desktop player relays riddle to Field Partner on campus via voice call (`src/components/game/round4/FieldRiddlePanel.tsx`).
7. Field Partner locates physical landmark, finds inscribed cipher, reports answer code.
8. Desktop player enters code and clicks SUBMIT; `round4Service.submitAnswer()` validates code, unlocks next sequential clue step, and advances route progress.

**State Management:**
- Reactive state managed via React hooks (`useState`, `useCallback`, `useRef`, `useTransition`).
- Cross-tab and persistent local state synchronized via `localStorage` and subscription callbacks in `round4Service` and `round1Service`.

## Key Abstractions

**Expedition Route & Clue Hierarchy:**
- Purpose: Declarative representation of multi-floor treasure hunt routes, hints, riddles, coordinates, and accepted solution codes.
- Examples: `src/components/game/round4/ExpeditionRouteConfiguration.ts`, `src/types/round4Expedition.types.ts`.
- Pattern: Configuration-driven data model allowing content substitution without touching the engine.

**Floor Architectural Mapping:**
- Purpose: Normalized coordinate system mapping SVG curve paths, hit testing polygons, and window targets to the building façade.
- Examples: `src/components/game/round4/FloorConfiguration.ts`, `src/components/game/round4/BuildingFloorOverlay.tsx`.
- Pattern: ViewBox normalized geometry (`1629 × 965`).

## Entry Points

**Web Client Entry Point:**
- Location: `src/main.tsx`
- Triggers: Browser document load of `index.html`.
- Responsibilities: Mounts React `StrictMode` root on `#root`.

**Server Entry Point:**
- Location: `server/index.ts`
- Triggers: Node execution `node --experimental-strip-types server/index.ts` (or `npm run server`).
- Responsibilities: Initializes database (`initDatabase()`), seeds bootstrap admin, configures CORS/cookies, starts HTTP listener on `PORT`.

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop with synchronous SQLite queries (`DatabaseSync`). Long CPU tasks must use scryptSync cautiously.
- **Global State:** Singleton service instances in `src/services/` and module-level database connection in `database/db.ts`.
- **Circular Imports:** Enforced by TypeScript composite projects (`tsconfig.json`) and Oxlint; zero circular dependencies detected.
- **Deterministic Rendering:** No non-standard CSS or calc expressions inside SVG path strings; strict standard attributes for cross-browser reliability.

## Anti-Patterns

### Inline Styles in Scalable Vector Graphics

**What happens:** Embedding CSS `<style>` tags with deep `:hover` pseudo-classes inside SVG `<defs>` in React components.
**Why it's wrong:** Clashes with React state updates, bypasses component lifecycle, and triggers SonarQube linter violations.
**Do this instead:** Manage hover and selection states directly in React component props and standard Tailwind utility classes (`src/components/game/round4/BuildingFloorOverlay.tsx`).

### Async Handlers Without Await

**What happens:** Defining an event or service wrapper as `async () => { ... }` when all underlying operations are synchronous.
**Why it's wrong:** Creates unhandled Promise overhead and triggers SonarQube `typescript:S7503`.
**Do this instead:** Return synchronous values or explicit `Promise.resolve(...)` (`src/components/game/round4/FloorInteriorView.tsx`).

## Error Handling

**Strategy:** Graceful degradation with clear user feedback and secure defensive logging.

**Patterns:**
- Backend routes wrap handlers in try/catch blocks returning standardized JSON error payloads (`{ success: false, error: message }`).
- Client services catch network failures and fallback to local storage or mock modes (`src/services/adminService.ts`).
- Cryptographic checks use timing-safe comparison wrapped in try/catch blocks returning `false` on byte mismatch.

## Cross-Cutting Concerns

**Logging:** Standard ISO-8601 formatted console output with subsystem tags.
**Validation:** Server-side request body and parameter validation with HTTP 400 Bad Request responses.
**Authentication:** HttpOnly SameSite cookie sessions verified on every mutating route.

---

*Architecture analysis: 2026-11-06*

