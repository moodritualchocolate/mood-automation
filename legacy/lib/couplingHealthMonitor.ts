/**
 * COUPLING HEALTH MONITOR (Phase 149 — Wave 10: Reality Coupling Architecture)
 *
 * The coupling to reality is itself a system that can fail. This
 * monitor watches the coupling's own vital signs — addiction to
 * feedback, solipsism, decaying trust, eroding authenticity, a
 * diverged model — and reports whether the organism's link to the
 * world is healthy or breaking.
 */

import type { CouplingMode } from './realityCouplingGovernor';

export interface CouplingHealthReading {
  /** 0..10 — the health of the coupling to reality. */
  coupling_health: number;
  coupling_failure_modes: string[];
  /** True when the coupling itself is failing. */
  coupling_is_failing: boolean;
  notes: string[];
}

export interface CouplingHealthInput {
  couplingMode: CouplingMode;
  trustIsDecaying: boolean;
  authenticityEroding: boolean;
  isStimulusAddiction: boolean;
  modelDiverges: boolean;
}

export function readCouplingHealth(input: CouplingHealthInput): CouplingHealthReading {
  const { couplingMode, trustIsDecaying, authenticityEroding, isStimulusAddiction, modelDiverges } = input;
  const notes: string[] = [];

  const coupling_failure_modes: string[] = [];
  if (couplingMode === 'over-coupled') coupling_failure_modes.push('addicted to feedback');
  if (couplingMode === 'decoupled') coupling_failure_modes.push('decoupled into solipsism');
  if (isStimulusAddiction) coupling_failure_modes.push('stimulus addiction');
  if (trustIsDecaying) coupling_failure_modes.push('decaying trust');
  if (authenticityEroding) coupling_failure_modes.push('eroding authenticity');
  if (modelDiverges) coupling_failure_modes.push('a diverged external model');

  let coupling_health = 10;
  coupling_health -= coupling_failure_modes.length * 1.8;
  coupling_health = round1(Math.max(0, Math.min(10, coupling_health)));

  const coupling_is_failing = coupling_failure_modes.length >= 3 || coupling_health < 4;

  notes.push(`coupling health monitor: ${coupling_health}/10` +
    (coupling_failure_modes.length ? ` — failure modes: ${coupling_failure_modes.join(', ')}` : ' — the coupling is healthy'));
  return { coupling_health, coupling_failure_modes, coupling_is_failing, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
