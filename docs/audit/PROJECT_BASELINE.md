# FROST CARTEL — ENGINEERING AUDIT & PROJECT BASELINE
**Document Version:** 1.0.0-PROD-BASELINE  
**Audit Date:** 2026-11-10T19:10:00+05:30  
**Repository:** `https://github.com/Ananya-124/The-Frost-Cartel.git`  
**Active Branch:** `main`  
**Baseline Commit:** `c4fff99 fix(round1): finalize Round 1 dashboard, repair Stage 1 borders, align progress text and routes`  
**Recovery Branch Created:** `backup/pre-master-cleanup-20261110`  
**Recovery Tag Created:** `v1.0.0-pre-cleanup`  

---

## 1. Executive Summary & Architecture Overview

Frost Cartel is an interactive Halloween-themed competitive gaming and escape-room platform built with React 19, TypeScript 7, Vite 8, Tailwind CSS, and an Express 5 + SQLite / PostgreSQL dual-persistence backend. The project is organized into four major rounds, an administrative portal, and a tournament squad management system.

### Technology Stack
- **Frontend Framework**: React 19.3.1, ReactDOM 19.3.1
- **Language**: TypeScript 7.0.2 (Strict type-checking via `tsc -b`)
- **Build Tooling**: Vite 8.3.5, Autoprefixer 10.6.2, PostCSS 8.5.32, TailwindCSS 3.4.19
- **Animation & Motion**: GSAP 3.15.1, @gsap/react 2.1.2, Theatre.js 0.7.2
- **Icons & Graphics**: Lucide React 1.66.0, Custom SVG geometry, Cinematic AI-generated assets
- **Backend Server**: Node.js (`--experimental-strip-types`), Express 5.3.0, CORS 2.8.6, Cookie-Parser 1.4.7
- **Database Architecture**: SQLite 3 (`database/frost_cartel.db` with WAL mode) + PostgreSQL adapter (`pg` 8.23.1 with versioned migrations)
- **Code Quality**: Oxlint 1.89.0 (0 errors, 23 warnings)
- **Automated Testing**: Vitest 5.1.0 with JSDOM (38 test suites, 210 tests — 100% passing)
- **Deployment**: GitHub Actions CI/CD deploying to GitHub Pages (`.github/workflows/deploy.yml`)

---

## 2. Round & Stage Functional Inventory

### Round 01 — The Graveyard Escape (Max 500 Credits)
- **Master Dashboard**: [`Round1Dashboard.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/game/Round1Dashboard.tsx)
  - Unified gothic reliquary cards for all 3 stages.
  - Live synchronized timer (22:00 default duration), audio controls, team credit counter (`{credits} / 500 CR`).
- **Stage 1 — The Pumpkin Shuffle (100 CR)**:
  - 3-trial shuffle minigame with animated pumpkin swapping, trial progression, reward settlement.
- **Stage 2 — The Haunted Image Hunt (150 CR)**:
  - Evidence desk gallery with 8 photographic scenes, 12 hidden cursed relics, zoom magnifier, hint engine.
- **Stage 3 — The Forgotten Graveyard (250 CR)**:
  - Coffin I: The Marked Remains (SVG coordinate hitboxes, clue inspection).
  - Coffin II: The Buried Diary (Scattered folio scraps, cipher mapping, audio-visual feedback).
  - Coffin III: The Final Testament (Concentric celestial runes 3-ring alignment puzzle).
  - Evidence Journal (0/3 to 3/3 clues) & Final Escape Gate with runic cipher validation.

### Round 02 — The Haunted Auction
- **Implementation**: [`Round2Auction.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/game/round2/Round2Auction.tsx)
- Real-time bidding engine with Server-Sent Events (SSE), market advantages, dynamic timer expiration, credit deduction, and team inventory synchronization.

### Round 03 — Paradox Lab
- **Implementation**: [`ParadoxHunt.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/game/round3/ParadoxHunt.tsx)
- Modular cooperative investigation containing 3 sequential hunts:
  - Hunt I: Power Failure (Observation timeline & tracker wiring).
  - Hunt II: Timeline Analysis (Four retained incident tasks, anomaly verification).
  - Hunt III: Signal Reconstruction & Final Containment.

### Round 04 — The Radiant Treasure Hunt
- **Implementation**: [`RoundFourIntro.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/game/round4/RoundFourIntro.tsx) & [`FloorInteriorView.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/game/round4/FloorInteriorView.tsx)
- Interactive 4-floor Campus Expedition map, 7 assigned routes (Routes I to VII), relic interactions, and clue verification.

### Administrative Portal
- **Implementation**: [`AdminPortal.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/admin/AdminPortal.tsx)
- Team credential provisioning, round timer controls, live event bus broadcasting, audit logs, and master tournament leaderboard.

---

## 3. Current Health & Validation Baseline

| Check | Tool / Runner | Result | Notes |
| :--- | :--- | :---: | :--- |
| **TypeScript Validation** | `tsc -b` | **PASS (0 errors)** | Full project compiles cleanly with strict types. |
| **Production Build** | `vite build` | **PASS** | Bundle emitted to `dist/` in 3.04s. |
| **Unit & Integration Tests** | `vitest run` | **PASS (210/210)** | All 38 test suites passing across frontend and backend. |
| **Linter** | `oxlint` | **0 errors, 23 warnings** | Warnings in `round3/runtime/hooks/useRound3RunTimer.ts` & `GameScreen.tsx`. |
| **Git Remote Sync** | `git fetch --all --prune` | **SYNCHRONIZED** | Local `main` matches `origin/main` (`c4fff99`). |
| **Deployment CI/CD** | `.github/workflows/deploy.yml` | **CONFIGURED** | Target: GitHub Pages (`https://ananya-124.github.io/The-Frost-Cartel/`). |

---

## 4. Verified Targets for Engineering Cleanup

1. **Vite Production Base Path**:
   - `vite.config.ts` currently omits `base: './'`. Setting relative base ensures assets load on GitHub Pages subpaths.
2. **Lint Warnings Resolution**:
   - `useRound3RunTimer.ts`: Pure performance timer refs and effect dependency arrays need clean encapsulation.
   - `update_grave2.py`: Sonar duplicate string literals in scripts.
3. **Repository Directory Organization**:
   - Round-wise separation: group stage-specific data, types, and components cleanly.
   - Clean up untracked temporary screenshot captures and artifacts from root.
   - Update `.gitignore` to prevent test capture pollution.
4. **Documentation**:
   - Create `docs/architecture/PROJECT_STRUCTURE.md` and update `README.md`.
