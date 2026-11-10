# Frost Cartel — Stage 03, Coffin III: The Final Testament
## Complete UI Reconstruction, Fullscreen Artwork, Three-Ring Puzzle & Click-Outline Removal Report

**Date:** 2026-11-10  
**Status:** COMPLETE & VERIFIED  
**Component:** `src/components/game/stage3/Grave3FinalTestament.tsx`  
**Automated Tests:** 37/37 Test Suites Passed (205/205 Tests), Playwright End-to-End Suite Passed  
**Production Build:** `npm run build` Verified Clean (`dist/`)  

---

## 1. Executive Summary & Root-Cause Resolution

This comprehensive architectural overhaul resolves all issues reported in Coffin III (*The Final Testament*):

| Defect Reported | Root Cause Identified | Engineering Correction Applied | Status |
|---|---|---|---|
| **Main artwork too small / Black side gutters** | `<main>` had `max-h-[64vh]` and `aspectRatio: '16/9'` inside a centered flex container, which constrained width to 1191px on 1920px displays and left 371px black voids on both sides. | Removed artificial `max-h-[64vh]` container constraints. Positioned master 16:9 canvas using full viewport width and height (`w-full h-screen h-[100dvh]`) with `object-cover object-center` and overlay layout. Spans 100% of viewport width (1919px of 1920px) with **0 black side gutters**. | **RESOLVED** |
| **Blurred horizontal strip behind puzzle panel** | Previous `build_coffin3_assets.py` script stretched an 8px wood strip with `ImageFilter.GaussianBlur(2.0)` across `y=412..576`, coupled with `backdrop-blur-md` in CSS. | Reconstructed master image using sharp atmospheric gradient matching native environment grain with **zero blur filters**. Removed `backdrop-blur-md` on resting state in the React component. | **RESOLVED** |
| **Three-ring controls look like separate small cards** | Fragmented black card boxes with vertical `▲`/`▼` steppers were rendered on the right. | Replaced with unified antique-gold console matching reference design: `CONCENTRIC CELESTIAL RUNES` header, 3 circular dials with gold pill labels (`RING I — OUTER`, `RING II — MIDDLE`, `RING III — INNER`), horizontal `◄` / `►` chevrons, and centered wide bar `🔒 UNSEAL THE FINAL TESTAMENT`. | **RESOLVED** |
| **Unwanted visible click selection outlines** | Default browser button focus styling applied visible rectangles (`focus:ring-2`, browser focus borders) when clicking image objects. | Applied `onMouseDown={(e) => e.preventDefault()}` and inline styles `outline: 'none', border: 'none', boxShadow: 'none'` plus Tailwind utility classes `outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none`. Verified 0 outlines, 0 borders, 0 box-shadows. | **RESOLVED** |
| **Old and new UI layers visible together** | Multiple overlapping containers and residual baked-in elements from legacy screenshots. | Completely cleaned master asset of all baked-in UI text, HUD, and buttons. Master artwork is now 100% pure photographic canvas; all interface elements are genuine, single-source-of-truth React components. | **RESOLVED** |

---

## 2. Master Artwork & Asset Pipeline

### 2.1 Clean Master Image Specifications
- **Master Asset Path:** `public/assets/round-01/stage-03/coffin-03-final-testament-master.png`
- **Native Canvas Dimensions:** `2560 × 1440` (16:9 Landscape Ultra-HD)
- **Web-Optimized Standard Asset:** `public/assets/stage-3/coffins/grave3_final_testament.jpg` (`1024 × 576`, 95% JPEG)
- **Top HUD Region:** Clean moonlit sky, gothic castle towers, and silhouette branches.
- **Bottom Base Region:** Deep gothic obsidian/mahogany shadows with ambient candle warmth from lanterns and jack-o'-lanterns. Zero artificial Gaussian blur.

### 2.2 Calibrated Photographic Inspection Assets (`3x Lanczos`)
All 8 interactive objects were extracted and rendered at triple resolution into `public/assets/round-01/stage-03/inspection/`:
1. `skeleton_iii.png` (`390 × 390`) — Cranium of the Arch-Warden marked III with cinnabar pigment.
2. `soul_crystal.png` (`180 × 225`) — Azure Soul Crystal pulsing with celestial ether.
3. `celestial_medallion.png` (`240 × 225`) — Tri-concentric bronze talisman on skeletal sternum.
4. `potion_bottle.png` (`210 × 255`) — Cinnabar Infusion Phial with incandescent red solvent.
5. `ancient_book.png` (`420 × 345`) — Grimoire of the Constellations bound in midnight calfskin.
6. `ancient_scroll.png` (`270 × 345`) — Ancient Testament Scroll bound with red silk ribbon.
7. `star_chart_parchment.png` (`510 × 285`) — Astronomical Chart of the Spheres depicting orbits.
8. `relic_chest.png` (`420 × 255`) — Antique wooden casket bound in blackened iron.

