import React from 'react';
import type { R2Card } from '../../../services/round2Service';

interface AuctionCardProps {
  card: R2Card;
  paidPrice: number;
  index?: number;
}

const cardArtwork = (card: R2Card) => `/assets/round2/cards/${card.id}.jpg`;

export const CardArt: React.FC<{ card: R2Card; className?: string }> = ({ card, className = '' }) => (
  <img src={cardArtwork(card)} alt="" aria-hidden="true" className={className} />
);

export const AuctionCard: React.FC<AuctionCardProps> = ({ card, paidPrice, index = 0 }) => (
  <article
    className="r2-earned-card w-full max-w-[240px] mx-auto"
    style={{ '--i': index } as React.CSSProperties}
    aria-label={`${card.name}, purchased for ${paidPrice} credits`}
  >
    <div className="r2-earned-paper">
      <img className="r2-earned-art" src={cardArtwork(card)} alt="" aria-hidden="true" />
    </div>
    <p className="r2-earned-price">WON FOR {paidPrice} CR</p>
  </article>
);
