# FROST CARTEL — ROUND 01, STAGE 02
## THE HAUNTED IMAGE HUNT: CURSED ATTIC REDESIGN & DIFFICULTY CALIBRATION

**Document Status:** Production Complete  
**Date:** 2026-11-12  
**Target Photographic Asset:** `img_06` — The Cursed Attic  
**Deployment Path:** `/assets/stage-02/photographs/cursed-attic-master.webp` & `/assets/stage-02/photographs/cursed-attic.jpg`  

---

### 1. Executive Summary & Problem Resolution

The legacy photographic asset for The Cursed Attic used an outdated 1200 × 896 px composition that suffered from two major gameplay flaws:
1. **Low Puzzle Difficulty & Immersion Break:** A cartoonish, bright-orange-banded clip-art witch hat was placed openly on bare wooden floorboards, completely breaking Gothic horror immersion.
2. **Debug Overlays Baked In:** An orange debug rectangle and visible markers were present in the source image.
3. **Out-of-Sync Hit Targets:** The SVG click targets did not align with the true physical objects across responsive viewports.

#### The Calibrated Solution:
1. **Master Artwork Integration:** Integrated high-resolution `1024 × 616 px` master atmospheric Gothic artwork (`cursed-attic-master.webp`).
2. **Natural Object Camouflage:** The Witch's Hat is naturally nestled among folds of deep burgundy velvet and antique book stacks, creating a challenging yet fair hidden-object discovery experience.
3. **Zero Pre-Discovery Clutter:** All debug boxes, orange markers, and pre-discovery stroke outlines have been 100% eliminated. Hit targets render with `opacity-0` and `hover:opacity-0`.
4. **Organic Geometric Silhouettes:**
   - **Pointed Witch Hat (`witch_hat` / `hs_witch_hat`):** Precise 17-point contour hugging the hat's peaked crown, ribbon, and circular brim.
   - **Crawling Spider (`spider` / `hs_spider`):** Multi-point arachnid silhouette spanning the cephalothorax, abdomen, and eight spindly legs perched atop the rafter picture frame.

---

### 2. Intrinsic Coordinate Specifications (1024 × 616 px ViewBox)

| Attribute | Pointed Witch Hat (`hs_witch_hat`) | Crawling Spider (`hs_spider`) |
| :--- | :--- | :--- |
| **Target ID** | `'witch_hat'` | `'spider'` |
| **Hotspot ID** | `'hs_witch_hat'` | `'hs_spider'` |
| **Difficulty Rating** | `HARD` | `HARD` |
| **Coordinates (X, Y)** | `(368, 402)` | `(414, 140)` |
| **Bounding Box (W × H)** | `72 × 55 px` | `88 × 80 px` |
| **Percentage (X, Y)** | `35.94%, 65.26%` | `40.43%, 22.73%` |
| **Percentage (W × H)** | `7.03%, 8.93%` | `8.59%, 12.99%` |

#### Calibrated SVG Path: Pointed Witch Hat (`witch_hat`)
```svg
M 406 402 L 412 416 L 418 430 L 423 440 L 432 446 L 440 452 L 428 455 L 415 457 L 403 457 L 390 455 L 378 453 L 368 452 L 376 446 L 385 442 L 392 440 L 397 430 L 401 416 Z
```

#### Calibrated SVG Path: Crawling Spider (`spider`)
```svg
M 458 150 L 472 140 L 480 142 L 466 154 L 484 153 L 500 160 L 484 170 L 496 180 L 502 192 L 478 186 L 482 204 L 478 220 L 464 198 L 458 192 L 452 198 L 438 220 L 434 204 L 438 186 L 414 192 L 420 180 L 432 170 L 416 160 L 432 153 L 450 154 L 436 142 L 444 140 Z
```

---

### 3. Verification & Quality Assurance

- **Unit Test Suite:** `src/components/__tests__/CursedAtticSvgCalibration.test.tsx` (7/7 passing).
- **TypeScript Typecheck:** `npx tsc --noEmit` — 0 errors.
- **Manifest Synchronization:** `public/assets/stage-02/manifest/target-manifest.json` updated with identical parameters.
- **Gameplay Integrity:** Canonical answer tokens (`witch_hat`, `spider`), credit mechanics, and hint systems remain fully preserved.

