import React from 'react';

// 1. Detailed Skull Vector Graphic with Carved Markings
export const SkullGraphic: React.FC<{ romanNumeral?: 'I' | 'II' | 'III'; className?: string }> = ({
  romanNumeral = 'I',
  className = '',
}) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 100 110"
    className={`w-24 h-28 sm:w-28 sm:h-32 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cranium Dome */}
    <path
      d="M20 50 C18 20 32 8 50 8 C68 8 82 20 80 50 C79 62 76 72 70 78 C65 83 60 84 58 92 L42 92 C40 84 35 83 30 78 C24 72 21 62 20 50 Z"
      fill="url(#craniumGrad)"
      stroke="#4a3728"
      strokeWidth="2.5"
    />
    {/* Cranium Shading & Cracks */}
    <path d="M48 10 C46 22 52 28 50 36" stroke="#5a4231" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M50 36 L54 42" stroke="#5a4231" strokeWidth="1" strokeLinecap="round" />
    <path d="M68 28 C64 34 66 40 62 46" stroke="#5a4231" strokeWidth="1" strokeLinecap="round" />

    {/* Carved Roman Numeral in Forehead */}
    <text
      x="50"
      y="32"
      textAnchor="middle"
      fontFamily="Cinzel, serif"
      fontWeight="900"
      fontSize="16"
      fill="#8b1c1c"
      filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
    >
      {romanNumeral}
    </text>

    {/* Deep Eye Sockets */}
    <ellipse cx="36" cy="54" rx="9" ry="11" fill="#120c08" stroke="#382518" strokeWidth="1.5" />
    <ellipse cx="64" cy="54" rx="9" ry="11" fill="#120c08" stroke="#382518" strokeWidth="1.5" />

    {/* Nasal Cavity (Inverted Heart) */}
    <path d="M50 63 L46 73 L50 71 L54 73 Z" fill="#120c08" stroke="#382518" strokeWidth="1" />

    {/* Maxilla & Teeth Row */}
    <rect x="42" y="85" width="16" height="8" rx="2" fill="#d9cbb8" stroke="#4a3728" strokeWidth="1" />
    <line x1="45" y1="85" x2="45" y2="93" stroke="#4a3728" strokeWidth="1" />
    <line x1="48" y1="85" x2="48" y2="93" stroke="#4a3728" strokeWidth="1" />
    <line x1="52" y1="85" x2="52" y2="93" stroke="#4a3728" strokeWidth="1" />
    <line x1="55" y1="85" x2="55" y2="93" stroke="#4a3728" strokeWidth="1" />

    {/* Gradients */}
    <defs>
      <linearGradient id="craniumGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f4ebdb" />
        <stop offset="60%" stopColor="#d8c5ac" />
        <stop offset="100%" stopColor="#aa9275" />
      </linearGradient>
    </defs>
  </svg>
);

// 2. Thoracic Ribcage & Vertebral Column Graphic
export const RibcageGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 120 140"
    className={`w-32 h-36 sm:w-36 sm:h-44 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Central Sternum & Spine */}
    <rect x="56" y="10" width="8" height="110" rx="3" fill="#cfbd9f" stroke="#4a3728" strokeWidth="1.5" />
    <ellipse cx="60" cy="22" rx="6" ry="4" fill="#a48c6e" />
    <ellipse cx="60" cy="42" rx="6" ry="4" fill="#a48c6e" />
    <ellipse cx="60" cy="62" rx="6" ry="4" fill="#a48c6e" />
    <ellipse cx="60" cy="82" rx="6" ry="4" fill="#a48c6e" />
    <ellipse cx="60" cy="102" rx="6" ry="4" fill="#a48c6e" />

    {/* Symmetrical Rib Pairs (Curving Ribs) */}
    {/* Rib Pair 1 */}
    <path d="M56 22 C34 18 20 30 24 40 C28 48 48 46 56 42" stroke="#d5c4aa" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M64 22 C86 18 100 30 96 40 C92 48 72 46 64 42" stroke="#d5c4aa" strokeWidth="4.5" strokeLinecap="round" />

    {/* Rib Pair 2 */}
    <path d="M56 42 C30 38 14 52 18 64 C22 72 46 68 56 62" stroke="#ccb99d" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M64 42 C90 38 106 52 102 64 C98 72 74 68 64 62" stroke="#ccb99d" strokeWidth="4.5" strokeLinecap="round" />

    {/* Rib Pair 3 */}
    <path d="M56 62 C28 58 12 74 16 86 C20 94 44 88 56 82" stroke="#c2ad8f" strokeWidth="4" strokeLinecap="round" />
    <path d="M64 62 C92 58 108 74 104 86 C100 94 76 88 64 82" stroke="#c2ad8f" strokeWidth="4" strokeLinecap="round" />

    {/* Rib Pair 4 */}
    <path d="M56 82 C32 80 18 94 24 104 C30 110 46 102 56 96" stroke="#b8a183" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M64 82 C88 80 102 94 96 104 C90 110 74 102 64 96" stroke="#b8a183" strokeWidth="3.5" strokeLinecap="round" />

    {/* Floating Ribs */}
    <path d="M56 96 C40 98 28 106 32 116" stroke="#aa9274" strokeWidth="3" strokeLinecap="round" />
    <path d="M64 96 C80 98 92 106 88 116" stroke="#aa9274" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 3. Ancient Leather Grimoire Book with Gold Emblem
