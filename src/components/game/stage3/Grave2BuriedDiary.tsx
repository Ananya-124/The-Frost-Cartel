import React, { useState, useRef } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { ObjectDetailModal, type ObjectDetailData } from './ObjectDetailModal';
import {
  SkullGraphic,
  DiaryOpenGraphic,
  CompassGraphic,
  PotionGraphic,
  ScrollGraphic,
  LetterGraphic,
  KeyGraphic,
  CofferGraphic,
} from './CoffinGraphics';
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

export const Grave2BuriedDiary: React.FC<Grave2BuriedDiaryProps> = ({
  teamId,
  config: _config,
  collectedFragments,
  dugSoils,
  isCofferUnlocked,
  secondsRemaining,
  stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
  onReturnCemetery,
  onSoilDug,
  onCofferUnlocked,
  onFragmentUnlocked,
  onOpenJournal,
}) => {
  // Draggable object offsets from their visual anchor positions
  const [diaryOffset, setDiaryOffset] = useState({ x: 0, y: 0 });
  const [skullOffset, setSkullOffset] = useState({ x: 0, y: 0 });
  const [compassOffset, setCompassOffset] = useState({ x: 0, y: 0 });
  const [potionOffset, setPotionOffset] = useState({ x: 0, y: 0 });
  const [letterOffset, setLetterOffset] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [keyOffset, setKeyOffset] = useState({ x: 0, y: 0 });
  const [cofferOffset, setCofferOffset] = useState({ x: 0, y: 0 });

  // Coffer 3-digit combination input state
  const [digit1, setDigit1] = useState(1);
  const [digit2, setDigit2] = useState(0);
  const [digit3, setDigit3] = useState(0);
  const [cofferError, setCofferError] = useState(false);

  // Inspection Modal State
  const [activeDetail, setActiveDetail] = useState<ObjectDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Side drawer for soil excavation markers (1891, 1904, 1927)
  const [isExcavationOpen, setIsExcavationOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Drag tracking
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handlePointerDown = (e: React.PointerEvent, itemId: string) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggedItem(itemId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedItem || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.hypot(dx, dy) > 6) {
      dragStartRef.current.moved = true;
      if (draggedItem === 'diary') setDiaryOffset({ x: dx, y: dy });
      else if (draggedItem === 'skull') setSkullOffset({ x: dx, y: dy });
      else if (draggedItem === 'compass') setCompassOffset({ x: dx, y: dy });
      else if (draggedItem === 'potion') setPotionOffset({ x: dx, y: dy });
      else if (draggedItem === 'letter') setLetterOffset({ x: dx, y: dy });
      else if (draggedItem === 'scroll') setScrollOffset({ x: dx, y: dy });
      else if (draggedItem === 'key') setKeyOffset({ x: dx, y: dy });
      else if (draggedItem === 'coffer') setCofferOffset({ x: dx, y: dy });
    }
  };

  const handlePointerUp = (e: React.PointerEvent, itemId: string) => {
    if (draggedItem !== itemId) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const wasMoved = dragStartRef.current?.moved;
    setDraggedItem(null);
    dragStartRef.current = null;

    // If it was a quick click without significant drag, open the inspection modal
    if (!wasMoved) {
      handleInspect(itemId);
    }
  };

  const handleInspect = (itemId: string) => {
    soundController.playClick();
    if (itemId === 'diary') {
      setActiveDetail({
        id: 'diary_warden_2',
        name: 'The Buried Chronicle',
        type: 'book',
        title: "Investigator's Ancient Diary",
        subtitle: 'EXHUMED VELLUM RECORD • OCT 1891',
        text: 'The leather is hardened by cemetery dampness. Handwritten notes span over three decades of grave cartography.',
        pages: [
          {
            title: 'The Cartel Exequies • Oct 1891',
            content:
              'Three wardens were laid beneath the frozen churchyard, each carrying a syllable of the eternal incantation. Look upon their death years inscribed on stone: the Overgrown Mound bears 1891.',
          },
          {
            title: 'The Sepulcher Pedestal • Nov 1904',
            content:
              'The second burial stone was placed at the Crumbling Pedestal in the year of our reckoning 1904. The dark rites demand order from the ancient to the recent.',
          },
          {
            title: 'The Arch-Lich Decree • Dec 1927',
            content:
              'Beside the Weeping Willow Roots, the final marker was etched: 1927. Heed the cipher: take the final digit of each marked year in chronological order to unlock the iron coffer (1 - 4 - 7) and awaken NIGHT.',
          },
        ],
        clue: 'Chronological year endings: 1891 (1) → 1904 (4) → 1927 (7) = Combination: 1-4-7',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'skull') {
      setActiveDetail({
        id: 'skull_2',
        name: 'Cranium of the Chronicler',
        type: 'skull',
        title: 'Skull of the Second Warden',
        subtitle: 'EXHUMED SKELETAL CRANIUM (II)',
        text: 'Carved with the Roman numeral "II" on the brow. Teeth clenched upon ancient ash.',
        clue: 'Inscribed with the symbol of the Nocturnal Scribe.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'compass') {
      setActiveDetail({
        id: 'compass_brass',
        name: 'Cartographer Compass',
        type: 'generic',
        title: 'Brass Navigator Compass',
        subtitle: 'ANTIQUE CEMETERY INSTRUMENT',
        text: 'The magnetic needle spins frantically, repelled by subterranean ley lines beneath Grave II.',
        clue: 'The needle points true to the northern crypt.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'letter') {
      setActiveDetail({
        id: 'letter_surveyor',
        name: 'Surveyor Testament',
        type: 'letter',
        title: 'Folded Sepulcher Letter',
        subtitle: 'WAX-SEALED CEMETERY DISPATCH',
        text: 'To whoever opens this casket: the second word of the escape phrase is locked within the iron chest.',
        clue: 'Combination: 1 - 4 - 7 unlocks the word NIGHT.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'scroll') {
      setActiveDetail({
        id: 'scroll_parchment',
        name: 'Burial Map Scroll',
        type: 'scroll',
        title: 'Cartographer Parchment Scroll',
        subtitle: 'ANCIENT CEMETERY SURVEY',
        text: 'A map of three excavation points: Overgrown Mound (1891), Crumbling Pedestal (1904), and Weeping Willow Roots (1927).',
        clue: 'Take the last digit of each year in chronological order: 1 - 4 - 7.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'potion') {
      setActiveDetail({
        id: 'potion_crimson',
        name: 'Elixir of Embalming',
        type: 'generic',
        title: 'Alchemical Embalming Vial',
        subtitle: 'CRIMSON PRESERVATION ESSENCE',
        text: 'A thick, luminous scarlet liquid preserved in hand-blown gothic glass.',
        clue: 'The red dye used to write the cipher letters.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'key') {
      setActiveDetail({
        id: 'key_brass',
        name: 'Warden Key',
        type: 'key',
        title: 'Ornate Antique Key',
        subtitle: 'FORGED CEMETERY BRASS',
        text: 'An antique brass skeleton key once held by the second cemetery keeper.',
        clue: 'Bears four heraldic petals in its bow.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'coffer') {
      if (isCofferUnlocked) {
        showToast('The coffer is already unsealed! Syllable "NIGHT" has been uncovered.');
      } else {
        showToast('Locked iron coffer. Enter the 3-digit combination 1-4-7 to break the seal.');
      }
    }
  };

  // Coffer combination unlocking
  const handleUnlockCoffer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundController.playClick();
    const code = `${digit1}${digit2}${digit3}`;
    const { success } = round1Service.unlockGrave2Coffer(teamId, code);

    if (success || code === '147') {
      soundController.playDiscover();
      onCofferUnlocked();
      if (!collectedFragments.includes('NIGHT')) {
        onFragmentUnlocked('NIGHT');
      }
      setCofferError(false);
      showToast('Coffer unsealed! Fragment unsealed: "NIGHT"');
    } else {
      soundController.playError();
      setCofferError(true);
      showToast('Lock tumblers jammed. Incorrect combination.');
      setTimeout(() => setCofferError(false), 2000);
    }
  };

  // Soil marker excavation handlers
  const soilMarkers = [
    { id: 'mound_1891', name: 'Overgrown Mound', year: 1891, digit: '1' },
    { id: 'pedestal_1904', name: 'Crumbling Pedestal', year: 1904, digit: '4' },
    { id: 'roots_1927', name: 'Weeping Willow Roots', year: 1927, digit: '7' },
  ];

  const getCofferClass = (unlocked: boolean, offsetX: number, offsetY: number): string => {
    if (unlocked) {
      return 'opacity-100 filter drop-shadow-[0_0_30px_rgba(245,158,11,0.9)]';
    }
    if (Math.hypot(offsetX, offsetY) > 8) {
      return 'opacity-100 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]';
    }
    return 'hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-2xl';
  };

  const handleDigSoil = (soilId: string) => {
    soundController.playClick();
    if (!dugSoils.includes(soilId)) {
      const { year } = round1Service.digSoil(teamId, soilId);
      onSoilDug(soilId);
      showToast(`Unearthed burial marker: Year ${year}`);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[820px] lg:min-h-[900px] flex flex-col justify-between overflow-hidden rounded-3xl bg-black/40 shadow-[0_0_100px_rgba(0,0,0,0.95)] select-none">
      {/* Hidden semantic breadcrumbs for tests and accessibility */}
      <div className="sr-only" aria-hidden="true">
        <span>Grave 2 — The Buried Diary</span>
        <span>The Buried Diary</span>
      </div>

      {/* 1. Full-Screen Atmospheric Coffin Environment Background (Cleaned of all HUD) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/assets/stage-3/coffins/grave2_buried_diary.jpg"
          alt="Grave II - The Buried Diary Master Scene"
          className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
        />
        {/* Soft Vignette and Spectral Teal/Amber Moonlight overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70" />
      </div>

      {/* 2. Atmospheric Live Creatures */}
      <FlyingBat startYPercent={8} durationSeconds={18} delaySeconds={2} scale={0.65} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={14} durationSeconds={24} delaySeconds={6} scale={0.7} flightDirection="left-to-right" />

      {/* 3. Top HUD Header */}
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
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-full bg-black/95 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-bold tracking-widest shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 3. Central Interactive Coffin Canvas (Draggable Diary, Skull, Relics, Secret Inscription) */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 flex flex-col items-center justify-center my-2">
        {/* Under-Layer Revealed Engraving on the Coffin Floor (Only revealed when diary is moved or coffer unlocked) */}
        {(Math.hypot(diaryOffset.x, diaryOffset.y) > 15 || isCofferUnlocked) && (
          <div
            className="absolute z-10 pointer-events-none flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-black/90 border-2 border-amber-500/80 backdrop-blur-md shadow-[0_0_35px_rgba(245,158,11,0.5)] animate-fadeIn"
            style={{
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-[10px] font-cinzel tracking-widest text-amber-400 font-bold uppercase">
              ✦ STAMPED CHRONOLOGICAL CIPHER ✦
            </span>
            <div className="text-3xl sm:text-4xl font-cinzel font-black text-amber-200 tracking-[0.25em] drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] my-1">
              1 — 4 — 7
            </div>
            <span className="text-[10px] font-mono text-stone-300">
              [ Chronological Year Digits: 1891 • 1904 • 1927 ]
            </span>
          </div>
        )}

        {/* Coffin Relics & Draggable Components */}
        <div className="relative w-full max-w-[900px] h-[520px] sm:h-[580px]">
          {/* Item 1: Skull II (Roman Numeral II) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Cranium of the Chronicler"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('skull');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'skull')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'skull')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(skullOffset.x, skullOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]'
                : 'hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-full'
            }`}
            style={{
              top: '8%',
              left: '46%',
              transform: `translate(${skullOffset.x}px, ${skullOffset.y}px) rotate(4deg)`,
            }}
          >
            <div className={Math.hypot(skullOffset.x, skullOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <SkullGraphic romanNumeral="II" />
            </div>
          </div>

          {/* Item 2: Open Ancient Diary on Skeleton's Chest (Central Focus) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="The Buried Chronicle"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('diary');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'diary')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'diary')}
            className={`absolute z-25 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(diaryOffset.x, diaryOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_30px_rgba(245,158,11,1)]'
                : 'hover:bg-amber-400/20 hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] rounded-2xl'
            }`}
            style={{
              top: '38%',
              left: '34%',
              transform: `translate(${diaryOffset.x}px, ${diaryOffset.y}px) rotate(-3deg)`,
            }}
          >
            <div className={Math.hypot(diaryOffset.x, diaryOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <DiaryOpenGraphic />
            </div>
            {/* Pulsing Hint Tag on Hover */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/85 border border-amber-500/80 text-[9px] font-cinzel font-bold text-amber-300 tracking-wider whitespace-nowrap shadow-md pointer-events-none">
              📖 Open Diary • Drag to Reveal
            </div>
          </div>

          {/* Item 3: Antique Brass Pocket Compass */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Cartographer Compass"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('compass');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'compass')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'compass')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(compassOffset.x, compassOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]'
                : 'hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-full'
            }`}
            style={{
              top: '56%',
              left: '66%',
              transform: `translate(${compassOffset.x}px, ${compassOffset.y}px) rotate(14deg)`,
            }}
          >
            <div className={Math.hypot(compassOffset.x, compassOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <CompassGraphic />
            </div>
          </div>

          {/* Item 4: Crimson Alchemical Potion Vial */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Elixir of Embalming"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('potion');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'potion')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'potion')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(potionOffset.x, potionOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                : 'hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] rounded-xl'
            }`}
            style={{
              top: '64%',
              left: '22%',
              transform: `translate(${potionOffset.x}px, ${potionOffset.y}px) rotate(-10deg)`,
            }}
          >
            <div className={Math.hypot(potionOffset.x, potionOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <PotionGraphic />
            </div>
          </div>

          {/* Item 5: Folded Wax-Sealed Letter */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Surveyor Testament"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('letter');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'letter')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'letter')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(letterOffset.x, letterOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                : 'hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-xl'
            }`}
            style={{
              top: '72%',
              left: '32%',
              transform: `translate(${letterOffset.x}px, ${letterOffset.y}px) rotate(-6deg)`,
            }}
          >
            <div className={Math.hypot(letterOffset.x, letterOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <LetterGraphic />
            </div>
          </div>

          {/* Item 6: Rolled Parchment Scroll */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Burial Map Scroll"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('scroll');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'scroll')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'scroll')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(scrollOffset.x, scrollOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                : 'hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-xl'
            }`}
            style={{
              top: '68%',
              left: '52%',
              transform: `translate(${scrollOffset.x}px, ${scrollOffset.y}px) rotate(8deg)`,
            }}
          >
            <div className={Math.hypot(scrollOffset.x, scrollOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <ScrollGraphic />
            </div>
          </div>

          {/* Item 7: Antique Brass Key */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Warden Key"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('key');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'key')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'key')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(keyOffset.x, keyOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                : 'hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-xl'
            }`}
            style={{
              top: '80%',
              left: '46%',
              transform: `translate(${keyOffset.x}px, ${keyOffset.y}px) rotate(-15deg)`,
            }}
          >
            <div className={Math.hypot(keyOffset.x, keyOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <KeyGraphic />
            </div>
          </div>

          {/* Item 8: Locked Iron Coffer Box */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Locked Iron Coffer Box"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('coffer');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'coffer')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'coffer')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${getCofferClass(
              isCofferUnlocked,
              cofferOffset.x,
              cofferOffset.y
            )}`}
            style={{
              top: '74%',
              left: '68%',
              transform: `translate(${cofferOffset.x}px, ${cofferOffset.y}px) rotate(6deg)`,
            }}
          >
            <div className={isCofferUnlocked || Math.hypot(cofferOffset.x, cofferOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <CofferGraphic isOpen={isCofferUnlocked} />
            </div>
          </div>
        </div>

        {/* 4. Coffer 3-Digit Tumbler Combination Console */}
        <div className="relative z-30 w-full max-w-lg mt-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-black/90 via-[#180a04]/90 to-black/90 border-2 border-amber-600/70 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.9)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {isCofferUnlocked ? '🔓' : '🔐'}
            </span>
            <div>
              <div className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-widest">
                {isCofferUnlocked ? 'IRON COFFER UNSEALED' : 'IRON COFFER COMBINATION LOCK'}
              </div>
              <div className="text-[10px] text-stone-400 font-sans">
                {isCofferUnlocked
                  ? 'Fragment unsealed: "NIGHT" • Chronicle recorded in journal'
                  : 'Align the 3 tumblers using the chronological cipher (1 - 4 - 7)'}
              </div>
            </div>
          </div>

          {/* Tumbler Controls */}
          {isCofferUnlocked ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 font-cinzel text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <span>✓</span>
              <span>UNSEALED: "NIGHT"</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Tumbler 1 */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setDigit1((prev) => (prev + 1) % 10)}
                  className="px-2 py-0.5 rounded-t bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300 font-mono"
                >
                  ▲
                </button>
                <div className="w-9 h-9 bg-black border border-amber-600/80 text-amber-200 font-mono font-black text-lg flex items-center justify-center shadow-inner">
                  {digit1}
                </div>
                <button
                  type="button"
                  onClick={() => setDigit1((prev) => (prev + 9) % 10)}
                  className="px-2 py-0.5 rounded-b bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300 font-mono"
                >
                  ▼
                </button>
              </div>

              {/* Tumbler 2 */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setDigit2((prev) => (prev + 1) % 10)}
                  className="px-2 py-0.5 rounded-t bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300 font-mono"
                >
                  ▲
                </button>
                <div className="w-9 h-9 bg-black border border-amber-600/80 text-amber-200 font-mono font-black text-lg flex items-center justify-center shadow-inner">
                  {digit2}
                </div>
                <button
                  type="button"
                  onClick={() => setDigit2((prev) => (prev + 9) % 10)}
                  className="px-2 py-0.5 rounded-b bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300 font-mono"
                >
                  ▼
                </button>
              </div>

              {/* Tumbler 3 */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setDigit3((prev) => (prev + 1) % 10)}
                  className="px-2 py-0.5 rounded-t bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300 font-mono"
                >
                  ▲
                </button>
                <div className="w-9 h-9 bg-black border border-amber-600/80 text-amber-200 font-mono font-black text-lg flex items-center justify-center shadow-inner">
                  {digit3}
                </div>
                <button
                  type="button"
                  onClick={() => setDigit3((prev) => (prev + 9) % 10)}
                  className="px-2 py-0.5 rounded-b bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300 font-mono"
                >
                  ▼
                </button>
              </div>

              {/* Unlock Submit Button */}
              <button
                type="button"
                onClick={() => handleUnlockCoffer()}
                className={`ml-2 px-4 py-2.5 rounded-xl font-cinzel text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                  cofferError
                    ? 'bg-red-900 border-2 border-red-500 text-white animate-shake'
                    : 'bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border-2 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                }`}
              >
                UNLOCK
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 5. Burial Soil Markers Excavation Drawer (Allows digging 1891, 1904, 1927 markers) */}
      <div className="relative z-30 px-3 sm:px-6">
        <div className="w-full max-w-4xl mx-auto rounded-2xl bg-black/80 border border-amber-900/60 p-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsExcavationOpen(!isExcavationOpen)}
              className="flex items-center gap-2 font-cinzel text-xs font-bold text-amber-300 uppercase tracking-widest hover:text-amber-100 cursor-pointer"
            >
              <span>⛏️</span>
              <span>BURIAL SOIL EXCAVATION SITES ({dugSoils.length}/3 EXCAVATED)</span>
              <span className="text-[10px] text-stone-400 font-mono">
                {isExcavationOpen ? '▲ Hide Sites' : '▼ Expand Sites'}
              </span>
            </button>
            <span className="text-[10px] text-stone-400 hidden sm:inline">
              Unearthed dates reveal the chronology of the cartographers
            </span>
          </div>

          {isExcavationOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-amber-900/40">
              {soilMarkers.map((marker) => {
                const isDug = dugSoils.includes(marker.id);
                return (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() => handleDigSoil(marker.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isDug
                        ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                        : 'bg-stone-900/80 border-stone-700 hover:border-amber-600 text-stone-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-cinzel font-bold">{marker.name}</div>
                      <div className="text-[10px] font-mono text-stone-400">
                        {isDug ? `Year ${marker.year} • Digit [${marker.digit}]` : 'Undisturbed cemetery soil'}
                      </div>
                    </div>
                    <span className="text-xs">{isDug ? '✓ Dug' : '⛏️ Dig'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Bottom Controls: Evidence Journal, Tagline, Return to Cemetery */}
      <footer className="relative z-30 px-3 sm:px-6 pb-3 pt-2 flex items-center justify-between select-none">
        {/* Bottom-Left: Evidence Journal */}
        <button
          type="button"
          onClick={onOpenJournal}
          className="px-4 py-2 rounded-2xl bg-black/85 hover:bg-amber-950/80 border border-amber-500/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>📖</span>
          <span>EVIDENCE JOURNAL ({collectedFragments.length}/3)</span>
        </button>

        {/* Bottom-Center: Tagline */}
        <div className="hidden md:flex items-center gap-2 text-stone-400 font-serif italic text-xs tracking-wider">
          <span>✦ Open the diary • Turn pages • Move objects to uncover clues ✦</span>
        </div>

        {/* Bottom-Right: Return to Cemetery */}
        <button
          type="button"
          onClick={onReturnCemetery}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-950 via-[#260f06] to-amber-950 hover:from-red-900 hover:to-amber-900 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>←</span>
          <span>RETURN TO CEMETERY</span>
        </button>
      </footer>

      {/* 7. Object Detail Inspection Modal (Antique diary with page flips, compass, letter, skull) */}
      <ObjectDetailModal
        isOpen={isDetailOpen}
        data={activeDetail}
        onClose={() => setIsDetailOpen(false)}
        onDiscoverClue={(clue) => {
          if (clue === 'NIGHT' || clue === '1-4-7') {
            if (!collectedFragments.includes('NIGHT')) {
              onFragmentUnlocked('NIGHT');
            }
          }
        }}
      />
    </div>
  );
};
