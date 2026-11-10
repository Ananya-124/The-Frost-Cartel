# FROST CARTEL — ARCHITECTURE & PROJECT STRUCTURE
**Document Version:** 1.0.0-PROD  
**Last Updated:** 2026-11-10T19:22:00+05:30  

---

## 1. Directory Tree & Architectural Organization

```text
FROST-CARTEL/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated CI: lint (oxlint), tsc -b, vitest, build
│       └── deploy.yml             # Live continuous deployment to GitHub Pages
│
├── database/
│   ├── frost_cartel.db            # Local SQLite database (WAL mode, uncommitted)
│   ├── schema.sql                 # Authoritative DDL schema (SQLite & PostgreSQL)
│   ├── db.ts                      # Universal dual-adapter database connector
│   └── postgres/
│       ├── config.ts              # PostgreSQL / Supabase connection configuration
│       ├── pool.ts                # Thread-safe pg Pool manager
│       ├── migrate.ts             # Migration runner script (`npm run db:migrate`)
│       ├── migration-runner.ts    # Versioned migration engine
│       ├── postgres.test.ts       # Automated PostgreSQL integration tests
│       └── migrations/
│           ├── 001_foundation.sql # Tables: admins, teams, stages, transactions
│           └── 002_seed_catalog.sql # Seed cards, initial tournament teams
│
├── docs/
│   ├── architecture/
│   │   └── PROJECT_STRUCTURE.md   # Architectural reference (this document)
│   ├── audit/
│   │   ├── PROJECT_BASELINE.md    # Baseline snapshot before master cleanup
│   │   └── FINAL_REPOSITORY_AUDIT.md # File-by-file audit & verification ledger
│   └── reports/
│       └── FROST_CARTEL_PRODUCTION_READINESS_REPORT.md # Final production readiness report
│
├── public/
│   ├── favicon.svg                # Application favicon
│   └── assets/                    # Static runtime assets
│       ├── cartel_skull_crossbones.png
│       ├── cartel_skull_crossbones_gold.png
│       ├── round1_graveyard.jpg
│       ├── halloween/portals/     # Round 1 reliquary portal cards (500x857)
│       │   ├── relic_full_stage1.png
│       │   ├── relic_full_stage1_completed.png
│       │   ├── relic_full_stage2.png
│       │   ├── relic_full_stage2_completed.png
│       │   ├── relic_full_stage3.png
│       │   └── relic_full_stage3_completed.png
│       ├── stage1/                # Pumpkin shuffle references & models
│       ├── stage-02/              # Haunted Image Hunt desk & target cutouts
│       ├── stage-3/               # Forgotten Graveyard coffins & atmosphere
│       ├── round2/                # Haunted Auction character and auction cards
│       ├── round3/                # Paradox Lab environments, effects, entities
│       └── round-4/               # Campus Expedition floor map and route tiles
│
├── server/
│   ├── index.ts                   # Express 5 HTTP server & API root (Port 3001)
│   ├── middleware/
│   │   └── auth.ts                # Session cookie & bearer token validation
│   ├── routes/
│   │   ├── admin.routes.ts        # Admin roster, credentials, score adjustments
│   │   ├── auth.routes.ts         # Team login, logout, profile checks
│   │   ├── events.routes.ts       # Server-Sent Events (SSE) live broadcast
│   │   ├── round1.routes.ts       # Round 1 authoritative progress & timer
│   │   ├── round2.routes.ts       # Round 2 live auction & bidding engine
│   │   ├── round3.routes.ts       # Round 3 Paradox Lab session & hunt state
│   │   └── round4.routes.ts       # Round 4 Campus map & clue validation
│   ├── services/
│   │   ├── eventBus.ts            # PubSub event bus for live client updates
│   │   ├── round3.service.ts      # Shared round 3 orchestration
│   │   ├── round3-hunt1.service.ts# Hunt I: Power Failure timeline & wiring
│   │   ├── round3-hunt2.service.ts# Hunt II: Timeline Analysis incident tasks
│   │   └── round3-hunt3.service.ts# Hunt III: Signal reconstruction containment
│   └── __tests__/                 # Server integration & persistence tests
│
├── src/
│   ├── app/
│   │   ├── App.tsx                # Master root view switcher (Admin / Public)
│   │   ├── app.types.ts           # AppView types
│   │   └── routes.ts              # Hash & query route parsing
│   │
│   ├── components/
│   │   ├── admin/                 # Tournament Administrator Portal
│   │   │   └── AdminPortal.tsx
│   │   ├── home/                  # Landing & Round Selection Dashboard
│   │   │   ├── FrostCartelHomePage.tsx
│   │   │   ├── HauntedHero.tsx
│   │   │   ├── HauntedAtmosphere.tsx
│   │   │   ├── RoundPortalSection.tsx
│   │   │   ├── RoundPortalCard.tsx
│   │   │   └── EventInfoBadges.tsx
│   │   ├── layout/                # Global layout headers & docks
│   │   │   ├── CornerQuickNav.tsx
│   │   │   └── MinimalHeader.tsx
│   │   ├── leaderboard/           # Tournament rankings modal
│   │   │   └── GothicLeaderboardModal.tsx
│   │   ├── player/                # Squad authentication & dashboard
│   │   │   ├── TeamLoginPanel.tsx
│   │   │   └── TeamDashboardView.tsx
│   │   │
│   │   └── game/                  # Game Chamber Implementations
│   │       ├── Round1Dashboard.tsx # Round 1 Master Coordinator
│   │       ├── haunted/           # Round 1 gothic HUD, reliquaries, ambiance
│   │       │   ├── GothicRound1HUD.tsx
│   │       │   ├── HauntedGraveyardAtmosphere.tsx
│   │       │   ├── HauntedPortalCard.tsx
│   │       │   ├── FloatingGhost.tsx
│   │       │   ├── FlyingBat.tsx
│   │       │   └── CandleFlame.tsx
│   │       ├── stage1/            # Stage 1: The Pumpkin Shuffle
│   │       │   ├── Stage1PumpkinShuffle.tsx
│   │       │   ├── Stage1Framework.tsx
│   │       │   └── pumpkinShuffle.test.ts
│   │       ├── stage2/            # Stage 2: The Haunted Image Hunt
│   │       │   ├── Stage2HauntedImageHunt.tsx
│   │       │   ├── Stage2EvidenceDesk.tsx
│   │       │   ├── Stage2ZoomModal.tsx
│   │       │   └── Stage2VictoryModal.tsx
│   │       ├── stage3/            # Stage 3: The Forgotten Graveyard
│   │       │   ├── Stage3ForgottenGraveyard.tsx
│   │       │   ├── GraveyardEnvironmentView.tsx
│   │       │   ├── GothicCoffinCard.tsx
│   │       │   ├── Grave1MarkedRemains.tsx
│   │       │   ├── Grave2BuriedDiary.tsx
│   │       │   ├── Grave3FinalTestament.tsx
│   │       │   ├── EvidenceJournalModal.tsx
│   │       │   └── FinalGateModal.tsx
│   │       ├── round2/            # Round 2: The Haunted Auction
│   │       │   ├── Round2Auction.tsx
│   │       │   ├── AuctionCardGrid.tsx
│   │       │   ├── BiddingControls.tsx
│   │       │   └── AuctionHUD.tsx
│   │       ├── round3/            # Round 3: Paradox Lab
│   │       │   ├── ParadoxHunt.tsx
│   │       │   └── runtime/       # Interactive engine, rendering, hunts 1-3
│   │       └── round4/            # Round 4: The Radiant Treasure Hunt
│   │           ├── RoundFourIntro.tsx
│   │           ├── FloorInteriorView.tsx
│   │           └── CollegeBuildingView.tsx
│   │
│   ├── services/                  # Frontend services & API connectors
│   │   ├── authService.ts         # Session storage & squad authentication
│   │   ├── round1Service.ts       # Round 1 state persistence & stage rewards
│   │   ├── round2Service.ts       # Round 2 auction API connector
│   │   ├── round3Service.ts       # Round 3 session & hunt API connector
│   │   └── round4Service.ts       # Round 4 floor navigation connector
│   │
│   ├── types/                     # TypeScript definitions
│   │   ├── team.types.ts
│   │   ├── round.types.ts
│   │   ├── round1.types.ts
│   │   ├── round2.types.ts
│   │   ├── round3.types.ts
│   │   └── round4.types.ts
│   │
│   ├── utils/                     # Audio & helper utilities
│   │   └── soundController.ts
│   │
│   └── test/                      # Test setups & matchers
│       └── setup.ts
│
├── scripts/                       # Asset builders & browser verification suites
├── .env.example                   # Authoritative environment template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript compiler options
├── tailwind.config.js             # Gothic color palette & typography
├── vite.config.ts                 # Vite bundle config (relative base: './')
└── README.md                      # Primary project documentation
```

