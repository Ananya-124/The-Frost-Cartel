# FROST CARTEL — ROUND 01: THE GRAVEYARD ESCAPE
## ARCHITECTURE & SYSTEM AUDIT: ROUND 1 DASHBOARD, PROGRESSION & STAGE COMPLETION

**Date:** November 10, 2026  
**System Architect:** Principal Frontend Architect, Senior Full-Stack Engineer, UI/UX Design Architect  
**Scope:** Round 01 Dashboard, Stage Progression Lifecycle, State Persistence & Visual Aesthetics  

---

## 1. Executive Architecture Map

### A. Routing & Dashboard Entry Point
- **Route Definitions:** `src/app/routes.ts`
  - URL hash: `#/round-1` or query param `?round=1`.
- **Top-Level Orchestrator:** `src/components/home/FrostCartelHomePage.tsx`
  - When `activeChamberRound === 1` and authenticated `session` is present, renders `<Round1Dashboard session={session} ... />`.
  - Also receives `onUpdateCredits(newCredits)` to synchronize earned credits across the squad session.

### B. Dashboard Parent Component
- **File:** `src/components/game/Round1Dashboard.tsx`
- **Responsibilities:**
  - Manages active team session state via `round1Service.getTeamSession(session.teamId, session.teamName)`.
  - Manages countdown timer with auto-renewal when entering active stages or expired states.
  - Listens to cross-tab storage synchronization events (`frost_cartel_round1_status`, `frost_cartel_round1_duration`, `frost_cartel_round1_sessions`).
  - Renders child stage components (`Stage1PumpkinShuffle`, `Stage2HauntedImageHunt`, `Stage3ForgottenGraveyard`) or the main 3-portal dashboard view.
  - Renders background atmosphere (`HauntedGraveyardAtmosphere`), top HUD (`GothicRound1HUD`), and the 3 stage cards (`HauntedPortalCard`).

---

## 2. Component Hierarchy & Stage Connections

```
FrostCartelHomePage
  └── Round1Dashboard
        ├── HauntedGraveyardAtmosphere (Background layers, moon, cathedral, candles, fog)
        ├── GothicRound1HUD (Top bar: Squad emblem, teamName, AUTHENTICATED, timer, credits, mute, exit)
        ├── Main Heading ("ROUND 01" / "THE GRAVEYARD ESCAPE" / Skull divider)
        └── Stage Cards Row (3-column flex / grid)
              ├── HauntedPortalCard [Stage 1: The Pumpkin Shuffle] (Amber/Orange)
              ├── HauntedPortalCard [Stage 2: The Haunted Image Hunt] (Purple)
              └── HauntedPortalCard [Stage 3: The Forgotten Graveyard] (Emerald/Teal)
```

### Stage Implementations:
1. **Stage 1: THE PUMPKIN SHUFFLE**
   - **Component:** `src/components/game/stage1/Stage1PumpkinShuffle.tsx`
   - **Config:** `round1Service.getStage1Config()`
   - **Structure:** 2 sequential trials (Trial I: 5 pumpkins, 40 Credits, 2 tries; Trial II: 7 pumpkins, 60 Credits, 2 tries). Total = 100 CR.
   - **Service Integration:** `round1Service.resolveStage1Trial(teamId, trialIndex, won)`. When both trials complete, `session.stages['stage-1'].status` becomes `'completed'`.
2. **Stage 2: THE HAUNTED IMAGE HUNT**
   - **Component:** `src/components/game/stage2/Stage2HauntedImageHunt.tsx`
   - **Config:** `round1Service.getStage2Config()`
   - **Structure:** Hidden object inspection across antique photographs. 12 canonical targets to locate. Reward = 150 CR.
   - **Service Integration:** `round1Service.completeStage(teamId, 'stage-2')`.
3. **Stage 3: THE FORGOTTEN GRAVEYARD**
   - **Component:** `src/components/game/stage3/Stage3ForgottenGraveyard.tsx`
   - **Config:** `round1Service.getStage3Config()`
   - **Structure:** 3 graves (Coffin 1: The Marked Remains; Coffin 2: The Buried Diary; Coffin 3: The Final Testament) + Final Escape Gate cipher. Reward = 250 CR.
   - **Service Integration:** `round1Service.completeStage(teamId, 'stage-3')`.

