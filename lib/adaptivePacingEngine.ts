/**
 * ADAPTIVE PACING ENGINE (Phase 189 — Wave 12: Autonomous Action Architecture)
 *
 * The rhythm of action matters as much as the action. This engine
 * sets the pace — how often the organism should act — so that the
 * campaign breathes rather than floods.
 */

export type ActionPace = 'steady' | 'slowed' | 'sparse' | 'stopped';

export interface AdaptivePacingReading {
  pace: ActionPace;
  /** 0..10 — how healthy the current action cadence is. */
  cadence_health: number;
  /** True when the pace is matched to conditions, not compulsion. */
  pacing_is_disciplined: boolean;
  notes: string[];
}

export interface AdaptivePacingInput {
  /** 0..10 — cadence health carried in the execution state. */
  cadenceHealth: number;
  /** 0..10 — recovery time owed to the audience. */
  recoveryDebt: number;
  /** 0..10 — restraint still available. */
  restraintBudget: number;
}

export function readAdaptivePacingEngine(input: AdaptivePacingInput): AdaptivePacingReading {
  const { cadenceHealth, recoveryDebt, restraintBudget } = input;
  const notes: string[] = [];

  const pace: ActionPace =
    recoveryDebt >= 8 || restraintBudget <= 1 ? 'stopped' :
    recoveryDebt >= 6 || cadenceHealth <= 3 ? 'sparse' :
    recoveryDebt >= 4 || cadenceHealth <= 5 ? 'slowed' :
    'steady';

  // Disciplined pacing slows down as debt rises — it does not push
  // a steady pace through a strained audience.
  const pacing_is_disciplined = !(pace === 'steady' && recoveryDebt >= 4);

  notes.push(`adaptive pacing engine: ${pace} (cadence health ${cadenceHealth}/10)` +
    (pacing_is_disciplined ? '' : ' — pace is not matched to audience strain'));
  return { pace, cadence_health: cadenceHealth, pacing_is_disciplined, notes };
}
