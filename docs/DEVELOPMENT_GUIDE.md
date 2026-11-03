# FROST CARTEL — Development & Operations Guide

## 1. System Requirements

- **Node.js**: `v22.0.0` or higher (Tested and certified on `v26.5.0` with native `node:sqlite` and type stripping)
- **Package Manager**: `npm` `v10.0.0` or higher
- **Modern Browser**: Chrome 120+, Edge 120+, Firefox 120+, or Safari 17+ (Supports ES2023, CSS nesting, and Web Audio API)

---

## 2. Quickstart Installation

```bash
# 1. Clone repository
git clone https://github.com/Ananya-124/The-Frost-Cartel.git
cd "winter arc"

# 2. Install dependencies
npm install

# 3. Initialize environment variables
cp .env.example .env
```

---

## 3. Running the Platform

FROST CARTEL consists of an **Authoritative Express / SQLite Backend** and a **React 19 / Vite Frontend**.

### Starting the Authoritative Backend (Port 3001)

```bash
npm run server
```
- Listens on `http://127.0.0.1:3001`
- Automatically provisions `database/frost_cartel.db` with WAL mode
- Seeds default admin `admin123` (`must_change_password=1`)
- Seeds tournament squads: `TEAM AI`, `TEAM1`, `Shadow Syndicate`, `Grave Walkers`, `Cursed Alchemists`

### Starting the React 19 Frontend (Port 5173)

```bash
npm run dev
```
- Listens on `http://127.0.0.1:5173`
- Proxies all `/api/*` network requests automatically to `http://127.0.0.1:3001`

---

## 4. Default Seed Credentials

### Player Portal (`http://127.0.0.1:5173/`)
| Squad Name | Ritual Password | Assigned Role |
| :--- | :--- | :--- |
| `TEAM AI` | `SQUAD@AI9` | Player 1 / Player 2 |
| `TEAM1` | `TEAM1@2026` | Player 1 / Player 2 |
| `Shadow Syndicate` | `SHADOW#88` | Player 1 / Player 2 |
| `Grave Walkers` | `GRAVE#44` | Player 1 / Player 2 |
| `Cursed Alchemists` | `ALCHEMY!22` | Player 1 / Player 2 |

### Hardened Admin Vault (`http://127.0.0.1:5173/#/admin` or `http://127.0.0.1:5173/admin`)
| Username | Temporary Password | Note |
| :--- | :--- | :--- |
| `admin123` | `admin@1` | Hardened route. Password change required on first login. |

> **Security Note**: The public homepage contains strictly NO link or button to the Admin Portal. Access is restricted to direct navigation to `#/admin`.

---

## 5. Verification & Testing

### Running Code Quality Linter (Oxlint)

```bash
npm run lint
```
- Scans all 93+ TypeScript and React files with 116 AST rules
- Must exit with `Found 0 warnings and 0 errors`

### Running Automated Test Suites (Vitest)

```bash
npm test
```
Executes all 43 unit, integration, and persistence tests across 7 test suites:
- `src/services/__tests__/round1Service.test.ts`
- `src/components/__tests__/FrostCartelHomePage.test.tsx`
- `src/components/__tests__/AdminPortal.test.tsx`
- `src/components/__tests__/Stage2HauntedImageHunt.test.tsx`
- `src/components/__tests__/Stage3ForgottenGraveyard.test.tsx`
- `server/__tests__/database_and_api.test.ts`
- `server/__tests__/persistence_restart.test.ts`

### Compiling Production Build

```bash
npm run build
```
Runs `tsc -b && vite build` and generates minified, tree-shaken static assets in `dist/`.

---

## 6. Authoritative Database & Durability

The database layer is located in `database/`:
- `database/schema.sql`: Full relational DDL schema
- `database/db.ts`: SQLite `DatabaseSync` engine with write-ahead logging (WAL)
- `database/frost_cartel.db`: Local SQLite database file (ignored in `.gitignore`)

### Durability Guarantees:
1. **Admin Team Creation**: Teams created via the Admin Portal immediately persist to `database/frost_cartel.db` and browser `localStorage`.
2. **Crash & Restart Survival**: If the backend process crashes or is restarted, all teams, passwords, credit balances, stage completion records, and audit logs remain 100% intact.
3. **Multiplayer SSE Sync**: Server-Sent Events stream `/api/events/stream` pushes stage unlocks and score changes to both players on a team in real-time.
