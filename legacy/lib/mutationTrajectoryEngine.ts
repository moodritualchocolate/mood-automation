/**
 * MUTATION TRAJECTORY ENGINE (pure, simulation-only)
 *
 * Longitudinal simulation over candidate mutations. For each
 * candidate, projects a coarse 3-step trajectory across the
 * survivability/trust/realism axes. The trajectory is observational
 * — it describes how the candidate's signature WOULD evolve under
 * historical analogue patterns; it is never a forecast.
 *
 * STRICT CONTRACT:
 *   - no execution
 *   - no winner selection
 *   - no certainty / prediction language
 *   - allowed phrasing only:
 *       "historically associated", "may increase",
 *       "correlated with", "observed alongside"
 */

import type { CandidateMutation, MutationType } from './evolutionSandboxEngine';

export interface TrajectoryStep {
  step: number;
  trust: number;            // 0..10
  realism: number;
  fatigue: number;
  replay: number;
  signatureLabel: string;
}

export interface MutationTrajectory {
  mutationType: MutationType;
  steps: TrajectoryStep[];
  driftDirection: 'preserving' | 'diverging' | 'stable-under-pressure';
  notes: string[];
}

export interface MutationTrajectoryReading {
  totalTrajectories: number;
  trajectories: MutationTrajectory[];
  trajectoryDivergence: number;     // 0..10 — how varied final steps are
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Simulation only — trajectories describe historical analogue evolution. ' +
  'They are NEVER forecasts. The operator interprets.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeMutationTrajectories(
  candidates: CandidateMutation[],
): MutationTrajectoryReading {
  const trajectories: MutationTrajectory[] = [];

  for (const c of candidates) {
    // 3 steps. Each step nudges signatures toward their long-term
    // attractor based on the candidate's profile direction. The
    // attractor is the mean of (current + 5) for each axis — i.e.
    // signatures regress toward the mid-band over time unless
    // sustained by historical association.
    const steps: TrajectoryStep[] = [];
    let trust = c.trustImpact;
    let realism = c.realismImpact;
    let fatigue = c.fatigueProjection;
    let replay = c.replayabilityEstimate;
    for (let step = 1; step <= 3; step++) {
      // Pull each axis toward its "natural" attractor: trust slowly
      // erodes; realism erodes when polish persists; fatigue accumulates
      // when no recovery; replay decays unless ritual/sym lock it in.
      trust = clamp10(trust * 0.85 + 5 * 0.15);
      realism = clamp10(realism * 0.90 + 5 * 0.10);
      fatigue = clamp10(fatigue * 0.85 + 5 * 0.15);
      replay = clamp10(replay * 0.80 + 4 * 0.20);
      steps.push({
        step,
        trust: r1(trust),
        realism: r1(realism),
        fatigue: r1(fatigue),
        replay: r1(replay),
        signatureLabel: step === 1
          ? 'first-cycle echo'
          : step === 2
            ? 'mid-cycle drift'
            : 'late-cycle attractor',
      });
    }
    // Direction classification.
    const initial = (c.trustImpact + c.realismImpact + (10 - c.fatigueProjection) + c.replayabilityEstimate) / 4;
    const final = (steps[2].trust + steps[2].realism + (10 - steps[2].fatigue) + steps[2].replay) / 4;
    const delta = final - initial;
    const driftDirection: MutationTrajectory['driftDirection'] =
      Math.abs(delta) < 0.5 ? 'stable-under-pressure' :
      delta >= 0 ? 'preserving' : 'diverging';

    const notes: string[] = [];
    if (steps[2].fatigue - c.fatigueProjection >= 1) {
      notes.push('fatigue projection observed alongside the candidate may compound across cycles');
    }
    if (steps[2].replay - c.replayabilityEstimate >= 1) {
      notes.push('replay signature may increase under repeated use');
    } else if (c.replayabilityEstimate - steps[2].replay >= 1) {
      notes.push('replay signature historically associated with decay across cycles');
    }
    if (notes.length === 0) notes.push('trajectory holds steady under simulated pressure');

    trajectories.push({
      mutationType: c.mutationType,
      steps,
      driftDirection,
      notes,
    });
  }

  // Trajectory divergence: spread of final-step survivability across all trajectories.
  const finals = trajectories.map((t) => t.steps[2]);
  const finalTrust = finals.map((s) => s.trust);
  const finalRealism = finals.map((s) => s.realism);
  const finalReplay = finals.map((s) => s.replay);
  const trajectoryDivergence = trajectories.length === 0 ? 0 : r1(clamp10(
    ((Math.max(...finalTrust) - Math.min(...finalTrust)) +
     (Math.max(...finalRealism) - Math.min(...finalRealism)) +
     (Math.max(...finalReplay) - Math.min(...finalReplay))) / 3,
  ));

  return {
    totalTrajectories: trajectories.length,
    trajectories,
    trajectoryDivergence,
    reasonCodes: [
      `trajectories:${trajectories.length}`,
      `divergence:${trajectoryDivergence}/10`,
      `avg-final-trust:${trajectories.length === 0 ? 0 : r1(avg(finalTrust))}`,
      `avg-final-fatigue:${trajectories.length === 0 ? 0 : r1(avg(finals.map((s) => s.fatigue)))}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
