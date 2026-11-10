# FROST CARTEL — STAGE 03 — COFFIN III: THE FINAL TESTAMENT
## COMPLETE REDESIGN, IMAGE-BASED EVIDENCE INVESTIGATION & THREE-ROTATING-RING PUZZLE IMPLEMENTATION REPORT

---

## 1. EXECUTIVE SUMMARY

In accordance with the Principal AAA Game Developer and Senior React 19 Frontend Engineer specifications, **Stage 03 Coffin III: The Final Testament** (`src/components/game/stage3/Grave3FinalTestament.tsx`) has been completely overhauled and reconstructed from the ground up.

### Key Achievements:
1. **Total Elimination of Drag & Synthetic Draggable Overlays:**
   - Completely eradicated synthetic canvas/SVG graphic overlays (`SkullGraphic`, `CrystalGraphic`, `PotionGraphic`, `BookGraphic`, `ScrollGraphic`, `LetterGraphic`, `KeyGraphic`).
   - Removed all dragging states, coordinate tracking (`skullOffset`, `crystalOffset`, etc.), and the unsightly `"💎 Soul Crystal • Drag"` label.
   - Removed the redundant top instruction banner (`"EXAMINE • ROTATE • MOVE OBJECTS TO REVEAL CLUES"`).
2. **Unified Cinematic Gothic Environment:**
   - Established a cohesive, single-canvas environment incorporating midnight blue sky, gothic castle on distant cliffs, moonlit fog, antique wooden coffin lined with crimson velvet, natural candle flicker, and autumn pumpkins.
   - Preserved single `CoffinHeaderHUD` rendering exactly once with `GRAVE III`, `THE FINAL TESTAMENT`, countdown timer, credits, mute toggle, and exit navigation.
3. **Pristine 2560×1440 Master Coffin Artwork:**
   - Generated native high-definition clean master artwork (`public/assets/round-01/stage-03/coffin-03-final-testament-master.png`) and updated (`public/assets/stage-3/coffins/grave3_final_testament.jpg`).
   - Seamlessly blended the night sky across the top header zone and dark cemetery earth/wood across the bottom console zone, guaranteeing zero duplicate headings or baked-in UI text bleed.
4. **8 Calibrated Invisible HTML Click Hotspots (0 Overlaps):**
   - Implemented 8 pixel-perfect invisible HTML interaction buttons matching the natural embedded objects in the artwork.
   - Mathematically verified **0.00% overlap** across all target pairs.
   - Clicking each item opens a high-definition photographic modal featuring sharp close-up artwork crops from `public/assets/round-01/stage-03/inspection/` and atmospheric gothic lore.
5. **The Keeper's Final Testament Riddle & Three Large Circular Rotating Rings:**
   - Replaced the previous technical instruction box with the exact player-facing riddle verse:
     > *"Three guardians watch the heavens through the endless night. One wears the pale face that commands the outer darkness. Another travels between the heavens and the final fire, never claiming either throne. The last burns closest to the heart, yet fades before the dawn. Read the keeper's chart, listen to the relics, and restore their rightful circles. Only when each guardian finds its destined place shall the final testament awaken."*
   - Implemented three prominent, antique-gold circular rotating ring selectors:
     - `RING I — OUTER` (Controlling Sphere I: `MOON`)
     - `RING II — MIDDLE` (Controlling Sphere II: `RAVEN`)
     - `RING III — INNER` (Controlling Sphere III: `FLAME`)
   - Large circular bronze dials with glowing celestial icons (`🌙`, `🦅`, `🔥`, `💀`), Cinzel typography, and gold navigation arrows.
6. **Solution Validation & Final Secret Syllable Reveal:**
   - Correct sequence: `OUTER → MOON`, `MIDDLE → RAVEN`, `INNER → FLAME`.
   - Wrong submissions trigger audio error, red warning message (`"The celestial runes resist your touch... The guardians are not in alignment."`), and lock shake animation.
   - Correct submission unseals the final testament with discovery audio fanfare, unlocks syllable `RETURNS` (completing phrase `THE NIGHT RETURNS`), updates Evidence Journal to `3/3`, and awards 250 CR.

---

## 2. CALIBRATED INTERACTION TARGETS (0 OVERLAPS)

All 8 interactive objects are positioned using percentage coordinates relative to the 16:9 master artwork container. Every object occupies its own independent hitbox with zero overlap:

