import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { CoffinHeaderHUD } from './CoffinHeaderHUD';
import { AncientBookReader } from './AncientBookReader';
import { ArtifactInspectionModal, type ArtifactType } from './ArtifactInspectionModal';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';

// 2560x1440 CANONICAL COORDINATE SPACE (1:1 with object-cover object-center)
export const COFFIN_ORIGINAL_WIDTH = 2560;
export const COFFIN_ORIGINAL_HEIGHT = 1440;
export const COFFIN_VIEWBOX = '0 0 2560 1440';

// Canonical constants to prevent SonarLint S1192 warnings
const ROLE_BUTTON = 'button';
const KEY_ENTER = 'Enter';
const KEY_SPACE = ' ';
const FILL_TRANSPARENT = 'transparent';
const STROKE_NONE = 'none';
const FRAGMENT_BENEATH = 'BENEATH';
const FRAGMENT_THE = 'THE';
const FRAGMENT_EMBER = 'EMBER';
const FRAGMENT_NIGHT = 'NIGHT';
const FRAGMENT_RETURNS = 'RETURNS';
const INSCRIPTION_ASH = 'ASH';
const isActionKey = (e: React.KeyboardEvent): boolean => e.key === KEY_ENTER || e.key === KEY_SPACE;

// HIGH-PRECISION CALIBRATED INVISIBLE HITBOXES (2560x1440 Master Canvas, 0 Overlaps)
export const COFFIN_SVG_PATHS = {
  // 1. The Ancient Book / Grimoire (Solar Emblem)
  ancient_book:
    'M 1075,638 L 1150,650 L 1225,660 L 1300,670 L 1368,678 L 1380,690 L 1375,738 L 1388,762 L 1370,790 L 1340,840 L 1270,905 L 1260,920 L 1188,938 L 1112,928 L 1060,905 L 1012,865 L 1005,838 L 1030,800 L 1055,712 Z',

  // 2. Sealed Envelope (Red Wax Fleur-de-lis)
  envelope:
    'M 765,1108 L 955,1030 L 1140,1088 L 1102,1285 L 910,1300 L 732,1230 Z',

  // 3. Occult Dispatch Parchment Slip
  parchment:
    'M 885,990 L 1062,970 L 1162,995 L 1195,1040 L 1195,1138 L 1145,1095 L 955,1030 L 765,1108 L 780,1055 Z',

  // 4. Skeleton: Cranium with Roman Numeral "I"
  skull:
    'M 1612,220 L 1688,240 L 1738,288 L 1760,350 L 1755,412 L 1712,480 L 1662,538 L 1612,545 L 1550,512 L 1500,450 L 1480,375 L 1505,288 L 1555,238 Z',

  // 5. Skeleton: Thoracic Ribcage with Solar Medallion
  ribcage:
    'M 1362,470 L 1475,465 L 1588,480 L 1638,538 L 1670,612 L 1655,700 L 1588,762 L 1462,770 L 1350,750 L 1280,688 L 1260,600 L 1295,512 Z',

  // 6. Skeleton: Left Arm & Phalanges (Resting beside the book)
  left_arm:
    'M 1238,488 L 1138,538 L 1045,605 L 962,688 L 920,745 L 962,795 L 955,845 L 925,890 L 885,880 L 865,830 L 880,755 L 925,688 L 1012,588 L 1112,512 Z',

  // 7. Skeleton: Movable Right Femur (Concealing the "ASH" plate)
  femur:
    'M 1575,788 L 1662,850 L 1612,925 L 1488,1075 L 1400,1188 L 1388,1300 L 1300,1312 L 1212,1238 L 1250,1162 L 1362,1050 L 1462,900 L 1500,812 Z',

  // 8. Antique Brass Skeleton Key
  skeleton_key:
    'M 1262,988 L 1362,962 L 1400,1000 L 1350,1088 L 1288,1112 L 1245,1050 Z',

  // 9. Rolled Ancient Papyrus Scroll (Triquetra symbol)
  scroll:
    'M 1612,888 L 1700,950 L 1650,1088 L 1550,1162 L 1485,1112 L 1495,1038 L 1545,962 L 1585,900 Z',

  // 10. Engraved Antique Compass Medallion
  compass:
    'M 1375,862 L 1462,862 L 1500,925 L 1462,988 L 1375,988 L 1338,925 Z',
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
  // Gameplay State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactType | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  // Investigation Milestones
  const [isBookRead, setIsBookRead] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1BookRead);
  });

  const [isSkeletonMoved, setIsSkeletonMoved] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave1SkeletonMoved);
  });
  const [skeletonOffset, setSkeletonOffset] = useState<{ x: number; y: number }>(() =>
    round1Service.getTeamSession(teamId, '').stage3State?.grave1SkeletonMoved
      ? { x: 180, y: -90 }
      : { x: 0, y: 0 }
  );

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
    return collectedFragments.includes(FRAGMENT_BENEATH);
  });

  const [isKeyFlying, setIsKeyFlying] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Authoritative unique completed grave count (strictly 0..3)
  const uniqueCount = Math.min(
    3,
    (collectedFragments.includes(FRAGMENT_BENEATH) || collectedFragments.includes(FRAGMENT_THE) || isChestOpen || isChestUnlocked ? 1 : 0) +
      (collectedFragments.includes(FRAGMENT_EMBER) || collectedFragments.includes(FRAGMENT_NIGHT) ? 1 : 0) +
      (collectedFragments.includes(FRAGMENT_RETURNS) ? 1 : 0)
  );

  // Refs
  const flyingKeyRef = useRef<SVGGElement | null>(null);
  const answerInputRef = useRef<HTMLInputElement | null>(null);

  // Dragging interaction state for skeletal remains
  const [isDraggingSkeleton, setIsDraggingSkeleton] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Auto-dismiss toast
  const toastTimeoutRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastNotice(msg);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastNotice(null);
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // 1. Ancient Book
  const handleOpenBook = useCallback(() => {
    soundController.playClick();
    setIsBookModalOpen(true);
  }, []);

  const handleCloseBook = useCallback(() => {
    setIsBookModalOpen(false);
  }, []);

  const handleBookFullyRead = useCallback(() => {
    if (!isBookRead) {
      setIsBookRead(true);
      round1Service.markGrave1BookRead(teamId);
      soundController.playDiscover();
      showToast('✦ Grimoire deciphered! The skeletal remains may now be shifted. ✦');
    }
  }, [isBookRead, teamId, showToast]);

  // 2. Letter / Parchment
  const handleInspectLetter = useCallback(() => {
    soundController.playClick();
    setActiveArtifact('parchment');
  }, []);

  const handleCloseArtifactModal = useCallback(() => {
    setActiveArtifact(null);
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
    const clampedX = Math.max(-50, Math.min(160, dragStartRef.current.origX + dx * 1.5));
    const clampedY = Math.max(-100, Math.min(75, dragStartRef.current.origY + dy * 1.5));
    setSkeletonOffset({ x: clampedX, y: clampedY });

    if (!isSkeletonMoved && (Math.abs(clampedX) > 40 || Math.abs(clampedY) > 25)) {
      setIsSkeletonMoved(true);
      round1Service.shiftGrave1Skeleton(teamId);
      soundController.playDiscover();
      showToast(`✦ Remains shifted! Hidden inscription uncovered: "${INSCRIPTION_ASH}" ✦`);
    }
  };

  const handleSkeletonPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingSkeleton) return;
    setIsDraggingSkeleton(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (isSkeletonMoved || Math.abs(skeletonOffset.x) > 30 || Math.abs(skeletonOffset.y) > 20) {
      setIsSkeletonMoved(true);
      round1Service.shiftGrave1Skeleton(teamId);
      setSkeletonOffset({ x: 180, y: -90 });
    } else {
      setSkeletonOffset({ x: 0, y: 0 });
    }
    dragStartRef.current = null;
  };

  const handleFemurClick = () => {
    if (!isBookRead) {
      soundController.playClick();
      showToast('You must decipher the Ancient Book first.');
    } else if (!isSkeletonMoved) {
      setIsSkeletonMoved(true);
      round1Service.shiftGrave1Skeleton(teamId);
      setSkeletonOffset({ x: 180, y: -90 });
      soundController.playDiscover();
      showToast(`✦ Remains shifted! Hidden inscription uncovered: "${INSCRIPTION_ASH}" ✦`);
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
      showToast(`✦ Correct! The Keeper accepts "${INSCRIPTION_ASH}". The Skeleton Key awakens! ✦`);
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
    if (isChestUnlocked || isKeyFlying) {
      if (isChestUnlocked && !isChestOpen) {
        handleOpenChest();
      }
      return;
    }

    soundController.playChestUnlock();
    setIsChestUnlocked(true);
    round1Service.unlockGrave1Chest(teamId);
    showToast('✦ Padlock unlocked! The ancient chest is ready to open. ✦');

    if (flyingKeyRef.current) {
      setIsKeyFlying(true);
      gsap.to(flyingKeyRef.current, {
        x: -700,
        y: 100,
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
    if (!isChestUnlocked && !isRiddleSolved) return;
    soundController.playSecretFound();
    setIsChestUnlocked(true);
    setIsChestOpen(true);
    round1Service.unlockGrave1Chest(teamId);
    onFragmentUnlocked(FRAGMENT_BENEATH);
    setIsRewardModalOpen(true);
    showToast(`✦ Sacred Syllable Unsealed: "${FRAGMENT_BENEATH}" • Coffin I Completed! ✦`);
  };

  return (
    <div
      role="region"
      aria-label="Grave 1 — The Marked Remains"
      className="relative w-full h-screen h-[100dvh] flex flex-col justify-between overflow-hidden bg-black select-none text-stone-100 font-sans"
      onPointerMove={handleSkeletonPointerMove}
      onPointerUp={handleSkeletonPointerUp}
    >
      {/* Semantic Accessibility Fallback */}
      <div className="sr-only">
        <h1>Grave 1 — The Bone Chamber</h1>
        <h2>The Marked Remains</h2>
        <p>THE KEEPER’S LAST RIDDLE</p>
      </div>

      {/* 1. Atmospheric Ambient Creatures */}
      <FlyingBat startYPercent={5} durationSeconds={19} delaySeconds={1} scale={0.6} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={9} durationSeconds={24} delaySeconds={4} scale={0.65} flightDirection="left-to-right" />

      {/* 2. Fullscreen Master Coffin Environment (Zero Black Side Gutters, Full Viewport Width & Height) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
        <img
          src="/assets/round-01/stage-03/coffin-01-marked-remains-master.png"
          alt="Coffin I: The Marked Remains - Fullscreen Buried Coffin Environment"
          className="w-full h-full object-cover object-center pointer-events-none select-none"
        />
      </div>

      {/* 3. Canonical Calibrated Invisible SVG Interaction Geometry Layer (1:1 with object-cover object-center) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden">
        <svg
          viewBox={COFFIN_VIEWBOX}
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full pointer-events-auto select-none"
          aria-label="Burial chamber interactive objects"
        >
          {/* OBJECT 1: ANCIENT BOOK / GRIMOIRE (Opens AncientBookReader) */}
          <path
            d={COFFIN_SVG_PATHS.ancient_book}
            fill={FILL_TRANSPARENT}
            stroke={STROKE_NONE}
            role={ROLE_BUTTON}
            tabIndex={0}
            aria-label="Ancient Grimoire: Click to Open and Read • Inspect Ancient Grimoire"
            className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
            onClick={handleOpenBook}
            onKeyDown={(e) => {
              if (isActionKey(e)) {
                e.preventDefault();
                handleOpenBook();
              }
            }}
          />

          {/* OBJECT 2: ANCIENT SEALED LETTER (Opens ArtifactInspectionModal) */}
          <path
            d={COFFIN_SVG_PATHS.envelope}
            fill={FILL_TRANSPARENT}
            stroke={STROKE_NONE}
            role={ROLE_BUTTON}
            tabIndex={0}
            aria-label="Inspect Sealed Letter"
            className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
            onClick={handleInspectLetter}
            onKeyDown={(e) => {
              if (isActionKey(e)) {
                e.preventDefault();
                handleInspectLetter();
              }
            }}
          />

          {/* OBJECT 3: OCCULT DISPATCH PARCHMENT */}
          <path
            d={COFFIN_SVG_PATHS.parchment}
            fill={FILL_TRANSPARENT}
            stroke={STROKE_NONE}
            role={ROLE_BUTTON}
            tabIndex={0}
            aria-label="Inspect Occult Dispatch Parchment"
            className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
            onClick={handleInspectLetter}
            onKeyDown={(e) => {
              if (isActionKey(e)) {
                e.preventDefault();
                handleInspectLetter();
              }
            }}
          />

          {/* OBJECT 5: MOVABLE SKELETAL REMAINS GROUP */}
          <g
            transform={`translate(${skeletonOffset.x}, ${skeletonOffset.y})`}
            className="transition-transform duration-300 pointer-events-auto"
          >
            {/* 5A. SKULL WITH ROMAN "I" */}
            <path
              d={COFFIN_SVG_PATHS.skull}
              fill={FILL_TRANSPARENT}
              stroke={STROKE_NONE}
              role={ROLE_BUTTON}
              tabIndex={0}
              aria-label="Inspect Cranium of the First Warden marked I"
              className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('skull');
              }}
              onKeyDown={(e) => {
                if (isActionKey(e)) {
                  e.preventDefault();
                  soundController.playClick();
                  setActiveArtifact('skull');
                }
              }}
            />

            {/* 5B. THORACIC RIBCAGE WITH MEDALLION */}
            <path
              d={COFFIN_SVG_PATHS.ribcage}
              fill={FILL_TRANSPARENT}
              stroke={STROKE_NONE}
              role={ROLE_BUTTON}
              tabIndex={0}
              aria-label="Inspect Thoracic Ribcage"
              className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
              onClick={() => {
                soundController.playClick();
                setActiveArtifact('ribcage');
              }}
              onKeyDown={(e) => {
                if (isActionKey(e)) {
                  e.preventDefault();
                  soundController.playClick();
                  setActiveArtifact('ribcage');
                }
              }}
            />

            {/* 5C. LEFT ARM & PHALANGES */}
            <path
              d={COFFIN_SVG_PATHS.left_arm}
              fill={FILL_TRANSPARENT}
              stroke={STROKE_NONE}
              role={ROLE_BUTTON}
              tabIndex={0}
              aria-label="Inspect Skeletal Left Arm"
              className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
              onClick={() => {
                soundController.playClick();
                showToast('The skeletal hand rests beside the ancient grimoire.');
              }}
              onKeyDown={(e) => {
                if (isActionKey(e)) {
                  e.preventDefault();
                  soundController.playClick();
                  showToast('The skeletal hand rests beside the ancient grimoire.');
                }
              }}
            />

            {/* 5D. CRIMSON-BOUND FEMUR (Movable bone concealing "ASH") */}
            <path
              d={COFFIN_SVG_PATHS.femur}
              fill={FILL_TRANSPARENT}
              stroke={STROKE_NONE}
              role={ROLE_BUTTON}
              tabIndex={0}
              aria-label="Movable Femur: Click or Drag to Shift Remains"
              className={`outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none transition-all ${
                isBookRead ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
              }`}
              onPointerDown={handleSkeletonPointerDown}
              onClick={handleFemurClick}
              onKeyDown={(e) => {
                if (isActionKey(e)) {
                  e.preventDefault();
                  handleFemurClick();
                }
              }}
            />
          </g>

          {/* OBJECT 4: REVEALED BRASS INSCRIPTION PLATE "ASH" (Rendered on top when shifted) */}
          {isSkeletonMoved && (
            <g
              role={ROLE_BUTTON}
              tabIndex={0}
              aria-label="Inspect Revealed Inscription: ASH"
              className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none transition-all duration-300"
              onClick={() => {
                soundController.playDiscover();
                showToast(`✦ Ancient Engraved Plate: "${INSCRIPTION_ASH}" — The keyword for the Keeper’s Riddle ✦`);
              }}
              onKeyDown={(e) => {
                if (isActionKey(e)) {
                  e.preventDefault();
                  soundController.playDiscover();
                  showToast(`✦ Ancient Engraved Plate: "${INSCRIPTION_ASH}" — The keyword for the Keeper’s Riddle ✦`);
                }
              }}
            >
              <rect
                x="1350"
                y="1025"
                width="140"
                height="80"
                rx="12"
                fill="#1f100a"
                stroke="#b45309"
                strokeWidth="3"
                filter="drop-shadow(0 0 10px rgba(245,158,11,0.5))"
              />
              <rect
                x="1358"
                y="1033"
                width="124"
                height="64"
                rx="8"
                fill="#2c170c"
                stroke="#78350f"
                strokeWidth="2"
              />
              <text
                x="1420"
                y="1076"
                textAnchor="middle"
                fill="#fef08a"
                fontFamily="Cinzel, serif"
                fontSize="30"
                fontWeight="900"
                letterSpacing="6"
                filter="drop-shadow(0 0 8px #eab308)"
              >
                ASH
              </text>
            </g>
          )}

          {/* OBJECT 6: ANTIQUE BRASS SKELETON KEY */}
          <g
            ref={flyingKeyRef}
            role={ROLE_BUTTON}
            tabIndex={0}
            aria-label="Antique Brass Skeleton Key"
            className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
            onClick={handleKeyClick}
            onKeyDown={(e) => {
              if (isActionKey(e)) {
                e.preventDefault();
                handleKeyClick();
              }
            }}
          >
            <path
              d={COFFIN_SVG_PATHS.skeleton_key}
              fill={FILL_TRANSPARENT}
              stroke={STROKE_NONE}
            />
          </g>

          {/* OBJECT 7: ROLLED ANCIENT PAPYRUS SCROLL */}
          <path
            d={COFFIN_SVG_PATHS.scroll}
            fill={FILL_TRANSPARENT}
            stroke={STROKE_NONE}
            role={ROLE_BUTTON}
            tabIndex={0}
            aria-label="Inspect Rolled Ancient Scroll"
            className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
            onClick={() => {
              soundController.playClick();
              setActiveArtifact('scroll');
            }}
            onKeyDown={(e) => {
              if (isActionKey(e)) {
                e.preventDefault();
                soundController.playClick();
                setActiveArtifact('scroll');
              }
            }}
          />

          {/* OBJECT 8: ENGRAVED COMPASS MEDALLION */}
          <path
            d={COFFIN_SVG_PATHS.compass}
            fill={FILL_TRANSPARENT}
            stroke={STROKE_NONE}
            role={ROLE_BUTTON}
            tabIndex={0}
            aria-label="Inspect Engraved Compass Medallion"
            className="cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none focus-visible:outline-none"
            onClick={() => {
              soundController.playClick();
              setActiveArtifact('compass');
            }}
            onKeyDown={(e) => {
              if (isActionKey(e)) {
                e.preventDefault();
                soundController.playClick();
                setActiveArtifact('compass');
              }
            }}
          />
        </svg>
      </div>

      {/* 4. Top Header HUD (Single source of truth) */}
      <CoffinHeaderHUD
        graveNumber="GRAVE I"
        title="THE MARKED REMAINS"
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

      {/* 5. Center Spacer: keeps scene open and coffin visible */}
      <div className="flex-1 min-h-0 pointer-events-none" />

      {/* 6. Single Master Riddle & Keyword Submission Console */}
      <section className="relative z-30 w-full max-w-4xl mx-auto px-3 sm:px-6 pb-2 pt-0 select-none">
        <div className="w-full rounded-2xl bg-gradient-to-r from-black/95 via-[#180a04]/95 to-black/95 border-2 border-amber-700/70 p-3 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Riddle Section (Left) */}
          <div className="flex-1 text-center md:text-left px-1 sm:px-2">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="text-amber-500 text-xs">✦</span>
              <h3 className="font-cinzel text-xs font-black tracking-widest text-amber-300 uppercase">
                THE KEEPER&apos;S LAST RIDDLE
              </h3>
              <span className="text-amber-500 text-xs">✦</span>
            </div>
            <p className="font-serif italic text-xs sm:text-[13px] text-stone-300 leading-relaxed max-w-xl">
              &ldquo;Born when flame is spent, pale when all light has fled; I am the last trace of fire, yet I hold no heat. What am I?&rdquo;
            </p>
            <div className="text-[10px] font-mono text-amber-500/80 mt-1">
              {isChestOpen
                ? '✓ Relic chest unsealed • Fragment "BENEATH" added to Evidence Journal'
                : isChestUnlocked
                ? '✦ Chest unlocked! Click below to claim the sacred fragment'
                : isRiddleSolved
                ? '✓ RIDDLE SOLVED • Click the skeleton key or the button below'
                : isSkeletonMoved
                ? '✦ Skeletal remains shifted! A hidden inscription has been revealed'
                : isBookRead
                ? '✦ Ancient grimoire deciphered. Shift the skeletal remains to inspect the grave floor'
                : '📖 Read the Ancient Grimoire to begin deciphering the sepulcher'}
            </div>
          </div>

          {/* Right: Riddle Input & Action Button */}
          <div className="flex flex-col items-center sm:items-end gap-2 flex-shrink-0">
            {!isRiddleSolved ? (
              <form onSubmit={handleSubmitRiddle} className="relative flex items-center gap-2">
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
                  className="w-36 sm:w-48 px-3.5 py-2 rounded-xl bg-black/90 border border-amber-600/70 text-amber-100 placeholder-amber-700/60 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-amber-400 text-stone-950 font-cinzel text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer whitespace-nowrap"
                >
                  SUBMIT
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center sm:items-end gap-1.5">
                <button
                  type={ROLE_BUTTON}
                  aria-label={
                    isChestOpen
                      ? 'FRAGMENT UNSEALED: "BENEATH"'
                      : isChestUnlocked
                      ? 'OPEN ANCIENT CHEST • Open unlocked treasure chest'
                      : 'USE SKELETON KEY'
                  }
                  onClick={isChestOpen ? () => setIsRewardModalOpen(true) : isChestUnlocked ? handleOpenChest : handleKeyClick}
                  className={`py-2 px-5 rounded-xl border-2 font-cinzel text-xs font-black uppercase tracking-widest shadow-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    isChestOpen
                      ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                      : isChestUnlocked
                      ? 'bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-500 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse'
                      : 'bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-600 border-amber-500 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  }`}
                >
                  <span>{isChestOpen ? '✓' : isChestUnlocked ? '🔓' : '🗝️'}</span>
                  <span>
                    {isChestOpen
                      ? 'FRAGMENT UNSEALED: "BENEATH"'
                      : isChestUnlocked
                      ? 'OPEN ANCIENT CHEST'
                      : 'USE SKELETON KEY'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. Bottom Navigation Controls: Evidence Journal & Return to Cemetery */}
      <footer className="relative z-30 px-3 sm:px-6 pb-2.5 pt-1 flex items-center justify-between select-none">
        {/* Evidence Journal Progress */}
        <button
          type={ROLE_BUTTON}
          onClick={() => {
            soundController.playClick();
            onOpenJournal();
          }}
          aria-label={`Evidence Journal (${uniqueCount}/3)`}
          className="px-4 py-2 rounded-2xl bg-black/85 hover:bg-amber-950/80 border border-amber-600/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 outline-none focus:outline-none focus:ring-0"
        >
          <span>📖</span>
          <span>EVIDENCE JOURNAL ({uniqueCount}/3)</span>
        </button>

        {/* Return to Cemetery */}
        <button
          type={ROLE_BUTTON}
          onClick={() => {
            soundController.playClick();
            onReturnCemetery();
          }}
          aria-label="Return to Cemetery"
          className="px-4 py-2 rounded-2xl bg-black/85 hover:bg-stone-900 border border-stone-700 hover:border-amber-500/70 text-stone-300 hover:text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 outline-none focus:outline-none focus:ring-0"
        >
          <span>← RETURN TO CEMETERY</span>
        </button>
      </footer>

      {/* ========================================================
          MODAL 1: ANCIENT BOOK READER MODAL
         ======================================================== */}
      <AncientBookReader
        isOpen={isBookModalOpen}
        onClose={handleCloseBook}
        onAllPagesRead={handleBookFullyRead}
      />

      {/* ========================================================
          MODAL 2: ARTIFACT CLOSE-UP INSPECTION MODAL
         ======================================================== */}
      <ArtifactInspectionModal
        isOpen={Boolean(activeArtifact)}
        artifactType={activeArtifact}
        onClose={handleCloseArtifactModal}
      />

      {/* ========================================================
          MODAL 3: SECRET FRAGMENT UNSEALED REWARD MODAL (BENEATH)
         ======================================================== */}
      {isRewardModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="grave1-reward-title"
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
                  ✦ SACRED SEPULCHER UNSEALED ✦
                </div>
                <h3
                  id="grave1-reward-title"
                  className="text-lg sm:text-xl font-cinzel font-black text-amber-100 tracking-wide"
                >
                  The Marked Remains
                </h3>
              </div>
              <button
                type={ROLE_BUTTON}
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
                ✦ CEMETERY INCANTATION: FIRST FRAGMENT ✦
              </span>

              {/* Glowing Syllable */}
              <div className="text-3xl sm:text-4xl font-cinzel font-black text-amber-300 tracking-[0.25em] drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] my-2">
                B — E — N — E — A — T — H
              </div>

              {/* 3-Part Cipher Structure */}
              <div className="my-2 p-2.5 rounded-xl bg-black/80 border border-amber-800/60 text-[11px] font-cinzel font-bold text-stone-300">
                <span className="text-amber-400">[Grave I: BENEATH]</span> &bull;{' '}
                <span className="text-stone-500">[Grave II: ???]</span> &bull;{' '}
                <span className="text-stone-500">[Grave III: ???]</span>
              </div>

              <p className="mt-3 font-serif italic text-xs sm:text-sm text-stone-300 leading-relaxed max-w-sm">
                &ldquo;The ancient padlock yields with a dull metallic click. Inside the coffer, illuminated by the cold
                moonlight, lies the first fragment of the warden&rsquo;s covenant. The syllable &lsquo;BENEATH&rsquo; has
                been permanently recorded into your Evidence Journal.&rdquo;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-3">
              <button
                type={ROLE_BUTTON}
                onClick={() => {
                  setIsRewardModalOpen(false);
                  onOpenJournal();
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-black/80 hover:bg-amber-950 border border-amber-600/80 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                📖 View Evidence Journal ({uniqueCount}/3)
              </button>
              <button
                type={ROLE_BUTTON}
                onClick={() => {
                  setIsRewardModalOpen(false);
                  onReturnCemetery();
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border border-amber-400 text-stone-950 font-cinzel text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-lg"
              >
                ← Return to Cemetery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
