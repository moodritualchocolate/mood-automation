/**
 * RECOVERY STATE VIEW (Wave 28 — Rest + Recovery Physiology)
 *
 * The dashboard surface for the rest verb. Derived purely from
 * persisted organism + os state. The view classifies recovery into
 * one of four states (calm, non-gamified):
 *
 *   'not-needed'      — no depletion, no recent rest. The organism
 *                        is fine and hasn't recently rested.
 *   'needed'          — at least one depletion threshold met AND
 *                        cadence has elapsed since the last rest.
 *                        The organism should rest now.
 *   'recovering'      — at least one depletion threshold met BUT
 *                        cadence has not elapsed. A recent rest
 *                        didn't fully restore; another is gated.
 *   'recently-rested' — no depletion BUT cadence has not elapsed.
 *                        The organism is in cooldown, fine.
 *
 * lastRestSnapshot (the before/after pair from the most recent
 * successful rest) is surfaced as-is from organism state. The
 * dashboard renders it as honest pre/post pairs — no fabricated
 * trend lines, no derivative magic.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import {
  isOrganismDepleted,
  REST_CADENCE_MIN_TICKS,
  REST_CADENCE_MIN_ACTS,
} from './operatingSystemCore';

export type RecoveryStatus =
  | 'not-needed' | 'needed' | 'recovering' | 'recently-rested';

export interface RecoveryStateViewModel {
  present: boolean;
  restCount: number;
  lastRestAt?: number;
  lastRestTick?: number;
  ticksSinceLastRest?: number;
  actsSinceLastRest?: number;
  cadenceElapsed: boolean;
  status: RecoveryStatus;
  depletion?: {
    energy_low: boolean;
    stress_high: boolean;
    complexity_high: boolean;
    fragmented: boolean;
    pending_with_low_energy: boolean;
  };
  /** Pre/post vitals from the most recent successful rest. Hidden
   *  when no rest has happened yet. */
  lastRestSnapshot?: {
    beforeEnergy: number;
    afterEnergy: number;
    beforeStress: number;
    afterStress: number;
    beforeComplexity: number;
    afterComplexity: number;
    beforeFragmentation: number;
    afterFragmentation: number;
  };
  statement: string;
}

export function buildRecoveryStateView(snap: RuntimeSnapshot): RecoveryStateViewModel {
  const organism = snap.organism;
  const os = snap.os;
  if (!organism || !os) {
    return {
      present: false, restCount: 0, cadenceElapsed: true,
      status: 'not-needed',
      statement: 'no runtime — recovery state unavailable',
    };
  }

  const depletionRaw = isOrganismDepleted(os, organism);
  const depletionMet =
    depletionRaw.energy_low || depletionRaw.stress_high ||
    depletionRaw.complexity_high || depletionRaw.fragmented ||
    depletionRaw.pending_with_low_energy;

  const lastRestTick = organism.lastRestTick;
  const ticksSinceLastRest = lastRestTick != null
    ? os.uptime - lastRestTick
    : undefined;
  const actsSinceLastRest = lastRestTick != null
    ? os.directiveLog.filter((d) =>
        d.tick > lastRestTick &&
        d.directive !== 'rest' && d.directive !== 'rest-refused',
      ).length
    : undefined;

  // If there's never been a rest, cadence is trivially "elapsed".
  const cadenceElapsed = lastRestTick == null
    ? true
    : (ticksSinceLastRest! >= REST_CADENCE_MIN_TICKS ||
       actsSinceLastRest! >= REST_CADENCE_MIN_ACTS);

  let status: RecoveryStatus;
  if (cadenceElapsed && !depletionMet) status = 'not-needed';
  else if (cadenceElapsed && depletionMet) status = 'needed';
  else if (!cadenceElapsed && depletionMet) status = 'recovering';
  else status = 'recently-rested';

  const statement =
    status === 'not-needed' ? `organism is well — ${organism.restCount} rests in history` :
    status === 'needed'     ? `rest is needed — depletion thresholds met, cadence elapsed` :
    status === 'recovering' ? `still depleted — wait for cadence (${REST_CADENCE_MIN_TICKS}+ ticks or ${REST_CADENCE_MIN_ACTS}+ acts)` :
                              `recently rested — cooldown active, organism fine`;

  return {
    present: true,
    restCount: organism.restCount,
    lastRestAt: organism.lastRestAt,
    lastRestTick: organism.lastRestTick,
    ticksSinceLastRest,
    actsSinceLastRest,
    cadenceElapsed,
    status,
    depletion: depletionRaw,
    lastRestSnapshot: organism.lastRestSnapshot,
    statement,
  };
}
