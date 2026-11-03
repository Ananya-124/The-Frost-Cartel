import React, { useEffect, useState } from 'react';
import { soundController } from '../../../utils/soundController';

interface HorrorJumpscareModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const HorrorJumpscareModal: React.FC<HorrorJumpscareModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'blackout' | 'scare' | 'shatter'>('blackout');

  useEffect(() => {
    if (!isOpen) return;

    // Phase 2: Terrifying Jumpscare trigger & bone-chilling horror scream audio (after 150ms suspense)
    const scareTimer = setTimeout(() => {
      setPhase('scare');
      soundController.playHorrorJumpscare();
    }, 150);

    const shatterTimer = setTimeout(() => {
      // Phase 3: Demon shatters, gate unsealed & victory sound
      setPhase('shatter');
      soundController.playVictory();
    }, 2500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(scareTimer);
      clearTimeout(shatterTimer);
      clearTimeout(completeTimer);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Ancient Grave Jumpscare Event"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onComplete();
      }}
      className="fixed inset-0 z-[300] overflow-hidden select-none pointer-events-auto flex items-center justify-center bg-black"
    >
      {/* 1. Strobe Flashing Layer (Rapid Black, Blood Crimson, Lightning Flashes) */}
      {phase === 'scare' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none animate-jumpscare-strobe mix-blend-difference z-0"
        />
      )}

      {/* 2. Violent Camera Shake Container */}
      <div
        className={`relative w-full h-full flex items-center justify-center ${
          phase === 'scare' ? 'animate-jumpscare-shake' : ''
        }`}
      >
        {/* Blood Vignette & Screen Splatter */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(139,0,0,0.5)_75%,rgba(0,0,0,0.95)_100%)]"
        />

        {/* Fractured Glass Spiderweb Overlay */}
        {phase === 'scare' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 1000"
            className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-60 mix-blend-screen"
          >
            <path
              d="M500 500 L120 180 M500 500 L880 150 M500 500 L950 780 M500 500 L80 820 M500 500 L480 50 M500 500 L530 950 M320 350 L420 280 L580 320 L650 450 L580 620 L380 600 Z"
              stroke="#ffffff"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="4 2"
            />
            <circle cx="500" cy="500" r="180" stroke="#ff3333" strokeWidth="1.5" fill="none" opacity="0.4" />
          </svg>
        )}

        {/* Dripping Blood Splatters */}
        {phase === 'scare' && (
          <div aria-hidden="true" className="absolute top-0 inset-x-0 h-40 pointer-events-none z-20 flex justify-around opacity-90">
            <div className="w-2.5 h-32 bg-red-700 rounded-b-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
            <div className="w-3 h-24 bg-red-800 rounded-b-full shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
            <div className="w-2 h-36 bg-red-600 rounded-b-full animate-bounce shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
            <div className="w-3.5 h-20 bg-red-700 rounded-b-full shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
            <div className="w-2 h-28 bg-red-800 rounded-b-full shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
          </div>
        )}

        {/* 3. The Demonic Shrieking Banshee Entity (Lunges violently towards screen) */}
        {phase === 'scare' && (
          <div
            className="relative z-30 animate-jumpscare-lunge flex flex-col items-center justify-center transform-gpu filter drop-shadow-[0_0_50px_rgba(220,38,38,0.95)]"
          >
            {/* Chromatic aberration glitch wrapper */}
            <div className="animate-jumpscare-glitch relative">
              {/* Screaming Demonic Skull Monster SVG */}
              <svg
                width="420"
                height="460"
                viewBox="0 0 420 460"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Screaming Demonic Skull Monster"
                className="max-w-[85vw] max-h-[75vh]"
              >
                <title>Screaming Demonic Skull Monster</title>
                <defs>
                  <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#ff0000" />
                    <stop offset="70%" stopColor="#990000" />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>
                  <linearGradient id="boneRot" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f3ede2" />
                    <stop offset="40%" stopColor="#c5b79d" />
                    <stop offset="80%" stopColor="#57493a" />
                    <stop offset="100%" stopColor="#1a120b" />
                  </linearGradient>
                  <radialGradient id="mouthVoid" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#450a0a" />
                    <stop offset="50%" stopColor="#1a0202" />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>
                </defs>

                {/* Spectral Shroud / Black Mist Tendrils */}
                <path
                  d="M40 220 C20 120, 80 20, 210 20 C340 20, 400 120, 380 220 C390 320, 340 430, 210 440 C80 430, 30 320, 40 220 Z"
                  fill="#030102"
                  filter="blur(6px)"
                  opacity="0.95"
                />

                {/* Skull Cranium */}
                <path
                  d="M75 180 C60 100, 110 40, 210 40 C310 40, 360 100, 345 180 C340 225, 315 250, 300 270 C285 285, 275 320, 275 350 C275 365, 240 375, 210 375 C180 375, 145 365, 145 350 C145 320, 135 285, 120 270 C105 250, 80 225, 75 180 Z"
                  fill="url(#boneRot)"
                  stroke="#3e2e21"
                  strokeWidth="5"
                />

                {/* Forehead Curse Rune (Bloody Crack) */}
                <path
                  d="M210 65 L215 110 L195 125 L225 155 M190 95 L230 100"
                  stroke="#b91c1c"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Sunken Cavernous Eye Sockets */}
                <ellipse cx="145" cy="180" rx="36" ry="46" fill="#050101" stroke="#2a0505" strokeWidth="4" />
                <ellipse cx="275" cy="180" rx="36" ry="46" fill="#050101" stroke="#2a0505" strokeWidth="4" />

                {/* Piercing Blazing Crimson Demonic Eyes with Strobe */}
                <circle cx="145" cy="180" r="16" fill="url(#eyeGlow)" className="animate-ping" />
                <circle cx="145" cy="180" r="8" fill="#ffffff" />
                <circle cx="275" cy="180" r="16" fill="url(#eyeGlow)" className="animate-ping" />
                <circle cx="275" cy="180" r="8" fill="#ffffff" />

                {/* Nasal Cavity Void */}
                <polygon points="210,215 195,255 225,255" fill="#0a0202" />

                {/* Screaming Gaping Demonic Jaw */}
                <path
                  d="M130 290 Q210 275 290 290 Q305 390 290 425 Q210 445 130 425 Q115 390 130 290 Z"
                  fill="url(#mouthVoid)"
                  stroke="#1c0505"
                  strokeWidth="4"
                />

                {/* Upper Needle Fangs */}
                <g fill="#f5ede3" stroke="#7f1d1d" strokeWidth="1.5">
                  <polygon points="140,290 146,325 152,291" />
                  <polygon points="155,291 163,332 171,292" />
                  <polygon points="175,292 184,338 193,293" />
                  <polygon points="197,293 210,344 223,293" />
                  <polygon points="227,293 236,338 245,292" />
                  <polygon points="249,292 257,332 265,291" />
                  <polygon points="268,291 274,325 280,290" />
                </g>

                {/* Lower Needle Fangs */}
                <g fill="#f5ede3" stroke="#7f1d1d" strokeWidth="1.5">
                  <polygon points="142,422 149,385 156,424" />
                  <polygon points="160,425 168,378 176,427" />
                  <polygon points="180,427 190,370 200,430" />
                  <polygon points="204,430 210,366 216,430" />
                  <polygon points="220,430 230,370 240,427" />
                  <polygon points="244,427 252,378 260,425" />
                  <polygon points="264,424 271,385 278,422" />
                </g>
              </svg>

              {/* Horror Jumpscare Text Flash */}
              <div className="text-center mt-3">
                <span className="text-2xl sm:text-4xl md:text-5xl font-gothic font-black text-red-600 tracking-widest uppercase drop-shadow-[0_0_25px_rgba(255,0,0,1)] animate-pulse">
                  THE NIGHT RETURNS!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Shatter & Escape Victory Transition */}
        {phase === 'shatter' && (
          <div className="relative z-40 text-center p-6 sm:p-10 max-w-xl mx-auto rounded-3xl bg-black/95 border-2 border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.7)] animate-fadeIn">
            <div className="text-5xl sm:text-6xl mb-3 animate-bounce">⚡ ⛩️ ⚡</div>
            <div className="text-xs sm:text-sm font-cinzel font-bold text-emerald-400 tracking-[0.3em] uppercase mb-1">
              THE ANCIENT SPECTRAL CURSE SHATTERED
            </div>
            <h2 className="text-2xl sm:text-4xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-amber-300 tracking-wider mb-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">
              ARCH-LICH GATE BREACHED
            </h2>
            <p className="text-stone-300 font-serif text-xs sm:text-sm leading-relaxed mb-6">
              The monstrous guardian dissolves into screaming ash. The cemetery mist parts, revealing the escape path into the Cartel Sanctuary!
            </p>
            <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 font-cinzel text-sm font-black tracking-widest uppercase shadow-[0_0_25px_rgba(16,185,129,0.5)]">
              <span>💰 +250 CREDITS REWARDED</span>
            </div>
          </div>
        )}
      </div>

      {/* Skip button for accessibility */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-4 right-4 z-50 text-[10px] font-cinzel text-stone-500 hover:text-stone-300 underline tracking-widest uppercase cursor-pointer"
      >
        Skip Cinematic ⏩
      </button>
    </div>
  );
};
