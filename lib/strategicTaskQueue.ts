/**
 * STRATEGIC TASK QUEUE (Phase 94 — Wave 8: Operating System Genesis)
 *
 * Not every cognition must run now. The strategic task queue is the
 * OS's long-lived priority list — work that is deferred, carried
 * across ticks, and adaptively reprioritised when an interrupt
 * changes what matters. Deferred thinking is a feature, not a backlog.
 */

import type { ProcessScheduleReading } from './processScheduler';
import type { InterruptReading } from './interruptArchitecture';

export interface QueuedTask {
  task: string;
  priority: number;          // 0..10
}

export interface TaskQueueReading {
  queue_depth: number;
  /** The task the kernel should pick up next, or null when the queue is clear. */
  next_task: string | null;
  deferred_tasks: string[];
  /** True when an interrupt forced the queue to reprioritise. */
  reprioritized: boolean;
  notes: string[];
}

export interface TaskQueueInput {
  scheduler: ProcessScheduleReading;
  interrupts: InterruptReading;
  /** 0..10 — the organism's energy reserves. */
  energyReserves: number;
}

export function readStrategicTaskQueue(input: TaskQueueInput): TaskQueueReading {
  const { scheduler, interrupts, energyReserves } = input;
  const notes: string[] = [];

  // Deferred and starved processes become queued tasks.
  const queue: QueuedTask[] = scheduler.processes
    .filter((p) => p.window !== 'now')
    .map((p) => ({ task: p.name, priority: p.priority }));

  // An interrupt that demands handling reprioritises the queue — its
  // matching task jumps the line.
  let reprioritized = false;
  if (interrupts.interrupt_demands_handling && interrupts.highest) {
    reprioritized = true;
    queue.unshift({ task: `service interrupt: ${interrupts.highest.kind}`, priority: 10 });
  }
  // Low energy defers discretionary cognition further.
  if (energyReserves <= 3) {
    for (const t of queue) {
      if (t.task === 'creative-direction' || t.task === 'world-modeling') t.priority = Math.max(0, t.priority - 2);
    }
  }

  queue.sort((a, b) => b.priority - a.priority);

  const next_task = queue[0]?.task ?? null;
  const deferred_tasks = queue.slice(1).map((t) => t.task);

  notes.push(`strategic task queue: depth ${queue.length}` +
    (next_task ? ` — next "${next_task}"` : ' — clear') +
    (reprioritized ? ' (reprioritised by interrupt)' : ''));
  return { queue_depth: queue.length, next_task, deferred_tasks, reprioritized, notes };
}
