import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { soundController } from '../../../utils/soundController';

interface TreasureChestRelicProps {
  isEmerged: boolean;
  isUnlocked: boolean;
  isOpen: boolean;
  revealedWord: string;
  onOpenChest: () => void;
}

export const TreasureChestRelic: React.FC<TreasureChestRelicProps> = ({
  isEmerged,
  isUnlocked,
  isOpen,
  revealedWord,
  onOpenChest,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parchmentRef = useRef<HTMLDivElement | null>(null);

  // Emergence GSAP animation
  useEffect(() => {
    if (!isEmerged || !containerRef.current) return;
    const el = containerRef.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 60, opacity: 0, scale: 0.85 },
        { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'back.out(1.4)' }
      );
    });
    return () => ctx.revert();
  }, [isEmerged]);

  // Open Parchment Rise GSAP animation
  useEffect(() => {
    if (!isOpen || !parchmentRef.current) return;
    const el = parchmentRef.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 30, opacity: 0, scale: 0.8 },
        { y: -10, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: 'power2.out' }
      );
    });
    return () => ctx.revert();
  }, [isOpen]);

  if (!isEmerged) return null;

  const handleClick = () => {
    if (isUnlocked && !isOpen) {
      soundController.playVictory();
      onOpenChest();
    } else if (!isUnlocked) {
      soundController.playClick();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-black/60 border border-amber-600/70 shadow-[0_0_35px_rgba(245,158,11,0.35)] backdrop-blur-sm select-none"
    >
      {/* Status Instruction Badge */}
      <div className="mb-2">
        {!isUnlocked && (
          <span className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500 text-amber-300 font-cinzel text-[10px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse">
            🔒 LOCKED • CLICK SKELETON KEY
          </span>
        )}
        {isUnlocked && !isOpen && (
          <span className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-cinzel text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-bounce cursor-pointer">
            ✨ UNLOCKED • CLICK TO OPEN CHEST
          </span>
        )}
        {isOpen && (
          <span className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 text-amber-200 font-cinzel text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            ✦ SECRET FRAGMENT UNSEALED ✦
          </span>
        )}
      </div>

      {/* Interactive Chest Graphic */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isOpen}
        aria-label={isOpen ? 'Opened treasure chest' : isUnlocked ? 'Open unlocked treasure chest' : 'Locked treasure chest'}
        className={`relative group focus:outline-none transition-transform duration-300 ${
          isUnlocked && !isOpen ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
        }`}
      >
        <svg
          viewBox="0 0 200 150"
          className="w-44 h-32 sm:w-52 sm:h-36 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Shadow */}
          <ellipse cx="100" cy="140" rx="80" ry="10" fill="rgba(0,0,0,0.6)" filter="blur(4px)" />

          {isOpen ? (
            <>
              {/* OPEN CHEST STATE */}
              {/* Brilliant Golden Beam from inside */}
              <defs>
                <radialGradient id="chestGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="woodGradOpen" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#451a03" />
                  <stop offset="50%" stopColor="#290e02" />
                  <stop offset="100%" stopColor="#140501" />
                </linearGradient>
              </defs>

              {/* Radiant Light Burst */}
              <circle cx="100" cy="70" r="60" fill="url(#chestGlowGrad)" filter="blur(8px)" />

              {/* Open Chest Body */}
              <rect x="25" y="70" width="150" height="65" rx="6" fill="url(#woodGradOpen)" stroke="#b45309" strokeWidth="2.5" />
              {/* Inner Glowing Vault */}
              <rect x="35" y="75" width="130" height="50" rx="4" fill="#fbbf24" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />

              {/* Iron Corner Brackets */}
              <path d="M25 75 L45 75 L45 80 L30 80 L30 100 L25 100 Z" fill="#d97706" />
              <path d="M175 75 L155 75 L155 80 L170 80 L170 100 L175 100 Z" fill="#d97706" />
              <path d="M25 130 L45 130 L45 125 L30 125 L30 115 L25 115 Z" fill="#d97706" />
              <path d="M175 130 L155 130 L155 125 L170 125 L170 115 L175 115 Z" fill="#d97706" />

              {/* Lion Side Handles */}
              <circle cx="20" cy="95" r="7" stroke="#d97706" strokeWidth="2.5" fill="none" />
              <circle cx="180" cy="95" r="7" stroke="#d97706" strokeWidth="2.5" fill="none" />

              {/* Tilted Open Lid */}
              <path d="M20 70 L40 25 L160 25 L180 70 Z" fill="url(#woodGradOpen)" stroke="#d97706" strokeWidth="2.5" />
              <path d="M40 25 L100 15 L160 25 Z" fill="#78350f" stroke="#b45309" strokeWidth="1.5" />
              {/* Gold Filigree on Lid */}
              <circle cx="100" cy="45" r="14" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
            </>
          ) : (
            <>
              {/* CLOSED CHEST STATE */}
              <defs>
                <linearGradient id="woodGradClosed" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#451a03" />
                  <stop offset="60%" stopColor="#270e02" />
                  <stop offset="100%" stopColor="#140602" />
                </linearGradient>
              </defs>

              {/* Lower Box Body */}
              <rect x="25" y="65" width="150" height="70" rx="6" fill="url(#woodGradClosed)" stroke="#b45309" strokeWidth="2.5" />

              {/* Curved Domed Lid */}
              <path d="M22 65 C22 35 55 25 100 25 C145 25 178 35 178 65 Z" fill="url(#woodGradClosed)" stroke="#b45309" strokeWidth="2.5" />

              {/* Heavy Bronze Straps with Rivets */}
              <rect x="55" y="25" width="14" height="110" rx="2" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
              <circle cx="62" cy="40" r="2" fill="#fef08a" />
              <circle cx="62" cy="80" r="2" fill="#fef08a" />
              <circle cx="62" cy="120" r="2" fill="#fef08a" />

              <rect x="131" y="25" width="14" height="110" rx="2" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
              <circle cx="138" cy="40" r="2" fill="#fef08a" />
              <circle cx="138" cy="80" r="2" fill="#fef08a" />
              <circle cx="138" cy="120" r="2" fill="#fef08a" />

              {/* Lion Side Handles */}
              <circle cx="20" cy="95" r="7" stroke="#d97706" strokeWidth="2.5" fill="none" />
              <circle cx="180" cy="95" r="7" stroke="#d97706" strokeWidth="2.5" fill="none" />

              {/* Golden Padlock Hasps & Keyhole */}
              <rect x="88" y="58" width="24" height="32" rx="4" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
              {isUnlocked ? (
                // Unlocked Open Shackle
                <path d="M93 58 L93 42 C93 36 107 36 107 42" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
              ) : (
                // Locked Shackle
                <path d="M94 58 L94 45 C94 40 106 40 106 45 L106 58" stroke="#d97706" strokeWidth="3" fill="none" />
              )}
              {/* Keyhole */}
              <circle cx="100" cy="72" r="3" fill="#1c0b04" />
              <polygon points="98,72 102,72 103,82 97,82" fill="#1c0b04" />
            </>
          )}
        </svg>
      </button>

      {/* UNSEALED PARCHMENT: Rises from open chest */}
      {isOpen && (
        <div
          ref={parchmentRef}
          className="relative mt-2 p-3 sm:p-4 rounded-xl bg-[#f5ebd7] text-stone-950 border-2 border-[#b45309] shadow-[0_0_25px_rgba(251,191,36,0.8)] text-center max-w-xs animate-fadeIn"
        >
          <div className="text-[9px] font-cinzel font-bold text-[#8b1c1c] tracking-widest uppercase">
            SACRED RECOVERY • STAGE 03 FRAGMENT I
          </div>
          <div className="font-cinzel text-xl sm:text-2xl font-black text-[#1c0a03] my-1 tracking-[0.2em] drop-shadow-[0_1px_2px_rgba(245,158,11,0.6)]">
            ✦ {revealedWord} ✦
          </div>
          <p className="text-[10px] font-serif italic text-stone-700">
            &ldquo;The first word of the arch-cipher is etched into your journal: {revealedWord}.&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};

