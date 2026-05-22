/**
 * RUNTIME RESOURCE ALLOCATION (Phase 95 — Wave 8: Operating System Genesis)
 *
 * The runtime has finite resources. This module allocates them across
 * the dimensions cognition spends: attention, memory, energy,
 * reasoning depth, and execution bandwidth. When demand exceeds
 * supply the allocator reports an over-subscribed runtime.
 */

import type { KernelReading } from './cognitiveKernel';

export interface ResourceBudget {
  attention: number;         // 0..10
  memory: number;
  energy: number;
  reasoning_depth: number;
  bandwidth: number;
}

export interface ResourceAllocationReading {
  allocation: ResourceBudget;
  /** True when total demand exceeds what the runtime can supply. */
  over_subscribed: boolean;
  /** The resource under the most pressure. */
  scarcest_resource: keyof ResourceBudget;
  notes: string[];
}

export interface ResourceAllocationInput {
  kernel: KernelReading;
  /** 0..10 — the organism's energy reserves. */
  energyReserves: number;
  /** 0..10 — the organism's internal complexity load. */
  complexityLoad: number;
  /** Count of processes the scheduler had to defer or starve. */
  deferredAndStarved: number;
}

export function readRuntimeResourceAllocation(input: ResourceAllocationInput): ResourceAllocationReading {
  const { kernel, energyReserves, complexityLoad, deferredAndStarved } = input;
  const notes: string[] = [];

  // A throttled or protected kernel allocates conservatively.
  const ceiling =
    kernel.kernel_state === 'protected-mode' ? 5 :
    kernel.kernel_state === 'throttled' ? 7 : 10;

  const allocation: ResourceBudget = {
    attention: clamp(round1(Math.min(ceiling, kernel.coordination_score)), ceiling),
    memory: clamp(round1(Math.min(ceiling, 10 - complexityLoad * 0.6)), ceiling),
    energy: clamp(round1(Math.min(ceiling, energyReserves)), ceiling),
    reasoning_depth: clamp(round1(Math.min(ceiling, 9 - complexityLoad * 0.5)), ceiling),
    bandwidth: clamp(round1(Math.min(ceiling, 10 - deferredAndStarved * 1.2)), ceiling),
  };

  // Over-subscribed: demand (deferred work + complexity) outruns supply.
  const supply = (allocation.attention + allocation.energy + allocation.bandwidth) / 3;
  const over_subscribed = supply < 5 || deferredAndStarved >= 4;

  const entries = Object.entries(allocation) as Array<[keyof ResourceBudget, number]>;
  const scarcest_resource = entries.sort((a, b) => a[1] - b[1])[0][0];

  notes.push(`runtime resource allocation: supply ${round1(supply)}/10` +
    (over_subscribed ? ` — OVER-SUBSCRIBED, scarcest "${scarcest_resource}"` : ` — scarcest "${scarcest_resource}"`));
  return { allocation, over_subscribed, scarcest_resource, notes };
}

function clamp(n: number, ceiling: number): number { return Math.max(0, Math.min(ceiling, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
