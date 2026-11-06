import React from 'react';
import type { TeamSession } from '../../../types/team.types';
import { AUCTION_CARDS } from '../../../constants/auction.constants';
import { HauntedAtmosphere } from '../../home/HauntedAtmosphere';
import { AuctionCard } from './AuctionCard';
import '../../../styles/round2.css';

interface Round2AuctionProps {
  session: TeamSession;
  onReturnHome: () => void;
  /** Card currently on the block (null = waiting state) */
  activeCardId?: string | null;
  /** Cards this squad has won */
  ownedCardIds?: string[];
}

const CobWeb: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 120 120"
    className={`absolute top-1 w-24 h-24 sm:w-32 sm:h-32 opacity-50 pointer-events-none ${
      flip ? 'right-1 -scale-x-100' : 'left-1'
    }`}
    fill="none"
    stroke="rgba(190,175,220,0.4)"
    strokeWidth="1"
  >
    <path d="M0 0 L120 0 M0 0 L0 120 M0 0 L105 70 M0 0 L70 105 M0 0 L118 35 M0 0 L35 118" />
    <path d="M30 0 Q28 28 0 30 M60 0 Q55 55 0 60 M90 0 Q82 82 0 90" />
  </svg>
);

const Divider: React.FC = () => (
  <div className="flex items-center justify-center gap-3 w-full max-w-md opacity-80">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cartel-pumpkin" />
    <span aria-hidden="true" className="r2-pumpkin text-2xl">🎃</span>
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cartel-pumpkin" />
  </div>
);

