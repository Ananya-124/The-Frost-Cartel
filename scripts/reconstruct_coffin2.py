import re

file_path = 'src/components/game/stage3/Grave2BuriedDiary.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update image src to the new 2560x1440 master PNG
content = re.sub(
    r'<img\s+src="[^"]+"\s+alt="[^"]+"\s+className="w-full h-full object-contain pointer-events-none select-none"\s*/>',
    '''<img
            src="/assets/round-01/stage-03/coffin-02-buried-diary-master.png"
            alt="The Buried Diary - Pristine Coffin Environment"
            className="w-full h-full object-contain pointer-events-none select-none"
          />''',
    content
)

# Also ensure aspect ratio is 16 / 9
content = content.replace("aspectRatio: '1024 / 576'", "aspectRatio: '16 / 9'")

# 2. Update hotspots
h_start = content.find('{/* 1. ANCIENT DIARY')
h_end = content.find('</div>\n      </main>')

if h_start != -1 and h_end != -1:
    hotspots_new = '''{/* 1. ANCIENT DIARY (Resting on Skeleton’s Ribcage) */}
          <button
            type="button"
            aria-label="Ancient Diary: Click to Read the Keeper's Chronicle"
            onClick={() => {
              soundController.playParchmentOpen();
              setIsDiaryOpen(true);
            }}
            className="absolute z-20 cursor-pointer rounded-xl transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] group"
            style={{
              left: '34.0%',
              top: '32.0%',
              width: '32.0%',
              height: '30.0%',
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
            className="absolute z-20 cursor-pointer rounded-full transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] group"
            style={{
              left: '45.0%',
              top: '14.0%',
              width: '10.0%',
              height: '17.0%',
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
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] group"
            style={{
              left: '26.0%',
              top: '34.0%',
              width: '9.0%',
              height: '16.0%',
            }}
          >
            <span className="sr-only">Inspect Western Parchment 7</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-amber-500/80 text-[9px] font-mono font-bold text-amber-300 pointer-events-none">
              [7]
            </span>
          </button>

          {/* 4. SOUTHWESTERN PARCHMENT (Weathered Folio) */}
          <button
            type="button"
            aria-label="Southwestern Parchment 8"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p8');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '27.0%',
              top: '48.0%',
              width: '8.5%',
              height: '15.0%',
            }}
          >
            <span className="sr-only">Inspect Weathered Scrap</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-stone-500/80 text-[9px] font-mono font-bold text-stone-300 pointer-events-none">
              📜
            </span>
          </button>

          {/* 5. EASTERN MOON PARCHMENT "4" (Third Clue: 4 beneath eastern moon) */}
          <button
            type="button"
            aria-label="Eastern Moon Parchment 4 (Third Clue)"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p4');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] group"
            style={{
              left: '63.0%',
              top: '24.0%',
              width: '9.0%',
              height: '15.0%',
            }}
          >
            <span className="sr-only">Inspect Eastern Moon Parchment 4</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-amber-500/80 text-[9px] font-mono font-bold text-amber-300 pointer-events-none">
              [4]
            </span>
          </button>

          {/* 6. MID-EASTERN PARCHMENT (Weathered Folio) */}
          <button
            type="button"
            aria-label="Mid-Eastern Parchment 3"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p3');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '63.0%',
              top: '36.0%',
              width: '8.5%',
              height: '14.0%',
            }}
          >
            <span className="sr-only">Inspect Weathered Scrap</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-stone-500/80 text-[9px] font-mono font-bold text-stone-300 pointer-events-none">
              📜
            </span>
          </button>

          {/* 7. EASTERN SEAL PARCHMENT "9" (Fourth Clue: 9 beside crimson seal) */}
          <button
            type="button"
            aria-label="Eastern Seal Parchment 9 (Fourth Clue)"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p9');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] group"
            style={{
              left: '66.0%',
              top: '46.0%',
              width: '9.0%',
              height: '15.0%',
            }}
          >
            <span className="sr-only">Inspect Parchment 9 Beside Seal</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-amber-500/80 text-[9px] font-mono font-bold text-amber-300 pointer-events-none">
              [9]
            </span>
          </button>

          {/* 8. SOUTHEASTERN PARCHMENT (Weathered Folio) */}
          <button
            type="button"
            aria-label="Southeastern Parchment 6"
            onClick={() => {
              soundController.playClick();
              setInspectionItem('p6');
            }}
            className="absolute z-20 cursor-pointer rounded-lg transition-all duration-200 hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
            style={{
              left: '58.0%',
              top: '58.0%',
              width: '8.5%',
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
              left: '28.0%',
              top: '58.0%',
              width: '15.0%',
              height: '16.0%',
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
              left: '65.0%',
              top: '60.0%',
              width: '14.0%',
              height: '16.0%',
            }}
          >
            <span className="sr-only">{isCofferUnlocked ? 'Open Treasure Chest' : 'Locked Iron Coffer'}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border border-amber-500/80 text-[9px] font-cinzel font-bold text-amber-300 whitespace-nowrap shadow-md pointer-events-none">
              {isCofferUnlocked ? '✦ Unsealed Chest (EMBER)' : '🔒 Locked Coffer'}
            </span>
          </button>'''
    content = content[:h_start] + hotspots_new + content[h_end:]
    print("Hotspots replaced successfully")
else:
    print("Could not find hotspot range")

# 3. Update golden rays position to match chest on new master
content = re.sub(
    r'style=\{\{\s*left:\s*\'[^\']+\',\s*top:\s*\'[^\']+\',\s*width:\s*\'[^\']+\',\s*height:\s*\'[^\']+\',',
    '''style={{
                left: '65.0%',
                top: '59.0%',
                width: '14.0%',
                height: '17.0%', ''',
    content,
    count=1
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Grave2BuriedDiary.tsx with 2560x1440 master asset!")
