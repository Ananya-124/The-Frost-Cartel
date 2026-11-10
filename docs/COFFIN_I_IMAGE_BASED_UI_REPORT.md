# FROST CARTEL — ROUND 01, STAGE 03
## COFFIN I: THE MARKED REMAINS — SINGLE IMAGE-BASED CINEMATIC UI REDESIGN REPORT

### Executive Summary

In accordance with the directive for **Stage 03 (The Forgotten Graveyard) — Coffin I: The Marked Remains**, the interaction screen has been completely redesigned from a multi-panel sticker layout into a unified, photorealistic, single-image gothic investigation scene matching the reference design (`media_1794242836489_9cc3db67.jpg`).

All floating vector stickers (`SkullGraphic`, `RibcageGraphic`, `BookGraphic`, `KeyGraphic`, `ScrollGraphic`, `LetterGraphic`), the 35% left scrollable parchment sidebar, and the cinematic coffin-opening sequence (`CinematicCoffinOpening.tsx`) have been **completely removed**. The master photograph (`/assets/stage-3/coffins/grave1_marked_remains.jpg`) now serves as the single source of truth, with SVG used exclusively for accurate silhouette hit-testing, golden hover glows, and discovered-state tracking.

---

### Phase 1 — Removal of Floating Overlays & Unnecessary UI

| Removed Element | Prior Implementation Problem | Replacement |
| :--- | :--- | :--- |
| **Floating Vector Stickers** | Vector graphics (`SkullGraphic`, `RibcageGraphic`, `BookGraphic`, `KeyGraphic`, etc.) hovered over the coffin image like cartoon stickers. | Completely deleted from Coffin I. All objects are directly visible within the master photograph. |
| **Large Left Sidebar** | A 32-35% dark scrollable sidebar occupied screen space and squeezed the coffin image. | Completely removed. Replaced by a sleek horizontal bottom investigation bar matching the target mockup. |
| **Coffin Opening Animation** | `CinematicCoffinOpening.tsx` ran camera approach, lid rotation, and white-gold flash delays. | Deleted. Coffin I now loads directly into the fully open investigation scene with zero delays or flashes. |
| **Altar / Bone Placement Boxes** | Unnecessary rectangular boxes ("SELECT BONE", "APEX ALTAR", etc.). | Completely eliminated. Interaction happens directly through the objects in the coffin photograph. |

---

### Phase 2 — Master Coffin Artwork & Embedded Objects

The base asset `/assets/stage-3/coffins/grave1_marked_remains.jpg` (`1024 × 576`, 16:9 aspect ratio) contains all 10 canonical objects naturally integrated with authentic lighting, contact shadows, and perspective:

1. **Open Antique Wooden Coffin**: Heavy weathered oak with brass cross embellishments.
2. **Burgundy Velvet Interior**: Deep tufted velvet lining supporting the remains.
3. **Realistic Skeleton**: Complete anatomical skeleton resting in the coffin center.
4. **The Ancient Grimoire**: Leather-bound tome with a radiant golden sun emblem (`(460, 340)`).
5. **Rolled Parchment Scroll**: Ancient scroll sealed with red wax (`(640, 430)`).
6. **Handwritten Occult Notes**: Aged parchment leaves bearing mystical diagrams (`(380, 440)`).
7. **Engraved Compass Medallion**: Brass compass dial pointing true north (`(570, 360)`).
8. **Antique Brass Skeleton Key**: Four-petal bow key lying on the velvet (`(515, 415)`).
9. **Crimson-Bound Grave Femur**: Long bone marked with etched runes and crimson wrap (`(620, 410)`).
10. **Concealed Relic Chest**: Base sector where the ancient treasure chest unseals (`(200, 460)`).

---

### Phase 3 — SVG Hotspot Coordinate Mapping (`viewBox="0 0 1024 576"`)

SVG is used strictly as a non-rendered or silhouette-highlighting interaction surface aligned 1:1 with the photograph:

| Target ID | Object Name | Coordinates / Geometry | Interaction Behavior |
| :--- | :--- | :--- | :--- |
| `ancient_book` | Ancient Grimoire | `points="382,260 528,252 550,394 404,418 375,295"` | GSAP camera zoom to `(460, 340)` $\rightarrow$ opens `AncientBookReader` (3 folios). Deciphers Grimoire. |
| `skeleton_femur` | Movable Remains / Femur | `points="536,330 670,360 705,480 620,495 540,380"` | Drag or click $\rightarrow$ bone shifts `(+30px, -18px)` $\rightarrow$ reveals concealed brass plate **"ASH"**. |
| `ash_plate` | Concealed Inscription | `rect x="596" y="392" width="72" height="34" rx="5"` | Embedded in burgundy velvet beneath bone. Reads **`ASH`** with runic borders. |
| `skeleton_key` | Antique Brass Key | `rect x="475" y="390" width="80" height="65" rx="6"` | When riddle is solved, pulses with radiant gold light. Clicking flies key to chest lock and opens it. |
| `ancient_scroll` | Rolled Papyrus Scroll | `points="570,390 690,395 710,470 580,470"` | Opens `ArtifactInspectionModal` with 3D rotation and Latin scripture lore. |
| `compass` | Compass Medallion | `circle cx="570" cy="365" r="34"` | Opens `ArtifactInspectionModal` detailing the 1891 magnetic orientation. |
| `parchment` | Occult Notes & Letters | `points="295,395 450,390 460,490 300,500"` | Opens `ArtifactInspectionModal` revealing the Warden's journal dispatch. |
| `skull` | Cranium (Roman "I") | `circle cx="650" cy="160" r="60"` | Opens `ArtifactInspectionModal` detailing the First Warden's ritual markings. |
| `ribcage` | Ribcage with Sun Medallion | `points="510,190 655,195 660,320 500,315"` | Opens `ArtifactInspectionModal` detailing the 12-ray solar medallion. |
| `chest_relic` | Treasure Chest Relic | `x: 24..340, y: 380..540` | Emerges at coffin base. Clicking unlocked chest opens lid and unseals **`BENEATH`**. |

