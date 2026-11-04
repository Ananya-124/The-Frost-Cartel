import React from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { TreasureDove } from './TreasureDove';

interface DoveFlightAnimationProps {
  state: Round4IntroState;
  onDropComplete: () => void;
  onDovePerched?: () => void;
  isMuted: boolean;
}

export const DoveFlightAnimation: React.FC<DoveFlightAnimationProps> = ({
  state,
  onDropComplete,
  onDovePerched = () => {},
  isMuted,
}) => {
  return (
    <TreasureDove
      state={state}
      onLetterDrop={onDropComplete}
      onDovePerched={onDovePerched}
      isMuted={isMuted}
    />
  );
};
