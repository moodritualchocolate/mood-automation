/**
 * EXECUTIVE TRADEOFF ENGINE (Phase 36 — Strategic Priority Engine / Wave 4)
 *
 * Makes the executive trade-offs explicit. The system is allowed to
 * sacrifice engagement for truth, to reject a high-performing but
 * identity-eroding output, to preserve emotional coherence over
 * virality. This module names the trade-off and rules on it.
 */

export interface ExecutiveTradeoff {
  tradeoff: string;
  ruling: string;
  /** True when the ruling sacrifices short-term gain to protect truth. */
  sacrificed_for_truth: boolean;
}

export interface ExecutiveTradeoffReading {
  tradeoffs: ExecutiveTradeoff[];
  /** True when at least one trade-off protected truth over performance. */
  protected_truth: boolean;
  notes: string[];
}

export interface ExecutiveTradeoffInput {
  truthValue: number;          // 0..10
  engagementPull: number;      // 0..10
  identityRisk: number;        // 0..10
  saturationRisk: number;      // 0..10
  viralityRisk: number;        // 0..10
}

export function readExecutiveTradeoffs(input: ExecutiveTradeoffInput): ExecutiveTradeoffReading {
  const { truthValue, engagementPull, identityRisk, saturationRisk, viralityRisk } = input;
  const notes: string[] = [];
  const tradeoffs: ExecutiveTradeoff[] = [];

  // Engagement vs truth.
  if (engagementPull >= 6 && truthValue < 6) {
    tradeoffs.push({
      tradeoff: 'a high engagement pull against a weaker human truth',
      ruling: 'sacrifice the engagement — a banner that performs without being true erodes the organism',
      sacrificed_for_truth: true,
    });
  }
  // Virality vs coherence.
  if (viralityRisk >= 6) {
    tradeoffs.push({
      tradeoff: 'a shallow-virality reach against emotional coherence',
      ruling: 'preserve emotional coherence — refuse the viral reach',
      sacrificed_for_truth: true,
    });
  }
  // Identity-eroding high performer.
  if (identityRisk >= 6 && engagementPull >= 6) {
    tradeoffs.push({
      tradeoff: 'a high-performing but identity-eroding output',
      ruling: 'reject it — performance does not buy back a diluted identity',
      sacrificed_for_truth: true,
    });
  }
  // Saturation vs the temptation to ship anyway.
  if (saturationRisk >= 6) {
    tradeoffs.push({
      tradeoff: 'the temptation to ship into a saturated territory',
      ruling: 'defer — saturation makes even a true banner land shallow',
      sacrificed_for_truth: true,
    });
  }

  if (tradeoffs.length === 0) {
    tradeoffs.push({
      tradeoff: 'no executive trade-off in tension',
      ruling: 'proceed — truth, engagement and identity are not in conflict here',
      sacrificed_for_truth: false,
    });
  }

  const protected_truth = tradeoffs.some((t) => t.sacrificed_for_truth);
  notes.push(`executive trade-offs: ${tradeoffs.length} ruling(s); truth ${protected_truth ? 'protected' : 'not under threat'}`);
  for (const t of tradeoffs) notes.push(`trade-off: ${t.tradeoff} → ${t.ruling}`);

  return { tradeoffs, protected_truth, notes };
}