---

### Phase 4 — New Cinematic UI Layout

The screen layout matches `media_1794242836489_9cc3db67.jpg`:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 💀 FROST CARTEL (STAGE 03 • 250 CR)       THE MARKED REMAINS                ⏳ 19:45  💰 250 CR  🔊  EXIT │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│                                MASTER PHOTOREALISTIC COFFIN SCENE                                      │
│                                                                                                        │
│                     [Skull "I"]           [Sun Medallion Ribcage]                                      │
│                                                                                                        │
│              [Ancient Grimoire]        [Compass]      [Crimson-Bound Femur]                            │
│                                                                 │ (Shift reveals)                      │
│                                    [Skeleton Key]        [✦ ASH ✦ Plate]                               │
│                                                                                                        │
│         [Parchment Notes]                     [Rolled Scroll]                                          │
│                                                                                                        │
│    [Treasure Chest Relic]                                                                              │
│                                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 📖 JOURNAL (0/3) │ 📜 Read the ancient book. Uncover the truth... │ [ Enter your answer... ] [SUBMIT] │
│                  │                                                │               [← RETURN TO CEMETERY]│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Top HUD (`CoffinHeaderHUD.tsx`)**:
   - Left: Gold Skull Crest + `FROST CARTEL • STAGE 03 OF 03 • 250 CREDITS`.
   - Center: `THE MARKED REMAINS` in Cinzel serif with skull filigree line.
   - Right: Live Timer `⏳`, Reward `💰 250 CR`, Audio Mute toggle, and `EXIT` button.
2. **Central Investigation Surface**:
   - The master photograph occupies 75–85% of visual viewport height, centered in a clean 16:9 frame (`1024 × 576`).
   - SVG overlay provides hover glowing outlines, pointer styling, and precise hit areas.
3. **Bottom Investigation Bar**:
   - Dark gothic glass pill with amber border.
   - Left: Book glyph + dynamic investigation guidance hint.
   - Center: Answer input `[ Enter your answer... ]` with shake animation on invalid attempts + `[ SUBMIT ]` button.
   - Right: `[ ← RETURN TO CEMETERY ]` button.
   - Far-left corner: Floating `[ 📖 EVIDENCE JOURNAL (X/3) ]` button.

---

### Phase 5 — Full Five-Step Gameplay Walkthrough

1. **Step 1: Reading the Ancient Grimoire**
   - Player clicks the Ancient Book in the photograph.
   - GSAP camera smoothly zooms toward `(460, 340)` (`scale: 1.25`).
   - `AncientBookReader` opens displaying Folio I (*The Keeper's Vow*), Folio II (*The Rite of Cinders*), and Folio III (*The Keeper's Riddle*).
   - Upon completing all 3 folios, Grimoire is marked deciphered and bottom hint updates:
     `"The grimoire is deciphered. Shift the skeletal remains to reveal the hidden cipher."`
2. **Step 2: Shifting the Skeletal Remains**
   - Player clicks or drags the crimson-bound femur in the photograph.
   - GSAP animates the bone shift (`x: +30px, y: -18px`).
   - Concealed engraved brass plate **`ASH`** is uncovered in the velvet.
   - Sound `playDiscover()` triggers. Bottom hint updates:
     `Keeper's Riddle: "Born when flame is spent, pale when all light has fled; I am the last trace of fire, yet I hold no heat. What am I?"`
3. **Step 3: Solving the Keeper's Riddle**
   - Player enters **`ASH`** into the bottom bar's input field and clicks `[ SUBMIT ]`.
   - Input validates case-insensitively via `round1Service.solveGrave1Riddle`.
   - On success: `playCorrect()` sound triggers; Skeleton Key on the velvet pulses with radiant golden light. Bottom hint updates:
     `"The key awaits... Click the glowing Skeleton Key to unlock the chest."`
4. **Step 4: Unlocking with the Skeleton Key**
   - Player clicks the pulsing Skeleton Key hotspot in the photograph.
   - GSAP key flight animation: Key lifts, glides to the coffin base padlock, rotates 90°, and clicks open with `playChestUnlock()` sound.
   - The ancient treasure chest unlatches at the foot of the coffin.
5. **Step 5: Revealing Fragment I ("BENEATH")**
   - Player clicks the unlocked chest.
   - Chest lid opens with golden light rays and `playSecretFound()` sound.
   - Ancient parchment rises displaying **`✦ B E N E A T H ✦`**.
   - Fragment I is automatically registered in `round1Service` and `EvidenceJournalModal`.
   - Evidence Journal count updates to `(1/3)`, and Grave 1 is permanently completed.

---

### Phase 6 — Verification Results

- **TypeScript Compilation (`npx tsc -b`)**: 0 errors.
- **Stage 3 Vitest Test Suite (`Stage3ForgottenGraveyard.test.tsx`)**: 4/4 tests passed.
- **Full Project Vitest Suite**: 35 test files, 193 tests passed (100% passing).
- **Vite Production Build (`npm run build`)**: Built in 3.67s with zero errors.
- **Scope Compliance**: Coffin II, Coffin III, Stage 01, Stage 02, Round 2, Round 3, Round 4, and Admin Portal were preserved intact without any regression.

