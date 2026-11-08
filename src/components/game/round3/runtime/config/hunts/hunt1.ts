import type { Hunt } from '../../types';

export const HUNT_1: Hunt = {
  index: 0,
  title: 'The Forgotten Incident',
  numeral: 'I',
  premise: 'Rebuild the final experiment from the Past records and Future damage. Each timeline holds only half the incident; together, uncover what caused the entity to manifest.',
  verification: {
    past: { kind: 'verification', timeline: 'past', question: { prompt: 'How should the historical findings be verified?', options: ['Submit each active Past investigation from the Hunt I task panel', 'Skip the historical evidence', 'Submit the Tracker’s physical findings'], correctIndex: 0 } },
    future: { kind: 'verification', timeline: 'future', question: { prompt: 'How should the physical findings be verified?', options: ['Submit each active Future investigation from the Hunt I task panel', 'Ignore the Future evidence', 'Submit the Archivist’s historical findings'], correctIndex: 0 } },
  },
  sequence: {
    past: { kind: 'sequence', timeline: 'past', steps: [0, 1, 2], reversedWhenFlag: null },
    future: { kind: 'sequence', timeline: 'future', steps: [2, 1, 0], reversedWhenFlag: null },
  },
  missions: {
    past: { timeline: 'past', steps: [], finalObjective: 'Follow the Archivist’s active Hunt I task panel. Examine the listed Past evidence and submit its interpretation.' },
    future: { timeline: 'future', steps: [], finalObjective: 'Follow the Tracker’s active Hunt I task panel. Examine the listed Future evidence and submit its reconstruction.' },
  },
  clues: [],
};
