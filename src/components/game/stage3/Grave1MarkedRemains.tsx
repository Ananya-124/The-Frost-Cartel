import React, { useState, useRef } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { AncientBookReader } from './AncientBookReader';
import { ArtifactInspectionModal, type ArtifactType } from './ArtifactInspectionModal';
import { TreasureChestRelic } from './TreasureChestRelic';
import { CinematicCoffinOpening } from './CinematicCoffinOpening';
import { SkullGraphic, RibcageGraphic, BookGraphic, ScrollGraphic, LetterGraphic, KeyGraphic, CompassGraphic } from './CoffinGraphics';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';

interface Grave1MarkedRemainsProps {
  teamId: string;
  config: Stage3Config;
  collectedFragments: string[];
  placedBones: Record<string, string>;
  secondsRemaining: number;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
  onReturnCemetery: () => void;
  onUpdatePlacedBones: (placed: Record<string, string>) => void;
  onFragmentUnlocked: (fragment: string) => void;
  onOpenJournal: () => void;
}

export const Grave1MarkedRemains: React.FC<Grave1MarkedRemainsProps> = ({
  teamId,
  config: _config,
  collectedFragments,
  placedBones: _placedBones,
  secondsRemaining,
  stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
  onReturnCemetery,
  onUpdatePlacedBones: _onUpdatePlacedBones,
  onFragmentUnlocked,
  onOpenJournal,
}) => {
  // Session persistence check: was coffin opening already played in this browser session?
  const [hasOpenedCoffin, setHasOpenedCoffin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem('frost_cartel_coffin1_opened'));
  });

  // Gameplay State Machine
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactType | null>(null);

  // Investigation Milestones
  const [isBookRead, setIsBookRead] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1BookRead);
  });

  const [skeletonOffset, setSkeletonOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSkeletonMoved, setIsSkeletonMoved] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1SkeletonMoved);
  });

  // Riddle & Chest
  const [riddleInput, setRiddleInput] = useState('');
  const [riddleError, setRiddleError] = useState<string | null>(null);
  const [isRiddleSolved, setIsRiddleSolved] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1RiddleSolved || session.stage3State?.grave1Completed);
  });

  const [isChestUnlocked, setIsChestUnlocked] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1ChestUnlocked);
  });

  const [isChestOpen, setIsChestOpen] = useState<boolean>(() => {
    return collectedFragments.includes('BENEATH') || collectedFragments.includes('THE');
  });

  const [isKeyFlying, setIsKeyFlying] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Drag tracking refs
  const [isDraggingSkeleton, setIsDraggingSkeleton] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const keyRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleCoffinOpeningComplete = () => {
    setHasOpenedCoffin(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('frost_cartel_coffin1_opened', 'true');
    }
  };

  // 1. Ancient Book interaction
  const handleOpenBook = () => {
    soundController.playParchmentOpen();
    setIsBookModalOpen(true);
  };

  const handleAllPagesRead = () => {
    setIsBookRead(true);
    const session = round1Service.getTeamSession(teamId, '');
    session.stage3State.grave1BookRead = true;
    showToast('✦ Ancient scripture deciphered! The skeletal remains may now be investigated. ✦');
  };

  // 2. Movable Skeleton Dragging
  const handleSkeletonPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!isBookRead) {
      soundController.playError();
      showToast('The warden\'s rest is sealed. You must decipher the Ancient Book before disturbing the remains.');
      return;
    }

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    setIsDraggingSkeleton(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: skeletonOffset.x,
      origY: skeletonOffset.y,
    };
  };

  const handleSkeletonPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSkeleton || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Natural physical clamping constrained to coffin velvet boundaries
    const newX = Math.max(-65, Math.min(65, dragStartRef.current.origX + dx));
    const newY = Math.max(-45, Math.min(45, dragStartRef.current.origY + dy));

    setSkeletonOffset({ x: newX, y: newY });

    if (Math.hypot(newX, newY) >= 22 && !isSkeletonMoved) {
      setIsSkeletonMoved(true);
      const session = round1Service.getTeamSession(teamId, '');
      session.stage3State.grave1SkeletonMoved = true;
      soundController.playDiscover();
      showToast('✦ Remains shifted! Hidden inscription uncovered beneath the crimson-bound bone: "ASH" ✦');
    }
  };

  const handleSkeletonPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingSkeleton) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    setIsDraggingSkeleton(false);
    dragStartRef.current = null;
    soundController.playClick();
  };

  // 3. Artifact Inspections
  const handleInspectArtifact = (type: ArtifactType) => {
    soundController.playClick();
    setActiveArtifact(type);
  };

  // 4. Skeleton Key Flight & Lock Interaction
  const handleKeyClick = () => {
    if (!isRiddleSolved) {
      soundController.playClick();
      handleInspectArtifact('key');
      return;
    }

    if (isChestUnlocked || isKeyFlying) return;

    soundController.playParchmentOpen();
    soundController.playClick();
    setIsChestUnlocked(true);
    setIsKeyFlying(false);
    showToast('✦ Lock tumblers click open! The treasure chest is unsealed. Click to open. ✦');
  };

  // 5. Riddle Answer Submission
  const handleSubmitRiddle = (e: React.FormEvent) => {
    e.preventDefault();
    setRiddleError(null);

    const { success, message } = round1Service.solveGrave1Riddle(teamId, riddleInput);
    if (success) {
      soundController.playDiscover();
      setIsRiddleSolved(true);
      showToast(message);
    } else {
      soundController.playError();
      setRiddleError(message);
    }
  };

  // 6. Chest Open & Secret Word "BENEATH" Unsealed
  const handleOpenChest = () => {
    const { success, fragment } = round1Service.unlockGrave1Chest(teamId);
    if (success) {
      setIsChestOpen(true);
      onFragmentUnlocked(fragment);
      showToast(`✦ Fragment Discovered: "${fragment}"! Recorded in Evidence Journal. ✦`);
    }
  };

  return (
    <div
      role="region"
      aria-label="Grave 1 — The Marked Remains • The Bone Chamber"
      className="relative w-full h-screen max-h-screen overflow-hidden select-none bg-black flex flex-col justify-between text-stone-100 font-sans"
      onPointerMove={handleSkeletonPointerMove}
      onPointerUp={handleSkeletonPointerUp}
    >
      {/* 0. Cinematic Opening Transition (Runs on first entry in session) */}
      {!hasOpenedCoffin && (
        <CinematicCoffinOpening onComplete={handleCoffinOpeningComplete} />
      )}

      {/* Semantic Accessibility Fallback */}
      <div className="sr-only" aria-hidden="true">
        <span>Grave 1 — The Bone Chamber</span>
        <span>The Marked Remains</span>
      </div>

      {/* 1. Master High-Resolution Photorealistic Coffin Scene Background */}
      <img
        src="/assets/stage-3/coffins/grave1_marked_remains.jpg"
        alt="Coffin I: The Marked Remains"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.94] contrast-[1.06] pointer-events-none"
      />

      {/* Atmospheric Live Creatures: Flapping Bat & Crow in moonlit sky */}
      <FlyingBat startYPercent={5} durationSeconds={19} delaySeconds={1} scale={0.6} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={8} durationSeconds={24} delaySeconds={6} scale={0.7} flightDirection="left-to-right" />

      {/* Layered Moonlit Fog and Dark Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/20 to-black/40"
      />

      {/* 2. Top Header HUD Bar */}
      <CoffinHeaderHUD
        graveNumber="GRAVE I"
        title="THE MARKED REMAINS"
        secondsRemaining={secondsRemaining}
        stageCleared={stageCleared}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onReturnDashboard={onReturnDashboard}
      />

      {/* Floating Notice Toast */}
      {toastNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black/95 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-bold tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 3. Main Exploration Workspace: Dual-Panel Responsive Layout */}
      <div className="relative z-20 flex-1 min-h-0 w-full max-w-7xl mx-auto px-3 sm:px-6 py-1 flex flex-col md:flex-row items-stretch gap-3 sm:gap-5 overflow-hidden">
        {/* LEFT PANEL: The Ancient Manuscript Riddle Panel (~30% width) */}
        <section
          aria-labelledby="keeper-riddle-heading"
          className="w-full md:w-[32%] lg:w-[28%] flex flex-col justify-between p-3.5 sm:p-5 rounded-3xl bg-[#140904]/90 border-2 border-amber-600/80 backdrop-blur-md shadow-[0_0_40px_rgba(245,158,11,0.25)] text-stone-200 overflow-y-auto max-h-full"
        >
          {/* Top Wax Seal Ribbon */}
          <div className="flex items-center justify-between border-b border-amber-800/40 pb-2.5 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📜</span>
              <span className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                ANCIENT PARCHMENT SCROLL
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-500/70 text-[9px] font-mono text-amber-300">
              COFFIN I
            </span>
          </div>

          {/* Riddle Heading & Poem */}
          <div className="my-1 text-center">
            <h3
              id="keeper-riddle-heading"
              className="text-sm sm:text-base font-cinzel font-black tracking-wider text-amber-100 uppercase"
            >
              THE KEEPER’S LAST RIDDLE
            </h3>
            <div className="mt-2 p-3 rounded-2xl bg-[#f5ecd7] text-stone-950 border-2 border-[#8b4513] shadow-inner text-center">
              <p className="font-serif italic text-xs sm:text-sm md:text-base leading-relaxed text-[#261005] font-semibold">
                &ldquo;Born when flame is spent, pale when all light has fled; I am the last trace of fire, yet I hold no heat. What am I?&rdquo;
              </p>
              <div className="mt-1 text-[10px] font-serif text-[#8b1c1c] tracking-widest" aria-hidden="true">
                ✦ ❖ ✦
              </div>
            </div>
          </div>

          {/* Investigation Progress Checklist */}
          <div className="my-2 p-2.5 rounded-xl bg-black/50 border border-amber-900/50 text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-300">📖 Ancient Grimoire:</span>
              <span className={isBookRead ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {isBookRead ? '✓ Deciphered (3/3)' : '○ Unread'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-300">💀 Skeletal Remains:</span>
              <span className={isSkeletonMoved ? 'text-emerald-400 font-bold' : 'text-stone-400'}>
                {isSkeletonMoved ? '✓ Shifted' : '○ Resting'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-300">✦ Hidden Word:</span>
              <span className={isSkeletonMoved ? 'text-amber-300 font-black tracking-widest' : 'text-stone-500'}>
                {isSkeletonMoved ? '✓ "ASH"' : '○ Concealed'}
              </span>
            </div>
          </div>

          {/* Riddle Answer Input Form or Solved State */}
          {!isRiddleSolved ? (
            <form onSubmit={handleSubmitRiddle} className="space-y-2">
              <label htmlFor="riddle-answer-input" className="block text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-widest">
                ENTER YOUR ANSWER:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="riddle-answer-input"
                  type="text"
                  value={riddleInput}
                  onChange={(e) => setRiddleInput(e.target.value)}
                  placeholder="Type the keyword..."
                  autoComplete="off"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/80 text-amber-100 placeholder-stone-500 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-amber-400 text-stone-950 font-cinzel text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.5)] cursor-pointer whitespace-nowrap"
                >
                  UNSEAL
                </button>
              </div>
              {riddleError && (
                <p className="text-[10px] text-red-400 font-serif italic text-center animate-fadeIn">
                  {riddleError}
                </p>
              )}
            </form>
          ) : (
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/80 text-center">
              <span className="text-[10px] font-cinzel font-black text-emerald-300 uppercase tracking-widest block">
                ✓ RIDDLE SOLVED • &ldquo;ASH&rdquo; ACCEPTED
              </span>
            </div>
          )}

          {/* Lower Emerging Treasure Chest Relic */}
          <div id="chest-lock-target" className="mt-2">
            <TreasureChestRelic
              isEmerged={isRiddleSolved}
              isUnlocked={isChestUnlocked}
              isOpen={isChestOpen}
              revealedWord="BENEATH"
              onOpenChest={handleOpenChest}
            />
          </div>
        </section>

        {/* RIGHT PANEL: Interactive Coffin Scene Viewport (~70% width) */}
        <section
          aria-label="Coffin I: Interactive Investigation Surface"
          className="relative flex-1 min-h-[360px] rounded-3xl overflow-hidden border-2 border-amber-700/60 bg-black/40 shadow-2xl flex items-center justify-center select-none"
        >
          {/* Tagline Instruction at Top Center */}
          <div className="absolute top-2.5 z-30 px-3.5 py-1 rounded-full bg-black/70 border border-amber-500/60 backdrop-blur-sm text-[10px] sm:text-xs font-serif italic text-amber-200 pointer-events-none">
            {!isBookRead && '✦ Step 1: Click the Ancient Grimoire to read the scripture ✦'}
            {isBookRead && !isSkeletonMoved && '✦ Step 2: Drag the skeletal remains away to uncover the secret ✦'}
            {isSkeletonMoved && !isRiddleSolved && '✦ Step 3: Speak the uncovered word into the Keeper’s Riddle ✦'}
            {isRiddleSolved && !isChestUnlocked && '✦ Step 4: Click the glowing Skeleton Key to unlock the chest ✦'}
            {isChestUnlocked && !isChestOpen && '✦ Step 5: Click the Treasure Chest to unseal the secret word ✦'}
            {isChestOpen && '✦ Sacred Syllable Unsealed: "BENEATH" • Coffin I Completed! ✦'}
          </div>

          {/* SKELETON LAYER (Movable anatomical group) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Skeletal Remains of the First Warden"
            onPointerDown={handleSkeletonPointerDown}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isBookRead) {
                  showToast('You must decipher the Ancient Book first.');
                } else if (!isSkeletonMoved) {
                  setIsSkeletonMoved(true);
                  soundController.playDiscover();
                  showToast('✦ Remains shifted! Hidden inscription uncovered: "ASH" ✦');
                }
              }
            }}
            style={{
              transform: `translate(${skeletonOffset.x}px, ${skeletonOffset.y}px)`,
              touchAction: 'none',
              transition: isDraggingSkeleton ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className={`absolute inset-0 pointer-events-auto ${
              isBookRead
                ? 'cursor-grab active:cursor-grabbing group hover:drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                : 'cursor-not-allowed opacity-95'
            }`}
          >
            {/* 1. Skull with Roman I */}
            <div
              style={{ left: '64%', top: '24%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rotate-[12deg] pointer-events-none"
            >
              <SkullGraphic romanNumeral="I" className="w-24 h-28 sm:w-28 sm:h-32" />
            </div>

            {/* 2. Thoracic Ribcage with Sun Medallion */}
            <div
              style={{ left: '58%', top: '40%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rotate-[8deg] pointer-events-none"
            >
              <RibcageGraphic className="w-28 h-32 sm:w-32 sm:h-36" />
            </div>

            {/* 3. Crimson-Bound Femur Bone */}
            <div
              style={{ left: '62%', top: '70%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rotate-[25deg] pointer-events-none"
            >
              <div className="relative w-28 h-10 sm:w-32 sm:h-12 flex items-center justify-center">
                <svg viewBox="0 0 100 35" className="w-full h-full filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)]">
                  <path d="M10 18 C6 8 20 8 22 15 L78 15 C80 8 94 8 90 18 C94 28 80 28 78 21 L22 21 C20 28 6 28 10 18 Z" fill="#d9cbb8" stroke="#5a4231" strokeWidth="2" />
                  {/* Crimson Ribbons */}
                  <rect x="35" y="14" width="7" height="8" fill="#991b1b" stroke="#590d0d" strokeWidth="0.8" />
                  <rect x="55" y="14" width="7" height="8" fill="#991b1b" stroke="#590d0d" strokeWidth="0.8" />
                  {/* Etched Runes */}
                  <text x="47" y="19" fontSize="6" fill="#8b1c1c" fontFamily="serif" fontWeight="bold">ᚱᚢ</text>
                </svg>
              </div>
            </div>
          </div>

          {/* HIDDEN INSCRIBED BRASS PLATE (Revealed directly beneath crimson femur when moved) */}
          {isSkeletonMoved && (
            <div
              style={{ left: '62%', top: '70%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-0 text-center animate-fadeIn pointer-events-none"
            >
              <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-950 via-[#3a1d08] to-amber-950 border-2 border-amber-400 text-amber-200 font-cinzel font-black text-sm sm:text-base tracking-[0.25em] shadow-[0_0_25px_rgba(245,158,11,0.9)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center gap-1.5">
                <span>✦</span>
                <span>ASH</span>
                <span>✦</span>
              </div>
            </div>
          )}

          {/* OBJECT 1: The Ancient Grimoire Book (Mandatory First Interactive Object) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Ancient Grimoire: Click to Open and Read"
            onClick={handleOpenBook}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenBook();
              }
            }}
            style={{ left: '46%', top: '56%' }}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 ${
              !isBookRead
                ? 'animate-pulse drop-shadow-[0_0_20px_rgba(245,158,11,0.85)]'
                : 'drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            }`}
            title="Ancient Grimoire (Click to Open & Read Scripture)"
          >
            <BookGraphic className="w-28 h-24 sm:w-32 sm:h-28" />
            {!isBookRead && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-400 text-amber-200 font-cinzel text-[8.5px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap">
                ✦ READ FIRST ✦
              </span>
            )}
          </div>

          {/* OBJECT 2: Antique Brass Skeleton Key */}
          <div
            ref={keyRef}
            role="button"
            tabIndex={0}
            aria-label="Antique Brass Skeleton Key"
            onClick={handleKeyClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleKeyClick();
              }
            }}
            style={{ left: '51%', top: '72%' }}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 transform hover:scale-115 active:scale-90 ${
              isRiddleSolved && !isChestUnlocked
                ? 'animate-bounce drop-shadow-[0_0_25px_rgba(251,191,36,1)] scale-110'
                : 'drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]'
            }`}
            title="Skeleton Key (Click to Inspect / Unlock Chest)"
          >
            <KeyGraphic className="w-16 h-8 sm:w-20 sm:h-10" />
            {isRiddleSolved && !isChestUnlocked && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-200 font-cinzel text-[8px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse">
                🔑 UNLOCK CHEST
              </span>
            )}
          </div>

          {/* OBJECT 3: Rolled Ribbon Scroll */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Rolled Ribbon Scroll"
            onClick={() => handleInspectArtifact('scroll')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspectArtifact('scroll');
              }
            }}
            style={{ left: '65%', top: '76%' }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 transform hover:scale-110 active:scale-95 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            title="Rolled Scroll (Click to Inspect)"
          >
            <ScrollGraphic className="w-20 h-10 sm:w-24 sm:h-12" />
          </div>

          {/* OBJECT 4: Compass Medallion */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Compass Medallion"
            onClick={() => handleInspectArtifact('compass')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspectArtifact('compass');
              }
            }}
            style={{ left: '55%', top: '60%' }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 transform hover:scale-110 active:scale-95 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            title="Compass Medallion (Click to Inspect)"
          >
            <CompassGraphic className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>

          {/* OBJECT 5: Loose Warden's Letter */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Loose Warden's Letter"
            onClick={() => handleInspectArtifact('parchment')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspectArtifact('parchment');
              }
            }}
            style={{ left: '36%', top: '78%' }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 transform hover:scale-110 active:scale-95 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            title="Warden's Letter (Click to Inspect)"
          >
            <LetterGraphic className="w-18 h-14 sm:w-20 sm:h-16" />
          </div>
        </section>
      </div>

      {/* 4. Bottom Controls Footer Bar */}
      <footer className="relative z-30 w-full px-3 sm:px-6 py-2 flex items-center justify-between select-none">
        {/* Bottom-Left: Evidence Journal Drawer Button */}
        <button
          type="button"
          onClick={onOpenJournal}
          className="px-4 py-2 rounded-2xl bg-black/85 hover:bg-amber-950/80 border border-amber-500/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>📖</span>
          <span>EVIDENCE JOURNAL ({collectedFragments.length}/3)</span>
        </button>

        {/* Bottom-Center: Gothic Stage Status */}
        <div className="hidden md:flex items-center gap-2 text-stone-400 font-serif italic text-xs tracking-wider">
          <span>✦ 3 COFFINS • 7 RIDDLES • 1 FINAL CHALLENGE ✦</span>
        </div>

        {/* Bottom-Right: Return to Cemetery Button */}
        <button
          type="button"
          onClick={onReturnCemetery}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-950 via-[#260f06] to-amber-950 hover:from-red-900 hover:to-amber-900 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>←</span>
          <span>RETURN TO CEMETERY</span>
        </button>
      </footer>

      {/* 5. Ancient Book 3D Grimoire Reader Modal */}
      <AncientBookReader
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onAllPagesRead={handleAllPagesRead}
      />

      {/* 6. Artifact Inspection Viewer Modal */}
      <ArtifactInspectionModal
        isOpen={activeArtifact !== null}
        artifactType={activeArtifact}
        onClose={() => setActiveArtifact(null)}
      />
    </div>
  );
};
