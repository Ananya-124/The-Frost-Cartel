# COFFIN II — THE BURIED DIARY
## TARGET CALIBRATION REGISTRY & ZERO-OVERLAP GEOMETRIC SPECIFICATION

**Document Version:** 2.0.0  
**Coordinate Space:** 2560 × 1440 (Master Canvas, 16:9 Aspect Ratio)  
**Implementation:** Canonical Invisible SVG Polygon Geometry Layer (`viewBox="0 0 2560 1440"`)  
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
    {/* Base 16:9 Master Artwork */}
    <img
      src="/assets/round-01/stage-03/coffin-02-buried-diary-master.png"
      alt="The Buried Diary - Pristine Coffin Environment"
      className="w-full h-full object-cover pointer-events-none select-none"
    />

    {/* Canonical SVG Polygon Interaction Layer */}
    <svg
      viewBox="0 0 2560 1440"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-auto select-none"
      aria-label="Burial chamber interactive objects"
    >
      {EVIDENCE_TARGETS.map((target) => (
        <polygon
          key={target.id}
          data-target-id={target.id}
          points={target.points}
          role="button"
          tabIndex={0}
          aria-label={target.ariaLabel}
          onClick={(e) => {
            e.stopPropagation();
            handleInteraction(target.id);
          }}
          fill="transparent"
          stroke="none"
          pointerEvents="fill"
          className="cursor-pointer"
        />
      ))}
    </svg>
  </div>
  ```

---

## 2. Canonical Target & Polygon Registry (11 Targets)

| Target ID | Object Description | SVG `<polygon>` Vertices (`points`) | Bounding Range (px) | Normalized Percentage | Inspection Asset |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `skull_mark` | Cranium of Keeper (Roman I) | `1080,160 1200,150 1270,175 1310,230 1310,310 1280,370 1220,400 1150,400 1085,360 1060,300 1060,220` | $x \in [1060, 1310]$<br>$y \in [150, 400]$ | `41.41%`, `11.11%` | `/assets/round-01/stage-03/inspection/skull_mark.png` |
| `number_7` | Western Folio Scrap (Numeral 7) | `680,440 885,430 905,615 695,635` | $x \in [680, 905]$<br>$y \in [430, 635]$ | `26.17%`, `29.86%` | `/assets/round-01/stage-03/inspection/number_7.png` |
| `number_4` | Moonward Eastern Scrap (Numeral 4) | `1495,375 1615,265 1715,315 1605,425` | $x \in [1495, 1715]$<br>$y \in [265, 425]$ | `57.81%`, `18.06%` | `/assets/round-01/stage-03/inspection/number_4.png` |
| `number_3` | Archival Grave Record (Numeral 3, Distractor) | `1565,525 1655,440 1765,490 1675,575` | $x \in [1565, 1765]$<br>$y \in [440, 575]$ | `60.94%`, `30.56%` | `/assets/round-01/stage-03/inspection/number_3.png` |
| `number_9` | Crimson-Sealed Record (Numeral 9) | `1615,685 1705,600 1790,650 1705,740` | $x \in [1615, 1790]$<br>$y \in [600, 740]$ | `62.89%`, `41.67%` | `/assets/round-01/stage-03/inspection/number_9.png` |
| `ancient_diary` | Ancient Open Folio (Chronicle Reading) | `980,485 1230,480 1480,510 1520,770 1480,830 1225,875 960,860 925,680` | $x \in [925, 1520]$<br>$y \in [480, 875]$ | `35.94%`, `33.33%` | `/assets/round-01/stage-03/inspection/ancient_diary.png` |
| `sealed_letter` | Wax-Sealed Cemetery Dispatch (Fleur-de-lis) | `760,985 1020,1030 935,1210 665,1160` | $x \in [665, 1020]$<br>$y \in [985, 1210]$ | `25.78%`, `68.06%` | `/assets/round-01/stage-03/inspection/sealed_letter.png` |
| `skeleton_key` | Ornate Brass Skeleton Key | `1275,1055 1330,960 1380,955 1460,1020 1445,1100 1370,1120 1290,1110` | $x \in [1275, 1460]$<br>$y \in [955, 1120]$ | `49.61%`, `65.97%` | `/assets/round-01/stage-03/inspection/skeleton_key.png` |
| `compass_medallion` | Astronomical Compass Medallion | `1530,965 1610,970 1645,1040 1615,1125 1535,1135 1485,1070 1485,1010` | $x \in [1485, 1645]$<br>$y \in [965, 1135]$ | `57.62%`, `66.67%` | `/assets/round-01/stage-03/inspection/compass_medallion.png` |
| `ancient_scroll` | Ancient Rolled Parchment Scroll | `1850,725 1960,750 2130,890 2060,930 1910,820 1805,785` | $x \in [1805, 2130]$<br>$y \in [725, 930]$ | `70.31%`, `50.00%` | `/assets/round-01/stage-03/inspection/ancient_scroll.png` |
| `treasure_chest` | Locked Iron-Banded Coffer (Lock Target) | `1670,980 1790,940 1950,970 1970,1100 1840,1135 1675,1090` | $x \in [1670, 1970]$<br>$y \in [940, 1135]$ | `64.84%`, `65.28%` | `/assets/round-01/stage-03/inspection/treasure_chest.png` |

---

## 3. Pairwise Geometric Isolation Analysis ($\frac{11 \times 10}{2} = 55$ Pairs)

All 55 pair intersections were programmatically verified using polygon ray-casting and separating axis edge testing:
- **Total active targets:** 11
- **Pairwise combinations:** 55
- **Detected polygon intersections:** **0**

Key critical adjacencies resolved:
1. **`number_9` vs `treasure_chest`:**
   - `number_9`: $y \in [600, 740]$
   - `treasure_chest`: $y \in [940, 1135]$
   - **Vertical Clearance:** $940 - 740 = 200\text{ px}$. Clicking `number_9` is geometrically isolated from `treasure_chest`.
2. **`number_9` vs `ancient_scroll`:**
   - `number_9`: $x \in [1615, 1790]$
   - `ancient_scroll`: $x \in [1805, 2130]$
   - **Horizontal Clearance:** $1805 - 1790 = 15\text{ px}$.
3. **`ancient_diary` vs `sealed_letter`:**
   - `ancient_diary`: $y \in [480, 875]$
   - `sealed_letter`: $y \in [985, 1210]$
   - **Vertical Clearance:** $985 - 875 = 110\text{ px}$. Clicking `sealed_letter` never clips into `ancient_diary`.
4. **`skeleton_key` vs `compass_medallion` vs `treasure_chest`:**
   - `skeleton_key`: $x \in [1275, 1460]$
   - `compass_medallion`: $x \in [1485, 1645]$
   - `treasure_chest`: $x \in [1670, 1970]$
   - **Horizontal Clearances:** Key to Medallion is $25\text{ px}$, Medallion to Chest is $25\text{ px}$. Zero overlap.

---

## 4. Developer Calibration Mode Verification

- **Activation:** Append `?debug=coffin2` or `?debug=true` to the URL.
- **Visual Feedback:** Faint amber dashed polygons (`fill="rgba(245, 158, 11, 0.25)"`, `stroke="#f59e0b"`, `strokeDasharray="6 4"`) appear with target ID labels above each polygon's anchor point. When clicked, the selected polygon highlights in red (`rgba(239, 68, 68, 0.4)` / `#ef4444`).
- **Production Mode:** Default in player production mode. `fill="transparent"`, `stroke="none"`, `pointerEvents="fill"`. Zero visible borders, zero backgrounds, zero SVG overlays. The master artwork remains pristine.
