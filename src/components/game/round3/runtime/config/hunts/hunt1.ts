import type { Hunt } from '../../types';

export const HUNT_1: Hunt = {
  index: 0,
  title: 'The Forgotten Incident',
  numeral: 'I',
  premise: 'Rebuild the final experiment from the Past records and Future damage. Each timeline holds only half the incident; together, uncover what caused the entity to manifest.',
  verification: {
    past: { kind: 'verification', timeline: 'past', question: { prompt: 'Which record sequence best fits the recovered Past evidence?', options: ['Use the server-verified incident board', 'Guess from the damaged room', 'Skip the archive'], correctIndex: 0 } },
    future: { kind: 'verification', timeline: 'future', question: { prompt: 'Which physical trace agrees with the incident reconstruction?', options: ['Use the server-verified evidence board', 'Ignore the Future damage', 'Assume the report is complete'], correctIndex: 0 } },
  },
  sequence: {
    past: { kind: 'sequence', timeline: 'past', steps: [0, 1, 2], reversedWhenFlag: null },
    future: { kind: 'sequence', timeline: 'future', steps: [2, 1, 0], reversedWhenFlag: null },
  },
  missions: {
    past: { timeline: 'past', steps: [{ objective: 'Inspect the original records in reception, archive, generator, observation, and communications.', completedWhen: 'key' }], finalObjective: 'Use the Past records to reconstruct the incident board.' },
    future: { timeline: 'future', steps: [{ objective: 'Examine the tracks, fragments, damaged circuits, camera, and cable route.', completedWhen: 'arch' }], finalObjective: 'Use the Future evidence to confirm the cause chain.' },
  },
  clues: [],
};
