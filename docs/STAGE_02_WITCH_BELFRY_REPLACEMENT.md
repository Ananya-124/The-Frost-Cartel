# FROST CARTEL — ROUND 01, STAGE 02
## THE HAUNTED IMAGE HUNT: THE WITCH'S BELFRY REPLACEMENT & DUAL SVG TARGET CALIBRATION

**Document Status:** Production Complete  
**Date:** 2026-11-10  
**Target Photographic Asset:** `img_04` — The Witch's Belfry  
**Deployment Path:** `/assets/stage-02/photographs/witch-belfry-master.webp` & `/assets/stage-02/photographs/witch-belfry.jpg`  

---

### 1. Executive Summary & Problem Resolution

The prior photographic asset for The Witch's Belfry used an uncalibrated 1280 × 1920 portrait format with baked-in yellow debug bounding boxes, green checkmark overlays, and coordinate misalignment.

This deployment delivers:
1. **High-Fidelity Artwork Replacement:** Upgraded to high-definition `1024 × 624 px` horizontal gothic cathedral architecture featuring high-vaulted stone arches, ornate tracery, an upper arch bat carving, and a mid-pillar candle sconce.
2. **Dual Target Geometry Recalibration:**
   - **Nocturnal Bat (`bat` / `hs_bat`):** Recalibrated to the high vaulted ceiling apex within dark Gothic stone masonry (`x: 468, y: 100, w: 125, h: 20`).
   - **Altar Candle (`candle` / `hs_candle`):** Recalibrated to the ornate wall sconce on the central stone pillar (`x: 402, y: 376, w: 13, h: 25`).
3. **Organic Cubic Bézier Silhouettes:** Discarded all old multi-point polylines; replaced with smooth organic Bézier curves matching the visible features in the artwork.
4. **Zero Pre-Discovery Footprint:** Target hit-paths are completely invisible (`opacity-0`, `hover:opacity-0`, `stroke="transparent"`). Only upon successful client-side or authoritative discovery are the antique gold outline (`#fbbf24`) and teal checkmark rendered.
5. **Target Independence & Zero Cross-Contamination:** Bat and candle coordinates are separated by > 250 px vertically and maintain disjoint horizontal domains.

---

### 2. Intrinsic Coordinate Specifications

| Attribute | Nocturnal Bat (`hs_bat`) | Altar Candle (`hs_candle`) |
| :--- | :--- | :--- |
| **Target ID** | `'bat'` | `'candle'` |
| **Hotspot ID** | `'hs_bat'` | `'hs_candle'` |
| **Image Asset** | `img_04` (`1024 × 624 px`) | `img_04` (`1024 × 624 px`) |
| **Coordinates (X, Y)** | `(468, 100)` | `(402, 376)` |
| **Bounding Box (W × H)** | `125 × 20 px` | `13 × 25 px` |
| **Percentage (X, Y)** | `45.70%, 16.03%` | `39.26%, 60.26%` |
| **Percentage (W × H)** | `12.21%, 3.21%` | `1.27%, 4.01%` |
| **Difficulty Rating** | `HARD` | `MEDIUM` |
| **Hit Stroke Width** | `17px` (with generous margin) | `17px` (with generous margin) |

#### Calibrated SVG Path: Nocturnal Bat
```svg
M 468 110 C 475 107 485 106 496 105 C 506 106 515 107 520 107 C 524 105 528 103 531 102 C 534 103 538 105 542 104 C 550 102 562 101 575 102 C 582 101 588 101 593 101 C 589 105 583 107 577 107 C 572 109 565 112 557 112 C 550 113 543 115 539 116 C 536 118 534 119 531 119 C 528 119 526 118 522 116 C 518 115 510 113 504 112 C 496 112 489 111 482 112 C 475 112 470 111 468 110 Z
```

#### Calibrated SVG Path: Altar Candle
```svg
M 408 376 C 410 376 412 377 413 378 C 414 379 412 380 411 381 C 413 381.5 414 382 414 383 C 414.5 388 415 394 415 398 C 415 400 414 401 413 401 C 410 401 406 401 403 401 C 402 401 402 400 402 398 C 402 394 402.5 388 402 383 C 402 382 403.5 381.5 405 381 C 404 380 403.5 379 406 378 C 407 377 407 376 408 376 Z
```

---

### 3. File System Modifications

1. `public/assets/stage-02/photographs/witch-belfry-master.webp` — Full resolution WebP master asset.
2. `public/assets/stage-02/photographs/witch-belfry.jpg` — High quality JPG fallback asset.
3. `public/assets/stage-2/photographs/witch-belfry-master.webp` & `.jpg` — Mirrored aliases for legacy route handling.
4. `src/components/game/stage2/stage2TargetsConfig.ts` — Updated `STAGE2_TARGET_DEFINITIONS` indices 4 & 5 and `STAGE2_CANONICAL_IMAGES[3]` dimensions (`1024 × 624`).
5. `public/assets/stage-02/manifest/photo-sources.json` — Updated filename to `witch-belfry-master.webp`.
6. `public/assets/stage-02/manifest/target-manifest.json` — Updated bat and candle definitions and SVG paths.
7. `src/components/__tests__/WitchBelfrySvgCalibration.test.tsx` — Complete unit test suite verifying geometric precision, zero-leak pre-discovery state, click interactions, and discovery styling.
8. `backup/stage-02-rollback/witch-belfry-old-backup.jpg` — Preserved copy of previous asset.

---

### 4. Automated Verification Results

- **Unit Test Suite:** `npm test -- WitchBelfrySvgCalibration.test.tsx --run` → 7 / 7 PASSED (143ms).
- **TypeScript Typecheck:** `npx tsc --noEmit` → 0 errors.
- **Linter:** `npm run lint` → 0 errors.
- **Production Build:** `npm run build` → SUCCESS.

