/**
 * HUMAN INTERRUPTION ENGINE (Phase 7)
 *
 * The product NEVER dominates the frame. The product interrupts a
 * human moment — or doesn't appear at all.
 *
 * Decisions per banner:
 *   - whether the product appears (sometimes absence is stronger)
 *   - how much visibility (1-10 scale)
 *   - emotional timing (early/mid/late in the eye-flow)
 *   - interruption intensity
 *
 * Hard rule: if the chosen emotional core's product_role is 'hidden',
 * the product is hidden. The engine never argues with the core.
 *
 * The engine also OVERRIDES the Phase 3 asset-job constraints in one
 * case: a 'sell' job that lands on a heavily-depleted emotional core
 * gets downgraded to 'evidence' product behavior — selling at the
 * bottom of a depletion is the spec's "fake emotional intensity"
 * pattern.
 */

import type { CreativeDirection } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { AssetJob } from './campaignDecision';

export interface InterruptionPlan {
  productAppears: boolean;
  /** 0..10 — how much screen real-estate the product earns. */
  visibility: number;
  /** When the eye finds the product along the flow. */
  emotional_timing: 'early' | 'mid' | 'late' | 'absent';
  /** Intensity of the interruption. */
  intensity: 'silent' | 'background' | 'evidence' | 'gesture' | 'hand-held';
  /** A short briefing line for the image prompt. */
  briefLine: string;
  /** When set, the productRole on the direction should be overridden. */
  productRoleOverride: CreativeDirection['productRole'] | null;
  reasoning: string;
}

export interface InterruptionInput {
  job: AssetJob;
  emotionalCore: EmotionalCore | null;
  direction: CreativeDirection;
}

export function decideHumanInterruption(input: InterruptionInput): InterruptionPlan {
  const { job, emotionalCore, direction } = input;

  // Spec rule: when the emotional core demands hidden product, hidden wins.
  if (emotionalCore && emotionalCore.product_role === 'hidden') {
    return {
      productAppears: false,
      visibility: 0,
      emotional_timing: 'absent',
      intensity: 'silent',
      briefLine: 'no product in this image — the truth carries the brand',
      productRoleOverride: 'hidden',
      reasoning: `emotional core "${emotionalCore.id}" lives in absence; product would intrude`,
    };
  }

  // Override: 'sell' job on a depleted/numb/paralysis core feels like
  // forced emotional intensity. Downgrade to evidence.
  const depletedCores = ['depletion', 'silent-burnout', 'functional-collapse', 'emotional-numbness', 'too-tired-to-rest'];
  if (job === 'sell' && emotionalCore && depletedCores.includes(emotionalCore.id)) {
    return {
      productAppears: true,
      visibility: 3,
      emotional_timing: 'late',
      intensity: 'evidence',
      briefLine: 'product visible as a desk-or-counter object — partial-crop at edge of frame, never centered',
      productRoleOverride: 'desk-proof',
      reasoning: `'sell' on "${emotionalCore.id}" reads as forced — downgrade product to evidence`,
    };
  }

  // Job-driven default.
  switch (job) {
    case 'no-product':
    case 'anti-ad':
    case 'atmosphere':
      return {
        productAppears: false,
        visibility: 0,
        emotional_timing: 'absent',
        intensity: 'silent',
        briefLine: 'no product in the frame — atmosphere does the work',
        productRoleOverride: 'hidden',
        reasoning: `job "${job}" requires absence`,
      };
    case 'curiosity':
    case 'validate':
      return {
        productAppears: true,
        visibility: 4,
        emotional_timing: 'late',
        intensity: 'evidence',
        briefLine: 'product as evidence in the scene — on a table, in a bag, near the subject; cropped at edge',
        productRoleOverride: direction.productRole === 'hand-held' ? 'environmental' : direction.productRole,
        reasoning: `job "${job}" wants the product to be discovered, not announced`,
      };
    case 'educate':
      return {
        productAppears: true,
        visibility: 5,
        emotional_timing: 'mid',
        intensity: 'background',
        briefLine: 'product in the background, in focus enough to read intent but not enough to dominate',
        productRoleOverride: 'background-object',
        reasoning: 'educate jobs benefit from product being legible but quiet',
      };
    case 'sell':
      return {
        productAppears: true,
        visibility: 6,
        emotional_timing: 'mid',
        intensity: 'gesture',
        briefLine: 'product partially in hand or mid-action, never as a clean packshot; surrounded by the scene',
        productRoleOverride: 'partial-crop',
        reasoning: `'sell' job — product is part of the gesture, not the hero`,
      };
    case 'interrupt':
      return {
        productAppears: true,
        visibility: 5,
        emotional_timing: 'late',
        intensity: 'evidence',
        briefLine: 'product as evidence cropped at frame edge — interruption from the human moment, not from the product',
        productRoleOverride: 'partial-crop',
        reasoning: 'the interruption is human; the product is the evidence of it',
      };
  }
}
