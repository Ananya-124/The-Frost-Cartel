# FROST CARTEL — ROUND 01, STAGE 02
## MAUSOLEUM VAULT — HIDDEN SKULL REPLACEMENT & HIGH-PRECISION SVG CALIBRATION

**Document Status:** Production Certified  
**Date:** November 10, 2026  
**Engineering Discipline:** Computer Graphics, React 19 / TypeScript, SVG Interaction Architecture, Game QA  

---

### Executive Summary

In accordance with the Stage 2 hidden-object requirements, the legacy **Mausoleum Vault** photograph (`img_03`) has been replaced with the high-resolution, full-bleed master artwork (`1024 × 620 px`). The hidden target **SKULL** (`targetId: "skull"`, hotspot `hs_skull`) was completely recalibrated with a high-fidelity cubic Bézier silhouette wrapping the skull dome, eye sockets, nasal cavity, and lower jaw nestled under the draped burgundy velvet cloth at the bottom-left base of the stone sarcophagus.

---

### 1. Asset Inventory & Dimension Specifications

| Property | Legacy Asset | New Master Asset |
| :--- | :--- | :--- |
| **Photograph File** | `mausoleum-vault.jpg` (legacy low-res) | `mausoleum-vault-master.webp` & `mausoleum-vault.jpg` |
| **Asset Location** | `public/assets/stage-02/photographs/` | `public/assets/stage-02/photographs/` & `public/assets/stage-2/` |
| **Backup Path** | N/A | `backup/stage-02-rollback/mausoleum-vault-old-backup.jpg` |
| **Intrinsic Resolution**| `1024 × 1024 px` (square stretch) | **`1024 × 620 px`** (authentic panoramic full-bleed) |
| **Aspect Ratio** | 1:1 | **1.6516 : 1** (1024 / 620) |
| **Target Hotspots** | 2 (`hs_coffin`, `hs_skull`) | 2 (`hs_coffin`, `hs_skull`) |

---

### 2. Skull Target Location & Recalibrated SVG Geometry

#### Intrinsic Bounds & Percentage Metrics
- **Intrinsic Coordinate System:** `1024 × 620 px`
- **Location:** Under the hanging burgundy velvet cloth at the lower-left corner of the central stone sarcophagus.
- **Bounding Box:**
  - `x = 268 px`
  - `y = 528 px`
  - `width = 32 px`
  - `height = 34 px`
- **Normalized Percentages:**
  - `xPercent: 26.17%`
  - `yPercent: 85.16%`
  - `widthPercent: 3.13%`
  - `heightPercent: 5.48%`

#### Calibrated Cubic Bézier Silhouette (`svgPath`)
```svg
M 280 528.5
C 285 528.5 291 530 295 533
C 298 535.5 299.5 538.5 299 542
C 298.5 544.5 298 547 296.5 549
C 295.5 551 295 554 294 557
C 292 561 286 562.5 281 562.5
C 276 562.5 272 560.5 269 557
C 267.5 553 267 547 268 541
C 268.5 536 271 531.5 275 529.5
C 276.5 528.8 278.2 528.5 280 528.5 Z
```

#### Sarcophagus (`coffin` / `hs_coffin`) Geometry
To preserve full multi-target interaction without clipping in `1024 × 620` coordinates:
- `x: 220 px`, `y: 350 px`, `width: 560 px`, `height: 245 px`
- `xPercent: 21.48%`, `yPercent: 56.45%`, `widthPercent: 54.69%`, `heightPercent: 39.52%`
- Sarcophagus polygon: `230,390 280,355 740,355 780,390 770,580 230,580`

---

### 3. Strict Pre-Discovery & Post-Discovery Visual Rules

1. **Pre-Discovery State:**
   - Visual outline: 0% opacity (`stroke: transparent`, `fill: transparent`).
   - Hover highlight: Completely disabled (`pointer-events: all` for hit-testing, but no cursor glow or path color changes).
   - Pre-discovery checkmark: Completely absent.
2. **Post-Discovery State:**
   - Stroke: `#fbbf24` (Antique Gold), `stroke-width: 2.5px`, `filter: drop-shadow(0 0 10px rgba(245,158,11,0.8))`.
   - Fill: `rgba(245, 158, 11, 0.18)` soft golden wash.
   - Discovery Indicator: Circular teal checkmark badge centered on skull (`x: 284, y: 545`).
   - Counter: Evidence Journal updates from `0/12` to `1/12`.
   - Rewards: Exactly 25 Credits credited once without duplication.

---

### 4. Verification & QA Matrix

Automated Playwright tests (`scripts/verify_stage2_mausoleum_skull.py`) verified real browser rendering and interaction across standard competitive screen resolutions:

| Viewport | Intrinsic Load | Pre-Discovery 0-Glow | Burgundy Cloth Mis-Click | Skull Discovery | Zoom & Pan Stability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1280 × 720** | `1024 × 620` | Passed (0 opacity) | Passed (No trigger) | Passed (Golden outline) | Stable (0 drift) |
| **1366 × 768** | `1024 × 620` | Passed (0 opacity) | Passed (No trigger) | Passed (Golden outline) | Stable (0 drift) |
| **1440 × 900** | `1024 × 620` | Passed (0 opacity) | Passed (No trigger) | Passed (Golden outline) | Stable (0 drift) |
| **1920 × 1080**| `1024 × 620` | Passed (0 opacity) | Passed (No trigger) | Passed (Golden outline) | Stable (0 drift) |

#### Zoom & Pan Test Results
- At **100% zoom (Fit)**: Skull hit-area responds instantly to cursor clicks.
- At **200% zoom**: Interactive SVG coordinates scale via vector transform without jitter or misregistration.
- At **300% zoom**: Skull dome and jawline maintain exact 1:1 pixel overlay with the underlying WebP master image.

---

### 5. Verified Files & Artifacts

- Configuration: `src/components/game/stage2/stage2TargetsConfig.ts`
- Manifest: `public/assets/stage-02/manifest/target-manifest.json`
- Source Map: `public/assets/stage-02/manifest/photo-sources.json`
- Unit Test: `src/components/__tests__/MausoleumVaultSvgCalibration.test.tsx`
- Verification Script: `scripts/verify_stage2_mausoleum_skull.py`
- Screenshots:
  - `docs/screenshots/stage2/mausoleum_vault_pre_discovery.png`
  - `docs/screenshots/stage2/mausoleum_vault_discovered_zoom.png`
  - `docs/screenshots/stage2/mausoleum_vault_discovered_normal.png`
  - `docs/screenshots/stage2/exact_skull_fit.png`
