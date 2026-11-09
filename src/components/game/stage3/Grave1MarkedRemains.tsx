import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { AncientBookReader } from './AncientBookReader';
import { ArtifactInspectionModal, type ArtifactType } from './ArtifactInspectionModal';
import { TreasureChestRelic } from './TreasureChestRelic';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';

// ORIGINAL IMAGE INTRINSIC DIMENSIONS (Single authoritative coordinate space)
export const COFFIN_ORIGINAL_WIDTH = 1024;
export const COFFIN_ORIGINAL_HEIGHT = 576;
export const COFFIN_VIEWBOX = `0 0 ${COFFIN_ORIGINAL_WIDTH} ${COFFIN_ORIGINAL_HEIGHT}`;

// HIGH-PRECISION INVISIBLE INTERACTION HIT-AREAS (100% Transparent — Zero Visible Outlines)
export const COFFIN_SVG_PATHS = {
  // 1. The Ancient Book
  ancient_book:
    'M 430,255 L 460,260 L 490,264 L 520,268 L 547,271 L 552,276 L 550,295 L 555,305 L 548,316 L 536,336 L 508,362 L 504,368 L 475,375 L 445,371 L 424,362 L 405,346 L 402,335 L 412,320 L 422,285 Z',

  // 2. The Ancient Letter (Sealed envelope)
  envelope:
    'M 306,443 L 382,412 L 456,435 L 441,514 L 364,520 L 293,492 Z',

  // 3. The Occult Dispatch Parchment
  parchment:
    'M 354,396 L 425,388 L 465,398 L 478,416 L 478,455 L 458,438 L 382,412 L 306,443 L 312,422 Z',

  // 4. Skeleton: Skull with Roman Numeral "I"
  skull:
    'M 645,88 L 675,96 L 695,115 L 704,140 L 702,165 L 685,192 L 665,215 L 645,218 L 620,205 L 600,180 L 592,150 L 602,115 L 622,95 Z',

  // 5. Skeleton: Thoracic Ribcage with Solar Medallion
  ribcage:
    'M 545,188 L 590,186 L 635,192 L 655,215 L 668,245 L 662,280 L 635,305 L 585,308 L 540,300 L 512,275 L 504,240 L 518,205 Z',

  // 6. Skeleton: Left Arm & Hand Phalanges
  left_arm:
    'M 495,195 L 455,215 L 418,242 L 385,275 L 368,298 L 385,318 L 382,338 L 370,356 L 354,352 L 346,332 L 352,302 L 370,275 L 405,235 L 445,205 Z',

  // 7. Skeleton: Crimson-Bound Right Femur (Movable bone concealing the "ASH" plate)
  femur:
    'M 605,385 L 635,415 L 655,445 L 678,485 L 675,510 L 655,515 L 638,485 L 620,445 L 595,410 L 588,395 Z',

  // 8. Antique Brass Skeleton Key
  skeleton_key:
    'M 485,415 L 515,395 L 535,405 L 555,420 L 545,435 L 525,425 L 495,430 Z',

  // 9. Rolled Ancient Papyrus Scroll
  scroll:
    'M 580,400 L 655,395 L 705,415 L 695,465 L 625,475 L 575,445 Z',

  // 10. Engraved Antique Compass Medallion
  compass:
    'M 550,345 L 585,345 L 600,370 L 585,395 L 550,395 L 535,370 Z',
};

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

  const [riddleInput, setRiddleInput] = useState('');
  const [riddleError, setRiddleError] = useState<string | null>(null);
  const [isRiddleSolved, setIsRiddleSolved] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1RiddleSolved);
  });

  const [isChestUnlocked, setIsChestUnlocked] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1ChestUnlocked);
  });

  const [isChestOpen, setIsChestOpen] = useState<boolean>(() => {
    return collectedFragments.includes('BENEATH');
  });

  const [isKeyFlying, setIsKeyFlying] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Common Shared Scene and GSAP Animation Refs
  const sceneWrapperRef = useRef<HTMLDivElement | null>(null);
  const zoomPanStageRef = useRef<HTMLDivElement | null>(null);
  const flyingKeyRef = useRef<SVGGElement | null>(null);
  const answerInputRef = useRef<HTMLInputElement | null>(null);

  // Dragging interaction state for skeletal remains
  const [isDraggingSkeleton, setIsDraggingSkeleton] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Auto-dismiss toast
  const showToast = useCallback((msg: string) => {
    setToastNotice(msg);
    window.clearTimeout((showToast as unknown as { timeoutId?: number }).timeoutId);
    (showToast as unknown as { timeoutId?: number }).timeoutId = window.setTimeout(() => {
      setToastNotice(null);
    }, 4500);
  }, []);

  // Update offset if already shifted on mount
  useEffect(() => {
    if (isSkeletonMoved && skeletonOffset.x === 0 && skeletonOffset.y === 0) {
      setSkeletonOffset({ x: 30, y: -18 });
    }
  }, [isSkeletonMoved, skeletonOffset]);

  // 1. Camera Zoom to Ancient Book (Coordinates: 484, 315)
  const handleOpenBook = useCallback(() => {
    soundController.playClick();
    setIsBookModalOpen(true);

    if (zoomPanStageRef.current) {
      gsap.to(zoomPanStageRef.current, {
        scale: 1.35,
        transformOrigin: '47.3% 54.7%',
        duration: 0.55,
        ease: 'power2.inOut',
      });
    }
  }, []);

  const handleCloseBook = useCallback(() => {
    setIsBookModalOpen(false);

    if (zoomPanStageRef.current) {
      gsap.to(zoomPanStageRef.current, {
        scale: 1,
        transformOrigin: 'center center',
        duration: 0.45,
        ease: 'power2.out',
      });
    }
  }, []);

  const handleBookFullyRead = useCallback(() => {
    if (!isBookRead) {
      setIsBookRead(true);
      round1Service.markGrave1BookRead(teamId);
      soundController.playDiscover();
      showToast('✦ Grimoire deciphered! The skeletal remains may now be shifted. ✦');
    }
  }, [isBookRead, teamId, showToast]);

  // 2. Camera Zoom & Inspection for Ancient Letter / Envelope (Coordinates: 382, 452)
  const handleInspectLetter = useCallback(() => {
    soundController.playClick();
    setActiveArtifact('parchment');

    if (zoomPanStageRef.current) {
      gsap.to(zoomPanStageRef.current, {
        scale: 1.35,
        transformOrigin: '37.3% 78.5%',
        duration: 0.5,
        ease: 'power2.inOut',
      });
    }
  }, []);

  const handleCloseArtifactModal = useCallback(() => {
    setActiveArtifact(null);

    if (zoomPanStageRef.current) {
      gsap.to(zoomPanStageRef.current, {
        scale: 1,
        transformOrigin: 'center center',
        duration: 0.45,
        ease: 'power2.out',
      });
    }
  }, []);

  // 3. Movable Skeleton Handling (Pointer drag + click fallback)
  const handleSkeletonPointerDown = (e: React.PointerEvent) => {
    if (!isBookRead) {
      soundController.playClick();
      showToast('You must decipher the Ancient Book first.');
      return;
    }
    setIsDraggingSkeleton(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: skeletonOffset.x,
      origY: skeletonOffset.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleSkeletonPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSkeleton || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const clampedX = Math.max(-20, Math.min(65, dragStartRef.current.origX + dx));
    const clampedY = Math.max(-40, Math.min(30, dragStartRef.current.origY + dy));
    setSkeletonOffset({ x: clampedX, y: clampedY });

    if (!isSkeletonMoved && (Math.abs(clampedX) > 18 || Math.abs(clampedY) > 12)) {
      setIsSkeletonMoved(true);
      round1Service.shiftGrave1Skeleton(teamId);
      soundController.playDiscover();
      showToast('✦ Remains shifted! Hidden inscription uncovered: "ASH" ✦');
    }
  };

  const handleSkeletonPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingSkeleton) return;
    setIsDraggingSkeleton(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    // If moved even slightly, lock into shifted position
    if (isSkeletonMoved || Math.abs(skeletonOffset.x) > 12 || Math.abs(skeletonOffset.y) > 8) {
      setIsSkeletonMoved(true);
      round1Service.shiftGrave1Skeleton(teamId);
      setSkeletonOffset({ x: 30, y: -18 });
    } else {
      setSkeletonOffset({ x: 0, y: 0 });
    }
    dragStartRef.current = null;
  };

  // Keyboard accessibility for skeleton
  const handleSkeletonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isBookRead) {
        showToast('You must decipher the Ancient Book first.');
      } else if (!isSkeletonMoved) {
        setIsSkeletonMoved(true);
        round1Service.shiftGrave1Skeleton(teamId);
        setSkeletonOffset({ x: 30, y: -18 });
        soundController.playDiscover();
        showToast('✦ Remains shifted! Hidden inscription uncovered: "ASH" ✦');
      }
    }
  };

  // 4. Riddle Submission
  const handleSubmitRiddle = (e: React.FormEvent) => {
    e.preventDefault();
    setRiddleError(null);
    const cleaned = riddleInput.trim().toUpperCase();

    if (!cleaned) {
      setRiddleError('Enter a keyword to answer the Keeper’s riddle.');
      return;
    }

    const res = round1Service.solveGrave1Riddle(teamId, cleaned);
    if (res.success) {
      soundController.playCorrect();
      setIsRiddleSolved(true);
      showToast('✦ Correct! The Keeper accepts "ASH". The Skeleton Key awakens! ✦');
    } else {
      soundController.playWrongAnswer();
      const errMsg = 'The sepulcher remains silent. Consult Folio II & III for guidance.';
      setRiddleError(errMsg);
      showToast(errMsg);
      if (answerInputRef.current) {
        gsap.fromTo(
          answerInputRef.current,
          { x: -8 },
          {
            x: 8,
            duration: 0.08,
            repeat: 5,
            yoyo: true,
            ease: 'none',
            onComplete: () => {
              if (answerInputRef.current) answerInputRef.current.style.transform = '';
            },
          }
        );
      }
    }
  };

  // 5. Skeleton Key Flight & Lock Animation
  const handleKeyClick = () => {
    if (!isRiddleSolved) {
      soundController.playClick();
      setActiveArtifact('key');
      return;
    }
    if (isChestUnlocked || isKeyFlying) return;

    soundController.playChestUnlock();
    setIsChestUnlocked(true);
    round1Service.unlockGrave1Chest(teamId);
    showToast('✦ Padlock unlocked! The ancient chest is ready to open. ✦');

    if (flyingKeyRef.current) {
      setIsKeyFlying(true);
      gsap.to(flyingKeyRef.current, {
        x: -280,
        y: 40,
        rotation: 90,
        scale: 1.3,
        duration: 1.1,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsKeyFlying(false);
        },
      });
    }
  };

  // 6. Open Chest & Reveal Secret Word
  const handleOpenChest = () => {
    if (!isChestUnlocked || isChestOpen) return;
    soundController.playSecretFound();
    setIsChestOpen(true);
    round1Service.unlockGrave1Chest(teamId);
    onFragmentUnlocked('BENEATH');
    showToast('✦ Sacred Syllable Unsealed: "BENEATH" • Coffin I Completed! ✦');
  };

  // Dynamic investigation hint in bottom bar
  const investigationHint = useMemo(() => {
    if (isChestOpen) {
      return '✦ Sacred Syllable Unsealed: "BENEATH" • Coffin I Completed! ✦';
    }
    if (isChestUnlocked) {
      return 'The chest lock is open. Click the chest to reveal the ancient secret...';
    }
    if (isRiddleSolved) {
      return 'The key awaits... Click the skeleton key to unlock the chest.';
    }
    if (isSkeletonMoved) {
      return 'Keeper’s Riddle: "Born when flame is spent, pale when all light has fled; I am the last trace of fire, yet I hold no heat. What am I?"';
    }
    if (isBookRead) {
      return 'The grimoire is deciphered. Shift the skeletal remains to reveal the hidden cipher.';
    }
    return 'Read the ancient book. Uncover the truth...';
  }, [isChestOpen, isChestUnlocked, isRiddleSolved, isSkeletonMoved, isBookRead]);

  return (
    <div
      role="region"
      aria-label="Grave 1 — The Marked Remains • The Bone Chamber"
      className="relative w-full h-screen max-h-screen overflow-hidden select-none bg-black flex flex-col justify-between text-stone-100 font-sans"
    >
      {/* Semantic Accessibility Fallback */}
      <div className="sr-only">
        <h1>Grave 1 — The Bone Chamber</h1>
        <h2>The Marked Remains</h2>
        <p>THE KEEPER’S LAST RIDDLE</p>
      </div>

      {/* Atmospheric Live Creatures */}
      <FlyingBat startYPercent={4} durationSeconds={19} delaySeconds={1} scale={0.55} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={7} durationSeconds={24} delaySeconds={6} scale={0.65} flightDirection="left-to-right" />

      {/* TOP HUD: Frost Cartel Skull Crest, Coffin Title, Timer, Credits, Audio, Exit */}
      <CoffinHeaderHUD
        graveNumber="GRAVE I"
        title="THE MARKED REMAINS"
        secondsRemaining={secondsRemaining}
        stageCleared={stageCleared}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onReturnDashboard={onReturnDashboard}
      />

      {/* CENTRAL COFFIN INVESTIGATION SCENE (75–85% Screen Focus) */}
      <main
        ref={sceneWrapperRef}
        className="relative flex-1 w-full flex items-center justify-center p-1 sm:p-2 overflow-hidden"
        onPointerMove={handleSkeletonPointerMove}
        onPointerUp={handleSkeletonPointerUp}
      >
        {/* ONE COMMON SHARED SCENE STAGE (Locking exact 1024:576 aspect ratio with ZERO drift) */}
        <div
          ref={zoomPanStageRef}
          style={{
            width: '100%',
            maxWidth: '1240px',
            aspectRatio: `${COFFIN_ORIGINAL_WIDTH} / ${COFFIN_ORIGINAL_HEIGHT}`,
            maxHeight: 'calc(100vh - 140px)',
          }}
          className="relative rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-950/60 bg-stone-950 flex items-center justify-center"
        >
          {/* 1. MASTER HIGH-RESOLUTION PHOTOREALISTIC COFFIN SCENE (1024 × 576) — PRISTINE PHOTOGRAPH */}
          <img
            src="/assets/stage-3/coffins/grave1_marked_remains.jpg"
            alt="Coffin I: The Marked Remains"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none filter brightness-[0.98] contrast-[1.04]"
          />

          {/* Layered Moonlit Fog and Vignette */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/75"
          />

          {/* 2. SVG INTERACTION LAYER (100% Invisible Hit-Areas — ZERO Visible Highlight Outlines) */}
          <svg
            viewBox={COFFIN_VIEWBOX}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            aria-hidden="true"
          >
            {/* OBJECT 1: ANCIENT BOOK / GRIMOIRE (Invisible precision click target) */}
            <path
              d={COFFIN_SVG_PATHS.ancient_book}
              fill="transparent"
              stroke="transparent"
              className="pointer-events-auto cursor-pointer"
              onClick={handleOpenBook}
            />

            {/* OBJECT 2: ANCIENT LETTER / SEALED ENVELOPE (Invisible target) */}
            <path
              d={COFFIN_SVG_PATHS.envelope}
              fill="transparent"
              stroke="transparent"
              className="pointer-events-auto cursor-pointer"
              onClick={handleInspectLetter}
            />

            {/* OBJECT 3: OCCULT DISPATCH PARCHMENT (Invisible target) */}
            <path
              d={COFFIN_SVG_PATHS.parchment}
              fill="transparent"
              stroke="transparent"
              className="pointer-events-auto cursor-pointer"
              onClick={handleInspectLetter}
            />

            {/* OBJECT 4: REVEALED BRASS INSCRIPTION PLATE "ASH" (Only visible once bone is moved) */}
            {isSkeletonMoved && (
              <g
                className="pointer-events-auto cursor-pointer transition-all duration-300"
                onClick={() => {
                  soundController.playDiscover();
                  showToast('✦ Ancient Engraved Plate: "ASH" — The keyword for the Keeper’s Riddle ✦');
                }}
              >
                <rect
                  x="596"
                  y="392"
                  width="72"
                  height="34"
                  rx="5"
                  fill="#1f100a"
                  stroke="#b45309"
                  strokeWidth="1.5"
                />
                <rect
                  x="600"
                  y="396"
                  width="64"
                  height="26"
                  rx="3"
                  fill="#2c170c"
                  stroke="#78350f"
                  strokeWidth="1"
                />
                <text
                  x="632"
                  y="414"
                  textAnchor="middle"
                  fill="#fef08a"
                  fontFamily="Cinzel, serif"
                  fontSize="13"
                  fontWeight="900"
                  letterSpacing="3"
                  filter="drop-shadow(0 0 4px #eab308)"
                >
                  ASH
                </text>
              </g>
            )}

            {/* OBJECT 5: MOVABLE SKELETAL REMAINS GROUP (Invisible targets) */}
            <g
              transform={`translate(${skeletonOffset.x}, ${skeletonOffset.y})`}
              className="transition-transform duration-300 pointer-events-auto"
            >
              {/* 5A. SKULL */}
              <path
                d={COFFIN_SVG_PATHS.skull}
                fill="transparent"
                stroke="transparent"
                className="pointer-events-auto cursor-pointer"
                onClick={() => {
                  soundController.playClick();
                  setActiveArtifact('skull');
                }}
              />

              {/* 5B. THORACIC RIBCAGE */}
              <path
                d={COFFIN_SVG_PATHS.ribcage}
                fill="transparent"
                stroke="transparent"
                className="pointer-events-auto cursor-pointer"
                onClick={() => {
                  soundController.playClick();
                  setActiveArtifact('ribcage');
                }}
              />

              {/* 5C. LEFT ARM & HAND PHALANGES */}
              <path
                d={COFFIN_SVG_PATHS.left_arm}
                fill="transparent"
                stroke="transparent"
                className="pointer-events-auto cursor-pointer"
                onClick={() => {
                  soundController.playClick();
                  showToast('The skeletal hand rests beside the ancient grimoire.');
                }}
              />

              {/* 5D. CRIMSON-BOUND FEMUR (Movable Bone concealing "ASH") */}
              <path
                d={COFFIN_SVG_PATHS.femur}
                fill="transparent"
                stroke="transparent"
                className={`pointer-events-auto transition-all ${
                  isBookRead ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                }`}
                onPointerDown={handleSkeletonPointerDown}
                onClick={() => {
                  if (!isBookRead) {
                    showToast('You must decipher the Ancient Book first.');
                  } else if (!isSkeletonMoved) {
                    setIsSkeletonMoved(true);
                    round1Service.shiftGrave1Skeleton(teamId);
                    setSkeletonOffset({ x: 30, y: -18 });
                    soundController.playDiscover();
                    showToast('✦ Remains shifted! Hidden inscription uncovered: "ASH" ✦');
                  }
                }}
              />
            </g>

            {/* OBJECT 6: ANTIQUE BRASS SKELETON KEY */}
            <g
              ref={flyingKeyRef}
              className="pointer-events-auto cursor-pointer"
              onClick={handleKeyClick}
            >
              <path
                d={COFFIN_SVG_PATHS.skeleton_key}
                fill="transparent"
                stroke="transparent"
              />
            </g>

            {/* OBJECT 7: ROLLED ANCIENT PAPYRUS SCROLL */}
            <path
              d={COFFIN_SVG_PATHS.scroll}
              fill="transparent"
              stroke="transparent"
              className="pointer-events-auto cursor-pointer"
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('scroll');
              }}
            />

            {/* OBJECT 8: ENGRAVED COMPASS MEDALLION */}
            <path
              d={COFFIN_SVG_PATHS.compass}
              fill="transparent"
              stroke="transparent"
              className="pointer-events-auto cursor-pointer"
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('compass');
              }}
            />
          </svg>

          {/* ACCESSIBLE HIDDEN BUTTONS FOR TESTS & SCREEN READERS */}
          <div className="sr-only">
            <button
              type="button"
              onClick={handleOpenBook}
              aria-label="Ancient Grimoire: Click to Open and Read"
            >
              Open Ancient Grimoire
            </button>
            <button
              type="button"
              onClick={() => {
                if (isBookRead) {
                  setIsSkeletonMoved(true);
                  round1Service.shiftGrave1Skeleton(teamId);
                  setSkeletonOffset({ x: 30, y: -18 });
                }
              }}
              onKeyDown={handleSkeletonKeyDown}
              aria-label="Skeletal Remains of the First Warden"
            >
              Shift Skeletal Remains
            </button>
            <button
              type="button"
              onClick={handleKeyClick}
              aria-label="Antique Brass Skeleton Key"
            >
              Skeleton Key
            </button>
          </div>

          {/* LOWER COFFIN BASE: TREASURE CHEST RELIC (Anchored over coffin base) */}
          {isRiddleSolved && (
            <div className="absolute left-6 bottom-4 sm:left-10 sm:bottom-6 z-20 pointer-events-auto max-w-[280px] sm:max-w-[320px]">
              <TreasureChestRelic
                isEmerged={isRiddleSolved}
                isUnlocked={isChestUnlocked}
                isOpen={isChestOpen}
                revealedWord="BENEATH"
                onOpenChest={handleOpenChest}
              />
            </div>
          )}

          {/* TOAST NOTIFICATION OVERLAY */}
          {toastNotice && (
            <div
              role="alert"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-black/90 border border-amber-500/80 text-amber-200 text-xs sm:text-sm font-cinzel font-bold tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.4)] backdrop-blur-md animate-fadeIn"
            >
              {toastNotice}
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM CONTROL BAR: SLEEK GOTHIC BAR (Exact match to target design) */}
      <footer className="relative z-30 w-full px-3 sm:px-6 py-2 pb-3 flex flex-col sm:flex-row items-center justify-between gap-2 select-none">
        {/* Left Corner: Evidence Journal Toggle */}
        <button
          type="button"
          onClick={() => {
            soundController.playClick();
            onOpenJournal();
          }}
          aria-label={`Evidence Journal (${collectedFragments.length}/3)`}
          className="order-2 sm:order-1 px-4 py-1.5 rounded-full bg-black/85 hover:bg-amber-950/80 border border-amber-600/70 hover:border-amber-400 text-stone-200 hover:text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,0,0,0.8)] cursor-pointer backdrop-blur-sm"
        >
          <span aria-hidden="true">📖</span>
          <span>EVIDENCE JOURNAL ({collectedFragments.length}/3)</span>
        </button>

        {/* Central Investigation Bar */}
        <div className="order-1 sm:order-2 flex-1 max-w-3xl w-full px-3.5 py-1.5 rounded-full bg-[#120803]/90 border border-amber-600/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          {/* Dynamic Investigation Hint with Grimoire Icon */}
          <div className="flex items-center gap-2 text-amber-200/90 font-serif italic truncate flex-1 min-w-0">
            <span className="text-amber-400 text-sm flex-shrink-0" aria-hidden="true">
              📜
            </span>
            <span className="truncate text-[11px] sm:text-xs">
              {investigationHint}
            </span>
          </div>

          {/* Riddle Submission Input & Submit Button */}
          {!isRiddleSolved ? (
            <form onSubmit={handleSubmitRiddle} className="relative flex items-center gap-2 flex-shrink-0">
              {riddleError && (
                <span className="absolute -top-7 right-0 px-2 py-0.5 rounded bg-black/90 border border-red-500/80 text-[10px] text-red-300 font-serif italic whitespace-nowrap shadow-md pointer-events-none">
                  {riddleError}
                </span>
              )}
              <input
                ref={answerInputRef}
                type="text"
                value={riddleInput}
                onChange={(e) => {
                  setRiddleInput(e.target.value);
                  if (riddleError) setRiddleError(null);
                }}
                placeholder="Enter your answer..."
                autoComplete="off"
                className="w-32 sm:w-44 px-3 py-1 rounded-full bg-black/80 border border-amber-500/70 text-amber-100 placeholder-amber-700/60 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
              />
              <button
                type="submit"
                className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-amber-400 text-stone-950 font-cinzel text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.4)] cursor-pointer whitespace-nowrap"
              >
                SUBMIT
              </button>
            </form>
          ) : (
            <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 font-cinzel text-[11px] font-bold tracking-wider uppercase whitespace-nowrap flex-shrink-0">
              ✓ RIDDLE SOLVED • &ldquo;ASH&rdquo;
            </div>
          )}

          {/* Return to Cemetery Button */}
          <button
            type="button"
            onClick={() => {
              soundController.playClick();
              onReturnCemetery();
            }}
            aria-label="Return to Cemetery"
            className="hidden lg:flex px-3.5 py-1 rounded-full bg-black/80 hover:bg-amber-950/70 border border-amber-700/70 text-amber-300 hover:text-amber-100 font-cinzel text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
          >
            ← RETURN TO CEMETERY
          </button>
        </div>

        {/* Right Corner: Return to Cemetery Button (Visible on mobile/tablet) */}
        <button
          type="button"
          onClick={() => {
            soundController.playClick();
            onReturnCemetery();
          }}
          aria-label="Return to Cemetery"
          className="order-3 lg:hidden px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-amber-950/80 border border-amber-700/80 text-amber-300 hover:text-amber-100 font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-sm"
        >
          ← RETURN TO CEMETERY
        </button>
      </footer>

      {/* ANCIENT BOOK READER MODAL */}
      <AncientBookReader
        isOpen={isBookModalOpen}
        onClose={handleCloseBook}
        onAllPagesRead={handleBookFullyRead}
      />

      {/* ARTIFACT CLOSE-UP INSPECTION MODAL */}
      <ArtifactInspectionModal
        isOpen={Boolean(activeArtifact)}
        artifactType={activeArtifact}
        onClose={handleCloseArtifactModal}
      />
    </div>
  );
};
