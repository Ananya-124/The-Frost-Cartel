import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Container and Animation Refs
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);
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

  // 1. Camera Zoom to Ancient Book
  const handleOpenBook = useCallback(() => {
    soundController.playClick();
    setIsBookModalOpen(true);
    if (sceneContainerRef.current) {
      gsap.to(sceneContainerRef.current, {
        scale: 1.25,
        transformOrigin: '46% 59%',
        duration: 0.55,
        ease: 'power2.inOut',
      });
    }
  }, []);

  const handleCloseBook = useCallback(() => {
    setIsBookModalOpen(false);
    if (sceneContainerRef.current) {
      gsap.to(sceneContainerRef.current, {
        scale: 1,
        transformOrigin: 'center center',
        duration: 0.5,
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

  // 2. Movable Skeleton Handling (Pointer drag + click fallback)
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
      // snap back
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

  // 3. Riddle Submission
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

  // 4. Skeleton Key Flight & Lock Animation
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
      // Animate key from its original position (515, 415) to chest lock at (200, 460)
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

  // 5. Open Chest & Reveal Secret Word
  const handleOpenChest = () => {
    if (!isChestUnlocked || isChestOpen) return;
    soundController.playSecretFound();
    setIsChestOpen(true);
    round1Service.unlockGrave1Chest(teamId);
    onFragmentUnlocked('BENEATH');
    showToast('✦ Sacred Syllable Unsealed: "BENEATH" • Coffin I Completed! ✦');
  };

  // Current dynamic investigation hint
  const getInvestigationHint = () => {
    if (isChestOpen) {
      return '✦ Sacred Syllable Unsealed: "BENEATH" • Coffin I Completed! ✦';
    }
    if (isChestUnlocked) {
      return 'The chest lock is open. Click the chest to reveal the ancient secret...';
    }
    if (isRiddleSolved) {
      return 'The key awaits... Click the glowing Skeleton Key to unlock the chest.';
    }
    if (isSkeletonMoved) {
      return 'Keeper’s Riddle: "Born when flame is spent, pale when all light has fled; I am the last trace of fire, yet I hold no heat. What am I?"';
    }
    if (isBookRead) {
      return 'The grimoire is deciphered. Shift the skeletal remains to reveal the hidden cipher.';
    }
    return 'Read the ancient book. Uncover the truth...';
  };

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
        className="relative flex-1 w-full flex items-center justify-center p-1 sm:p-2 overflow-hidden"
        onPointerMove={handleSkeletonPointerMove}
        onPointerUp={handleSkeletonPointerUp}
      >
        <div
          ref={sceneContainerRef}
          className="relative w-full max-w-[1340px] aspect-[1024/576] max-h-[calc(100vh-140px)] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-950/60 bg-stone-950 flex items-center justify-center"
        >
          {/* Master High-Resolution Photorealistic Coffin Scene */}
          <img
            src="/assets/stage-3/coffins/grave1_marked_remains.jpg"
            alt="Coffin I: The Marked Remains"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.04] pointer-events-none"
          />

          {/* Layered Moonlit Fog and Vignette */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/75"
          />

          {/* SVG INTERACTION OVERLAY (Direct coordinate alignment: 1024 x 576) */}
          <svg
            viewBox="0 0 1024 576"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="relicPulse" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feColorMatrix type="matrix" values="1 0 0 0 0.96  0 1 0 0 0.62  0 0 1 0 0.04  0 0 0 1 0" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. HOTSPOT: ANCIENT BOOK / GRIMOIRE */}
            <polygon
              points="382,260 528,252 550,394 404,418 375,295"
              fill={hoveredHotspot === 'book' ? 'rgba(245,158,11,0.18)' : 'transparent'}
              stroke={hoveredHotspot === 'book' ? '#f59e0b' : 'transparent'}
              strokeWidth={hoveredHotspot === 'book' ? 2.5 : 0}
              strokeDasharray="6 3"
              filter={hoveredHotspot === 'book' ? 'url(#goldGlow)' : undefined}
              className="pointer-events-auto cursor-pointer transition-all duration-300"
              onPointerEnter={() => setHoveredHotspot('book')}
              onPointerLeave={() => setHoveredHotspot(null)}
              onClick={handleOpenBook}
            />

            {/* 2. REVEALED INSCRIPTION PLATE "ASH" (Appears once skeleton is shifted) */}
            {isSkeletonMoved && (
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={() => {
                  soundController.playDiscover();
                  showToast('✦ Ancient Engraved Plate: "ASH" — The keyword for the Keeper’s Riddle ✦');
                }}
              >
                {/* Plate base in burgundy velvet */}
                <rect
                  x="596"
                  y="392"
                  width="72"
                  height="34"
                  rx="5"
                  fill="#1f100a"
                  stroke="#d97706"
                  strokeWidth="2"
                  filter="url(#goldGlow)"
                />
                <rect
                  x="600"
                  y="396"
                  width="64"
                  height="26"
                  rx="3"
                  fill="#2c170c"
                  stroke="#b45309"
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

            {/* 3. HOTSPOT: MOVABLE SKELETAL REMAINS */}
            <g
              transform={`translate(${skeletonOffset.x}, ${skeletonOffset.y})`}
              className="transition-transform duration-300 pointer-events-auto"
            >
              {/* Femur Bone Hotspot (Trigger for shift) */}
              <polygon
                points="536,330 670,360 705,480 620,495 540,380"
                fill={hoveredHotspot === 'femur' ? 'rgba(245,158,11,0.15)' : 'transparent'}
                stroke={hoveredHotspot === 'femur' ? '#f59e0b' : 'transparent'}
                strokeWidth={hoveredHotspot === 'femur' ? 2 : 0}
                className={`pointer-events-auto transition-all ${
                  isBookRead ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                }`}
                onPointerEnter={() => setHoveredHotspot('femur')}
                onPointerLeave={() => setHoveredHotspot(null)}
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

            {/* 4. HOTSPOT: ANTIQUE BRASS SKELETON KEY */}
            <g
              ref={flyingKeyRef}
              className="pointer-events-auto cursor-pointer"
              onClick={handleKeyClick}
              onPointerEnter={() => setHoveredHotspot('key')}
              onPointerLeave={() => setHoveredHotspot(null)}
            >
              <rect
                x="475"
                y="390"
                width="80"
                height="65"
                rx="6"
                fill={hoveredHotspot === 'key' ? 'rgba(245,158,11,0.2)' : 'transparent'}
                stroke={isRiddleSolved && !isChestUnlocked ? '#f59e0b' : hoveredHotspot === 'key' ? '#f59e0b' : 'transparent'}
                strokeWidth={isRiddleSolved && !isChestUnlocked ? 2.5 : hoveredHotspot === 'key' ? 2 : 0}
                strokeDasharray={isRiddleSolved && !isChestUnlocked ? '4 2' : undefined}
                filter={isRiddleSolved && !isChestUnlocked ? 'url(#relicPulse)' : undefined}
                className={isRiddleSolved && !isChestUnlocked ? 'animate-pulse' : ''}
              />
            </g>

            {/* 5. HOTSPOT: ANCIENT ROLLED SCROLL */}
            <polygon
              points="570,390 690,395 710,470 580,470"
              fill={hoveredHotspot === 'scroll' ? 'rgba(245,158,11,0.15)' : 'transparent'}
              stroke={hoveredHotspot === 'scroll' ? '#f59e0b' : 'transparent'}
              strokeWidth={hoveredHotspot === 'scroll' ? 2 : 0}
              className="pointer-events-auto cursor-pointer transition-all"
              onPointerEnter={() => setHoveredHotspot('scroll')}
              onPointerLeave={() => setHoveredHotspot(null)}
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('scroll');
              }}
            />

            {/* 6. HOTSPOT: COMPASS MEDALLION */}
            <circle
              cx="570"
              cy="365"
              r="34"
              fill={hoveredHotspot === 'compass' ? 'rgba(245,158,11,0.15)' : 'transparent'}
              stroke={hoveredHotspot === 'compass' ? '#f59e0b' : 'transparent'}
              strokeWidth={hoveredHotspot === 'compass' ? 2 : 0}
              className="pointer-events-auto cursor-pointer transition-all"
              onPointerEnter={() => setHoveredHotspot('compass')}
              onPointerLeave={() => setHoveredHotspot(null)}
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('compass');
              }}
            />

            {/* 7. HOTSPOT: HANDWRITTEN OCCULT PARCHMENT */}
            <polygon
              points="295,395 450,390 460,490 300,500"
              fill={hoveredHotspot === 'parchment' ? 'rgba(245,158,11,0.15)' : 'transparent'}
              stroke={hoveredHotspot === 'parchment' ? '#f59e0b' : 'transparent'}
              strokeWidth={hoveredHotspot === 'parchment' ? 2 : 0}
              className="pointer-events-auto cursor-pointer transition-all"
              onPointerEnter={() => setHoveredHotspot('parchment')}
              onPointerLeave={() => setHoveredHotspot(null)}
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('parchment');
              }}
            />

            {/* 8. HOTSPOT: ANCIENT SKULL WITH ROMAN "I" */}
            <circle
              cx="650"
              cy="160"
              r="60"
              fill={hoveredHotspot === 'skull' ? 'rgba(245,158,11,0.15)' : 'transparent'}
              stroke={hoveredHotspot === 'skull' ? '#f59e0b' : 'transparent'}
              strokeWidth={hoveredHotspot === 'skull' ? 2 : 0}
              className="pointer-events-auto cursor-pointer transition-all"
              onPointerEnter={() => setHoveredHotspot('skull')}
              onPointerLeave={() => setHoveredHotspot(null)}
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('skull');
              }}
            />

            {/* 9. HOTSPOT: THORACIC RIBCAGE WITH SUN MEDALLION */}
            <polygon
              points="510,190 655,195 660,320 500,315"
              fill={hoveredHotspot === 'ribcage' ? 'rgba(245,158,11,0.15)' : 'transparent'}
              stroke={hoveredHotspot === 'ribcage' ? '#f59e0b' : 'transparent'}
              strokeWidth={hoveredHotspot === 'ribcage' ? 2 : 0}
              className="pointer-events-auto cursor-pointer transition-all"
              onPointerEnter={() => setHoveredHotspot('ribcage')}
              onPointerLeave={() => setHoveredHotspot(null)}
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('ribcage');
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
              {getInvestigationHint()}
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
        onClose={() => setActiveArtifact(null)}
      />
    </div>
  );
};
