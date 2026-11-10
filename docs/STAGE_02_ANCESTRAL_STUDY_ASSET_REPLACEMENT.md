# Stage 02 — The Ancestral Study Image Replacement & Pumpkin SVG Recalibration Report

## 1. Executive Summary
- **Stage:** Round 01 — Stage 02: *The Haunted Image Hunt*
- **Scene:** *The Ancestral Study* (`img_01`)
- **Target Item:** Carved Jack-o'-Lantern (`pumpkin`)
- **Task Scope:** Complete replacement of the legacy study photograph with the newly approved high-quality atmosphere asset, followed by from-scratch recalibration of the concealed Pumpkin target silhouette and multi-viewport Playwright verification.

---

## 2. Asset Comparison & Replacement Metadata

| Property | Legacy Asset (Image A) | Production Replacement (Image B) |
| :--- | :--- | :--- |
| **Active Production Path** | `public/assets/stage-02/photographs/ancestral-study.jpg` | `public/assets/stage-02/photographs/ancestral-study.jpg` |
| **Secondary Mirror Path** | `public/assets/stage-2/photographs/ancestral-study.jpg` | `public/assets/stage-2/photographs/ancestral-study.jpg` |
| **Rollback Archive** | — | `backup/stage-02-rollback/ancestral-study-old-backup.jpg` |
| **Natural Dimensions** | 1280 × 857 px | **1024 × 622 px** |
| **Aspect Ratio** | ~1.4935 (crude composition) | **~1.6463 (cinematic master)** |
| **File Size** | 295,252 bytes | **440,317 bytes** (uncompressed high-fidelity source) |
| **Color Depth / Mode** | 24-bit sRGB | **24-bit sRGB** |
| **Embedded Interface** | Artificial glowing sticker pumpkin & text | **100% clean photography (zero embedded UI, zero text)** |

---

## 3. Pumpkin Location & Difficulty Alignment

- **Physical Placement:** Naturally resting in the shadowy floor recess beneath the foreground chair on the left side of the study.
- **Occlusion & Atmosphere:** Subtly partially concealed by the antique moth-eaten woolen fabric drape and the wooden chair stretchers.
- **Difficulty Grading:** Moderate / Detective Exploration. Comfortable identification achievable via normal inspection or with 2x / 3x zoom.
- **Pre-Discovery State:** Completely unhighlighted (0% opacity, transparent hit fill, zero hover glow, zero outline rectangles).

---

## 4. Recalibrated Coordinate System & SVG Path

### Geometric Boundaries (Native 1024 × 622 Coordinate System)
- **Bounding Box:**
  - `x`: `247` px (`24.15%`)
  - `y`: `352` px (`56.67%`)
  - `width`: `81` px (`7.93%`)
  - `height`: `92` px (`14.87%`)
- **Center Coordinate (Badge anchor):** `cx: 287.5, cy: 398`

### Recalibrated Organic Cubic Bézier Silhouette (`svgPath`)
```svg
M 290.0,354.0 C 291.0,354.0 292.5,352.5 293.0,354.0 C 293.5,355.5 291.8,361.7 293.0,363.0 C 294.2,364.3 297.2,361.7 300.0,362.0 C 302.8,362.3 306.8,363.3 310.0,365.0 C 313.2,366.7 316.5,369.2 319.0,372.0 C 321.5,374.8 323.5,378.3 325.0,382.0 C 326.5,385.7 327.5,390.0 328.0,394.0 C 328.5,398.0 328.5,402.2 328.0,406.0 C 327.5,409.8 326.5,413.5 325.0,417.0 C 323.5,420.5 321.3,424.0 319.0,427.0 C 316.7,430.0 313.8,432.7 311.0,435.0 C 308.2,437.3 305.2,439.5 302.0,441.0 C 298.8,442.5 294.8,443.3 292.0,444.0 C 289.2,444.7 287.5,445.0 285.0,445.0 C 282.5,445.0 279.8,444.8 277.0,444.0 C 274.2,443.2 271.0,441.7 268.0,440.0 C 265.0,438.3 261.7,436.5 259.0,434.0 C 256.3,431.5 253.8,428.3 252.0,425.0 C 250.2,421.7 248.7,418.0 248.0,414.0 C 247.3,410.0 247.7,405.3 248.0,401.0 C 248.3,396.7 248.8,392.2 250.0,388.0 C 251.2,383.8 252.7,379.5 255.0,376.0 C 257.3,372.5 260.8,369.2 264.0,367.0 C 267.2,364.8 270.3,363.7 274.0,363.0 C 277.7,362.3 283.8,364.5 286.0,363.0 C 288.2,361.5 286.3,355.5 287.0,354.0 C 287.7,352.5 289.0,354.0 290.0,354.0 Z
```

---

## 5. Responsive Viewport Verification Results

All tests executed in real Chromium via Playwright:

| Viewport | Aspect | Photograph Loaded | Pre-Discovery Invisibility | Missed Click Ignored | Zoom & Pan Alignment | Post-Discovery Outline | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1280 × 720** | 16:9 | 1024 × 622 natural | `opacity: 0.0` | Verified | Verified at 200% | `#fbbf24` with gold glow & checkmark | **PASS** |
| **1366 × 768** | 16:9 | 1024 × 622 natural | `opacity: 0.0` | Verified | Verified at 200% | `#fbbf24` with gold glow & checkmark | **PASS** |
| **1440 × 900** | 16:10 | 1024 × 622 natural | `opacity: 0.0` | Verified | Verified at 200% | `#fbbf24` with gold glow & checkmark | **PASS** |
| **1920 × 1080** | 16:9 | 1024 × 622 natural | `opacity: 0.0` | Verified | Verified at 200% | `#fbbf24` with gold glow & checkmark | **PASS** |

---

## 6. Verification Screenshots

- **Pre-Discovery Inspection Scene:** `docs/screenshots/stage2/ancestral_study_pre_discovery.png`
- **Discovered Normal View:** `docs/screenshots/stage2/ancestral_study_discovered_normal.png`
- **Discovered 200% Zoomed View:** `docs/screenshots/stage2/ancestral_study_discovered_zoom.png`

---

## 7. Configuration & File Integrity

- [x] **`STAGE2_TARGET_DEFINITIONS[0]`** updated with exact coordinates and Bézier path in `src/components/game/stage2/stage2TargetsConfig.ts`.
- [x] **`STAGE2_CANONICAL_IMAGES[0]`** updated with natural dimensions `width: 1024, height: 622` in `src/components/game/stage2/stage2TargetsConfig.ts`.
- [x] **`target-manifest.json`** updated in `public/assets/stage-02/manifest/target-manifest.json`.
- [x] **Other 7 Photographs Unmodified:** `img_02` through `img_08` retain their original assets, target configurations, and coordinates.
- [x] **Twelve Target Inventory & Progress Preserved:** Target IDs, credits (150 CR), scoring, hints, and checklist intact.
- [x] **Rollback Safeguard:** Preserved in `backup/stage-02-rollback/ancestral-study-old-backup.jpg`.

