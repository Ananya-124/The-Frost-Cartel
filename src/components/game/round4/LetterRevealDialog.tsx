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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="letter-heading"
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none"
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
        className="relative transition-all duration-700 ease-out flex items-center justify-center drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)] drop-shadow-[0_10px_25px_rgba(25,12,4,0.7)]"
        style={{
          width: 'min(600px, calc(86vh * 1024 / 1246), 94vw)',
          aspectRatio: '1024 / 1246',
          maxHeight: '92vh',
        }}
      >
        {/* Parchment Base Texture Layer (Lossless HD Inpainted Relic Scroll) */}
        <div
          ref={scrollBodyRef}
          className="relative w-full h-full"
          style={{
            backgroundImage: "url('/assets/round-4/ancient_parchment_dawn_relic_hd.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle Ambient Light Shimmer across Upper Roll & Wax Seal */}
          <div
            ref={sealGleamRef}
            className="absolute top-[3.8%] left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 pointer-events-none flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_center,rgba(255,215,80,0.35)_0%,transparent_70%)] blur-[4px] animate-pulse [animation-duration:4s]" />
            <svg viewBox="0 0 100 100" className="absolute w-8 h-8 sm:w-10 sm:h-10 opacity-70 filter drop-shadow-[0_0_6px_rgba(255,220,100,0.8)]">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,225,120,0.35)" strokeWidth="1" strokeDasharray="3 3" />
              <polygon points="50,16 53,47 84,50 53,53 50,84 47,53 16,50 47,47" fill="rgba(255,215,80,0.3)" />
            </svg>
          </div>

          {/* Printable Scroll Content - Safely confined within antique deckled margins */}
          <div className="w-full h-full pt-[14%] pb-[9%] px-[12%] sm:px-[14%] flex flex-col justify-between items-center text-center">
            
            {/* Header Section: Title, Sunburst Crest, and Subheading */}
            <div ref={headingRef} className="w-full flex flex-col items-center flex-shrink-0 pt-0 sm:pt-1">
              
              {/* Main Heading: THE DAWN AWAKENS */}
              <h2
                id="letter-heading"
                className="font-cinzel text-[clamp(19px,3.2vw,30px)] font-black tracking-[0.16em] text-[#2c170a] drop-shadow-[0_1px_1px_rgba(255,245,220,0.6)] uppercase leading-none whitespace-nowrap"
              >
                THE DAWN AWAKENS
              </h2>

              {/* Radiant Sunburst Crest Motif (Underneath Heading) */}
              <div className="flex items-center justify-center my-0.5 sm:my-1 opacity-85" aria-hidden="true">
                <svg viewBox="0 0 160 30" className="w-24 sm:w-32 h-auto text-[#5a2e12]">
                  {/* Center Sun & Rays */}
                  <circle cx="80" cy="18" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="80" y1="11" x2="80" y2="5" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="74" y1="13" x2="69" y2="8" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="86" y1="13" x2="91" y2="8" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="69" y1="17" x2="63" y2="14" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="91" y1="17" x2="97" y2="14" stroke="currentColor" strokeWidth="1.2" />
                  {/* Flanking Filigree Arches */}
                  <path d="M 28 18 C 48 18, 58 18, 72 18" fill="none" stroke="currentColor" strokeWidth="1" />
                  <path d="M 132 18 C 112 18, 102 18, 88 18" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="28" cy="18" r="1.5" fill="currentColor" />
                  <circle cx="132" cy="18" r="1.5" fill="currentColor" />
                </svg>
              </div>

              {/* Storyline Subheading: The darkness has finally faded. */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-0.5 sm:my-1 text-[#3d200e]">
                <span className="text-[10px] sm:text-xs text-[#8c5020] opacity-80" aria-hidden="true">✦</span>
                <h3 className="font-cormorant italic text-[clamp(13px,1.9vw,17px)] font-bold tracking-[0.04em] leading-tight">
                  The darkness has finally faded.
                </h3>
                <span className="text-[10px] sm:text-xs text-[#8c5020] opacity-80" aria-hidden="true">✦</span>
              </div>
            </div>

            {/* Storyline Body Narrative (Central Parchment Section) */}
            <div ref={storyRef} className="w-full flex-1 flex flex-col justify-center items-center text-center space-y-1.5 sm:space-y-2.5 px-1 py-1">
              
              {/* Paragraph 1 */}
              <p className="font-cormorant text-[clamp(11.8px,1.65vw,15.2px)] leading-[1.42] sm:leading-[1.48] text-[#2e190b] font-medium max-w-[430px]">
                Beyond the graveyard, a new dawn awaits. Hidden within the walls of your own college lies a forgotten treasure — a relic of knowledge, mystery and unimaginable value.
              </p>

              {/* Ornamental Compass / Star Divider */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 my-0.5 sm:my-1 opacity-75" aria-hidden="true">
                <div className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent to-[#784419]" />
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#784419]">
                  <polygon points="12,2 14,9 21,12 14,15 12,22 10,15 3,12 10,9" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="#fdf3d6" />
                </svg>
                <div className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent to-[#784419]" />
              </div>

              {/* Paragraph 2 */}
              <p className="font-cormorant text-[clamp(11.8px,1.65vw,15.2px)] leading-[1.42] sm:leading-[1.48] text-[#2e190b] font-medium max-w-[430px]">
                Explore the floors, uncover the scattered clues, and follow the ancient trail to discover the Golden Relic.
              </p>

              {/* Highlighted Distressed Parchment Wash Banner (Matching Reference 1) */}
              <div className="relative w-full max-w-[440px] my-1 sm:my-1.5 py-1.5 sm:py-2 px-3 sm:px-5 rounded bg-[#8e2920]/14 border-y border-[#8e2920]/25 shadow-[inset_0_0_12px_rgba(142,41,32,0.12)]">
                <p className="font-cormorant italic text-[clamp(12px,1.7vw,15.5px)] font-bold text-[#3d1610] tracking-[0.03em] leading-snug">
                  Your next journey begins where your own story was written.
                </p>
              </div>
            </div>

            {/* Bottom Section: Royal Ancient Relic "BEGIN THE HUNT" Action Button */}
            <div ref={buttonRef} className="w-full flex-shrink-0 pt-1.5 sm:pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={handleBeginHuntClick}
                disabled={isSubmitting || isTransitioning}
                aria-label="Begin the hunt through time and space"
                className="group relative px-6 sm:px-8 py-2 sm:py-2.5 transition-all duration-300 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-950"
              >
                {/* Ambient Golden Backlight Bloom (Radiates behind the button) */}
                <div
                  className="absolute -inset-1.5 rounded-lg bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.55)_0%,rgba(217,119,6,0.22)_50%,transparent_75%)] blur-md group-hover:blur-lg group-hover:opacity-100 opacity-80 transition-all duration-300 pointer-events-none"
                  aria-hidden="true"
                />

                {/* The Ornate Gold Frame with Crests and Wine Enamel Core */}
                <div
                  className={`relative rounded-md bg-gradient-to-b from-[#3a0d13] via-[#24080c] to-[#140306] border-2 border-[#d4af37] px-5 sm:px-7 py-2 sm:py-2.5 shadow-[0_6px_22px_rgba(0,0,0,0.82),inset_0_1px_2px_rgba(255,235,160,0.5)] transform transition-all duration-200 ${
                    isTransitioning
                      ? 'opacity-85 scale-95 pointer-events-none'
                      : 'group-hover:scale-[1.03] group-hover:border-[#ffe082] group-hover:shadow-[0_0_26px_rgba(245,190,60,0.7),inset_0_1px_2px_rgba(255,245,190,0.7)] group-active:scale-[0.98] group-active:translate-y-[1px]'
                  }`}
                >
                  {/* Top Pointed Crown Crest */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-3 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <svg viewBox="0 0 24 12" className="w-5 h-2.5 text-[#d4af37] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                      <polygon points="12,0 16,6 24,12 0,12 8,6" fill="currentColor" />
                      <polygon points="12,2 15,6 20,10 4,10 9,6" fill="#ffeaa7" />
                    </svg>
                  </div>

                  {/* Bottom Pointed Finial Crest */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-3 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <svg viewBox="0 0 24 12" className="w-5 h-2.5 text-[#d4af37] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] rotate-180">
                      <polygon points="12,0 16,6 24,12 0,12 8,6" fill="currentColor" />
                      <polygon points="12,2 15,6 20,10 4,10 9,6" fill="#ffeaa7" />
                    </svg>
                  </div>

                  {/* Corner Filigree Brackets */}
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-[#ffeaa7]/80 pointer-events-none" aria-hidden="true" />
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-[#ffeaa7]/80 pointer-events-none" aria-hidden="true" />
                  <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-[#ffeaa7]/80 pointer-events-none" aria-hidden="true" />
                  <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-[#ffeaa7]/80 pointer-events-none" aria-hidden="true" />

                  {/* Button Text with Flanking Diamond Stars */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5 font-cinzel text-[clamp(11.5px,1.4vw,14.5px)] font-black tracking-[0.2em] text-[#fae4a8] group-hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] uppercase whitespace-nowrap">
                    <span className="text-[#f5c34d] text-[10px] sm:text-xs transition-transform duration-300 group-hover:rotate-45" aria-hidden="true">✦</span>
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">BEGIN THE HUNT</span>
                    <span className="text-[#f5c34d] text-[10px] sm:text-xs transition-transform duration-300 group-hover:-rotate-45" aria-hidden="true">✦</span>
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
