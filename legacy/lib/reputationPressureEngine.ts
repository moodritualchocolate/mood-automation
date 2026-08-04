/**
 * REPUTATION PRESSURE ENGINE (Phase 140 — Wave 10: Reality Coupling Architecture)
 *
 * Reputation exerts a force. It can pull the organism toward
 * protecting what it has earned — or toward extracting from it,
 * spending credibility for a moment's reach. This engine reads which
 * way the reputation pressure is pulling this cycle.
 */

export type ReputationPressureKind = 'protective' | 'neutral' | 'extractive';

export interface ReputationPressureReading {
  /** 0..10 — how much pressure reputation is exerting. */
  reputation_pressure: number;
  pressure_kind: ReputationPressureKind;
  /** True when reputation is being spent rather than protected. */
  reputation_at_risk: boolean;
  notes: string[];
}

export interface ReputationPressureInput {
  /** 0..10 — reputation credit carried from the coupling state. */
  reputationCredit: number;
  /** 0..10 — current trust standing (Phase 134). */
  trustLevel: number;
  optimizationCorrupts: boolean;
}

export function readReputationPressure(input: ReputationPressureInput): ReputationPressureReading {
  const { reputationCredit, trustLevel, optimizationCorrupts } = input;
  const notes: string[] = [];

  // Pressure is highest when there is much credit to either protect
  // or spend.
  const reputation_pressure = round1(Math.min(10, reputationCredit * 0.6 + trustLevel * 0.4));

  const pressure_kind: ReputationPressureKind =
    optimizationCorrupts ? 'extractive' :
    reputationCredit >= 6 && trustLevel >= 6 ? 'protective' : 'neutral';

  const reputation_at_risk = pressure_kind === 'extractive';

  notes.push(`reputation pressure engine: ${reputation_pressure}/10 — ${pressure_kind}` +
    (reputation_at_risk ? ' — reputation is being spent for reach, not protected' : ''));
  return { reputation_pressure, pressure_kind, reputation_at_risk, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
