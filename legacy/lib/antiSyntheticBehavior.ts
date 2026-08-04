/**
 * ANTI-SYNTHETIC BEHAVIOR (Phase 10)
 *
 * The biggest remaining threat at this depth is AI CLEANLINESS.
 *
 * Detects and punishes:
 *   - compositions too coherent
 *   - objects too intentional
 *   - emotional arcs too perfect
 *   - cinematic lighting too balanced
 *   - symbolism too obvious
 *   - "designed virality"
 *   - polished authenticity
 *   - over-curated realism
 *
 * Rewards:
 *   - hesitation
 *   - asymmetry
 *   - accidental humanity
 *   - partial emotional access
 *   - observational feeling
 *   - interrupted framing
 *   - unresolved visual logic
 *
 * Per banner: returns synthetic_score (higher = more synthetic / worse)
 * and a synthetic_signatures list with named offenses.
 */

import type { CreativeDirection, CompositionPlan, TypographyPlan } from '@/core/types';
import type { ReferenceDNA } from './referenceDNA';
import type { FramingPlan } from './humanFraming';
import type { WorldContinuityPlan } from './worldContinuity';
import type { GravityReading } from './visualGravity';

export type SyntheticSignature =
  | 'composition-too-coherent'
  | 'objects-too-intentional'
  | 'arc-too-perfect'
  | 'lighting-too-balanced'
  | 'symbolism-too-obvious'
  | 'designed-virality'
  | 'polished-authenticity'
  | 'over-curated-realism';

export interface SyntheticReading {
  synthetic_score: number;     // 0..10 — higher = worse
  signatures: SyntheticSignature[];
  rewards: string[];           // human-imperfection signals present
  /** True when the banner reads as designed instead of observed. */
  reads_as_designed: boolean;
  notes: string[];
}

export interface SyntheticInput {
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
  dna: ReferenceDNA;
  framing: FramingPlan;
  worldContinuity: WorldContinuityPlan | null;
  gravity: GravityReading;
  truthLength: number;
}

export function detectSyntheticBehavior(input: SyntheticInput): SyntheticReading {
  const { direction, composition, typography, dna, framing, worldContinuity, gravity, truthLength } = input;
  const signatures: SyntheticSignature[] = [];
  const rewards: string[] = [];
  const notes: string[] = [];

  // composition-too-coherent — all systems aligned, no friction
  const verySymmetric = composition.negativeSpaceBias === 'center' && dna.framing_behavior < 0.4;
  if (verySymmetric) {
    signatures.push('composition-too-coherent');
    notes.push('composition is too symmetric — no human friction');
  }
  if (gravity.composite >= 9 && framing.behaviors.length <= 1) {
    signatures.push('composition-too-coherent');
    notes.push('gravity 9+ with single framing behaviour — composition reads as designed');
  }

  // objects-too-intentional — every artifact is "meaningful". Real
  // rooms have an off-key item nobody planned. Detect via low artifact
  // count combined with high emotional density.
  if (worldContinuity && worldContinuity.artifacts.length >= 3 && dna.emotional_density > 0.8) {
    signatures.push('objects-too-intentional');
    notes.push('three artifacts each carrying named meaning — the room reads as art-direction not life');
  }

  // arc-too-perfect — exact dnaDocumentary AND luxury_restraint AND
  // anti_commercial_feel all high (rare-but-possible for a perfect
  // editorial banner — flag for vigilance).
  if (dna.documentary_weight > 0.85 && dna.luxury_restraint > 0.85 && dna.anti_commercial_feel > 0.85) {
    signatures.push('arc-too-perfect');
    notes.push('every cinematic axis maxed — risks reading as showcase, not life');
  }

  // lighting-too-balanced — DNA.visual_temperature exactly mid-band
  // (0.45..0.55) AND restraint > 0.7. Honest scenes lean warm OR cool.
  if (dna.visual_temperature >= 0.45 && dna.visual_temperature <= 0.55 && direction.restraint > 0.7) {
    signatures.push('lighting-too-balanced');
    notes.push('lighting temperature too neutral — honest rooms lean warm or cool');
  }

  // symbolism-too-obvious — single product role + explicit headline
  // that names the contradiction directly.
  if (direction.productRole === 'hand-held' && truthLength > 0 && truthLength < 50 && direction.typographyDominance === 'loud') {
    signatures.push('symbolism-too-obvious');
    notes.push('headline + held product — the symbol is too on-the-nose');
  }

  // designed-virality — low restraint + loud typography + a hooky
  // tension pattern OR aggressive CTA.
  if (direction.restraint < 0.4 && direction.typographyDominance === 'loud' && direction.ctaBehavior === 'corner') {
    signatures.push('designed-virality');
    notes.push('loud + low-restraint + corner-CTA = engagement-optimised, not human');
  }

  // polished-authenticity — high realism_type AND high luxury_restraint
  // AND high silence_ratio. Performed documentary.
  if (dna.realism_type > 0.85 && dna.luxury_restraint > 0.8 && dna.silence_ratio > 0.75) {
    signatures.push('polished-authenticity');
    notes.push('every authenticity axis maxed — risks reading as performed documentary');
  }

  // over-curated-realism — three+ tagged details + every object known
  // by name + everything in focus. (We approximate via dna.realism_type
  // very high AND dna.camera_energy very low — no hand-held wobble.)
  if (dna.realism_type > 0.85 && dna.camera_energy < 0.15) {
    signatures.push('over-curated-realism');
    notes.push('realism high but camera too still — the lens does not wobble');
  }

  // ─── rewards (human imperfection) ─────────────────────────────
  if (framing.behaviors.includes('accidental-crop-pressure')) rewards.push('accidental crop pressure');
  if (framing.behaviors.includes('handheld-asymmetry')) rewards.push('handheld asymmetry');
  if (framing.behaviors.includes('off-balance-horizon')) rewards.push('off-balance horizon');
  if (framing.behaviors.includes('near-missed-framing')) rewards.push('near-missed framing');
  if (framing.behaviors.includes('documentary-hesitation')) rewards.push('documentary hesitation');
  if (framing.behaviors.includes('partial-face')) rewards.push('partial emotional access');
  if (gravity.dead_zones >= 2 && gravity.dead_zones <= 5) rewards.push('honest unused space');
  if (truthLength > 0 && truthLength < 80) rewards.push('truth short enough to be observed, not explained');
  if (typography.primary.size <= 50 || direction.typographyDominance === 'whisper') rewards.push('typography whispering');
  if (dna.camera_energy >= 0.3 && dna.camera_energy <= 0.6) rewards.push('camera energy in the honest band');

  // ─── synthetic score ──────────────────────────────────────────
  // Each signature adds ~1.5; rewards subtract ~0.4; capped.
  const synthetic_score = Math.max(0, Math.min(10,
    signatures.length * 1.6 - rewards.length * 0.45 + (rewards.length === 0 ? 1.5 : 0),
  ));

  const reads_as_designed = synthetic_score >= 6;
  if (reads_as_designed) notes.push(`banner reads as DESIGNED — synthetic score ${synthetic_score.toFixed(1)}/10`);
  if (notes.length === 0) notes.push('banner reads as observed, not designed');

  return { synthetic_score, signatures, rewards, reads_as_designed, notes };
}
