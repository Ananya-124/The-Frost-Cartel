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
            className="absolute inset-x-[10%] sm:inset-x-[12%] top-[21%] bottom-[7%] flex flex-col items-center justify-start text-center select-none"
            style={{ containerType: 'inline-size' }}
          >
            
            {/* Header Section: Title, Subtle Antique Divider, and Subtitle */}
            <div ref={headingRef} className="w-full flex flex-col items-center flex-shrink-0">
              
              {/* Main Heading: THE DAWN AWAKENS */}
              <h2
                id="letter-heading"
                className="font-cinzel text-[clamp(19px,5.2cqw,30px)] font-black tracking-[0.15em] text-[#38200F] drop-shadow-[0_1px_1px_rgba(255,248,230,0.85)] uppercase leading-tight whitespace-nowrap"
              >
                THE DAWN AWAKENS
              </h2>

              {/* Subtle Antique-Gold Decorative Divider */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 my-2 sm:my-2.5" aria-hidden="true">
                <div className="w-8 sm:w-14 h-px bg-gradient-to-r from-transparent to-[#8a5d24]" />
                <span className="text-[10px] sm:text-xs text-[#8a5d24] select-none">❖</span>
                <div className="w-8 sm:w-14 h-px bg-gradient-to-l from-transparent to-[#8a5d24]" />
              </div>

              {/* Storyline Subtitle: The darkness has finally faded. */}
              <p className="font-cormorant italic text-[clamp(14.5px,3.6cqw,20.5px)] font-bold text-[#49301D] tracking-[0.02em] leading-snug">
                The darkness has finally faded.
              </p>
            </div>

            {/* Storyline Body Narrative (Grouped as One Balanced Reading Block) */}
            <div
              ref={storyRef}
              className="w-full flex flex-col items-center text-center space-y-3 sm:space-y-4 md:space-y-4.5 mt-3.5 sm:mt-5 max-w-[450px] px-1"
            >
              
              {/* Paragraph 1 */}
              <p className="font-cormorant text-[clamp(13.5px,3.3cqw,18px)] leading-[1.52] sm:leading-[1.62] text-[#49301D] font-bold">
                Beyond the graveyard, a new dawn awaits. Hidden within the walls of your own college lies a forgotten treasure — a relic of knowledge, mystery and unimaginable value.
              </p>

              {/* Paragraph 2 */}
              <p className="font-cormorant text-[clamp(13.5px,3.3cqw,18px)] leading-[1.52] sm:leading-[1.62] text-[#49301D] font-bold">
                Explore the floors, uncover the scattered clues, and follow the ancient trail to discover the Golden Relic.
              </p>

              {/* Paragraph 3 */}
              <p className="font-cormorant italic text-[clamp(13.5px,3.3cqw,18px)] leading-[1.52] sm:leading-[1.62] text-[#38200F] font-bold tracking-[0.015em]">
                Your next journey begins where your own story was written.
              </p>
            </div>

            {/* Action Section: Centered Integrated "✦ BEGIN THE HUNT ✦" Button */}
            <div ref={buttonRef} className="w-full flex flex-col items-center flex-shrink-0 mt-4 sm:mt-6 md:mt-7">
              <button
                type="button"
                onClick={handleBeginHuntClick}
                disabled={isSubmitting || isTransitioning}
                aria-label="Begin the hunt through time and space"
                className="group relative transition-all duration-300 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] rounded-md"
              >
                {/* Restrained Golden Ambient Illumination */}
                <div
                  className="absolute -inset-1 rounded-md bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.3)_0%,transparent_70%)] blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Royal Seal / Engraved Parchment Action Control */}
                <div
                  className={`relative rounded-md bg-gradient-to-b from-[#3a151b] via-[#280c10] to-[#1c060a] border border-[#c5a059] px-7 sm:px-9 py-2 sm:py-2.5 shadow-[0_5px_14px_rgba(25,10,5,0.45),inset_0_1px_1px_rgba(255,235,175,0.3)] transform transition-all duration-200 ${
                    isTransitioning
                      ? 'opacity-80 scale-95 pointer-events-none'
                      : 'group-hover:scale-[1.02] group-hover:border-[#e2bc68] group-hover:shadow-[0_0_16px_rgba(212,175,55,0.4),inset_0_1px_1px_rgba(255,245,190,0.5)] group-active:scale-[0.98] group-active:translate-y-[1px]'
                  }`}
                >
                  {/* Subtle Inner Engraved Border */}
                  <div className="absolute inset-[2.5px] rounded-[3px] border border-[#d4af37]/25 pointer-events-none" />

                  <span className="relative z-10 font-cinzel text-[clamp(11.5px,2.9cqw,14.5px)] font-bold tracking-[0.2em] text-[#f5ebd7] group-hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] uppercase whitespace-nowrap">
                    ✦ BEGIN THE HUNT ✦
                  </span>
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>
    </dialog>
  );
};
