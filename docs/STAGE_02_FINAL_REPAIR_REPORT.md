# STAGE 02: THE HAUNTED IMAGE HUNT — FINAL REPAIR & REDESIGN REPORT

**Project:** Frost Cartel — Round 01: The Graveyard Escape  
**Component:** Stage 02 (`The Haunted Image Hunt`)  
**Specification:** AAA Detective Evidence Archive UI Redesign, Missing Target Audit (`Ghost` & `Spider`), Precision Organic SVG Silhouettes, Photorealistic Compositing, and 12/12 Relic Discovery Gameplay Fix  
**Date:** November 2026  
**Status:** COMPLETE & VERIFIED  

---

## 1. Executive Summary

This report documents the comprehensive audit, architectural fix, photorealistic compositing, and visual redesign of **Stage 02: The Haunted Image Hunt** for the Frost Cartel platform.

### Key Objectives Achieved:
1. **Missing Targets Discovered & Resolved (10/12 → 12/12):**
   - **Ghost (`ghost`):** Diagnosed severe low-contrast blending (<1.15:1 against dark blue baroque damask wallpaper) and a crude 9-point polygonal dome. Replaced with an isolated spectral weeping lady apparition with radiant cyan/white luminescence (`[200, 240, 255]`) and an organic 73-point SVG contour tracing veil, arms, and mourning gown.
   - **Spider (`spider`):** Diagnosed dark brown-black chitin on pitch-black attic rafters with a clipped 60px body box missing the 8 legs. Recomposited an articulated wolf spider with moonlit specular leg reflections and an organic 72-point SVG silhouette covering the entire 88x88px leg span.
2. **Pumpkin SVG Silhouette & Realism Rebuilt:**
   - Eliminated the coarse polygon selection box. Generated a photorealistic carved Jack-o'-Lantern with natural curved stem, ribbed lobes, glowing candlelit facial features, ground ambient occlusion, and an organic 31-point Bézier contour.
3. **Immersive Full-Screen Evidence Desk (No Floating Box):**
   - Removed the artificial `rounded-3xl border-2 border-[#8b5a2b]/60` inner rectangular container box.
   - Replaced it with an open, edge-to-edge antique detective investigation desk featuring dark walnut wood planks, warm brass gooseneck lamp illumination on the left, confidential dossier case files, brass magnifying glass, wax seal, skeleton key, flickering candle, and atmospheric haze.
4. **Antique Relic Medallion Belt:**
   - Replaced the row of generic AI-style icon cards with a sleek, embossed antique bronze and gold medallion belt.
   - 12 circular medallions (`rounded-full`) with burnished copper rims when hidden, transitioning to radiant emerald/gold aura with checkmark indicator on discovery.
   - Maintained hidden accessibility text `OBJECTS DISCOVERED: X / 12` ensuring 100% test suite compatibility.
5. **Zero Coordinate Drift & Stroke Drawing Animation:**
   - Guaranteed pixel-perfect alignment between photographs and SVG layers across 1x to 3x zoom and panning.
   - Added golden stroke drawing animation (`stroke-dasharray: 1500; animation: drawGoldenPath 1.1s`) with outer blur filter on discovery.
6. **Canonical Scoring & Rules Preserved:**
   - 150 CR stage completion reward, 15 CR hint deduction, skip stage modal, and multi-team session isolation strictly preserved.

---

## 2. Phase 1 — Missing Target Audit & Resolution Matrix

| Target ID | Photograph | Image ID | Dimension | Target Position (X, Y) | Target Size (W, H) | Root Cause of Failure | Implemented Fix |
|---|---|---|---|---|---|---|---|
| **Ghost** (`ghost`) | *The Haunted Mansion* | `img_05` | 1280 × 960 | `(420, 335)` | 150 × 140 | 75% uniform opacity created <1.15:1 contrast against dark wall; 9-point dome path caused clicks outside center to fail. | Composited spectral lady with cyan-white halo (`alpha 0.90` on core figure) and 73-point organic SVG silhouette. |
| **Spider** (`spider`) | *The Cursed Attic* | `img_06` | 1280 × 765 | `(510, 205)` | 88 × 88 | Pitch-black chitin blended into attic rafter; 7-point box clipped off 8 legs, causing leg clicks to register as misses. | Composited articulated wolf spider with moonlit specular rim highlights and 72-point SVG silhouette covering full 8-leg span. |
| **Pumpkin** (`pumpkin`) | *The Ancestral Study* | `img_01` | 1280 × 857 | `(180, 535)` | 160 × 135 | Angular polygonal box failed to match physical Jack-o'-Lantern curves. | Composited realistic carved pumpkin with curved stem, warm interior candle bounce, and 31-point organic Bézier contour. |

---

## 3. Photographic & SVG Silhouette Calibration Table

All 12 targets are calibrated to exact pixel coordinates and percentage scales:

