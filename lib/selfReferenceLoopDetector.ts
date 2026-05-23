/**
 * SELF-REFERENCE LOOP DETECTOR (Phase 361 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Catches the brand getting trapped in self-reference — speaking about
 * itself more than about the world.
 */

export interface SelfReferenceLoopReading {
  in_loop: boolean;
  /** 0..10 — how self-referential the run is. */
  self_reference_density: number;
  notes: string[];
}

export interface SelfReferenceLoopInput {
  cyclesAboutSelf: number;
  cyclesAboutWorld: number;
}

export function readSelfReferenceLoopDetector(input: SelfReferenceLoopInput): SelfReferenceLoopReading {
  const { cyclesAboutSelf, cyclesAboutWorld } = input;
  const notes: string[] = [];

  const total = cyclesAboutSelf + cyclesAboutWorld;
  const self_reference_density = total > 0 ? round1((cyclesAboutSelf / total) * 10) : 0;
  const in_loop = self_reference_density >= 7;

  notes.push(`self-reference loop detector: ${in_loop ? 'IN LOOP' : 'outward-looking'} (density ${self_reference_density}/10)`);
  return { in_loop, self_reference_density, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
