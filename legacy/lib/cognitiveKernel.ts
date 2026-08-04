/**
 * COGNITIVE KERNEL (Phase 91 — Wave 8: Operating System Genesis)
 *
 * The central persistent runtime loop. Wave 7 made the system a living
 * organism; the kernel is the organism's heartbeat — the loop that
 * governs every cognitive process, every tick, for the life of the
 * runtime. Nothing in Wave 8 runs outside the kernel.
 */

import type { OrganismCoreReading } from './persistentOrganismCore';
import type { ExistentialRiskReading } from './existentialRiskLayer';
import type { ComplexityRegulationReading } from './internalComplexityRegulation';

export type KernelState = 'booting' | 'running' | 'throttled' | 'protected-mode';

export interface KernelReading {
  kernel_state: KernelState;
  /** The kernel tick this run represents. */
  tick: number;
  /** 0..10 — how coordinated cognition is under the kernel this tick. */
  coordination_score: number;
  /** The loop the kernel is running this tick. */
  governing_loop: string;
  notes: string[];
}

export interface KernelInput {
  organism: OrganismCoreReading;
  existentialRisk: ExistentialRiskReading;
  complexity: ComplexityRegulationReading;
  /** Kernel ticks already lived (OS uptime). */
  uptime: number;
}

export function readCognitiveKernel(input: KernelInput): KernelReading {
  const { organism, existentialRisk, complexity, uptime } = input;
  const notes: string[] = [];
  const tick = uptime + 1;

  let kernel_state: KernelState;
  if (uptime === 0) {
    kernel_state = 'booting';
  } else if (existentialRisk.organism_at_risk || organism.condition === 'at-risk') {
    kernel_state = 'protected-mode';
  } else if (complexity.over_thinking || organism.vitality < 4) {
    kernel_state = 'throttled';
  } else {
    kernel_state = 'running';
  }

  let coordination_score = 0;
  coordination_score += organism.vitality * 0.4;
  coordination_score += (10 - complexity.complexity_load) * 0.35;
  coordination_score += (10 - existentialRisk.existential_risk) * 0.25;
  if (kernel_state === 'protected-mode') coordination_score -= 2;
  if (kernel_state === 'throttled') coordination_score -= 1;
  coordination_score = clamp10(round1(coordination_score));

  const governing_loop =
    kernel_state === 'booting' ? 'the kernel is booting — establishing the runtime loop'
    : kernel_state === 'protected-mode' ? 'the kernel is in protected mode — only survival-critical cognition runs'
    : kernel_state === 'throttled' ? 'the kernel is throttled — cognition runs at reduced depth to shed load'
    : 'the kernel loop is running — cognition is coordinated tick to tick';

  notes.push(`cognitive kernel: ${kernel_state} (tick ${tick}, coordination ${coordination_score}/10) — ${governing_loop}`);
  return { kernel_state, tick, coordination_score, governing_loop, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
