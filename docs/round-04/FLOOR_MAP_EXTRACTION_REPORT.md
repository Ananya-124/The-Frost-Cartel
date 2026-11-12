# FROST CARTEL — ROUND 04: THE RADIANT TREASURE HUNT
## FLOOR MAP EXTRACTION & ASSET VERIFICATION REPORT

**Tool Used:** PyMuPDF (`fitz` v2.1.0) & Pillow (PIL v12.2.0)  
**Source Document:** `C:\Users\yashm\Downloads\floors.pdf`  
**Target Output Directory:** `public/images/round-04/floors/`  
**Resolution:** 300 DPI Rendering Matrix ($zoom = 300 / 72 \approx 4.16667$)  
**Format:** Lossless PNG with RGBA transparency / clean bounding-box crop  

---

### 1. ASSET EXTRACTION INVENTORY

| Target Asset Path | Target Floor | Source PDF Page | Rendered Raw Size | Cropped Map Canvas | Aspect Ratio | File Size | Integrity Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `public/images/round-04/floors/floor-02.png` | **Second Floor** | Page 1 | 2481 × 3508 | **2406 × 1817 px** | 1.324 : 1 | 1.42 MB | Lossless Verified |
| `public/images/round-04/floors/floor-03.png` | **Third Floor** | Page 6 | 2481 × 3508 | **2406 × 1817 px** | 1.324 : 1 | 1.39 MB | Lossless Verified |
| `public/images/round-04/floors/floor-04.png` | **Fourth Floor** | Page 2 | 2481 × 3508 | **2406 × 1817 px** | 1.324 : 1 | 1.50 MB | Lossless Verified |
| `public/images/round-04/floors/floor-05.png` | **Fifth Floor** | Page 3 | 2481 × 3508 | **2406 × 1817 px** | 1.324 : 1 | 1.47 MB | Lossless Verified |
| `public/images/round-04/floors/floor-06.png` | **Sixth Floor** | Page 4 | 2481 × 3508 | **2406 × 1811 px** | 1.328 : 1 | 1.48 MB | Lossless Verified |
| `public/images/round-04/floors/floor-07.png` | **Seventh Floor** | Page 5 | 2481 × 3508 | **2406 × 1811 px** | 1.328 : 1 | 1.51 MB | Lossless Verified |

---

### 2. ARCHITECTURAL PRESERVATION DETAILS

1. **Perimeter Boundaries:**
   - External architectural walls, garden curves, and tree canopies surrounding the building were preserved.
   - Blank white margins beyond the architectural drawing were cropped away cleanly.
2. **Internal Structures:**
   - All room boundaries, labels (`Classroom`, `Lab`, `Staff`, `Toilet`, `Stairs`, `Lift`), interior door swings, and corridor layouts remain fully legible.
3. **No Artificial Alterations:**
   - Zero AI-generated floor plans were introduced.
   - Ground Floor and First Floor were neither invented nor synthesized.
4. **Coordinate Normalization:**
   - Canonical game coordinate space is standardized at **1024 × 774** map units.
   - Coordinate conversion from native extracted pixels $(X_{raw}, Y_{raw})$ to game units $(X_{game}, Y_{game})$:
     $$X_{game} = X_{raw} \times \frac{1024}{2406} \approx X_{raw} \times 0.42560$$
     $$Y_{game} = Y_{raw} \times \frac{774}{1817} \approx Y_{raw} \times 0.42598$$

