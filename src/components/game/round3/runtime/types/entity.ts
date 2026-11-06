export interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

export interface Entity {
  x: number;
  y: number;
  /** Current wander target. */
  targetX: number;
  targetY: number;
  /** True for the single real entity; the others are decoys. */
  real: boolean;
  /** Whether this entity leaves a visible trail in the Future. */
  leavesTrail: boolean;
  trail: TrailPoint[];
  trailTimer: number;
  /** Countdown to the next teleport (Hunt III). */
  teleportTimer: number;
  /** True once a wrong mark has already punished the team for this decoy. */
  penalized: boolean;
  /** True once the Tracker has marked it. */
  marked: boolean;
  /** True once captured or dissolved. */
  gone: boolean;
}
