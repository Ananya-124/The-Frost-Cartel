# Stage 02: The Haunted Image Hunt — The Alchemist's Crypt (Apothecary)
## Asset Replacement, Letterbox Trimming & Precision SVG Calibration Report

**Author:** Principal Computer Graphics Engineer, Senior React/TS Engineer & Hidden-Object Game Specialist  
**Date:** November 10, 2026  
**Status:** COMPLETE & VERIFIED  

---

## 1. Executive Summary

As part of the Round 01 Stage 02 asset refinement, the legacy apothecary photograph for **The Alchemist's Crypt** (`img_02`) has been completely replaced with the newly designed high-fidelity gothic artwork. The generated top and bottom dark matte/letterbox strips were trimmed to preserve the exact photographic scene at intrinsic dimensions of **1024 × 561 px**.

The target hidden object—the **Venom Potion Bottle** (`targetId: "potion_bottle"`, `hotspotId: "hs_potion"`)—was identified as the tall, slender amber glass bottle with a cork stopper positioned near the centre-left on the wooden shelf behind dried lavender and adjacent laboratory glassware. All legacy SVG coordinates calibrated for the old photograph were discarded, and a new organic cubic Bézier silhouette was mapped to the exact contours of the bottle (cork, glass lip collar, narrow neck, flared shoulder, cylindrical body, and base contour).

---

## 2. Asset Reference & Dimensions

| Property | Legacy Asset (Image A) | Production Asset (Image B) |
| :--- | :--- | :--- |
| **Asset Path (WebP)** | N/A | `/assets/stage-02/photographs/apothecary-hidden-potion-master.webp` |
| **Asset Path (JPEG)** | `/assets/stage-02/photographs/alchemists-crypt.jpg` | `/assets/stage-02/photographs/alchemists-crypt.jpg` |
| **Backup Path** | N/A | `backup/stage-02-rollback/alchemists-crypt-old-backup.jpg` |
| **Intrinsic Dimensions** | 1280 × 853 px | **1024 × 561 px** (trimmed from 1024 × 617 px source) |
| **Trimmed Matte** | N/A | Top: rows 0–28, Bottom: rows 590–616 |
| **Target ID** | `potion_bottle` | `potion_bottle` |
| **Hotspot ID** | `hs_potion` | `hs_potion` |
| **Target Name** | Venom Potion Bottle | Venom Potion Bottle |
| **Award / Credits** | 150 CR (Stage total) | 150 CR (Stage total, preserved) |

---

## 3. Calibrated SVG Geometry & Bounding Coordinates

### Coordinate Matrix (1024 × 561 Native ViewBox)

| Coordinate Property | Canonical Pixel Value | Viewport Percentage |
| :--- | :--- | :--- |
| **Origin X (`x`)** | `370` | **36.13%** |
| **Origin Y (`y`)** | `122` | **21.75%** |
| **Width (`width`)** | `55` | **5.37%** |
| **Height (`height`)** | `202` | **36.01%** |
| **Max X (`x + width`)** | `425` | **41.50%** |
| **Max Y (`y + height`)** | `324` | **57.76%** |

### Calibrated Organic Cubic Bézier Path

```svg
M 388 126 C 388 123.5 392 122.5 396.5 122.5 C 401 122.5 405 123.5 405 126 L 405 144 C 406 145 407 147 406.5 149 C 406 151 405 152 404.5 155 C 404 165 403.5 180 403 195 C 403 205 407 215 413 223 C 418 229 423 234 424 242 C 424.5 255 424.5 275 424 295 C 423.5 305 422 314 420 319 C 415 322 405 324 396.5 324 C 388 324 378 322 374 319 C 372.5 314 371.5 305 371 295 C 370.5 275 370.5 255 371 242 C 372 234 376 229 381 223 C 386.5 215 388 205 388 195 C 387.5 180 387 165 386.5 155 C 386 152 385 151 384.5 149 C 384 147 385 145 386 144 L 387 126 Z
```

