# COFFIN II — THE BURIED DIARY
## TARGET CALIBRATION REGISTRY & ZERO-OVERLAP GEOMETRIC SPECIFICATION

**Document Version:** 1.0.0  
**Coordinate Space:** 2560 × 1440 (Master Canvas, 16:9 Aspect Ratio)  
**Verification Status:** 100% Calibrated, 0 Pairwise Overlaps across all 55 pairs, Automated Positive/Negative Click Verified

---

## 1. Master Canvas & Container Geometry

- **Original Master Asset:** `public/assets/round-01/stage-03/coffin-02-buried-diary-master.png`
- **Intrinsic Resolution:** 2560 px (Width) × 1440 px (Height)
- **Aspect Ratio:** $2560 / 1440 = 16 / 9 = 1.777778$
- **Container Implementation:**
  ```tsx
  <div
    className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-950/40"
    style={{ aspectRatio: '16 / 9' }}
  >
    <img
      src="/assets/round-01/stage-03/coffin-02-buried-diary-master.png"
      alt="The Buried Diary - Pristine Coffin Environment"
      className="w-full h-full object-cover pointer-events-none select-none"
    />
  ```
- **Coordinate Conversion Formula:**
  $$\text{left} = \left(\frac{x}{2560} \times 100\right)\%, \quad \text{top} = \left(\frac{y}{1440} \times 100\right)\%$$
  $$\text{width} = \left(\frac{w}{2560} \times 100\right)\%, \quad \text{height} = \left(\frac{h}{1440} \times 100\right)\%$$

---

## 2. Canonical Target Registry (11 Targets)

| Target ID | Target Description | X (px) | Y (px) | Width (px) | Height (px) | Left (%) | Top (%) | Width (%) | Height (%) | Inspection Asset |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `skull_mark` | Cranium of Keeper (Roman Numeral I) | 1060 | 160 | 240 | 230 | `41.41%` | `11.11%` | `9.38%` | `15.97%` | `/assets/round-01/stage-03/inspection/skull_mark.png` |
| `number_7` | Western Parchment Folio (Numeral 7) | 670 | 430 | 220 | 210 | `26.17%` | `29.86%` | `8.59%` | `14.58%` | `/assets/round-01/stage-03/inspection/number_7.png` |
| `number_4` | Moonward Eastern Scrap (Numeral 4) | 1480 | 260 | 240 | 170 | `57.81%` | `18.06%` | `9.38%` | `11.81%` | `/assets/round-01/stage-03/inspection/number_4.png` |
| `number_3` | Archival Grave Record (Numeral 3, Distractor) | 1560 | 440 | 220 | 150 | `60.94%` | `30.56%` | `8.59%` | `10.42%` | `/assets/round-01/stage-03/inspection/number_3.png` |
| `number_9` | Crimson-Sealed Record (Numeral 9) | 1610 | 600 | 185 | 150 | `62.89%` | `41.67%` | `7.23%` | `10.42%` | `/assets/round-01/stage-03/inspection/number_9.png` |
| `ancient_diary` | Ancient Open Folio (Chronicle Reading) | 920 | 480 | 610 | 400 | `35.94%` | `33.33%` | `23.83%` | `27.78%` | `/assets/round-01/stage-03/inspection/ancient_diary.png` |
| `sealed_letter` | Wax-Sealed Cemetery Dispatch (Fleur-de-lis) | 660 | 980 | 370 | 240 | `25.78%` | `68.06%` | `14.45%` | `16.67%` | `/assets/round-01/stage-03/inspection/sealed_letter.png` |
| `skeleton_key` | Ornate Brass Skeleton Key | 1270 | 950 | 195 | 180 | `49.61%` | `65.97%` | `7.62%` | `12.50%` | `/assets/round-01/stage-03/inspection/skeleton_key.png` |
| `compass_medallion` | Astronomical Compass Medallion | 1475 | 960 | 175 | 180 | `57.62%` | `66.67%` | `6.84%` | `12.50%` | `/assets/round-01/stage-03/inspection/compass_medallion.png` |
| `ancient_scroll` | Ancient Rolled Parchment Scroll | 1800 | 720 | 340 | 210 | `70.31%` | `50.00%` | `13.28%` | `14.58%` | `/assets/round-01/stage-03/inspection/ancient_scroll.png` |
| `treasure_chest` | Locked Iron-Banded Coffer (Lock Target) | 1660 | 940 | 320 | 200 | `64.84%` | `65.28%` | `12.50%` | `13.89%` | `/assets/round-01/stage-03/inspection/treasure_chest.png` |

---

## 3. Pairwise Geometric Isolation Analysis ($\frac{11 \times 10}{2} = 55$ Pairs)

All 55 pair intersections were programmatically verified using AABB collision testing:
$$\text{Overlap}(A, B) \iff (x_{1A} < x_{2B}) \land (x_{2A} > x_{1B}) \land (y_{1A} < y_{2B}) \land (y_{2A} > y_{1B})$$

Key critical adjacencies resolved:
1. **`number_9` vs `treasure_chest`:**
   - `number_9`: $y \in [600, 750]$
   - `treasure_chest`: $y \in [940, 1140]$
   - **Vertical Clearance:** $940 - 750 = 190\text{ px}$. Clicking `number_9` is geometrically isolated from `treasure_chest`.
2. **`number_9` vs `ancient_scroll`:**
   - `number_9`: $x \in [1610, 1795]$
   - `ancient_scroll`: $x \in [1800, 2140]$
   - **Horizontal Clearance:** $1800 - 1795 = 5\text{ px}$.
3. **`ancient_diary` vs `sealed_letter`:**
   - `ancient_diary`: $y \in [480, 880]$
   - `sealed_letter`: $y \in [980, 1220]$
   - **Vertical Clearance:** $980 - 880 = 100\text{ px}$. Clicking `sealed_letter` never clips into `ancient_diary`.
4. **`skeleton_key` vs `compass_medallion` vs `treasure_chest`:**
   - `skeleton_key`: $x \in [1270, 1465]$
   - `compass_medallion`: $x \in [1475, 1650]$
   - `treasure_chest`: $x \in [1660, 1980]$
   - **Horizontal Clearances:** Key to Medallion is $10\text{ px}$, Medallion to Chest is $10\text{ px}$. Zero overlap.

---

## 4. Developer Calibration Mode Verification

- **Activation:** Append `?debug=coffin2` or `?debug=true` to the URL.
- **Visual Feedback:** Faint amber bounding boxes (`border border-amber-400/80 bg-amber-400/20`) appear with small target ID badges in the upper-left corner of each hitbox.
- **Production Mode:** Default in player production mode. Zero borders, zero backgrounds, zero SVG overlays, zero cursor anomalies. The master artwork remains pristine.
