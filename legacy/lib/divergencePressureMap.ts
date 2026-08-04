/**
 * DIVERGENCE PRESSURE MAP (pure, simulation-only)
 *
 * Maps convergence pressure between mutation candidates. High
 * convergence pressure means the candidates cluster around a single
 * signature — historically associated with creative homogenization.
 * Low convergence pressure (high divergence) means the candidates
 * span a wide signature range.
 *
 * STRICT CONTRACT:
 *   - no winner selection
 *   - no execution
 *   - no certainty / prediction language
 */

import type { CandidateMutation, MutationType } from './evolutionSandboxEngine';

export interface DivergenceCluster {
  members: MutationType[];
  averageSignature: {
    trust: number;
    realism: number;
    symbolic: number;
    replay: number;
    fatigue: number;
  };
  cohesion: number;             // 0..10 (low = high divergence inside cluster)
}

export interface DivergencePressureReading {
  totalCandidates: number;
  clusters: DivergenceCluster[];
  convergencePressure: number;     // 0..10 — high = many candidates converge
  divergenceSpread: number;        // 0..10 — inverse-ish
  isolatedCandidates: MutationType[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Simulation only — the divergence map shows how candidate mutations cluster ' +
  'in signature space. The system never picks a cluster.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function distance(a: CandidateMutation, b: CandidateMutation): number {
  return (
    Math.abs(a.trustImpact - b.trustImpact) +
    Math.abs(a.realismImpact - b.realismImpact) +
    Math.abs(a.symbolicResonanceEstimate - b.symbolicResonanceEstimate) +
    Math.abs(a.replayabilityEstimate - b.replayabilityEstimate) +
    Math.abs(a.fatigueProjection - b.fatigueProjection)
  ) / 5;
}

// Simple single-link clustering deterministically over the sorted list.
function cluster(
  candidates: CandidateMutation[], threshold: number,
): DivergenceCluster[] {
  const sorted = [...candidates].sort((a, b) => a.mutationType.localeCompare(b.mutationType));
  const groups: CandidateMutation[][] = [];
  for (const c of sorted) {
    // Find an existing group whose members are within threshold of c.
    let placed = false;
    for (const g of groups) {
      const minDist = Math.min(...g.map((m) => distance(c, m)));
      if (minDist <= threshold) { g.push(c); placed = true; break; }
    }
    if (!placed) groups.push([c]);
  }
  return groups.map((members) => {
    const signature = {
      trust: r1(avg(members.map((m) => m.trustImpact))),
      realism: r1(avg(members.map((m) => m.realismImpact))),
      symbolic: r1(avg(members.map((m) => m.symbolicResonanceEstimate))),
      replay: r1(avg(members.map((m) => m.replayabilityEstimate))),
      fatigue: r1(avg(members.map((m) => m.fatigueProjection))),
    };
    // Cohesion: low spread inside cluster = high cohesion.
    const distances: number[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        distances.push(distance(members[i], members[j]));
      }
    }
    const spread = distances.length === 0 ? 0 : avg(distances);
    return {
      members: members.map((m) => m.mutationType),
      averageSignature: signature,
      cohesion: r1(clamp10(10 - spread * 2)),
    };
  });
}

export function computeDivergencePressure(
  candidates: CandidateMutation[],
): DivergencePressureReading {
  const clusters = cluster(candidates, 1.5);
  const sizes = clusters.map((c) => c.members.length);
  const largestCluster = sizes.length === 0 ? 0 : Math.max(...sizes);
  // Convergence pressure: large cluster vs total = many converging.
  const convergencePressure = candidates.length === 0
    ? 0
    : r1(clamp10((largestCluster / candidates.length) * 10));

  // Divergence spread: average pairwise distance across all candidates.
  const allDistances: number[] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      allDistances.push(distance(candidates[i], candidates[j]));
    }
  }
  const divergenceSpread = allDistances.length === 0
    ? 0
    : r1(clamp10(avg(allDistances) * 2));

  const isolatedCandidates: MutationType[] = clusters
    .filter((c) => c.members.length === 1)
    .map((c) => c.members[0]);

  const notes: string[] = [];
  if (convergencePressure >= 7) {
    notes.push('high convergence pressure observed — candidates cluster around a single signature');
  } else if (divergenceSpread >= 6) {
    notes.push('candidates span a wide signature range; lower convergence pressure');
  } else {
    notes.push('candidates span a moderate signature range');
  }
  if (isolatedCandidates.length >= 3) {
    notes.push(`${isolatedCandidates.length} candidate(s) are isolated in signature space`);
  }

  return {
    totalCandidates: candidates.length,
    clusters,
    convergencePressure,
    divergenceSpread,
    isolatedCandidates,
    notes,
    reasonCodes: [
      `candidates:${candidates.length}`,
      `clusters:${clusters.length}`,
      `convergence-pressure:${convergencePressure}/10`,
      `divergence-spread:${divergenceSpread}/10`,
      `isolated-candidates:${isolatedCandidates.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
