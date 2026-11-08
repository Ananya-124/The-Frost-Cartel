import React from 'react';

/** Carved pumpkin (the "cup"). Identical for every pumpkin so none can be told apart. */
export const PumpkinSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 160 140" className={className} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="s1-pk-body" cx="50%" cy="38%" r="70%">
        <stop offset="0" stopColor="#ffb347" />
        <stop offset="0.55" stopColor="#e8650c" />
        <stop offset="1" stopColor="#8f3200" />
      </radialGradient>
      <radialGradient id="s1-pk-rib" cx="50%" cy="40%" r="75%">
        <stop offset="0" stopColor="#f58a1f" />
        <stop offset="1" stopColor="#7a2a00" />
      </radialGradient>
    </defs>
    {/* body lobes */}
    <ellipse cx="46" cy="84" rx="40" ry="48" fill="url(#s1-pk-rib)" />
    <ellipse cx="114" cy="84" rx="40" ry="48" fill="url(#s1-pk-rib)" />
    <ellipse cx="80" cy="82" rx="42" ry="52" fill="url(#s1-pk-body)" />
    {/* ribs */}
    <path d="M80 32 C62 60 62 104 80 132" fill="none" stroke="#7a2a00" strokeWidth="2" opacity="0.45" />
    <path d="M80 32 C98 60 98 104 80 132" fill="none" stroke="#7a2a00" strokeWidth="2" opacity="0.45" />
    <path d="M58 40 C30 62 30 108 54 126" fill="none" stroke="#7a2a00" strokeWidth="2" opacity="0.4" />
    <path d="M102 40 C130 62 130 108 106 126" fill="none" stroke="#7a2a00" strokeWidth="2" opacity="0.4" />
    {/* stem + curl */}
    <path d="M74 36 C72 22 80 14 90 12 C88 20 90 28 86 38 Z" fill="#4c6b22" stroke="#2b3d10" strokeWidth="1.5" />
    <path d="M88 20 C100 14 108 20 104 28" fill="none" stroke="#5f8a2a" strokeWidth="2" strokeLinecap="round" />
    {/* carved face — glows like a candle inside */}
    <g className="s1-face">
      <path d="M52 70 L64 58 L72 74 Z" fill="#ffd166" />
      <path d="M108 70 L96 58 L88 74 Z" fill="#ffd166" />
      <path d="M80 80 L73 92 L87 92 Z" fill="#ffd166" />
      <path d="M52 100 L62 108 L70 100 L80 110 L90 100 L98 108 L108 100 C100 118 60 118 52 100 Z" fill="#ffd166" />
    </g>
  </svg>
);

/** The skull (the "ball"). */
export const SkullSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 100 110" className={className} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="s1-sk-bone" cx="50%" cy="35%" r="75%">
        <stop offset="0" stopColor="#fbf4e2" />
        <stop offset="0.7" stopColor="#d9ccaa" />
        <stop offset="1" stopColor="#a8987a" />
      </radialGradient>
    </defs>
    {/* cranium + jaw */}
    <path d="M50 6 C22 6 8 26 8 48 C8 62 14 70 24 76 L24 90 C24 96 28 100 34 100 L66 100 C72 100 76 96 76 90 L76 76 C86 70 92 62 92 48 C92 26 78 6 50 6 Z" fill="url(#s1-sk-bone)" stroke="#6e6048" strokeWidth="2" />
    {/* eyes */}
    <ellipse cx="34" cy="50" rx="11" ry="13" fill="#140a05" />
    <ellipse cx="66" cy="50" rx="11" ry="13" fill="#140a05" />
    <circle className="s1-eye" cx="34" cy="52" r="4" fill="#ff7a1a" />
    <circle className="s1-eye" cx="66" cy="52" r="4" fill="#ff7a1a" />
    {/* nose */}
    <path d="M50 62 L43 78 L57 78 Z" fill="#140a05" />
    {/* teeth */}
    <rect x="30" y="86" width="40" height="12" rx="2" fill="#efe6cf" stroke="#6e6048" strokeWidth="1.5" />
    <path d="M40 86 V98 M50 86 V98 M60 86 V98" stroke="#6e6048" strokeWidth="1.5" />
  </svg>
);
