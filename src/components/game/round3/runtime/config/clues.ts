import type { Clue, ClueRequirement, InteractableId, ProgressFlag, Timeline } from '../types';

/** Compact constructor so hunt files read like the original clue tables. */
export const defineClue = (
  timeline: Timeline,
  objectId: InteractableId,
  requires: ClueRequirement | null,
  title: string,
  text: string,
  grants: ProgressFlag | null = null,
): Clue => ({ timeline, objectId, requires, title, text, grants, dangerous: false });

/** The cursed mirror: available in every hunt, always dangerous evidence. */
export const MIRROR_CLUE: Clue = {
  timeline: 'future',
  objectId: 'mirror',
  requires: null,
  title: 'Cursed mirror',
  text: 'Your reflection mouths: "Do not trust the loud one." The lights shriek.',
  grants: null,
  dangerous: true,
};
