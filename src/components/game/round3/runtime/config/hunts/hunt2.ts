import { defineClue } from '../clues';
import { MISSIONS } from '../missions';
import type { Hunt } from '../../types';

export const HUNT_2: Hunt = {
  index: 1,
  title: 'The False Memory',
  numeral: 'II',
  premise: 'The entity now distorts memory itself. Compare original rooms with their false Future versions, identify the real manifestation and anchor, and destroy the anchor together.',
  verification: {
    past: {
      kind: 'verification',
      timeline: 'past',
      question: {
        prompt: 'Which patient file is false?',
        options: ['File A (14 March)', 'File B (21 March)', 'Neither'],
        correctIndex: 0,
      },
    },
    future: {
      kind: 'verification',
      timeline: 'future',
      question: {
        prompt: 'When was the transfer really signed?',
        options: ['3:15', '3:40', '4:05'],
        correctIndex: 1,
      },
    },
  },
  sequence: {
    past: { kind: 'sequence', timeline: 'past', steps: [3, 1, 0], reversedWhenFlag: null },
    future: { kind: 'sequence', timeline: 'future', steps: [1, 0, 2], reversedWhenFlag: null },
  },
  missions: MISSIONS,
  clues: [
    defineClue('past', 'desk', null, 'Patient file A', 'Mara Voss, admitted 14 March. Treatment: sedation only. A key is clipped inside.', 'key'),
    defineClue('past', 'shelf', null, 'Fuse (marked 9)', 'Taped: "Ward 9. Do not trust the labels."', 'fuse'),
    defineClue('past', 'gen', 'fuse', 'Generator', 'Lights surge. The walls seem to breathe.', 'power'),
    defineClue('past', 'exam', null, 'Distorted photograph', 'Mara beside the bed. The clock says 3:15. Her reflection shows no one. Mirror runes: ○ ◇ Δ.', 'drawer'),
    defineClue('past', 'cab', 'drawer', 'Patient file B', 'Mara Voss, admitted 21 March. Treatment: electric pulses. The dates contradict file A.', 'arch'),
    defineClue('past', 'dir', null, 'Badge and transfer memo', 'Transfer order signed at 3:40. Initials smudged.', 'badge'),
    defineClue('past', 'book', null, 'Hidden lever', 'Something heavy shifts behind the books.', 'shelf'),
    defineClue('past', 'rec', 'power', 'Interview tape', '"...two false starts, then truth: GREEN opens, AMBER closes..."', 'tape'),
    defineClue('past', 'wall', 'anchor', 'Hidden writing', '"Reflections lie. Reverse what you see."'),
    defineClue('future', 'prints', null, 'Scuffed floor', 'Prints everywhere. Some flicker. Only one thing stands still in the light.'),
    defineClue('future', 'cwall', 'drawer', 'Intake stamp', 'Behind plaster: a stamp reading 21 MARCH.'),
    defineClue('future', 'panel', null, 'Breaker panel', 'RED has no cable. Someone removed it.'),
    defineClue('future', 'mon', 'power', 'Frozen monitor', 'Timestamp frozen at 3:15. Dead clocks lie.'),
    defineClue('future', 'anch', null, 'Temporal anchor', 'The dial turns. A whisper answers from the past.', 'anchor'),
  ],
};
