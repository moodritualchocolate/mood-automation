/**
 * GENERATIONAL EMOTION MAP (pure, observational, non-stereotyping)
 *
 * Surfaces observational clustering of emotional language differences
 * across audience segments. Does NOT map segments to demographic
 * generations. Does NOT assert what "a generation" wants. Only
 * reports what content patterns ENGAGED each observed segment.
 *
 * STRICT CONTRACT:
 *   - never produces stereotype claims
 *   - never used for political / generational manipulation
 *   - observational only
 *
 * Eight emotional-language polarities are measured per segment:
 *   irony ↔ sincerity, optimism ↔ realism, aspiration ↔ survival,
 *   chaos tolerance, pacing tolerance, stimulation tolerance,
 *   emotional openness, authenticity detection sensitivity.
 */

import type { CulturalInput } from './culturalMemoryEngine';

// ─── output ───────────────────────────────────────────────────

export interface GenerationalAxis {
  axis: string;
  /** -10..+10 (negative = left pole, positive = right pole). */
  signedScore: number;
  /** Plain-language description of the polarity. */
  description: string;
}

export interface GenerationalSegmentReading {
  segment: string;
  outcomes: number;
  /** All 8 axes. */
  axes: GenerationalAxis[];
  /** The axes where this segment is most distinct from the global baseline. */
  mostDistinctAxes: string[];
  notes: string[];
}

