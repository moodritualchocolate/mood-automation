/**
 * LAYOUT DIRECTOR (Phase 8) — the senior art-director synthesizer.
 *
 * Reads every Phase 8 signal + the relevant Phase 1-7 outputs and
 * produces a director-level decision the meta-critic respects:
 *
 *   composition_archetype     — the chosen frame structure
 *   typography_zone           — where the typography lives in the layout
 *   emotional_crop_strategy   — how the crop creates emotion
 *   object_hierarchy          — which objects matter, in order
 *   visual_silence_zones      — where the eye is allowed to rest
 *   framing_aggression        — how confrontational the camera is
 *   cta_permission_level      — does the CTA earn its presence
 *
 * The director also answers the spec's new meta-critic question:
 *
 *   "Would removing 40% improve this?"
 *
 * If YES, the director sets `would_improve_with_subtraction = true`
 * and the meta-critic refuses.
 */

import type { CompositionPlan, CreativeDirection, Formula } from '@/core/types';
import type { GravityReading } from './visualGravity';
import type { NegativeSpaceReading } from './negativeSpacePsychology';
import type { CompositionRhythmReport } from './compositionRhythm';
import type { PresenceDecision } from './productPresence';
import type { FramingPlan } from './humanFraming';
import type { EmotionalCore } from './humanTruthEngine';
import type { CampaignIdentity } from './campaignIdentity';
import type { AftertasteRecord } from './aftertaste';

export type CompositionArchetype =
  | 'documentary-portrait'        // close, asymmetric, body language carries it
  | 'environmental-witness'        // wide, subject small, the room is the truth
  | 'fragment-close'               // hands / object close, face out
  | 'mirror-and-witness'           // subject + a reflective surface
  | 'doorway-threshold'            // composition through a doorway / frame-within-frame
  | 'overhead-still-life'          // top-down, the scene is the protagonist
  | 'window-side-light'            // single light source from one side, the rest in shadow
  | 'corner-restraint';            // subject in one corner, rest of frame quiet

export interface DirectorVerdict {
  composition_archetype: CompositionArchetype;
  typography_zone: 'lower-left' | 'lower-right' | 'upper-left' | 'upper-right' | 'baseline-spanning' | 'absent';
  emotional_crop_strategy: 'pressed-against-edge' | 'centered-with-breath' | 'asymmetric-with-fall' | 'partial-subject' | 'overhead-distance' | 'corner-anchor';
  object_hierarchy: string[];                     // ordered list — first is most visible
  visual_silence_zones: Array<'top' | 'bottom' | 'left' | 'right' | 'center' | 'corners'>;
  framing_aggression: number;                     // 0..10 — higher = more confrontational
  cta_permission_level: 'forbidden' | 'whisper' | 'integrated' | 'announced';
  would_improve_with_subtraction: boolean;
  subtraction_target: string | null;              // what to remove
  /** Hard-reject conditions named by the director. */
  rejection_conditions: Array<
    | 'looks-assembled'
    | 'product-pasted'
    | 'headline-behaving-like-template'
    | 'composition-too-aware-of-itself'
    | 'too-balanced-to-feel-human'
  >;
  director_note: string;
}

export interface DirectorInput {
  formula: Formula;
  direction: CreativeDirection;
  composition: CompositionPlan;
  emotionalCore: EmotionalCore | null;
  gravity: GravityReading;
  negativeSpace: NegativeSpaceReading;
  rhythm: CompositionRhythmReport;
  presence: PresenceDecision;
  framing: FramingPlan;
  campaignIdentity: CampaignIdentity | null;
  recentAftertaste: AftertasteRecord[];
}

