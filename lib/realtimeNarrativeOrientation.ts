/**
 * REALTIME NARRATIVE ORIENTATION (Phase 297 — Wave 14: Live Civilization Coupling)
 *
 * Which way the live narrative is pointing — toward the brand's
 * intent or away from it.
 */

export type NarrativeOrientation = 'with-intent' | 'crosswise' | 'against-intent';

export interface RealtimeNarrativeOrientationReading {
  orientation: NarrativeOrientation;
  /** True when the live narrative still points where the brand intended. */
  on_course: boolean;
  notes: string[];
}

export interface RealtimeNarrativeOrientationInput {
  receptionFidelity: number;
  counterNarrative: boolean;
}

export function readRealtimeNarrativeOrientation(input: RealtimeNarrativeOrientationInput): RealtimeNarrativeOrientationReading {
  const { receptionFidelity, counterNarrative } = input;
  const notes: string[] = [];

  const orientation: NarrativeOrientation =
    counterNarrative ? 'against-intent' :
    receptionFidelity >= 6 ? 'with-intent' : 'crosswise';

  const on_course = orientation === 'with-intent';

  notes.push(`realtime narrative orientation: ${orientation}`);
  return { orientation, on_course, notes };
}
