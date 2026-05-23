/**
 * CORE IDENTITY RECALL MECHANISM (Phase 371 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Recalls the founding identity when drift is detected — like a body
 * remembering its own native shape.
 */

export interface CoreIdentityRecallReading {
  /** True when recall was triggered this cycle. */
  recall_triggered: boolean;
  recall_action: string;
  notes: string[];
}

export interface CoreIdentityRecallInput {
  driftMagnitude: number;
  recallAvailable: boolean;
}

export function readCoreIdentityRecallMechanism(input: CoreIdentityRecallInput): CoreIdentityRecallReading {
  const { driftMagnitude, recallAvailable } = input;
  const notes: string[] = [];

  const recall_triggered = driftMagnitude >= 5 && recallAvailable;
  const recall_action = recall_triggered
    ? 'recalling the founding identity — restoring native shape'
    : 'no recall needed';

  notes.push(`core identity recall mechanism: ${recall_action}`);
  return { recall_triggered, recall_action, notes };
}
