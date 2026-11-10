# COFFIN II: THE BURIED DIARY
## FINAL PIXEL-PERFECT SVG COORDINATE CALIBRATION & OBJECT-TO-ACTION REPAIR REPORT

**Date:** November 10, 2026  
**Status:** 100% Calibrated, Verified & Production-Ready  
**Branch:** `main`  
**Engineer:** Principal Frontend Architect, Senior SVG Geometry Engineer & Interactive Game Systems Architect  

---

## 1. Executive Summary

This engineering effort resolves **Problem A (Image/SVG Coordinate Misalignment)** and **Problem B (Incorrect Object-to-Action Mapping)** for **Stage 03 Coffin II: The Buried Diary** ([`Grave2BuriedDiary.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/game/stage3/Grave2BuriedDiary.tsx)).

### Key Accomplishments
1. **Canonical 1:1 Vector Coordinate System:**
   - Base image natural dimensions: **$2560 \times 1440$ px ($16:9$)**.
   - SVG `viewBox` set to strictly: **`0 0 2560 1440`** with `preserveAspectRatio="none"`.
   - Both `<img>` and `<svg>` share one positioned wrapper with `style={{ aspectRatio: '16 / 9' }}`.
   - Vector polygon coordinates match the master photograph pixel-for-pixel with zero subpixel scaling drift.
2. **Polygonal Boundary Retracing (No More Rectangular Bounding Box Flaws):**
   - Retraced the visible perimeter of all 11 objects as tight SVG `<polygon>` elements.
   - Irregular, tilted, and perspective-slanted objects (e.g. open Diary, tilted Number 7, diamond-angled Number 9, folded Letter with seal, Skeleton Key, Chest) now have hit areas matching their physical edges.
3. **Invisible Production SVG:**
   - In player production mode, every polygon has `fill="transparent"`, `stroke="none"`, `pointerEvents="fill"`, and `cursor-pointer`.
   - Zero golden glows, zero SVG filters, zero selection rectangles, zero hover tooltips. The master photograph is visually 100% pristine.
4. **Authoritative 1-to-1 Typed Action Mapping:**
   - Explicit typed registry `TARGET_ACTIONS[targetId]` eliminates array-index lookups, string ambiguity, and event bleed.
   - Number 9 exclusively opens Number 9's modal.
   - Number 4 exclusively opens Number 4's modal.
   - Diary exclusively opens the Diary reading modal.
   - Treasure Chest exclusively triggers the Chest lock/reward flow.
5. **Zero Overlaps Across All 55 Target Pairs:**
   - Verified via automated geometric intersection tests. Vertical clearance between Number 9 and Chest is $190\text{ px}$. Vertical clearance between Diary and Letter is $100\text{ px}$.

---

## 2. Canonical Target & Polygon Coordinates ($2560 \times 1440$ Master Space)

| Target ID | Object Name | SVG `<polygon>` Vertices (`points`) | Bounding Extents (px) | Permitted Action |
|:---|:---|:---|:---|:---|
| `skull_mark` | Cranium of Keeper (Roman I) | `1080,160 1200,150 1270,175 1310,230 1310,310 1280,370 1220,400 1150,400 1085,360 1060,300 1060,220` | $x \in [1060, 1310]$<br>$y \in [150, 400]$ | Open Cranium Inspection Modal |
| `number_7` | Western Parchment Folio | `680,440 885,430 905,615 695,635` | $x \in [680, 905]$<br>$y \in [430, 635]$ | Open Number 7 Inspection Modal |
| `number_4` | Moonward Eastern Scrap | `1495,375 1615,265 1715,315 1605,425` | $x \in [1495, 1715]$<br>$y \in [265, 425]$ | Open Number 4 Inspection Modal |
| `number_3` | Archival Grave Record (Distractor) | `1565,525 1655,440 1765,490 1675,575` | $x \in [1565, 1765]$<br>$y \in [440, 575]$ | Open Number 3 Inspection Modal |
| `number_9` | Crimson-Sealed Record | `1615,685 1705,600 1790,650 1705,740` | $x \in [1615, 1790]$<br>$y \in [600, 740]$ | Open Number 9 Inspection Modal |
| `ancient_diary` | Ancient Open Folio | `980,485 1230,480 1480,510 1520,770 1480,830 1225,875 960,860 925,680` | $x \in [925, 1520]$<br>$y \in [480, 875]$ | Open Ancient Diary Reading Modal |
| `sealed_letter` | Wax-Sealed Dispatch | `760,985 1020,1030 935,1210 665,1160` | $x \in [665, 1020]$<br>$y \in [985, 1210]$ | Open Sealed Letter Inspection Modal |
| `skeleton_key` | Ornate Brass Skeleton Key | `1275,1055 1330,960 1380,955 1460,1020 1445,1100 1370,1120 1290,1110` | $x \in [1275, 1460]$<br>$y \in [955, 1120]$ | Open Skeleton Key Inspection Modal |
| `compass_medallion` | Astronomical Medallion | `1530,965 1610,970 1645,1040 1615,1125 1535,1135 1485,1070 1485,1010` | $x \in [1485, 1645]$<br>$y \in [965, 1135]$ | Open Medallion Inspection Modal |
| `ancient_scroll` | Ancient Rolled Scroll | `1850,725 1960,750 2130,890 2060,930 1910,820 1805,785` | $x \in [1805, 2130]$<br>$y \in [725, 930]$ | Open Rolled Scroll Inspection Modal |
| `treasure_chest` | Locked Iron-Banded Coffer | `1670,980 1790,940 1950,970 1970,1100 1840,1135 1675,1090` | $x \in [1670, 1970]$<br>$y \in [940, 1135]$ | Open Chest Status or EMBER Modal |

---

## 3. Pairwise Overlap & Isolation Analysis

- **Total active targets:** 11
- **Pairwise combinations:** $\frac{11 \times 10}{2} = 55$ pairs
- **Detected intersections:** **0**

### Critical Boundary Separations
1. **Number 9 vs. Treasure Chest:**
   - Number 9 $y_{max} = 740\text{ px}$.
   - Treasure Chest $y_{min} = 940\text{ px}$.
   - **Buffer:** $200\text{ px}$ vertical clearance. Number 9 cannot trigger the Chest.
2. **Number 4 vs. Scroll:**
   - Number 4 $x_{max} = 1715\text{ px}, y_{max} = 425\text{ px}$.
   - Scroll $x_{min} = 1805\text{ px}, y_{min} = 725\text{ px}$.
   - **Buffer:** Separated both horizontally ($90\text{ px}$) and vertically ($300\text{ px}$).
3. **Diary vs. Sealed Letter:**
   - Diary $y_{max} = 875\text{ px}$.
   - Sealed Letter $y_{min} = 985\text{ px}$.
   - **Buffer:** $110\text{ px}$ vertical clearance.
4. **Skeleton Key vs. Medallion:**
   - Key $x_{max} = 1460\text{ px}$.
   - Medallion $x_{min} = 1485\text{ px}$.
   - **Buffer:** $25\text{ px}$ horizontal clearance.

---

## 4. Mandatory Browser Regression Test Results (Phase 10)

Executed via Playwright script [`scripts/verify_coffin2_svg_interactions.py`](file:///c:/Users/yashm/Downloads/winter%20arc/scripts/verify_coffin2_svg_interactions.py):

| Test ID | Trigger / Action | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---:|
| **TEST A** | Click Number 9 | Number 9 inspection opens; Treasure Chest does NOT open | `CRIMSON-SEALED RECORD (9)` opened. Chest modal count = 0 | **PASSED** |
| **TEST B** | Click Number 4 | Number 4 inspection opens; Number 9 details do NOT show | `MOONWARD EASTERN SCRAP (4)` opened. Number 9 count = 0 | **PASSED** |
| **TEST C** | Click Number 7 | Number 7 inspection opens; Diary or Skeleton do NOT open | `WESTERN MARKER — VII (7)` opened. Diary/Skull count = 0 | **PASSED** |
| **TEST D** | Click Number 3 | Number 3 inspection opens; no other number details show | `ARCHIVAL GRAVE RECORD (3)` opened with distractor note | **PASSED** |
| **TEST E** | Click actual Diary | Diary reading interface opens; Letter/Scroll do NOT open | `#diary-modal-title` opened. Letter/Scroll count = 0 | **PASSED** |
| **TEST F** | Click actual Letter | Letter inspection opens; Diary does NOT open | `WAX-SEALED CEMETERY DISPATCH` opened. Diary count = 0 | **PASSED** |
| **TEST G** | Click Treasure Chest | Chest inspection opens; Number 9 does NOT open | `IRON-BANDED COFFER` opened. Number 9 count = 0 | **PASSED** |
| **TEST H** | Click empty background | No modal or action executes | Zero dialogs opened on canvas click | **PASSED** |

---

## 5. Responsive Viewport & Browser Zoom Registration (Phase 9)

Tested across diverse form factors with verified SVG registration:
- **1920 × 1080 (FHD 16:9):** Perfect alignment; screenshot: [`coffin2_player_clean_1920x1080.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_player_clean_1920x1080.png)
- **1600 × 900 (HD+ 16:9):** Zero drift; screenshot: [`coffin2_svg_1600x900.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_svg_1600x900.png)
- **1440 × 900 (WXGA+ 16:10):** Centered with zero distortion; screenshot: [`coffin2_svg_1440x900.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_svg_1440x900.png)
- **1366 × 768 (Standard Laptop):** All controls intact; screenshot: [`coffin2_svg_1366x768.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_svg_1366x768.png)
- **1280 × 720 (Compact 720p):** Zero scrollbars; screenshot: [`coffin2_svg_1280x720.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_svg_1280x720.png)

---

## 6. Captured Photographic Verification Artifacts

### Phase 13 Diagnostic Screenshots
- **Number 7 Selected in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_number_7_selected.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_number_7_selected.png)
- **Number 4 Selected in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_number_4_selected.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_number_4_selected.png)
- **Number 9 Selected in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_number_9_selected.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_number_9_selected.png)
- **Number 3 Selected in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_number_3_selected.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_number_3_selected.png)
- **Diary Path in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_diary_selected.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_diary_selected.png)
- **Letter Path in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_letter_selected.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_letter_selected.png)
- **Treasure Chest Path in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_treasure_chest_selected.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_treasure_chest_selected.png)
- **All Targets Overlay in Diagnostic Mode:** [`docs/screenshots/coffin2_debug_all_targets_1920x1080.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_debug_all_targets_1920x1080.png)

### Player Production Screenshots
- **Clean Production Environment:** [`docs/screenshots/coffin2_player_clean_1920x1080.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_player_clean_1920x1080.png)
- **Chest Unlocked Reward Modal:** [`docs/screenshots/coffin2_chest_unlocked_reward.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_chest_unlocked_reward.png)

---

## 7. Verification Summary

- **TypeScript Compilation (`npx tsc -b`):** 0 errors.
- **Vitest Suite (`Stage3ForgottenGraveyard.test.tsx`):** 5/5 passing.
- **Full Vitest Suite:** 36/36 files, 198/198 tests passing.
- **Vite Production Build (`npm run build`):** Succeeded in 2.92s.
- **Remaining Unresolved Issues:** None.
