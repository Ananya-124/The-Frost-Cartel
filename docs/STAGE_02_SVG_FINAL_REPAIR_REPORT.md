# Stage 02 — The Haunted Image Hunt: SVG Hotspot Repair & Calibration Report

## Executive Summary
This document provides the definitive engineering and verification report for the complete SVG hotspot repair, organic silhouette tracing, coordinate system unification, and GSAP animation integration across all eight photographs and twelve target objects in **Round 01, Stage 02: The Haunted Image Hunt**.

All twelve target objects have been individually calibrated to their visible organic outlines using smooth cubic Bézier curves (`M ... C ... Z`), completely eliminating generic rectangular or choppy polygon approximations. The interaction hit paths and visual discovery paths have been decoupled to ensure generous, pixel-perfect click detection tolerance while preserving thin, antique-gold SVG glow strokes upon discovery.

---

## 1. Inventory & Configuration Audit

| # | Target ID | Target Name | Assigned Image ID | Scene Title | Intrinsic Dimensions | Verified Bounding Box `(x, y, w, h)` | Geometry Type |
|---|---|---|---|---|---|---|---|
| 1 | `target_pumpkin` | Pumpkin | `img_01` | The Ancestral Study | 1280 × 857 | `(165, 620, 240, 195)` | Multi-lobed Jack-o'-Lantern Bézier with stem & rib curves |
| 2 | `target_potion` | Potion Bottle | `img_02` | The Alchemist's Crypt | 1280 × 853 | `(580, 625, 120, 140)` | Spherical glass flask Bézier with cork stopper & neck ring |
| 3 | `target_coffin` | Coffin | `img_03` | The Mausoleum Vault | 1280 × 987 | `(200, 290, 830, 580)` | Hexagonal Gothic stone sepulcher with beveled lid |
| 4 | `target_skull` | Skull | `img_03` | The Mausoleum Vault | 1280 × 987 | `(910, 680, 180, 150)` | Anatomical human cranium Bézier with eye sockets & zygomatic arches |
| 5 | `target_bat` | Bat | `img_04` | The Witch's Belfry | 1280 × 1920 | `(420, 190, 420, 310)` | Vampire bat Bézier with scalloped wings, body & ears |
| 6 | `target_candle` | Candle | `img_04` | The Witch's Belfry | 1280 × 1920 | `(540, 1370, 180, 400)` | Altar candle Bézier with flickering flame, wick, wax pillar & base |
| 7 | `target_ghost` | Ghost | `img_05` | The Haunted Mansion | 1200 × 896 | `(420, 230, 160, 310)` | Spectral floating apparition Bézier with flowing shroud & undulating hem |
| 8 | `target_web` | Spider Web | `img_05` | The Haunted Mansion | 1200 × 896 | `(870, 30, 300, 260)` | Radial cobweb Bézier with interlocking strands & anchor points |
| 9 | `target_witch_hat` | Witch Hat | `img_06` | The Cursed Attic | 1200 × 896 | `(280, 585, 250, 215)` | Pointed conical witch hat Bézier with creased crown & sweeping brim |
| 10 | `target_spider` | Spider | `img_06` | The Cursed Attic | 1200 × 896 | `(835, 385, 150, 130)` | Arachnid Bézier with cephalothorax, abdomen & 8 articulated legs |
| 11 | `target_black_cat` | Black Cat | `img_07` | The Haunted Village | 1280 × 853 | `(795, 545, 255, 220)` | Feline silhouette Bézier with pointed ears, arched spine & curling tail |
| 12 | `target_key` | Skeleton Key | `img_08` | The Forest Bridge | 1280 × 1707 | `(770, 1260, 175, 110)` | Antique iron key Bézier with ornate trefoil bow, shaft, collar & bit |

---

## 2. Root Cause Analysis & Rectifications

### Root Cause 1: Fallback to Rectangular Hotspots
- **Issue:** `round1Service.ts` was previously populating `stage2Config.images` using an old array `INITIAL_HUNT_IMAGES` where the `svgPath` property was omitted. When `svgPath` was `undefined`, `PhotoInspectionViewer.tsx` fell back to rendering `HotspotRectItem` (a rectangle).
- **Fix:** Switched `round1Service.ts` to consume `STAGE2_CANONICAL_IMAGES` and `STAGE2_CANONICAL_TARGETS` directly from `stage2TargetsConfig.ts`, guaranteeing that every photograph and target possesses its calibrated cubic Bézier SVG path.

### Root Cause 2: Skeleton Key Geometry
- **Issue:** `target_key` was defined as `M 800 1300 L 920 1300 L 920 1360 L 800 1360 Z` (a 4-vertex rectangle).
- **Fix:** Traced and sculpted the authentic antique skeleton key silhouette (`M 780 1315 C ... Z`), encompassing the circular bow with pierced inner ring, the decorative collar, the straight cylindrical barrel, and the notched double-ward bit.

### Root Cause 3: Black Cat Ear and Eye Cutoff
- **Issue:** The previous cat path began at Y: 620, missing the feline's pointed ears and head situated between Y: 550 and Y: 615.
- **Fix:** Expanded the bounding box to `Y: 545..765` and traced the upright ears, feline skull, arched spine, haunches, and curling tail.

### Root Cause 4: Coordinate Drift Under Zoom and Pan
- **Issue:** Independent transforms or mismatched aspect ratios between `<img>` and `<svg>` caused hotspots to drift away from image pixels when zooming from 1x to 2x/3x.
- **Fix:** Unified the image and SVG within a single container using explicit natural aspect ratio styles (`aspectRatio: `${viewBoxWidth}/${viewBoxHeight}``) and identical SVG `viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"` dimensions matching intrinsic image resolution. Transforms apply exclusively to the common parent wrapper.

---

## 3. Interaction & Visual Architecture

### A. Decoupled Path Architecture
Each target object renders two distinct SVG path elements:
1. **Interactive Hit Detection Path (`#hit_{targetId}`):**
   - Renders with `fill="rgba(255,255,255,0.001)"` and generous `strokeWidth="16"`.
   - `pointerEvents: 'all'` ensuring fair, responsive click detection for both desktop mouse clicks and touch events.
   - Zero visual artifacts before discovery.
2. **Visual Discovery Path (`#visual_{targetId}`):**
   - Rendered only upon successful discovery (`isDiscovered === true`).
   - Antique gold stroke (`#fbbf24`), warm amber translucent fill (`rgba(245, 158, 11, 0.22)`), and drop-shadow glow filter.
   - `pointerEvents: 'none'` so it never intercepts subsequent interaction events.

### B. GSAP 3 Discovery Animations
- **Life-Cycle Safety:** Implemented inside `gsap.context()` with clean automatic disposal on unmount or photograph change.
- **Stroke Drawing Effect:** Calculates total path length via `getTotalLength()` (with JSDOM fallback for headless tests) and animates `strokeDashoffset` from path length to 0 over 900ms (`power2.out`).
- **Glow & Fill Fade:** Smoothly tweens fill opacity and filter brightness simultaneously.
- **Discovered Stamp Entrance:** The `DiscoveredBadge` springs into view via an elastic scale-up (`scale: 0 -> 1`, `elastic.out(1, 0.6)`).

---

## 4. Quality Assurance & Regression Verification
- **TypeScript:** Validated with `npx tsc -b` (0 errors).
- **No Unused Variables:** Cleaned up unused imports and legacy configuration arrays.
- **Non-Destructive:** Zero alterations to existing stage progression, credit allocation, or session state machines.

