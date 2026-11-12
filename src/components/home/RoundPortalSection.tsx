import React from 'react';
import type { RoundConfig } from '../../types/round.types';
import { RoundPortalCard } from './RoundPortalCard';

interface RoundPortalSectionProps {
  rounds: RoundConfig[];
  onSelectRound: (round: RoundConfig) => void;
}

export const RoundPortalSection: React.FC<RoundPortalSectionProps> = ({
  rounds,
  onSelectRound,
}) => {
  return (
    <section
      aria-label="Frost Cartel Game Rounds"
      className="w-full max-w-7xl mx-auto px-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch justify-items-center">
        {rounds.map((round) => (
          <RoundPortalCard
            key={round.id}
            round={round}
            onSelectRound={onSelectRound}
          />
        ))}
      </div>
    </section>
  );
};
