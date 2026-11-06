# Codebase Concerns

**Analysis Date:** 2026-11-06

## Tech Debt

**Dual App Entry Points:**
- Issue: Two root App files exist: `src/App.tsx` (a one-line re-export) and `src/app/App.tsx` (the actual root router component).
- Files: `src/App.tsx`, `src/app/App.tsx`, `src/main.tsx`.
- Impact: Potential confusion for developers and tooling regarding which file is authoritative.
- Fix approach: Deprecate `src/App.tsx` and update imports to reference `src/app/App.tsx` directly.

**Monolithic Stage and Service Files:**
- Issue: Several files exceed 700 lines of code containing mixed concerns (game rules, UI layout, static image asset maps, and animation logic).
- Files: `src/services/round1Service.ts` (842 lines), `src/components/game/stage3/Grave2BuriedDiary.tsx` (755 lines), `src/services/adminService.ts` (777 lines).
- Impact: Higher cognitive load, slower code review, and risk of accidental regression during minor edits.
- Fix approach: Decompose into focused domain modules (e.g. separate `round1Config.ts`, `round1Scoring.ts`, and `round1Storage.ts`).

**Asset Directory Duplication:**
- Issue: Both `public/assets/round-4` and `public/assets/round-04` exist in the repository with overlapping content (building photos, README files, cutouts).
- Files: `public/assets/round-4/`, `public/assets/round-04/`.
- Impact: Unnecessary repository bloat (~25 MB duplicate static assets) and potential drift between asset versions.
- Fix approach: Consolidate all Round 4 assets into `public/assets/round-04/`, update legacy paths in `round-4/`, and remove the duplicate directory.

**Duplicate Admin Type Declarations:**
- Issue: `src/types/admin.ts` is an aggregate re-export barrel, whereas `src/types/admin.types.ts` defines `DashboardMetrics`.
- Files: `src/types/admin.ts`, `src/types/admin.types.ts`.
- Impact: Confusing import options for IDE auto-completion.
- Fix approach: Merge `DashboardMetrics` into `src/types/admin.types.ts` and consolidate exports into `src/types/index.ts`.

## Known Bugs

**Browser Autoplay Policy audio blocking:**
- Symptoms: Procedural sound effects may not play on initial page load if the user has not yet interacted with the DOM.
- Files: `src/utils/soundController.ts`, `src/app/App.tsx`.
- Trigger: Opening the game in a fresh browser session without clicking or pressing a key.
- Workaround: `SoundController` lazily initializes and resumes the `AudioContext` upon the first explicit user click or interaction.

**Exhaustive Dependencies Effect Ref Cleanup:**
- Symptoms: Accessing `timersRef.current` inside the cleanup function of `useEffect` triggers linter errors and can retain stale timer references if the component unmounts mid-animation.
- Files: `src/components/game/round4/CollegeBuildingView.tsx`.
- Trigger: Rapidly clicking between floors or toggling views during camera zoom transitions.
- Workaround: Cache `const activeTimers = timersRef.current` locally within the effect body before returning the cleanup function.

## Security Considerations

**Default Admin Bootstrap Credentials:**
- Risk: Default credentials (`admin123` / `admin@1`) are present in `.env.example` and fallback defaults in `database/db.ts`. If deployed without setting environment variables, unauthorized users could access the Game Master control portal.
- Files: `database/db.ts:seedBootstrapData()`, `.env.example`.
- Current mitigation: Environment variables `ADMIN_BOOTSTRAP_USER` and `ADMIN_BOOTSTRAP_PASSWORD` override the defaults if provided.
- Recommendations: Add an enforced production check in `server/index.ts` that refuses to start in `NODE_ENV === 'production'` if default bootstrap credentials are still active.

**Cookie Security in Development vs. Production:**
- Risk: `fc_admin_session` and `fc_team_session` cookies are set with `secure: process.env.NODE_ENV === 'production'`. If deployed behind an SSL-terminating reverse proxy (e.g. Nginx, Cloudflare) without `app.set('trust proxy', 1)`, Express may fail to identify HTTPS requests and drop secure cookies.
- Files: `server/routes/auth.routes.ts`, `server/index.ts`.
- Current mitigation: Secure flag toggles based on `NODE_ENV`.
- Recommendations: Explicitly configure `app.set('trust proxy', 1)` in `server/index.ts` for reverse proxy compatibility.

## Performance Bottlenecks

**Large Bundle Chunk Warning in Vite Build:**
- Problem: `dist/assets/index-*.js` produces a single large bundle (>700 kB uncompressed) exceeding Vite's 500 kB chunk warning threshold.
- Files: `vite.config.ts`, `src/app/App.tsx`.
- Cause: All round components (Round 1, Round 2, Round 3, Round 4), Admin Portal, and Lucide icons are bundled eagerly into the initial entry chunk.
- Improvement path: Implement React code-splitting using `React.lazy()` and `Suspense` for `AdminPortal`, `CollegeBuildingView`, and each heavy stage interface.

