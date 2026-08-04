/**
 * EXECUTION MEMORY PERSISTENCE (Phase 194 — Wave 12: Autonomous Action Architecture)
 *
 * The action layer must remember what it has done. This module reads
 * the persisted execution memory and reports whether the organism's
 * record of its own action is intact and honest.
 */

export interface ExecutionMemoryReading {
  /** True when the execution memory is persisting across cycles. */
  memory_persisting: boolean;
  /** Total actions on record. */
  actions_on_record: number;
  /** Ratio of withheld actions to total — a record of restraint. */
  restraint_ratio: number;
  memory_note: string;
  notes: string[];
}

export interface ExecutionMemoryInput {
  executionCycles: number;
  actionsAuthorized: number;
  actionsWithheld: number;
}

export function readExecutionMemoryPersistence(input: ExecutionMemoryInput): ExecutionMemoryReading {
  const { executionCycles, actionsAuthorized, actionsWithheld } = input;
  const notes: string[] = [];

  const actions_on_record = actionsAuthorized + actionsWithheld;
  const memory_persisting = executionCycles > 0 && actions_on_record === executionCycles;
  const restraint_ratio = actions_on_record > 0
    ? round2(actionsWithheld / actions_on_record)
    : 0;

  const memory_note = executionCycles === 0
    ? 'no execution history yet — the action layer is acting for the first time'
    : memory_persisting
      ? `execution memory intact — ${actions_on_record} actions on record, ${Math.round(restraint_ratio * 100)}% were restraint`
      : 'execution memory is inconsistent — the record does not match the cycle count';

  notes.push(`execution memory persistence: ${memory_note}`);
  return { memory_persisting, actions_on_record, restraint_ratio, memory_note, notes };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
