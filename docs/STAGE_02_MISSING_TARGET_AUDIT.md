# STAGE 02 — MISSING TARGET AUDIT REPORT
**Target Investigation: Ghost & Spider**
*Date: 2026-11-08*

## 1. Executive Summary
During initial gameplay testing of Stage 02: *The Haunted Image Hunt*, 10 out of 12 cursed relics could be discovered, but two targets (**Ghost** and **Spider**) remained persistently undiscovered (`10 / 12 FOUND`). This audit documents the exact location, photograph asset, coordinate mapping, and technical root causes behind the detection and visibility failures, as well as the corrective actions implemented.

---

## 2. Target Audit Matrix

| Target | Photograph | Exact Location | Original Coordinates | Root Cause | Fix |
|---|---|---|---|---|---|
| **Ghost** (`ghost`) | **The Haunted Mansion** (`img_05`)<br>`public/assets/stage-02/photographs/haunted-mansion.jpg` | Grand staircase wall, left of the closed double doors | `x: 420, y: 340`<br>`w: 140, h: 130`<br>(Normalized: `x: 32.81%, y: 35.42%`) | **Visual Invisibility & Inaccurate Silhouette**: The ghost was composited with 75% transparency over distressed blue peeling paint, making it a completely invisible smudge to human players. The SVG hit path was a crude 9-point polygonal dome that did not follow any recognizable ghost figure. | Composite an eerie, luminous spectral apparition with distinct glowing eyes, flowing ectoplasmic drapery, and ethereal rim lighting. Generate a precision organic Bézier SVG silhouette path and expanded hit area matching the spectral shroud. |
| **Spider** (`spider`) | **The Cursed Attic** (`img_06`)<br>`public/assets/stage-02/photographs/cursed-attic.jpg` | Central vertical timber beam supporting roof rafters | `x: 520, y: 210`<br>`w: 65, h: 65`<br>(Normalized: `x: 40.62%, y: 27.45%`) | **Contrast Loss & Polygon Hit-Box Clipping**: The spider asset was pitch-black and blended into the deep shadow of the dark brown timber beam, rendering it imperceptible. The SVG path was a tiny 7-point truncated polygon (width 60px) that clipped off the spider's 8 radiating legs, causing clicks on the legs to fail hit detection. | Recomposite a detailed, high-contrast arachnid with realistic lighting highlights on its carapace, distinct curved legs, and a soft ambient drop shadow against the wood grain. Re-extract a comprehensive multi-point SVG silhouette tracing all 8 legs and body segments. |
| **Pumpkin** (`pumpkin`) | **The Ancestral Study** (`img_01`)<br>`public/assets/stage-02/photographs/ancestral-study.jpg` | Wooden desk floor area beside chair legs | `x: 190, y: 560`<br>`w: 150, h: 105`<br>(Normalized: `x: 14.84%, y: 65.34%`) | **Crude Geometric Selection**: Selection outline used a broad, jagged polygon that formed a rectangular visual box rather than following the organic curved ribs, stem, and base of the carved jack-o'-lantern. | Rebuild the pumpkin selection geometry using cubic Bézier curves and natural fluted ribs with authentic stem geometry. Composite with ground contact shadows, ambient occlusion, and candle warmth. |

---

## 3. Detailed Technical Analysis

### 3.1 Ghost (`ghost`) in *The Haunted Mansion* (`img_05`)
* **Photograph Asset:** `public/assets/stage-02/photographs/haunted-mansion.jpg` (Original Dimensions: `1280 × 960 px`)
* **Target Center Coordinates:** `x = 490 px, y = 405 px` (Normalized: `38.28%, 42.19%`)
* **Prior SVG Path:** `M 558.0,468.5 L 421.5,467.0 L 423.5,410.0 L 440.0,370.5 L 470.0,342.5 L 510.0,342.5 L 540.0,370.5 L 558.5,410.0 L 558.0,468.5 Z`
* **Defect Detail:**
  1. **Visual Contrast:** The prior composite pasted a generic sprite at low opacity directly on mottled blue wallpaper. In standard ambient display lighting, the contrast ratio was `< 1.15:1`, rendering the target physically imperceptible.
  2. **Hit Area Inaccuracy:** The 9-point polygon was flat on top and flat on bottom, looking like a bread loaf rather than an organic ghost.
* **Remediation:**
  1. Render a glowing ethereal phantom with luminescent ectoplasm and haunting white-cyan spectral veil that contrasts clearly against the blue baroque wall.
  2. Extract smooth curved Bézier paths around the head, torso, flowing drapery, and wisps.

### 3.2 Spider (`spider`) in *The Cursed Attic* (`img_06`)
* **Photograph Asset:** `public/assets/stage-02/photographs/cursed-attic.jpg` (Original Dimensions: `1280 × 765 px`)
* **Target Center Coordinates:** `x = 552 px, y = 242 px` (Normalized: `43.16%, 31.68%`)
* **Prior SVG Path:** `M 584.0,273.5 L 521.5,273.0 L 522.0,220.0 L 545.0,211.5 L 565.0,211.5 L 584.5,220.0 L 584.0,273.5 Z`
* **Defect Detail:**
  1. **Hit Target Clipping:** The previous polygon had coordinates `min_x=521.5, max_x=584.0, min_y=211.5, max_y=273.5` (a box of `62.5 × 62.0 px`). However, the spider's legs span over `85 × 85 px`. Any click on the outer legs landed outside the polygon and was rejected as a "missed click".
  2. **Visibility:** The dark timber beam had an average luminance of `Y = 24`, and the spider had `Y = 18`, making it visually indistinguishable from natural timber knots.
* **Remediation:**
  1. Recomposite the spider with specular chitin highlights on its cephalothorax and abdomen, and clear leg shadows cast onto the timber face.
  2. Map an expansive 50+ point SVG contour encompassing all 8 articulated legs so any click on or near the spider triggers successful discovery.

---

## 4. Verification Protocol
1. Temporary debug overlay integrated in developer calibration tool (`TargetCalibrationModal.tsx`).
2. Both targets verified discoverable under normal zoom (1.0x), 1.5x, 2.0x, and 3.0x zoom levels.
3. Automated vitest and Playwright end-to-end clicks confirming full discovery progression to `12 / 12 FOUND`.

