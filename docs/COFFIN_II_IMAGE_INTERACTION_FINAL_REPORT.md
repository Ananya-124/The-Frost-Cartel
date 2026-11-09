# FROST CARTEL — ROUND 01, STAGE 03
## COFFIN II: THE BURIED DIARY — IMAGE-BASED INTERACTION REPAIR & FINAL UI POLISH REPORT

**Date:** November 10, 2026  
**Status:** Completed & 100% Verified  
**Branch:** `main`  
**Engineer:** Senior React 19 / TypeScript Engineer, Game UI/UX Designer & Frontend Architect  

---

## 1. Executive Summary

Stage 03 (The Forgotten Graveyard) **Coffin II: The Buried Diary** ([`Grave2BuriedDiary.tsx`](file:///c:/Users/yashm/Downloads/winter%20arc/src/components/game/stage3/Grave2BuriedDiary.tsx)) has undergone a complete interaction overhaul:

1. **Obsolete SVG & Hover System Completely Removed:**
   - Eradicated all SVG object outlines, SVG hit paths, SVG golden glow filters, animated borders, and GSAP SVG path tweens.
   - Removed all hover tooltips (`.group-hover:opacity-100`, cursor-following badges, floating labels).
   - Zero interaction graphics are rendered over the coffin image. The scene looks and behaves as a pure, cinematic photograph until deliberately clicked.
2. **Physical Clue Markers in Artwork (Including Distractor 3):**
   - The master 2560 × 1440 artwork contains all physical clues naturally integrated into the photograph:
     1. Skull Cranium: Roman numeral `I` (= 1).
     2. Western Parchment: Numeral `7`.
     3. Eastern Moonward Parchment: Numeral `4`.
     4. Middle Eastern Parchment: Inscribed numeral `3` (clearly established via inspection as an archival burial tally of offerings, distinct from the covenant year).
     5. Lower Eastern Parchment: Numeral `9` beside the crimson wax seal.
   - All numbers are authentic parts of the underlying image; zero HTML, SVG, or CSS badges are used.
3. **Calibrated Image-Relative HTML Click Interactions:**
   - Replaced SVGs with transparent, accessible HTML buttons (`<button ... className="absolute z-20 cursor-pointer bg-transparent border-0 p-0 m-0 outline-none focus:outline-none">`).
   - Calibrated against the 2560 × 1440 coordinate space with normalized percentages.
   - Zero collision/overlap between adjacent relics (e.g. Paper 9 vs Scroll vs Iron Coffer). Hovering or clicking on Paper 9 interacts strictly with Paper 9 and never targets the treasure chest.
4. **Photographic Master Inspection Details:**
   - Replaced all synthetic CSS cards/emojis with high-resolution crops from the 2560 × 1440 master artwork saved in [`public/assets/round-01/stage-03/inspection/`](file:///c:/Users/yashm/Downloads/winter%20arc/public/assets/round-01/stage-03/inspection/).
   - Inspecting the locked chest displays `"THE CHEST REMAINS SEALED."`
5. **Clean Riddle Panel (Zero Answer Leaks):**
   - Initial tumblers set to `0000`.
   - Removed the spoiling green success badge (`COVENANT (1749): "EMBER"`). The answer remains completely secret until the player solves it.
   - Correct covenant code is `1749`. On unlock, reveals golden particle rays, unlocks coffer, reveals syllable `EMBER`, and updates the Evidence Journal to `2/3`.

---

## 2. Interaction Targets & Calibrated Coordinate System

All coordinates are normalized to the 2560 × 1440 master coordinate system and scale with the 16:9 container across all display sizes:

| Target ID | Object Description | Left | Top | Width | Height | Inspection Image | Role in Puzzle |
|---|---|---|---|---|---|---|---|
| `skull` | Cranium of Keeper | `41.02%` | `10.42%` | `10.16%` | `18.75%` | `inspection/skull.png` | First Clue: Roman Numeral `I` (= 1) |
| `paper_7` | Western Folio Scrap | `25.78%` | `29.17%` | `10.16%` | `16.67%` | `inspection/paper_7.png` | Second Clue: Western Folio `7` |
| `paper_4` | Moonward Eastern Scrap | `57.42%` | `17.36%` | `9.77%` | `14.58%` | `inspection/paper_4.png` | Third Clue: Eastern Moonward `4` |
| `paper_3` | Archival Grave Record | `60.55%` | `29.86%` | `9.77%` | `13.89%` | `inspection/paper_3.png` | Non-Covenant Distractor: Burial Tally `3` |
| `paper_9` | Crimson-Sealed Record | `61.72%` | `40.28%` | `7.81%` | `12.50%` | `inspection/paper_9.png` | Fourth Clue: Final Seal Numeral `9` |
| `diary` | Open Leather-Bound Diary | `35.94%` | `34.72%` | `23.83%` | `27.78%` | `inspection/diary.png` | Keeper's Chronicle Reading Folio |
| `letter` | Wax-Sealed Dispatch | `27.34%` | `54.86%` | `16.02%` | `18.75%` | `inspection/letter.png` | Lore: Cartel Fleur-de-lis Dispatch |
| `key` | Antique Brass Skeleton Key | `49.61%` | `64.58%` | `10.94%` | `12.50%` | `inspection/key.png` | Lore: Ceremonial Crypt Key |
| `scroll` | Ancient Rolled Scroll | `70.31%` | `50.00%` | `13.67%` | `14.58%` | `inspection/scroll.png` | Lore: Crypt Catacomb Map |
| `chest` | Iron-Banded Coffer | `64.45%` | `65.28%` | `12.89%` | `13.89%` | `inspection/chest.png` | 4-Tumbler Lock / EMBER Reveal |

---

## 3. High-Definition Photographic Inspection Modals

Each object's modal displays the true photograph crop from the master asset:

1. **Skull Cranium (`skull`):**
   - Title: `CRANIUM OF THE SECOND KEEPER`
   - Subtitle: `Solitary Brow Marking: Roman Numeral I (First Digit: 1)`
   - Lore: *"Carved into the weathered frontal bone is a solitary Roman numeral 'I', etched with ceremonial precision. The chronicle designates this as the mark that stands alone upon the crowned keeper—the first digit of the forgotten covenant year."*
2. **Western Parchment (`paper_7`):**
   - Title: `WESTERN MARKER — VII (7)`
   - Subtitle: `Western Folio Scrap (Second Digit: 7)`
   - Lore: *"An aged parchment slip resting beyond the open folio where the western arm was laid to rest. Inscribed with dark iron-gall ink is the numeral '7'. In the keeper's chronicle, the western hand placed its seal directly after the solitary crown."*
3. **Eastern Moonward Scrap (`paper_4`):**
   - Title: `MOONWARD EASTERN SCRAP (4)`
   - Subtitle: `Eastern Moon Sign (Third Digit: 4)`
   - Lore: *"Resting beneath the skeletal arm that points toward the nocturnal moonlit sky lies a vellum slip marked with the numeral '4'. The chronicle declares that its opposite, beneath the moonward arm, speaks third."*
4. **Middle Eastern Distractor Scrap (`paper_3`):**
   - Title: `ARCHIVAL GRAVE RECORD (3)`
   - Subtitle: `Burial Record Scrap — Non-Covenant Distractor`
   - Status Badge: `✦ ARCHIVAL BURIAL SCRAP • NOT PART OF THE COVENANT YEAR ✦`
   - Lore: *"A fragmented burial tally recording three ceremonial censers buried during the second rites. A faded marginal note states: 'Tally of mortuary offerings—unrecorded in the covenant of years.' This scrap marks cemetery tribute rather than the four founding covenants."*
5. **Crimson-Sealed Scrap (`paper_9`):**
   - Title: `CRIMSON-SEALED RECORD (9)`
   - Subtitle: `Keeper's Seal Sign (Fourth Digit: 9)`
   - Lore: *"A weathered vellum fragment pinned firmly beneath the skeletal ribs beside a crimson wax seal. A bold numeral '9' is impressed upon its fiber. As the chronicle foretells: 'Close the year with the numeral pressed beside the crimson seal beneath the remains.' Positioned distinctly above the iron coffer."*
6. **Locked Iron Coffer (`chest`):**
   - Status Badge: `THE CHEST REMAINS SEALED.`
   - Lore: *"A heavy iron-banded chest forged from black oak and cold steel. The four-tumbler combination mechanism locks the lid shut. Enter the four-digit covenant year below to release the tumblers."*

---

## 4. Puzzle & Progression Flow

- **Chronicle Clue Verse:**
  > *"Four witnesses survived the keeper's final testimony.*  
  > *Begin with the mark that stands alone upon the crowned keeper.*  
  > *Next, seek the scrap resting beyond the open folio, where the western hand once placed its seal.*  
  > *Let its opposite, beneath the moonward arm, speak next.*  
  > *Close the year with the numeral pressed beside the crimson seal beneath the remains.*  
  > *The scattered tallies elsewhere remember the dead, not the covenant."*  
  > *"Read the relics. Restore the forgotten year."*

- **Covenant Code:** `1749`
- **Initial Tumbler State:** `0000`
- **Incorrect Submission (`0000`):** Shakes tumblers, plays error sound, displays toast: *"The tumblers jam. The year remains lost to time."* Zero answer disclosure.
- **Correct Submission (`1749`):**
  - Triggers golden illumination rays over coffer.
  - Opens reward modal with sacred syllable **`EMBER`**.
  - Evidence Journal updates to `2/3`.
  - Awards 250 CR once and persists state across reloads.

---

## 5. Playwright Browser Test & Verification Results

Full automated browser verification script executed at [`scripts/verify_coffin2_html_interactions.py`](file:///c:/Users/yashm/Downloads/winter%20arc/scripts/verify_coffin2_html_interactions.py):

| Verification Check | Target / Action | Result | Captured Proof |
|---|---|---|---|
| **Zero SVGs in Coffin** | `div[style*="aspect-ratio"] svg` | Count: 0 (Pass) | [`coffin2_html_clean_1920x1080.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_html_clean_1920x1080.png) |
| **Zero Hover Tooltips** | Hover all 10 targets | 0 popups / 0 glows (Pass) | Verified via Playwright hover loop |
| **Inspect Skull** | Click skull button | Modal opens with Roman I | [`coffin2_inspect_skull.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_skull.png) |
| **Inspect Paper 7** | Click paper 7 button | Modal opens with 7 | [`coffin2_inspect_paper7.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_paper7.png) |
| **Inspect Paper 4** | Click paper 4 button | Modal opens with 4 | [`coffin2_inspect_paper4.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_paper4.png) |
| **Inspect Paper 3** | Click paper 3 button | Modal opens with Distractor note | [`coffin2_inspect_paper3.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_paper3.png) |
| **Inspect Paper 9** | Click paper 9 button | Modal opens with 9 (Zero chest clash) | [`coffin2_inspect_paper9.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_paper9.png) |
| **Inspect Diary** | Click diary button | Opens Keeper's Chronicle folio | [`coffin2_inspect_diary.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_diary.png) |
| **Inspect Letter** | Click letter button | Opens Fleur-de-lis dispatch | [`coffin2_inspect_letter.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_letter.png) |
| **Inspect Key** | Click key button | Opens Skeleton Key lore | [`coffin2_inspect_key.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_key.png) |
| **Inspect Scroll** | Click scroll button | Opens Rolled Scroll lore | [`coffin2_inspect_scroll.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_scroll.png) |
| **Inspect Chest (Locked)** | Click chest before solve | Displays "THE CHEST REMAINS SEALED." | [`coffin2_inspect_chest_locked.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_chest_locked.png) |
| **Submit 0000** | Click UNLOCK | Displays tumbler jam toast | Verified |
| **Submit 1749** | Click UNLOCK | Unlocks chest & reveals EMBER | [`coffin2_inspect_chest_unlocked.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_inspect_chest_unlocked.png) |
| **Responsive 1600×900** | Viewport resize | No drift, clean ~75% screen area | [`coffin2_html_1600x900.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_html_1600x900.png) |
| **Responsive 1440×900** | Viewport resize | No drift, centered 16:10 | [`coffin2_html_1440x900.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_html_1440x900.png) |
| **Responsive 1366×768** | Viewport resize | No drift, all controls visible | [`coffin2_html_1366x768.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_html_1366x768.png) |
| **Responsive 1280×720** | Viewport resize | Compact 720p, zero scrollbars | [`coffin2_html_1280x720.png`](file:///c:/Users/yashm/Downloads/winter%20arc/docs/screenshots/coffin2_html_1280x720.png) |

---

## 6. Build & Test Summary

- **TypeScript (`npx tsc -b`):** Passed with 0 errors.
- **Vitest Suite (`Stage3ForgottenGraveyard.test.tsx`):** 5/5 tests passing.
- **Vite Production Build (`npm run build`):** Succeeded in 4.51s.
- **Git Commit:** Committed and ready for push.
