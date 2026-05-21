/**
 * VISUAL GRAVITY ENGINE (Phase 8)
 *
 * Calculates where the eye lands first, second, third — and what
 * happens when it gets there. The system asks:
 *
 *   "Where does the eye emotionally land?"
 *
 * Six metrics:
 *  - focal dominance       — does ONE zone clearly hold the eye?
 *  - tension balance       — is the visual pull distributed honestly?
 *  - dead zones            — are there exhausted corners with no purpose?
 *  - accidental crowding   — are non-aligned zones too close, fighting?
 *  - competing anchors     — do two anchors compete for the same eye?
 *  - eye escape points     — does the eye have a place to land at rest?
 *
 * The engine builds on Phase 2.5's visual-psychology (which scored
 * the eye-flow path). Phase 8 looks at the WHOLE layout's gravity
 * as a single field — not the path through it.
 */

import type { CompositionPlan, CreativeDirection, TypographyPlan, Zone } from '@/core/types';

export interface GravityReading {
  focal_dominance: number;          // 0..10 — higher = ONE clear anchor
  tension_balance: number;          // 0..10 — higher = better-distributed
  dead_zones: number;               // 0..10 — higher = WORSE (exhausted space)
  accidental_crowding: number;      // 0..10 — higher = WORSE (zones fighting)
  competing_anchors: number;        // 0..10 — higher = WORSE (eye doesn't know where to look)
  eye_escape_points: number;        // 0..10 — higher = better (the eye can rest)
  /** Composite — higher = better gravity. */
  composite: number;
  /** Where the eye emotionally lands first/second/third. */
  eye_journey: Array<{ at: 'focal' | 'typography' | 'product' | 'cta' | 'timestamp' | 'empty'; xy: [number, number] }>;
  notes: string[];
  /** Hard reject if true. Set when the layout has competing anchors
   *  or no clear focal at all. */
  rejection_reason: string | null;
}

export interface GravityInput {
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
}

