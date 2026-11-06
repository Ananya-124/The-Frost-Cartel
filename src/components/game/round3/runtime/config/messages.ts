import type { ClueRequirement, DoorLock, ProgressFlag } from '../types';

/** Shown when a clue's requirement is not yet met. */
export const REQUIREMENT_MESSAGES: Record<ClueRequirement, string> = {
  fuse: 'It needs a fuse.',
  drawer: 'Locked. A small key is needed.',
  power: 'Dead. No power.',
  anchor: 'Only a blank surface… for now.',
};

/** Shown when a player bumps into a closed door. */
export const DOOR_LOCK_MESSAGES: Record<DoorLock, string> = {
  key: 'It is locked. A key must exist somewhere.',
  badge: 'A badge reader blinks red.',
  arch: 'Rubble blocks the way.',
  power: 'No power reaches this door.',
  shelf: 'A sealed wall. There must be a mechanism.',
};

export interface FlagAnnouncement {
  text: string;
  /** Major flags play a deeper sound. */
  major: boolean;
}

/** Announced to both players when a flag is granted. */
export const FLAG_ANNOUNCEMENTS: Partial<Record<ProgressFlag, FlagAnnouncement>> = {
  power: {
    text: 'Power restored in the Past. Lamps flicker on in the Future Hall, Security, Generator and Containment.',
    major: true,
  },
  arch: {
    text: 'The Archive opens in the Past. Rubble collapses away in the Future.',
    major: true,
  },
  shelf: { text: 'A hidden passage opens in both timelines.', major: true },
  anchor: {
    text: 'The Future anchor hums. Writing glows in the Past Observation Chamber.',
    major: true,
  },
  drawer: {
    text: 'A hidden compartment cracks open in the Future Examination Room.',
    major: true,
  },
  key: { text: 'A lock somewhere clicks.', major: false },
  badge: { text: 'Security badge acquired.', major: false },
};

export const TAPE_MESSAGE =
  'The recording tears at the entity. It is vulnerable, and it is drawn to the Experiment Chamber.';
export const TAPE_SHIFT_MESSAGE =
  'The manifestations SHIFT. Previous marks are void, and the runes rearrange.';
export const START_MESSAGE =
  'You stand in the entrance. Doors will open as you uncover the facility.';
