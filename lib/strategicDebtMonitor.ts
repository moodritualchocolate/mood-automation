/**
 * STRATEGIC DEBT MONITOR (Phase 169 — Wave 11: Strategic Future Intelligence)
 *
 * Every present-optimized decision borrows from the future. That
 * borrowing is strategic debt — invisible until it compounds. This
 * monitor tracks the debt and flags when it has grown dangerous.
 */

export interface StrategicDebtReading {
  /** 0..10 — accumulated strategic debt. */
  strategic_debt: number;
  /** True when the debt has grown dangerous to the future. */
  debt_is_dangerous: boolean;
  debt_source: string;
  notes: string[];
}

export interface StrategicDebtInput {
  /** 0..10 — strategic debt carried from the strategic state. */
  priorDebt: number;
  /** Times the organism optimized for now. */
  nowOptimizedCount: number;
  /** True when the run would optimize for the present again. */
  optimizingForNow: boolean;
}

export function readStrategicDebt(input: StrategicDebtInput): StrategicDebtReading {
  const { priorDebt, nowOptimizedCount, optimizingForNow } = input;
  const notes: string[] = [];

  let strategic_debt = priorDebt;
  if (optimizingForNow) strategic_debt += 1;
  strategic_debt = round1(Math.max(0, Math.min(10, strategic_debt)));

  const debt_is_dangerous = strategic_debt >= 7;

  const debt_source =
    nowOptimizedCount >= 4 ? `${nowOptimizedCount} present-optimized decisions have borrowed against the future`
    : optimizingForNow ? 'this run would add fresh debt — another present gain charged to the future'
    : 'the debt is from accumulated small compromises, not one large one';

  notes.push(`strategic debt monitor: ${strategic_debt}/10` +
    (debt_is_dangerous ? ` — DANGEROUS: ${debt_source}` : ''));
  return { strategic_debt, debt_is_dangerous, debt_source, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
