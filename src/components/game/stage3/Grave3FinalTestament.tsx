import React, { useState } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';

export interface ImageEvidenceTarget {
  id: string;
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

// 8 Precision Calibrated Target Hotspots (16:9 Master Coordinate System, 0 Overlaps)
export const COFFIN3_TARGETS: ImageEvidenceTarget[] = [
  {
    id: 'skeleton_iii',
    ariaLabel: 'Inspect Cranium of the Arch-Warden marked III',
    left: '27.83%',
    top: '13.89%',
    width: '10.74%',
    height: '18.23%',
    title: 'CRANIUM OF THE ARCH-WARDEN (III)',
    subtitle: 'Exhumed Skeletal Cranium marked III',
    imageSrc: '/assets/round-01/stage-03/inspection/skeleton_iii.png',
    description:
      'Carved into the frontal bone is the Roman numeral "III" etched with ceremonial cinnabar pigment. The arch-warden was the astronomer of the sepulcher who mapped the movements of the three heavenly watchers before the cartographers were sealed in stone.',
  },
  {
    id: 'soul_crystal',
    ariaLabel: 'Inspect Azure Soul Crystal',
    left: '24.9%',
    top: '32.99%',
    width: '4.2%',
    height: '9.55%',
    title: 'AZURE SOUL CRYSTAL',
    subtitle: 'Pulsating Celestial Ether Relic',
    imageSrc: '/assets/round-01/stage-03/inspection/soul_crystal.png',
    description:
      'A brilliant cerulean crystal pulsing with ethereal astral light. Its facets resonate with the outer spheres of the night. An inscription at its base whispers: "Look to the pale sphere that commands the outer darkness—only the Moon may crown the first circle."',
  },
  {
    id: 'celestial_medallion',
    ariaLabel: 'Inspect Celestial Astral Medallion',
    left: '39.55%',
    top: '30.38%',
    width: '5.86%',
    height: '11.28%',
    title: 'CELESTIAL ASTRAL MEDALLION',
    subtitle: 'Tri-Concentric Bronze Talisman on Ribcage',
    imageSrc: '/assets/round-01/stage-03/inspection/celestial_medallion.png',
    description:
      'An antique bronze talisman resting upon the skeletal sternum. Its face is etched with three concentric rotating rims, perfectly matching the triple-ring locking mechanism that seals the final testament.',
  },
  {
    id: 'potion_bottle',
    ariaLabel: 'Inspect Cinnabar Infusion Potion Phial',
    left: '29.49%',
    top: '43.06%',
    width: '5.18%',
    height: '12.5%',
    title: 'CINNABAR INFUSION PHIAL',
    subtitle: 'Consecrated Alchemical Solvent',
    imageSrc: '/assets/round-01/stage-03/inspection/potion_bottle.png',
    description:
      'A heavy glass phial sealed with crimson wax. Inside, an incandescent scarlet essence swirls against gravity. The glass is stamped: "Distilled at the deepest forge. It burns closest to the heart, yet its heat must fade before the dawn. The Sacred Flame belongs to the innermost ring."',
  },
  {
    id: 'ancient_book',
    ariaLabel: 'Inspect Grimoire of the Constellations',
    left: '35.16%',
    top: '43.06%',
    width: '11.72%',
    height: '17.71%',
    title: 'GRIMOIRE OF THE CONSTELLATIONS',
    subtitle: 'Solar Cross Gilded Leather Tome',
    imageSrc: '/assets/round-01/stage-03/inspection/ancient_book.png',
    description:
      'Bound in midnight calfskin with heavy gilded brass clasps. A passage on page 48 states: "Between the outer vault of darkness and the inner altar of flame flies the Raven of twilight. He claims neither the cold void nor the sacred fire, but circles forever between them as the middle guardian."',
  },
  {
    id: 'ancient_scroll',
    ariaLabel: 'Inspect Ancient Testament Scroll',
    left: '50.29%',
    top: '40.8%',
    width: '6.35%',
    height: '18.23%',
    title: 'ANCIENT TESTAMENT SCROLL',
    subtitle: 'Mortuary Vellum with Red Silk Ribbon',
    imageSrc: '/assets/round-01/stage-03/inspection/ancient_scroll.png',
    description:
      'An aged vellum scroll secured by red silk ribbon. It preserves the keeper decree: "Restore the three guardians to their circles: Moon upon the Outer, Raven upon the Middle, Flame upon the Inner. Only then will the unsealing command reveal the final syllable: RETURNS."',
  },
  {
    id: 'star_chart_parchment',
    ariaLabel: 'Inspect Astronomical Chart of the Spheres',
    left: '58.11%',
    top: '41.67%',
    width: '14.65%',
    height: '13.89%',
    title: 'ASTRONOMICAL CHART OF THE SPHERES',
    subtitle: 'Orbes Motus Luminis Tenebrae Aeterna Via',
    imageSrc: '/assets/round-01/stage-03/inspection/star_chart_parchment.png',
    description:
      'A scorched parchment manuscript illustrating three concentric orbital tracks. The Latin rubric reads: "Circles of motion, light, and shadow: the eternal path." The outermost track depicts the Moon, the intermediate orbit shows the Raven, and the core hearth burns with Flame.',
  },
  {
    id: 'relic_chest',
    ariaLabel: 'Inspect Carved Relic Chest',
    left: '62.5%',
    top: '56.42%',
    width: '12.21%',
    height: '12.15%',
    title: 'CARVED RELIC CHEST',
    subtitle: 'Iron-Strapped Cartel Reliquary',
    imageSrc: '/assets/round-01/stage-03/inspection/relic_chest.png',
    description:
      'An antique wooden casket bound in blackened iron with engraved lunar and solar relief carvings. Its locking plate has three concentric tumblers awaiting the celestial alignment.',
  },
];

interface Grave3FinalTestamentProps {
  teamId: string;
  config: Stage3Config;
  collectedFragments: string[];
  ringIndices: number[];
  isGrave3Unlocked: boolean;
  secondsRemaining: number;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
  onReturnCemetery: () => void;
  onRotateRing: (ringIndex: number, direction: 'cw' | 'ccw') => void;
  onFragmentUnlocked: (fragment: string) => void;
  onOpenJournal: () => void;
}

const RUNE_ICONS: Record<string, string> = {
  MOON: '🌙',
  RAVEN: '🦅',
  FLAME: '🔥',
  SKULL: '💀',
  SUN: '☀️',
  FROST: '❄️',
};

export const Grave3FinalTestament: React.FC<Grave3FinalTestamentProps> = ({
  teamId: _teamId,
  config,
  collectedFragments,
  ringIndices,
  isGrave3Unlocked: _isGrave3Unlocked,
  secondsRemaining,
  stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
  onReturnCemetery,
  onRotateRing,
  onFragmentUnlocked,
  onOpenJournal,
}) => {
  // Modal & Inspection State
  const [inspectedTarget, setInspectedTarget] = useState<ImageEvidenceTarget | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [shakeLock, setShakeLock] = useState(false);

  // Fallback default ring symbols if config is missing
  const rings = config.grave3?.runeRings || [
    { id: 'ring_1', name: 'Outer Ring', symbols: ['FLAME', 'MOON', 'RAVEN', 'SKULL'] },
    { id: 'ring_2', name: 'Middle Ring', symbols: ['SKULL', 'FLAME', 'RAVEN', 'MOON'] },
    { id: 'ring_3', name: 'Inner Ring', symbols: ['MOON', 'RAVEN', 'FLAME', 'SKULL'] },
  ];

  const currentSymbols = [
    rings[0]?.symbols[(ringIndices[0] ?? 0) % (rings[0]?.symbols.length || 4)] || 'MOON',
    rings[1]?.symbols[(ringIndices[1] ?? 0) % (rings[1]?.symbols.length || 4)] || 'RAVEN',
    rings[2]?.symbols[(ringIndices[2] ?? 0) % (rings[2]?.symbols.length || 4)] || 'FLAME',
  ];

  const isUnlocked = collectedFragments.includes('RETURNS') || config.grave3?.isCompleted;
  const isAligned =
    currentSymbols[0] === 'MOON' &&
    currentSymbols[1] === 'RAVEN' &&
    currentSymbols[2] === 'FLAME';

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3800);
  };

  const handleInspect = (target: ImageEvidenceTarget) => {
    soundController.playClick();
    setInspectedTarget(target);
  };

  const handleRotate = (ringIndex: number, direction: 'cw' | 'ccw') => {
    soundController.playClick();
    onRotateRing(ringIndex, direction);
  };

  const handleUnseal = () => {
    if (isUnlocked) {
      soundController.playParchmentOpen();
      setIsRewardModalOpen(true);
      return;
    }

    if (isAligned) {
      soundController.playChestUnlock();
      soundController.playVictory();
      const fragment = config.grave3?.clueFragment || 'RETURNS';
      onFragmentUnlocked(fragment);
      setIsRewardModalOpen(true);
      showToast('✦ CELESTIAL ALIGNMENT ACHIEVED! Syllable Unsealed: "RETURNS" ✦');
    } else {
      soundController.playWrongAnswer();
      setShakeLock(true);
      setLockError('The celestial runes resist your touch... The guardians are not in alignment.');
      setTimeout(() => setShakeLock(false), 800);
      setTimeout(() => setLockError(null), 3500);
    }
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* Hidden semantic breadcrumbs for accessibility and automated QA testing */}
      <div className="sr-only" aria-hidden="true">
        <span>Grave 3 — The Final Testament</span>
        <span>The Final Testament</span>
        <span>Three Rotating Rune Rings</span>
      </div>

      {/* 1. Atmospheric Ambient Creatures */}
      <FlyingBat startYPercent={7} durationSeconds={19} delaySeconds={1} scale={0.65} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={12} durationSeconds={24} delaySeconds={3} scale={0.7} flightDirection="left-to-right" />

      {/* 2. Fullscreen Master Coffin Environment (Zero Black Side Gutters, Full Viewport Width & Height) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
        <img
          src="/assets/round-01/stage-03/coffin-03-final-testament-master.png"
          alt="The Final Testament Master Coffin Environment"
          className="w-full h-full object-cover object-center pointer-events-none select-none"
        />
      </div>

      {/* 3. Calibrated Invisible Hotspots Layer (Zero Mouse-Click Outlines, 16:9 Coordinate System) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
        <div className="relative w-full h-full pointer-events-auto">
          {COFFIN3_TARGETS.map((target) => (
            <button
              key={target.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInspect(target)}
              aria-label={target.ariaLabel}
              className="absolute z-20 cursor-pointer bg-transparent border-0 outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none select-none transition-none shadow-none"
              style={{
                left: target.left,
                top: target.top,
                width: target.width,
                height: target.height,
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              }}
            >
              <span className="sr-only">{target.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Top HUD Header (Single source of truth, 3-column CSS Grid, zero GRAVE III) */}
      <CoffinHeaderHUD
        title="THE FINAL TESTAMENT"
        secondsRemaining={secondsRemaining}
        stageCleared={stageCleared}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onReturnDashboard={onReturnDashboard}
      />

      {/* Floating Notification Toast */}
      {toastNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-full bg-black/95 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-bold tracking-widest shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Center Spacer: keeps scene open and coffin visible */}
      <div className="flex-1 min-h-0 pointer-events-none" />

      {/* 5. Center-Bottom Console: The Keeper's Final Testament Riddle & 3 Concentric Celestial Rune Rings */}
      <section className="relative z-30 w-full px-2 sm:px-4 py-1 flex flex-col items-center">
        <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-r from-black/95 via-[#180a04]/95 to-black/95 border-2 border-amber-600/80 p-3 sm:p-3.5 shadow-[0_0_40px_rgba(0,0,0,0.95)] flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left: The Riddle Verse */}
          <div className="flex-1 text-center lg:text-left px-2 sm:px-4">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-1.5">
              <span className="text-amber-400 text-xs">✦</span>
              <h3 className="font-cinzel text-xs sm:text-sm font-black tracking-widest text-amber-200 uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                THE KEEPER&rsquo;S FINAL TESTAMENT
              </h3>
              <span className="text-amber-400 text-xs">✦</span>
            </div>
            <p className="font-serif italic text-[11px] sm:text-xs text-stone-300 leading-relaxed max-w-xl">
              &ldquo;Three guardians watch the heavens through the endless night. One wears the pale face that commands
              the outer darkness. Another travels between the heavens and the final fire, never claiming either throne.
              The last burns closest to the heart, yet fades before the dawn. Read the keeper&rsquo;s chart, listen to the
              relics, and restore their rightful circles. Only when each guardian finds its destined place shall the
              final testament awaken.&rdquo;
            </p>
            {lockError && (
              <div className="mt-1 text-[11px] font-cinzel font-bold text-red-400 tracking-wider animate-fadeIn">
                ⚠ {lockError}
              </div>
            )}
          </div>

          {/* Right: Header + Three Horizontal Ring Dials + Centered Unseal Button */}
          <div
            className={`flex flex-col items-center flex-shrink-0 transition-transform ${
              shakeLock ? 'animate-shake' : ''
            }`}
          >
            {/* Right Header: CONCENTRIC CELESTIAL RUNES */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 sm:w-8 h-[1px] bg-gradient-to-r from-transparent to-amber-500/70" />
              <span className="text-[10px] sm:text-[11px] font-cinzel font-bold tracking-[0.2em] text-amber-200 uppercase">
                CONCENTRIC CELESTIAL RUNES
              </span>
              <span className="w-6 sm:w-8 h-[1px] bg-gradient-to-l from-transparent to-amber-500/70" />
            </div>

            {/* Three Circular Rotating Rings in a single horizontal row */}
            <div className="flex items-center gap-3 sm:gap-4">
              {rings.map((ring, idx) => {
                const ringLabel =
                  idx === 0 ? 'RING I — OUTER' : idx === 1 ? 'RING II — MIDDLE' : 'RING III — INNER';
                const activeSymbol = currentSymbols[idx];
                const activeIcon = RUNE_ICONS[activeSymbol] || '✨';

                return (
                  <div key={ring.id} className="flex flex-col items-center">
                    {/* Pill Label */}
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-700/60 bg-black/80 text-[8px] sm:text-[9px] font-cinzel font-bold text-amber-300/90 tracking-wider uppercase mb-1 shadow-sm">
                      {ringLabel}
                    </span>

                    {/* Horizontal Stepper Row: ◄ [ Dial ] ► */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {/* Left Chevron Button (ccw) */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleRotate(idx, 'ccw')}
                        aria-label={`Rotate ${ringLabel} Counter-Clockwise`}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-stone-900/90 hover:bg-amber-950/90 border border-amber-700/70 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none shadow-md"
                      >
                        ◄
                      </button>

                      {/* Circular Dial Display */}
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                          isUnlocked
                            ? 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                            : isAligned
                            ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                            : 'border-amber-500/80 bg-gradient-to-b from-[#2a1708] via-[#120703] to-[#040201] shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                        }`}
                      >
                        <span className="text-lg sm:text-xl lg:text-2xl drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                          {activeIcon}
                        </span>
                        <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-cinzel font-black tracking-widest text-amber-100 uppercase mt-0.5">
                          {activeSymbol}
                        </span>
                      </div>

                      {/* Right Chevron Button (cw) */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleRotate(idx, 'cw')}
                        aria-label={`Rotate ${ringLabel} Clockwise`}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-stone-900/90 hover:bg-amber-950/90 border border-amber-700/70 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none shadow-md"
                      >
                        ►
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Centered Wide Golden Bar Button */}
            <div className="w-full mt-2.5 flex flex-col items-center">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleUnseal}
                aria-label="Unseal the Final Testament"
                className={`w-full py-2.5 sm:py-3 px-6 rounded-xl border-2 font-cinzel text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap outline-none focus:outline-none focus:ring-0 active:outline-none ${
                  isUnlocked
                    ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-600 border-amber-400 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.55)]'
                }`}
              >
                <span>{isUnlocked ? '✓' : '🔒'}</span>
                <span>{isUnlocked ? 'TESTAMENT UNSEALED' : 'UNSEAL THE FINAL TESTAMENT'}</span>
              </button>
              {isUnlocked && (
                <span className="text-[9px] font-mono text-emerald-300 tracking-wider uppercase mt-1">
                  Fragment &ldquo;RETURNS&rdquo; Unsealed
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom Navigation Controls: Evidence Journal & Return to Cemetery */}
      <footer className="relative z-30 px-3 sm:px-6 pb-2.5 pt-1 flex items-center justify-between select-none">
        {/* Evidence Journal Progress */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenJournal}
          aria-label="Open Evidence Journal"
          className="px-4 py-2 rounded-2xl bg-black/85 hover:bg-amber-950/80 border border-amber-600/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 outline-none focus:outline-none focus:ring-0"
        >
          <span>📖</span>
          <span>EVIDENCE JOURNAL ({collectedFragments.length}/3)</span>
        </button>

        {/* Return to Cemetery */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onReturnCemetery}
          aria-label="Return to Cemetery"
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-950 via-[#180a04] to-amber-950 hover:from-amber-900 hover:to-amber-800 border-2 border-amber-500/80 text-amber-200 font-cinzel text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 outline-none focus:outline-none focus:ring-0"
        >
          <span>←</span>
          <span>RETURN TO CEMETERY</span>
        </button>
      </footer>

      {/* ========================================================
          MODAL 1: PHOTOGRAPHIC ARTIFACT INSPECTION MODAL
         ======================================================== */}
      {inspectedTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="artifact-modal-title"
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
                  BURIAL VAULT ARTIFACT INSPECTION
                </div>
                <h3
                  id="artifact-modal-title"
                  className="text-base sm:text-lg font-cinzel font-black text-amber-100 tracking-wide"
                >
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
                aria-label="Close Inspection Modal"
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

              {/* Status Badge */}
              {inspectedTarget.statusBadge && (
                <div className="mt-3 px-3 py-1 rounded-full bg-red-950/90 border border-red-600 text-red-200 font-cinzel text-[11px] font-black uppercase tracking-widest shadow-md">
                  {inspectedTarget.statusBadge}
                </div>
              )}

              {/* Detailed Lore Description */}
              <p className="mt-4 font-serif italic text-xs sm:text-sm text-stone-200 leading-relaxed max-w-sm">
                &ldquo;{inspectedTarget.description}&rdquo;
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInspectedTarget(null)}
              aria-label="Close Inspection"
              className="mt-2 w-full py-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Close Inspection
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: FINAL TESTAMENT UNSEALED REWARD MODAL ("RETURNS")
         ======================================================== */}
      {isRewardModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="testament-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
          onClick={() => setIsRewardModalOpen(false)}
        >
          <div
            role="document"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#24130a] via-[#140803] to-[#0a0301] border-2 border-amber-500 p-6 sm:p-8 text-stone-100 shadow-[0_0_90px_rgba(245,158,11,0.5)] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-4">
              <div>
                <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                  ✦ CELESTIAL CODEX UNSEALED ✦
                </div>
                <h3
                  id="testament-modal-title"
                  className="text-lg sm:text-xl font-cinzel font-black text-amber-100 tracking-wide"
                >
                  The Keeper&rsquo;s Final Testament
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRewardModalOpen(false)}
                aria-label="Close Reward Modal"
                className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Revealed Secret Syllable & Full Incantation */}
            <div className="flex flex-col items-center justify-center p-5 my-2 rounded-2xl bg-[#0d0603]/90 border border-amber-500/80 shadow-2xl text-center">
              <span className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                ✦ CEMETERY INCANTATION: THIRD & FINAL FRAGMENT ✦
              </span>

              {/* Glowing Syllable */}
              <div className="text-3xl sm:text-4xl font-cinzel font-black text-amber-300 tracking-[0.25em] drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] my-2">
                R — E — T — U — R — N — S
              </div>

              {/* Full 3-Part Cipher Structure */}
              <div className="my-2 p-2.5 rounded-xl bg-black/80 border border-amber-800/60 text-[11px] font-cinzel font-bold text-stone-300">
                <span className="text-amber-400">[Grave I: THE]</span> &bull;{' '}
                <span className="text-amber-400">[Grave II: NIGHT]</span> &bull;{' '}
                <span className="text-cyan-300">[Grave III: RETURNS]</span>
              </div>

              <p className="mt-3 font-serif italic text-xs sm:text-sm text-stone-300 leading-relaxed max-w-sm">
                &ldquo;The three concentric celestial circles lock into eternal alignment. As the final glyph turns, the
                heavy stone crypt shifts. The third secret syllable &lsquo;RETURNS&rsquo; has been inscribed into your
                Evidence Journal. The ancient cemetery iron gate is now accessible.&rdquo;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsRewardModalOpen(false);
                  onOpenJournal();
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-black/80 hover:bg-amber-950 border border-amber-600/80 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                📖 View Evidence Journal (3/3)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRewardModalOpen(false);
                  onReturnCemetery();
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-900 to-amber-700 hover:from-amber-800 hover:to-amber-600 border border-amber-400 text-amber-100 font-cinzel text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg transition-colors"
              >
                Return to Cemetery Gate →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
