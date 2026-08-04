/**
 * COGNITIVE ENTRY POINT (Phase 29 — Attention Physics / Wave 2)
 *
 * Identifies where the eye first lands and whether that entry point
 * is a HUMAN one (a face, a gesture, an emotionally-loaded object) or
 * a synthetic one (centred geometry, a logo, raw typography).
 */

import type { CompositionPlan, CreativeDirection, VisualPsychology } from '@/core/types';

export interface CognitiveEntryPointReading {
  /** Where the eye lands first. */
  first_glance_anchor: CreativeDirection['focalPoint'];
  /** True when the entry point is a human one. */
  human_entry: boolean;
  /** 0..10 — how much cognitive friction the entry costs. */
  cognitive_friction: number;
  /** {x,y} of the computed entry point. */
  entry: { x: number; y: number };
  notes: string[];
}

export interface CognitiveEntryPointInput {
  composition: CompositionPlan;
  direction: CreativeDirection;
  psychology: VisualPsychology | null;
}

const HUMAN_ANCHORS = new Set<CreativeDirection['focalPoint']>([
  'human-face', 'hands', 'gesture', 'product-in-hand',
]);

export function readCognitiveEntryPoint(input: CognitiveEntryPointInput): CognitiveEntryPointReading {
  const { composition, direction, psychology } = input;
  const notes: string[] = [];

  const first_glance_anchor = direction.focalPoint;
  const human_entry = HUMAN_ANCHORS.has(first_glance_anchor);

  const entry = psychology?.entryPoint
    ?? { x: composition.focal.x + composition.focal.w / 2, y: composition.focal.y + composition.focal.h / 2 };

  // Friction rises when the entry point is dead-centre (synthetic) or
  // when the focal is not a human anchor.
  const centred = Math.abs(entry.x - 0.5) < 0.08 && Math.abs(entry.y - 0.5) < 0.08;
  let cognitive_friction = 3;
  if (centred) cognitive_friction += 3;
  if (!human_entry) cognitive_friction += 2;
  if (direction.focalPoint === 'object' && direction.productRole !== 'hidden') cognitive_friction += 1;
  cognitive_friction = Math.min(10, cognitive_friction);

  notes.push(`cognitive entry point: ${first_glance_anchor}${human_entry ? ' (human)' : ' (non-human)'} — friction ${cognitive_friction}/10`);
  if (centred) notes.push('cognitive entry: the eye enters dead-centre — a synthetic, assembled entry');

  return { first_glance_anchor, human_entry, cognitive_friction, entry, notes };
}
