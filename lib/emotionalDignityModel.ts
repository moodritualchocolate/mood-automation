/**
 * EMOTIONAL DIGNITY MODEL (pure, human-protective)
 *
 * Tracks whether content preserves:
 *   - viewer dignity
 *   - emotional breathing room
 *   - reflective space
 *   - psychological safety
 *   - emotional honesty
 *
 * The model recognizes that HIGH-PERFORMING CONTENT CAN STILL DAMAGE
 * LONG-TERM TRUST. It distinguishes engagement from dignity.
 *
 * STRICT CONTRACT: observatory only. The model exists only to surface
 * dignity deficits — never to optimize against them.
 */

import type { HumanTruthInput } from './humanTruthIntelligence';

export interface DignitySignals {
  viewerDignity: number;
  emotionalBreathingRoom: number;
  reflectiveSpace: number;
  psychologicalSafety: number;
  emotionalHonesty: number;
}

export interface EmotionalDignityReading {
  /** 0..10 — composite dignity score (high = preserved). */
  dignityScore: number;
  /** 0..10 — how strongly engagement and dignity are diverging. */
  trustVsPerformanceGap: number;
  signals: DignitySignals;
  highPerformingDignityThreat: boolean;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — emotional dignity is measured to PROTECT viewers. ' +
  'The system never optimizes engagement at the cost of dignity.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeEmotionalDignity(input: HumanTruthInput): EmotionalDignityReading {
  const outcomes = (input.outcomes?.outcomes ?? []).slice(-24);
  const narrativeFps = (input.narrativeDNA?.fingerprints ?? []).slice(-12);
  const visualFps = (input.visualDNA?.fingerprints ?? []).slice(-12);

  const avgCta = avg(narrativeFps.map((f) => f.ctaPressure ?? 0));
  const avgPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const realism = avg(visualFps.map((f) => f.realismLevel ?? 5));
  const humanRealism = avg(narrativeFps.map((f) => f.humanRealism ?? 5));
  const sparseSilenceShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'sparse').length / narrativeFps.length;
  const observationalShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => (f.narrationStyle ?? '').toLowerCase().includes('observa')).length / narrativeFps.length;

  // viewerDignity: low aggression + presence of realism
  const viewerDignity = clamp10((10 - avgPersuasion) * 0.5 + realism * 0.5);
  // emotionalBreathingRoom: sparse silence + low CTA pressure
  const emotionalBreathingRoom = clamp10(sparseSilenceShare * 6 + (10 - avgCta) * 0.4);
  // reflectiveSpace: observational narration + low burst cadence
  const burstShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst').length / outcomes.length;
  const reflectiveSpace = clamp10(observationalShare * 6 + (1 - burstShare) * 4);
  // psychologicalSafety: low bounce + low anxiety hook patterns
  const avgBounce = avg(outcomes.map((o) => o.metrics?.bounceRate ?? 0));
  const psychologicalSafety = clamp10((1 - avgBounce) * 10 - Math.max(0, avgPersuasion - 5));
  // emotionalHonesty: human realism + low CTA pressure
  const emotionalHonesty = clamp10(humanRealism * 0.6 + (10 - avgCta) * 0.4);

  const signals: DignitySignals = {
    viewerDignity:           r1(viewerDignity),
    emotionalBreathingRoom:  r1(emotionalBreathingRoom),
    reflectiveSpace:         r1(reflectiveSpace),
    psychologicalSafety:     r1(psychologicalSafety),
    emotionalHonesty:        r1(emotionalHonesty),
  };

  const dignityScore = r1(clamp10(
    (signals.viewerDignity +
     signals.emotionalBreathingRoom +
     signals.reflectiveSpace +
     signals.psychologicalSafety +
     signals.emotionalHonesty) / 5,
  ));

  // Trust-vs-performance gap: high engagement metrics with low dignity.
  const meanEngagement = outcomes.length === 0 ? 0 : avg(outcomes.map((o) =>
    Math.min(1, (o.metrics?.retention ?? 0)) * 0.5 +
    Math.min(1, (o.metrics?.shares ?? 0) / 5) * 0.25 +
    Math.min(1, (o.metrics?.likes ?? 0) / 50) * 0.25,
  )) * 10;
  const trustVsPerformanceGap = r1(clamp10(meanEngagement - dignityScore));
  const highPerformingDignityThreat = trustVsPerformanceGap >= 4 && dignityScore < 6;

  const notes: string[] = [];
  if (signals.viewerDignity < 5) notes.push('viewer dignity is eroded');
  if (signals.emotionalBreathingRoom < 4) notes.push('emotional breathing room is sparse');
  if (signals.reflectiveSpace < 4) notes.push('reflective space is sparse');
  if (signals.psychologicalSafety < 5) notes.push('psychological safety is at risk');
  if (signals.emotionalHonesty < 5) notes.push('emotional honesty is low');
  if (highPerformingDignityThreat) {
    notes.push('engagement is high but dignity is low — performance is borrowing from long-term trust');
  }
  if (notes.length === 0) notes.push('dignity signals are at acceptable levels');

  return {
    dignityScore,
    trustVsPerformanceGap,
    signals,
    highPerformingDignityThreat,
    notes,
    reasonCodes: [
      `dignity:${dignityScore}/10`,
      `trust-vs-performance-gap:${trustVsPerformanceGap}/10`,
      `high-performing-dignity-threat:${highPerformingDignityThreat}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