export function analyzeVisualGravity(input: GravityInput): GravityReading {
  const { direction, composition, typography } = input;
  const notes: string[] = [];

  // Collect candidate "weight points" — every zone with intent.
  type Weight = { at: GravityReading['eye_journey'][number]['at']; xy: [number, number]; mass: number; zone: Zone };
  const points: Weight[] = [];

  // Focal — always present, mass driven by area.
  const focalArea = composition.focal.w * composition.focal.h;
  points.push({ at: 'focal', xy: center(composition.focal), mass: 0.6 + focalArea * 0.8, zone: composition.focal });

  // Primary typography — mass driven by size relative to a 1080 reference frame.
  const primaryTypoZone = composition.typoZones.primary;
  if (typography.primary.size > 0 && primaryTypoZone) {
    const typoMass = Math.min(1.4, typography.primary.size / 80);
    points.push({ at: 'typography', xy: center(primaryTypoZone), mass: typoMass, zone: primaryTypoZone });
  }
  // Secondary typography.
  if (typography.secondary && composition.typoZones.secondary) {
    points.push({ at: 'typography', xy: center(composition.typoZones.secondary), mass: 0.5, zone: composition.typoZones.secondary });
  }
  // Timestamp.
  if (typography.timestamp && composition.typoZones.timestamp) {
    points.push({ at: 'timestamp', xy: center(composition.typoZones.timestamp), mass: 0.7, zone: composition.typoZones.timestamp });
  }
  // CTA.
  points.push({ at: 'cta', xy: center(composition.typoZones.cta), mass: 0.35, zone: composition.typoZones.cta });
  // Product.
  if (composition.productZone) {
    const productArea = composition.productZone.w * composition.productZone.h;
    const productMass = direction.productRole === 'hidden' ? 0 : 0.4 + productArea * 0.6;
    points.push({ at: 'product', xy: center(composition.productZone), mass: productMass, zone: composition.productZone });
  }

  // ─── focal_dominance ──────────────────────────────────────────
  const totalMass = points.reduce((a, b) => a + b.mass, 0);
  const focalMass = points.find((p) => p.at === 'focal')!.mass;
  const focalShare = totalMass > 0 ? focalMass / totalMass : 0;
  // Healthy band: focal carries 40-60% of total mass.
  const focal_dominance = clamp10(
    focalShare >= 0.4 && focalShare <= 0.65 ? 9 :
    focalShare > 0.65 ? 7 :
    focalShare < 0.25 ? 3 : 6,
  );

  // ─── competing_anchors ────────────────────────────────────────
  // Two non-focal zones with similar mass (>=0.7) and similar prominence
  // = competing for the same eye.
  const sortedByMass = points.slice().sort((a, b) => b.mass - a.mass);
  let competing_anchors = 0;
  if (sortedByMass.length >= 2) {
    const top = sortedByMass[0];
    const second = sortedByMass[1];
    const massRatio = second.mass / Math.max(top.mass, 0.001);
    if (massRatio > 0.85 && top.at !== second.at) {
      competing_anchors = 8;
      notes.push(`${top.at} and ${second.at} compete with mass ratio ${massRatio.toFixed(2)}`);
    } else if (massRatio > 0.7) {
      competing_anchors = 5;
    } else {
      competing_anchors = 2;
    }
  }

  // ─── accidental_crowding ──────────────────────────────────────
  // Any two non-aligned zones whose centers are within 0.12 of each
  // other's diagonal — crowding.
  let crowding = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i], b = points[j];
      const d = Math.hypot(a.xy[0] - b.xy[0], a.xy[1] - b.xy[1]);
      if (d < 0.16 && a.at !== b.at && !zonesAdjacent(a.zone, b.zone)) {
        crowding += 3;
        notes.push(`${a.at} and ${b.at} crowd each other (distance ${d.toFixed(2)})`);
      }
    }
  }
  const accidental_crowding = clamp10(crowding);

  // ─── tension_balance ──────────────────────────────────────────
  // Compute the center-of-mass of all zones. A healthy banner has
  // tension between two regions (typically focal + typography),
  // measured by how far the center-of-mass is from each.
  const com = centerOfMass(points);
  const focalDist = Math.hypot(com[0] - center(composition.focal)[0], com[1] - center(composition.focal)[1]);
  const typoDist = primaryTypoZone
    ? Math.hypot(com[0] - center(primaryTypoZone)[0], com[1] - center(primaryTypoZone)[1])
    : focalDist;
  // The two distances should be in the same ballpark (tension is honest).
  const ratio = Math.min(focalDist, typoDist) / Math.max(focalDist, typoDist, 0.01);
  const tension_balance = clamp10(ratio * 10);

  // ─── dead_zones ───────────────────────────────────────────────
  // Sample a 4x4 grid. A cell that contains no zone center AND is more
  // than 0.30 from every zone is a dead zone.
  let deadCells = 0;
  for (let gx = 0; gx < 4; gx++) {
    for (let gy = 0; gy < 4; gy++) {
      const px = (gx + 0.5) / 4;
      const py = (gy + 0.5) / 4;
      const minDist = Math.min(...points.map((p) => Math.hypot(p.xy[0] - px, p.xy[1] - py)));
      if (minDist > 0.30) deadCells += 1;
    }
  }
  // Some dead cells are GOOD — they are the negative space. We only
  // penalise when there are 6+ dead cells out of 16 (38% of the layout
  // is unused without intent).
  const dead_zones = clamp10(Math.max(0, deadCells - 5) * 2);

  // ─── eye_escape_points ────────────────────────────────────────
  // The eye needs a "rest" — a region of low mass it can return to.
  // We reward 2-4 dead cells (not too few, not too many).
  const eye_escape_points = clamp10(
    deadCells >= 2 && deadCells <= 5 ? 9 :
    deadCells === 1 || deadCells === 6 ? 6 :
    deadCells === 0 ? 3 :  // no escape — crowded
    4,                      // 7+ — too much dead space, eye gets lost
  );

  // ─── eye journey ──────────────────────────────────────────────
  // First: highest-mass zone. Second: next-highest. Third: ascending toward CTA.
  const eye_journey: GravityReading['eye_journey'] = [];
  const sorted = sortedByMass.slice(0, 3);
  for (const s of sorted) eye_journey.push({ at: s.at, xy: s.xy });
  // If CTA wasn't in the top-3, append it as the final landing.
  if (!eye_journey.some((p) => p.at === 'cta')) {
    const cta = points.find((p) => p.at === 'cta');
    if (cta) eye_journey.push({ at: 'cta', xy: cta.xy });
  }

  // ─── composite ────────────────────────────────────────────────
  const positives = [focal_dominance, tension_balance, eye_escape_points];
  const negatives = [dead_zones, accidental_crowding, competing_anchors];
  const posAvg = positives.reduce((a, b) => a + b, 0) / positives.length;
  const negAvg = negatives.reduce((a, b) => a + b, 0) / negatives.length;
  const composite = clamp10(posAvg * 0.65 + (10 - negAvg) * 0.35);

  // ─── rejection_reason ─────────────────────────────────────────
  let rejection_reason: string | null = null;
  if (competing_anchors >= 7) {
    rejection_reason = 'two anchors compete for the same eye — the layout has no single emotional landing';
  } else if (focal_dominance <= 4 && eye_journey.length < 2) {
    rejection_reason = 'no clear focal — the eye does not land anywhere on purpose';
  } else if (accidental_crowding >= 7) {
    rejection_reason = 'zones crowd each other — composition is fighting itself';
  }
  if (notes.length === 0) notes.push('eye lands cleanly');

  return {
    focal_dominance,
    tension_balance,
    dead_zones,
    accidental_crowding,
    competing_anchors,
    eye_escape_points,
    composite,
    eye_journey,
    notes,
    rejection_reason,
  };
}

function center(z: Zone): [number, number] { return [z.x + z.w / 2, z.y + z.h / 2]; }
function centerOfMass(points: Array<{ xy: [number, number]; mass: number }>): [number, number] {
  const total = points.reduce((a, b) => a + b.mass, 0);
  if (total === 0) return [0.5, 0.5];
  let x = 0, y = 0;
  for (const p of points) {
    x += p.xy[0] * p.mass;
    y += p.xy[1] * p.mass;
  }
  return [x / total, y / total];
}
function zonesAdjacent(a: Zone, b: Zone): boolean {
  // True if a is the typography zone next to its own CTA (sequential text stack).
  const aBottom = a.y + a.h;
  const bTop = b.y;
  return Math.abs(aBottom - bTop) < 0.04;
}
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
