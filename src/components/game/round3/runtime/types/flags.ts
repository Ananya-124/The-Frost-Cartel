/**
 * Progress flags. In the original game these were keys of the global `G.F`
 * object. Short names from the original are noted in comments.
 */
export type ProgressFlag =
  | 'key'
  | 'fuse'
  | 'drawer'
  | 'arch'
  | 'power'
  | 'badge'
  | 'shelf'
  | 'tape'
  | 'anchor'
  | 'pastVerified' // original: wa
  | 'futureVerified' // original: wf
  | 'pastNodeReady' // original: pOK
  | 'futureNodeReady'; // original: fOK

/** Flags a door can be locked behind. */
export type DoorLock = Extract<ProgressFlag, 'key' | 'badge' | 'arch' | 'power' | 'shelf'>;

/** Flags that a clue can require before it can be examined. */
export type ClueRequirement = Extract<ProgressFlag, 'fuse' | 'drawer' | 'power' | 'anchor'>;

export type FlagSet = Partial<Record<ProgressFlag, boolean>>;
