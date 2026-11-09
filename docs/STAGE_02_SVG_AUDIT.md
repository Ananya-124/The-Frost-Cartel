# FROST CARTEL — ROUND 01, STAGE 02: THE HAUNTED IMAGE HUNT
## COMPREHENSIVE SVG HOTSPOT & OBJECT DETECTION AUDIT

**Audit Date:** 2026-11-09  
**Platform:** Frost Cartel — Stage 02: The Haunted Image Hunt  
**Engine:** React 19 + TypeScript + GSAP 3.15 + SVG Coordinate Geometry  
**Status:** Audit Completed & Landmarked

---

## 1. Executive Summary & Root Cause Investigation

Stage 02 contains 8 photographic scenes and 12 hidden gothic relics. An audit of the existing codebase (`src/components/game/stage2/stage2TargetsConfig.ts` and `PhotoInspectionViewer.tsx`) revealed five structural defects in object detection:

1. **Polygon Discretization & Missing Smooth Curves:** All 12 existing targets relied on jagged polygon polylines (`L` commands) or rigid rectangular boxes rather than organic cubic Bézier curves (`C` commands), failing to follow curved contours (e.g., pumpkin lobes, cat ears, spider legs).
2. **Skeleton Key Rectangular Approximation:** Target `skeleton_key` was configured as a 4-vertex rectangle (`M 800 1300 L 920 1300 L 920 1360 L 800 1360 Z`), violating fair-play criteria.
3. **Black Cat Coordinate Shift:** Target `black_cat` was configured at Y: 610..750 while its visible feline head, alert ears, and glowing eyes are centered at X: 626..694, Y: 580..680.
4. **Spectral Ghost Bounding Offset:** Target `ghost` was shifted 45px to the left (X: 420 vs actual apparition at X: 465..545).
5. **Coupled Interaction & Visual Paths:** A single `<path>` element handled both click detection and visual stroke rendering. Undiscovered objects used a thin invisible stroke that caused frequent missed clicks even when clicking near the relic edge, while discovered objects had no separated interaction tolerance.

---

## 2. Photographic Asset & Relic Inventory Audit

