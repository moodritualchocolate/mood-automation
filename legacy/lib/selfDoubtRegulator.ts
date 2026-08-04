/**
 * SELF-DOUBT REGULATOR (Phase 387 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Regulates self-doubt. Too little = arrogance. Too much = paralysis.
 */

export type DoubtState = 'too-little' | 'healthy' | 'too-much';

export interface SelfDoubtRegulatorReading {
  doubt_state: DoubtState;
  notes: string[];
}

export interface SelfDoubtRegulatorInput {
  doubtLevel: number;     // 0..10
}

export function readSelfDoubtRegulator(input: SelfDoubtRegulatorInput): SelfDoubtRegulatorReading {
  const { doubtLevel } = input;
  const notes: string[] = [];

  const doubt_state: DoubtState =
    doubtLevel < 2 ? 'too-little' :
    doubtLevel > 7 ? 'too-much' : 'healthy';

  notes.push(`self-doubt regulator: ${doubt_state} (doubt ${doubtLevel}/10)`);
  return { doubt_state, notes };
}
