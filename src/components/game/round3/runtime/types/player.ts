export type PlayerIndex = 0 | 1;
export type Timeline = 'past' | 'future';
export type RoleName = 'Archivist' | 'Tracker';

export interface Player {
  index: PlayerIndex;
  role: RoleName;
  timeline: Timeline;
  x: number;
  y: number;
  /** Game time before which the locked-door message may not show again. */
  doorMessageUntil: number;
  /** Game time at which this player armed the capture, or null. */
  syncArmedAt: number | null;
}

/** Render-only pose data calculated by Renderer from consecutive positions. */
export interface CharacterPose {
  facingX: number;
  facingY: number;
  moving: boolean;
  phase: number;
}
