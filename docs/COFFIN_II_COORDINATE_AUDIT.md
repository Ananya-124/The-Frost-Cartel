# FROST CARTEL — STAGE 03 — COFFIN II
## COORDINATE GEOMETRY AND INTERACTION AUDIT REPORT

**Date:** November 10, 2026  
**Status:** Completed  
**Branch:** `main`  
**Engineer:** Principal Frontend Architect & Image Coordinate Geometry Specialist  

---

## 1. Master Artwork Canonical Specifications

The master artwork for Stage 03 Coffin II is the exhumed cemetery coffin environment:

| Property | Canonical Value | Verification Source |
|---|---|---|
| **Local File Path** | `public/assets/round-01/stage-03/coffin-02-buried-diary-master.png` | Local filesystem / Pillow audit |
| **Production Derivatives** | `public/assets/stage-3/coffins/grave2_buried_diary.jpg`<br>`public/assets/stage-3/coffins/grave2_buried_diary.webp` | Production assets |
| **Intrinsic Natural Width ($W$)** | **`2560 px`** | Direct image header |
| **Intrinsic Natural Height ($H$)** | **`1440 px`** | Direct image header |
| **Native Aspect Ratio** | **`16 : 9`** (`1.7777777777777777`) | $2560 / 1440$ exact |
| **Color Mode & Format** | `RGBA`, 32-bit Depth, Non-interlaced PNG | PIL analysis |
| **Baked-in UI Content** | **0% (Zero)** — pure photography, no baked labels, buttons, or tumblers | Asset inspection |

---

## 2. Parent Image Stage Container & Browser Rendering Geometry

- **Parent Container Hierarchy:**
  - `<main className="relative flex-1 w-full flex items-center justify-center min-h-0 px-2 sm:px-4 py-1 overflow-hidden">`
  - Positioned stage wrapper: `<div className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-950/40" style={{ aspectRatio: '16 / 9' }}>`
  - Background image: `<img className="w-full h-full object-cover pointer-events-none select-none" />`
- **Coordinate Space Alignment:**
  - The positioned stage wrapper locks the exact `16:9` aspect ratio of the 2560 × 1440 source asset.
  - All interactive buttons are absolutely positioned children within the same stage wrapper, using normalized percentages calculated directly against $W = 2560$ and $H = 1440$:
    $$\text{left} = \frac{x}{2560} \times 100\%,\quad \text{top} = \frac{y}{1440} \times 100\%,\quad \text{width} = \frac{w}{2560} \times 100\%,\quad \text{height} = \frac{h}{1440} \times 100\%$$

---

## 3. Root Causes of Previous Click Misalignment

Our geometric audit identified four specific mathematical and structural causes of the previous click displacement:

1. **Envelope / Letter Vertical Shift (-190px displacement):**
   - **Flaw:** The sealed letter's hit region was configured with `top: 54.86%` ($y = 790\text{px}$) and `height: 18.75%` ($y = 790 \dots 1060\text{px}$).
   - **Physical Reality:** The physical vellum letter and its crimson fleur-de-lis seal are actually positioned at $y = 980 \dots 1220\text{px}$ ($x = 660 \dots 1030\text{px}$).
   - **Impact:** The button's top half ($y = 790 \dots 880\text{px}$) overlapped the bottom of the open diary, while the lower portion of the letter (including the wax seal at $y = 1140\text{px}$) had no hit area. Clicking the letter required clicking near its top edge into empty velvet or diary.
2. **Eastern Column Vertical Overlaps:**
   - **Flaw:** Paper 4 ($y = 250 \dots 460\text{px}$), Paper 3 ($y = 430 \dots 630\text{px}$), and Paper 9 ($y = 580 \dots 780\text{px}$) had $20\text{px}$ to $50\text{px}$ vertical overlaps.
   - **Impact:** Clicks on adjacent boundaries intercepted neighbouring papers.
3. **Number 9 vs. Treasure Chest Pointer Interception:**
   - **Flaw:** Paper 9 extended down to $y = 780\text{px}$ and rightward to $x = 1880\text{px}$. The ancient scroll ($x = 1800 \dots 2140\text{px}$) and chest ($x = 1660 \dots 1980\text{px}$, $y = 940 \dots 1140\text{px}$) had overlapping transparent bounding boxes.
   - **Impact:** Clicks near the lower-right of Paper 9 were intercepted by the chest or scroll transparent hit area.
4. **Missing Compass Medallion Target:**
   - **Flaw:** The gold Tree of Life circular medallion at $x = 1475 \dots 1650\text{px}$, $y = 960 \dots 1140\text{px}$ had no independent target and was partially overlapped by the skeleton key.

---

## 4. Calibrated Coordinate Registry (Zero Overlaps)

| Target ID | Object Name | Source Bounding Box ($x_1, y_1, x_2, y_2$) | Dimension ($w \times h$) | Normalized Percentage ($L, T, W, H$) | Overlap Status |
|---|---|---|---|---|---|
| `skull_mark` | Cranium of Keeper | `(1060, 160, 1300, 390)` | $240 \times 230$ | `41.41%`, `11.11%`, `9.38%`, `15.97%` | 0 overlaps |
| `number_7` | Western Folio 7 | `(670, 430, 890, 640)` | $220 \times 210$ | `26.17%`, `29.86%`, `8.59%`, `14.58%` | 0 overlaps |
| `number_4` | Moonward Scrap 4 | `(1480, 260, 1720, 430)` | $240 \times 170$ | `57.81%`, `18.06%`, `9.38%`, `11.81%` | 0 overlaps |
| `number_3` | Archival Record 3 | `(1560, 440, 1780, 590)` | $220 \times 150$ | `60.94%`, `30.56%`, `8.59%`, `10.42%` | 0 overlaps |
| `number_9` | Crimson Seal Scrap 9 | `(1610, 600, 1795, 750)` | $185 \times 150$ | `62.89%`, `41.67%`, `7.23%`, `10.42%` | 0 overlaps |
| `ancient_diary` | Open Ancient Diary | `(920, 480, 1530, 880)` | $610 \times 400$ | `35.94%`, `33.33%`, `23.83%`, `27.78%` | 0 overlaps |
| `sealed_letter` | Wax-Sealed Letter | `(660, 980, 1030, 1220)` | $370 \times 240$ | `25.78%`, `68.06%`, `14.45%`, `16.67%` | 0 overlaps |
| `skeleton_key` | Antique Skeleton Key | `(1270, 950, 1465, 1130)` | $195 \times 180$ | `49.61%`, `65.97%`, `7.62%`, `12.50%` | 0 overlaps |
| `compass_medallion` | Tree of Life Medallion | `(1475, 960, 1650, 1140)` | $175 \times 180$ | `57.62%`, `66.67%`, `6.84%`, `12.50%` | 0 overlaps |
| `ancient_scroll` | Rolled Ancient Scroll | `(1800, 720, 2140, 930)` | $340 \times 210$ | `70.31%`, `50.00%`, `13.28%`, `14.58%` | 0 overlaps |
| `treasure_chest` | Iron-Banded Coffer | `(1660, 940, 1980, 1140)` | $320 \times 200$ | `64.84%`, `65.28%`, `12.50%`, `13.89%` | 0 overlaps |

**Pairwise Overlap Analysis:**
$$\text{Total Tested Pairs} = \frac{11 \times 10}{2} = 55 \text{ pairs. Detected Overlaps} = \mathbf{0}.$$