export interface GenerationalEmotionMapReport {
  totalOutcomes: number;
  segments: GenerationalSegmentReading[];
  /** Global baseline (computed across all outcomes). */
  baseline: GenerationalAxis[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — generational emotion mapping is OBSERVATIONAL CLUSTERING. ' +
  'It does NOT map segments to demographic generations and is NEVER used for ' +
  'identity manipulation, polarization, or political optimization.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Outcome = NonNullable<NonNullable<CulturalInput['outcomes']>['outcomes']>[number];

// Each axis returns a score 0..10 for the "right pole" interpretation.
// We then convert to a signed -10..+10 by mapping (score - 5) × 2.
function signed(rightPoleScore: number): number {
  return r1((rightPoleScore - 5) * 2);
}

function irony(records: Outcome[]): number {
  const ironyShare = records.filter((r) =>
    /iron|wry|self-aware|dry/.test((r.emotionalSignature ?? '').toLowerCase() + ' ' + (r.narrativeSignature ?? '').toLowerCase()),
  ).length;
  return records.length === 0 ? 5 : clamp10(10 * ironyShare / records.length);
}
function realismVsOptimism(records: Outcome[]): number {
  // 0 = optimism, 10 = realism. Use realismLevel.
  return records.length === 0 ? 5 : clamp10(avg(records.map((r) => r.realismLevel ?? 5)));
}
function survivalVsAspiration(records: Outcome[]): number {
  // 0 = aspiration, 10 = survival. Tilt by persuasion intensity (low) +
  // realism (high) + presence of survival-language.
  const survivalShare = records.filter((r) =>
    /surviv|endure|get-through|carry|cope/.test((r.emotionalSignature ?? '').toLowerCase() + ' ' + (r.narrativeSignature ?? '').toLowerCase()),
  ).length;
  return records.length === 0 ? 5 : clamp10(
    10 * survivalShare / records.length * 0.6 +
    avg(records.map((r) => r.realismLevel ?? 5)) * 0.4,
  );
}
function chaosTolerance(records: Outcome[]): number {
  // 0 = ordered, 10 = chaos-tolerant. High mutation pressure + burst cadence.
  if (records.length === 0) return 5;
  const burstShare = records.filter((r) => r.cadenceState === 'burst').length / records.length;
  const meanMutation = avg(records.map((r) => r.mutationPressure ?? 0));
  return clamp10(burstShare * 6 + meanMutation * 0.4);
}
function pacingTolerance(records: Outcome[]): number {
  // 0 = slow-pace tolerant, 10 = fast-pace tolerant.
  if (records.length === 0) return 5;
  const fastShare = records.filter((r) => r.cadenceState === 'burst' || r.cadenceState === 'normal').length / records.length;
  return clamp10(fastShare * 10);
}
function stimulationTolerance(records: Outcome[]): number {
  // 0 = low stimulation tolerant, 10 = high.
  // Inverse of realism + presence of dense pacing.
  if (records.length === 0) return 5;
  const lowRealism = 10 - avg(records.map((r) => r.realismLevel ?? 5));
  const fastShare = records.filter((r) => r.cadenceState === 'burst').length / records.length;
  return clamp10(lowRealism * 0.6 + fastShare * 4);
}
function emotionalOpenness(records: Outcome[]): number {
  // 0 = closed, 10 = open. High emotional response distribution variety.
  if (records.length === 0) return 5;
  const sigs = new Set(records.map((r) => r.emotionalSignature));
  return clamp10(Math.min(10, sigs.size) + (records.length >= 4 ? 0 : -2));
}
function authenticityDetection(records: Outcome[]): number {
  // 0 = low sensitivity (engages anything), 10 = high sensitivity
  // (rejects optimized content). Proxy: share of authenticity-rejection
  // outcomes when persuasion is high.
  if (records.length === 0) return 5;
  const rejectionShare = records.filter((r) =>
    r.downstreamOutcome === 'authenticity-rejection' ||
    r.downstreamOutcome === 'aggressive-cta-rejection',
  ).length / records.length;
  return clamp10(rejectionShare * 12);
}

function axesFor(records: Outcome[]): GenerationalAxis[] {
  return [
    { axis: 'irony↔sincerity', signedScore: signed(10 - irony(records)),
      description: 'positive = sincerity, negative = irony' },
    { axis: 'optimism↔realism', signedScore: signed(realismVsOptimism(records)),
      description: 'positive = realism, negative = optimism' },
    { axis: 'aspiration↔survival', signedScore: signed(survivalVsAspiration(records)),
      description: 'positive = survival, negative = aspiration' },
    { axis: 'chaos-tolerance', signedScore: signed(chaosTolerance(records)),
      description: 'positive = chaos-tolerant, negative = order-preferring' },
    { axis: 'pacing-tolerance', signedScore: signed(pacingTolerance(records)),
      description: 'positive = fast-pace tolerant, negative = slow-pace preferring' },
    { axis: 'stimulation-tolerance', signedScore: signed(stimulationTolerance(records)),
      description: 'positive = high-stimulation tolerant, negative = low-stimulation preferring' },
    { axis: 'emotional-openness', signedScore: signed(emotionalOpenness(records)),
      description: 'positive = open, negative = guarded' },
    { axis: 'authenticity-sensitivity', signedScore: signed(authenticityDetection(records)),
      description: 'positive = high sensitivity (rejects optimized), negative = low sensitivity' },
  ];
}

// ─── main ─────────────────────────────────────────────────────

export function computeGenerationalEmotionMap(
  input: CulturalInput,
): GenerationalEmotionMapReport {
  const outcomes = input.outcomes?.outcomes ?? [];

  const baseline = axesFor(outcomes);

  const groups = new Map<string, Outcome[]>();
  for (const r of outcomes) {
    const seg = r.audienceSegment ?? 'unspecified';
    if (!groups.has(seg)) groups.set(seg, []);
    groups.get(seg)!.push(r);
  }

  const segments: GenerationalSegmentReading[] = [];
  for (const [seg, recs] of groups) {
    const axes = axesFor(recs);
    // Compute distance from baseline per axis.
    const distances = axes.map((a, i) => ({
      axis: a.axis,
      delta: Math.abs(a.signedScore - baseline[i].signedScore),
    }));
    const mostDistinct = distances
      .sort((a, b) => b.delta - a.delta || a.axis.localeCompare(b.axis))
      .slice(0, 3)
      .map((d) => d.axis);
    const notes: string[] = [];
    for (const a of axes) {
      if (a.axis === 'authenticity-sensitivity' && a.signedScore >= 4) {
        notes.push('engaged content shows authenticity-rejection patterns when high persuasion is present');
      }
      if (a.axis === 'optimism↔realism' && a.signedScore >= 4) {
        notes.push('engaged content leans realism-heavy');
      }
      if (a.axis === 'pacing-tolerance' && a.signedScore <= -4) {
        notes.push('engaged content leans slow-pace');
      }
    }
    if (notes.length === 0) notes.push('no axis is dramatically distinct from the global baseline');
    segments.push({
      segment: seg,
      outcomes: recs.length,
      axes,
      mostDistinctAxes: mostDistinct,
      notes,
    });
  }
  segments.sort((a, b) =>
    b.outcomes - a.outcomes ||
    a.segment.localeCompare(b.segment),
  );

  return {
    totalOutcomes: outcomes.length,
    segments,
    baseline,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `segments:${segments.length}`,
      `axes-per-segment:${baseline.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
