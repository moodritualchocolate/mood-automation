/**
 * STRATEGIC FUTURE GOVERNOR (Phase 179 — Wave 11: Strategic Future Intelligence)
 *
 * The governor of the whole future-intelligence layer. It reads the
 * key signals — debt, compounding advantage, coherence, second-order
 * cost — into one judgement: is the organism compounding a future,
 * merely drifting, or optimizing for the present at the future's
 * expense?
 */

export type FutureGovernance = 'compounding' | 'drifting' | 'now-optimizing';

export interface StrategicFutureGovernorReading {
  governance: FutureGovernance;
  /** True when the future-intelligence layer is genuinely governing. */
  future_governed: boolean;
  reason: string;
  notes: string[];
}

export interface StrategicFutureGovernorInput {
  strategicDebtDangerous: boolean;
  advantageIsCompounding: boolean;
  futureIsCoherent: boolean;
  secondOrderNegative: boolean;
}

export function readStrategicFutureGovernor(input: StrategicFutureGovernorInput): StrategicFutureGovernorReading {
  const { strategicDebtDangerous, advantageIsCompounding, futureIsCoherent, secondOrderNegative } = input;
  const notes: string[] = [];

  let governance: FutureGovernance;
  let reason: string;

  if (strategicDebtDangerous || secondOrderNegative) {
    governance = 'now-optimizing';
    reason = strategicDebtDangerous
      ? 'strategic debt has grown dangerous — the organism is living on its future'
      : 'a negative second-order cost is being charged to the future for a present gain';
  } else if (!futureIsCoherent || !advantageIsCompounding) {
    governance = 'drifting';
    reason = !futureIsCoherent
      ? 'the future plan contradicts itself — there is no coherent future being governed toward'
      : 'no advantage is compounding — the organism is holding, not building';
  } else {
    governance = 'compounding';
    reason = 'debt is contained, the future is coherent, and advantage is compounding — the organism is governing toward a future';
  }

  const future_governed = governance === 'compounding';

  notes.push(`strategic future governor: ${governance} — ${reason}`);
  return { governance, future_governed, reason, notes };
}
