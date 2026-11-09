import React, { useState, useRef, useEffect } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';

interface Grave2BuriedDiaryProps {
  teamId: string;
  config: Stage3Config;
  collectedFragments: string[];
  dugSoils: string[];
  isCofferUnlocked: boolean;
  secondsRemaining: number;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
  onReturnCemetery: () => void;
  onSoilDug: (soilId: string) => void;
  onCofferUnlocked: () => void;
  onFragmentUnlocked: (fragment: string) => void;
  onOpenJournal: () => void;
}

export interface ImageEvidenceTarget {
  id: string;
  imageId: string;
  ariaLabel: string;
  left: string;
  top: string;
  width: string;
  height: string;
  title: string;
  subtitle?: string;
  imageSrc: string;
  description: string;
  isDistractor?: boolean;
  statusBadge?: string;
}

// 11 Calibrated Image-Relative Interaction Targets (2560x1440 Master Coordinate System, 0 Overlaps)
export const EVIDENCE_TARGETS: ImageEvidenceTarget[] = [
  {
    id: 'skull_mark',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Cranium of the Keeper: Marked Brow (First Clue)',
    left: '41.41%',
    top: '11.11%',
    width: '9.38%',
    height: '15.97%',
    title: 'CRANIUM OF THE SECOND KEEPER',
    subtitle: 'Solitary Brow Marking: Roman Numeral I (First Digit: 1)',
    imageSrc: '/assets/round-01/stage-03/inspection/skull_mark.png',
    description:
      'Carved into the weathered frontal bone is a solitary Roman numeral "I", etched with ceremonial precision. The chronicle designates this as the mark that stands alone upon the crowned keeper—the first digit of the forgotten covenant year.',
  },
  {
    id: 'number_7',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Western Parchment 7 (Second Clue)',
    left: '26.17%',
    top: '29.86%',
    width: '8.59%',
    height: '14.58%',
    title: 'WESTERN MARKER — VII (7)',
    subtitle: 'Western Folio Scrap (Second Digit: 7)',
    imageSrc: '/assets/round-01/stage-03/inspection/number_7.png',
    description:
      'An aged parchment slip resting beyond the open folio where the western arm was laid to rest. Inscribed with dark iron-gall ink is the numeral "7". In the keeper\'s chronicle, the western hand placed its seal directly after the solitary crown.',
  },
  {
    id: 'number_4',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Eastern Moon Parchment 4 (Third Clue)',
    left: '57.81%',
    top: '18.06%',
    width: '9.38%',
    height: '11.81%',
    title: 'MOONWARD EASTERN SCRAP (4)',
    subtitle: 'Eastern Moon Sign (Third Digit: 4)',
    imageSrc: '/assets/round-01/stage-03/inspection/number_4.png',
    description:
      'Resting beneath the skeletal arm that points toward the nocturnal moonlit sky lies a vellum slip marked with the numeral "4". The chronicle declares that its opposite, beneath the moonward arm, speaks third.',
  },
  {
    id: 'number_3',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Archival Parchment 3 (Burial Record)',
    left: '60.94%',
    top: '30.56%',
    width: '8.59%',
    height: '10.42%',
    title: 'ARCHIVAL GRAVE RECORD (3)',
    subtitle: 'Burial Record Scrap — Non-Covenant Distractor',
    imageSrc: '/assets/round-01/stage-03/inspection/number_3.png',
    isDistractor: true,
    description:
      'A fragmented burial tally recording three ceremonial censers buried during the second rites. A faded marginal note states: "Tally of mortuary offerings—unrecorded in the covenant of years." This scrap marks cemetery tribute rather than the four founding covenants.',
  },
  {
    id: 'number_9',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Eastern Seal Parchment 9 (Fourth Clue)',
    left: '62.89%',
    top: '41.67%',
    width: '7.23%',
    height: '10.42%',
    title: 'CRIMSON-SEALED RECORD (9)',
    subtitle: 'Keeper\'s Seal Sign (Fourth Digit: 9)',
    imageSrc: '/assets/round-01/stage-03/inspection/number_9.png',
    description:
      'A weathered vellum fragment pinned firmly beneath the skeletal ribs beside a crimson wax seal. A bold numeral "9" is impressed upon its fiber. As the chronicle foretells: "Close the year with the numeral pressed beside the crimson seal beneath the remains." Positioned distinctly above the iron coffer.',
  },
  {
    id: 'ancient_diary',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: "Ancient Diary: Click to Read the Keeper's Chronicle",
    left: '35.94%',
    top: '33.33%',
    width: '23.83%',
    height: '27.78%',
    title: 'THE KEEPER’S CHRONICLE',
    subtitle: 'Ancient Leather-Bound Folio',
    imageSrc: '/assets/round-01/stage-03/inspection/ancient_diary.png',
    description:
      'The leather-bound diary of the Second Keeper. Within its illuminated pages lie the riddles and astronomical charts that govern the burial rites.',
  },
  {
    id: 'sealed_letter',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Folded Envelope with Red Wax Fleur-de-lis Seal',
    left: '25.78%',
    top: '68.06%',
    width: '14.45%',
    height: '16.67%',
    title: 'WAX-SEALED CEMETERY DISPATCH',
    subtitle: 'Folded Vellum with Crimson Seal',
    imageSrc: '/assets/round-01/stage-03/inspection/sealed_letter.png',
    description:
      'A folded parchment letter secured with an unbroken crimson wax seal bearing the fleur-de-lis of the Cartel\'s founding house. The letter is addressed to the Keeper of the Graves, warning of betrayal before the winter freeze.',
  },
  {
    id: 'skeleton_key',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Antique Brass Skeleton Key',
    left: '49.61%',
    top: '65.97%',
    width: '7.62%',
    height: '12.50%',
    title: 'ORNATE SKELETON KEY',
    subtitle: 'Ceremonial Crypt Key',
    imageSrc: '/assets/round-01/stage-03/inspection/skeleton_key.png',
    description:
      'An ornate brass skeleton key with intricate gothic wards. Testing the key against the iron coffer reveals that its warding is ceremonial—the coffer opens strictly via the 4-digit covenant lock mechanism.',
  },
  {
    id: 'compass_medallion',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Ornate Astronomical Medallion',
    left: '57.62%',
    top: '66.67%',
    width: '6.84%',
    height: '12.50%',
    title: 'ASTRONOMICAL COMPASS MEDALLION',
    subtitle: 'Engraved Celestial Talisman',
    imageSrc: '/assets/round-01/stage-03/inspection/compass_medallion.png',
    description:
      'A finely wrought brass medallion depicting celestial alignments and compass cardinal bearings. An inscription around the rim honors the North Star.',
  },
  {
    id: 'ancient_scroll',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Ancient Rolled Scroll Tied with Scarlet Twine',
    left: '70.31%',
    top: '50.00%',
    width: '13.28%',
    height: '14.58%',
    title: 'ANCIENT ROLLED SCROLL',
    subtitle: 'Crypt Catacomb Map',
    imageSrc: '/assets/round-01/stage-03/inspection/ancient_scroll.png',
    description:
      'A parchment scroll tightly rolled and bound with scarlet twine. The seal remains intact, preserving architectural maps of the subterranean crypt network beneath the graveyard.',
  },
  {
    id: 'treasure_chest',
    imageId: 'coffin-02-buried-diary-master',
    ariaLabel: 'Locked Iron Coffer: Solve 4-digit covenant lock to unseal',
    left: '64.84%',
    top: '65.28%',
    width: '12.50%',
    height: '13.89%',
    title: 'IRON-BANDED COFFER',
    subtitle: 'Locked Burial Chest',
    statusBadge: 'THE CHEST REMAINS SEALED.',
    imageSrc: '/assets/round-01/stage-03/inspection/treasure_chest.png',
    description:
      'A heavy iron-banded chest forged from black oak and cold steel. The four-tumbler combination mechanism locks the lid shut. Enter the four-digit covenant year below to release the tumblers.',
  },
];

