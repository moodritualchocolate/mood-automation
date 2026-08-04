/**
 * COGNITIVE GOVERNANCE VIEW (Wave 35)
 *
 * Dashboard view model for the executive regulation layer. Surfaces:
 *   - the current trust zone with status banding
 *   - the cognitive budget (current / max + ratio)
 *   - the six permission gradients
 *   - the instability forecast (current → projected reliability)
 *   - the most recent governance decisions
 *
 * No narratives are composed beyond plain-numeric statement strings.
 * The view is hidden when no governance state has been observed.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  CognitiveGovernanceState, RegulationGradients,
  InstabilityForecast, DecisionRecord, TrustZone, CognitiveBudget,
} from './cognitiveGovernance';

export interface CognitiveGovernanceViewModel {
  present: boolean;
  /** 'unrestricted' (high-trust + neutral) → 'paused' (suspended). */
  status: 'unrestricted' | 'governed' | 'throttled' | 'paused';
  zone: TrustZone;
  budget: CognitiveBudget & { ratio: number };
  gradients: RegulationGradients;
  forecast: InstabilityForecast | null;
  recentDecisions: DecisionRecord[];
  zoneTransitions: number;
  significantShifts: number;
  statement: string;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function buildCognitiveGovernanceView(snap: RuntimeSnapshot): CognitiveGovernanceViewModel {
  const cg = snap.cognitiveGovernance ?? null;
  if (!cg) {
    return {
      present: false,
      status: 'unrestricted',
      zone: 'high-trust',
      budget: {
        current: 50, max: 50, consumedTotal: 0, replenishedTotal: 0,
        lastConsumedAt: null, lastReplenishedAt: null, ratio: 1,
      },
      gradients: {
        cognitionThroughput: 1, escalationPermission: 1, explorationIntensity: 1,
        deferAcceptance: 0.5, recoveryWeighting: 0.5, burstTolerance: 1,
      },
      forecast: null,
      recentDecisions: [],
      zoneTransitions: 0,
      significantShifts: 0,
      statement: 'governance has not begun observing — no cognitive event yet',
    };
  }

  const status: CognitiveGovernanceViewModel['status'] =
    cg.zone === 'suspended'  ? 'paused' :
    cg.zone === 'restricted' ? 'throttled' :
    cg.zone === 'watchful'   ? 'governed' :
                                'unrestricted';

  const ratio = round2(cg.budget.current / cg.budget.max);

  const recent = cg.decisionHistory.slice(-6).reverse();

  const statement = (() => {
    if (cg.zone === 'suspended') {
      return `governance SUSPENDED — reliability composite drove zone to suspended; ` +
        `defer-acceptance ${cg.gradients.deferAcceptance.toFixed(2)}, recovery-weighting ${cg.gradients.recoveryWeighting.toFixed(2)}`;
    }
    if (cg.zone === 'restricted') {
      return `governance RESTRICTING — escalation permission ${cg.gradients.escalationPermission.toFixed(2)}, ` +
        `budget ${cg.budget.current.toFixed(1)}/${cg.budget.max}`;
    }
    if (cg.zone === 'watchful') {
      return `governance watching — gradients biased toward conservation ` +
        `(throughput ${cg.gradients.cognitionThroughput.toFixed(2)}, budget ${cg.budget.current.toFixed(1)}/${cg.budget.max})`;
    }
    return `governance unrestricted — all gradients near neutral, budget ${cg.budget.current.toFixed(1)}/${cg.budget.max}`;
  })();

  return {
    present: true,
    status,
    zone: cg.zone,
    budget: { ...cg.budget, ratio },
    gradients: cg.gradients,
    forecast: cg.forecast,
    recentDecisions: recent,
    zoneTransitions: cg.zoneTransitions,
    significantShifts: cg.significantShifts,
    statement,
  };
}
