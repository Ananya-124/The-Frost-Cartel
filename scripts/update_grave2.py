import re

file_path = 'src/components/game/stage3/Grave2BuriedDiary.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Diary Modal
m1_pos = content.find('MODAL 1: ANCIENT DIARY READING MODAL')
m2_pos = content.find('MODAL 2: PARCHMENT & ARTIFACT INSPECTION MODAL')

if m1_pos != -1 and m2_pos != -1:
    modal1_new = '''MODAL 1: ANCIENT DIARY READING MODAL (Authentic Ancient Parchment)
         ======================================================== */}
      {isDiaryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="diary-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
          onClick={() => setIsDiaryOpen(false)}
        >
          <div
            role="document"
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#221006] via-[#140803] to-[#0a0301] border-2 border-amber-600/80 p-5 sm:p-8 text-stone-100 shadow-[0_0_90px_rgba(245,158,11,0.5)] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  📖
                </span>
                <div>
                  <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                    CEMETERY DISPATCH • EXHUMED RECORD
                  </div>
                  <h2
                    id="diary-modal-title"
                    className="text-base sm:text-xl font-cinzel font-black text-amber-100 tracking-wide"
                  >
                    The Keeper&rsquo;s Chronicle &mdash; Anno Domini
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiaryOpen(false)}
                aria-label="Close Diary"
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                ✕ Close Diary
              </button>
            </div>

            {/* Ancient Vellum Folio Page */}
            <div className="relative my-2 p-5 sm:p-8 rounded-2xl bg-gradient-to-b from-[#2a170b] via-[#1a0c05] to-[#120602] border border-amber-600/50 shadow-[inset_0_0_40px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden">
              {/* Ornate corner borders */}
              <div className="absolute top-2 left-2 text-amber-500/40 text-lg pointer-events-none select-none">╔</div>
              <div className="absolute top-2 right-2 text-amber-500/40 text-lg pointer-events-none select-none">╗</div>
              <div className="absolute bottom-2 left-2 text-amber-500/40 text-lg pointer-events-none select-none">╚</div>
              <div className="absolute bottom-2 right-2 text-amber-500/40 text-lg pointer-events-none select-none">╝</div>

              <div className="max-w-2xl mx-auto text-center space-y-4">
                <div className="text-[11px] font-cinzel font-bold text-amber-400/90 uppercase tracking-[0.25em]">
                  ✦ TESTAMENTUM CUSTODIS • THE KEEPER’S CIPHER ✦
                </div>

                <div className="p-4 sm:p-6 rounded-xl bg-black/60 border border-amber-700/40 shadow-inner">
                  <p className="font-serif italic text-sm sm:text-base text-amber-100/95 leading-relaxed tracking-wide">
                    &ldquo;On the night the old covenant was sealed, four witnesses survived the keeper&rsquo;s final testimony.
                    <br />
                    <br />
                    Begin with the mark that stands alone upon the crowned keeper.
                    <br />
                    Next, seek the scrap resting beyond the open folio, where the western hand once placed its seal.
                    <br />
                    Let its opposite, beneath the moonward arm, speak next.
                    <br />
                    Close the year with the numeral pressed beside the crimson seal beneath the remains.
                    <br />
                    <br />
                    The scattered tallies elsewhere remember the dead, not the covenant.&rdquo;
                  </p>

                  <div className="mt-5 pt-3 border-t border-amber-800/40 text-amber-400 font-cinzel text-xs font-bold tracking-widest uppercase">
                    &ldquo;Read the relics. Restore the forgotten year.&rdquo;
                  </div>
                </div>

                <p className="text-[11px] font-serif italic text-stone-400">
                  Four signs alone reveal the covenant year. Align the four tumblers to loosen the ancient iron lock.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-amber-900/40 pt-3 mt-2">
              <span className="text-[10px] font-mono text-stone-400">
                Preserved in Grave II &bull; Four marks forge the forgotten year
              </span>
              <button
                type="button"
                onClick={() => setIsDiaryOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-900/80 hover:bg-amber-800 border border-amber-500 text-amber-100 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
              >
                Close &amp; Enter Combination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          '''
    content = content[:m1_pos] + modal1_new + content[m2_pos:]
    print("Modal 1 successfully updated!")
else:
    print("Could not find Modal 1 markers")

