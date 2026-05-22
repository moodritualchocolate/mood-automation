/**
 * VISUAL INTERRUPTION MAP (Phase 29 — Attention Physics / Wave 2)
 *
 * Maps where and how the frame interrupts the eye. Distinguishes a
 * TRUE interruption (a focal that breaks an internal pattern) from a
 * LOUD interruption (size / contrast / product used as a shout).
 */

import type { CompositionPlan, CreativeDirection } from '@/core/types';
import type { GravityReading } from './visualGravity';

export interface VisualInterruptionMapReading {
  /** 0..10 — strength of the genuine interruption. */
  true_interruption: number;
  /** 0..10 — how much the frame leans on loud / size interruption. */
  loud_interruption: number;
  /** True when the product is being used as the interruption. */
  product_as_interruption: boolean;
  /** 0..10 — attention leakage: how much the eye drains out of frame. */
  attention_leakage: number;
  notes: string[];
}

export interface VisualInterruptionMapInput {
  composition: CompositionPlan;
  direction: CreativeDirection;
  gravity: GravityReading | null;
}

export function readVisualInterruptionMap(input: VisualInterruptionMapInput): VisualInterruptionMapReading {
  const { composition, direction, gravity } = input;
  const notes: string[] = [];

  // True interruption — a single dominant focal that the gravity
  // engine reads as coherent.
  const focalDominance = gravity?.composite ?? 5;
  const competing = gravity?.dead_zones ?? 5;
  const true_interruption = round1(Math.max(0, Math.min(10, focalDominance - competing * 0.3)));

  // Loud interruption — loud typography + low restraint + a large
  // product zone.
  const loudType = direction.typographyDominance === 'loud' ? 4 : 0;
  const lowRestraint = direction.restraint < 0.4 ? 3 : 0;
  const bigProduct = composition.productZone
    ? (composition.productZone.w * composition.productZone.h > 0.18 ? 3 : 0)
    : 0;
  const loud_interruption = Math.min(10, loudType + lowRestraint + bigProduct);

  const product_as_interruption = bigProduct > 0 && true_interruption < 5;

  // Attention leakage — focal near an edge drains the eye out.
  const f = composition.focal;
  const nearEdge = f.x < 0.12 || f.x + f.w > 0.88 || f.y < 0.12 || f.y + f.h > 0.88;
  const attention_leakage = round1(Math.min(10, (nearEdge ? 5 : 1) + competing * 0.4));

  if (product_as_interruption) notes.push('visual interruption: the product is being used as the interruption instead of human recognition');
  if (loud_interruption >= 6 && true_interruption < 5) notes.push('visual interruption: the frame interrupts by being loud, not by being true');
  notes.push(`visual interruption: true ${true_interruption}/10 vs loud ${loud_interruption}/10, leakage ${attention_leakage}/10`);

  return { true_interruption, loud_interruption, product_as_interruption, attention_leakage, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