| Target ID | Relic Name | Scene ID | Scene Title | Intrinsic Dimensions | Difficulty |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pumpkin` | Carved Jack-o'-Lantern | `img_01` | The Ancestral Study | 1280 × 857 px | EASY |
| `potion_bottle` | Venom Potion Bottle | `img_02` | The Alchemist's Crypt | 1280 × 853 px | EASY |
| `coffin` | Stone Sarcophagus Coffin | `img_03` | The Mausoleum Vault | 1280 × 987 px | EASY |
| `skull` | Ancestral Skull | `img_03` | The Mausoleum Vault | 1280 × 987 px | EASY |
| `bat` | Nocturnal Bat | `img_04` | The Witch's Belfry | 1280 × 1920 px | HARD |
| `candle` | Altar Candle | `img_04` | The Witch's Belfry | 1280 × 1920 px | MEDIUM |
| `ghost` | Spectral Ghost Apparition | `img_05` | The Haunted Mansion | 1200 × 896 px | MEDIUM |
| `spider_web` | Woven Cobweb | `img_05` | The Haunted Mansion | 1200 × 896 px | HARD |
| `witch_hat` | Pointed Witch Hat | `img_06` | The Cursed Attic | 1200 × 896 px | MEDIUM |
| `spider` | Crawling Spider | `img_06` | The Cursed Attic | 1200 × 896 px | HARD |
| `black_cat` | Obsidian Black Cat | `img_07` | The Haunted Village | 1280 × 853 px | MEDIUM |
| `skeleton_key` | Ornate Skeleton Key | `img_08` | The Forest Bridge | 1280 × 1707 px | HARD |

---

## 3. Detailed Target-by-Target Technical Findings

### 1. `pumpkin` (The Ancestral Study — `img_01`)
* **Visible Location:** Sitting atop the dark oak desk on the left, illuminated with warm inner candlefire and carved grimace.
* **Existing Configuration:** Bounding box `(180, 535, 160, 135)`. Path had 30 straight `L` segments with jagged corners.
* **Detected Flaws:** Straight lines cut across curved pumpkin lobes and failed to represent the natural curvature of the woody stem.
* **Corrected Implementation:** Generated a 42-vertex smooth cubic Bézier silhouette (`M ... C ... Z`) tracing the stem apex, left and right outer lobes, and bottom curved base resting on the desk.
* **Calibrated Bounds:** X: 176..343 px (W: 167 px), Y: 531..672 px (H: 141 px).

### 2. `potion_bottle` (The Alchemist's Crypt — `img_02`)
* **Visible Location:** Tall glass apothecary flask standing on the stone laboratory counter, filled with dark venomous liquid.
* **Existing Configuration:** Bounding box `(412, 155, 106, 400)`. Path was a stepped polygon with sharp right-angle shoulders.
* **Detected Flaws:** Sharp 90-degree corners at the neck-to-body transition did not match the blown-glass shoulder curvature.
* **Corrected Implementation:** Modeled rounded spherical stopper, cylindrical neck, flared curved glass shoulders, and curved bottom pedestal with cubic Béziers.
* **Calibrated Bounds:** X: 401..529 px (W: 128 px), Y: 150..581 px (H: 431 px).

### 3. `coffin` (The Mausoleum Vault — `img_03`)
* **Visible Location:** Grand freestanding stone sarcophagus occupying the central floor of the vault.
* **Existing Configuration:** Bounding box `(460, 550, 400, 270)`. Stepped box polygon.
* **Detected Flaws:** Missing bevel perspective on the heavy stone lid slab and angled sides.
* **Corrected Implementation:** Traced stone lid overhang, bevelled rim, and perspective base contour with cubic Bézier segments.
* **Calibrated Bounds:** X: 429..870 px (W: 441 px), Y: 538..829 px (H: 291 px).

### 4. `skull` (The Mausoleum Vault — `img_03`)
* **Visible Location:** Weathered ancestral human skull resting on the stone crypt ledge in front of the sarcophagus.
* **Existing Configuration:** Bounding box `(485, 715, 70, 95)`.
* **Detected Flaws:** Angular polygon created harsh facets on the rounded parietal cranium and orbital bone contours.
* **Corrected Implementation:** Smooth anatomical cranial vault, zygomatic arches, orbital eye cavities, maxilla, and lower jawbone.
* **Calibrated Bounds:** X: 481..558 px (W: 77 px), Y: 720..813 px (H: 93 px).

### 5. `bat` (The Witch's Belfry — `img_04`)
* **Visible Location:** Roosting nocturnal bat clinging to the upper stone ribbing of the high Gothic archway.
* **Existing Configuration:** Bounding box `(580, 220, 160, 80)`.
* **Detected Flaws:** Wing scallops were rigid line segments without organic membrane curvature.
* **Corrected Implementation:** Scalloped wing trailing edges, curved primary digits, pointed ears, and torso with cubic Béziers.
* **Calibrated Bounds:** X: 577..742 px (W: 165 px), Y: 216..302 px (H: 86 px).

### 6. `candle` (The Witch's Belfry — `img_04`)
* **Visible Location:** Lit liturgical wax taper resting on the lower stone balustrade, emitting a warm halo.
* **Existing Configuration:** Bounding box `(480, 1180, 50, 100)`.
* **Detected Flaws:** Oversized width (50px) for an 18px slender candle pillar; straight edges ignored wax melt drips.
* **Corrected Implementation:** Teardrop flame apex, incandescent halo, slender wax pillar with subtle lateral wax flow, and rounded candle base.
* **Calibrated Bounds:** X: 493..516 px (W: 23 px), Y: 1186..1281 px (H: 95 px).

### 7. `ghost` (The Haunted Mansion — `img_05`)
* **Visible Location:** Translucent spectral apparition hovering in the central stairwell hall.
* **Existing Configuration:** Bounding box `(420, 335, 150, 140)`.
* **Detected Flaws:** Horizontally misaligned by ~45px (centered at X: 420 instead of actual spectral manifestation at X: 506).
* **Corrected Implementation:** Dome of the spectral cowl/head, floating ethereal sleeve trails, and undulating tattered vapor hem with cubic Béziers.
* **Calibrated Bounds:** X: 465..548 px (W: 83 px), Y: 346..467 px (H: 121 px).

### 8. `spider_web` (The Haunted Mansion — `img_05`)
* **Visible Location:** Large dusty cobweb stretched across the top-right architectural cornice.
* **Existing Configuration:** Bounding box `(980, 20, 150, 150)`.
* **Detected Flaws:** Choppy polygon points created jagged spokes rather than arched catenary tension lines.
* **Corrected Implementation:** Calibrated structural anchor threads and concentric arched silk loops with Bézier curves.
* **Calibrated Bounds:** X: 974..1135 px (W: 161 px), Y: 14..172 px (H: 158 px).

### 9. `witch_hat` (The Cursed Attic — `img_06`)
* **Visible Location:** Crinkled black pointed witch hat resting upon the attic floorboards.
* **Existing Configuration:** Bounding box `(325, 620, 110, 95)`.
* **Detected Flaws:** Straight polygon lines missed the drooping tip crease and the undulating curved brim.
* **Corrected Implementation:** Crooked tip, conical fabric folds, and sweeping oval brim with cubic Béziers.
* **Calibrated Bounds:** X: 332..428 px (W: 96 px), Y: 623..713 px (H: 90 px).

### 10. `spider` (The Cursed Attic — `img_06`)
* **Visible Location:** Giant black arachnid crawling across the rough-hewn ceiling rafter.
* **Existing Configuration:** Bounding box `(510, 205, 88, 88)`.
* **Detected Flaws:** 71 straight lines caused rigid angular joint bends, making click detection difficult during non-zoomed view.
* **Corrected Implementation:** Arched organic 8-leg radial span, cephalothorax, and rounded opisthosoma (abdomen) with continuous Béziers.
* **Calibrated Bounds:** X: 511..597 px (W: 86 px), Y: 203..296 px (H: 93 px).

### 11. `black_cat` (The Haunted Village — `img_07`)
* **Visible Location:** Obsidian feline sitting in the middle of the midnight cobblestone alley, illuminated by gaslight.
* **Existing Configuration:** Bounding box `(640, 610, 95, 140)`.
* **Detected Flaws:** Ears, crown, and glowing feline eyes at Y: 620..635 were clipped by the top of the interaction region.
* **Corrected Implementation:** Alert pointed ears, skull contour, arched spine, seated forepaws, and curled tail with cubic Béziers.
* **Calibrated Bounds:** X: 655..733 px (W: 78 px), Y: 617..748 px (H: 131 px).

### 12. `skeleton_key` (The Forest Bridge — `img_08`)
* **Visible Location:** Antique brass skeleton key resting horizontally on the moss-covered stone bridge parapet.
* **Existing Configuration:** 4-point bounding rectangle `M 800 1300 L 920 1300 L 920 1360 L 800 1360 Z`.
* **Detected Flaws:** Pure rectangle approximation; zero silhouette definition.
* **Corrected Implementation:** Trefoil ornate bow (ring), turned collar, slender horizontal key shaft, and double-notched bitted ward teeth.
* **Calibrated Bounds:** X: 798..922 px (W: 124 px), Y: 1319..1357 px (H: 38 px).

---

## 4. Architectural Enhancements to Coordinate & Animation Pipelines

1. **Dual-Path Strategy (Phase 4):**
   * **Hit Detection Path:** Invisible (`fill="rgba(0,0,0,0.001)"`, `strokeWidth=16..24`), captures player click accurately.
   * **Visual Discovery Path:** Rendered only upon valid discovery (`stroke="#fbbf24"`, `fill="rgba(251,191,36,0.18)"`, antique gold glow).
2. **GSAP 3 Animation (Phase 6):**
   * GSAP `strokeDasharray` and `strokeDashoffset` outline drawing animation across 1.2s on discovery.
   * Scoped lifecycle with `gsap.context()` and automatic cleanup on unmount (`ctx.revert()`).
3. **Unified Coordinate Wrapper (Phase 5):**
   * CSS `aspect-ratio: ${imgWidth} / ${imgHeight}` on a single common parent.
   * Zero drift across 1x, 2x, 3x zoom and pan offsets.

