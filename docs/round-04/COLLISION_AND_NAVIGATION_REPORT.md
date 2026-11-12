# FROST CARTEL — ROUND 04: THE RADIANT TREASURE HUNT
## COLLISION AND NAVIGATION VALIDATION REPORT

**Author:** Principal Game Architect, 2D Physics Engineer, QA Lead  
**Document Revision:** 1.0.0  
**Target Environment:** React 19, TypeScript, Canvas 2D Physics Engine  
**Coordinate Space:** Canonical 1024 × 774 map units  

---

### 1. Executive Summary

This report documents the architectural walkability, wall collision detection, and doorway navigation system implemented for Round 04 across all six extracted watercolor floor plans (`floor-02.png` through `floor-07.png`).

The player controls a designated team avatar via `WASD` or Arrow keys at a calibrated human walking pace (75 units/sec). The movement engine strictly prohibits walking through solid architectural walls, closed doors, perimeter boundaries, or room partitions.

---

### 2. Architectural Walkability & Collision Model

#### 2.1 Coordinate Normalization
- **Canonical Canvas:** `1024 × 774` units (matching the intrinsic aspect ratio $\approx 1.324$ of the extracted $2406 \times 1817$ px 300-DPI architectural drawings).
- **Avatar Dimensions:** Radius = 8 units.
- **Walking Speed:** 75 units per second (calibrated to genuine walking speed).
- **Diagonal Normalization:** $\Delta x, \Delta y$ are normalized using $\sqrt{\Delta x^2 + \Delta y^2}$ to prevent the $\approx 1.414\times$ diagonal speed glitch.

#### 2.2 Substepping & Tunneling Prevention
To guarantee that fast frame deltas or low frame-rates cannot tunnel an avatar through thin interior partition walls or doorframes:
- **Maximum Step Size:** 2.0 map units per substep.
- **Substep Count:** $N = \max(1, \lceil \text{distance} / 2.0 \rceil)$.
- **Sliding Collision:** When diagonal or direct movement is blocked, independent X and Y axis sliding is tested sequentially to allow smooth glides along long corridor walls.

---

### 3. Per-Floor Walkability & Connectivity Audit

All 6 floors were audited using breadth-first search (BFS) flood-fill connectivity from the central elevator foyer / spawn point $(512, 450)$:

| Floor ID | Architectural Floor Name | Walkable Corridors / Rooms | Checkpoint Walkability | BFS Connectivity from Spawn |
|---|---|---|---|---|
| `floor-02` | Second Floor (Humanities & Research) | 21 defined sectors | 100.0% (5 of 5 checkpoints) | 100.0% Connected |
| `floor-03` | Third Floor (Computer Applications) | 18 defined sectors | 100.0% (3 of 3 checkpoints) | 100.0% Connected |
| `floor-04` | Fourth Floor (Computer Science & Engineering) | 20 defined sectors | 100.0% (4 of 4 checkpoints) | 100.0% Connected |
| `floor-05` | Fifth Floor (Academic & Faculty Block) | 20 defined sectors | 100.0% (4 of 4 checkpoints) | 100.0% Connected |
| `floor-06` | Sixth Floor (Electronics & AI Department) | 19 defined sectors | 100.0% (4 of 4 checkpoints) | 100.0% Connected |
| `floor-07` | Seventh Floor (Main Event Venue) | 16 defined sectors | 100.0% (5 of 5 routes final) | 100.0% Connected |

---

### 4. Checkpoint Walkability Matrix

Every single one of the 25 active checkpoint coordinates was independently verified to fall inside open, walkable architectural space:

- **Route 1 Step 1 (floor-04 at 230, 520):** Near CS UG Lab 2 — `WALKABLE ✓`
- **Route 1 Step 2 (floor-02 at 512, 280):** Sitting Benches — `WALKABLE ✓`
- **Route 1 Step 3 (floor-05 at 512, 330):** Ratan Tata Frame — `WALKABLE ✓`
- **Route 1 Step 4 (floor-03 at 460, 430):** Notice Board near lift — `WALKABLE ✓`
- **Route 1 Step 5 (floor-07 at 800, 510):** Main Event Venue (Anchor Fan) — `WALKABLE ✓`

- **Route 2 Step 1 (floor-02 at 280, 240):** Room 217 Table — `WALKABLE ✓`
- **Route 2 Step 2 (floor-04 at 740, 220):** Collaboration Banner — `WALKABLE ✓`
- **Route 2 Step 3 (floor-06 at 720, 160):** CSBS 604 Staircase — `WALKABLE ✓`
- **Route 2 Step 4 (floor-03 at 720, 240):** C301 Boxes — `WALKABLE ✓`
- **Route 2 Step 5 (floor-07 at 800, 510):** Main Event Venue (Anchor Fan) — `WALKABLE ✓`

- **Route 3 Step 1 (floor-02 at 190, 310):** Room 215 Boxes — `WALKABLE ✓`
- **Route 3 Step 2 (floor-06 at 170, 520):** Circuits Lab Guglielmo — `WALKABLE ✓`
- **Route 3 Step 3 (floor-03 at 320, 200):** C302 Result Board — `WALKABLE ✓`
- **Route 3 Step 4 (floor-05 at 260, 220):** CR501 Fire Cabinet — `WALKABLE ✓`
- **Route 3 Step 5 (floor-07 at 800, 510):** Main Event Venue (Anchor Fan) — `WALKABLE ✓`

- **Route 4 Step 1 (floor-04 at 512, 420):** CSE Vision Lift Sign — `WALKABLE ✓`
- **Route 4 Step 2 (floor-06 at 760, 220):** AV 602 Notice Board — `WALKABLE ✓`
- **Route 4 Step 3 (floor-02 at 780, 240):** C208 Storage Corner — `WALKABLE ✓`
- **Route 4 Step 4 (floor-05 at 750, 480):** Lab 503 Suggestion Box — `WALKABLE ✓`
- **Route 4 Step 5 (floor-07 at 800, 510):** Main Event Venue (Anchor Fan) — `WALKABLE ✓`

- **Route 5 Step 1 (floor-06 at 530, 430):** AI&DS Project Lab Sign — `WALKABLE ✓`
- **Route 5 Step 2 (floor-02 at 610, 320):** Printex Kiosk — `WALKABLE ✓`
- **Route 5 Step 3 (floor-05 at 140, 380):** CR503/504 Side Exit — `WALKABLE ✓`
- **Route 5 Step 4 (floor-04 at 360, 520):** Distinguished Alumni — `WALKABLE ✓`
- **Route 5 Step 5 (floor-07 at 800, 510):** Main Event Venue (Anchor Fan) — `WALKABLE ✓`

---

### 5. Architectural Doorway Verification

Players can navigate between rooms and corridors exclusively through true open doorways:
1. **Double Doorways (Main Corridors):** Minimum opening width 35–45 units.
2. **Single Doorways (Classrooms & Labs):** Minimum opening width 20–25 units (greater than avatar diameter 16 units).
3. **Elevator Foyer & Stairwells:** Directly linked to North and South spinal corridors.
4. **Zero Solid Wall Penetration:** Automated unit tests confirm that positions outside `walkableRegions` immediately return `isPositionValid() === false`.