export function direct(input: DirectorInput): DirectorVerdict {
  const {
    formula, direction, composition, emotionalCore,
    gravity, negativeSpace, rhythm, presence, framing,
    campaignIdentity, recentAftertaste,
  } = input;

  // ─── Composition archetype ────────────────────────────────────
  let composition_archetype: CompositionArchetype;
  if (presence.productAbsent && direction.focalPoint === 'environment') composition_archetype = 'environmental-witness';
  else if (direction.focalPoint === 'hands' || direction.focalPoint === 'object') composition_archetype = 'fragment-close';
  else if (direction.layoutFamily === 'editorial-page' && direction.restraint > 0.75) composition_archetype = 'corner-restraint';
  else if (direction.focalPoint === 'human-face' && emotionalCore?.id === 'hyper-awareness') composition_archetype = 'mirror-and-witness';
  else if (direction.focalPoint === 'human-face' && (emotionalCore?.id === 'social-performance-exhaustion' || emotionalCore?.id === 'avoidance')) composition_archetype = 'doorway-threshold';
  else if (direction.focalPoint === 'empty-space') composition_archetype = 'overhead-still-life';
  else if (direction.emotionalPacing === 'quiet' || direction.emotionalPacing === 'collapsed') composition_archetype = 'window-side-light';
  else composition_archetype = 'documentary-portrait';

  // ─── Typography zone ──────────────────────────────────────────
  let typography_zone: DirectorVerdict['typography_zone'];
  if (direction.typographyDominance === 'absent') typography_zone = 'absent';
  else if (composition.negativeSpaceBias === 'bottom') typography_zone = 'lower-left';
  else if (composition.negativeSpaceBias === 'top') typography_zone = 'upper-left';
  else if (composition.negativeSpaceBias === 'left') typography_zone = 'lower-left';
  else if (composition.negativeSpaceBias === 'right') typography_zone = 'lower-right';
  else if (direction.typographyDominance === 'loud') typography_zone = 'baseline-spanning';
  else typography_zone = 'lower-left';

  // ─── Emotional crop strategy ──────────────────────────────────
  let emotional_crop_strategy: DirectorVerdict['emotional_crop_strategy'];
  if (framing.behaviors.includes('accidental-crop-pressure')) emotional_crop_strategy = 'pressed-against-edge';
  else if (framing.behaviors.includes('partial-face') || framing.behaviors.includes('blocked-object')) emotional_crop_strategy = 'partial-subject';
  else if (framing.camera_distance === 'overhead') emotional_crop_strategy = 'overhead-distance';
  else if (composition_archetype === 'corner-restraint') emotional_crop_strategy = 'corner-anchor';
  else if (negativeSpace.prescribed_behavior === 'breathable-silence') emotional_crop_strategy = 'centered-with-breath';
  else emotional_crop_strategy = 'asymmetric-with-fall';

  // ─── Object hierarchy ─────────────────────────────────────────
  const object_hierarchy: string[] = [];
  // Always: focal first.
  object_hierarchy.push(direction.focalPoint);
  // Product if present.
  if (!presence.productAbsent) object_hierarchy.push(`product (${presence.mode})`);
  // Paired object if association mode.
  if (presence.pairedObject) object_hierarchy.push(`paired motif: ${presence.pairedObject}`);
  // Typography last (it's a layer on top).
  if (direction.typographyDominance !== 'absent') object_hierarchy.push('typography');

  // ─── Visual silence zones ─────────────────────────────────────
  const visual_silence_zones: DirectorVerdict['visual_silence_zones'] = [];
  if (composition.negativeSpaceBias !== 'center') {
    visual_silence_zones.push(composition.negativeSpaceBias);
  }
  // When the eye-escape score is high, the corners are silence zones too.
  if (gravity.eye_escape_points >= 7) visual_silence_zones.push('corners');

  // ─── Framing aggression ───────────────────────────────────────
  const aggression = clamp10(
    framing.behaviors.length * 1.6
    + (composition_archetype === 'documentary-portrait' ? 1 : 0)
    + (framing.behaviors.includes('shoulder-intrusion') ? 1.5 : 0)
    + (framing.behaviors.includes('accidental-crop-pressure') ? 1.5 : 0)
    - (direction.restraint * 4),
  );

  // ─── CTA permission ───────────────────────────────────────────
  let cta_permission_level: DirectorVerdict['cta_permission_level'];
  if (presence.mode === 'absent' && (emotionalCore?.id === 'shame' || emotionalCore?.id === 'guilt' || emotionalCore?.id === 'loneliness-in-public')) {
    cta_permission_level = 'forbidden';
  } else if (direction.ctaBehavior === 'quiet') cta_permission_level = 'whisper';
  else if (direction.ctaBehavior === 'corner') cta_permission_level = 'announced';
  else cta_permission_level = 'integrated';

  // ─── "Would removing 40% improve this?" ───────────────────────
  // The director asks: if I removed two of the four most-visible
  // elements, would the banner be stronger?
  let would_improve_with_subtraction = false;
  let subtraction_target: string | null = null;
  const elementCount =
    1                                                       // focal
    + (direction.typographyDominance !== 'absent' ? 1 : 0)
    + (composition.typoZones.secondary ? 1 : 0)
    + (composition.typoZones.timestamp ? 1 : 0)
    + (presence.productAbsent ? 0 : 1)
    + 1;                                                    // cta
  // Four-element threshold: any banner with 4+ visible elements AND a
  // crowding score above 5 OR a competing-anchors score above 5 would
  // be better with subtraction.
  if (elementCount >= 4 && (gravity.accidental_crowding >= 5 || gravity.competing_anchors >= 5)) {
    would_improve_with_subtraction = true;
    // Pick the lowest-mass non-focal element as the subtraction target.
    if (composition.typoZones.timestamp && direction.typographyDominance === 'timestamp') {
      subtraction_target = 'secondary or timestamp typography';
    } else if (composition.typoZones.secondary) {
      subtraction_target = 'secondary typography';
    } else if (!presence.productAbsent) {
      subtraction_target = `product (currently ${presence.mode})`;
    } else {
      subtraction_target = 'CTA';
    }
  }
  // Also fires when the layout has full negative-space-bias=center
  // AND a high focal_dominance (the layout is single-anchor and still
  // contains 4+ elements — overdesigned).
  if (composition.negativeSpaceBias === 'center' && gravity.focal_dominance < 7 && elementCount >= 4) {
    would_improve_with_subtraction = true;
    subtraction_target = subtraction_target ?? 'one of the typography systems';
  }

  // ─── Rejection conditions ─────────────────────────────────────
  const rejection_conditions: DirectorVerdict['rejection_conditions'] = [];
  if (framing.behaviors.length <= 1 && direction.restraint < 0.75) {
    rejection_conditions.push('looks-assembled');
  }
  if (presence.mode === 'hand-held' && direction.focalPoint === 'product-in-hand' && direction.restraint < 0.5) {
    rejection_conditions.push('product-pasted');
  }
  if (rhythm.would_repeat && rhythm.repeated_pattern?.includes('dominance')) {
    rejection_conditions.push('headline-behaving-like-template');
  }
  if (direction.restraint > 0.85 && framing.behaviors.length <= 1) {
    rejection_conditions.push('composition-too-aware-of-itself');
  }
  if (negativeSpace.reject_centered) {
    rejection_conditions.push('too-balanced-to-feel-human');
  }

  // ─── director note ────────────────────────────────────────────
  const recentResidueAvg = recentAftertaste.length > 0
    ? recentAftertaste.slice(0, 5).reduce((a, b) => a + b.residueStrength, 0) / Math.min(5, recentAftertaste.length)
    : 0;
  const notes: string[] = [];
  notes.push(`archetype: ${composition_archetype}`);
  if (would_improve_with_subtraction) notes.push(`would improve by removing ${subtraction_target}`);
  if (campaignIdentity && campaignIdentity.recognisability >= 6) {
    notes.push(`identity recognisability ${campaignIdentity.recognisability}/10 — campaign is forming a voice`);
  }
  if (recentResidueAvg >= 7) notes.push(`recent residue avg ${recentResidueAvg.toFixed(1)}/10 — the campaign is sticking`);
  if (rejection_conditions.length > 0) notes.push(`director will refuse: ${rejection_conditions.join(', ')}`);
  const director_note = notes.join(' · ');

  void formula;

  return {
    composition_archetype,
    typography_zone,
    emotional_crop_strategy,
    object_hierarchy,
    visual_silence_zones,
    framing_aggression: aggression,
    cta_permission_level,
    would_improve_with_subtraction,
    subtraction_target,
    rejection_conditions,
    director_note,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
