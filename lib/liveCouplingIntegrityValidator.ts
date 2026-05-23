/**
 * LIVE COUPLING INTEGRITY VALIDATOR (Phase 311 — Wave 14: Live Civilization Coupling)
 *
 * Validates that the live coupling layer's signals have integrity
 * worth acting on.
 */

export interface LiveCouplingIntegrityReading {
  /** True when the live signal has integrity. */
  integrity_holds: boolean;
  /** 0..10 — integrity score. */
  integrity_score: number;
  integrity_issues: string[];
  notes: string[];
}

export interface LiveCouplingIntegrityInput {
  liveCouplingHealth: number;
  signalIsFresh: boolean;
  fieldIsCoherent: boolean;
  attributionHolds: boolean;
}

export function readLiveCouplingIntegrityValidator(input: LiveCouplingIntegrityInput): LiveCouplingIntegrityReading {
  const { liveCouplingHealth, signalIsFresh, fieldIsCoherent, attributionHolds } = input;
  const notes: string[] = [];

  const integrity_issues: string[] = [];
  if (liveCouplingHealth < 5) integrity_issues.push('live coupling health below threshold');
  if (!signalIsFresh) integrity_issues.push('signal is stale');
  if (!fieldIsCoherent) integrity_issues.push('field is incoherent');
  if (!attributionHolds) integrity_issues.push('attribution does not hold');

  const integrity_score = round1(Math.max(0, 10 - integrity_issues.length * 2.5));
  const integrity_holds = integrity_issues.length === 0;

  notes.push(`live coupling integrity validator: ${integrity_holds ? 'holds' : `${integrity_issues.length} issue(s)`} (${integrity_score}/10)`);
  return { integrity_holds, integrity_score, integrity_issues, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
