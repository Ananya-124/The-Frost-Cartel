# Frost Cartel backend audit and PostgreSQL foundation

Audit date: 2026-11-07

## Current architecture observed

- The repository is a React 19 + TypeScript + Vite frontend and a TypeScript Express 5 server in one package. `server/index.ts` mounts authentication, admin, Rounds 1–4, and SSE event routes.
- The running server imports `database/db.ts`, which opens Node's native SQLite database at `database/frost_cartel.db`, enables WAL and foreign keys, runs `database/schema.sql`, and seeds bootstrap records. PostgreSQL was mentioned in `.env.example` and docs, but no PostgreSQL client or migration runner previously existed.
- Persistent round endpoints/services are mixed with browser state and in-memory services; the frontend admin service explicitly describes itself as a mock repository. The centralized admin UI exists, but not every panel is backed by the same durable server data.

## Round flow and persistence

| Round | Implemented behavior found | Persistence / integration status |
|---|---|---|
| 1 | SQLite teams, stage progress, score transactions and round state are represented by the server schema and auth/admin APIs. The client `round1Service` contains challenge configuration and scoring callbacks, including a 100/150/250 credit stage allocation, 15-credit hint penalty, and zero wrong-click penalty defaults. | Server has persistent records, but the audit found client-side service logic and local session storage in the Round 1 → Round 2 handoff. Do not assume all stage actions currently update server rows. Stage 1 is a reserved/unconfigured challenge in current docs. |
| 2 | Express auction has six cards, 10-credit bid increments, 10-second anti-sniping, credit caps, admin-key routes and settlement. Auction snapshot survives restart in SQLite `round2_state`. | Join trusts a team name and a client-reported Round 1 balance; bidding is unauthenticated. State is a JSON snapshot, not normalized purchase/credit records. Client mirrors inventory to `localStorage`. |
| 3 | Authenticated Express routes/services persist run and hunt state using SQLite and expose hunt 1/2/3, evidence, progress, card activation and completion endpoints. | `round3Service` also reads Round 2 inventory through browser storage. Round 2's six auction card names/effects do not match the separate Round 3 card catalog; a verified mapping and server-side inventory loading are outstanding. |
| 4 | SQLite schema and authenticated routes/services cover expedition settings, routes, clues, qualification, progress and winner; server enforces a first-winner result. | Admin and player API surface exists. Audit docs advertise exactly seven teams/routes, while the requested tournament size is 30–40 teams; current Round 4 design is intentionally limited to seven qualified teams. |

## Reusable code

- Keep `server/index.ts`, Express route modules, auth middleware, password hashing/verification in `database/db.ts`, the SQLite schema and round-specific server services as the working baseline.
- Keep the existing round-specific client services and interfaces as API contracts/reference, but verify each action is server-backed before treating it as authoritative.
- Keep existing admin components, result/leaderboard views, team CRUD, round controls and auction panels. The admin UI can be wired to consolidated server endpoints in a later integration phase.
- Existing SSE event bus and round 4 winner broadcasts can be reused for live leaderboard/dashboard refresh.

## Security and deployment findings

- `.env.example` contains weak development bootstrap values and a default Round 2 admin key. Production must override them with secrets; code also falls back to these values when unset.
- Team login uses salted scrypt and timing-safe comparison; sessions are stored server-side and cookies are HttpOnly. There is no demonstrated rate limiting or account lockout. Round 2 bypasses those sessions and uses a shared static key for organizer actions.
- Team creation seeds plaintext `raw_password` in SQLite and default sample accounts. Avoid carrying that field or seed credentials into production; issue temporary credentials and retain only password hashes.
- CORS currently allows localhost origins only, so the Vercel production origin must be configured. Configure Render `DATABASE_URL`, `NODE_ENV`, `PORT`, session/admin secrets, allowed frontend origins, and HTTPS cookie behavior.
- Render instances have ephemeral local filesystems by default; SQLite persistence requires a mounted disk and one server instance. PostgreSQL is the intended shared durable store for production and multiple instances.

## PostgreSQL schema added in this phase

`database/postgres/migrations/001_foundation.sql` defines admins, teams, team/admin sessions, rounds, per-team round progress, score transactions, credit transactions, the Power Card catalog and per-team Power Card ownership, plus a ranked leaderboard view. Foreign keys cascade team deletion to sessions/progress/transactions/inventory. Constraints guard round numbers, nonnegative balances/scores, and player number. Progress keeps flexible round-specific state in JSONB while shared score/credit/card records remain relational.

`002_seed_catalog.sql` seeds the four rounds and the existing six Round 2 auction cards. `schema_migrations` records applied SQL files. `database/postgres/pool.ts` exposes a configurable `pg` pool; `npm run db:migrate` applies ordered migrations using `DATABASE_URL`.

This is a deployable schema and connection foundation, **not a completed application database cutover**. Current Express routes still use SQLite's synchronous API. In particular, Round 2 auction state/purchases are not yet written into PostgreSQL, so cross-round card persistence is not yet guaranteed by this phase.

## Remaining phases

1. Introduce repository interfaces and migrate auth/admin/Round 1–4 service reads and writes from SQLite to PostgreSQL without changing game rules; include a one-time import plan for existing SQLite records.
2. Replace Round 2's JSON snapshot with normalized auction, bid, credit-ledger and `team_power_cards` writes in atomic transactions; authenticate team actions; have Round 3 load the same team's inventory from the server and resolve the card catalog/effect mapping.
3. Consolidate leaderboard and admin dashboard APIs over PostgreSQL, including a deliberate Round 4 qualification policy for 30–40 entrants.
4. Harden production configuration (CORS allowlist, secrets, rate limits, session expiry/rotation, remove raw passwords/default seeds), then deploy API and migration release process to Render and point Vercel to it.

## Files added/changed by the PostgreSQL foundation

- Added `database/postgres/migrations/001_foundation.sql`
- Added `database/postgres/migrations/002_seed_catalog.sql`
- Added `database/postgres/migrate.ts`
- Added `database/postgres/pool.ts`
- Added `docs/BACKEND_FOUNDATION_AUDIT.md`
- Added `pg` and `@types/pg` dependencies; added `db:migrate` script; clarified PostgreSQL environment notes in `.env.example`.
