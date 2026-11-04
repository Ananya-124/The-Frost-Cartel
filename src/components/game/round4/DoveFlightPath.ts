export interface Point2D {
  x: number;
  y: number;
}

export interface DoveTransform {
  x: number;
  y: number;
  rotation: number;
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
 * Evaluates the first derivative (velocity / tangent vector) of cubic Bezier curve at t.
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

/**
 * Calculates position, tangent travel angle, bank angle, and perspective scale for the dove in flight.
 */
export function getDoveTransform(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number,
  startScale: number,
  endScale: number
): DoveTransform {
  const pos = evaluateCubicBezier(p0, p1, p2, p3, t);
  const vel = evaluateCubicBezierDerivative(p0, p1, p2, p3, t);

  // Tangent travel angle in degrees
  const angleRad = Math.atan2(vel.y, vel.x);
  const rotation = (angleRad * 180) / Math.PI;

  // Rate of turn banking: sample slightly ahead to estimate curvature
  const deltaT = 0.04;
  const nextT = Math.min(1, t + deltaT);
  const nextVel = evaluateCubicBezierDerivative(p0, p1, p2, p3, nextT);
  const nextAngleRad = Math.atan2(nextVel.y, nextVel.x);
  const angleDiff = ((nextAngleRad - angleRad + Math.PI) % (2 * Math.PI)) - Math.PI;
  const bank = Math.max(-25, Math.min(25, (angleDiff * 180) / Math.PI * 2.5));

  const scale = startScale + (endScale - startScale) * t;

  return {
    x: pos.x,
    y: pos.y,
    rotation,
    bank,
    scale,
  };
}

// 1. Approach path from distant upper sky to above the stone pedestal
export const APPROACH_PATH = {
  p0: { x: 8, y: 12 },    // Far upper left dawn sky
  p1: { x: 34, y: 6 },    // High sweeping arch under stone vault
  p2: { x: 68, y: 22 },   // Bank downward towards courtyard center
  p3: { x: 50, y: 52 },   // Centered directly above stone pedestal
  startScale: 0.38,
  endScale: 0.88,
};

// 2. Departure path from release point above pedestal to right arch stone ledge
export const PERCH_PATH = {
  p0: { x: 50, y: 52 },   // Pedestal drop release point
  p1: { x: 56, y: 44 },   // Swoop upwards unencumbered
  p2: { x: 74, y: 20 },   // Arch right column trajectory
  p3: { x: 84, y: 8 },    // Resting stone ledge on right column
  startScale: 0.88,
  endScale: 0.52,
};