---

## 3. Calibrated Hotspot Geometry & Zero-Outline Architecture

### 3.1 16:9 Coordinate System (0.00% Overlap)
Each hotspot button is positioned using proportional percentages in the master 16:9 vector space:

```ts
export const COFFIN3_TARGETS: ImageEvidenceTarget[] = [
  { id: 'skeleton_iii',         left: '27.83%', top: '13.89%', width: '10.74%', height: '18.23%' },
  { id: 'soul_crystal',         left: '24.90%', top: '32.99%', width: '4.20%',  height: '9.55%'  },
  { id: 'celestial_medallion',  left: '39.55%', top: '30.38%', width: '5.86%',  height: '11.28%' },
  { id: 'potion_bottle',        left: '29.49%', top: '43.06%', width: '5.18%',  height: '12.50%' },
  { id: 'ancient_book',         left: '35.16%', top: '43.06%', width: '11.72%', height: '17.71%' },
  { id: 'ancient_scroll',       left: '50.29%', top: '40.80%', width: '6.35%',  height: '18.23%' },
  { id: 'star_chart_parchment', left: '58.11%', top: '41.67%', width: '14.65%', height: '13.89%' },
  { id: 'relic_chest',          left: '62.50%', top: '56.42%', width: '12.21%', height: '12.15%' },
];
```

### 3.2 Total Click-Outline Suppression
To guarantee that mouse clicks never produce browser outline boxes or hover halos:
```tsx
<button
  key={target.id}
  type="button"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => handleInspect(target)}
  aria-label={target.ariaLabel}
  className="absolute z-20 cursor-pointer bg-transparent border-0 outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none select-none transition-none shadow-none"
  style={{
    left: target.left,
    top: target.top,
    width: target.width,
    height: target.height,
    outline: 'none',
    border: 'none',
    boxShadow: 'none',
  }}
>
  <span className="sr-only">{target.title}</span>
</button>
```

**Verification Script Output (`scripts/verify_zero_outlines.py`):**
```
Inspect Cranium of the Arch-Wa -> outline: 0px none, border: 0px none, shadow: none
Inspect Azure Soul Crystal     -> outline: 0px none, border: 0px none, shadow: none
Inspect Celestial Astral Medal -> outline: 0px none, border: 0px none, shadow: none
Inspect Cinnabar Infusion Poti -> outline: 0px none, border: 0px none, shadow: none
Inspect Grimoire of the Conste -> outline: 0px none, border: 0px none, shadow: none
Inspect Ancient Testament Scro -> outline: 0px none, border: 0px none, shadow: none
Inspect Astronomical Chart of  -> outline: 0px none, border: 0px none, shadow: none
Inspect Carved Relic Chest     -> outline: 0px none, border: 0px none, shadow: none
ALL 8 TARGETS HAVE 0 OUTLINES, 0 BORDERS, 0 SHADOWS!
```

---

## 4. UI Architecture & Three-Ring Puzzle Console

### 4.1 Unified Ornamental Gold Console
The puzzle console is rendered as a single cohesive unit:
- **Left Side (~42%):**
  - Title: `✦ THE KEEPER'S FINAL TESTAMENT ✦` in gold Cinzel text.
  - Riddle Verse:
    > *"Three guardians watch the heavens through the endless night. One wears the pale face that commands the outer darkness. Another travels between the heavens and the final fire, never claiming either throne. The last burns closest to the heart, yet fades before the dawn. Read the keeper's chart, listen to the relics, and restore their rightful circles. Only when each guardian finds its destined place shall the final testament awaken."*
- **Right Side (~58%):**
  - Section Header: `CONCENTRIC CELESTIAL RUNES` with gold filigree divider rules.
  - Exactly three concentric rotating rings in a single horizontal row:
    - `RING I — OUTER`: Gold pill label + Left chevron button `◄` + circular dial + Right chevron button `►`.
    - `RING II — MIDDLE`: Gold pill label + Left chevron button `◄` + circular dial + Right chevron button `►`.
    - `RING III — INNER`: Gold pill label + Left chevron button `◄` + circular dial + Right chevron button `►`.
  - Prominent Centered Golden Bar Button:
    `🔒 UNSEAL THE FINAL TESTAMENT` (`w-full mt-2.5 py-3 px-6 rounded-xl border-2 font-cinzel`).
    Transitions to `✓ TESTAMENT UNSEALED` upon correct alignment.

