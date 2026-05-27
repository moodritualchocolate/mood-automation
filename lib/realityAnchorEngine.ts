/**
 * REALITY ANCHOR ENGINE (pure, simulation-only)
 *
 * For each candidate mutation, evaluates whether the mutation
 * PRESERVES the six reality anchors:
 *   - human pacing
 *   - imperfection
 *   - dignity
 *   - emotional spaciousness
 *   - realism texture
 *   - silence tolerance
 *
 * The engine flags candidates that would drift FROM the anchors so
 * the operator can keep humanity-protective work in view. The engine
 * NEVER selects or rejects a candidate.
 */

import type { CandidateMutation } from './evolutionSandboxEngine';

export interface RealityAnchorReadings {
  humanPacing: number;            // 0..10 — 10 = anchor preserved
  imperfection: number;
  dignity: number;
  emotionalSpaciousness: number;
  realismTexture: number;
  silenceTolerance: number;
  composite: number;
}

export interface CandidateAnchorReport {
  mutationType: string;
  anchors: RealityAnchorReadings;
  /** Anchors that fell below the preserved threshold. */
  driftingAnchors: string[];
  notes: string[];
}

export interface RealityAnchorReading {
  totalCandidates: number;
  reports: CandidateAnchorReport[];
  /** Aggregate composite across all candidates. */
  overallAnchorPreservation: number;
  candidatesPreservingAllAnchors: string[];
  candidatesDriftingFromAnchors: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Simulation only — the reality anchor engine flags mutations that would ' +
  'drift from human pacing, imperfection, dignity, spaciousness, realism, ' +
  'and silence. It never selects or rejects a candidate.';

const ANCHOR_THRESHOLD = 5;

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeRealityAnchors(
  candidates: CandidateMutation[],
): RealityAnchorReading {
  const reports: CandidateAnchorReport[] = candidates.map((c) => {
    // Each anchor is derived from the candidate's signature axes in
    // a deterministic, conservative way. Pacing-related mutations
    // preserve pacing; symbolism-related ones may shift it, etc.
    const isPacing       = c.mutationType === 'pacing' || c.mutationType === 'silence' || c.mutationType === 'documentary';
    const isImperfection = c.mutationType === 'realism' || c.mutationType === 'documentary';
    const isDignity      = c.mutationType === 'emotional-restraint' || c.mutationType === 'realism' || c.mutationType === 'intimacy';
    const isSpaciousness = c.mutationType === 'silence' || c.mutationType === 'pacing' || c.mutationType === 'ritual';
    const isRealism      = c.mutationType === 'realism' || c.mutationType === 'documentary';
    const isSilence      = c.mutationType === 'silence' || c.mutationType === 'ritual';

    const baseHigh = 7;
    const baseLow = 4;

    const humanPacing = r1(clamp10(
      (isPacing ? baseHigh : baseLow) +
      (c.fatigueProjection <= 5 ? 1 : -1) +
      (c.instabilityScore <= 5 ? 0.5 : -0.5),
    ));
    const imperfection = r1(clamp10(
      (isImperfection ? baseHigh : baseLow) +
      (c.realismImpact >= 6 ? 1 : -1),
    ));
    const dignity = r1(clamp10(
      (isDignity ? baseHigh : baseLow) +
      (c.trustImpact >= 6 ? 1 : -1),
    ));
    const emotionalSpaciousness = r1(clamp10(
      (isSpaciousness ? baseHigh : baseLow) +
      (c.replayabilityEstimate >= 6 ? 0.5 : -0.5),
    ));
    const realismTexture = r1(clamp10(
      (isRealism ? baseHigh : baseLow) +
      (c.realismImpact - 5) * 0.6,
    ));
    const silenceTolerance = r1(clamp10(
      (isSilence ? baseHigh : baseLow) +
      (c.fatigueProjection <= 5 ? 1 : -1),
    ));
    const anchors: RealityAnchorReadings = {
      humanPacing, imperfection, dignity, emotionalSpaciousness,
      realismTexture, silenceTolerance,
      composite: r1(avg([humanPacing, imperfection, dignity, emotionalSpaciousness, realismTexture, silenceTolerance])),
    };

    const driftingAnchors: string[] = [];
    if (humanPacing < ANCHOR_THRESHOLD) driftingAnchors.push('human-pacing');
    if (imperfection < ANCHOR_THRESHOLD) driftingAnchors.push('imperfection');
    if (dignity < ANCHOR_THRESHOLD) driftingAnchors.push('dignity');
    if (emotionalSpaciousness < ANCHOR_THRESHOLD) driftingAnchors.push('emotional-spaciousness');
    if (realismTexture < ANCHOR_THRESHOLD) driftingAnchors.push('realism-texture');
    if (silenceTolerance < ANCHOR_THRESHOLD) driftingAnchors.push('silence-tolerance');

    const notes: string[] = [];
    if (driftingAnchors.length === 0) {
      notes.push(`${c.mutationType} historically associated with anchor preservation`);
    } else {
      notes.push(`${c.mutationType} may drift from: ${driftingAnchors.join(', ')}`);
    }

    return {
      mutationType: c.mutationType, anchors, driftingAnchors, notes,
    };
  });

  const overallAnchorPreservation = reports.length === 0
    ? 0
    : r1(avg(reports.map((r) => r.anchors.composite)));

  const candidatesPreservingAllAnchors = reports
    .filter((r) => r.driftingAnchors.length === 0)
    .map((r) => r.mutationType);
  const candidatesDriftingFromAnchors = reports
    .filter((r) => r.driftingAnchors.length >= 2)
    .map((r) => r.mutationType);

  return {
    totalCandidates: candidates.length,
    reports,
    overallAnchorPreservation,
    candidatesPreservingAllAnchors,
    candidatesDriftingFromAnchors,
    reasonCodes: [
      `candidates:${candidates.length}`,
      `anchor-preservation:${overallAnchorPreservation}/10`,
      `preserving-all:${candidatesPreservingAllAnchors.length}`,
      `drifting:${candidatesDriftingFromAnchors.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
