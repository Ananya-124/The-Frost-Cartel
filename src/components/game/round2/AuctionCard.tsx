import React from 'react';
import type { R2Card } from '../../../services/round2Service';

interface AuctionCardProps {
  card: R2Card;
  paidPrice: number;
  index?: number;
}

/** Show each card's server-provided symbol rather than artwork for the retired catalog. */
export const CardArt: React.FC<{ card: R2Card; className?: string }> = ({ card, className = '' }) => (
  <span aria-hidden="true" className={`text-6xl ${className}`}>{card.icon}</span>
);

export const AuctionCard: React.FC<AuctionCardProps> = ({ card, paidPrice, index = 0 }) => (
  <article
    className="r2-earned-card w-full max-w-[240px] mx-auto"
    style={{ '--i': index } as React.CSSProperties}
    aria-label={`${card.name}, purchased for ${paidPrice} credits`}
  >
    <div className="r2-earned-paper">
      <div className="r2-earned-scene" aria-hidden="true">
        <svg viewBox="0 0 240 280" preserveAspectRatio="xMidYMid slice">
          <rect width="240" height="280" fill="#153b43" />
          <g fill="#e8d8ae" opacity="0.85">
            <circle cx="23" cy="31" r="1.5" />
            <circle cx="51" cy="67" r="1" />
            <circle cx="84" cy="29" r="1.2" />
            <circle cx="106" cy="77" r="1.5" />
            <circle cx="37" cy="112" r="1" />
            <circle cx="219" cy="35" r="1.3" />
            <circle cx="207" cy="92" r="1" />
            <circle cx="178" cy="47" r="1.5" />
            <circle cx="15" cy="152" r="1" />
            <circle cx="225" cy="144" r="1.3" />
          </g>
          <circle cx="174" cy="85" r="43" fill="#e8d8ae" />
          <circle cx="192" cy="69" r="39" fill="#153b43" />
          <path d="M0 104 31 82l20 20 24-31 31 41 22-18 25 25 29-34 25 27 33-14v92H0Z" fill="#24565a" />
          <path d="M0 160q44-30 86-2 40-30 80 0 40-26 74-8v85H0Z" fill="#172a2c" />
          <path d="M12 0h19l-7 54q15 15 36 27-23-8-44-26L0 92l14-44L5 35l12 6Z" fill="#101a1c" />
          <path d="M16 48Q40 30 55 17M21 57Q45 49 67 43M22 51Q43 10 54 4" fill="none" stroke="#101a1c" strokeWidth="7" strokeLinecap="round" />
          <path d="m52 180 9-27 8 27 12 9H43Zm40 0 10-35 10 35 13 10H83Zm45 0 9-28 9 28 11 8h-40Z" fill="#0c1416" />
          <path d="M56 189h101v91H56Z" fill="#0c1416" />
          <path d="M0 225q53-27 102-8 66-30 138 4v59H0Z" fill="#0b1214" />
          <path d="M28 211q4-23 13-27l-5 19 14-13-7 20 14-5-13 12 2 22H37l2-22-14-6Zm41 6q4-22 13-26l-5 19 14-13-7 20 14-5-13 12 2 22H78l2-22-14-6Zm115-4q4-22 13-26l-5 19 14-13-7 20 14-5-13 12 2 22h-16l2-22-14-6Z" fill="#080d0e" />
          <path d="M0 244h240" stroke="#d3b980" strokeOpacity="0.45" strokeWidth="2" />
        </svg>
      </div>
      <h3 className="r2-earned-name">{card.name}</h3>
    </div>
    <p className="r2-earned-price">WON FOR {paidPrice} CR</p>
  </article>
);
