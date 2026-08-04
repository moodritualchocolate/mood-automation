/**
 * PROCESS SCHEDULER (Phase 92 — Wave 8: Operating System Genesis)
 *
 * The kernel cannot run every cognitive process at once. The scheduler
 * decides which processes receive attention, priority, and an execution
 * window this tick — and which are deferred or starved. A healthy OS
 * never lets a survival-critical process starve.
 */

import type { KernelReading } from './cognitiveKernel';

export type ProcessWindow = 'now' | 'deferred' | 'starved';

export const COGNITIVE_PROCESSES = [
  'identity-defense',
  'human-truth',
  'strategic-planning',
  'immune-response',
  'recovery',
  'world-modeling',
  'creative-direction',
] as const;
export type CognitiveProcess = (typeof COGNITIVE_PROCESSES)[number];

export interface ScheduledProcess {
  name: CognitiveProcess;
  priority: number;          // 0..10
  window: ProcessWindow;
}

export interface ProcessScheduleReading {
  processes: ScheduledProcess[];
  /** The process holding the foreground this tick. */
  foreground_process: CognitiveProcess;
  deferred_count: number;
  starved_count: number;
  notes: string[];
}

export interface ProcessScheduleInput {
  kernel: KernelReading;
  /** 0..10 — the organism's energy reserves. */
  energyReserves: number;
  /** True when the civilization needs recovery. */
  fatigueNeedsRecovery: boolean;
  /** 0..10 — existential risk to the organism. */
  existentialRisk: number;
}

export function readProcessScheduler(input: ProcessScheduleInput): ProcessScheduleReading {
  const { kernel, energyReserves, fatigueNeedsRecovery, existentialRisk } = input;
  const notes: string[] = [];

  // Base priority per process, then state modifiers.
  const priority: Record<CognitiveProcess, number> = {
    'identity-defense': 6,
    'human-truth': 7,
    'strategic-planning': 5,
    'immune-response': 4,
    'recovery': 3,
    'world-modeling': 5,
    'creative-direction': 6,
  };

  // Survival pressure raises identity-defense, immune-response, recovery
  // and lowers the discretionary processes.
  if (existentialRisk >= 6) {
    priority['identity-defense'] += 3;
    priority['recovery'] += 3;
    priority['immune-response'] += 2;
    priority['creative-direction'] -= 3;
    priority['strategic-planning'] -= 1;
  }
  if (fatigueNeedsRecovery) {
    priority['recovery'] += 3;
    priority['creative-direction'] -= 2;
  }
  if (energyReserves <= 3) {
    priority['recovery'] += 2;
    priority['world-modeling'] -= 2;
    priority['creative-direction'] -= 2;
  }
  // Protected mode collapses the schedule onto survival-critical work.
  if (kernel.kernel_state === 'protected-mode') {
    priority['creative-direction'] -= 4;
    priority['strategic-planning'] -= 3;
    priority['world-modeling'] -= 3;
  }

  const processes: ScheduledProcess[] = COGNITIVE_PROCESSES.map((name) => ({
    name,
    priority: clamp10(round1(priority[name])),
    window: 'deferred' as ProcessWindow,
  })).sort((a, b) => b.priority - a.priority);

  // The highest-priority process holds the foreground; the rest are
  // deferred unless their priority has collapsed — then they starve.
  processes.forEach((p, i) => {
    p.window = i === 0 ? 'now' : p.priority >= 3.5 ? 'deferred' : 'starved';
  });

  const foreground_process = processes[0].name;
  const deferred_count = processes.filter((p) => p.window === 'deferred').length;
  const starved_count = processes.filter((p) => p.window === 'starved').length;

  notes.push(`process scheduler: foreground "${foreground_process}" — ${deferred_count} deferred, ${starved_count} starved`);
  return { processes, foreground_process, deferred_count, starved_count, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