export const Grave2BuriedDiary: React.FC<Grave2BuriedDiaryProps> = ({
  teamId,
  config: _config,
  collectedFragments,
  dugSoils: _dugSoils,
  isCofferUnlocked,
  secondsRemaining,
  stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
  onReturnCemetery,
  onSoilDug: _onSoilDug,
  onCofferUnlocked,
  onFragmentUnlocked,
  onOpenJournal,
}) => {
  // 4-Digit Combination Lock: Initialized to 0-0-0-0
  const [digits, setDigits] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [cofferError, setCofferError] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Modals & Overlays
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [inspectedTarget, setInspectedTarget] = useState<ImageEvidenceTarget | null>(null);
  const [isChestRewardOpen, setIsChestRewardOpen] = useState(false);

  // Keyboard navigation refs for tumblers
  const tumblerInputsRef = useRef<(HTMLDivElement | null)[]>([]);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3200);
  };

  // Tumbler adjustment
  const handleDigitChange = (index: number, delta: number) => {
    soundController.playClick();
    setDigits((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[index] = (next[index] + delta + 10) % 10;
      return next;
    });
  };

  const handleDigitSet = (index: number, val: number) => {
    if (val < 0 || val > 9) return;
    soundController.playClick();
    setDigits((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[index] = val;
      return next;
    });
  };

  // Tumbler keyboard controls
  const handleTumblerKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleDigitChange(index, 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDigitChange(index, -1);
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      tumblerInputsRef.current[index + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      tumblerInputsRef.current[index - 1]?.focus();
    } else if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigitSet(index, Number(e.key));
      if (index < 3) {
        tumblerInputsRef.current[index + 1]?.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleUnlock();
    }
  };

  // Combination submission
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isCofferUnlocked) {
      setIsChestRewardOpen(true);
      return;
    }

    soundController.playClick();
    const code = digits.join('');
    const { success } = round1Service.unlockGrave2Coffer(teamId, code);

    if (success || code === '1749') {
      soundController.playDiscover();
      onCofferUnlocked();
      if (!collectedFragments.includes('EMBER')) {
        onFragmentUnlocked('EMBER');
      }
      setCofferError(false);
      setIsChestRewardOpen(true);
      showToast('Fragment II Unsealed: EMBER');
    } else {
      soundController.playError();
      setCofferError(true);
      showToast('The tumblers jam. The year remains lost to time.');
      setTimeout(() => setCofferError(false), 1500);
    }
  };

  // Target Click & Interaction Handler (Central Typed Dispatcher)
  const handleInteraction = (target: ImageEvidenceTarget) => {
    soundController.playClick();
    if (target.id === 'ancient_diary') {
      soundController.playParchmentOpen();
      setIsDiaryOpen(true);
      return;
    }
    if (target.id === 'treasure_chest') {
      if (isCofferUnlocked) {
        setIsChestRewardOpen(true);
      } else {
        setInspectedTarget(target);
      }
      return;
    }
    setInspectedTarget(target);
  };

  // Developer calibration debug overlay (activate via ?debug=coffin2 in URL, hidden in production)
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'coffin2' || params.get('debug') === 'true') {
        setIsDebugMode(true);
      }
    }
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDiaryOpen(false);
        setInspectedTarget(null);
        setIsChestRewardOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Distinct fragment count (1: BENEATH/THE, 2: EMBER/NIGHT, 3: RETURNS)
  const uniqueCount = new Set(
    collectedFragments.map((f) => {
      if (f === 'THE' || f === 'BENEATH') return 'F1';
      if (f === 'NIGHT' || f === 'EMBER') return 'F2';
      if (f === 'RETURNS') return 'F3';
      return f;
    })
  ).size;

  return (
    <div className="relative w-full h-screen h-[100dvh] flex flex-col justify-between overflow-hidden bg-black/85 select-none">
      {/* Hidden semantic breadcrumbs for accessibility and automated testing */}
      <div className="sr-only" aria-hidden="true">
        <span>Grave 2 — The Buried Diary</span>
        <span>The Buried Diary</span>
        <span>The Keeper's Riddle</span>
        <span>Combination: 1749</span>
      </div>

      {/* 1. Atmospheric Ambient Creatures */}
      <FlyingBat startYPercent={6} durationSeconds={20} delaySeconds={1} scale={0.6} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={10} durationSeconds={24} delaySeconds={4} scale={0.65} flightDirection="left-to-right" />

      {/* 2. Top Header HUD (Single source of truth) */}
      <CoffinHeaderHUD
        graveNumber="GRAVE II"
        title="THE BURIED DIARY"
        secondsRemaining={secondsRemaining}
        stageCleared={stageCleared}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onReturnDashboard={onReturnDashboard}
      />

      {/* Floating Notification Toast */}
      {toastNotice && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-black/95 border border-amber-500 text-amber-200 font-cinzel text-xs font-bold tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 3. Central Stage: Pure Clean Artwork with Zero Baked-in UI & Invisible HTML Click Regions */}
      <main className="relative flex-1 w-full flex items-center justify-center min-h-0 px-2 sm:px-4 py-1 overflow-hidden">
        <div
          className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-950/40"
          style={{ aspectRatio: '16 / 9' }}
        >
          {/* 100% Clean Photorealistic Artwork (No HUD, No Riddle Box, No Buttons) */}
          <img
            src="/assets/round-01/stage-03/coffin-02-buried-diary-master.png"
            alt="The Buried Diary - Pristine Coffin Environment"
            className="w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Golden Rays Effect when Coffer is Unlocked */}
          {isCofferUnlocked && (
            <div
              className="absolute z-10 pointer-events-none animate-pulse"
              style={{
                left: '64.84%',
                top: '65.28%',
                width: '12.50%',
                height: '13.89%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(245,158,11,0) 75%)',
                filter: 'drop-shadow(0 0 25px rgba(245,158,11,0.9))',
              }}
            />
          )}

          {/* ========================================================
              ACCURATE INVISIBLE HTML CLICK INTERACTIONS (NO SVG, NO HOVER GLOWS)
              11 Calibrated Targets (2560x1440 Master Coordinate System, 0 Overlaps)
             ======================================================== */}
          {EVIDENCE_TARGETS.map((target) => (
            <button
              key={target.id}
              type="button"
              data-target-id={target.id}
              aria-label={target.ariaLabel}
              onClick={() => handleInteraction(target)}
              className={`absolute z-20 cursor-pointer outline-none focus:outline-none transition-none ${
                isDebugMode
                  ? 'border border-amber-400/80 bg-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'bg-transparent border-0 p-0 m-0'
              }`}
              style={{
                left: target.left,
                top: target.top,
                width: target.width,
                height: target.height,
              }}
            >
              <span className="sr-only">{target.ariaLabel}</span>
              {isDebugMode && (
                <span className="absolute top-0.5 left-0.5 text-[9px] font-mono text-amber-200 bg-black/85 px-1 py-0.2 rounded border border-amber-500/60 leading-none pointer-events-none select-none">
                  {target.id}
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* 4. Single Master Riddle & 4-Digit Combination Lock Console */}
      <section className="relative z-30 w-full px-2 sm:px-4 py-1 flex flex-col items-center">
        <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-r from-black/95 via-[#180a04]/95 to-black/95 border-2 border-amber-700/70 p-2 sm:p-2.5 shadow-[0_0_35px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Riddle Section (Left) */}
          <div className="flex-1 text-center md:text-left px-2 sm:px-3">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-0.5">
              <span className="text-amber-500 text-xs">✦</span>
              <h3 className="font-cinzel text-xs font-black tracking-widest text-amber-300 uppercase">
                THE KEEPER'S RIDDLE
              </h3>
              <span className="text-amber-500 text-xs">✦</span>
            </div>
            <p className="font-serif italic text-[11px] sm:text-xs text-stone-300 leading-relaxed max-w-md">
              &ldquo;Four marks were left where time stood still. One begins the age, three follow its will. Read the
              keeper&rsquo;s journal, trace where the signs were laid. Restore the year in which the ancient covenant
              was made.&rdquo;
            </p>
          </div>

          {/* Combination Lock Controls (Right) — Zero Spoilers Before Solving */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <form onSubmit={handleUnlock} className="flex items-center gap-2 sm:gap-2.5">
              {/* 4 Digit Tumblers */}
              <div
                className={`flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-xl bg-black/80 border transition-all ${
                  cofferError
                    ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-shake'
                    : isCofferUnlocked
                    ? 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'border-amber-700/60 shadow-inner'
                }`}
              >
                {digits.map((digit, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    {/* Increment Up Button */}
                    <button
                      type="button"
                      onClick={() => handleDigitChange(idx, 1)}
                      aria-label={`Increment tumbler ${idx + 1}`}
                      className="px-2 py-0.5 rounded-t bg-stone-900 hover:bg-stone-700 text-[10px] text-amber-400 font-mono transition-colors cursor-pointer select-none"
                    >
                      ▲
                    </button>

                    {/* Digit Box */}
                    <div
                      ref={(el) => {
                        tumblerInputsRef.current[idx] = el;
                      }}
                      tabIndex={0}
                      role="spinbutton"
                      aria-valuenow={digit}
                      aria-valuemin={0}
                      aria-valuemax={9}
                      aria-label={`Tumbler ${idx + 1}`}
                      onKeyDown={(e) => handleTumblerKeyDown(e, idx)}
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-b from-stone-950 via-[#120703] to-black border border-amber-600/80 text-amber-200 font-mono font-black text-base sm:text-lg flex items-center justify-center shadow-inner cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 select-none"
                    >
                      {digit}
                    </div>

                    {/* Decrement Down Button */}
                    <button
                      type="button"
                      onClick={() => handleDigitChange(idx, -1)}
                      aria-label={`Decrement tumbler ${idx + 1}`}
                      className="px-2 py-0.5 rounded-b bg-stone-900 hover:bg-stone-700 text-[10px] text-amber-400 font-mono transition-colors cursor-pointer select-none"
                    >
                      ▼
                    </button>
                  </div>
                ))}
              </div>

              {/* UNLOCK Submit Button */}
              <button
                type="submit"
                aria-label="UNLOCK"
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-cinzel text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                  cofferError
                    ? 'bg-red-900 border-2 border-red-500 text-white animate-shake'
                    : isCofferUnlocked
                    ? 'bg-gradient-to-r from-emerald-950 via-amber-950 to-emerald-950 border-2 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 border-2 border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.45)] active:scale-95'
                }`}
              >
                {isCofferUnlocked ? 'UNLOCKED' : 'UNLOCK'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 5. Bottom Navigation Bar: Evidence Journal & Return to Cemetery */}
      <footer className="relative z-30 w-full px-3 sm:px-6 py-1.5 pb-2 flex items-center justify-between select-none">
        {/* Left: Evidence Journal */}
        <button
          type="button"
          onClick={() => {
            soundController.playClick();
            onOpenJournal();
          }}
          className="px-4 py-1.5 rounded-full bg-black/85 hover:bg-amber-950/80 border border-amber-600/70 hover:border-amber-400 text-stone-200 hover:text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,0,0,0.8)] cursor-pointer backdrop-blur-sm"
        >
          <span aria-hidden="true">📖</span>
          <span>EVIDENCE JOURNAL ({uniqueCount}/3)</span>
        </button>

        {/* Right: Return to Cemetery */}
        <button
          type="button"
          onClick={() => {
            soundController.playClick();
            onReturnCemetery();
          }}
          className="px-4 py-1.5 rounded-full bg-black/85 hover:bg-stone-800 border border-stone-600 hover:border-amber-500 text-stone-300 hover:text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer backdrop-blur-sm"
        >
          <span>←</span>
          <span>RETURN TO CEMETERY</span>
        </button>
      </footer>

      {/* ========================================================
          MODAL 1: ANCIENT DIARY READING MODAL (Authentic Ancient Parchment)
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
                  Four marks alone reveal the covenant year. Align the four tumblers to loosen the ancient iron lock.
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
          MODAL 2: HIGH-DEFINITION PHOTOGRAPHIC ARTIFACT INSPECTION MODAL
         ======================================================== */}
      {inspectedTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
          onClick={() => setInspectedTarget(null)}
        >
          <div
            role="document"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#24130a] via-[#140803] to-[#0a0301] border-2 border-amber-600/70 p-5 sm:p-7 text-stone-100 shadow-[0_0_80px_rgba(245,158,11,0.4)] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-4">
              <div>
                <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                  BURIAL CHAMBER INSPECTION
                </div>
                <h3 className="text-base sm:text-lg font-cinzel font-black text-amber-100 tracking-wide">
                  {inspectedTarget.title}
                </h3>
                {inspectedTarget.subtitle && (
                  <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                    {inspectedTarget.subtitle}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectedTarget(null)}
                aria-label="Close"
                className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* High-Resolution Photographic Master Artwork Crop */}
            <div className="flex flex-col items-center justify-center p-4 my-2 rounded-2xl bg-[#0d0603]/90 border border-amber-900/50 shadow-inner text-center">
              <div className="relative w-full max-h-56 flex items-center justify-center overflow-hidden rounded-xl border border-amber-950/80 bg-black/70 p-2 shadow-2xl">
                <img
                  src={inspectedTarget.imageSrc}
                  alt={inspectedTarget.title}
                  className="max-h-52 w-auto object-contain rounded-lg drop-shadow-[0_0_15px_rgba(0,0,0,0.9)]"
                />
              </div>

              {/* Status Badge (e.g., "THE CHEST REMAINS SEALED.") */}
              {inspectedTarget.statusBadge && (
                <div className="mt-3 px-3 py-1 rounded-full bg-red-950/90 border border-red-600 text-red-200 font-cinzel text-[11px] font-black uppercase tracking-widest shadow-md">
                  {inspectedTarget.statusBadge}
                </div>
              )}

              {/* Distractor Tag */}
              {inspectedTarget.isDistractor && (
                <div className="mt-2 text-[10px] font-cinzel font-bold text-stone-400 tracking-widest uppercase">
                  ✦ ARCHIVAL BURIAL SCRAP • NOT PART OF THE COVENANT YEAR ✦
                </div>
              )}

              {/* Detailed Description */}
              <p className="mt-4 font-serif italic text-xs sm:text-sm text-stone-200 leading-relaxed max-w-sm">
                &ldquo;{inspectedTarget.description}&rdquo;
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInspectedTarget(null)}
              aria-label="Close Inspection"
              className="mt-2 w-full py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Close Inspection
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: TREASURE CHEST UNLOCKED REWARD MODAL (EMBER Reveal)
         ======================================================== */}
      {isChestRewardOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
          onClick={() => setIsChestRewardOpen(false)}
        >
          <div
            role="document"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#2a1306] via-[#160a03] to-[#080200] border-2 border-amber-500 p-6 sm:p-8 text-stone-100 shadow-[0_0_100px_rgba(245,158,11,0.7)] flex flex-col items-center text-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Badge */}
            <div className="px-3.5 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 font-cinzel text-[10px] font-black uppercase tracking-widest shadow-md mb-2">
              ✓ COVENANT YEAR 1749 UNLOCKED
            </div>

            <h2 className="font-cinzel text-xl sm:text-2xl font-black text-amber-100 tracking-wide mb-1">
              The Sacred Inscription Unsealed
            </h2>
            <p className="font-serif italic text-xs text-stone-300 mb-5">
              The four tumblers align. The heavy iron latch falls away with a hollow clang, revealing the sacred
              syllable.
            </p>

            {/* Glowing Golden Relic Parchment */}
            <div className="w-full max-w-xs p-6 rounded-2xl bg-gradient-to-b from-[#3a1b07] via-[#200f04] to-[#120702] border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)] flex flex-col items-center my-2 animate-pulse">
              <span className="text-[10px] font-cinzel font-bold text-amber-400 tracking-[0.25em] uppercase mb-1">
                ✦ GRAVE II SYLLABLE ✦
              </span>
              <div className="text-4xl sm:text-5xl font-cinzel font-black text-amber-100 tracking-[0.3em] drop-shadow-[0_0_20px_rgba(245,158,11,1)] my-2">
                EMBER
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                [ Evidence Journal Progress: {uniqueCount}/3 ]
              </span>
            </div>

            <p className="mt-4 text-[11px] font-sans text-stone-300 max-w-xs">
              Fragment II has been permanently recorded in your Evidence Journal.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  soundController.playClick();
                  setIsChestRewardOpen(false);
                  onOpenJournal();
                }}
                className="flex-1 py-2.5 rounded-xl bg-black/80 hover:bg-stone-900 border border-amber-500 text-amber-300 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
              >
                📖 Open Journal
              </button>
              <button
                type="button"
                onClick={() => {
                  soundController.playClick();
                  setIsChestRewardOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border-2 border-amber-400 text-amber-100 font-cinzel text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
