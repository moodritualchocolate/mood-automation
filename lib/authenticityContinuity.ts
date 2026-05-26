/**
 * AUTHENTICITY CONTINUITY (pure, human-protective)
 *
 * Measures how the brand's authentic identity is preserved (or
 * eroded) over time. Pure deterministic. Same input → same output.
 *
 * Tracks five drift dimensions:
 *   - whether the brand still feels human
 *   - whether tone became synthetic
 *   - whether emotional pacing became optimized
 *   - whether persuasion replaced storytelling
 *   - whether identity drifted toward performance
 *
 * Computes a humanContinuityScore by splitting the visual + narrative
 * + drift histories into early and recent halves and comparing the
 * felt-human axes between them.
 *
 * STRICT CONTRACT: observatory only.
 */

import type { HumanTruthInput } from './humanTruthIntelligence';
import { computeHumanTruth } from './humanTruthIntelligence';

export interface ContinuityTrajectoryPoint {
  at: number;
  authenticityScore: number;
  feltHumanScore: number;
}

export interface AuthenticityContinuityReading {
  humanContinuityScore: number;        // 0..10
  direction: 'preserving' | 'eroding' | 'recovering' | 'stable' | 'unknown';
  feelHumanSustained: boolean;
  toneBecameSynthetic: boolean;
  emotionalPacingOptimized: boolean;
  persuasionReplacedStorytelling: boolean;
  identityDriftedToPerformance: boolean;
  earlyAuthenticity: number;
  recentAuthenticity: number;
  authenticityDelta: number;
  trajectory: ContinuityTrajectoryPoint[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — continuity measures how the brand still feels human over time. ' +
  'The system does not auto-correct drift; the operator interprets the trajectory.';

function r1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }

/** Split the histories at a midpoint and return two HumanTruthInputs:
 *  one over the early half and one over the recent half. */
function splitHistories(input: HumanTruthInput): { early: HumanTruthInput; recent: HumanTruthInput } {
  const splitArray = <T>(arr: T[] | undefined): { early: T[]; recent: T[] } => {
    if (!arr || arr.length === 0) return { early: [], recent: [] };
    const half = Math.max(1, Math.floor(arr.length / 2));
    return { early: arr.slice(0, half), recent: arr.slice(half) };
  };

  const v = splitArray(input.visualDNA?.fingerprints);
  const n = splitArray(input.narrativeDNA?.fingerprints);
  const d = splitArray(input.drift?.observations);
  const o = splitArray(input.outcomes?.outcomes);
  const s = splitArray(input.strategy?.audienceHistory);

  return {
    early: {
      ...input,
      visualDNA: { fingerprints: v.early },
      narrativeDNA: { fingerprints: n.early },
      drift: { observations: d.early },
      outcomes: { outcomes: o.early },
      strategy: { ...input.strategy, audienceHistory: s.early },
    },
    recent: {
      ...input,
      visualDNA: { fingerprints: v.recent },
      narrativeDNA: { fingerprints: n.recent },
      drift: { observations: d.recent },
      outcomes: { outcomes: o.recent },
      strategy: { ...input.strategy, audienceHistory: s.recent },
    },
  };
}

export function computeAuthenticityContinuity(
  input: HumanTruthInput,
): AuthenticityContinuityReading {
  const totalSamples =
    (input.visualDNA?.fingerprints?.length ?? 0) +
    (input.narrativeDNA?.fingerprints?.length ?? 0);

  // Without enough history, return unknown.
  if (totalSamples < 4) {
    return {
      humanContinuityScore: 5,
      direction: 'unknown',
      feelHumanSustained: false,
      toneBecameSynthetic: false,
      emotionalPacingOptimized: false,
      persuasionReplacedStorytelling: false,
      identityDriftedToPerformance: false,
      earlyAuthenticity: 0, recentAuthenticity: 0, authenticityDelta: 0,
      trajectory: [],
      notes: ['insufficient history to measure continuity'],
      reasonCodes: ['insufficient-history'],
      advisoryNotice: ADVISORY_NOTICE,
    };
  }

  const { early, recent } = splitHistories(input);
  const earlyTruth = computeHumanTruth(early);
  const recentTruth = computeHumanTruth(recent);

  const earlyAuthenticity = earlyTruth.authenticityScore;
  const recentAuthenticity = recentTruth.authenticityScore;
  const authenticityDelta = r1(recentAuthenticity - earlyAuthenticity);

  // Direction.
  let direction: AuthenticityContinuityReading['direction'];
  if (Math.abs(authenticityDelta) < 0.5) direction = 'stable';
  else if (authenticityDelta >= 0.5) direction = recentAuthenticity >= earlyAuthenticity * 0.95 && earlyAuthenticity < 5 ? 'recovering' : 'preserving';
  else direction = 'eroding';

  // Continuity score: weighted blend of recent authenticity + lack of erosion.
  const humanContinuityScore = r1(clamp10(
    recentAuthenticity * 0.5 +
    (10 - Math.abs(authenticityDelta) * 2) * 0.3 +
    earlyAuthenticity * 0.2,
  ));

  // Drift dimensions.
  const feelHumanSustained = recentTruth.feltHumanScore >= 6 && Math.abs(authenticityDelta) < 1.5;
  const toneBecameSynthetic =
    earlyTruth.signals.conversationalNaturalness - recentTruth.signals.conversationalNaturalness >= 1.5 ||
    recentTruth.signals.conversationalNaturalness <= 3;
  const emotionalPacingOptimized =
    earlyTruth.signals.humanPacing - recentTruth.signals.humanPacing >= 1.5 ||
    recentTruth.signals.humanPacing <= 3;
  const persuasionReplacedStorytelling =
    earlyTruth.signals.narrativeSincerity - recentTruth.signals.narrativeSincerity >= 1.5 ||
    recentTruth.signals.narrativeSincerity <= 3;
  const identityDriftedToPerformance =
    earlyTruth.signals.nonPerformativeBehavior - recentTruth.signals.nonPerformativeBehavior >= 1.5 ||
    recentTruth.signals.nonPerformativeBehavior <= 3;

  // Trajectory — synthesize per-quarter authenticity from the
  // available history. We just sample the visual fingerprints
  // at quartile points and reuse the truth engine on each slice.
  const trajectory: ContinuityTrajectoryPoint[] = [];
  const visualFps = input.visualDNA?.fingerprints ?? [];
  if (visualFps.length >= 4) {
    const quarters = 4;
    const step = Math.max(1, Math.floor(visualFps.length / quarters));
    for (let q = 0; q < quarters; q++) {
      const sliceEnd = Math.min(visualFps.length, (q + 1) * step);
      const slice = visualFps.slice(0, sliceEnd);
      const at = slice[slice.length - 1] && typeof (slice[slice.length - 1] as { at?: number }).at === 'number'
        ? (slice[slice.length - 1] as { at?: number }).at as number
        : sliceEnd;
      const partial: HumanTruthInput = {
        ...input,
        visualDNA: { fingerprints: slice },
      };
      const reading = computeHumanTruth(partial);
      trajectory.push({
        at,
        authenticityScore: reading.authenticityScore,
        feltHumanScore: reading.feltHumanScore,
      });
    }
  }

  const notes: string[] = [];
  if (toneBecameSynthetic) notes.push('tone has shifted toward synthetic delivery');
  if (emotionalPacingOptimized) notes.push('emotional pacing has become optimization-shaped');
  if (persuasionReplacedStorytelling) notes.push('persuasion is replacing storytelling');
  if (identityDriftedToPerformance) notes.push('identity has drifted toward performance');
  if (notes.length === 0) {
    notes.push(direction === 'preserving' || direction === 'stable'
      ? 'authenticity continuity is being preserved'
      : 'authenticity continuity is in motion; review the trajectory');
  }

  return {
    humanContinuityScore,
    direction,
    feelHumanSustained,
    toneBecameSynthetic,
    emotionalPacingOptimized,
    persuasionReplacedStorytelling,
    identityDriftedToPerformance,
    earlyAuthenticity,
    recentAuthenticity,
    authenticityDelta,
    trajectory,
    notes,
    reasonCodes: [
      `continuity:${humanContinuityScore}/10`,
      `direction:${direction}`,
      `delta:${authenticityDelta}`,
      `early:${earlyAuthenticity}`,
      `recent:${recentAuthenticity}`,
      `feel-human:${feelHumanSustained}`,
      `tone-synthetic:${toneBecameSynthetic}`,
      `pacing-optimized:${emotionalPacingOptimized}`,
      `persuasion-replaced-storytelling:${persuasionReplacedStorytelling}`,
      `identity-to-performance:${identityDriftedToPerformance}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