### Anatomical Landmark Breakdown
1. **Cork Stopper (`y: 122.5–144, x: 388–405`)**: Starts at top center `(396.5, 122.5)` with rounded chamfer, vertically descending along cork grain to bottle mouth.
2. **Glass Lip Collar (`y: 144–155, x: 384.5–406.5`)**: Slightly flared glass rim sealing the cork into the bottle aperture.
3. **Narrow Neck (`y: 155–195, x: 387–404`)**: Tall, slender vertical neck with specular illumination highlight.
4. **Shoulder Flare (`y: 195–242, x: 371–424`)**: Smooth double-curved flare transitioning from neck to main body.
5. **Cylindrical Body (`y: 242–295, x: 370.5–424.5`)**: Tall amber glass body carrying antique parchment label with botanical sketch.
6. **Base Contour (`y: 295–324, x: 374–420`)**: Gentle bottom curvature resting on shelf behind lavender sprigs.

---

## 4. Multi-Viewport & Interaction Verification

Browser automation testing was performed across the 4 required standard viewports with Chromium via Playwright against the live dev server (`http://localhost:5173`):

| Viewport | Status | Pre-Discovery Opacity | Missed Click Ignored | Zoom Alignment | Discovered Stroke |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1280 × 720** | **PASSED 100%** | `0.0` (Invisible) | YES (No discovery) | 200% Preserved | `#fbbf24` |
| **1366 × 768** | **PASSED 100%** | `0.0` (Invisible) | YES (No discovery) | 200% Preserved | `#fbbf24` |
| **1440 × 900** | **PASSED 100%** | `0.0` (Invisible) | YES (No discovery) | 200% Preserved | `#fbbf24` |
| **1920 × 1080** | **PASSED 100%** | `0.0` (Invisible) | YES (No discovery) | 200% Preserved | `#fbbf24` |

### Interaction Checklist Verified
- [x] **0 Pre-Discovery Visuals**: Hit path is completely invisible (`opacity: 0`, `hover:opacity: 0`).
- [x] **No Hover Glow**: Hovering over the bottle displays only `cursor: crosshair` without borders or tooltips.
- [x] **Missed Click Shielding**: Clicking neighbouring bottles (`b05`, `b07`, books, magnifying glass) does NOT discover the potion.
- [x] **Precise Discovery Click**: Clicking the calibrated potion bottle immediately triggers `onHotspotClick`.
- [x] **Restrained Golden Outline**: Discovery reveals `#fbbf24` antique gold stroke with GSAP outline drawing and `url(#gold-glow)`.
- [x] **Discovered Badge**: Emerald circle with checkmark (`✓`) renders at `(cx: 397.5, cy: 223.25)`.
- [x] **Checklist Progression**: Evidence checklist counter updates accurately from `0 / 12` to `1 / 12`.
- [x] **Zoom & Pan Zero-Drift**: SVG overlay and image share identical `viewBox="0 0 1024 561"` and coordinate transformation space.

---

## 5. Visual Artifacts & Proof of Verification

- **Pre-Discovery Scene (1920 × 1080)**: `docs/screenshots/stage2/apothecary_pre_discovery.png`
- **Post-Discovery 2x Zoom (1920 × 1080)**: `docs/screenshots/stage2/apothecary_discovered_zoom.png`
- **Post-Discovery Full Scene (1920 × 1080)**: `docs/screenshots/stage2/apothecary_discovered_normal.png`
- **Silhouette Detail & Fit**: `docs/screenshots/stage2/exact_bottle_fit.png`

---

## 6. Regression & Integrity Summary
- **TypeScript**: `npx tsc --noEmit` exited with 0 errors.
- **Linter**: `npx oxlint` exited with 0 errors.
- **Unit & Integration Tests**: 39 test suites / 216 tests passed cleanly.
- **Production Build**: `npm run build` completed successfully.
- **Other 7 Photographs**: Completely untouched (`ancestral-study.jpg`, `cursed-attic.jpg`, `forest-bridge.jpg`, `haunted-mansion.jpg`, `haunted-village.jpg`, `mausoleum-vault.jpg`, `witch-belfry.jpg`).

