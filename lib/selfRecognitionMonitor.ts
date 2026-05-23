/**
 * SELF-RECOGNITION MONITOR (Phase 337 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Would the brand's founders recognise this run? That is the deepest
 * test of whether the organism has remained itself.
 */

export interface SelfRecognitionReading {
  /** True when the founders would recognise this run as the brand. */
  founders_would_recognise: boolean;
  /** 0..10 — recognition score. */
  recognition: number;
  notes: string[];
}

export interface SelfRecognitionInput {
  identityHeld: boolean;
  voiceConsistent: boolean;
  invariantsIntact: boolean;
  resonanceSovereign: boolean;
}

export function readSelfRecognitionMonitor(input: SelfRecognitionInput): SelfRecognitionReading {
  const { identityHeld, voiceConsistent, invariantsIntact, resonanceSovereign } = input;
  const notes: string[] = [];

  const components = [identityHeld, voiceConsistent, invariantsIntact, resonanceSovereign];
  const recognition = round1((components.filter(Boolean).length / components.length) * 10);
  const founders_would_recognise = recognition >= 7;

  notes.push(`self-recognition monitor: ${founders_would_recognise ? 'RECOGNISED' : 'unrecognisable'} (${recognition}/10)`);
  return { founders_would_recognise, recognition, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
