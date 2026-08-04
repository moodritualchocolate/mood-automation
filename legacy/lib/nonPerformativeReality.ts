/**
 * NON-PERFORMATIVE REALITY (Phase 11)
 *
 * The system must stop "trying to be deep."
 *
 * Phase 10's antiSyntheticBehavior detects STRUCTURAL cleanliness
 * (composition too coherent, lighting too balanced). Phase 11's
 * nonPerformativeReality detects EMOTIONAL performance — the system
 * making suffering look gorgeous, melancholy look stylish, burnout
 * look cinematic. The spec named the specific failure modes:
 *
 *   trying too hard         — every system at maximum poetic
 *   obvious sadness          — face-forward sadness, lit beautifully
 *   aesthetic loneliness     — loneliness as a fashion campaign
 *   perfect melancholy       — sadness with no friction
 *   cinematic suffering      — emotional pain treated as production value
 *   beautiful burnout        — exhaustion in a soft warm window
 *
 * Rewards:
 *   emotionally confusing reality   — feelings that don't decode cleanly
 *   ordinary discomfort              — uncomfortable but not heroic
 *   anti-aesthetic moments           — visually awkward when emotionally honest
 *   flat lighting when correct       — no theatre when the room is flat
 *   observed not composed            — life caught, not arranged
 *
 * The meta-critic uses the spec's named gate as the headline question:
 *
 *   "Does this feel like a human moment that happened,
 *    or a creative system trying to simulate one?"
 *
 * If the second is stronger → refuse.
 */

import type { CreativeDirection, TypographyPlan } from '@/core/types';
import type { ReferenceDNA } from './referenceDNA';
import type { AtmosphericLight } from './atmosphericLight';
import type { EmotionalAftertaste } from './emotionalAftertaste';
import type { HumanContradictionReading } from './humanContradiction';

export type PerformativePattern =
  | 'trying-too-hard'
  | 'obvious-sadness'
  | 'aesthetic-loneliness'
  | 'perfect-melancholy'
  | 'cinematic-suffering'
  | 'beautiful-burnout';

export interface PerformativeReading {
  /** 0..10 — higher = more performative / worse */
  performativeness_score: number;
  patterns: PerformativePattern[];
  rewards: string[];
  /** The spec's headline question, answered. */
  feels_like_happened: boolean;
  /** True when the system is "trying to be deep". */
  trying_to_simulate: boolean;
  briefLine_anti: string;
  notes: string[];
}

export interface PerformativeInput {
  direction: CreativeDirection;
  typography: TypographyPlan;
  dna: ReferenceDNA;
  atmosphericLight: AtmosphericLight;
  aftertaste: EmotionalAftertaste;
  contradiction: HumanContradictionReading;
  truthText: string;
  /** When >= 6, the banner is currently leaning into "look-how-meaningful". */
  poeticOverloadHint?: number;
}

