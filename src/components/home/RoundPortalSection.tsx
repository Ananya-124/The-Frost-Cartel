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
      aria-label="The Three Cursed Rounds"
      className="w-full max-w-5xl mx-auto px-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 items-start justify-items-center">
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
