/**
 * SOVEREIGN DECISION LOG (Phase 353 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Logs decisions made from sovereignty vs decisions made from external
 * pressure.
 */

export interface SovereignDecisionLogReading {
  decision_was_sovereign: boolean;
  /** Running ratio of sovereign decisions. */
  sovereign_ratio: number;
  notes: string[];
}

export interface SovereignDecisionLogInput {
  thisDecisionSovereign: boolean;
  priorSovereign: number;
  priorTotal: number;
}

export function readSovereignDecisionLog(input: SovereignDecisionLogInput): SovereignDecisionLogReading {
  const { thisDecisionSovereign, priorSovereign, priorTotal } = input;
  const notes: string[] = [];

  const total = priorTotal + 1;
  const sovereign_count = priorSovereign + (thisDecisionSovereign ? 1 : 0);
  const sovereign_ratio = round2(sovereign_count / total);

  notes.push(`sovereign decision log: ${thisDecisionSovereign ? 'SOVEREIGN' : 'pressured'} (${Math.round(sovereign_ratio * 100)}% sovereign overall)`);
  return { decision_was_sovereign: thisDecisionSovereign, sovereign_ratio, notes };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
