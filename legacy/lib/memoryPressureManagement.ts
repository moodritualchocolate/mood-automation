/**
 * MEMORY PRESSURE MANAGEMENT (Phase 101 — Wave 8: Operating System Genesis)
 *
 * A runtime that never forgets eventually drowns. This module manages
 * memory pressure the way an OS manages RAM: compressing old memory,
 * archiving the cold, resurfacing what is suddenly relevant, and —
 * when pressure is severe — strategically forgetting.
 */

export type MemoryAction = 'hold' | 'compress' | 'archive' | 'resurface' | 'strategic-forget';

export interface MemoryPressureReading {
  /** 0..10 — how much pressure the runtime's memory is under. */
  memory_pressure: number;
  action: MemoryAction;
  reason: string;
  notes: string[];
}

export interface MemoryPressureInput {
  /** Count of records held in the runtime's persistent memory. */
  memoryFootprint: number;
  /** 0..10 — the organism's internal complexity load. */
  complexityLoad: number;
  /** Runs the organism has lived. */
  organismAge: number;
  /** True when a long-deferred memory is suddenly relevant again. */
  relevanceSpike: boolean;
}

export function readMemoryPressureManagement(input: MemoryPressureInput): MemoryPressureReading {
  const { memoryFootprint, complexityLoad, organismAge, relevanceSpike } = input;
  const notes: string[] = [];

  let memory_pressure = 0;
  memory_pressure += Math.min(6, memoryFootprint * 0.12);
  memory_pressure += complexityLoad * 0.3;
  memory_pressure += Math.min(2, organismAge * 0.05);
  memory_pressure = clamp10(round1(memory_pressure));

  let action: MemoryAction;
  let reason: string;
  if (relevanceSpike) {
    action = 'resurface';
    reason = 'a long-deferred memory is suddenly relevant — resurface it into the working set';
  } else if (memory_pressure >= 8) {
    action = 'strategic-forget';
    reason = 'memory pressure is severe — the runtime must strategically forget the lowest-value records';
  } else if (memory_pressure >= 6) {
    action = 'archive';
    reason = 'memory pressure is high — archive the cold records out of the working set';
  } else if (memory_pressure >= 4) {
    action = 'compress';
    reason = 'memory pressure is building — compress older records to reclaim working space';
  } else {
    action = 'hold';
    reason = 'memory pressure is low — no management action required';
  }

  notes.push(`memory pressure management: ${memory_pressure}/10 — ${action}`);
  return { memory_pressure, action, reason, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
