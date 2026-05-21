/**
 * VISUAL TEMPO (Phase 9)
 *
 * Pacing across the campaign — not just per-banner.
 *
 * Tracks six axes over the recent sequence:
 *   - visual_loudness         (typography dominance + restraint inverse)
 *   - emotional_density       (DNA emotional_density)
 *   - typography_aggression   (loud / timestamp counts)
 *   - object_pressure         (motif weight + product visibility)
 *   - motion_implication      (pacing wired/staccato counts)
 *   - silence_weight          (silence_ratio average)
 *
 * Returns a Tempo curve and a per-axis advisory for the NEXT banner.
 * The spec said "campaign pacing should breathe" — this is the
 * mechanism that ensures breath between loud moments.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { CreativeDirection } from '@/core/types';

export interface TempoReport {
  axes: {
    visual_loudness: number;            // 0..1 — proportion of loud banners in window
    emotional_density: number;           // average DNA emotional_density (proxied)
    typography_aggression: number;       // 0..1 — loud/timestamp share
    object_pressure: number;             // 0..1 — non-hidden product share
    motion_implication: number;          // 0..1 — wired/staccato share
    silence_weight: number;              // 0..1 — silence_ratio average
  };
  /** A per-axis advisory: "lower", "raise", "hold". */
  advisory: {
    visual_loudness: 'lower' | 'raise' | 'hold';
    typography_aggression: 'lower' | 'raise' | 'hold';
    object_pressure: 'lower' | 'raise' | 'hold';
    silence_weight: 'lower' | 'raise' | 'hold';
  };
  /** True when the campaign needs a breath after this banner. */
  needs_breath_next: boolean;
  notes: string[];
}

export interface TempoInput {
  trail: EmotionalTraceEntry[];
  /** Optional — the recent banners' restraints, when available. */
  recentRestraints?: number[];
}

export function analyzeVisualTempo(input: TempoInput): TempoReport {
  const trail = input.trail.slice(0, 8); // last 8 banners
  const window = Math.max(1, trail.length);
  const notes: string[] = [];

  const dominances = trail.map((t) => t.facts?.typographyDominance ?? null);
  const roles = trail.map((t) => t.facts?.productRole ?? null);
  const silences = trail.map((t) => t.facts?.silence_ratio ?? 0.5);
  // The emotional density proxy: short truths + tension present.
  const emotionalDensityValues = trail.map((t) => {
    let d = 0.5;
    if (t.truth.length < 80) d += 0.2;
    if (t.tension && t.tension.length < 40) d += 0.2;
    return Math.min(1, d);
  });

  const loudCount = dominances.filter((d) => d === 'loud' || d === 'timestamp').length;
  const productVisible = roles.filter((r) => r !== null && r !== 'hidden').length;
  // Pacing proxy via tension family (we don't store pacing per banner;
  // use closing reactions to approximate wired/staccato share).
  const wiredCount = trail.filter((t) =>
    t.reaction.at_1s === 'discomfort' || t.reaction.at_1s === 'confusion'
    || t.reaction.at_3s === 'emotional tension',
  ).length;

  const visual_loudness = loudCount / window;
  const typography_aggression = loudCount / window;
  const object_pressure = productVisible / window;
  const motion_implication = wiredCount / window;
  const silence_weight = silences.reduce((a, b) => a + b, 0) / window;
  const emotional_density = emotionalDensityValues.reduce((a, b) => a + b, 0) / window;

  const advisory: TempoReport['advisory'] = {
    visual_loudness: visual_loudness > 0.55 ? 'lower' : visual_loudness < 0.2 ? 'raise' : 'hold',
    typography_aggression: typography_aggression > 0.5 ? 'lower' : typography_aggression < 0.15 ? 'raise' : 'hold',
    object_pressure: object_pressure > 0.65 ? 'lower' : object_pressure < 0.25 ? 'raise' : 'hold',
    silence_weight: silence_weight > 0.75 ? 'lower' : silence_weight < 0.4 ? 'raise' : 'hold',
  };

  // needs_breath_next: when EITHER visual_loudness or typography_aggression
  // is high AND silence_weight is low.
  const needs_breath_next = visual_loudness > 0.5 && silence_weight < 0.5;
  if (needs_breath_next) notes.push('campaign needs a breath next — loud + low-silence run detected');

  // Per-axis notes.
  if (advisory.visual_loudness === 'lower') notes.push('visual loudness running hot — pull next banner toward whisper');
  if (advisory.visual_loudness === 'raise') notes.push('visual loudness flat — afford a louder note next');
  if (advisory.object_pressure === 'lower') notes.push('product pressure too high — let the next banner go absent');
  if (advisory.silence_weight === 'lower') notes.push('silence over-used — break it with an editorial line');

  if (notes.length === 0) notes.push('visual tempo healthy — campaign is breathing');

  void emotional_density;
  return {
    axes: {
      visual_loudness, emotional_density, typography_aggression,
      object_pressure, motion_implication, silence_weight,
    },
    advisory,
    needs_breath_next,
    notes,
  };
}

/**
 * Used by the meta-critic: does the candidate direction WORSEN the
 * tempo the report flagged? E.g. the report said visual_loudness=lower
 * and the candidate is typographyDominance=loud → worsens.
 */
export function tempoWouldWorsen(report: TempoReport, candidate: { typographyDominance: CreativeDirection['typographyDominance']; productRole: CreativeDirection['productRole']; restraint: number }): { worsens: boolean; axis: string | null; reason: string | null } {
  if (report.advisory.visual_loudness === 'lower' && (candidate.typographyDominance === 'loud' || candidate.typographyDominance === 'timestamp')) {
    return { worsens: true, axis: 'visual_loudness', reason: 'tempo said lower visual loudness; candidate is loud' };
  }
  if (report.advisory.object_pressure === 'lower' && candidate.productRole !== 'hidden') {
    return { worsens: true, axis: 'object_pressure', reason: 'tempo said lower product pressure; candidate has visible product' };
  }
  if (report.advisory.silence_weight === 'lower' && (candidate.typographyDominance === 'absent' || candidate.typographyDominance === 'whisper') && candidate.restraint > 0.75) {
    return { worsens: true, axis: 'silence_weight', reason: 'tempo said lower silence; candidate doubles down on silence' };
  }
  return { worsens: false, axis: null, reason: null };
}
