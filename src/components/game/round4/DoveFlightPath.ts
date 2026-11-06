export interface Point2D {
  x: number;
  y: number;
}

export interface DoveTransform {
  x: number;
  y: number;
  pitch: number;
  bank: number;
  scale: number;
}

/**
 * Evaluates a cubic Bezier curve at parameter t in [0, 1].
 */
export function evaluateCubicBezier(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Evaluates the first derivative (tangent vector) of cubic Bezier curve at t.
 */
export function evaluateCubicBezierDerivative(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x: 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x),
    y: 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y),
  };
}

export interface DoveFlightPathConfig {
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
  startScale: number;
  endScale: number;
  minPitch?: number;
  maxPitch?: number;
}

/**
 * Calculates natural flight transform with clamped aerodynamic pitch and subtle banking.
 */
export function getDoveTransform(path: DoveFlightPathConfig, t: number): DoveTransform {
  const { p0, p1, p2, p3, startScale, endScale, minPitch = -25, maxPitch = 20 } = path;
  const pos = evaluateCubicBezier(p0, p1, p2, p3, t);
  const vel = evaluateCubicBezierDerivative(p0, p1, p2, p3, t);

  // Tangent angle in degrees
  const rawAngleDeg = (Math.atan2(vel.y, vel.x) * 180) / Math.PI;

  // Clamped realistic bird pitch so the dove never flips or points vertically
  const pitch = Math.max(minPitch, Math.min(maxPitch, rawAngleDeg * 0.65));

  // Rate of turn banking: sample slightly ahead to estimate curvature
  const deltaT = 0.04;
  const nextT = Math.min(1, t + deltaT);
  const nextVel = evaluateCubicBezierDerivative(p0, p1, p2, p3, nextT);
  const curAngle = Math.atan2(vel.y, vel.x);
  const nextAngle = Math.atan2(nextVel.y, nextVel.x);
  const diff = ((nextAngle - curAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
  const bank = Math.max(-14, Math.min(14, (diff * 180) / Math.PI * 1.5));

  const scale = startScale + (endScale - startScale) * t;

  return {
    x: pos.x,
    y: pos.y,
    pitch,
    bank,
    scale,
  };
}

// 1. Approach path: gracefully gliding from upper-left dawn sky toward courtyard pedestal
export const APPROACH_PATH = {
  p0: { x: 6, y: 15 },    // Upper left dawn horizon
  p1: { x: 20, y: 28 },   // Sweeping glide into the courtyard
  p2: { x: 38, y: 52 },   // Descending flare towards pedestal
  p3: { x: 50, y: 68 },   // Directly hovering right above the stone pedestal
  startScale: 0.45,
  endScale: 0.95,
  minPitch: -8,
  maxPitch: 16,
};

// 2. Departure path: soaring upwards from pedestal release to perch on right column ledge
export const PERCH_PATH = {
  p0: { x: 50, y: 68 },   // Above pedestal after letter release
  p1: { x: 62, y: 48 },   // Graceful ascending bank
  p2: { x: 76, y: 28 },   // Approaching column capital
  p3: { x: 88, y: 12 },   // Resting stone ledge on right column
  startScale: 0.95,
  endScale: 0.65,
  minPitch: -26,
  maxPitch: -2,
};