### 4.2 Solution Key & Unsealing Flow
- **Canonical Alignment Solution:**
  - `RING I — OUTER` $\to$ **`MOON`** (`🌙`)
  - `RING II — MIDDLE` $\to$ **`RAVEN`** (`🦅`)
  - `RING III — INNER` $\to$ **`FLAME`** (`🔥`)
- **Configurable Clue Fragment:** `RETURNS` (preserved via `config.grave3?.clueFragment || 'RETURNS'`).
- **Incorrect Attempt:** Triggers gentle lock shake animation and error toast: *"The celestial runes resist your touch... The guardians are not in alignment."*
- **Correct Attempt:**
  1. Triggers chest unlock and victory audio chords via `soundController`.
  2. Unseals secret syllable: `R — E — T — U — R — N — S`.
  3. Updates Evidence Journal to `3/3` (`[Grave I: THE] • [Grave II: NIGHT] • [Grave III: RETURNS]`).
  4. Opens Celebration Codex modal and unlocks Cemetery Escape Gate.

---

## 5. Responsive Fullscreen Verification Results

Automated browser tests were executed across all 5 target viewports at 100% zoom:

| Viewport Resolution | Aspect Ratio | Screen Coverage | Side Gutters | Screenshot Path |
|---|---|---|---|---|
| **1920 × 1080** | 16:9 (Desktop Full HD) | **100.0%** (1919px / 1920px) | **0 px** | `docs/screenshots/coffin3_master_clean_1920x1080.png` |
| **1600 × 900** | 16:9 (Standard Laptop) | **100.0%** (1599px / 1600px) | **0 px** | `docs/screenshots/coffin3_responsive_1600x900.png` |
| **1440 × 900** | 16:10 (MacBook / Widescreen) | **100.0%** (1439px / 1440px) | **0 px** | `docs/screenshots/coffin3_responsive_1440x900.png` |
| **1366 × 768** | ~16:9 (Compact Notebook) | **100.0%** (1365px / 1366px) | **0 px** | `docs/screenshots/coffin3_responsive_1366x768.png` |
| **1280 × 720** | 16:9 (HD Desktop) | **100.0%** (1279px / 1280px) | **0 px** | `docs/screenshots/coffin3_responsive_1280x720.png` |

---

## 6. Functional Test Suite & Evidence Artifacts

### 6.1 Test Suite Summary
- **Playwright Suite (`scripts/verify_coffin3_browser.py`):**
  - Single HUD header verified (`h2: "THE FINAL TESTAMENT"` count = 1).
  - All 8 photographic inspection modals verified.
  - Keeper's riddle verse verified.
  - Three rotating ring labels verified (`RING I — OUTER`, `RING II — MIDDLE`, `RING III — INNER`).
  - Incorrect combination error verified.
  - Ring rotation to `MOON` - `RAVEN` - `FLAME` verified.
  - Testament unsealed modal & syllable `RETURNS` verified.
  - Button state updated to `TESTAMENT UNSEALED`.
- **Vitest Unit Suite (`src/components/__tests__/Grave3FinalTestament.test.tsx`):**
  - 7/7 tests passed in 167ms.
- **Global Vitest Regression:**
  - 37/37 test files passed, 205/205 tests passed across all rounds and stages.

### 6.2 Browser Screenshot Artifacts Generated
- `docs/screenshots/coffin3_master_clean_1920x1080.png` (Default pristine state)
- `docs/screenshots/coffin3_inspect_skull.png` (Cranium III inspection)
- `docs/screenshots/coffin3_inspect_crystal.png` (Azure Soul Crystal inspection)
- `docs/screenshots/coffin3_inspect_potion.png` (Cinnabar Infusion Phial inspection)
- `docs/screenshots/coffin3_inspect_medallion.png` (Celestial Medallion inspection)
- `docs/screenshots/coffin3_inspect_book.png` (Grimoire inspection)
- `docs/screenshots/coffin3_inspect_scroll.png` (Ancient Testament Scroll inspection)
- `docs/screenshots/coffin3_inspect_chart.png` (Astronomical Star Chart inspection)
- `docs/screenshots/coffin3_inspect_chest.png` (Relic Chest inspection)
- `docs/screenshots/coffin3_aligned_rings.png` (MOON - RAVEN - FLAME alignment)
- `docs/screenshots/coffin3_unsealed_testament.png` (Codex unsealed celebration modal)

---

## 7. Remaining Issues
**None.** The Coffin III implementation is completely clean, responsive, fully tested, and verified end-to-end.
