# FROST CARTEL — STAGE 03: THE FORGOTTEN GRAVEYARD
## COMPLETE THREE-COFFIN UI REDESIGN REPORT

### Executive Summary

In accordance with the master reference designs and user specifications, **Stage 03: The Forgotten Graveyard** has undergone a complete visual and architectural redesign. The previous clunky dashboard-like panels, flat dotted backgrounds, oversized empty containers, cyan bounding boxes, and overlapping text banners have been completely replaced with **three dedicated, full-screen, atmospheric coffin investigation environments**:

1. **Grave I: The Marked Remains** (`/assets/stage-3/coffins/grave1_marked_remains.jpg`)
2. **Grave II: The Buried Diary** (`/assets/stage-3/coffins/grave2_buried_diary.jpg`)
3. **Grave III: The Final Testament** (`/assets/stage-3/coffins/grave3_final_testament.jpg`)

All 31 existing Vitest tests pass with 100% success rate, the TypeScript type-check compiles with 0 errors (`npx tsc --noEmit` and `npx tsc -p tsconfig.test.json`), Oxlint passes with 0 warnings, and the production build succeeds without issues.

---

### Architecture & Key Components

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Grave I View** | `src/components/game/stage3/Grave1MarkedRemains.tsx` | Full-screen close-up investigation of Grave I. Interactive skull I, ribcage, grimoire, letter, scroll, key. Draggable items reveal under-layer secret letters (`"T"`, `"H"`, `"E"`). Preserves the Consecration Altars drawer (`Apex Altar`, `Center Sepulcher`, `Base Pedestal`) for skeleton assembly. |
| **Grave II View** | `src/components/game/stage3/Grave2BuriedDiary.tsx` | Full-screen close-up investigation of Grave II. Open ancient leather diary on skeleton's chest with 3-page flip reader (1891, 1904, 1927), skull II, pocket compass, potion, letter, scroll, key, and interactive 3-digit iron coffer tumbler combination lock (`1-4-7`) unlocking fragment `"NIGHT"`. |
| **Grave III View** | `src/components/game/stage3/Grave3FinalTestament.tsx` | Full-screen close-up investigation of Grave III. Glowing Azure Soul Crystal with cyan aura, skull III in cinnabar red, potion, open celestial testament manuscript, solar grimoire, and interactive Concentric Celestial Rune Wheel mechanism (`MOON → RAVEN → FLAME`) unlocking fragment `"RETURNS"`. |
| **Object Detail Modal** | `src/components/game/stage3/ObjectDetailModal.tsx` | Antique leather-bound reader for grimoires and diaries with page flipping (`← Previous Page`, `Next Page →`), wax-sealed letters, and 360-degree interactive rotation inspector for skulls, crystals, and relics. |
| **Coffin Header HUD** | `src/components/game/stage3/CoffinHeaderHUD.tsx` | Sleek top HUD matching the master visual artwork. Overlays live interactive timer, 250 CR reward badge, mute toggle, and exit button directly on the scene's top-right control area with zero duplicate text banners. |
| **Stage 3 Orchestrator** | `src/components/game/stage3/Stage3ForgottenGraveyard.tsx` | Manages view state (`overview`, `coffin1`, `coffin2`, `coffin3`), synchronized countdown timer, fragment collection (`THE`, `NIGHT`, `RETURNS`), Evidence Journal modal, Arch-Lich Gate modal, and skip functionality. |

---

### Visual & Interactive Features

1. **Seamless Photorealistic Canvas**:
   - The master background images (`grave1_marked_remains.jpg`, `grave2_buried_diary.jpg`, `grave3_final_testament.jpg`) are displayed at full resolution with atmospheric vignette and spectral moonlight.
   - Interactive hotspots are positioned over the photorealistic painted items with subtle organic golden/cyan hover glows (`cursor-grab`).
   - Dragging an item lifts an ethereal projection of the relic, revealing the ancient under-layer carvings on the coffin floor:
     - Grave I: reveals `"T"`, `"H"`, `"E"`
     - Grave II: reveals stamped chronological cipher `"1 — 4 — 7"`
     - Grave III: reveals celestial rune cipher `"R — E — T — U — R — N — S"`
2. **Interactive Relic Inspection**:
   - Clicking any item opens the `ObjectDetailModal`.
   - Diaries and grimoires allow flipping pages to read lore and chronological dates.
   - Letters unfold to display handwritten dispatch notes.
   - Skulls and crystals can be rotated with interactive mouse drag.
3. **Puzzles & Syllable Unlocks**:
   - **Grave I**: Moving relics and consecrating bones in altars unlocks `"THE"`.
   - **Grave II**: Aligning tumblers to `1 - 4 - 7` opens the iron coffer and unseals `"NIGHT"`.
   - **Grave III**: Rotating the concentric rune rings to `MOON (Outer) → RAVEN (Mid) → FLAME (Inner)` unlocks `"RETURNS"`.
4. **Final Gate Integration**:
   - Speaking `"THE NIGHT RETURNS"` at the Arch-Lich Escape Gate shatters the gate and completes Stage 3, awarding 250 CR.

---

### Test & Build Verification

1. **TypeScript Typecheck**:
   ```powershell
   npx tsc --noEmit
   # Exit code: 0 (No errors)

   npx tsc -p tsconfig.test.json
   # Exit code: 0 (No errors)
   ```

2. **Linter**:
   ```powershell
   npm run lint
   # oxlint: 0 warnings, 0 errors
   ```

3. **Vitest Suite**:
   ```powershell
   npm test -- --run
   # Test Files: 5 passed (5)
   # Tests:      31 passed (31)
   #   ✓ src/services/__tests__/round1Service.test.ts (8 tests)
   #   ✓ src/components/__tests__/Stage3ForgottenGraveyard.test.tsx (4 tests)
   #   ✓ src/components/__tests__/Stage2HauntedImageHunt.test.tsx (4 tests)
   #   ✓ src/components/__tests__/AdminPortal.test.tsx (7 tests)
   #   ✓ src/components/__tests__/FrostCartelHomePage.test.tsx (8 tests)
   ```

4. **Production Build**:
   ```powershell
   npm run build
   # vite v8.3.5 building client environment for production...
   # ✓ 76 modules transformed.
   # dist/index.html                   1.21 kB
   # dist/assets/index-CYr5K0Zg.css  145.34 kB
   # dist/assets/index-3Pnz8f1c.js   526.27 kB
   # ✓ built in 1.59s
   ```

