# FROST CARTEL — ROUND 01, STAGE 02
## THE HAUNTED IMAGE HUNT: THE HAUNTED MANSION REPLACEMENT & DUAL SVG TARGET CALIBRATION

**Document Status:** Production Complete  
**Date:** 2026-11-11  
**Target Photographic Asset:** `img_05` — The Haunted Mansion  
**Master Asset Path:** `/assets/stage-02/photographs/haunted-mansion-master.webp`  
**Fallback Asset Path:** `/assets/stage-02/photographs/haunted-mansion.jpg`  

---

### 1. Executive Summary & Problem Resolution

The legacy Haunted Mansion asset used an uncalibrated $1200 \times 896\text{ px}$ image with an artificial floating ghost illustration and baked-in yellow bounding boxes and green checkmark overlays.

This production deployment delivers:
1. **Photographic Replacement:** Replaced with clean, cinematic high-resolution gothic foyer artwork ($1024 \times 629\text{ px}$, aspect ratio $1.628 : 1$) featuring high vaulted gothic arches, stained-glass windows, a central chandelier, a grand staircase, a grandfather clock, and wall portraits.
2. **Ghost Target Alignment (`ghost` / `hs_ghost`):** Calibrated to the subtle ghostly figure within the oval portrait mounted on the wall above the grandfather clock ($x=399, y=388, w=27, h=58$). The path traces the actual visible figure silhouette (head crown, hair contours, neck, draped shoulders, and dress/bust) without enclosing the ornate wooden frame, clock, or surrounding wall vines.
3. **Spider Web Target Alignment (`spider_web` / `hs_web`):** Calibrated to the intricate dusty cobweb woven into the upper-right ceiling stone arch ($x=830, y=61, w=108, h=107$). The path follows the true arch masonry attachment points and outer concentric arcs.
4. **Organic Cubic Bézier Geometry:** Completely discarded the old multi-point polylines. Replaced with smooth organic Bézier curves matching the natural visual features.
5. **Absolute Pre-Discovery Stealth:** All interaction hit-paths render with `opacity-0`, `hover:opacity-0`, and `stroke="transparent"`. Golden outlines (`#fbbf24`) and teal checkmarks appear exclusively upon successful discovery.
6. **Complete Target Independence:** Ghost ($x \approx 399..426, y \approx 388..446$) and Spider Web ($x \approx 830..938, y \approx 61..168$) have $> 200\text{ px}$ vertical separation and $> 400\text{ px}$ horizontal separation, ensuring zero cross-contamination.

---

### 2. Intrinsic Coordinate Specifications

| Attribute | Spectral Ghost (`hs_ghost`) | Woven Cobweb (`hs_web`) |
| :--- | :--- | :--- |
| **Target ID** | `'ghost'` | `'spider_web'` |
| **Hotspot ID** | `'hs_ghost'` | `'hs_web'` |
| **Image Asset** | `img_05` (`1024 × 629 px`) | `img_05` (`1024 × 629 px`) |
| **Coordinates (X, Y)** | `(399, 388)` | `(830, 61)` |
| **Bounding Box (W × H)** | `27 × 58 px` | `108 × 107 px` |
| **Percentage (X, Y)** | `38.96%, 61.69%` | `81.05%, 9.70%` |
| **Percentage (W × H)** | `2.64%, 9.22%` | `10.55%, 17.01%` |
| **Difficulty Rating** | `MEDIUM` | `HARD` |
| **Hit Stroke Width** | `17px` (with generous margin) | `17px` (with generous margin) |

#### Calibrated SVG Path: Spectral Ghost
```svg
M 413 388 C 418 388 421 391 421 396 C 421 401 418 405 418 408 C 422 410 426 414 426 419 C 426 426 425 434 423 440 C 421 444 416 446 412 446 C 407 446 403 444 401 440 C 399 434 399 426 399 419 C 399 414 403 410 407 408 C 407 405 404 401 404 396 C 404 391 408 388 413 388 Z
```

#### Calibrated SVG Path: Woven Cobweb
```svg
M 870 61 C 890 63 912 68 930 76 C 936 86 938 100 938 116 C 938 132 931 148 920 160 C 908 166 892 168 878 168 C 860 166 846 156 836 142 C 830 130 830 114 832 102 C 836 88 852 70 870 61 Z
```

---

### 3. File System Modifications

1. `public/assets/stage-02/photographs/haunted-mansion-master.webp` — Production WebP master asset ($1024 \times 629\text{ px}$).
2. `public/assets/stage-02/photographs/haunted-mansion.jpg` — High quality JPG fallback asset ($1024 \times 629\text{ px}$).
3. `public/assets/stage-2/photographs/haunted-mansion-master.webp` & `.jpg` — Mirrored aliases for legacy route consistency.
4. `src/components/game/stage2/stage2TargetsConfig.ts` — Updated `STAGE2_TARGET_DEFINITIONS` indices 6 & 7 and `STAGE2_CANONICAL_IMAGES[4]` (`img_05`) dimensions and asset URL.
5. `public/assets/stage-02/manifest/photo-sources.json` — Updated filename to `haunted-mansion-master.webp`.
6. `public/assets/stage-02/manifest/target-manifest.json` — Updated ghost and spider web definitions and SVG paths.
7. `src/components/__tests__/HauntedMansionSvgCalibration.test.tsx` — Complete unit test suite verifying geometric calibration, zero pre-discovery outlines, click interactions, and independent discovery.
8. `backup/stage-02-rollback/haunted-mansion-old-backup.jpg` — Preserved archival copy of previous asset.

---

### 4. Automated Verification Results

- **Unit Test Suite:** `npm test -- HauntedMansionSvgCalibration.test.tsx --run` → 7 / 7 PASSED (130ms).
- **All SVG Calibration Tests:** `npm test -- SvgCalibration.test.tsx --run` → 31 / 31 PASSED across all 5 test files.
- **Stage 2 Regression Tests:** `npm test -- Stage2HauntedImageHunt.test.tsx --run` → 4 / 4 PASSED.
- **TypeScript Typecheck:** `npx tsc --noEmit` → 0 errors.
- **Linter:** `npm run lint` → 0 errors.
- **Production Build:** `npm run build` → SUCCESS (3.23s).
