/**
 * PRODUCT GRAVITY (Phase 30 — Visual Cognition / Wave 2)
 *
 * Reads whether the product BELONGS to the world of the frame or sits
 * on top of it. A product with real gravity is held by the scene's
 * physics; a pasted product floats.
 */

import type { CompositionPlan, CreativeDirection } from '@/core/types';

export interface ProductGravityReading {
  /** 0..10 — how much the product belongs to the world. */
  belongs_to_world: number;
  /** 0..10 — how pasted / inserted the product reads (higher = worse). */
  pasted_risk: number;
  /** True when the product has real physical logic in the scene. */
  has_physical_logic: boolean;
  notes: string[];
}

export interface ProductGravityInput {
  composition: CompositionPlan;
  direction: CreativeDirection;
}

const BELONGING_ROLES = new Set<CreativeDirection['productRole']>([
  'hidden', 'environmental', 'table-object', 'background-object', 'partial-crop',
]);
const RISKY_ROLES = new Set<CreativeDirection['productRole']>([
  'hand-held', 'foreground-blur', 'desk-proof', 'emotional-proof',
]);

export function readProductGravity(input: ProductGravityInput): ProductGravityReading {
  const { composition, direction } = input;
  const notes: string[] = [];

  if (direction.productRole === 'hidden' || composition.productZone === null) {
    return {
      belongs_to_world: 8, pasted_risk: 1, has_physical_logic: true,
      notes: ['product gravity: product is absent / hidden — it cannot be pasted'],
    };
  }

  const z = composition.productZone;
  const area = z.w * z.h;

  let belongs_to_world = 5;
  if (BELONGING_ROLES.has(direction.productRole)) belongs_to_world += 3;
  if (RISKY_ROLES.has(direction.productRole)) belongs_to_world -= 1;
  // A product zone resting low in frame reads gravity-held; one
  // floating high-centre reads pasted.
  const restsLow = z.y + z.h > 0.6;
  if (restsLow) belongs_to_world += 1.5;
  // A huge product zone with low restraint reads pasted-on.
  const oversized = area > 0.22;
  if (oversized && direction.restraint < 0.5) belongs_to_world -= 3;
  belongs_to_world = clamp10(round1(belongs_to_world));

  let pasted_risk = 0;
  if (oversized) pasted_risk += 3;
  if (!restsLow && RISKY_ROLES.has(direction.productRole)) pasted_risk += 3;
  if (direction.restraint < 0.4) pasted_risk += 2;
  pasted_risk = clamp10(pasted_risk);

  const has_physical_logic = belongs_to_world >= 6 && pasted_risk < 5;

  notes.push(`product gravity: belongs ${belongs_to_world}/10, pasted-risk ${pasted_risk}/10`);
  if (!has_physical_logic) notes.push('product gravity: the product does not belong to the world — it reads pasted');

  return { belongs_to_world, pasted_risk, has_physical_logic, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
