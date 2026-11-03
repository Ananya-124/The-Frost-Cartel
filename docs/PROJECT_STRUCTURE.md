# FROST CARTEL — Project Architecture & Directory Structure

## Architectural Overview

**FROST CARTEL** is an AAA Halloween-themed, competitive multiplayer web gaming platform engineered with **React 19**, **TypeScript**, **Tailwind CSS**, and an **Authoritative Express / Node.js backend** backed by **SQLite** (WAL mode) with optional **PostgreSQL** compatibility.

The platform provides a dual-portal architecture:
1. **Player Portal (`/`)**: Squad authentication, gothic graveyard portals, Stage 1 (The Unknown Challenge - 100 CR unconfigured), Stage 2 (The Haunted Image Hunt - 150 CR), and Stage 3 (The Forgotten Graveyard - 250 CR) with interactive coffin investigations, bone assembly, rune deciphering, and horror jump scares.
2. **Admin Portal (`/admin`)**: Hardened organizer control vault inaccessible from the public homepage, with team management, credentials issuance, real-time timer controls, stage movements, audit logging, and CSV exports.

---

## Directory Tree

```
winter arc/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions automated CI (Lint, Test, Build)
├── .editorconfig                  # Code formatting standard across IDEs
├── .gitattributes                 # Cross-platform line endings (LF/CRLF normalization)
├── .gitignore                     # Git exclusion rules (build, secrets, SQLite DB, logs)
├── .oxlintrc.json                 # Oxlint high-performance AST linter configuration
├── index.html                     # HTML5 entry with Cinzel & MedievalSharp typography
├── package.json                   # Dependencies, scripts, and project metadata
├── postcss.config.js              # PostCSS plugins for Tailwind
├── tailwind.config.js             # Gothic cartel theme colors, animations, and typography
├── tsconfig.json                  # Root TypeScript configuration
├── tsconfig.app.json              # Client application compiler options
├── tsconfig.node.json             # Tooling and configuration compiler options
├── vite.config.ts                 # Vite bundler, proxy configuration, and Vitest setup
│
├── database/                      # Authoritative Database Layer
│   ├── schema.sql                 # DDL schema (admins, teams, stages, transactions, sessions)
│   ├── db.ts                      # SQLite DatabaseSync connection, scrypt hashing, seeds
│   └── frost_cartel.db            # Persistent SQLite database (WAL mode, ignored in git)
│
├── server/                        # Authoritative Express 5 API Server
│   ├── index.ts                   # Express application entry, CORS, and cookie parsing
│   ├── middleware/
│   │   └── auth.ts                # requireAdminAuth & requireTeamAuth middlewares
│   ├── routes/
│   │   ├── admin.routes.ts        # Admin login, teams CRUD, round controls, results
│   │   ├── auth.routes.ts         # Team login, session validation, logout
│   │   ├── events.routes.ts       # Server-Sent Events (SSE) real-time event streaming
│   │   └── round1.routes.ts       # Authoritative timer, transactional score allocation
│   ├── services/
│   │   └── eventBus.ts            # Pub/Sub event bus for live multiplayer sync
│   └── __tests__/
│       ├── database_and_api.test.ts # API integration tests (health, auth, scoring, admin)
│       └── persistence_restart.test.ts # Database restart & durability verification
│
├── public/                        # Static Assets (Images, Audio, Textures)
│   └── assets/                    # High-fidelity Halloween artwork & audio
│
├── docs/                          # Comprehensive Technical Documentation
│   ├── DEVELOPMENT_GUIDE.md       # Quickstart, local workflows, testing, and deployment
│   ├── FINAL_A_TO_Z_RELEASE_AUDIT.md # Full file inventory and hardening verification
│   ├── PROJECT_STRUCTURE.md       # Architectural breakdown (this file)
│   └── SECURITY_GUIDE.md          # Security posture, hashing, access control, and isolation
│
└── src/                           # Client React Application (React 19)
    ├── App.tsx                    # Root component managing route switching (/ vs /admin)
    ├── main.tsx                   # React 19 DOM root mounting
    ├── components/
    │   ├── admin/                 # Admin Portal components
    │   │   ├── AdminHeader.tsx    # Header with status pills and public home navigation
    │   │   ├── AdminPortal.tsx    # Central Admin container and tab navigation
    │   │   ├── CreateTeamModal.tsx # Manual team creation dialog with uniqueness check
    │   │   ├── DashboardTab.tsx   # Real-time metrics, active sessions, and event logs
    │   │   ├── ResultsTab.tsx     # Standings, score breakdowns, and CSV export
    │   │   ├── RoundControlTab.tsx # Global Round 1 start/pause/resume/end controls
    │   │   └── TeamsTab.tsx       # Paginated team management, pause, and credential reset
    │   ├── game/                  # Gameplay screens
    │   │   ├── Round1StageSelect.tsx # Round 1 hub: 3 stage portals (100, 150, 250 CR)
    │   │   ├── stage2/            # Stage 2: The Haunted Image Hunt (150 CR)
    │   │   │   ├── EvidenceBoard.tsx # Scattered detective desk with 8 photographs
    │   │   │   ├── PhotoInspectModal.tsx # Zoomable high-res evidence viewer with relic search
    │   │   │   └── Stage2GameContainer.tsx # Stage 2 state, timer, hint deduction, and victory
    │   │   └── stage3/            # Stage 3: The Forgotten Graveyard (250 CR)
    │   │       ├── EvidenceJournalModal.tsx # Clue journal collecting notes across graves
    │   │       ├── FinalGateModal.tsx # Final answer submission modal
    │   │       ├── Grave1MarkedRemains.tsx # Grave 1: Skeleton bone drawer and relic assembly
    │   │       ├── Grave2BuriedDiary.tsx # Grave 2: Buried diary page deciphering
    │   │       ├── Grave3FinalTestament.tsx # Grave 3: Runestone puzzle and final testament
    │   │       ├── GraveyardEnvironmentView.tsx # Atmospheric cemetery scene with 3 coffins
    │   │       ├── HorrorJumpscareModal.tsx # Terrifying interactive jump scare on completion
    │   │       └── Stage3GameContainer.tsx # Stage 3 orchestrator, fragment unlocks, and victory
    │   ├── layout/
    │   │   ├── CornerQuickNav.tsx # Leaderboard modal trigger (Admin link strictly unlinked)
    │   │   └── FrostCartelHeader.tsx # Gothic cartel header with team badge, timer, and credits
    │   ├── leaderboard/
    │   │   └── LeaderboardModal.tsx # Tournament standings dialog with search and ranks
    │   ├── player/
    │   │   ├── FrostCartelHomePage.tsx # Public homepage: 3 round crypt gates and team login
    │   │   └── TeamDashboardView.tsx # Gothic arch team portal dialog with "Enter Graveyard"
    │   └── __tests__/             # Frontend component test suites
    │       ├── AdminPortal.test.tsx # Admin portal rendering, creation, and tab tests
    │       ├── FrostCartelHomePage.test.tsx # Home page branding, login, and security tests
    │       ├── Stage2HauntedImageHunt.test.tsx # Stage 2 inspection and completion tests
    │       └── Stage3ForgottenGraveyard.test.tsx # Stage 3 coffin navigation and assembly tests
    ├── constants/
    │   ├── credits.constants.ts   # Credit allocation constants (Stage 1: 100, Stage 2: 150, Stage 3: 250)
    │   └── rounds.constants.ts    # Round metadata, descriptions, and rules
    ├── hooks/
    │   └── useNativeDialog.ts     # HTML5 `<dialog>` keyboard & focus trapping hook
    ├── services/
    │   ├── adminService.ts        # Admin repository with persistent localStorage & API sync
    │   ├── authService.ts         # Team authentication boundary and session management
    │   ├── round1Service.ts       # Round 1 state, timer countdown, and scoring
    │   └── __tests__/
    │       └── round1Service.test.ts # Round 1 service scoring and transition tests
    ├── styles/
    │   └── index.css              # Custom keyframe animations, glow filters, scrollbars
    ├── types/
    │   ├── admin.types.ts         # Admin TypeScript interfaces and data models
    │   ├── auth.types.ts          # Team authentication request and response types
    │   ├── round.types.ts         # Round and stage definitions
    │   ├── round1.types.ts        # Stage 2 & 3 relics, evidence, and coffin types
    │   └── team.types.ts          # Squad data models and credit ledgers
    └── utils/
        ├── date.utils.ts          # ISO timestamp and duration formatters
        ├── soundController.ts     # Web Audio synthetic Gothic sound effects engine
        └── validation.utils.ts    # Input sanitation and password strength checks
```