**Complex SVG Bézier Calculations on Viewport Resize:**
- Problem: Recalculating responsive aspect ratios and SVG viewBox transformations on every window resize event can cause frame drops during window dragging.
- Files: `src/components/game/round4/BuildingFloorOverlay.tsx`.
- Cause: Unthrottled resize listeners recalculating bounding boxes.
- Improvement path: Wrap window resize observers in `requestAnimationFrame` or a debounce utility.

## Fragile Areas

**Round 4 Architectural Coordinate Mapping:**
- Files: `src/components/game/round4/FloorConfiguration.ts`, `src/components/game/round4/BuildingFloorOverlay.tsx`.
- Why fragile: All 8 floor curved Bézier paths, window reveal offsets, and camera pan targets are hardcoded to the exact native coordinate space (`1629 × 965`) of `college_building_base.png`.
- Safe modification: If the building artwork is updated, cropped, or scaled, all coordinates must be re-calibrated using `FloorCalibrationTool.tsx`.
- Test coverage: Tested in `CollegeBuildingView.test.tsx` and `FloorInteriorView.test.tsx`, but visual alignment requires pixel verification.

**In-Memory SSE Real-Time Event Bus:**
- Files: `server/services/eventBus.ts`, `server/routes/events.routes.ts`.
- Why fragile: If a client connection drops or encounters high network jitter, there is no message replay buffer; missed events (like real-time score updates or round pause) must be fetched via REST polling fallback.
- Safe modification: Keep REST polling fallbacks active on the client.
- Test coverage: Covered in `server/__tests__/database_and_api.test.ts`.

## Scaling Limits

**Single-Instance SQLite Database:**
- Current capacity: Efficiently handles 50 to 100 concurrent squads with sub-millisecond read/write cycles under SQLite WAL mode.
- Limit: SQLite allows multiple concurrent readers but serializes all writes. Over 200 concurrent teams submitting answers simultaneously could exceed the 5000ms `busy_timeout` and encounter `SQLITE_BUSY` errors.
- Scaling path: Migrate to a managed PostgreSQL cluster by introducing an abstraction over `db.prepare()` or using an ORM like Drizzle/Prisma when scaling beyond 100 teams.

**Single-Process Server Architecture:**
- Current capacity: Single Node.js event loop serving REST endpoints and SSE streams.
- Limit: In-memory SSE connections (`eventBus.ts`) cannot broadcast across multiple Node.js worker processes or container instances without a distributed pub/sub broker (e.g. Redis).
- Scaling path: Introduce Redis adapter for SSE broadcast if horizontal pod scaling is required.

## Dependencies at Risk

**Node.js Built-in `node:sqlite`:**
- Risk: `node:sqlite` is an experimental API introduced in Node.js v22.5.0+.
- Impact: Potential minor API changes in future Node releases or warnings on older Node runtimes (<22).
- Migration plan: If running on legacy Node or non-Node runtimes, drop in `better-sqlite3` as an identical synchronous replacement.

## Missing Critical Features

**Round 4 Authoritative Backend Sync:**
- Problem: Round 4 Campus Expedition currently tracks team progress in browser `localStorage` via `round4Service.ts` rather than synchronizing clue submissions to the backend SQLite `stages_progress` table.
- Blocks: Official tournament leaderboard rankings cannot automatically reflect Round 4 completions without manual Game Master intervention.
- Action: Create `server/routes/round4.routes.ts` and add database transactions for clue verification.

**Admin Announcement Broadcast Banner:**
- Problem: Game Masters can pause and resume rounds, but cannot broadcast arbitrary text messages (e.g. "5 minutes remaining", "Pizza in hallway") across all active team screens.
- Blocks: Urgent operational communications during the live tournament.

## Test Coverage Gaps

**Procedural Sound Synthesizer (`src/utils/soundController.ts`):**
- What's not tested: Web Audio API oscillator nodes, gain ramps, and procedural audio synthesis methods.
- Files: `src/utils/soundController.ts`.
- Risk: Audio distortion or unhandled audio context exceptions on uncommon browser engines.
- Priority: Medium.

**Stage 1 Interactive Escape Framework:**
- What's not tested: Stage 1 puzzle interaction logic and time tracking.
- Files: `src/components/game/stage1/Stage1Framework.tsx`.
- Risk: Unnoticed UI regression in Stage 1 puzzles.
- Priority: Medium.

**SSE Network Disconnect & Reconnection Recovery:**
- What's not tested: Client recovery behavior when the SSE connection drops and reconnects after an extended network partition.
- Files: `src/app/App.tsx`, `server/routes/events.routes.ts`.
- Risk: Teams could show stale scores if the SSE connection drops and fails to re-subscribe.
- Priority: High.

---

*Concerns audit: 2026-11-06*

