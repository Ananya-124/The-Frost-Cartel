import React from 'react';
import type { R2Card } from '../../../services/round2Service';

interface Theme { accent: string; leaf: string; flower: string; bg: string; motif: 'pumpkin' | 'bloom' }

// One palette per card (picked by card id): folk, witch, black & white, medieval, painting, raven.
const THEMES: Theme[] = [
  { accent: '#d9a441', leaf: '#4a5a34', flower: '#c4553a', bg: '#0d0a0b', motif: 'bloom' },
  { accent: '#cbbf9f', leaf: '#34423a', flower: '#efe7d6', bg: '#0a0b0d', motif: 'bloom' },
  { accent: '#d8d8d8', leaf: '#6b6b6b', flower: '#bdbdbd', bg: '#0b0b0b', motif: 'bloom' },
  { accent: '#b8863b', leaf: '#355342', flower: '#d27a2e', bg: '#0b0e0c', motif: 'pumpkin' },
  { accent: '#d98a3d', leaf: '#4d4a2a', flower: '#e0873a', bg: '#0e0a08', motif: 'pumpkin' },
  { accent: '#c9a77c', leaf: '#2c3a44', flower: '#e8cfa4', bg: '#090a0d', motif: 'bloom' },
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const CHAMFER = 'polygon(7% 0, 93% 0, 100% 4%, 100% 96%, 93% 100%, 7% 100%, 0 96%, 0 4%)';

// Vine colours (lighter than the static leaves so the crawling vines read on the dark card).
const VINES = ['#7fa05a', '#6fa085', '#a8a8a8', '#5fa070', '#a39a4a', '#6c9ab8'];

// Animation styles for the card art: crawling vines, swaying leaves and the neon border on the live card.
const FX_CSS = `
.fc-vine{stroke-dasharray:1;animation:fcVine var(--dur) ease-in-out var(--dl) infinite}
@keyframes fcVine{0%{stroke-dashoffset:1}40%,60%{stroke-dashoffset:0}100%{stroke-dashoffset:-1}}
.fc-leafpop{opacity:0;animation:fcLeaf var(--dur) ease-in-out var(--dl) infinite}
@keyframes fcLeaf{0%,25%{opacity:0}40%,60%{opacity:1}75%,100%{opacity:0}}
.fc-sway{transform-box:fill-box;transform-origin:0 50%;animation:fcSway 3.2s ease-in-out infinite alternate}
@keyframes fcSway{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}
.fc-neon{animation:fcFlicker 3.4s linear infinite;filter:drop-shadow(0 0 2px var(--neon)) drop-shadow(0 0 7px var(--neon)) drop-shadow(0 0 16px var(--neon))}
.fc-neon2{animation-delay:-1.6s}
@keyframes fcFlicker{0%,18%,22%,62%,64%,100%{opacity:1}20%{opacity:.5}63%{opacity:.65}}
.fc-run{stroke-dasharray:.1 .9;animation:fcRun 3s linear infinite;filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 9px var(--neon))}
@keyframes fcRun{to{stroke-dashoffset:-1}}
.fc-live-glow{animation:fcGlow 2.4s ease-in-out infinite alternate}
@keyframes fcGlow{from{filter:drop-shadow(0 0 8px rgba(255,106,0,.55))}to{filter:drop-shadow(0 0 22px rgba(178,77,255,.65))}}
@media (prefers-reduced-motion:reduce){.fc-vine{animation:none;stroke-dashoffset:0}.fc-leafpop{animation:none;opacity:1}.fc-sway,.fc-neon,.fc-run,.fc-live-glow{animation:none}}
`;

interface VineProps { d: string; leaves: [number, number, number][]; dur: number; delay: number; transform?: string }

/** A vine that grows along a path, rests, then crawls away; leaves fade in and out with it. */
const Vine: React.FC<VineProps> = ({ d, leaves, dur, delay, transform }) => (
  <g transform={transform} style={{ '--dur': `${dur}s`, '--dl': `${delay}s` } as React.CSSProperties}>
    <path d={d} pathLength={1} className="fc-vine" fill="none" stroke="var(--vine)" strokeWidth="1.6" strokeLinecap="round" />
    {leaves.map(([x, y, r]) => (
      <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r}) scale(.75)`}>
        <use href="#fc-vleaf" className="fc-leafpop" />
      </g>
    ))}
  </g>
);

/** Shared ornament shapes. Render once per page; every card references them with <use> and its own colours. */
export const AuctionCardDefs: React.FC = () => (
  <>
  <style>{FX_CSS}</style>
  <svg width="0" height="0" className="absolute" aria-hidden="true">
    <defs>
      <g id="fc-leaf">
        <path d="M0 0C5-5 12-5 18 0C12 5 5 5 0 0Z" fill="var(--leaf)" />
        <path d="M1 0H16" stroke="var(--bg)" strokeWidth=".5" opacity=".6" />
      </g>
      <g id="fc-vleaf">
        <path d="M0 0C5-5 12-5 18 0C12 5 5 5 0 0Z" fill="var(--vine)" />
      </g>
      <g id="fc-bloom">
        <g fill="var(--flower)">
          {[0, 60, 120, 180, 240, 300].map((r) => (
            <ellipse key={r} cx="0" cy="-6" rx="3.6" ry="6" transform={`rotate(${r})`} />
          ))}
        </g>
        <circle r="2.6" fill="var(--accent)" />
      </g>
      <g id="fc-pumpkin">
        <g fill="var(--flower)" stroke="var(--bg)" strokeWidth=".7">
          <ellipse cx="-6" cy="0" rx="8" ry="10" />
          <ellipse cx="6" cy="0" rx="8" ry="10" />
          <ellipse cx="0" cy="0" rx="6.5" ry="11" />
        </g>
        <path d="M0-11Q1-16 5-17" stroke="#5c7a3a" strokeWidth="2" fill="none" />
      </g>
      <g id="fc-corner">
        <path d="M10 70C10 30 30 10 70 10" fill="none" stroke="var(--accent)" strokeWidth="1.1" />
        <use href="#fc-leaf" transform="translate(11 58) rotate(-120) scale(.9)" />
        <use href="#fc-leaf" transform="translate(14 42) rotate(-60) scale(.8)" />
        <use href="#fc-leaf" transform="translate(58 11) rotate(-30) scale(.9)" />
        <use href="#fc-leaf" transform="translate(42 14) rotate(30) scale(.8)" />
        <use href="#fc-bloom" transform="translate(17 17) scale(1.15)" />
      </g>
    </defs>
  </svg>
  </>
);

interface AuctionCardProps {
  card: R2Card;
  lot: number;
  /** Base price chosen by the admin for the live auction (defaults to the card's own price). */
  base?: number;
  live?: boolean;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ card, lot, base, live = false }) => {
  const t = THEMES[(card.id - 1) % THEMES.length];
  const sold = card.status === 'sold';
  const unsold = card.status === 'unsold';
  const isLive = live || card.status === 'live';
  const price = sold ? card.price : (base ?? card.defaultBase);
  let tag = 'BASE';
  if (sold) tag = 'SOLD';
  else if (unsold) tag = 'UNSOLD';
  else if (isLive) tag = 'LIVE';
  const vars = { '--accent': t.accent, '--leaf': t.leaf, '--flower': t.flower, '--bg': t.bg, '--vine': VINES[(card.id - 1) % VINES.length], '--neon': '#ff7a1a', '--neon2': '#b24dff', containerType: 'inline-size' } as React.CSSProperties;
  const motif = t.motif === 'pumpkin' ? '#fc-pumpkin' : '#fc-bloom';
  const phase = card.id * -1.3; // so the cards do not all animate in step

  return (
    <div
      style={vars}
      className={`relative aspect-[2/3] w-full select-none transition ${unsold ? 'grayscale opacity-60' : ''} ${isLive ? 'fc-live-glow' : ''}`}
    >
      {/* Ornate border: double frame, vines in the corners, bloom or pumpkin top and bottom */}
      <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <rect x="1.5" y="1.5" width="197" height="297" rx="6" fill="var(--bg)" stroke="var(--accent)" strokeOpacity=".55" />
        <rect x="7" y="7" width="186" height="286" rx="3" fill="none" stroke="var(--accent)" strokeOpacity=".3" />
        <path d="M11 78V222M189 78V222" stroke="var(--accent)" strokeOpacity=".45" />
        {[100, 125, 150, 175, 200].map((y) => (
          <g key={y}>
            <g transform={`translate(11 ${y}) rotate(-50) scale(.6)`}><use href="#fc-leaf" className="fc-sway" style={{ animationDelay: `${-y / 40}s` }} /></g>
            <g transform={`translate(189 ${y}) rotate(230) scale(.6)`}><use href="#fc-leaf" className="fc-sway" style={{ animationDelay: `${-y / 50}s` }} /></g>
          </g>
        ))}
        <use href="#fc-corner" />
        <use href="#fc-corner" transform="translate(200 0) scale(-1 1)" />
        <use href="#fc-corner" transform="translate(0 300) scale(1 -1)" />
        <use href="#fc-corner" transform="translate(200 300) scale(-1 -1)" />
        {/* Crawling vines: left and right sides, top and bottom */}
        <Vine d="M16 292C6 260 26 240 16 210S6 150 18 120S26 60 14 30" leaves={[[16, 210, -40], [18, 120, 200], [14, 30, -30]]} dur={7} delay={phase} />
        <Vine d="M16 292C6 260 26 240 16 210S6 150 18 120S26 60 14 30" leaves={[[16, 210, -40], [18, 120, 200], [14, 30, -30]]} dur={8} delay={phase - 3} transform="translate(200 0) scale(-1 1)" />
        <Vine d="M34 46C50 38 62 54 80 46S112 38 126 46S150 54 166 44" leaves={[[80, 46, -50], [126, 46, -130]]} dur={6} delay={phase - 2} />
        <Vine d="M34 46C50 38 62 54 80 46S112 38 126 46S150 54 166 44" leaves={[[80, 46, -50], [126, 46, -130]]} dur={9} delay={phase - 5} transform="translate(0 300) scale(1 -1)" />
        <use href={motif} transform="translate(100 21) scale(1.2)" />
        <use href={motif} transform="translate(100 279) scale(1.2)" />
        {/* Neon border while the card is being bid on: orange outer tube, purple inner tube, a light running round */}
        {isLive && (
          <g fill="none">
            <rect x="1.5" y="1.5" width="197" height="297" rx="6" stroke="var(--neon)" strokeWidth="1.8" className="fc-neon" />
            <rect x="7" y="7" width="186" height="286" rx="3" stroke="var(--neon2)" strokeWidth="1.2" className="fc-neon fc-neon2" />
            <rect x="1.5" y="1.5" width="197" height="297" rx="6" pathLength={1} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" className="fc-run" />
          </g>
        )}
      </svg>

      {/* Framed centre panel with notched corners, like the invitation reference */}
      <div className="absolute inset-x-[16%] top-[18%] bottom-[18%]" style={{ fontSize: 'max(8.5px, 4.4cqw)' }}>
        <div className="h-full p-px" style={{ background: 'var(--accent)', clipPath: CHAMFER }}>
          <div className="flex h-full flex-col items-center justify-between px-[.8em] py-[.9em] text-center" style={{ background: 'var(--bg)', clipPath: CHAMFER }}>
            <div className="font-cinzel text-[.7em] tracking-[.3em]" style={{ color: 'var(--accent)' }}>LOT {ROMAN[lot - 1] ?? lot}</div>
            <div className="text-[3.4em] leading-none">{card.icon}</div>
            <div>
              <div className="font-cinzel text-[1.25em] font-bold uppercase leading-tight tracking-wide text-cartel-bone">{card.name}</div>
              <p className="mt-[.4em] line-clamp-3 font-garamond text-[1em] leading-snug text-cartel-silver/80">{card.description}</p>
            </div>
            <div className="w-full">
              <div className="mb-[.3em] h-px w-full" style={{ background: 'var(--accent)', opacity: 0.4 }} />
              <div className="flex items-end justify-between font-cinzel">
                <span className="text-[.65em] tracking-widest" style={{ color: isLive ? '#ff6600' : 'var(--accent)' }}>{tag}</span>
                <span className="text-[2em] leading-none text-cartel-bone">{price}</span>
                <span className="text-[.65em] tracking-widest text-cartel-silver/60">CR</span>
              </div>
              {sold && <div className="mt-[.3em] truncate text-[.7em] text-cartel-silver/70">→ {card.winner}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