export const BookGraphic: React.FC<{ title?: string; className?: string }> = ({
  className = '',
}) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 110 90"
    className={`w-28 h-24 sm:w-32 sm:h-28 filter drop-shadow-[0_8px_18px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Parchment Edge Thickness */}
    <rect x="8" y="10" width="94" height="68" rx="6" fill="#e8dac0" stroke="#7d6044" strokeWidth="2" />
    <line x1="12" y1="74" x2="100" y2="74" stroke="#c2b093" strokeWidth="2" />
    <line x1="14" y1="76" x2="98" y2="76" stroke="#a69375" strokeWidth="1.5" />

    {/* Dark Leather Front Cover */}
    <rect x="6" y="8" width="94" height="64" rx="6" fill="url(#leatherGrad)" stroke="#2d170b" strokeWidth="2.5" />

    {/* Embossed Gold Border Corner Mounts */}
    <path d="M12 14 L24 14 L24 16 L14 16 L14 26 L12 26 Z" fill="#d4af37" />
    <path d="M94 14 L82 14 L82 16 L92 16 L92 26 L94 26 Z" fill="#d4af37" />
    <path d="M12 66 L24 66 L24 64 L14 64 L14 54 L12 54 Z" fill="#d4af37" />
    <path d="M94 66 L82 66 L82 64 L92 64 L92 54 L94 54 Z" fill="#d4af37" />

    {/* Center Golden Solar / Cartel Emblem */}
    <circle cx="53" cy="40" r="14" fill="#1f0f08" stroke="#d4af37" strokeWidth="2" />
    <circle cx="53" cy="40" r="10" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="2 2" />
    <path d="M53 28 L53 52 M41 40 L65 40 M44 31 L62 49 M44 49 L62 31" stroke="#d4af37" strokeWidth="1.5" />

    {/* Red Bookmark Ribbon Dropping Below Book */}
    <path d="M48 68 L48 86 L53 82 L58 86 L58 68 Z" fill="#8b1c1c" stroke="#520e0e" strokeWidth="1" />

    <defs>
      <linearGradient id="leatherGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4a2211" />
        <stop offset="50%" stopColor="#301509" />
        <stop offset="100%" stopColor="#1a0b04" />
      </linearGradient>
    </defs>
  </svg>
);

// 4. Rolled Papyrus Scroll with Red Ribbon
export const ScrollGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 100 45"
    className={`w-24 h-12 sm:w-28 sm:h-14 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main Cylinder */}
    <rect x="15" y="8" width="70" height="28" rx="6" fill="#f0e2ca" stroke="#7d6044" strokeWidth="2" />
    {/* Left Curled End */}
    <ellipse cx="15" cy="22" rx="7" ry="14" fill="#d8c5aa" stroke="#7d6044" strokeWidth="2" />
    <ellipse cx="15" cy="22" rx="4" ry="9" fill="#9c876c" />
    {/* Right Curled End */}
    <ellipse cx="85" cy="22" rx="7" ry="14" fill="#eddcc2" stroke="#7d6044" strokeWidth="2" />

    {/* Red Silk Ribbon Wrapped Around Cylinder */}
    <rect x="46" y="8" width="8" height="28" fill="#991b1b" stroke="#590d0d" strokeWidth="1" />
    {/* Ribbon Tails */}
    <path d="M50 36 L44 44 L50 42 L56 44 Z" fill="#991b1b" stroke="#590d0d" strokeWidth="1" />
  </svg>
);