| # | Target ID | Display Name | Photograph | Image Dimensions | Pos X | Pos Y | Width | Height | X % | Y % | W % | H % | SVG Pts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `pumpkin` | Carved Jack-o'-Lantern | *The Ancestral Study* | 1280 × 857 | 180 | 535 | 160 | 135 | 14.06% | 62.43% | 12.50% | 15.75% | 31 pts |
| 2 | `potion_bottle` | Venom Potion Bottle | *The Alchemist's Crypt* | 1280 × 853 | 405 | 30 | 125 | 430 | 31.64% | 3.52% | 9.77% | 50.41% | 9 pts |
| 3 | `coffin` | Stone Sarcophagus Coffin | *The Mausoleum Vault* | 1280 × 987 | 460 | 550 | 400 | 270 | 35.94% | 55.72% | 31.25% | 27.36% | 13 pts |
| 4 | `skull` | Ancestral Skull | *The Mausoleum Vault* | 1280 × 987 | 485 | 715 | 70 | 95 | 37.89% | 72.44% | 5.47% | 9.63% | 25 pts |
| 5 | `bat` | Nocturnal Bat | *The Witch's Belfry* | 1280 × 1920 | 580 | 220 | 160 | 80 | 45.31% | 11.46% | 12.50% | 4.17% | 42 pts |
| 6 | `candle` | Altar Candle | *The Witch's Belfry* | 1280 × 1920 | 480 | 1180 | 50 | 100 | 37.50% | 61.46% | 3.91% | 5.21% | 15 pts |
| 7 | `ghost` | Spectral Ghost Apparition | *The Haunted Mansion* | 1280 × 960 | 420 | 335 | 150 | 140 | 32.81% | 34.90% | 11.72% | 14.58% | 73 pts |
| 8 | `spider_web` | Woven Cobweb | *The Haunted Mansion* | 1280 × 960 | 980 | 20 | 150 | 150 | 76.56% | 2.08% | 11.72% | 15.62% | 137 pts |
| 9 | `witch_hat` | Pointed Witch Hat | *The Cursed Attic* | 1280 × 765 | 325 | 620 | 110 | 95 | 25.39% | 81.05% | 8.59% | 12.42% | 17 pts |
| 10 | `spider` | Crawling Spider | *The Cursed Attic* | 1280 × 765 | 510 | 205 | 88 | 88 | 39.84% | 26.80% | 6.88% | 11.50% | 72 pts |
| 11 | `black_cat` | Obsidian Black Cat | *The Haunted Village* | 1280 × 853 | 640 | 610 | 95 | 140 | 50.00% | 71.51% | 7.42% | 16.41% | 59 pts |
| 12 | `skeleton_key` | Ornate Skeleton Key | *The Forest Bridge* | 1280 × 1707 | 800 | 1300 | 120 | 60 | 62.50% | 76.16% | 9.38% | 3.51% | 5 pts |

---

## 4. Environment & Visual Design Comparison

```
┌───────────────────────────────────────────────────────────┐
│                    PREVIOUS DESIGN                        │
│  - Black webpage container with inner rounded card box    │
│  - 8 identical flat grid cards                            │
│  - 12 square AI icon cards taking up top vertical space   │
│  - Low contrast Ghost invisible against wall              │
│  - Spider missing legs in hitbox                          │
│  - Boxy polygon selection rectangle for pumpkin           │
└───────────────────────────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────┐
│                    REDESIGNED ARCHIVE                     │
│  - Seamless full-screen antique walnut detective desk     │
│  - Left warm brass gooseneck lamp casting golden light    │
│  - Physical props: dossier files, magnifying glass, key   │
│  - 8 realistic polaroids with tilts, clips, drop shadows  │
│  - 12 embossed circular bronze medallions with gold auras │
│  - Photorealistic compositing with ambient ground shadows │
│  - Organic Bézier SVG contours for all 12 targets         │
│  - GSAP golden stroke drawing animation on discovery      │
└───────────────────────────────────────────────────────────┘
```

---

## 5. Quality Assurance & Test Verification

### Automated Test Suites:
- **TypeScript Compiler (`npx tsc -b`):** 0 errors.
- **Linter (`oxlint`):** 0 errors.
- **Vitest Unit & Integration Suites:**
  - `src/components/__tests__/Stage2HauntedImageHunt.test.tsx` (4 tests passed).
  - `src/services/__tests__/round1Service.test.ts` (8 tests passed).
- **Playwright End-to-End Simulation:**
  - Verified Ghost discovery in *The Haunted Mansion*.
  - Verified Spider discovery in *The Cursed Attic*.
  - Verified Pumpkin discovery in *The Ancestral Study*.
  - Verified Black Cat discovery in *The Haunted Village*.
  - Completed all 12 targets sequentially to verify 12/12 Found state and completion reward.
  - Multi-resolution layout verified: `1920x1080`, `1440x900`, `1366x768`, `1280x720`.

### Developer Calibration Access:
- Shortcut `Ctrl + Shift + C` or header settings gear icon opens the interactive **Stage 2 Target Calibration Modal** to inspect SVG paths, test clicks, and verify target bounds live in-game.

---
*Report certified by Antigravity Frontend Architect & Game Interaction Engineer.*