---

## 3. Progression, State Persistence & Scoring Systems

### A. Persistent State Stores (`round1Service.ts`)
- Storage Keys:
  - `frost_cartel_round1_sessions`: Serialized JSON map of all team sessions (`Round1TeamSessionState`).
  - `frost_cartel_round1_status`: Lifecycle status (`running` | `paused` | `completed`).
  - `frost_cartel_round1_duration`: Configurable round duration in minutes (20–25, default 22).
- Dual Storage Strategy: `window.localStorage` and `window.sessionStorage` fallback with automatic cross-tab synchronization.

### B. Credit Rewards Configuration
- Total Possible Round 1 Credits: **500 CR**
  - Stage 1: `100 CR` (`STAGE_CREDITS['stage-1']`)
  - Stage 2: `150 CR` (`STAGE_CREDITS['stage-2']`)
  - Stage 3: `250 CR` (`STAGE_CREDITS['stage-3']`)
- Team Balance Tracking:
  - `teamSession.credits`: Current earned credits in Round 1 (0 to 500 CR).
  - HUD Display: Shows `{credits} / 500 CR`, cleanly distinguishing current earned credits from the 500 maximum possible yield.
  - On stage completion, `completeStage()` adds the stage's fixed reward, records an idempotent `ScoreTransaction`, and fires `onScoreSync`.

---

## 4. Confirmed Issues & Defect Analysis

### Defect 1: Stage 1 Completed Badge Black Rectangular Box
- **Root Cause:** In `public/assets/halloween/portals/relic_full_stage1.png` and `relic_full_stage1_completed.png`, a literal opaque black box (`RGB [0,0,0,255]`) was pasted over the bottom area `[y: 650-740, x: 80-420]`. This artificial rectangle chops off the ornate carved border of the gothic frame and replaces the natural stone background with an ugly hard-edged box.
- **Remediation:** Re-composite the Stage 1 portal assets using `relic_frame_stage1.png` and `portal_stage1_pumpkin_shuffle.jpg`. The title `THE PUMPKIN SHUFFLE` and the button (`100 CR` and `COMPLETED ✓`) must sit seamlessly on the natural stone texture with an authentic glowing pill border, exactly matching Stage 2 and Stage 3.

### Defect 2: Stage 3 Helper Progress Text Collision
- **Root Cause:** In `HauntedPortalCard.tsx` (line 122), `progressText` is positioned at `absolute bottom-[4%] left-1/2 -translate-x-1/2`. When Stage 3 unearths all 3 coffins (`3 / 3 UNEARTHED`), the text floats directly underneath the CTA button and overlaps the bottom skull finial and background pumpkins.
- **Remediation:** Standardize the progress text presentation so it does not collide with the ornamental card base, or integrate it cleanly above/within the badge area.

### Defect 3: Stage Card Alignment & Proportions
- **Root Cause:** The three stage cards must maintain strict horizontal and vertical alignment across viewports, with matching CTA baseline heights and identical card dimensions.
- **Remediation:** Enforce consistent card proportions, flex/grid alignment, and matching button heights on all three cards.

### Defect 4: Header & Typography Refinement
- **Root Cause:** Ensure team name, authentication tag, timer, credit counter (`{credits} / 500 CR`), audio mute toggle, and exit button are vertically aligned with consistent heights and no clipping on any viewport.
- **Remediation:** Fine-tune `GothicRound1HUD.tsx` layout classes and typography.

---

## 5. Next Steps Plan
1. Re-composite `relic_full_stage1.png` and `relic_full_stage1_completed.png` using PIL to eliminate the black rectangular box and restore the full ornate gothic border.
2. Refine `HauntedPortalCard.tsx` and `Round1Dashboard.tsx` for layout consistency, card alignment, and progress text placement.
3. Validate HUD alignment, credit display, timer, and stage completion tracking.
4. Run browser verification and capture high-resolution screenshots.
5. Run full test suite (`oxlint`, `vitest`, `build`).