# 2. Update Hotspots
hotspots_old_start = '{/* 1. ANCIENT DIARY (Resting on Skeleton’s Ribcage) */}'
if hotspots_old_start not in content:
    h_idx = content.find('{/* 1. ANCIENT DIARY')
else:
    h_idx = content.find(hotspots_old_start)

h_end = content.find('</div>\n      </main>')
if h_idx != -1 and h_end != -1:
    hotspots_new = '''{/* 1. ANCIENT DIARY (Resting on Skeleton’s Ribcage) */}
          <button
            type="button"
            aria-label="Ancient Diary: Click to Read the Keeper's Chronicle"
            onClick={() => {
              soundController.playParchmentOpen();
              setIsDiaryOpen(true);
            }}
            className="absolute z-20 cursor-pointer rounded-xl transition-all duration-200 hover:bg-amber-400/10 hover:shadow-[0_0_25px_rgba(245,158,11,0.45)] group"
            style={{
              left: '35.5%',
              top: '31.0%',
              width: '26.5%',
              height: '29.0%',
            }}
          >
            <span className="sr-only">Read Ancient Diary</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border border-amber-500/80 text-[10px] font-cinzel font-bold text-amber-300 tracking-wider whitespace-nowrap shadow-md pointer-events-none">
              📖 Read Ancient Diary
            </span>
          </button>

          {/* 2. SKELETON SKULL (Cranium with Solitary Brow Mark: Roman I = Digit 1) */}
          <button
            type="button"
            aria-label="Cranium of the Keeper: Marked Brow (First Clue)"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('skull');
            }}
            className="absolute z-20 cursor-pointer rounded-full transition-all duration-200 hover:bg-amber-400/10 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] group"
            style={{
              left: '42.5%',
              top: '11.0%',
              width: '8.5%',
              height: '16.0%',
            }}
          >
            <span className="sr-only">Inspect Skull Brow Mark</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/90 border border-amber-500/80 text-[9px] font-cinzel font-bold text-amber-300 tracking-wider whitespace-nowrap shadow-md pointer-events-none">
              💀 Inspect Brow Mark (I)
            </span>
          </button>

          {/* 3. WESTERN PARCHMENT "7" (Second Clue: 7 to the west) */}
          <button
            type="button"
            aria-label="Western Parchment 7 (Second Clue)"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p7');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '31.8%',
              top: '27.5%',
              width: '8.8%',
              height: '15.5%',
            }}
          >
            <span className="sr-only">Inspect Western Parchment 7</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-amber-500/80 text-[9px] font-mono font-bold text-amber-300 pointer-events-none">
              [7]
            </span>
          </button>

          {/* 4. SOUTHWESTERN PARCHMENT (Incidental Grave Marker - Numeral 8 Removed) */}
          <button
            type="button"
            aria-label="Southwestern Parchment 8"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p8');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '30.0%',
              top: '41.5%',
              width: '8.0%',
              height: '15.5%',
            }}
          >
            <span className="sr-only">Inspect Weathered Scrap</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-stone-500/80 text-[9px] font-mono font-bold text-stone-300 pointer-events-none">
              📜
            </span>
          </button>

          {/* 5. EASTERN MOON PARCHMENT "4" (Third Clue: 4 beneath the eastern moon) */}
          <button
            type="button"
            aria-label="Eastern Moon Parchment 4 (Third Clue)"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p4');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '55.5%',
              top: '17.0%',
              width: '8.0%',
              height: '14.0%',
            }}
          >
            <span className="sr-only">Inspect Eastern Moon Parchment 4</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-amber-500/80 text-[9px] font-mono font-bold text-amber-300 pointer-events-none">
              [4]
            </span>
          </button>

          {/* 6. MID-EASTERN PARCHMENT (Incidental Grave Marker - Numeral 3 Removed) */}
          <button
            type="button"
            aria-label="Mid-Eastern Parchment 3"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p3');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '61.0%',
              top: '25.5%',
              width: '8.0%',
              height: '14.0%',
            }}
          >
            <span className="sr-only">Inspect Weathered Scrap</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-stone-500/80 text-[9px] font-mono font-bold text-stone-300 pointer-events-none">
              📜
            </span>
          </button>

          {/* 7. EASTERN SEAL PARCHMENT "9" (Fourth Clue: 9 beside the crimson seal) */}
          <button
            type="button"
            aria-label="Eastern Seal Parchment 9 (Fourth Clue)"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p9');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '66.0%',
              top: '38.0%',
              width: '8.0%',
              height: '15.5%',
            }}
          >
            <span className="sr-only">Inspect Parchment 9 Beside Seal</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-amber-500/80 text-[9px] font-mono font-bold text-amber-300 pointer-events-none">
              [9]
            </span>
          </button>

          {/* 8. SOUTHEASTERN PARCHMENT (Incidental Grave Marker - Numeral 6 Removed) */}
          <button
            type="button"
            aria-label="Southeastern Parchment 6"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p6');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '61.0%',
              top: '55.0%',
              width: '8.8%',
              height: '14.0%',
            }}
          >
            <span className="sr-only">Inspect Weathered Scrap</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-stone-500/80 text-[9px] font-mono font-bold text-stone-300 pointer-events-none">
              📜
            </span>
          </button>

          {/* 9. WAX-SEALED LETTER (Crimson Fleur-de-lis Dispatch) */}
          <button
            type="button"
            aria-label="Folded Envelope with Red Wax Fleur-de-lis Seal"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('envelope');
            }}
            className="absolute z-20 cursor-pointer rounded-xl transition-all duration-200 hover:bg-red-500/15 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] group"
            style={{
              left: '29.0%',
              top: '55.0%',
              width: '14.8%',
              height: '17.5%',
            }}
          >
            <span className="sr-only">Inspect Wax-Sealed Letter</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/90 border border-red-500/80 text-[9px] font-cinzel font-bold text-red-200 whitespace-nowrap shadow-md pointer-events-none">
              ✉️ Wax-Sealed Letter
            </span>
          </button>

          {/* 10. TREASURE CHEST (Iron-Banded Coffer at Lower Right) */}
          <button
            type="button"
            aria-label={
              isCofferUnlocked
                ? 'Unsealed Treasure Chest: View Fragment II "EMBER"'
                : 'Locked Iron Coffer: Solve 4-digit covenant lock to unseal'
            }
            onClick={() => {
              soundController.playClick();
              if (isCofferUnlocked) {
                setIsChestRewardOpen(true);
              } else {
                setInspectionItem('chest_locked');
              }
            }}
            className="absolute z-20 cursor-pointer rounded-xl transition-all duration-200 hover:bg-amber-400/20 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] group"
            style={{
              left: '66.0%',
              top: '62.0%',
              width: '13.0%',
              height: '14.0%',
            }}
          >
            <span className="sr-only">{isCofferUnlocked ? 'Open Treasure Chest' : 'Locked Iron Coffer'}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border border-amber-500/80 text-[9px] font-cinzel font-bold text-amber-300 whitespace-nowrap shadow-md pointer-events-none">
              {isCofferUnlocked ? '✦ Unsealed Chest (EMBER)' : '🔒 Locked Coffer'}
            </span>
          </button>
        '''
    content = content[:h_idx] + hotspots_new + content[h_end:]
    print("Hotspots successfully updated!")
else:
    print("Could not find Hotspots markers")

# 3. Update Inspection modal texts
FOLIO_SCRAP_LITERAL = "'SCATTERED FOLIO SCRAP'"
content = content.replace(
    "'WESTERN MARKER — VII'",
    "'WESTERN MARKER — VII (Digit 7)'"
)
content = content.replace(
    "'SCATTERED BURIAL PAGE — VIII'",
    FOLIO_SCRAP_LITERAL
)
content = content.replace(
    "'EASTERN MOON MARKER — IV'",
    "'EASTERN MOON MARKER — IV (Digit 4)'"
)
content = content.replace(
    "'SCATTERED BURIAL PAGE — III'",
    FOLIO_SCRAP_LITERAL
)
content = content.replace(
    "'EASTERN SEAL MARKER — IX'",
    "'EASTERN SEAL MARKER — IX (Digit 9)'"
)
content = content.replace(
    "'SCATTERED BURIAL PAGE — VI'",
    FOLIO_SCRAP_LITERAL
)
content = content.replace(
    "'CRANIUM OF THE SECOND KEEPER'",
    "'CRANIUM OF THE SECOND KEEPER — MARK I'"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Grave2BuriedDiary.tsx updated successfully!")