export function readNonPerformativeReality(input: PerformativeInput): PerformativeReading {
  const { direction, typography, dna, atmosphericLight, aftertaste, contradiction, truthText, poeticOverloadHint } = input;
  const patterns: PerformativePattern[] = [];
  const rewards: string[] = [];
  const notes: string[] = [];

  // trying-too-hard — every poetic dial maxed.
  // restraint > 0.8 AND luxury_restraint > 0.85 AND anti_commercial_feel > 0.85
  // AND emotional_density > 0.8 — the banner is performing depth.
  if (direction.restraint > 0.8 && dna.luxury_restraint > 0.85 && dna.anti_commercial_feel > 0.85 && dna.emotional_density > 0.8) {
    patterns.push('trying-too-hard');
    notes.push('every poetic axis maxed simultaneously — the banner is auditioning');
  }

  // obvious-sadness — face-forward + collapsed + low restraint AND warm light.
  if (direction.focalPoint === 'human-face' && direction.emotionalPacing === 'collapsed' &&
      (atmosphericLight.behavior === 'window-soft-warm' || atmosphericLight.behavior === 'late-office-warmth' || atmosphericLight.behavior === 'sunset-emotional-pause')) {
    patterns.push('obvious-sadness');
    notes.push('face-forward sadness lit warmly — the camera is making sure we know it is sad');
  }

  // aesthetic-loneliness — loneliness-cluster moments shot in luxury restraint.
  // We approximate via: low product_aggression + high silence_ratio + high luxury_restraint
  // + truth contains the word "alone" or "by themselves".
  const lonelyText = /\b(alone|by themselves|alone with|by myself)\b/i.test(truthText);
  if (lonelyText && dna.silence_ratio > 0.7 && dna.luxury_restraint > 0.8) {
    patterns.push('aesthetic-loneliness');
    notes.push('loneliness in the text + luxury-restraint visuals = loneliness-as-fashion');
  }

  // perfect-melancholy — sadness with no friction. Detect via aftertaste's
  // post-view state including "intimacy" / "atmosphere_persistence" >= 8
  // AND zero rewards from anti-synthetic's imperfection list (proxy: tiny
  // truth, no contradiction inhabited).
  if (aftertaste.atmosphere_persistence >= 8 && !contradiction.inhabits_contradiction && truthText.length < 70) {
    patterns.push('perfect-melancholy');
    notes.push('melancholy with no friction — too smoothly sad');
  }

  // cinematic-suffering — pressure/collapse families with low restraint AND
  // theatrical light (amber-doorway / late-office-warmth).
  if (direction.emotionalPacing === 'collapsed' && direction.restraint < 0.55 &&
      (atmosphericLight.behavior === 'amber-doorway' || atmosphericLight.behavior === 'late-office-warmth')) {
    patterns.push('cinematic-suffering');
    notes.push('suffering treated as production value — the camera lit it like a film poster');
  }

  // beautiful-burnout — silent-burnout / depletion adjacency with warm window light + high silence.
  // The spec specifically named this.
  if ((/\b(burnout|tired|exhausted|depleted|drained)\b/i.test(truthText)) &&
      atmosphericLight.behavior === 'window-soft-warm' &&
      dna.silence_ratio > 0.75) {
    patterns.push('beautiful-burnout');
    notes.push('exhaustion + soft warm window light — the spec\'s "beautiful burnout"');
  }

  // External hint — when the upstream pipeline thinks the banner is
  // overloading meaning (multiple symbolic motifs colliding), add a soft signal.
  if ((poeticOverloadHint ?? 0) >= 6) {
    patterns.push('trying-too-hard');
    notes.push(`upstream signal: poetic overload ${poeticOverloadHint}/10`);
  }

  // ─── Rewards (the system EARNED non-performance) ──────────────
  if (contradiction.inhabits_contradiction) rewards.push('inhabits a contradiction instead of resolving it');
  if (atmosphericLight.behavior === 'fluorescent-depletion' || atmosphericLight.behavior === 'overcast-flattening') {
    rewards.push('flat / institutional light — no theatre');
  }
  if (truthText.length > 0 && truthText.length < 80 && /[.,;:]/.test(truthText)) {
    rewards.push('truth is short and punctuated — observed, not poetic');
  }
  if (direction.typographyDominance === 'whisper' || direction.typographyDominance === 'absent') {
    rewards.push('typography refuses to dramatize');
  }
  if (dna.documentary_weight > 0.7 && dna.luxury_restraint < 0.7) {
    rewards.push('documentary weight outpaces luxury restraint — life over taste');
  }
  if (typography.secondary === null && typography.timestamp === null) {
    rewards.push('one line, nothing else — no editorial frame around the feeling');
  }

  // ─── Score ────────────────────────────────────────────────────
  const performativeness_score = Math.max(0, Math.min(10,
    patterns.length * 1.8 - rewards.length * 0.5 + (rewards.length === 0 ? 1.5 : 0),
  ));

  const trying_to_simulate = performativeness_score >= 6;
  const feels_like_happened = !trying_to_simulate && rewards.length >= 2;

  const briefLine_anti = trying_to_simulate
    ? `WARNING: banner is performing depth — ${patterns.join(', ')}. Pull restraint, flatten light, or refuse this concept.`
    : `Anti-performance signals: ${rewards.join(', ')}.`;

  if (notes.length === 0) notes.push('banner feels like a moment that happened');

  return {
    performativeness_score,
    patterns,
    rewards,
    feels_like_happened,
    trying_to_simulate,
    briefLine_anti,
    notes,
  };
}