// 5. Wax-Sealed Folded Letter
export const LetterGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 80 60"
    className={`w-20 h-16 sm:w-24 sm:h-20 filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Envelope Body */}
    <rect x="6" y="10" width="68" height="42" rx="4" fill="#faf2e3" stroke="#876b4a" strokeWidth="1.8" />
    {/* Fold Flaps */}
    <path d="M6 10 L40 34 L74 10" stroke="#b09673" strokeWidth="1.5" fill="none" />
    <path d="M6 52 L30 30 M74 52 L50 30" stroke="#c4ae8d" strokeWidth="1.2" />

    {/* Crimson Wax Seal Stamp */}
    <circle cx="40" cy="34" r="8" fill="#a11919" stroke="#540a0a" strokeWidth="1.5" />
    <circle cx="40" cy="34" r="5" fill="#801212" />
    {/* Skull Initial inside seal */}
    <path d="M38 32 C38 30 42 30 42 32 C42 35 40 36 40 37" stroke="#e8b0b0" strokeWidth="1" strokeLinecap="round" />
    <circle cx="40" cy="38" r="0.8" fill="#e8b0b0" />
  </svg>
);

// 6. Azure Glowing Soul Crystal
export const CrystalGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 70 80"
    className={`w-18 h-20 sm:w-20 sm:h-24 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Crystal Facets */}
    <polygon points="35,6 60,26 35,74 10,26" fill="url(#crystalGrad)" stroke="#06b6d4" strokeWidth="1.5" />
    <polygon points="35,6 50,26 35,74" fill="#22d3ee" opacity="0.4" />
    <polygon points="35,6 35,74 20,26" fill="#0891b2" opacity="0.6" />
    <line x1="10" y1="26" x2="60" y2="26" stroke="#67e8f9" strokeWidth="1.2" />

    {/* Inner Celestial Core */}
    <circle cx="35" cy="34" r="8" fill="#cffafe" filter="blur(3px)" />

    <defs>
      <linearGradient id="crystalGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a5f3fc" />
        <stop offset="40%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
    </defs>
  </svg>
);

