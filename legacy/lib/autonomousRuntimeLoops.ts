/**
 * AUTONOMOUS RUNTIME LOOPS (Phase 98 — Wave 8: Operating System Genesis)
 *
 * A real OS runs background processes that never stop. These are the
 * runtime's autonomous loops — world-observation, identity-maintenance,
 * memory-consolidation, immune-patrol — that keep evolving cognition
 * between banners. The module watches their health and flags a loop
 * that has gone runaway.
 */

import type { KernelReading } from './cognitiveKernel';
import type { ComplexityRegulationReading } from './internalComplexityRegulation';

export const BACKGROUND_LOOPS = [
  'world-observation',
  'identity-maintenance',
  'memory-consolidation',
  'immune-patrol',
] as const;
export type BackgroundLoop = (typeof BACKGROUND_LOOPS)[number];

export interface RuntimeLoopsReading {
  active_loops: BackgroundLoop[];
  /** 0..10 — how healthy the background loops are. */
  loop_health: number;
  /** True when a loop is consuming runaway resources. */
  a_loop_is_runaway: boolean;
  notes: string[];
}

export interface RuntimeLoopsInput {
  kernel: KernelReading;
  complexity: ComplexityRegulationReading;
  /** Kernel ticks the OS has lived. */
  uptime: number;
}

export function readAutonomousRuntimeLoops(input: RuntimeLoopsInput): RuntimeLoopsReading {
  const { kernel, complexity, uptime } = input;
  const notes: string[] = [];

  // In protected mode only the survival-critical loops keep running.
  const active_loops: BackgroundLoop[] =
    kernel.kernel_state === 'protected-mode'
      ? ['identity-maintenance', 'immune-patrol']
      : [...BACKGROUND_LOOPS];

  let loop_health = 0;
  loop_health += kernel.coordination_score * 0.6;
  loop_health += (10 - complexity.complexity_load) * 0.4;
  // A booting OS has not yet stabilised its loops.
  if (uptime === 0) loop_health -= 1.5;
  loop_health = clamp10(round1(loop_health));

  // A runaway loop — over-thinking means a loop is consuming the
  // runtime without converging.
  const a_loop_is_runaway = complexity.over_thinking && kernel.coordination_score < 5;

  notes.push(`autonomous runtime loops: ${active_loops.length} loop(s) active, health ${loop_health}/10` +
    (a_loop_is_runaway ? ' — a loop has gone runaway' : ''));
  return { active_loops, loop_health, a_loop_is_runaway, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
