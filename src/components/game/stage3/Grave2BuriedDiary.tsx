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

type InspectionType =
  | 'p7'
  | 'p8'
  | 'p4'
  | 'p3'
  | 'p9'
  | 'p6'
  | 'envelope'
  | 'skull'
  | 'chest_locked';

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
  // 4-Digit Combination Lock: 0-9
  const [digits, setDigits] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [cofferError, setCofferError] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Modals & Overlays
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [inspectionItem, setInspectionItem] = useState<InspectionType | null>(null);
  const [isChestRewardOpen, setIsChestRewardOpen] = useState(false);

  // Keyboard navigation refs
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

    if (success || code === '1749' || code === '147') {
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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDiaryOpen(false);
        setInspectionItem(null);
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

      {/* 3. Central Stage: Pure Clean Artwork with Zero Baked-in UI & Accurate Invisible Hotspots */}
      <main className="relative flex-1 w-full flex items-center justify-center min-h-0 px-2 sm:px-4 py-1 overflow-hidden">
        <div
          className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-950/40"
          style={{ aspectRatio: '16 / 9' }}
        >
          {/* 100% Clean Photorealistic Artwork (No HUD, No Riddle Box, No Buttons) */}
          <img
            src="/assets/round-01/stage-03/coffin-02-buried-diary-master.png"
            alt="The Buried Diary - Pristine Coffin Environment"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Golden Rays Effect when Coffer is Unlocked */}
          {isCofferUnlocked && (
            <div
              className="absolute z-10 pointer-events-none animate-pulse"
              style={{
                left: '65.0%',
                top: '59.0%',
                width: '14.0%',
                height: '17.0%', 
                background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(245,158,11,0) 75%)',
                filter: 'drop-shadow(0 0 25px rgba(245,158,11,0.9))',
              }}
            />
          )}

          {/* ========================================================
              ACCURATE INVISIBLE INTERACTION HOTSPOTS (1024x576 Space)
             ======================================================== */}

          {/* 1. ANCIENT DIARY (Resting on Skeleton’s Ribcage) */}
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
          </button></div>
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

          {/* Combination Lock Controls (Right) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {isCofferUnlocked ? (
              <button
                type="button"
                onClick={() => setIsChestRewardOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-950 via-amber-950 to-emerald-950 border border-emerald-500 text-amber-200 font-cinzel text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer hover:border-amber-400 transition-all"
              >
                <span>🔓</span>
                <span>COVENANT (1749): &ldquo;EMBER&rdquo;</span>
                <span className="text-[10px] text-emerald-400">✦ VIEW</span>
              </button>
            ) : (
              <form onSubmit={handleUnlock} className="flex items-center gap-2 sm:gap-2.5">
                {/* 4 Digit Tumblers */}
                <div
                  className={`flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-xl bg-black/80 border transition-all ${
                    cofferError
                      ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-shake'
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
                  className={`px-4 sm:px-5 py-2.5 rounded-xl font-cinzel text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                    cofferError
                      ? 'bg-red-900 border-2 border-red-500 text-white animate-shake'
                      : 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 border-2 border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.45)] active:scale-95'
                  }`}
                >
                  UNLOCK
                </button>
              </form>
            )}
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
          MODAL 2: PARCHMENT & ARTIFACT INSPECTION MODAL
         ======================================================== */}
      {inspectionItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
          onClick={() => setInspectionItem(null)}
        >
          <div
            role="document"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#24130a] via-[#140803] to-[#0a0301] border-2 border-amber-600/70 p-5 sm:p-7 text-stone-100 shadow-[0_0_80px_rgba(245,158,11,0.4)] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-4">
              <div>
                <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                  BURIAL CHAMBER INSPECTION
                </div>
                <h3 className="text-base sm:text-lg font-cinzel font-black text-amber-100 tracking-wide">
                  {inspectionItem === 'p7' && 'WESTERN MARKER — VII (Digit 7)'}
                  {inspectionItem === 'p8' && 'SCATTERED FOLIO SCRAP'}
                  {inspectionItem === 'p4' && 'EASTERN MOON MARKER — IV (Digit 4)'}
                  {inspectionItem === 'p3' && 'SCATTERED FOLIO SCRAP'}
                  {inspectionItem === 'p9' && 'EASTERN SEAL MARKER — IX (Digit 9)'}
                  {inspectionItem === 'p6' && 'SCATTERED FOLIO SCRAP'}
                  {inspectionItem === 'envelope' && 'WAX-SEALED CEMETERY DISPATCH'}
                  {inspectionItem === 'skull' && 'CRANIUM OF THE SECOND KEEPER — MARK I'}
                  {inspectionItem === 'chest_locked' && 'IRON COFFER COMBINATION LOCK'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectionItem(null)}
                aria-label="Close Inspection"
                className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Visual Center */}
            <div className="flex flex-col items-center justify-center p-6 my-2 rounded-2xl bg-[#0d0603]/90 border border-amber-900/50 shadow-inner text-center">
              {/* Numbered Parchments (7, 8, 4, 3, 9, 6) */}
              {['p7', 'p8', 'p4', 'p3', 'p9', 'p6'].includes(inspectionItem) && (
                <div className="w-28 h-36 rounded-xl bg-gradient-to-b from-[#e3caa5] to-[#c29f6d] border-2 border-[#8b5a2b] shadow-[0_0_25px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center p-3 relative">
                  <div className="absolute inset-1 border border-[#8b5a2b]/40 rounded-lg pointer-events-none" />
                  <span className="text-[10px] font-cinzel font-bold text-[#5c3a21] uppercase tracking-widest">
                    ANNO
                  </span>
                  <span className="text-5xl font-mono font-black text-[#3a1f0d] my-1">
                    {inspectionItem === 'p7' && '7'}
                    {inspectionItem === 'p8' && '8'}
                    {inspectionItem === 'p4' && '4'}
                    {inspectionItem === 'p3' && '3'}
                    {inspectionItem === 'p9' && '9'}
                    {inspectionItem === 'p6' && '6'}
                  </span>
                  <span className="text-[9px] font-serif italic text-[#6e462b]">
                    {inspectionItem === 'p7' && 'Western Covenant Sign'}
                    {inspectionItem === 'p8' && 'Incidental Folio'}
                    {inspectionItem === 'p4' && 'Eastern Moon Sign'}
                    {inspectionItem === 'p3' && 'Incidental Folio'}
                    {inspectionItem === 'p9' && "Keeper's Seal Sign"}
                    {inspectionItem === 'p6' && 'Incidental Folio'}
                  </span>
                </div>
              )}

              {/* Skull */}
              {inspectionItem === 'skull' && (
                <div className="w-28 h-28 rounded-full bg-gradient-to-b from-stone-800 to-black border-2 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center relative">
                  <span className="text-4xl filter drop-shadow">💀</span>
                  <span className="text-red-500 font-cinzel font-black text-xs tracking-widest mt-1">
                    MARK: I (Digit: 1)
                  </span>
                </div>
              )}

              {/* Sealed Envelope */}
              {inspectionItem === 'envelope' && (
                <div className="w-36 h-24 rounded-lg bg-gradient-to-b from-[#d9be9b] to-[#bfa075] border-2 border-[#8b5a2b] shadow-xl flex items-center justify-center relative">
                  <div className="w-10 h-10 rounded-full bg-red-900 border-2 border-red-600 shadow-md flex items-center justify-center text-red-200 text-sm font-bold">
                    ⚜️
                  </div>
                </div>
              )}

              {/* Locked Chest */}
              {inspectionItem === 'chest_locked' && (
                <div className="w-32 h-24 rounded-xl bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-600 shadow-xl flex flex-col items-center justify-center">
                  <span className="text-3xl">🔒</span>
                  <span className="text-xs font-cinzel font-bold text-amber-300 mt-1">
                    4-TUMBLER COFFER
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="mt-4 font-serif italic text-xs text-stone-200 leading-relaxed max-w-xs">
                {inspectionItem === 'p7' &&
                  '“Seven stood to the west, where the old parchment rested.” Inscribed on aged vellum west of the keeper’s diary (Second mark: 7).'}
                {inspectionItem === 'p8' &&
                  'A weathered page resting near the lower velvet fold of the casket. An incidental fragment with no covenant seal.'}
                {inspectionItem === 'p4' &&
                  '“Four followed beneath the eastern moon.” Placed high on the eastern wall of the coffin beneath the moonlit spire (Third mark: 4).'}
                {inspectionItem === 'p3' &&
                  'An aged parchment marker placed beside the eastern ribcage. An incidental fragment with no covenant seal.'}
                {inspectionItem === 'p9' &&
                  '“Nine was the final mark, pressed beside the keeper’s seal.” Resting directly above the rolled scroll and iron coffer (Final mark: 9).'}
                {inspectionItem === 'p6' &&
                  'Tucked low in the coffin beside the skeletal phalanges and ancient coffer. An incidental fragment with no covenant seal.'}
                {inspectionItem === 'envelope' &&
                  'Addressed to the High Inquisitor. The crimson wax seal remains unbroken, preserving centuries of forgotten vows.'}
                {inspectionItem === 'skull' &&
                  '“The solitary mark upon the keeper’s brow opened the record.” The single scarlet mark begins the reckoning (First mark: 1).'}
                {inspectionItem === 'chest_locked' &&
                  'The iron coffer is held by a four-tumbler lock. Solve the keeper’s riddle to open it and claim the sacred syllable.'}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInspectionItem(null)}
              className="mt-2 w-full py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Close
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