---

## 2. Round-Wise Isolation & Separation of Concerns

Each round is isolated into its own component tree, route, service, and type definition:

1. **Round 01 — The Graveyard Escape**:
   - Component Tree: `src/components/game/haunted/`, `stage1/`, `stage2/`, `stage3/`
   - State & Rules: `src/services/round1Service.ts`, `src/types/round1.types.ts`
   - Yield: 100 CR (Stage 1) + 150 CR (Stage 2) + 250 CR (Stage 3) = **500 CR Maximum**.

2. **Round 02 — The Haunted Auction**:
   - Component Tree: `src/components/game/round2/`
   - State & Rules: `server/routes/round2.routes.ts`, `src/types/round2.types.ts`
   - Mechanism: Real-time bidding on 6 power cards using credits earned in Round 1.

3. **Round 03 — Paradox Lab**:
   - Component Tree: `src/components/game/round3/`
   - State & Rules: `server/services/round3*.service.ts`, `src/types/round3.types.ts`
   - Mechanism: Cooperative timeline investigation across Hunts I, II, and III.

4. **Round 04 — The Radiant Treasure Hunt**:
   - Component Tree: `src/components/game/round4/`
   - State & Rules: `server/routes/round4.routes.ts`, `src/types/round4.types.ts`
   - Mechanism: 4-floor Campus Expedition map with 7 assigned squad routes.