export const Round2Auction: React.FC<Round2AuctionProps> = ({
  session,
  onReturnHome,
  activeCardId = null,
  ownedCardIds = [],
}) => {
  const activeCard = AUCTION_CARDS.find((c) => c.id === activeCardId) ?? null;
  const owned = AUCTION_CARDS.filter((c) => ownedCardIds.includes(c.id));

  return (
    <div className="relative min-h-screen bg-cartel-void text-cartel-bone font-sans overflow-x-hidden">
      {/* Original background kept as-is */}
      <HauntedAtmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-4 sm:px-6 py-5">
        {/* ===== Header ===== */}
        <header className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
          <button
            onClick={onReturnHome}
            className="r2-btn font-cinzel font-bold uppercase tracking-widest text-sm sm:text-base text-cartel-amber px-4 sm:px-6 py-2 rounded-xl cursor-pointer"
          >
            ← Return
          </button>

          <div className="flex flex-col items-center">
            <div className="r2-title-plate px-6 sm:px-10 py-2 sm:py-3 rounded-2xl">
              <h1 className="r2-title font-gothic font-black uppercase text-center text-2xl sm:text-4xl lg:text-6xl leading-tight">
                The Haunted Auction
              </h1>
            </div>
            <div className="mt-1 w-full max-w-xs sm:max-w-md">
              <Divider />
            </div>
          </div>

          <div className="r2-btn rounded-xl px-3 sm:px-5 py-1.5 text-center">
            <div className="font-cinzel text-[10px] sm:text-xs tracking-widest text-white">{session.teamName}</div>
            <div className="flex items-center justify-center gap-1.5 font-cinzel font-black text-cartel-amber text-lg sm:text-2xl leading-none mt-0.5">
              <span aria-hidden="true">🎃</span>
              <span>{session.credits}</span>
              <span className="text-xs sm:text-sm">CR</span>
            </div>
          </div>
        </header>

        {/* ===== Stage + Your Cards ===== */}
        <section className="mt-5 grid grid-cols-1 lg:grid-cols-[2.3fr_1fr] gap-5">
          {/* Auction stage */}
          <div
            className="r2-panel relative min-h-[260px] sm:min-h-[300px] rounded-[28px] flex flex-col items-center justify-center overflow-hidden px-4 py-6"
            aria-live="polite"
          >
            <CobWeb />
            <CobWeb flip />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cartel-pumpkin to-transparent" />
            <span aria-hidden="true" className="r2-candle absolute bottom-3 left-4 text-3xl drop-shadow-[0_0_10px_rgba(255,140,0,0.55)]">🕯️</span>
            <span aria-hidden="true" className="r2-candle absolute bottom-3 right-4 text-3xl drop-shadow-[0_0_10px_rgba(255,140,0,0.55)]" style={{ animationDelay: '-1.2s' }}>🕯️</span>

            {activeCard ? (
              <>
                <img src={activeCard.art} alt="" className="r2-ghost h-32 sm:h-40 w-auto object-contain" />
                <p className="mt-3 font-cinzel font-black uppercase tracking-wider text-xl sm:text-2xl" style={{ color: activeCard.titleColor }}>
                  {activeCard.name}
                </p>
                <p className="mb-3 font-garamond text-cartel-ghost">{activeCard.description}</p>
                <Divider />
              </>
            ) : (
              <>
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="r2-mist absolute left-1/2 bottom-0 w-72 h-16 rounded-[50%] blur-xl"
                  />
                  {[
                    { l: '28%', wx: '-18px', wd: '0s' },
                    { l: '50%', wx: '10px', wd: '1.5s' },
                    { l: '70%', wx: '22px', wd: '3s' },
                  ].map((w) => (
                    <span key={w.l} aria-hidden="true" className="r2-wisp" style={{ left: w.l, '--wx': w.wx, '--wd': w.wd } as React.CSSProperties} />
                  ))}
                  <img src="/assets/round2/ghost-stage.png" alt="" className="r2-ghost relative h-32 sm:h-40 w-auto object-contain" />
                </div>
                <p className="mt-4 mb-3 r2-wait font-cinzel uppercase tracking-wider text-lg sm:text-2xl text-[#a58acb] text-center">
                  Waiting for the next card...
                </p>
                <Divider />
              </>
            )}
          </div>

          {/* Your cards */}
          <aside className="r2-panel relative rounded-[24px] p-4 min-h-[260px] sm:min-h-[300px] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-orange-700/40 pb-2">
              <span aria-hidden="true" className="r2-pumpkin text-3xl">🎃</span>
              <h2 className="font-cinzel font-bold uppercase tracking-wider text-xl text-cartel-amber">Your Cards</h2>
            </div>
            <div className="relative mt-3 rounded-xl bg-[#0b0614]/70 border border-orange-800/40 min-h-[170px] sm:min-h-[210px] p-3">
              {owned.length === 0 ? (
                <p className="font-garamond italic text-lg text-[#9a84c0]">None yet...</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {owned.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 bg-black/50 border font-cinzel text-xs"
                      style={{ borderColor: c.color, color: c.titleColor }}
                    >
                      <img src={c.art} alt="" className="h-8 w-8 object-contain" />
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
              {/* Faded card-back stack */}
              <div aria-hidden="true" className="absolute bottom-3 right-4 w-28 h-24 pointer-events-none">
                {[-14, 0, 14].map((rot, i) => (
                  <div
                    key={rot}
                    className="absolute bottom-0 right-0 w-16 h-22 h-[5.5rem] rounded-lg border border-violet-300/15 bg-gradient-to-b from-[#1b1230] to-[#0a0714] flex items-center justify-center text-xl opacity-60"
                    style={{ transform: `translateX(${-i * 14}px) rotate(${rot}deg)` }}
                  >
                    {i === 2 ? '🎃' : ''}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {/* ===== Cards row ===== */}
        <section
          aria-label="Auction cards"
          className="mt-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-4 gap-y-6"
        >
          {AUCTION_CARDS.map((card, i) => (
            <AuctionCard key={card.id} card={card} index={i} />
          ))}
        </section>

        {/* ===== Footer banner ===== */}
        <footer className="mt-6 flex items-center justify-center gap-2">
          <span className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent to-cartel-pumpkin" />
          <div className="r2-btn rounded-full px-6 sm:px-10 py-2 flex items-center gap-3 font-cinzel font-bold uppercase tracking-wider text-lg sm:text-2xl text-cartel-amber">
            <span aria-hidden="true" className="r2-hourglass">⏳</span>
            <span>Round 2 • Bidding Open</span>
          </div>
          <span className="hidden sm:block h-px flex-1 bg-gradient-to-l from-transparent to-cartel-pumpkin" />
        </footer>
      </div>
    </div>
  );
};
