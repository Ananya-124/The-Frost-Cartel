import React from 'react';
import './WinnerCelebrationModal.css';

interface NonWinnerModalProps {
  mySolvedCount: number;
  myRouteRomanNumeral: string;
  onExit: () => void;
}

export const NonWinnerModal: React.FC<NonWinnerModalProps> = ({
  mySolvedCount,
  myRouteRomanNumeral,
  onExit,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tournament Finished Notice"
      className="winner-scene non-winner-scene fixed inset-0 z-50 overflow-hidden select-none"
    >
      <main className="winner-artwork non-winner-artwork">
        <img
          className="winner-artwork-image non-winner-artwork-image"
          src="/assets/round-04/winner-celebration.png"
          alt="Skeletons celebrating on a victory pedestal"
        />
        <div className="non-winner-plaque-cover" aria-hidden="true" />
        <div className="non-winner-figures-cover" aria-hidden="true" />
        <div className="non-winner-skeletons" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((dancer) => (
            <svg key={dancer} className={`non-winner-skeleton non-winner-skeleton--${dancer + 1}`} viewBox="0 0 70 210" fill="none">
              <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M35 8c-13 0-20 9-20 21 0 8 4 14 11 17l-1 10h20l-1-10c7-3 11-9 11-17C55 17 48 8 35 8Z" fill="#d4c4a4" strokeWidth="4" />
                <path d="M25 33h6m8 0h6m-19 7 9 2 9-2M35 56v60m-18-49 18 10 18-10M17 67l-8 30m8-30 8 31m28-31 8 30m-8-30-8 31M24 91l11-6 11 6m-22 0 11 7 11-7m-11-2v14m-11 12-4 35m4-35 11 8m11-20 4 35m-4-35-11 8m-15 9 15-3 15 3m-25 0-6 43m6-43 10 2 10-2m-10 0v41m10-41 6 43" strokeWidth="5" />
                <path d="m18 155-5 36m5-36 15 2m9-2 15 36m-15-36-8 2m-21 34-5 5h17l3-5m24 1 3 4h17l-5-5" strokeWidth="6" />
              </g>
            </svg>
          ))}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="winner-return non-winner-return"
          aria-label={`Return to Exterior from route ${myRouteRomanNumeral}, ${mySolvedCount} clues completed`}
        >
        </button>
      </main>
    </div>
  );
};