| Object ID | Title & Identification | Left | Top | Width | Height | Inspection Asset |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `skeleton_iii` | Cranium of the Arch-Warden (III) | `27.83%` | `13.89%` | `10.74%` | `18.23%` | `skeleton_iii.png` |
| `soul_crystal` | Azure Soul Crystal | `24.90%` | `32.99%` | `4.20%` | `9.55%` | `soul_crystal.png` |
| `celestial_medallion` | Celestial Astral Medallion | `39.55%` | `30.38%` | `5.86%` | `11.28%` | `celestial_medallion.png` |
| `potion_bottle` | Cinnabar Infusion Potion Phial | `29.49%` | `43.06%` | `5.18%` | `12.50%` | `potion_bottle.png` |
| `ancient_book` | Grimoire of the Constellations | `35.16%` | `43.06%` | `11.72%` | `17.71%` | `ancient_book.png` |
| `ancient_scroll` | Ancient Testament Scroll | `50.29%` | `40.80%` | `6.35%` | `18.23%` | `ancient_scroll.png` |
| `star_chart_parchment`| Astronomical Chart of the Spheres | `58.11%` | `41.67%` | `14.65%` | `13.89%` | `star_chart_parchment.png` |
| `relic_chest` | Carved Relic Chest | `62.50%` | `56.42%` | `12.21%` | `12.15%` | `relic_chest.png` |

---

## 3. PUZZLE ARCHITECTURE & EVIDENCE JOURNAL INTEGRATION

### The Three Celestial Guardians
1. **Outer Ring (Sphere I): `MOON`**
   - *Riddle Reference:* *"One wears the pale face that commands the outer darkness."*
   - *Evidence Clues:*
     - `soul_crystal`: Inscription at base: *"Look to the pale sphere that commands the outer darkness—only the Moon may crown the first circle."*
     - `star_chart_parchment`: Spheres diagram shows outer celestial track labeled with lunar glyph.
2. **Middle Ring (Sphere II): `RAVEN`**
   - *Riddle Reference:* *"Another travels between the heavens and the final fire, never claiming either throne."*
   - *Evidence Clues:*
     - `ancient_book`: Grimoire Folio XLVIII reads: *"Between the outer vault of darkness and the inner altar of flame flies the Raven of twilight. He claims neither the cold void nor the sacred fire, but circles forever between them as the middle guardian."*
3. **Inner Ring (Sphere III): `FLAME`**
   - *Riddle Reference:* *"The last burns closest to the heart, yet fades before the dawn."*
   - *Evidence Clues:*
     - `potion_bottle`: Alchemical seal inscription reads: *"Distilled at the deepest forge. It burns closest to the heart, yet its heat must fade before the dawn. The Sacred Flame belongs to the innermost ring."*

### Complete Cemetery Incantation Structure
- **Grave 1 (The Marked Remains):** Unseals First Syllable: `THE`
- **Grave 2 (The Buried Diary):** Unseals Second Syllable: `NIGHT` (or `EMBER`)
- **Grave 3 (The Final Testament):** Unseals Third Syllable: `RETURNS`
- **Final Escape Gate Submission:** `THE NIGHT RETURNS`

---

## 4. VERIFICATION & QUALITY ASSURANCE

### Automated Vitest Suite
- Test file: `src/components/__tests__/Grave3FinalTestament.test.tsx`
- Results: **7 passed of 7 tests (100%)**
- Full test run across codebase: **36 test files, 198 tests passed (100%)**

### Playwright End-to-End Headless Browser Verification
- Script: `scripts/verify_coffin3_browser.py`
- Tested viewports:
  1. `1920×1080` (Full HD Master): Verified clean layout, no horizontal scroll, crisp typography.
  2. `1600×900`: Verified aspect ratio containment and ring controls.
  3. `1440×900`: Verified no overlapping elements.
  4. `1366×768`: Verified compact console padding and readable riddle verse.
  5. `1280×720`: Verified mobile/laptop scale with fully visible interactive buttons.
- Functional test outcomes:
  - Header count: exactly 1.
  - Master image source: `coffin-03-final-testament-master.png`.
  - All 8 artifact inspection modals opened, verified title/text, and closed cleanly.
  - Invalid ring alignment rejection verified with warning toast.
  - Ring rotation to `MOON` → `RAVEN` → `FLAME` verified.
  - `UNSEAL THE FINAL TESTAMENT` clicked: unsealed codex modal displayed, secret fragment `RETURNS` confirmed.
  - Button state updated to `TESTAMENT UNSEALED`.

### Production Build
- Command: `npm run build`
- Output: `tsc -b && vite build` succeeded in 4.51s with 0 errors.
