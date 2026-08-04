/**
 * AUTONOMOUS RUNTIME STABILIZATION (Phase 108 — Wave 8: Operating System Genesis)
 *
 * A real operating system heals itself. This module is the runtime's
 * self-stabilisation layer: without being asked, it corrects drift,
 * sheds load, defragments a tangled cognition graph, and — when the
 * runtime is genuinely unstable — performs an emergency stabilisation.
 */

import type { KernelHealthReading } from './kernelHealthMonitor';
import type { KernelReading } from './cognitiveKernel';

export type StabilizationAction =
  | 'none' | 'correct-drift' | 'shed-load' | 'defragment' | 'emergency-stabilize';

export interface StabilizationReading {
  stabilization_action: StabilizationAction;
  /** True when the runtime is stable enough to operate normally. */
  runtime_stable: boolean;
  reason: string;
  notes: string[];
}

export interface StabilizationInput {
  health: KernelHealthReading;
  kernel: KernelReading;
  /** Consecutive fragmented ticks the OS has recorded. */
  fragmentationStreak: number;
  /** True when runtime drift was detected (Phase 27). */
  runtimeDrift: boolean;
  /** True when the active cognition graph is tangled (Phase 96). */
  graphTangled: boolean;
}

export function readAutonomousRuntimeStabilization(input: StabilizationInput): StabilizationReading {
  const { health, kernel, fragmentationStreak, runtimeDrift, graphTangled } = input;
  const notes: string[] = [];

  let stabilization_action: StabilizationAction;
  let reason: string;

  if (health.failure_modes.length >= 3 || fragmentationStreak >= 3 || health.overall_health < 3) {
    stabilization_action = 'emergency-stabilize';
    reason = 'the runtime is genuinely unstable — emergency stabilisation: collapse onto survival-critical cognition';
  } else if (graphTangled || kernel.kernel_state === 'throttled') {
    stabilization_action = 'defragment';
    reason = 'the cognition graph is tangled — defragment the working set and rebuild clean references';
  } else if (health.cognitive_overload || health.attention_exhaustion) {
    stabilization_action = 'shed-load';
    reason = 'the runtime is overloaded — shed peripheral cognition to recover headroom';
  } else if (runtimeDrift) {
    stabilization_action = 'correct-drift';
    reason = 'the runtime has drifted from its baseline — apply a gentle correction';
  } else {
    stabilization_action = 'none';
    reason = 'the runtime is stable — no stabilisation required';
  }

  const runtime_stable =
    stabilization_action === 'none' || stabilization_action === 'correct-drift';

  notes.push(`autonomous runtime stabilization: ${stabilization_action} — ${reason}`);
  return { stabilization_action, runtime_stable, reason, notes };
}