// 7. Ornate Antique Brass Key
export const KeyGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 80 40"
    className={`w-20 h-10 sm:w-24 sm:h-12 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Key Bow (Ornate Ring) */}
    <circle cx="20" cy="20" r="14" fill="#291e0d" stroke="#d4af37" strokeWidth="3" />
    <circle cx="20" cy="20" r="7" fill="none" stroke="#d4af37" strokeWidth="2" />
    {/* Four Petals inside Bow */}
    <circle cx="20" cy="13" r="2" fill="#d4af37" />
    <circle cx="20" cy="27" r="2" fill="#d4af37" />
    <circle cx="13" cy="20" r="2" fill="#d4af37" />
    <circle cx="27" cy="20" r="2" fill="#d4af37" />

    {/* Key Shaft */}
    <rect x="34" y="18" width="38" height="4" rx="1" fill="#d4af37" stroke="#785f1c" strokeWidth="1" />

    {/* Bit Teeth */}
    <rect x="62" y="22" width="4" height="9" fill="#d4af37" stroke="#785f1c" strokeWidth="1" />
    <rect x="68" y="22" width="4" height="6" fill="#d4af37" stroke="#785f1c" strokeWidth="1" />
  </svg>
);

// 8. Open Ancient Diary Graphic with Aged Pages & Cursive Notes
export const DiaryOpenGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 140 100"
    className={`w-36 h-28 sm:w-44 sm:h-32 filter drop-shadow-[0_10px_22px_rgba(0,0,0,0.95)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Open Book Shadow / Base */}
    <path d="M10 20 C40 14 65 18 70 24 C75 18 100 14 130 20 L132 86 C102 80 75 84 70 90 C65 84 38 80 8 86 Z" fill="#1e1008" stroke="#3d2112" strokeWidth="2.5" />
    {/* Aged Paper Stack Left */}
    <path d="M12 18 C40 12 64 16 68 22 L68 86 C64 80 40 76 12 82 Z" fill="#f7edd8" stroke="#a68c6a" strokeWidth="1.5" />
    {/* Aged Paper Stack Right */}
    <path d="M72 22 C76 16 100 12 128 18 L128 82 C100 76 76 80 72 86 Z" fill="#f4e8cf" stroke="#a68c6a" strokeWidth="1.5" />
    {/* Spine Crease */}
    <line x1="70" y1="23" x2="70" y2="88" stroke="#5a3d24" strokeWidth="2" />

    {/* Handwritten Cursive Lines Left */}
    <path d="M18 30 C30 28 45 29 62 31" stroke="#4a3423" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M18 38 C32 36 50 37 62 40" stroke="#4a3423" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M18 46 C28 45 42 46 58 48" stroke="#4a3423" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M18 54 C35 52 48 53 62 56" stroke="#4a3423" strokeWidth="1.2" strokeLinecap="round" />
    {/* Sketch of Castle / Cross */}
    <path d="M30 64 L30 76 M24 68 L36 68" stroke="#8b1c1c" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="30" cy="70" r="8" fill="none" stroke="#8b1c1c" strokeWidth="1" strokeDasharray="2 2" />

    {/* Handwritten Cursive Lines Right */}
    <path d="M78 31 C90 29 105 28 122 30" stroke="#4a3423" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M78 39 C95 37 110 36 122 38" stroke="#4a3423" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M78 47 C92 46 108 45 120 46" stroke="#4a3423" strokeWidth="1.2" strokeLinecap="round" />
    {/* Inscribed Digits 1-4-7 */}
    <text x="100" y="68" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="12" fill="#8b1c1c" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.5))">
      1 • 4 • 7
    </text>
    <path d="M82 74 C96 72 110 73 122 75" stroke="#4a3423" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// 9. Antique Brass Pocket Compass
export const CompassGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 80 80"
    className={`w-18 h-18 sm:w-22 sm:h-22 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Compass Ring & Top Latch */}
    <circle cx="40" cy="8" r="5" stroke="#d4af37" strokeWidth="2" fill="none" />
    <rect x="38" y="12" width="4" height="4" fill="#d4af37" />

    {/* Heavy Brass Casing */}
    <circle cx="40" cy="44" r="32" fill="#2d1c0a" stroke="#d4af37" strokeWidth="3" />
    <circle cx="40" cy="44" r="28" fill="#140d05" stroke="#8a6f27" strokeWidth="1.5" />
    <circle cx="40" cy="44" r="26" fill="#f5edd8" />

    {/* Compass Rose Markings */}
    <line x1="40" y1="20" x2="40" y2="68" stroke="#8c734b" strokeWidth="1" strokeDasharray="1 2" />
    <line x1="16" y1="44" x2="64" y2="44" stroke="#8c734b" strokeWidth="1" strokeDasharray="1 2" />
    <text x="40" y="27" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="7" fill="#8b1c1c">N</text>
    <text x="40" y="65" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="7" fill="#3a2717">S</text>
    <text x="61" y="46" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="7" fill="#3a2717">E</text>
    <text x="19" y="46" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="7" fill="#3a2717">W</text>

    {/* Magnetic Needle */}
    {/* North Needle (Crimson) */}
    <polygon points="40,23 44,44 40,41 36,44" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.8" />
    {/* South Needle (Brass/Dark) */}
    <polygon points="40,65 44,44 40,47 36,44" fill="#443220" stroke="#1c130b" strokeWidth="0.8" />
    {/* Center Pivot Pivot */}
    <circle cx="40" cy="44" r="3.5" fill="#d4af37" stroke="#5a4214" strokeWidth="1" />
  </svg>
);

// 10. Crimson Alchemical Potion Vial
export const PotionGraphic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 60 90"
    className={`w-14 h-22 sm:w-16 sm:h-24 filter drop-shadow-[0_0_18px_rgba(220,38,38,0.7)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cork Stopper */}
    <rect x="22" y="6" width="16" height="12" rx="2" fill="#a47b4d" stroke="#5c4122" strokeWidth="1.5" />
    {/* Glass Lip */}
    <ellipse cx="30" cy="18" rx="12" ry="4" fill="#881337" stroke="#e11d48" strokeWidth="1.5" />
    {/* Glass Neck */}
    <rect x="24" y="18" width="12" height="18" fill="rgba(255,255,255,0.08)" stroke="#f43f5e" strokeWidth="1.2" />
    {/* Glass Bulb Body */}
    <path d="M24 36 C12 44 8 60 12 74 C16 84 44 84 48 74 C52 60 48 44 36 36 Z" fill="rgba(30,10,15,0.7)" stroke="#f43f5e" strokeWidth="1.5" />
    {/* Bubbling Crimson Liquid inside */}
    <path d="M15 54 C20 50 40 52 45 54 C48 64 45 76 40 80 C32 84 22 83 18 78 C14 70 14 60 15 54 Z" fill="url(#potionGrad)" />
    {/* Glowing Liquid Highlights */}
    <circle cx="24" cy="62" r="2" fill="#fecdd3" opacity="0.8" />
    <circle cx="36" cy="68" r="1.5" fill="#fecdd3" opacity="0.8" />
    <circle cx="28" cy="72" r="2.5" fill="#ffe4e6" opacity="0.9" />

    <defs>
      <linearGradient id="potionGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="60%" stopColor="#be123c" />
        <stop offset="100%" stopColor="#4c0519" />
      </linearGradient>
    </defs>
  </svg>
);

