import React from 'react';

export const WINNER_PHRASES = [
  "DAMN! SOMEONE'S WALLET ACTUALLY HAD A PURPOSE.",
  "THE CARTEL APPROVES. DON'T LET IT GET TO YOUR HEAD.",
  "Look at you! Making questionable financial decisions successfully.",
  "BIG BRAIN. BIG BIDS. QUESTIONABLE LIFE CHOICES.",
  "You didn't come to play. You came to bankrupt yourself.",
  "The auction feared you. Your credits didn't survive.",
  "Main character energy detected.",
  "Congratulations! You bought yourself a headache. A valuable one.",
  "THE CARDS ARE YOURS. THE CONSEQUENCES ARE ALSO YOURS.",
  "Not bad, rookie. Even the ghosts are impressed.",
];

export const LOSER_PHRASES = [
  "FUCK YOU. YOU LOST. THE AUCTION NEVER LOVED YOU.",
  "Congratulations! You successfully wasted your credits.",
  "Bro came to bid, forgot to win.",
  "Jokes on you. Your wallet is empty and your inventory is too.",
  "THE CARTEL SAW YOUR BIDS AND CHOSE TO IGNORE YOU.",
  "You had one job. And somehow, you fumbled it.",
  "Skill issue. Even the ghosts have better inventory.",
  "All that confidence for absolutely NOTHING.",
  "Your ambition was expensive. Your results? FREE.",
  "Better luck next lifetime. This auction wasn't your destiny.",
];

export function getRandomPhrase(type: 'winner' | 'loser'): string {
  const list = type === 'winner' ? WINNER_PHRASES : LOSER_PHRASES;
  return list[Math.floor(Math.random() * list.length)];
}

export interface AuctionOutcomeModalProps {
  isOpen: boolean;
  type: 'winner' | 'loser';
  phrase: string;
  cardName?: string;
  paidPrice?: number;
  winnerTeam?: string;
  isFinalSummary?: boolean;
  onClose: () => void;
}

