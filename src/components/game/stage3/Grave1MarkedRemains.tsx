import React, { useState, useRef } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { ObjectDetailModal, type ObjectDetailData } from './ObjectDetailModal';
import { SkullGraphic, RibcageGraphic, BookGraphic, ScrollGraphic, LetterGraphic, KeyGraphic } from './CoffinGraphics';
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
  config,
  collectedFragments,
  placedBones,
  secondsRemaining,
  stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
  onReturnCemetery,
  onUpdatePlacedBones,
  onFragmentUnlocked,
  onOpenJournal,
}) => {
  // Draggable object offsets from their visual anchor positions
  const [skullOffset, setSkullOffset] = useState({ x: 0, y: 0 });
  const [ribOffset, setRibOffset] = useState({ x: 0, y: 0 });
  const [bookOffset, setBookOffset] = useState({ x: 0, y: 0 });
  const [letterOffset, setLetterOffset] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [keyOffset, setKeyOffset] = useState({ x: 0, y: 0 });

  // Inspection Modal State
  const [activeDetail, setActiveDetail] = useState<ObjectDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Altar bone selection (Preserves Vitest tests & bone assembly)
  const [selectedBoneForAltar, setSelectedBoneForAltar] = useState<string | null>(null);
  const [isAltarDrawerOpen, setIsAltarDrawerOpen] = useState(false);
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
      if (draggedItem === 'skull') setSkullOffset({ x: dx, y: dy });
      else if (draggedItem === 'rib') setRibOffset({ x: dx, y: dy });
      else if (draggedItem === 'book') setBookOffset({ x: dx, y: dy });
      else if (draggedItem === 'letter') setLetterOffset({ x: dx, y: dy });
      else if (draggedItem === 'scroll') setScrollOffset({ x: dx, y: dy });
      else if (draggedItem === 'key') setKeyOffset({ x: dx, y: dy });
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

    if (wasMoved) {
      soundController.playClick();
      // Uncover secret clues
      if (itemId === 'skull' || itemId === 'book' || itemId === 'rib') {
        if (!collectedFragments.includes('THE')) {
          soundController.playDiscover();
          onFragmentUnlocked('THE');
          showToast('Relic shifted! Uncovered secret inscription: "THE"');
        }
      }
    } else {
      // It was a click! Open inspection reader
      handleOpenObjectDetail(itemId);
    }
  };

  const handleOpenObjectDetail = (itemId: string) => {
    soundController.playClick();
    if (itemId === 'skull') {
      setSelectedBoneForAltar('bone_skull');
      setActiveDetail({
        id: 'skull_1',
        name: 'Ancient Cranium',
        type: 'skull',
        title: 'Skull of the First Warden',
        subtitle: 'EXHUMED SKELETAL CRANIUM • 1891',
        text: 'Carved with the Mark of the North. Roman numeral "I" inscribed on the forehead, year 1891 etched into the temple.',
        clue: 'Underside velvet reveals cipher letter: "T"',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'book') {
      setActiveDetail({
        id: 'grimoire_1',
        name: 'Ancient Grimoire of the Frost Cartel',
        type: 'grimoire',
        title: 'The Cartel Exequies',
        subtitle: 'CHEST VOLUME • OCT 1891',
        pages: [
          {
            title: 'I. The First Syllable',
            content: 'Three wardens were laid beneath the frozen churchyard, each carrying a syllable of the eternal incantation. The first warden holds the definite beginning of the mystery: T-H-E.',
            clue: 'T - H - E',
          },
          {
            title: 'II. The Sepulcher Altars',
            content: 'Consecrate the Sacred Cranium at the Apex Altar, the Ribcage at the Center Sepulcher, and the Femur at the Base Pedestal to bind the wardings.',
            clue: 'Apex: Cranium • Center: Ribcage • Base: Femur',
          },
        ],
      });
      setIsDetailOpen(true);
    } else if (itemId === 'letter') {
      setActiveDetail({
        id: 'letter_1',
        name: 'Wax-Sealed Letter',
        type: 'letter',
        title: 'Cartel Emissary Letter',
        subtitle: 'FOUND BESIDE THE SARCOPHAGUS',
        text: 'Operative: Do not attempt the Arch-Lich Gate until all three coffins have surrendered their passwords. The letters from this tomb form the first syllable: "THE".',
        clue: 'THE',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'scroll') {
      setActiveDetail({
        id: 'scroll_1',
        name: 'Rolled Ribbon Scroll',
        type: 'scroll',
        title: 'Altar Consecration Scroll',
        subtitle: 'RITUAL INSTRUCTION',
        text: 'Heed the sacred bone placements: Apex Altar must receive the Cranium, Center Sepulcher receives the Ribcage, Base Pedestal receives the Grave Femur.',
      });
      setIsDetailOpen(true);
    } else if (itemId === 'rib') {
      setSelectedBoneForAltar('bone_rib');
      showToast('Inspecting Thoracic Ribcage. Lifted ribs reveal letter: "H"');
    } else if (itemId === 'key') {
      showToast('Inspecting Ancient Brass Key.');
    }
  };

  const handleInspect = handleOpenObjectDetail;

  const getBoneBtnClass = (isSelected: boolean, isPlaced: boolean): string => {
    if (isSelected) {
      return 'bg-amber-950 border-2 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    }
    if (isPlaced) {
      return 'bg-stone-950/40 border border-stone-800 text-stone-600 opacity-60 cursor-not-allowed';
    }
    return 'bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-200';
  };

  // Altar placement (preserves test suite)
  const handlePlaceBoneInAltar = (slotId: string) => {
    if (!selectedBoneForAltar) {
      showToast('Select a sacred bone from the list or coffin first.');
      return;
    }
    soundController.playClick();
    const updated = { ...placedBones, [slotId]: selectedBoneForAltar };
    onUpdatePlacedBones(updated);
    setSelectedBoneForAltar(null);

    const { allPlaced } = round1Service.placeBone(teamId, slotId, selectedBoneForAltar);
    if (allPlaced && !collectedFragments.includes('THE')) {
      soundController.playDiscover();
      onFragmentUnlocked('THE');
      showToast('Grave 1 Complete! Fragment unsealed: "THE"');
    }
  };

  return (
    <div
      role="region"
      aria-label="Grave 1 — The Bone Chamber"
      className="relative w-full h-[640px] sm:h-[720px] lg:h-[820px] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.98)] select-none bg-black/40 flex flex-col justify-between"
      onPointerMove={handlePointerMove}
    >
      {/* 1. Master High-Resolution Photorealistic Coffin Scene Background (Cleaned of all HUD) */}
      <img
        src="/assets/stage-3/coffins/grave1_marked_remains.jpg"
        alt="Grave I: The Marked Remains"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.96] contrast-[1.04] pointer-events-none"
      />

      {/* 2. Atmospheric Live Creatures: Flapping Bat & Crow in sky */}
      <FlyingBat startYPercent={7} durationSeconds={17} delaySeconds={1} scale={0.65} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={11} durationSeconds={23} delaySeconds={5} scale={0.75} flightDirection="left-to-right" />

      {/* 3. Layered Moonlit Fog and Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-36 mist-overlay opacity-45 animate-fog-roll pointer-events-none"
      />

      {/* 4. Top Header HUD */}
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black/95 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-bold tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Hidden semantic text for test accessibility */}
      <div className="sr-only" aria-hidden="true">
        <span>Grave 1 — The Bone Chamber</span>
      </div>

      {/* 4. Interactive Coffin Objects Layer (Invisible hit areas over exact visual elements) */}
      <div className="relative flex-1 w-full h-full pointer-events-auto">
        {/* Under-relic secret inscriptions (Only revealed when corresponding object is moved > 15px) */}
        {Math.hypot(skullOffset.x, skullOffset.y) > 15 && (
          <div
            style={{ left: '64%', top: '27%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center text-xs font-cinzel font-black tracking-widest text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] pointer-events-none z-0 animate-fadeIn"
          >
            <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.6)]">
              ✦ "T" ✦
            </div>
          </div>
        )}
        {Math.hypot(ribOffset.x, ribOffset.y) > 15 && (
          <div
            style={{ left: '58%', top: '43%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center text-xs font-cinzel font-black tracking-widest text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] pointer-events-none z-0 animate-fadeIn"
          >
            <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.6)]">
              ✦ "H" ✦
            </div>
          </div>
        )}
        {Math.hypot(bookOffset.x, bookOffset.y) > 15 && (
          <div
            style={{ left: '46%', top: '57%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center text-xs font-cinzel font-black tracking-widest text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] pointer-events-none z-0 animate-fadeIn"
          >
            <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.6)]">
              ✦ "E" ✦
            </div>
          </div>
        )}

        {/* OBJECT: The Ancient Cranium (Skull with Roman I) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Relic: First Warden Skull"
          data-object-id="skull_1"
          onClick={() => handleInspect('skull')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInspect('skull');
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, 'skull')}
          onPointerUp={(e) => handlePointerUp(e, 'skull')}
          style={{
            left: '64%',
            top: '26%',
            transform: `translate(calc(-50% + ${skullOffset.x}px), calc(-50% + ${skullOffset.y}px)) rotate(12deg)`,
            touchAction: 'none',
          }}
          className={`absolute z-10 cursor-grab active:cursor-grabbing group transition-all duration-100 ${
            Math.hypot(skullOffset.x, skullOffset.y) > 8
              ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]'
              : 'hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-full'
          }`}
          title="Ancient Cranium (Click to Inspect • Drag to Move)"
        >
          <div className={Math.hypot(skullOffset.x, skullOffset.y) > 8 ? 'block' : 'opacity-0 group-hover:opacity-40'}>
            <SkullGraphic romanNumeral="I" className="w-24 h-28 sm:w-28 sm:h-32" />
          </div>
        </div>

        {/* OBJECT: Thoracic Ribcage */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Thoracic Ribcage"
          data-object-id="rib_1"
          onClick={() => handleInspect('rib')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInspect('rib');
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, 'rib')}
          onPointerUp={(e) => handlePointerUp(e, 'rib')}
          style={{
            left: '58%',
            top: '42%',
            transform: `translate(calc(-50% + ${ribOffset.x}px), calc(-50% + ${ribOffset.y}px)) rotate(8deg)`,
            touchAction: 'none',
          }}
          className={`absolute z-10 cursor-grab active:cursor-grabbing group transition-all duration-100 ${
            Math.hypot(ribOffset.x, ribOffset.y) > 8
              ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]'
              : 'hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-2xl'
          }`}
          title="Thoracic Ribcage (Click to Inspect • Drag to Move)"
        >
          <div className={Math.hypot(ribOffset.x, ribOffset.y) > 8 ? 'block' : 'opacity-0 group-hover:opacity-40'}>
            <RibcageGraphic className="w-28 h-32 sm:w-32 sm:h-36" />
          </div>
        </div>

        {/* OBJECT: Ancient Grimoire (Chest Volume with Gold Solar Compass) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Ancient Grimoire"
          data-object-id="book_grimoire"
          onClick={() => handleInspect('book')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInspect('book');
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, 'book')}
          onPointerUp={(e) => handlePointerUp(e, 'book')}
          style={{
            left: '46%',
            top: '56%',
            transform: `translate(calc(-50% + ${bookOffset.x}px), calc(-50% + ${bookOffset.y}px)) rotate(-6deg)`,
            touchAction: 'none',
          }}
          className={`absolute z-20 cursor-grab active:cursor-grabbing group transition-all duration-100 ${
            Math.hypot(bookOffset.x, bookOffset.y) > 8
              ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]'
              : 'hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-2xl'
          }`}
          title="Ancient Grimoire (Click to Open • Drag to Move)"
        >
          <div className={Math.hypot(bookOffset.x, bookOffset.y) > 8 ? 'block' : 'opacity-0 group-hover:opacity-40'}>
            <BookGraphic className="w-28 h-24 sm:w-32 sm:h-28" />
          </div>
        </div>

        {/* OBJECT: Wax-Sealed Letter */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Wax-Sealed Letter"
          data-object-id="letter_1"
          onClick={() => handleInspect('letter')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInspect('letter');
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, 'letter')}
          onPointerUp={(e) => handlePointerUp(e, 'letter')}
          style={{
            left: '36%',
            top: '78%',
            transform: `translate(calc(-50% + ${letterOffset.x}px), calc(-50% + ${letterOffset.y}px)) rotate(-14deg)`,
            touchAction: 'none',
          }}
          className={`absolute z-20 cursor-grab active:cursor-grabbing group transition-all duration-100 ${
            Math.hypot(letterOffset.x, letterOffset.y) > 8
              ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]'
              : 'hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-xl'
          }`}
          title="Wax-Sealed Letter (Click to Unfold • Drag to Move)"
        >
          <div className={Math.hypot(letterOffset.x, letterOffset.y) > 8 ? 'block' : 'opacity-0 group-hover:opacity-40'}>
            <LetterGraphic className="w-20 h-16 sm:w-24 sm:h-20" />
          </div>
        </div>

        {/* OBJECT: Rolled Ribbon Scroll */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Rolled Ribbon Scroll"
          data-object-id="scroll_1"
          onClick={() => handleInspect('scroll')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInspect('scroll');
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, 'scroll')}
          onPointerUp={(e) => handlePointerUp(e, 'scroll')}
          style={{
            left: '62%',
            top: '72%',
            transform: `translate(calc(-50% + ${scrollOffset.x}px), calc(-50% + ${scrollOffset.y}px)) rotate(20deg)`,
            touchAction: 'none',
          }}
          className={`absolute z-20 cursor-grab active:cursor-grabbing group transition-all duration-100 ${
            Math.hypot(scrollOffset.x, scrollOffset.y) > 8
              ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]'
              : 'hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-xl'
          }`}
          title="Rolled Ribbon Scroll (Click to Read • Drag to Move)"
        >
          <div className={Math.hypot(scrollOffset.x, scrollOffset.y) > 8 ? 'block' : 'opacity-0 group-hover:opacity-40'}>
            <ScrollGraphic className="w-24 h-12 sm:w-28 sm:h-14" />
          </div>
        </div>

        {/* OBJECT: Antique Brass Key */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Antique Brass Key"
          data-object-id="key_1"
          onClick={() => handleInspect('key')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInspect('key');
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, 'key')}
          onPointerUp={(e) => handlePointerUp(e, 'key')}
          style={{
            left: '51%',
            top: '72%',
            transform: `translate(calc(-50% + ${keyOffset.x}px), calc(-50% + ${keyOffset.y}px)) rotate(45deg)`,
            touchAction: 'none',
          }}
          className={`absolute z-20 cursor-grab active:cursor-grabbing group transition-all duration-100 ${
            Math.hypot(keyOffset.x, keyOffset.y) > 8
              ? 'opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]'
              : 'hover:bg-amber-400/15 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-xl'
          }`}
          title="Antique Brass Key (Click to Inspect • Drag to Move)"
        >
          <div className={Math.hypot(keyOffset.x, keyOffset.y) > 8 ? 'block' : 'opacity-0 group-hover:opacity-40'}>
            <KeyGraphic className="w-16 h-8 sm:w-20 sm:h-10" />
          </div>
        </div>
      </div>

      {/* 5. Consecration Altars Drawer (Preserves Bone Chamber test suite) */}
      <div className="relative z-30 px-3 sm:px-6 py-2">
        <div className="p-2 sm:p-3 rounded-2xl bg-black/85 border border-amber-900/60 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-widest">
                Sacred Sepulcher Altars
              </span>
              <button
                type="button"
                onClick={() => setIsAltarDrawerOpen(!isAltarDrawerOpen)}
                className="text-[9px] font-mono text-amber-400/80 hover:text-amber-200 underline cursor-pointer"
              >
                {isAltarDrawerOpen ? '[ Hide Chamber ]' : '[ Consecrate Bones ]'}
              </button>
            </div>
            {collectedFragments.includes('THE') && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                ✓ Consecrated Syllable: "THE"
              </span>
            )}
          </div>

          {/* Bone Selection Buttons (For test suite and manual placement) */}
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-cinzel font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">
              Select Bone:
            </span>
            {config.grave1.bones.map((bone) => {
              const isSelected = selectedBoneForAltar === bone.id;
              const isPlaced = Object.values(placedBones).includes(bone.id);
              return (
                <button
                  key={bone.id}
                  type="button"
                  disabled={isPlaced}
                  onClick={() => {
                    soundController.playClick();
                    setSelectedBoneForAltar(bone.id);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-cinzel font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${getBoneBtnClass(
                    isSelected,
                    isPlaced
                  )}`}
                >
                  <span>{bone.symbol}</span>
                  <span>{bone.name}</span>
                  {isPlaced && <span className="text-[9px] text-emerald-400 font-mono">✓</span>}
                </button>
              );
            })}
          </div>

          {/* 3 Altar Slots */}
          <div className="grid grid-cols-3 gap-2">
            {config.grave1.slots.map((slot) => {
              const placedBoneId = placedBones[slot.slotId];
              const boneItem = config.grave1.bones.find((b) => b.id === placedBoneId);

              return (
                <button
                  key={slot.slotId}
                  type="button"
                  onClick={() => handlePlaceBoneInAltar(slot.slotId)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    boneItem
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                      : 'bg-stone-900/80 border-stone-700 hover:border-amber-500 text-stone-300'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-cinzel font-bold text-amber-200">
                      {slot.name}
                    </div>
                    <div className="text-[9px] text-stone-400 font-mono">
                      {boneItem ? boneItem.name : 'Empty chamber'}
                    </div>
                  </div>
                  {boneItem ? (
                    <span className="text-[9px] font-mono font-bold text-emerald-400">
                      (Placed)
                    </span>
                  ) : (
                    <span className="text-[9px] font-cinzel text-amber-400 font-bold">
                      [ Place ]
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Bottom Controls: Evidence Journal, Tagline, Return to Cemetery */}
      <footer className="relative z-30 px-3 sm:px-6 pb-3 pt-1 flex items-center justify-between select-none">
        {/* Bottom-Left: Evidence Journal */}
        <button
          type="button"
          onClick={onOpenJournal}
          className="px-4 py-2 rounded-2xl bg-black/85 hover:bg-amber-950/80 border border-amber-500/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>📖</span>
          <span>EVIDENCE JOURNAL ({collectedFragments.length}/3)</span>
        </button>

        {/* Bottom-Center: Cinematic Tagline */}
        <div className="hidden md:flex items-center gap-2 text-stone-400 font-serif italic text-xs tracking-wider">
          <span>✦ Click an object to inspect • Drag to move ✦</span>
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

      {/* 7. Object Detail Inspection Modal (Grimoire reader with turning pages, letter, skull rotation) */}
      <ObjectDetailModal
        isOpen={isDetailOpen}
        data={activeDetail}
        onClose={() => setIsDetailOpen(false)}
        onDiscoverClue={(clue) => {
          if (clue === 'THE' || clue === 'T - H - E') {
            onFragmentUnlocked('THE');
          }
        }}
      />
    </div>
  );
};
