# 🎃 FROST CARTEL

> **A cinematic, horror-themed competitive multiplayer gaming platform engineered for high-stakes tournament events.**

[![FROST CARTEL CI](https://github.com/Ananya-124/The-Frost-Cartel/actions/workflows/ci.yml/badge.svg)](https://github.com/Ananya-124/The-Frost-Cartel)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-81%2F81%20Passing-brightgreen)](https://vitest.dev/)
[![Oxlint Clean](https://img.shields.io/badge/Oxlint-0%20Warnings-brightgreen)](https://oxc.rs/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture & Key Features](#-architecture--key-features)
- [Tournament Gameplay (Round 1)](#-tournament-gameplay-round-1)
- [Tournament Gameplay (Round 2)](#-tournament-gameplay-round-2)
- [Quick Start](#-quick-start)
- [Credentials Roster](#-credentials-roster)
- [Security Posture](#-security-posture)
- [Verification & Testing](#-verification--testing)
- [Project Documentation](#-project-documentation)

---

## 🏛 Overview

**FROST CARTEL** is a browser-based, synchronized tournament gaming platform designed for 2-player squad collaboration. Teams authenticate using organizer-issued ritual passkeys to enter the haunted grounds, investigate occult relics, decipher ancient crypt diaries, and conquer the graveyard before the authoritative event countdown runs dry.

The platform provides a strict separation of concerns between the **Public Player Experience** and the **Hardened Organizer Vault**.

---

## ⚡ Architecture & Key Features

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FROST CARTEL RUNTIME                          │
└─────────────────────────────────────────────────────────────────────────┘
                    ▲                                 ▲
                    │                                 │
     ┌──────────────┴──────────────┐   ┌──────────────┴──────────────┐
     │    PLAYER PORTAL  (/)       │   │   ADMIN VAULT  (/admin)     │
     │  - Gothic crypt gates       │   │  - Unlinked secret route    │
     │  - Squad authentication     │   │  - Team roster CRUD         │
     │  - Arched dashboard         │   │  - Real-time timer control  │
     │  - Stage 1, 2, 3 gameplay   │   │  - Standings & CSV export   │
     └──────────────┬──────────────┘   └──────────────┬──────────────┘
                    │                                 │
                    ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               AUTHORITATIVE BACKEND (Express 5 @ Port 3001)             │
│  - HttpOnly Cookie Sessions    - scrypt Password Hashing                │
│  - Authoritative 22-min Timer  - Atomic Transaction Scoring (500 CR)    │
│  - Real-time SSE Multiplexer   - Append-only Audit Trail                │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               DURABLE PERSISTENCE (Node 26 native SQLite)               │
│  - database/frost_cartel.db (WAL Mode, Foreign Key Cascades)            │
│  - Survives page reloads, browser restarts, and process crashes         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Dual-Portal System
- **Player Portal (`/`)**: Atmospheric landing with three runic circular crypt gates, dynamic audio ambiance, squad authentication, and cinematic team entrance.
- **Admin Control Vault (`/admin` / `#/admin`)**: Completely unlinked on the public home page. Hardened behind authentication with live metrics, team pause/resume, credential generation, and score realignments.

### 2. Permanent Authoritative Persistence
- Backed by Node.js native `node:sqlite` (`database/frost_cartel.db`) operating in high-performance **Write-Ahead Logging (WAL)** mode.
- Teams created by organizers persist across browser close, page refresh, and server restarts.
- Append-only transactional audit trail in `score_transactions`.

### 3. Real-Time Multiplayer Sync
- Built-in **Server-Sent Events (SSE)** endpoint (`/api/events/stream`) synchronizes credit balances and stage completions across teammates in real-time.

---

## 🎮 Tournament Gameplay (Round 1)

**Round 01: The Graveyard Escape** features 500 total available credits across three distinct challenges:

| Stage | Name | Credits | Status & Mechanics |
| :---: | :--- | :---: | :--- |
| **01** | **The Unknown Challenge** | `100 CR` | *Not Configured* (Reserved for custom organizer challenge) |
| **02** | **The Haunted Image Hunt** | `150 CR` | Scattered detective evidence desk with 8 photographs, zoomable inspection, 12 cursed relics, and -15 CR hint penalties. |
| **03** | **The Forgotten Graveyard** | `250 CR` | Atmospheric cemetery with three interactive open coffins (Grave I: Marked Remains, Grave II: Buried Diary, Grave III: Final Testament), runestone decoding, and a full-throttle horror jump scare upon final answer submission. |

---

## 🕸 Tournament Gameplay (Round 2)

**Round 02: The Haunted Auction** — squads spend the credits they earned in Round 1 to bid on **6 power cards** that are used in Round 3.

### How a squad plays
1. Open the **Round 02** portal on the home page (the screen shows *Waiting for the next card...* until the organizer starts one).
2. When a card goes live, place a bid. The first bid must meet the organizer's base price; every later bid must beat the current high bid by at least `10 CR`. Quick-bid buttons add `+10`, `+20` or `+50`.
3. The countdown turns yellow at 15 seconds and red at 5 seconds. A bid placed in the last 10 seconds resets the clock to 10 seconds (anti-sniping).
4. When bidding ends, the highest bidder wins the card and pays the winning bid. A squad cannot bid more than its credits or outbid itself. Cards nobody bid on are marked *unsold* and can be auctioned again.

### How the organizer runs it
Open `http://127.0.0.1:5173/#/admin` and choose the **Auction** tab:
- Enter the auction key once per browser session (default `frost-r2-admin`, set with `ROUND2_ADMIN_KEY` in `.env`).
- Choose **any** card, enter its **base price** (defaults to the card's own price) and the **bidding time** in seconds (`0` = no timer, end it manually), then press **START BIDDING**.
- Press **END BIDDING** to close the card early. Only one card is live at a time.
- The Teams table shows every squad's starting credits, spend, remaining credits and cards. **Remove** lets a squad rejoin with fresh credits (only if it has won nothing); **Reset Auction** clears everything.

### Connecting the rounds
| Direction | How it works |
| :--- | :--- |
| **Round 1 → Round 2** | Credits are read automatically from the browser's `localStorage` (`frost_cartel_round1_sessions`) when a squad opens Round 2. A squad's credits are **locked on its first join**, so squads should open Round 2 only after finishing Round 1. |
| **Round 2 → Round 3** | Cards won and credits left are mirrored to `localStorage` (`frost_cartel_round2_inventory`). Round 3 reads them with `round2Service.getInventory()`, which returns `{ teamName, remainingCredits, cards }`. |

### Technical notes
- Backend: `server/routes/round2.routes.ts` (mounted at `/api/round2`). Auction state lives in memory and is mirrored to one row in the `round2_state` SQLite table, so a server restart does not lose the auction.
- Frontend: `src/components/game/round2/Round2Auction.tsx` (squad screen), `src/components/admin/auction/AdminAuctionTab.tsx` (organizer tab), `src/services/round2Service.ts` (API + storage helpers).
- The squad screen polls `GET /api/round2/state` roughly every 0.8 seconds rather than using the SSE stream.
- To rename the 6 cards or change their descriptions and default prices, edit the `CARDS` list at the top of `server/routes/round2.routes.ts`. The minimum increment and anti-sniping window are in `CONFIG` just above it.

| Endpoint | Auth | Purpose |
| :--- | :--- | :--- |
| `GET /api/round2/state?team=NAME` | none | Cards, live auction and the squad's own balance |
| `POST /api/round2/join` | none | Register a squad with its Round 1 credits (locked on first call) |
| `POST /api/round2/bid` | none | Place a bid |
| `GET /api/round2/admin/overview` | `x-round2-key` | Full state including all squads |
| `POST /api/round2/admin/start` · `/end` · `/reset` | `x-round2-key` | Start a card (`cardId`, `basePrice`, `durationSeconds`), end it, reset everything |
| `DELETE /api/round2/admin/team/:name` | `x-round2-key` | Remove a squad that has won nothing |

---

## ⏳ Tournament Gameplay (Round 3)

**Round 03: Paradox Hunt** — a synchronized dual-timeline investigation engine where players navigate past and future facility states simultaneously to uncover temporal anomalies.

### Key Capabilities
- **Split-Screen Canvas Engine**: Dual rendered viewports (Past / Future) with responsive canvas rendering, lighting effects, and collision boundaries.
- **Cooperative Hunts**:
  - *Hunt 1 (Temporal Stabilization)*: Investigate 5 spatial sectors, disable security overrides, unlock containment chambers.
  - *Hunt 2 (The Anomaly Core)*: Multi-stage logic puzzles with penalty deductions and durable server state.
- **Card Tray Integration**: Seamlessly carries over power cards earned in Round 2 auction (Vampire Shield, Witch Hex, Ghost Pass, Zombie Revive, Pumpkin Bomb, Reaper Strike).
- **Backend Services**: `server/routes/round3.routes.ts`, `server/services/round3.service.ts`, `round3-hunt1.service.ts`, `round3-hunt2.service.ts`.

---

## 🏛 Tournament Gameplay (Round 4)

**Round 04: The Radiant Treasure Hunt (The Campus Expedition)** — an elite 7-team competitive cooperative treasure hunt set within the Ghibli-inspired B. S. Narayan Academic Block.

### Cinematic Arrival & Open-Window Entry
1. **Messenger's Letter**: A white dove swoops through the ancient stone balustrade and descends to hover directly above the stone pedestal, dropping a wax-sealed envelope before perching atop the column capital.
2. **Ancient Parchment**: Unsealing the letter reveals the dawn storyline and summons the expedition.
3. **Continuous Drone Camera Traversal**: Selecting any of the 8 floors triggers an upward drone camera flight directly through an already open window into the interior floor map without stopping.

### 7-Team Competitive Cooperative Architecture
- **Strict Route Isolation**: Exactly 7 qualified squads are assigned unique routes (`Route I` through `Route VII`).
- **5 Sequential Riddles per Route**: Each route features 4 route-specific intermediate clues followed by a 5th clue.
- **Common Final Room Convergence**: All 7 routes converge at the **Celestial Archives & Grand Observatory (Room 701, Floor 7)** for the 5th riddle.
- **First-Correct-Answer Wins (Atomic Race)**: The first qualified squad to reach the common final room and submit the correct final answer is atomically crowned Champion; subsequent attempts are locked out.
- **Admin Master Suite (`/#/admin` -> Round 04 Expedition)**:
  - *Live Monitoring*: Real-time progress table tracking squad locations, clue steps, target discoveries, and winner status.
  - *7-Team Qualification & Routes*: Organizer dropdown interface to qualify squads and assign routes.
  - *Visual Clue Editor (35 Steps)*: Interactive floor plan canvas with click-to-place golden target beacon, riddle texts, field hints, and comma-separated answer keys.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js `v22.0.0` or higher (`v26.5.0` recommended)
- npm `v10.0.0` or higher

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/Ananya-124/The-Frost-Cartel.git
cd "winter arc"

# Install dependencies
npm install

# Initialize environment variables
cp .env.example .env
```

### 3. Run Development Servers
In terminal 1 (Authoritative Backend on Port 3001):
```bash
npm run server
```

In terminal 2 (Vite Frontend on Port 5173):
```bash
npm run dev
```

Visit `http://127.0.0.1:5173` in your browser.

---

## 🔑 Credentials Roster

### Organizer Vault (`http://127.0.0.1:5173/#/admin`)
- **Username**: `admin123`
- **Temporary Password**: `admin@1`
- *Note: Hardened route. Password change required on first login.*

### Pre-Seeded Tournament Squads (`http://127.0.0.1:5173/`)
- `TEAM AI` / `SQUAD@AI9`
- `TEAM1` / `TEAM1@2026`
- `Shadow Syndicate` / `SHADOW#88`
- `Grave Walkers` / `GRAVE#44`
- `Cursed Alchemists` / `ALCHEMY!22`

*(New squads can be created at any time in the Admin Vault and will persist indefinitely.)*

---

## 🛡 Security Posture

- **Admin Unlinked**: Zero references, links, or buttons to `/admin` exist on the public homepage.
- **Scrypt Password Hashing**: Passwords stored using `node:crypto.scryptSync` with unique 16-byte random salts.
- **Timing-Safe Checks**: Equal-time verification with `crypto.timingSafeEqual` prevents timing side-channel attacks.
- **HttpOnly Cookies**: Admin and team session tokens stored in HttpOnly, SameSite=Lax cookies.
- **100% Parameterized SQL**: Zero string interpolation; immunity to SQL injection.
- **Atomic Scoring**: Database transactions enforce credit ceilings (maximum 500 CR).

---

## 🧪 Verification & Testing

```bash
# Run code quality AST linter (Oxlint)
npm run lint

# Run automated unit, integration, and durability test suites (Vitest)
npm test

# Build production bundle
npm run build
```

### Verification Matrix
- ✅ **Linter**: 0 warnings, 0 errors across 228 files (`oxlint`)
- ✅ **TypeScript**: 0 type errors (`tsc -b`)
- ✅ **Tests**: 81 / 81 tests passing across 18 test suites (100% green)
- ✅ **Build**: Minified production build completed cleanly in `dist/`
- ✅ **Responsiveness**: Certified at 1280x720, 1366x768, 1440x900, 1536x864, 1920x1080, and mobile viewports.

---

## 📚 Project Documentation

Detailed technical manuals are available in the [`docs/`](./docs) directory:
- [**Development & Operations Guide**](./docs/DEVELOPMENT_GUIDE.md): Setup, configuration, and workflows.
- [**Architecture & Project Structure**](./docs/PROJECT_STRUCTURE.md): Comprehensive module breakdown.
- [**Security Hardening & Threat Model**](./docs/SECURITY_GUIDE.md): Cryptography, sessions, and isolation.
- [**Final A to Z Release Audit Report**](./docs/FINAL_A_TO_Z_RELEASE_AUDIT.md): Inventory table and hardening evidence.

---

## ⚖ License

Proprietary — Built exclusively for the FROST CARTEL Tournament. All rights reserved.
