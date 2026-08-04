/**
 * STRATEGIC WITHHOLDING ENGINE (Phase 213 — Wave 12: Autonomous Action Architecture)
 *
 * The deliberate counterpart to the publish engine. Withholding is not
 * the absence of action — it is an action. This engine decides what
 * the organism should deliberately NOT do, and treats that choice as
 * a positive strategic move.
 */

export interface StrategicWithholdingReading {
  /** True when the engine recommends withholding the action. */
  withhold: boolean;
  /** 0..10 — strategic value of withholding. */
  withholding_value: number;
  withholding_case: string;
  notes: string[];
}

export interface StrategicWithholdingInput {
  /** True when the action is worthy. */
  actionIsWorthy: boolean;
  /** True when silence is enforced. */
  silenceEnforced: boolean;
  /** True when the audience needs recovery. */
  audienceNeedsRecovery: boolean;
  /** 0..10 — restraint budget (low budget raises the value of withholding). */
  restraintBudget: number;
}

export function readStrategicWithholdingEngine(input: StrategicWithholdingInput): StrategicWithholdingReading {
  const { actionIsWorthy, silenceEnforced, audienceNeedsRecovery, restraintBudget } = input;
  const notes: string[] = [];

  let withholding_value = 0;
  if (silenceEnforced) withholding_value += 5;
  if (audienceNeedsRecovery) withholding_value += 3;
  if (!actionIsWorthy) withholding_value += 4;
  withholding_value += Math.max(0, (4 - restraintBudget) * 0.6);
  withholding_value = round1(Math.min(10, withholding_value));

  const withhold = withholding_value >= 5 || !actionIsWorthy || silenceEnforced;

  const withholding_case = !withhold
    ? 'nothing to withhold — the action is worthy and conditions allow it'
    : !actionIsWorthy
      ? 'withhold — the action is not worthy; not doing it is the strategic move'
      : silenceEnforced
        ? 'withhold — silence is enforced; withholding is obedience to a hard stop'
        : 'withhold — the audience is owed recovery; the gift this cycle is restraint';

  notes.push(`strategic withholding engine: ${withhold ? 'WITHHOLD' : 'no withholding'} (value ${withholding_value}/10) — ${withholding_case}`);
  return { withhold, withholding_value, withholding_case, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
