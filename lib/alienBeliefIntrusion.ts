/**
 * ALIEN BELIEF INTRUSION (Phase 365 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Detects beliefs that don't belong to the brand trying to take root.
 */

export interface AlienBeliefIntrusionReading {
  intrusion_detected: boolean;
  intruder: string | null;
  notes: string[];
}

export interface AlienBeliefIntrusionInput {
  newBeliefAdopted: boolean;
  beliefTraceableToOrigin: boolean;
}

export function readAlienBeliefIntrusion(input: AlienBeliefIntrusionInput): AlienBeliefIntrusionReading {
  const { newBeliefAdopted, beliefTraceableToOrigin } = input;
  const notes: string[] = [];

  const intrusion_detected = newBeliefAdopted && !beliefTraceableToOrigin;
  const intruder = intrusion_detected ? 'a belief the brand cannot trace to its own origin' : null;

  notes.push(`alien belief intrusion: ${intrusion_detected ? `INTRUSION — ${intruder}` : 'clean'}`);
  return { intrusion_detected, intruder, notes };
}
