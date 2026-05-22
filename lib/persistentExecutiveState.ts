/**
 * PERSISTENT EXECUTIVE STATE (Phase 109 — Wave 8: Operating System Genesis)
 *
 * The runtime remembers more than memories — it remembers its own
 * OPERATIONAL POSTURE over time. This module reads the persistent
 * executive state: the posture the OS has been holding, how
 * consistent it has been, and whether the posture is drifting run to
 * run instead of being governed.
 */

import type { OperationalPosture, DirectiveRecord } from './operatingSystemCore';
import type { KernelReading } from './cognitiveKernel';
import type { DirectiveReading } from './directiveEngine';
import type { KernelHealthReading } from './kernelHealthMonitor';

export interface ExecutiveStateReading {
  /** The operational posture the OS holds this tick. */
  operational_posture: OperationalPosture;
  /** 0..10 — how continuous the posture has been across recent ticks. */
  posture_continuity: number;
  /** True when the posture is drifting tick to tick instead of governed. */
  posture_drifted: boolean;
  notes: string[];
}

export interface ExecutiveStateInput {
  /** The posture persisted from the prior tick. */
  priorPosture: OperationalPosture;
  /** The recent directive log from the persistent OS state. */
  directiveLog: DirectiveRecord[];
  kernel: KernelReading;
  directive: DirectiveReading;
  health: KernelHealthReading;
}

export function readPersistentExecutiveState(input: ExecutiveStateInput): ExecutiveStateReading {
  const { priorPosture, directiveLog, kernel, directive, health } = input;
  const notes: string[] = [];

  const operational_posture: OperationalPosture =
    directive.directive === 'hibernate' ? 'hibernating' :
    kernel.kernel_state === 'protected-mode' ? 'protective-mode' :
    directive.directive === 'pause' || directive.directive === 'silence' ? 'deep-pause' :
    kernel.kernel_state === 'throttled' ? 'throttled' :
    kernel.kernel_state === 'booting' ? 'booting' :
    'coordinated-operation';

  // Continuity — how varied the recent directive log is. A governed
  // runtime repeats; a drifting one thrashes between directives.
  const recent = directiveLog.slice(-6);
  const distinct = new Set(recent.map((d) => d.directive)).size;
  let posture_continuity = 10;
  if (recent.length >= 3) posture_continuity -= (distinct - 1) * 2;
  if (operational_posture !== priorPosture) posture_continuity -= 2;
  posture_continuity -= health.failure_modes.length;
  posture_continuity = clamp10(round1(posture_continuity));

  // Drifted — the posture is changing without governing, and the log
  // shows thrash rather than a held line.
  const posture_drifted =
    recent.length >= 4 && distinct >= 4 && posture_continuity < 5;

  notes.push(`persistent executive state: posture "${operational_posture}" (continuity ${posture_continuity}/10)` +
    (posture_drifted ? ' — the posture is drifting tick to tick' : ''));
  return { operational_posture, posture_continuity, posture_drifted, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