export const AuctionOutcomeModal: React.FC<AuctionOutcomeModalProps> = ({
  isOpen,
  type,
  phrase,
  cardName,
  paidPrice,
  winnerTeam,
  isFinalSummary,
  onClose,
}) => {
  if (!isOpen) return null;

  const isWinner = type === 'winner';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-2xl overflow-hidden p-6 sm:p-8 text-center select-none shadow-[0_0_60px_rgba(0,0,0,0.95)] transform transition-all animate-scaleUp ${
          isWinner
            ? 'bg-gradient-to-b from-[#1f1505] via-[#120b02] to-[#080401] border-2 border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(251,191,36,0.5)]'
            : 'bg-gradient-to-b from-[#220707] via-[#140303] to-[#0a0101] border-2 border-red-600/80 shadow-[0_0_40px_rgba(239,68,68,0.4),inset_0_1px_2px_rgba(248,113,113,0.4)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Filigree Beam */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
            isWinner
              ? 'from-transparent via-amber-400 to-transparent shadow-[0_0_10px_rgba(245,158,11,0.8)]'
              : 'from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.8)]'
          }`}
        />

        {/* Thematic Emblem Header */}
        <div className="relative mx-auto mb-4 flex items-center justify-center">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 shadow-2xl ${
              isWinner
                ? 'bg-gradient-to-br from-amber-600/30 via-amber-950/60 to-black border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-gradient-to-br from-red-600/30 via-red-950/60 to-black border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
            }`}
          >
            <span className="text-3xl sm:text-4xl" role="img" aria-label={isWinner ? 'Trophy' : 'Skull'}>
              {isWinner ? '👑' : '💀'}
            </span>
          </div>
        </div>

        {/* Modal Title */}
        <h2
          id="outcome-modal-title"
          className={`font-cinzel text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-widest ${
            isWinner
              ? 'text-amber-300 drop-shadow-[0_2px_12px_rgba(245,158,11,0.8)]'
              : 'text-red-400 drop-shadow-[0_2px_12px_rgba(239,68,68,0.8)]'
          }`}
        >
          {isFinalSummary
            ? isWinner
              ? 'AUCTION CHAMPIONS • POWER CARDS SECURED!'
              : 'AUCTION CLOSED • ZERO CARDS WON'
            : isWinner
              ? 'VICTORY! CARD WON'
              : 'AUCTION DEFEAT: OUTBID!'}
        </h2>

        {/* Cartel Subtitle */}
        <p className="font-mono text-[11px] sm:text-xs tracking-wider uppercase text-stone-400 mt-1">
          {isWinner
            ? 'The Cartel Ledger Has Validated Your Purchase'
            : 'The Cartel Has Left You In The Cold'}
        </p>

        {/* Centerpiece Quotation Card with Savage / Sarcastic Humor */}
        <div
          className={`my-5 p-4 sm:p-5 rounded-xl border relative overflow-hidden backdrop-blur-sm ${
            isWinner
              ? 'bg-gradient-to-b from-[#2d1b06]/70 to-[#120a02]/90 border-amber-600/50 shadow-[inset_0_1px_4px_rgba(245,158,11,0.2)]'
              : 'bg-gradient-to-b from-[#330808]/70 to-[#140202]/90 border-red-700/50 shadow-[inset_0_1px_4px_rgba(239,68,68,0.2)]'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute -top-3 -left-1 text-5xl font-serif select-none pointer-events-none opacity-20 ${
              isWinner ? 'text-amber-400' : 'text-red-500'
            }`}
          >
            “
          </span>
          <p
            className={`relative z-10 font-cinzel text-base sm:text-lg md:text-xl font-black leading-snug tracking-wide ${
              isWinner
                ? 'text-amber-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                : 'text-red-200 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
            }`}
          >
            "{phrase}"
          </p>
          <span
            aria-hidden="true"
            className={`absolute -bottom-6 -right-1 text-5xl font-serif select-none pointer-events-none opacity-20 ${
              isWinner ? 'text-amber-400' : 'text-red-500'
            }`}
          >
            ”
          </span>
        </div>

        {/* Card Outcome Details */}
        {cardName && (
          <div className="mb-5 py-2 px-3 rounded-lg bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-stone-300">
              CARD: <strong className="text-white font-cinzel">{cardName}</strong>
            </span>
            {paidPrice !== undefined && (
              <span className={isWinner ? 'text-amber-300 font-bold' : 'text-stone-400'}>
                {isWinner ? `WINNING BID: ${paidPrice} CR` : `SOLD FOR: ${paidPrice} CR ${winnerTeam ? `(to ${winnerTeam})` : ''}`}
              </span>
            )}
          </div>
        )}

        {/* Satirical Cartel Stamp */}
        <div className="mb-6 flex justify-center">
          <span
            className={`inline-block px-3 py-1 rounded text-[10px] font-mono tracking-widest font-black uppercase border ${
              isWinner
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300/90 rotate-[-1deg]'
                : 'bg-red-500/10 border-red-500/40 text-red-400/90 rotate-[1.5deg]'
            }`}
          >
            {isWinner
              ? '[CERTIFIED FINANCIAL MENACE • CARTEL SEALED]'
              : '[EGO DAMAGE: MAXIMUM • SKILL ISSUE REGISTERED]'}
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3 sm:py-3.5 px-6 rounded-xl font-cinzel font-black tracking-widest text-xs sm:text-sm uppercase transition-all duration-300 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
            isWinner
              ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110'
              : 'bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-stone-100 border border-red-400/60 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:brightness-110'
          }`}
        >
          {isWinner ? 'CLAIM GLORY & CONTINUE' : 'ACCEPT YOUR FATE & CONTINUE'}
        </button>
      </div>
    </div>
  );
};
