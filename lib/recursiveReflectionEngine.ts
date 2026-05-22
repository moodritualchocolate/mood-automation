/**
 * RECURSIVE REFLECTION ENGINE (Phase 103 — Wave 8: Operating System Genesis)
 *
 * The runtime does not only think — it reflects on HOW it is thinking.
 * This engine inspects the operating system's own structure each tick:
 * is the kernel coordinating, are the loops healthy, is the runtime
 * operating well — or has the structure itself started to fail?
 */

import type { KernelReading } from './cognitiveKernel';
import type { KernelHealthReading } from './kernelHealthMonitor';

export interface RecursiveReflectionReading {
  reflection: string;
  /** A structural observation about the runtime's own operation. */
  structural_insight: string;
  /** True when the runtime is operating well as a structure. */
  operating_well: boolean;
  notes: string[];
}

export interface RecursiveReflectionInput {
  kernel: KernelReading;
  health: KernelHealthReading;
}

export function readRecursiveReflectionEngine(input: RecursiveReflectionInput): RecursiveReflectionReading {
  const { kernel, health } = input;
  const notes: string[] = [];

  const operating_well =
    kernel.kernel_state === 'running' &&
    kernel.coordination_score >= 6 &&
    health.overall_health >= 6 &&
    health.failure_modes.length === 0;

  let structural_insight: string;
  if (health.failure_modes.length >= 2) {
    structural_insight = `the runtime structure is failing on multiple fronts — ${health.failure_modes.join(', ')}`;
  } else if (health.failure_modes.length === 1) {
    structural_insight = `one structural failure mode is active — ${health.failure_modes[0]}`;
  } else if (kernel.kernel_state === 'throttled') {
    structural_insight = 'the structure is sound but throttled — the runtime is trading depth for stability';
  } else if (kernel.kernel_state === 'booting') {
    structural_insight = 'the runtime structure is still being established';
  } else {
    structural_insight = 'the kernel, loops, and scheduler are coordinating as one structure';
  }

  const reflection = operating_well
    ? 'recursive reflection: the operating system is operating well — it can trust its own structure this tick'
    : 'recursive reflection: the operating system should attend to its own structure before it attends to output';

  notes.push(reflection);
  notes.push(`recursive reflection: ${structural_insight}`);
  return { reflection, structural_insight, operating_well, notes };
}
