import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';

interface LetterRevealDialogProps {
  state: Round4IntroState;
  onBeginHunt: () => void;
  isMuted: boolean;
  reducedMotion?: boolean;
}

export const LetterRevealDialog: React.FC<LetterRevealDialogProps> = ({
  state,
  onBeginHunt,
  isMuted,
  reducedMotion = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const sealGleamRef = useRef<HTMLDivElement>(null);

  const isOpening = state === 'LETTER_OPENING';
  const isRevealed = state === 'LETTER_REVEALED' || state === 'LETTER_OPENED';
  const isTransitioning =
    state === 'HUNT_REQUESTED' ||
    state === 'OUTGOING_BLUR' ||
    state === 'INCOMING_COLLEGE_REVEAL' ||
    state === 'COLLEGE_REVEAL' ||
    state === 'COLLEGE_READY' ||
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING' ||
    state === 'WHITE_TUNNEL';

  // Preload college exterior image as soon as dialog mounts to guarantee zero freeze upon portal entry
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/round4_radiant.jpg';
  }, []);

  // GSAP Physical Scroll Unroll Animation
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    if (reducedMotion) {
      // Immediate full visibility for users preferring reduced motion
      if (scrollBodyRef.current) scrollBodyRef.current.style.clipPath = 'none';
      if (headingRef.current) headingRef.current.style.opacity = '1';
      if (storyRef.current) storyRef.current.style.opacity = '1';
      if (buttonRef.current) {
        buttonRef.current.style.opacity = '1';
        buttonRef.current.style.transform = 'scale(1)';
      }
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Initial state: paper rolled tightly at the top roll
      gsap.set(scrollBodyRef.current, {
        clipPath: 'inset(0% 0% 86% 0%)',
        transformOrigin: 'top center',
      });
      gsap.set([headingRef.current, storyRef.current, buttonRef.current], {
        opacity: 0,
        y: 14,
      });
      gsap.set(buttonRef.current, {
        scale: 0.92,
      });

      // 1. Unroll the paper downwards from top cylindrical roll
      tl.to(scrollBodyRef.current, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.15,
        ease: 'power2.inOut',
      })
        // 2. Heading and sunburst crest reveal as paper body reaches title level
        .to(
          headingRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
          },
          '-=0.82'
        )
        // 3. Storyline narrative paragraphs reveal progressively downwards
        .to(
          storyRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
          },
          '-=0.52'
        )
        // 4. Ornate royal action button springs into view last
        .to(
          buttonRef.current,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.4)',
          },
          '-=0.25'
        );

      // Subtle atmospheric continuous breathing on the wax seal compass medallion
      if (sealGleamRef.current) {
        gsap.to(sealGleamRef.current, {
          rotation: 360,
          duration: 48,
          repeat: -1,
          ease: 'none',
        });
      }
    }, scrollContainerRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Cinematic Portal Transition effect when Begin the Hunt is initiated
  useEffect(() => {
    if (isTransitioning && scrollContainerRef.current && !reducedMotion) {
      gsap.to(scrollContainerRef.current, {
        scale: 1.05,
        filter: 'brightness(1.3) blur(6px)',
        opacity: 0,
        duration: 1.2,
        ease: 'power2.inOut',
      });
    }
  }, [isTransitioning, reducedMotion]);

  if (!isOpening && !isRevealed && !isTransitioning) {
    return null;
  }

  const handleBeginHuntClick = () => {
    if (isSubmitting || isTransitioning) return;
    setIsSubmitting(true);

    if (!isMuted) {
      soundController.playClick();
      soundController.playPortalWhoosh();
    }

    onBeginHunt();
  };

  return (
    <dialog
      open
      aria-labelledby="letter-heading"
      className="fixed inset-0 z-40 bg-transparent p-0 m-0 border-none max-w-none max-h-none w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none"
    >
      {/* 1. Deep Warm Charcoal Backdrop Vignette with Subtle Candlelight Radiance */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-700 pointer-events-none ${
          isOpening ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,190,80,0.14)_0%,transparent_60%)]" />
        {/* Subtle floating ambient golden dust embers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-[20%] left-[18%] w-1.5 h-1.5 rounded-full bg-amber-400/50 blur-[0.5px] animate-pulse [animation-duration:3s]" />
          <div className="absolute top-[35%] right-[22%] w-2 h-2 rounded-full bg-yellow-300/40 blur-[1px] animate-pulse [animation-duration:4.5s] [animation-delay:1s]" />
          <div className="absolute bottom-[25%] left-[28%] w-1.5 h-1.5 rounded-full bg-amber-300/60 blur-[0.5px] animate-pulse [animation-duration:3.2s] [animation-delay:1.8s]" />
          <div className="absolute bottom-[30%] right-[32%] w-2 h-2 rounded-full bg-amber-500/40 blur-[1px] animate-pulse [animation-duration:4s] [animation-delay:0.5s]" />
        </div>
      </div>

      {/* 2. Master Ancient Relic Parchment Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="relative transition-all duration-700 ease-out flex items-center justify-center drop-shadow-[0_25px_60px_rgba(0,0,0,0.92)] drop-shadow-[0_10px_25px_rgba(25,12,4,0.7)]"
        style={{
          width: 'min(600px, calc(86vh * 896 / 1200), 92vw)',
          aspectRatio: '896 / 1200',
          maxHeight: '92vh',
        }}
      >
        {/* Parchment Base Texture Layer (Clean Ancient Relic Scroll) */}
        <div
          ref={scrollBodyRef}
          className="relative w-full h-full"
          style={{
            backgroundImage: "url('/assets/round-4/ancient_parchment_clean.png?v=3')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          {/* Central Compass Medallion Seal (Centered on the Top Roll) */}
          <div
            ref={sealGleamRef}
            className="absolute top-[10.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-b from-[#d9aa52] via-[#a3792c] to-[#5a3e14] p-[1.5px] shadow-[0_3px_10px_rgba(0,0,0,0.65),0_1px_3px_rgba(25,12,4,0.8)] flex items-center justify-center pointer-events-none z-10"
            aria-hidden="true"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#2a170b] via-[#1c0f06] to-[#0e0703] flex items-center justify-center border border-[#e6be6a]/50">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-[#ecc273] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 3" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <polygon points="50,14 55,45 86,50 55,55 50,86 45,55 14,50 45,45" fill="currentColor" opacity="0.92" />
                <polygon points="50,22 53,47 78,50 53,53 50,78 47,53 22,50 47,47" fill="#fff2d0" opacity="0.6" />
                <circle cx="50" cy="50" r="5" fill="#fff7e0" />
              </svg>
            </div>
          </div>

          {/* Printable Scroll Content - Natural coherent document layout with balanced vertical rhythm */}
          <div
            className="absolute inset-x-[11%] sm:inset-x-[12%] top-[23.5%] bottom-[15%] flex flex-col items-center justify-between text-center select-none"
            style={{ containerType: 'inline-size' }}
          >
            
            {/* Header Section: Title, Ornate Sunburst Emblem, and Subtitle */}
            <div ref={headingRef} className="w-full flex flex-col items-center flex-shrink-0">
              
              {/* Main Heading: THE DAWN AWAKENS */}
              <h2
                id="letter-heading"
                className="font-cinzel text-[clamp(17.5px,4.5cqw,27px)] font-black tracking-[0.14em] text-[#38200F] drop-shadow-[0_1px_1px_rgba(255,248,230,0.9)] uppercase leading-tight whitespace-nowrap"
              >
                THE DAWN AWAKENS
              </h2>

              {/* Radiant Sunburst Emblem Divider */}
              <div className="flex items-center justify-center my-1.5 sm:my-2" aria-hidden="true">
                <svg className="w-[180px] sm:w-[220px] md:w-[240px] h-[16px] sm:h-[18px]" viewBox="0 0 240 20" fill="none">
                  {/* Left Wing Line & Terminal Diamond */}
                  <path d="M 20 10 L 92 10" stroke="#9b6c28" strokeWidth="1" strokeLinecap="round" />
                  <polygon points="17,10 21,8.5 21,11.5" fill="#9b6c28" />
                  <circle cx="95" cy="10" r="1.8" fill="#9b6c28" />

                  {/* Center Radiant Sunburst */}
                  <path d="M 108 11 A 12 12 0 0 1 132 11" fill="none" stroke="#9b6c28" strokeWidth="1.2" />
                  <line x1="120" y1="10" x2="120" y2="2" stroke="#9b6c28" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="115" y1="10" x2="111" y2="4" stroke="#9b6c28" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="125" y1="10" x2="129" y2="4" stroke="#9b6c28" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="111" y1="11" x2="104" y2="7" stroke="#9b6c28" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="129" y1="11" x2="136" y2="7" stroke="#9b6c28" strokeWidth="1.2" strokeLinecap="round" />

                  {/* Right Wing Line & Terminal Diamond */}
                  <circle cx="145" cy="10" r="1.8" fill="#9b6c28" />
                  <path d="M 148 10 L 220 10" stroke="#9b6c28" strokeWidth="1" strokeLinecap="round" />
                  <polygon points="223,10 219,8.5 219,11.5" fill="#9b6c28" />
                </svg>
              </div>

              {/* Storyline Subtitle: The darkness has finally faded. */}
              <p className="font-cormorant italic text-[clamp(14px,3.4cqw,20px)] font-bold text-[#49301D] tracking-[0.02em] leading-snug">
                The darkness has finally faded.
              </p>
            </div>

            {/* Storyline Body Narrative (Grouped as One Balanced Reading Block) */}
            <div
              ref={storyRef}
              className="w-full flex flex-col items-center text-center space-y-2 sm:space-y-3 md:space-y-3.5 my-auto max-w-[440px] px-1"
            >
              
              {/* Paragraph 1 */}
              <p className="font-cormorant text-[clamp(13px,3.1cqw,17.5px)] leading-[1.48] sm:leading-[1.58] text-[#49301D] font-bold">
                Beyond the graveyard, a new dawn awaits. Hidden within the walls of your own college lies a forgotten treasure — a relic of knowledge, mystery and unimaginable value.
              </p>

              {/* Paragraph 2 */}
              <p className="font-cormorant text-[clamp(13px,3.1cqw,17.5px)] leading-[1.48] sm:leading-[1.58] text-[#49301D] font-bold">
                Explore the floors, uncover the scattered clues, and follow the ancient trail to discover the Golden Relic.
              </p>

              {/* Paragraph 3 */}
              <p className="font-cormorant italic text-[clamp(13px,3.1cqw,17.5px)] leading-[1.48] sm:leading-[1.58] text-[#38200F] font-bold tracking-[0.015em]">
                Your next journey begins where your own story was written.
              </p>
            </div>

            {/* Action Section: Centered Royal Cartouche "✦ BEGIN THE HUNT ✦" Button */}
            <div ref={buttonRef} className="w-full flex flex-col items-center flex-shrink-0 pt-1">
              <button
                type="button"
                onClick={handleBeginHuntClick}
                disabled={isSubmitting || isTransitioning}
                aria-label="Begin the hunt through time and space"
                className="group relative cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ width: 'min(390px, 90%)', height: '62px' }}
              >
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_4px_10px_rgba(20,8,3,0.55)]"
                  viewBox="0 0 400 70"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="royalGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff5cc" />
                      <stop offset="14%" stopColor="#e0b24e" />
                      <stop offset="46%" stopColor="#996e1d" />
                      <stop offset="54%" stopColor="#e4bc5b" />
                      <stop offset="86%" stopColor="#7a4e0f" />
                      <stop offset="100%" stopColor="#3a2002" />
                    </linearGradient>
                    <radialGradient id="royalBurgundyPlate" cx="50%" cy="45%" r="65%">
                      <stop offset="0%" stopColor="#4a111a" />
                      <stop offset="55%" stopColor="#2a070e" />
                      <stop offset="100%" stopColor="#140205" />
                    </radialGradient>
                    <filter id="royalUnderglow" x="-20%" y="-20%" width="140%" height="160%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                    </filter>
                  </defs>

                  {/* Golden Underlight Bloom */}
                  <ellipse cx="200" cy="54" rx="110" ry="12" fill="#f59e0b" opacity="0.45" filter="url(#royalUnderglow)" />

                  {/* Molded Outer Gold Bevel with Lance Tips and Gothic Peaks */}
                  <path
                    d="M 68 15 L 175 15 Q 192 2 200 1 Q 208 2 225 15 L 332 15 Q 352 15 362 22 L 388 35 L 362 48 Q 352 55 332 55 L 225 55 Q 208 68 200 69 Q 192 68 175 55 L 68 55 Q 48 55 38 48 L 12 35 L 38 22 Q 48 15 68 15 Z"
                    fill="url(#royalGoldGrad)"
                    stroke="#ffe599"
                    strokeWidth="0.75"
                  />

                  {/* Inner Recessed Burgundy Plaque */}
                  <path
                    d="M 70 19 L 177 19 Q 192 7 200 6 Q 208 7 223 19 L 330 19 Q 346 19 354 25 L 378 35 L 354 45 Q 346 51 330 51 L 223 51 Q 208 63 200 64 Q 192 63 177 51 L 70 51 Q 54 51 46 45 L 22 35 L 46 25 Q 54 19 70 19 Z"
                    fill="url(#royalBurgundyPlate)"
                    stroke="#d4af37"
                    strokeWidth="1.2"
                  />

                  {/* Subtle Inner Engraved Border Line */}
                  <path
                    d="M 72 22 L 179 22 Q 192 12 200 11 Q 208 12 221 22 L 328 22 Q 342 22 348 27 L 368 35 L 348 43 Q 342 48 328 48 L 221 48 Q 208 58 200 59 Q 192 58 179 48 L 72 48 Q 58 48 52 43 L 32 35 L 52 27 Q 58 22 72 22 Z"
                    fill="none"
                    stroke="#f0c868"
                    strokeWidth="0.75"
                    strokeOpacity="0.5"
                  />

                  {/* Top Crest Ornament */}
                  <polygon points="200,1 204,8 196,8" fill="#fff4c8" />
                  <circle cx="200" cy="7" r="1.6" fill="#fff7e0" />

                  {/* Bottom Crest Ornament */}
                  <polygon points="200,69 204,62 196,62" fill="#c6952e" />
                  <circle cx="200" cy="63" r="1.6" fill="#ffd778" />

                  {/* Left & Right Diamond Tips */}
                  <circle cx="19" cy="35" r="1.6" fill="#fff4c8" />
                  <circle cx="381" cy="35" r="1.6" fill="#fff4c8" />
                  <polygon points="12,35 18,32 18,38" fill="#ffeab0" />
                  <polygon points="388,35 382,32 382,38" fill="#ffeab0" />
                </svg>

                <span className="relative z-10 font-cinzel text-[clamp(11px,2.7cqw,14.5px)] font-bold tracking-[0.22em] text-[#f7ebd0] group-hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] uppercase whitespace-nowrap">
                  ✦ BEGIN THE HUNT ✦
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </dialog>
  );
};
