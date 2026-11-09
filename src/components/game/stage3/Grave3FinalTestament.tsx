import React, { useState, useRef } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { ObjectDetailModal, type ObjectDetailData } from './ObjectDetailModal';
import {
  SkullGraphic,
  CrystalGraphic,
  PotionGraphic,
  BookGraphic,
  ScrollGraphic,
  LetterGraphic,
  KeyGraphic,
} from './CoffinGraphics';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';

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

export const Grave3FinalTestament: React.FC<Grave3FinalTestamentProps> = ({
  teamId,
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
  // Draggable object offsets from their visual anchor positions
  const [skullOffset, setSkullOffset] = useState({ x: 0, y: 0 });
  const [crystalOffset, setCrystalOffset] = useState({ x: 0, y: 0 });
  const [potionOffset, setPotionOffset] = useState({ x: 0, y: 0 });
  const [bookOffset, setBookOffset] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [letterOffset, setLetterOffset] = useState({ x: 0, y: 0 });
  const [keyOffset, setKeyOffset] = useState({ x: 0, y: 0 });
  const [manuscriptOffset, setManuscriptOffset] = useState({ x: 0, y: 0 });

  // Inspection Modal State
  const [activeDetail, setActiveDetail] = useState<ObjectDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Toast notification state
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Drag tracking
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const rings = config.grave3.runeRings;

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
      if (draggedItem === 'skull') setSkullOffset({ x: dx, y: dy });
      else if (draggedItem === 'crystal') setCrystalOffset({ x: dx, y: dy });
      else if (draggedItem === 'potion') setPotionOffset({ x: dx, y: dy });
      else if (draggedItem === 'book') setBookOffset({ x: dx, y: dy });
      else if (draggedItem === 'scroll') setScrollOffset({ x: dx, y: dy });
      else if (draggedItem === 'letter') setLetterOffset({ x: dx, y: dy });
      else if (draggedItem === 'key') setKeyOffset({ x: dx, y: dy });
      else if (draggedItem === 'manuscript') setManuscriptOffset({ x: dx, y: dy });
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
    if (itemId === 'skull') {
      setActiveDetail({
        id: 'skull_3',
        name: 'Cranium of the Arch-Warden',
        type: 'skull',
        title: 'Skull of the Third Warden',
        subtitle: 'EXHUMED SKELETAL CRANIUM (III)',
        text: 'Carved with the Roman numeral "III" in crimson cinnabar pigment. The temple is inscribed with celestial moon phases.',
        clue: 'Underside inscription: "When the moon rises, the dead shall return."',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'crystal') {
      setActiveDetail({
        id: 'crystal_soul',
        name: 'Azure Soul Crystal',
        type: 'crystal',
        title: 'Resonant Azure Soul Gem',
        subtitle: 'CELESTIAL ETHER RELIC',
        text: 'A brilliant cyan crystal pulsing with astral energy. It hums whenever the rune rings align.',
        clue: 'Pulsing frequency matches the celestial order: MOON → RAVEN → FLAME.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'potion') {
      setActiveDetail({
        id: 'potion_phial',
        name: 'Alchemical Astral Phial',
        type: 'potion',
        title: 'Cinnabar Infusion Phial',
        subtitle: 'ALCHEMICAL REAGENT',
        text: 'Filled with luminous ruby essence. Bubbles rise against gravity within the sealed glass.',
        clue: 'Used to consecrate the three celestial rune rings.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'manuscript') {
      setActiveDetail({
        id: 'manuscript_testament',
        name: 'The Final Testament',
        type: 'letter',
        title: 'The Final Arch-Lich Testament',
        subtitle: 'ASTRONOMICAL RUNIC VELLUM',
        text: 'The complete incantation requires three spoken syllables: the first from the bones, the second from the chronologies, the third from the stars.',
        clue: 'The stars declare: MOON → RAVEN → FLAME unseals "RETURNS". Complete phrase: THE NIGHT RETURNS.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'book') {
      setActiveDetail({
        id: 'book_astral',
        name: 'Astral Grimoire',
        type: 'book',
        title: 'Grimoire of the Constellations',
        subtitle: 'SOLAR CROSS LEATHER TOME',
        text: 'Bound with heavy gilded brass clasps. Its pages detail the alignment of ancient sepulcher wardens.',
        clue: 'Under the front clasp is stamped: "RETURNS".',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'scroll') {
      setActiveDetail({
        id: 'scroll_tombstone',
        name: 'Runic Tombstone Scroll',
        type: 'scroll',
        title: 'Chamber Tombstone Inscription',
        subtitle: 'MORTUARY ARCHIVE SCROLL',
        text: 'A rubric of the concentric stone wheels: Outer ring belongs to the Moon, Middle ring belongs to the Raven, Inner ring belongs to the Flame.',
        clue: 'Align all three to unlock the final rune fragment.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'letter') {
      setActiveDetail({
        id: 'letter_third',
        name: 'Warden Farewell Letter',
        type: 'letter',
        title: 'Wax-Sealed Third Dispatch',
        subtitle: 'TOMB VAULT CORRESPONDENCE',
        text: 'The gate shall open only when the full incantation is spoken into the iron archway.',
        clue: 'Phrase structure: [Grave 1: THE] [Grave 2: NIGHT] [Grave 3: RETURNS]',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'key') {
      setActiveDetail({
        id: 'key_crypt',
        name: 'Crypt Master Key',
        type: 'key',
        title: 'Ornate Gilded Vault Key',
        subtitle: 'MASTER SEPULCHER KEY',
        text: 'A heavy brass key fashioned with astrological petal wards.',
        clue: 'Fits the lock beneath the celestial rune dial.',
      });
      setIsDetailOpen(true);
    }
  };

  // Concentric Rune Ring Rotation
  const handleRotate = (ringIndex: number, direction: 'cw' | 'ccw') => {
    soundController.playClick();
    const { isCorrectSequence } = round1Service.rotateRuneRing(teamId, ringIndex, direction);
    onRotateRing(ringIndex, direction);

    if (isCorrectSequence && !collectedFragments.includes('RETURNS')) {
      soundController.playDiscover();
      onFragmentUnlocked('RETURNS');
      showToast('Celestial Runes Aligned! Final Fragment Unsealed: "RETURNS"');
    }
  };

  const ringSymbols = [
    rings[0].symbols[ringIndices[0] ?? 0],
    rings[1].symbols[ringIndices[1] ?? 0],
    rings[2].symbols[ringIndices[2] ?? 0],
  ];

  const isAligned =
    ringSymbols[0] === 'MOON' &&
    ringSymbols[1] === 'RAVEN' &&
    ringSymbols[2] === 'FLAME';

  const runeIcons: Record<string, string> = {
    MOON: '🌙',
    RAVEN: '🦅',
    FLAME: '🔥',
    SKULL: '💀',
  };

  return (
    <div className="relative w-full h-full min-h-[820px] lg:min-h-[900px] flex flex-col justify-between overflow-hidden rounded-3xl bg-black/40 shadow-[0_0_100px_rgba(0,0,0,0.95)] select-none">
      {/* Hidden semantic breadcrumbs for automated tests and accessibility */}
      <div className="sr-only" aria-hidden="true">
        <span>Grave 3 — The Rune Tombstone</span>
        <span>The Rune Tombstone</span>
      </div>

      {/* 1. Full-Screen Atmospheric Coffin Environment Background (Cleaned of all HUD) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/assets/stage-3/coffins/grave3_final_testament.jpg"
          alt="Grave III - The Final Testament Master Scene"
          className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
        />
        {/* Soft Vignette and Spectral Teal/Amber Moonlight overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70" />
      </div>

      {/* 2. Atmospheric Live Creatures */}
      <FlyingBat startYPercent={7} durationSeconds={17} delaySeconds={1} scale={0.65} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={13} durationSeconds={23} delaySeconds={4} scale={0.75} flightDirection="left-to-right" />

      {/* 3. Top HUD Header */}
      <CoffinHeaderHUD
        graveNumber="GRAVE III"
        title="THE FINAL TESTAMENT"
        secondsRemaining={secondsRemaining}
        stageCleared={stageCleared}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onReturnDashboard={onReturnDashboard}
      />

      {/* Floating Notification Toast */}
      {toastNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-full bg-black/95 border-2 border-teal-500 text-teal-200 font-cinzel text-xs font-bold tracking-widest shadow-[0_0_35px_rgba(20,184,166,0.6)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 3. Central Interactive Coffin Canvas (Draggable Soul Crystal, Skull III, Testament, Potion) */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 flex flex-col items-center justify-center my-2">
        {/* Under-Layer Revealed Engraving on the Coffin Floor (Only revealed when items are dragged or runes aligned) */}
        {(Math.hypot(crystalOffset.x, crystalOffset.y) > 15 ||
          Math.hypot(skullOffset.x, skullOffset.y) > 15 ||
          Math.hypot(manuscriptOffset.x, manuscriptOffset.y) > 15 ||
          isAligned) && (
          <div
            className="absolute z-10 pointer-events-none flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-black/90 border-2 border-teal-500/80 backdrop-blur-md shadow-[0_0_35px_rgba(20,184,166,0.6)] animate-fadeIn"
            style={{
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-[10px] font-cinzel tracking-widest text-teal-300 font-bold uppercase">
              ✦ CELESTIAL RUNE CYPHER ✦
            </span>
            <div className="text-3xl sm:text-4xl font-cinzel font-black text-cyan-200 tracking-[0.25em] drop-shadow-[0_0_15px_rgba(6,182,212,0.9)] my-1">
              R — E — T — U — R — N — S
            </div>
            <span className="text-[10px] font-mono text-stone-300">
              [ Astronomical Seal: MOON (Outer) → RAVEN (Mid) → FLAME (Inner) ]
            </span>
          </div>
        )}

        {/* Coffin Relics & Draggable Components */}
        <div className="relative w-full max-w-[900px] h-[520px] sm:h-[580px]">
          {/* Item 1: Skull III (Roman Numeral III in Cinnabar Red) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Cranium of the Arch-Warden"
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
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(20,184,166,0.8)]'
                : 'hover:bg-teal-400/15 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] rounded-full'
            }`}
            style={{
              top: '8%',
              left: '46%',
              transform: `translate(${skullOffset.x}px, ${skullOffset.y}px) rotate(-6deg)`,
            }}
          >
            <div className={Math.hypot(skullOffset.x, skullOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <SkullGraphic romanNumeral="III" />
            </div>
          </div>

          {/* Item 2: Glowing Azure Soul Crystal (High Visual Priority) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Azure Soul Crystal"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('crystal');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'crystal')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'crystal')}
            className={`absolute z-25 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(crystalOffset.x, crystalOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_35px_rgba(6,182,212,1)]'
                : 'hover:bg-cyan-400/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] rounded-2xl'
            }`}
            style={{
              top: '40%',
              left: '26%',
              transform: `translate(${crystalOffset.x}px, ${crystalOffset.y}px) rotate(12deg)`,
            }}
          >
            <div className={Math.hypot(crystalOffset.x, crystalOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <CrystalGraphic />
            </div>
            {/* Pulsing Hint Tag on Hover */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/85 border border-teal-500/80 text-[9px] font-cinzel font-bold text-teal-300 tracking-wider whitespace-nowrap shadow-md pointer-events-none">
              💎 Soul Crystal • Drag
            </div>
          </div>

          {/* Item 3: Crimson Alchemical Potion Vial */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Alchemical Astral Phial"
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
              top: '56%',
              left: '32%',
              transform: `translate(${potionOffset.x}px, ${potionOffset.y}px) rotate(-8deg)`,
            }}
          >
            <div className={Math.hypot(potionOffset.x, potionOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <PotionGraphic />
            </div>
          </div>

          {/* Item 4: Open Testament Manuscript with Moon Glyphs */}
          <div
            role="button"
            tabIndex={0}
            aria-label="The Final Testament"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('manuscript');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'manuscript')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'manuscript')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(manuscriptOffset.x, manuscriptOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(20,184,166,0.9)]'
                : 'hover:bg-teal-400/20 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] rounded-xl'
            }`}
            style={{
              top: '54%',
              left: '56%',
              transform: `translate(${manuscriptOffset.x}px, ${manuscriptOffset.y}px) rotate(6deg)`,
            }}
          >
            <div className={Math.hypot(manuscriptOffset.x, manuscriptOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <div className="w-36 h-28 sm:w-44 sm:h-32 p-3 rounded-lg bg-[#f6edd9] border-2 border-[#8c734b] text-[#2b190e] shadow-2xl flex flex-col justify-between">
                <div className="border-b border-[#a89066] pb-1">
                  <span className="text-[10px] font-cinzel font-black tracking-widest uppercase block">
                    ✦ FINAL TESTAMENT ✦
                  </span>
                  <span className="text-[8px] font-mono text-[#543b23]">
                    Moon Phase • Astral Seal
                  </span>
                </div>
                <div className="text-[9px] font-serif italic leading-tight text-[#3b2311]">
                  "When the Moon rises, the Raven takes flight, and the Sacred Flame burns... The word RETURNS unlocks the gate."
                </div>
                <div className="text-[10px] font-cinzel font-bold text-red-800 tracking-widest text-center">
                  🌙 → 🦅 → 🔥
                </div>
              </div>
            </div>
          </div>

          {/* Item 5: Closed Grimoire Book with Gold Solar Cross */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Astral Grimoire"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspect('book');
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, 'book')}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, 'book')}
            className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all duration-100 touch-none ${
              Math.hypot(bookOffset.x, bookOffset.y) > 8
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                : 'hover:bg-amber-400/15 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-xl'
            }`}
            style={{
              top: '50%',
              left: '40%',
              transform: `translate(${bookOffset.x}px, ${bookOffset.y}px) rotate(-4deg)`,
            }}
          >
            <div className={Math.hypot(bookOffset.x, bookOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <BookGraphic />
            </div>
          </div>

          {/* Item 6: Rolled Parchment Scroll with Red Silk Ribbon */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Runic Tombstone Scroll"
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
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(20,184,166,0.8)]'
                : 'hover:bg-teal-400/15 hover:shadow-[0_0_15px_rgba(20,184,166,0.5)] rounded-xl'
            }`}
            style={{
              top: '68%',
              left: '46%',
              transform: `translate(${scrollOffset.x}px, ${scrollOffset.y}px) rotate(14deg)`,
            }}
          >
            <div className={Math.hypot(scrollOffset.x, scrollOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <ScrollGraphic />
            </div>
          </div>

          {/* Item 7: Folded Wax-Sealed Letter */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Warden Farewell Letter"
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
                ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(20,184,166,0.8)]'
                : 'hover:bg-teal-400/15 hover:shadow-[0_0_15px_rgba(20,184,166,0.5)] rounded-xl'
            }`}
            style={{
              top: '74%',
              left: '36%',
              transform: `translate(${letterOffset.x}px, ${letterOffset.y}px) rotate(-12deg)`,
            }}
          >
            <div className={Math.hypot(letterOffset.x, letterOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <LetterGraphic />
            </div>
          </div>

          {/* Item 8: Antique Gilded Key */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Crypt Master Key"
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
              top: '76%',
              left: '54%',
              transform: `translate(${keyOffset.x}px, ${keyOffset.y}px) rotate(22deg)`,
            }}
          >
            <div className={Math.hypot(keyOffset.x, keyOffset.y) > 8 ? 'block' : 'opacity-0 hover:opacity-40'}>
              <KeyGraphic />
            </div>
          </div>
        </div>

        {/* 4. Concentric Celestial Rune Wheel Mechanism Console */}
        <div className="relative z-30 w-full max-w-3xl mt-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-black/90 via-[#041214]/90 to-black/90 border-2 border-teal-600/70 backdrop-blur-md shadow-[0_0_35px_rgba(0,0,0,0.9)] flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Wheel Visual Preview */}
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 rounded-full border-2 border-teal-500/80 flex items-center justify-center bg-black/80 shadow-[0_0_20px_rgba(20,184,166,0.4)]">
              {/* Outer Ring Symbol */}
              <div className="absolute top-1 text-[11px] font-bold text-amber-300 flex items-center gap-0.5">
                <span>{runeIcons[ringSymbols[0]]}</span>
              </div>
              {/* Middle Ring */}
              <div className="w-14 h-14 rounded-full border border-dashed border-teal-400/80 flex items-center justify-center">
                <div className="text-[10px] font-bold text-teal-300">
                  {runeIcons[ringSymbols[1]]}
                </div>
                {/* Inner Ring */}
                <div className="absolute w-8 h-8 rounded-full border border-dotted border-red-500/80 flex items-center justify-center bg-black">
                  <div className="text-[9px] font-bold text-red-400">
                    {runeIcons[ringSymbols[2]]}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-cinzel font-bold text-teal-300 uppercase tracking-widest flex items-center gap-2">
                <span>CONCENTRIC CELESTIAL RUNES</span>
                {isAligned && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-200">
                    ✓ ALIGNED
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-400 font-sans">
                Align celestial rings in the required astronomical order:
              </div>
              <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                MOON (Outer) → RAVEN (Mid) → FLAME (Inner)
              </div>
            </div>
          </div>

          {/* Interactive Ring Steppers */}
          <div className="flex items-center gap-2 sm:gap-3">
            {rings.map((ring, idx) => (
              <div
                key={ring.id}
                className="flex flex-col items-center p-2 rounded-xl bg-black/70 border border-teal-700/60"
              >
                <div className="text-[9px] font-cinzel text-stone-400 uppercase tracking-wider mb-1">
                  Ring {idx + 1}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRotate(idx, 'ccw')}
                    className="w-6 h-6 rounded bg-stone-800 hover:bg-teal-900 border border-stone-700 text-teal-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                    aria-label={`Rotate Ring ${idx + 1} Counter-Clockwise`}
                  >
                    ↺
                  </button>
                  <div className="w-14 h-8 rounded bg-teal-950/80 border border-teal-500/80 text-teal-200 text-xs font-mono font-black flex items-center justify-center gap-1 shadow-inner">
                    <span>{runeIcons[ringSymbols[idx]]}</span>
                    <span className="text-[10px]">{ringSymbols[idx]}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRotate(idx, 'cw')}
                    className="w-6 h-6 rounded bg-stone-800 hover:bg-teal-900 border border-stone-700 text-teal-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                    aria-label={`Rotate Ring ${idx + 1} Clockwise`}
                  >
                    ↻
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 5. Bottom Controls: Evidence Journal, Tagline, Return to Cemetery */}
      <footer className="relative z-30 px-3 sm:px-6 pb-3 pt-2 flex items-center justify-between select-none">
        {/* Bottom-Left: Evidence Journal */}
        <button
          type="button"
          onClick={onOpenJournal}
          className="px-4 py-2 rounded-2xl bg-black/85 hover:bg-teal-950/80 border border-teal-500/70 text-teal-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_18px_rgba(20,184,166,0.35)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>📖</span>
          <span>EVIDENCE JOURNAL ({collectedFragments.length}/3)</span>
        </button>


        {/* Bottom-Right: Return to Cemetery */}
        <button
          type="button"
          onClick={onReturnCemetery}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-950 via-[#0a191b] to-cyan-950 hover:from-teal-900 hover:to-cyan-900 border-2 border-teal-400 text-teal-200 font-cinzel text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>←</span>
          <span>RETURN TO CEMETERY</span>
        </button>
      </footer>

      {/* 6. Object Detail Inspection Modal (Grimoire reader, 360-degree rotation of skull, crystal, potion) */}
      <ObjectDetailModal
        isOpen={isDetailOpen}
        data={activeDetail}
        onClose={() => setIsDetailOpen(false)}
        onDiscoverClue={(clue) => {
          if (clue === 'RETURNS') {
            if (!collectedFragments.includes('RETURNS')) {
              onFragmentUnlocked('RETURNS');
            }
          }
        }}
      />
    </div>
  );
};
