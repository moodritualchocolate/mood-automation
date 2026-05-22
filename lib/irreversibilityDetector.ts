/**
 * IRREVERSIBILITY DETECTOR (Phase 172 — Wave 11: Strategic Future Intelligence)
 *
 * Reversible decisions can be made quickly; irreversible ones cannot.
 * This detector flags when a move cannot be taken back — when the
 * organism is about to spend something it can never re-earn.
 */

export interface IrreversibilityReading {
  /** 0..10 — how irreversible the decision is. */
  irreversibility: number;
  /** True when the decision cannot be undone. */
  decision_is_irreversible: boolean;
  reversibility_note: string;
  notes: string[];
}

export interface IrreversibilityInput {
  /** True when the run would sacrifice something strategic. */
  sacrificeInPlay: boolean;
  /** 0..10 — risk to identity continuity. */
  continuityRisk: number;
  /** True when the run would corrupt truth for optimization. */
  optimizationCorrupts: boolean;
  /** 0..10 — drift of the projected narrative from its origin. */
  narrativeDrift: number;
}

export function detectIrreversibility(input: IrreversibilityInput): IrreversibilityReading {
  const { sacrificeInPlay, continuityRisk, optimizationCorrupts, narrativeDrift } = input;
  const notes: string[] = [];

  let irreversibility = 0;
  if (optimizationCorrupts) irreversibility += 3;   // a broken trust does not fully heal
  irreversibility += continuityRisk * 0.4;
  irreversibility += narrativeDrift * 0.3;
  if (sacrificeInPlay) irreversibility += 1.5;
  irreversibility = round1(Math.max(0, Math.min(10, irreversibility)));

  const decision_is_irreversible = irreversibility >= 6.5;

  const reversibility_note = decision_is_irreversible
    ? 'this decision cannot be taken back — it must clear a higher bar than a reversible one'
    : irreversibility >= 4
      ? 'this decision is only partly reversible — undoing it would cost'
      : 'this decision is reversible — it can be corrected cheaply if it is wrong';

  notes.push(`irreversibility detector: ${irreversibility}/10 — ${reversibility_note}`);
  return { irreversibility, decision_is_irreversible, reversibility_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
