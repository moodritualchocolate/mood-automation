/**
 * STRATEGIC PAUSE INFRASTRUCTURE (Phase 99 — Wave 8: Operating System Genesis)
 *
 * Wave 7 taught the organism when not to act. Wave 8 builds the
 * infrastructure that makes the pause real: a system-wide mode the
 * whole runtime enters together — light observation, deep pause, or
 * full recovery — rather than a single refused banner.
 */

import type { DirectiveReading } from './directiveEngine';

export type PauseMode = 'none' | 'light-observation' | 'deep-pause' | 'recovery-mode';

export interface StrategicPauseReading {
  pause_mode: PauseMode;
  /** 0..10 — how deep the pause runs. */
  pause_depth: number;
  /** True when the runtime is in a genuine system-wide pause. */
  in_deep_pause: boolean;
  notes: string[];
}

export interface StrategicPauseInput {
  directive: DirectiveReading;
  fatigueNeedsRecovery: boolean;
  shouldRest: boolean;
  organismAtRisk: boolean;
}

export function readStrategicPauseInfrastructure(input: StrategicPauseInput): StrategicPauseReading {
  const { directive, fatigueNeedsRecovery, shouldRest, organismAtRisk } = input;
  const notes: string[] = [];

  let pause_depth = 0;
  if (directive.directive === 'hibernate') pause_depth += 6;
  if (directive.directive === 'pause') pause_depth += 4;
  if (directive.directive === 'silence') pause_depth += 3;
  if (organismAtRisk) pause_depth += 3;
  if (fatigueNeedsRecovery) pause_depth += 2;
  if (shouldRest) pause_depth += 2;
  pause_depth = clamp10(round1(pause_depth));

  const pause_mode: PauseMode =
    pause_depth >= 8 ? 'recovery-mode' :
    pause_depth >= 5 ? 'deep-pause' :
    pause_depth >= 2 ? 'light-observation' : 'none';

  const in_deep_pause = pause_mode === 'deep-pause' || pause_mode === 'recovery-mode';

  notes.push(`strategic pause infrastructure: ${pause_mode} (depth ${pause_depth}/10)`);
  return { pause_mode, pause_depth, in_deep_pause, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
