import { defineClue } from '../clues';
import { MISSIONS } from '../missions';
import type { Hunt } from '../../types';

export const HUNT_3: Hunt = {
  index: 2,
  title: 'The Paradox',
  numeral: 'III',
  premise: 'Three experiments, one truth. Touching the past will rewrite the future.',
  verification: {
    past: {
      kind: 'verification',
      timeline: 'past',
      question: {
        prompt: 'Which experiment record is the original?',
        options: ['Record I', 'Record II', 'Record III'],
        correctIndex: 2,
      },
    },
    future: {
      kind: 'verification',
      timeline: 'future',
      question: {
        prompt: 'After the tape plays, how must the runes be entered?',
        options: ['In the original order', 'In reverse order', 'Skip the last rune'],
        correctIndex: 1,
      },
    },
  },
  sequence: {
    past: { kind: 'sequence', timeline: 'past', steps: [2, 0, 1, 3], reversedWhenFlag: null },
    // Once the tape has played, the Future runes must be entered in reverse.
    future: { kind: 'sequence', timeline: 'future', steps: [0, 3, 1, 2], reversedWhenFlag: 'tape' },
  },
  missions: MISSIONS,
  clues: [
    defineClue('past', 'desk', null, 'Experiment record I', 'Ran 09:00. Four subjects, none survived. A key is stapled to it.', 'key'),
    defineClue('past', 'shelf', null, 'Fuse #3', 'Handwritten: "Never run the generator twice."', 'fuse'),
    defineClue('past', 'gen', 'fuse', 'Generator', 'Power returns. Somewhere a clock skips.', 'power'),
    defineClue('past', 'exam', null, 'Photograph', 'Chamber runes: ◇ ✕ Δ ○, copied exactly. A drawer key behind it.', 'drawer'),
    defineClue('past', 'cab', 'drawer', 'Experiment record II', 'Ran 11:00. Three subjects, one survived.', 'arch'),
    defineClue('past', 'dir', null, 'Badge and record III', 'Ran 13:00. Four subjects, none survived. "Original order: RED opens, GREEN closes."', 'badge'),
    defineClue('past', 'book', null, 'Hidden lever', 'The bookcase slides. Dust falls upward.', 'shelf'),
    defineClue('past', 'rec', 'power', 'Warped tape', '"...cold before leaf... when this plays, the future is undone..."', 'tape'),
    defineClue('past', 'wall', 'anchor', 'Hidden writing', '"Only the chamber floor stays true."'),
    defineClue('future', 'prints', null, 'Chamber residue', 'Four scorch outlines burnt into the hall floor.'),
    defineClue('future', 'cwall', 'drawer', 'Wall compartment', 'A log: "Lights failed 13:05. Four bodies found."'),
    defineClue('future', 'panel', null, 'Breaker panel', 'Past and future wires are crossed together.'),
    defineClue('future', 'mon', 'power', 'Security monitor', 'The rune wall is unreadable. Something erased it.'),
    defineClue('future', 'anch', null, 'Temporal anchor', 'You turn the dial. Past writing glows.', 'anchor'),
  ],
};
