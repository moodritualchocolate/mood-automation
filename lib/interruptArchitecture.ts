/**
 * INTERRUPT ARCHITECTURE (Phase 93 — Wave 8: Operating System Genesis)
 *
 * A real operating system does not poll — it is interrupted. This is
 * the OS's global interruption system: world shifts, fatigue, identity
 * risk, environmental emergencies, contradictions, and memetic
 * infections each raise a hardware-style interrupt the kernel must
 * service before ordinary cognition resumes.
 */

export type InterruptKind =
  | 'world-shift'
  | 'fatigue'
  | 'identity-risk'
  | 'environmental-emergency'
  | 'contradiction'
  | 'memetic-infection';

export interface CognitiveInterrupt {
  kind: InterruptKind;
  /** 0..10 — how urgently the kernel must service it. */
  severity: number;
  demand: string;
}

export interface InterruptReading {
  interrupts: CognitiveInterrupt[];
  /** The highest-severity interrupt, or null when the line is quiet. */
  highest: CognitiveInterrupt | null;
  /** True when an interrupt is severe enough to pre-empt ordinary cognition. */
  interrupt_demands_handling: boolean;
  notes: string[];
}

export interface InterruptInput {
  /** 0..10 — how fast the world is shifting (Phase 83). */
  worldShiftRate: number;
  modelLagging: boolean;
  fatigueNeedsRecovery: boolean;
  /** True when the identity stress test failed (Phase 75). */
  identityFailing: boolean;
  ideologicalMutation: boolean;
  environmentHostile: boolean;
  organismAtRisk: boolean;
  /** Count of unresolved internal contradictions this run. */
  contradictionCount: number;
  memeticInfection: boolean;
}

export function readInterruptArchitecture(input: InterruptInput): InterruptReading {
  const notes: string[] = [];
  const interrupts: CognitiveInterrupt[] = [];

  if (input.organismAtRisk) {
    interrupts.push({ kind: 'environmental-emergency', severity: 10, demand: 'the organism is at existential risk — the kernel must enter protected mode' });
  } else if (input.environmentHostile) {
    interrupts.push({ kind: 'environmental-emergency', severity: 6, demand: 'the environment is hostile — raise the kernel\'s guard' });
  }
  if (input.modelLagging || input.worldShiftRate >= 7) {
    interrupts.push({ kind: 'world-shift', severity: input.modelLagging ? 7 : 5, demand: 'reality has shifted faster than the model — re-observe before acting' });
  }
  if (input.fatigueNeedsRecovery) {
    interrupts.push({ kind: 'fatigue', severity: 6, demand: 'the organism is fatigued — the scheduler must yield time to recovery' });
  }
  if (input.identityFailing || input.ideologicalMutation) {
    interrupts.push({ kind: 'identity-risk', severity: input.ideologicalMutation ? 8 : 6, demand: 'the identity is under threat — runtime identity enforcement must be serviced' });
  }
  if (input.contradictionCount >= 4) {
    interrupts.push({ kind: 'contradiction', severity: Math.min(8, 3 + input.contradictionCount), demand: 'unresolved contradictions are accumulating — the kernel must arbitrate' });
  }
  if (input.memeticInfection) {
    interrupts.push({ kind: 'memetic-infection', severity: 7, demand: 'a memetic pathogen reached the runtime — the immune process must pre-empt' });
  }

  interrupts.sort((a, b) => b.severity - a.severity);
  const highest = interrupts[0] ?? null;
  const interrupt_demands_handling = highest !== null && highest.severity >= 6;

  notes.push(interrupts.length === 0
    ? 'interrupt architecture: the interrupt line is quiet'
    : `interrupt architecture: ${interrupts.length} interrupt(s) raised — highest "${highest!.kind}" (severity ${highest!.severity}/10)`);
  return { interrupts, highest, interrupt_demands_handling, notes };
}
