import React, { useState } from 'react';
import type { R2Card } from '../../../services/round2Service';
import { CARD_ART, CARD_COLOR, CARD_TITLE_COLOR } from '../../../constants/auction.constants';

interface AuctionCardProps {
  card: R2Card;
  /** Position in the row (staggers the animations). */
  index?: number;
  /** Highlight as the card currently being bid on. */
  live?: boolean;
}

/* Ornate card outline (200 x 300 box, stretched to the card; strokes stay thin) */
const OUTLINE =
  'M100 14 C90 14 84 22 72 22 L34 22 C20 22 12 32 12 48 L12 246 C12 256 17 262 26 268 L100 296 L174 268 C183 262 188 256 188 246 L188 48 C188 32 180 22 166 22 L128 22 C116 22 110 14 100 14 Z';
const INNER =
  'M100 24 C92 24 87 30 76 30 L38 30 C28 30 20 37 20 50 L20 242 C20 250 24 255 31 260 L100 284 L169 260 C176 255 180 250 180 242 L180 50 C180 37 172 30 162 30 L124 30 C113 30 108 24 100 24 Z';
const HORNS =
  'M14 52 C2 44 0 26 14 12 C18 8 26 8 30 14 M186 52 C198 44 200 26 186 12 C182 8 174 8 170 14 M12 236 C4 242 6 254 16 258 M188 236 C196 242 194 254 184 258';

const CardFrame: React.FC = () => (
  <svg
    aria-hidden="true"
    className="r2-frame-svg absolute inset-0 w-full h-full overflow-visible pointer-events-none"
    viewBox="0 0 200 300"
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="r2-card-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2b170a" />
        <stop offset="1" stopColor="#120a05" />
      </linearGradient>
    </defs>
    <path d={OUTLINE} fill="url(#r2-card-bg)" />
    <path d={INNER} fill="none" className="r2-frame-inner" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    <path d={OUTLINE} fill="none" className="r2-frame-stroke" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    <path d={HORNS} fill="none" className="r2-frame-horn" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
  </svg>
);

/** Card picture with an emoji fallback if the image file is missing. */
export const CardArt: React.FC<{ card: R2Card; className?: string }> = ({ card, className = '' }) => {
  const [broken, setBroken] = useState(false);
  const src = CARD_ART[card.id];
  if (!src || broken) {
    return <span aria-hidden="true" className="text-6xl">{card.icon}</span>;
  }
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={className} />;
};

const STATUS_TAG: Record<R2Card['status'], string> = {
  pending: 'BASE',
  live: 'LIVE',
  sold: 'SOLD',
  unsold: 'UNSOLD',
};

export const AuctionCard: React.FC<AuctionCardProps> = ({ card, index = 0, live = false }) => {
  const isLive = live || card.status === 'live';
  const sold = card.status === 'sold';
  const unsold = card.status === 'unsold';
  const price = sold && card.price !== null ? card.price : card.defaultBase;
  const vars = {
    '--c': CARD_COLOR,
    '--t': CARD_TITLE_COLOR,
    '--d': `${-index * 0.8}s`,
    '--i': index,
  } as React.CSSProperties;

  return (
    <article
      className={`r2-card relative w-full max-w-[240px] mx-auto ${isLive ? 'r2-card-live' : ''} ${unsold ? 'r2-card-unsold' : ''}`}
      style={vars}
      aria-label={`${card.name}, ${STATUS_TAG[card.status].toLowerCase()} ${price} credits`}
    >
      <div className="r2-card-float">
        <div className="r2-card-body pt-6 pb-4">
          <CardFrame />

          <div className="relative flex flex-col items-center px-[11%] pt-5 pb-7">
            {/* Skull crest */}
            <div className="r2-crest absolute -top-5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center text-xl">
              <span aria-hidden="true">💀</span>
            </div>

            {/* Art window */}
            <div className="r2-art w-full aspect-[5/4] rounded-lg overflow-hidden flex items-center justify-center">
              <CardArt card={card} className="h-[88%] w-auto object-contain r2-art-img" />
              <span aria-hidden="true" className="r2-shine" />
              {(isLive || sold || unsold) && (
                <span className={`r2-badge r2-badge-${isLive ? 'live' : card.status}`}>{isLive ? 'LIVE' : STATUS_TAG[card.status]}</span>
              )}
            </div>

            {/* Name */}
            <h3
              className="mt-3 font-cinzel font-black uppercase tracking-wide text-center text-base sm:text-lg leading-tight"
              style={{ color: CARD_TITLE_COLOR, textShadow: `0 0 10px ${CARD_COLOR}` }}
            >
              {card.name}
            </h3>

            {/* Description */}
            <p className="mt-2 w-full rounded-md bg-black/45 border border-white/10 px-2 py-2 text-center font-garamond text-sm text-cartel-ghost min-h-[3.4rem] flex items-center justify-center">
              {sold && card.winner ? `Won by ${card.winner}` : card.description}
            </p>

            {/* Price */}
            <div className="r2-price mt-3 w-full rounded-full flex items-center justify-center gap-1.5 py-1 px-3">
              <span className="text-[9px] font-cinzel font-bold tracking-widest text-cartel-silver/80">{STATUS_TAG[card.status]}</span>
              <span className="font-cinzel font-black text-xl text-amber-100/90 leading-none">{price}</span>
              <span aria-hidden="true" className="r2-pumpkin text-lg leading-none">🎃</span>
              <span className="text-[9px] font-cinzel font-bold tracking-widest text-cartel-silver/80">CR</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
