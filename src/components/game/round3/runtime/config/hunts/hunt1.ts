import { defineClue } from '../clues';
import { MISSIONS } from '../missions';
import type { Hunt } from '../../types';

export const HUNT_1: Hunt = {
  index: 0,
  title: 'The Hollow Witness',
  numeral: 'I',
  premise: 'The resonance transmitter is still active, feeding the entity through the facility wiring. Recover the shutdown procedure across the Past and Future, then disable the machine together.',
  verification: {
    past: {
      kind: 'verification',
      timeline: 'past',
      question: {
        prompt: 'Which breaker was already dead in the future?',
        options: ['BLUE', 'RED', 'GREEN'],
        correctIndex: 1,
      },
    },
    future: {
      kind: 'verification',
      timeline: 'future',
      question: {
        prompt: 'How must the burnt runes be read?',
        options: ['Left to right', 'Right to left', 'Top to bottom'],
        correctIndex: 1,
      },
    },
  },
  sequence: {
    past: { kind: 'sequence', timeline: 'past', steps: [1, 0, 3], reversedWhenFlag: null },
    future: { kind: 'sequence', timeline: 'future', steps: [2, 1, 0], reversedWhenFlag: null },
  },
  missions: MISSIONS,
  clues: [
    defineClue('past', 'desk', null, 'Brass key', 'Tagged ARCHIVE. Scribbled: "Hollow things fear current, not light."', 'key'),
    defineClue('past', 'shelf', null, 'Spare fuse', 'A 40A fuse for the old generator. Still warm.', 'fuse'),
    defineClue('past', 'gen', 'fuse', 'Generator', 'The engine shudders awake. Far away, lamps hum.', 'power'),
    defineClue('past', 'exam', null, 'Photograph', 'Runes on the wall: ◇ Δ ○. Caption: "read right to left". A drawer key is taped behind it.', 'drawer'),
    defineClue('past', 'cab', 'drawer', 'Report, part A', '"Subject unravels under three pulses of current. Pulse one is cold. Amber is never last."', 'arch'),
    defineClue('past', 'dir', null, 'Badge and memo', '"Subject circles the lab at night, leaving wet prints. Powered tape records it."', 'badge'),
    defineClue('past', 'book', null, 'Hidden lever', 'The bookcase groans aside. A sealed way to Observation opens.', 'shelf'),
    defineClue('past', 'rec', 'power', 'Damaged tape', 'Static, then: "...the third pulse is never red..."', 'tape'),
    defineClue('past', 'wall', 'anchor', 'Hidden writing', 'Glowing letters: "It waits where the footprints end."'),
    defineClue('future', 'prints', null, 'Footprints', 'Wet prints loop twice. Some wanderers leave none.'),
    defineClue('future', 'cwall', 'drawer', 'Wall compartment', 'Runes burnt left to right: ◇ Δ ○. Nothing says how to read them.'),
    defineClue('future', 'panel', null, 'Breaker panel', 'RED is burnt black. It never carried current.'),
    defineClue('future', 'mon', 'power', 'Security monitor', 'Flickers: the entity lingers near the Experiment Chamber.'),
    defineClue('future', 'anch', null, 'Temporal anchor', 'You turn the dial. Something in the past answers.', 'anchor'),
  ],
};