// 11. Ornate Locked Iron Coffer Box
export const CofferGraphic: React.FC<{ isOpen?: boolean; className?: string }> = ({
  isOpen = false,
  className = '',
}) => (
  <svg
    role="img"
    aria-hidden="true"
    viewBox="0 0 100 80"
    className={`w-28 h-22 sm:w-32 sm:h-26 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)] cursor-grab active:cursor-grabbing ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {isOpen ? (
      <>
        {/* Open Coffer Base */}
        <rect x="10" y="35" width="80" height="38" rx="4" fill="#1f1a14" stroke="#d4af37" strokeWidth="2" />
        {/* Glowing Golden Interior */}
        <rect x="14" y="39" width="72" height="30" fill="url(#cofferGoldGrad)" />
        <text x="50" y="58" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="13" fill="#ffffff" filter="drop-shadow(0 0 6px #f59e0b)">
          NIGHT
        </text>
        {/* Raised Open Lid */}
        <path d="M10 35 L20 10 L80 10 L90 35 Z" fill="#2d2319" stroke="#d4af37" strokeWidth="2" />
      </>
    ) : (
      <>
        {/* Closed Coffer Body */}
        <rect x="10" y="30" width="80" height="42" rx="4" fill="#1c1611" stroke="#8a6f27" strokeWidth="2.5" />
        {/* Curved Vaulted Lid */}
        <path d="M8 30 C8 15 25 10 50 10 C75 10 92 15 92 30 Z" fill="#2b2016" stroke="#d4af37" strokeWidth="2" />
        {/* Iron Straps & Rivets */}
        <rect x="26" y="10" width="8" height="62" fill="#3a2f24" stroke="#8a6f27" strokeWidth="1" />
        <rect x="66" y="10" width="8" height="62" fill="#3a2f24" stroke="#8a6f27" strokeWidth="1" />
        {/* Golden Tumbler Padlock */}
        <rect x="42" y="36" width="16" height="20" rx="3" fill="#d4af37" stroke="#785f1c" strokeWidth="1.5" />
        <circle cx="50" cy="44" r="3" fill="#1c1611" />
        <line x1="50" y1="46" x2="50" y2="52" stroke="#1c1611" strokeWidth="1.5" />
      </>
    )}
    <defs>
      <linearGradient id="cofferGoldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
  </svg>
);

