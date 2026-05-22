/**
 * KERNEL HEALTH MONITOR (Phase 100 — Wave 8: Operating System Genesis)
 *
 * The OS watches its own vital signs. This monitor tracks the five
 * ways a cognitive runtime fails: cognitive overload, identity
 * fragmentation, optimization addiction, attention exhaustion, and
 * narrative decay. It is the runtime's check-engine light.
 */

import type { ComplexityRegulationReading } from './internalComplexityRegulation';
import type { OrganismCoreReading } from './persistentOrganismCore';
import type { CivilizationFatigueReading } from './civilizationFatigueMonitoring';
import type { IdentityStressReading } from './identityStressTesting';

export interface KernelHealthReading {
  /** 0..10 — overall runtime health. */
  overall_health: number;
  cognitive_overload: boolean;
  identity_fragmentation: boolean;
  optimization_addiction: boolean;
  attention_exhaustion: boolean;
  narrative_decay: boolean;
  /** The named failure modes currently active. */
  failure_modes: string[];
  notes: string[];
}

export interface KernelHealthInput {
  complexity: ComplexityRegulationReading;
  organism: OrganismCoreReading;
  fatigue: CivilizationFatigueReading;
  identityStress: IdentityStressReading;
  /** True when the cognitive civilization is decaying (Wave 6). */
  civilizationDecaying: boolean;
}

export function readKernelHealthMonitor(input: KernelHealthInput): KernelHealthReading {
  const { complexity, organism, fatigue, identityStress, civilizationDecaying } = input;
  const notes: string[] = [];

  const cognitive_overload = complexity.over_thinking || complexity.complexity_load >= 8;
  const identity_fragmentation = !identityStress.identity_holds;
  const optimization_addiction = organism.organism_is_addicted;
  const attention_exhaustion = fatigue.needs_recovery || organism.vitality < 4;
  const narrative_decay = civilizationDecaying;

  const failure_modes: string[] = [];
  if (cognitive_overload) failure_modes.push('cognitive overload');
  if (identity_fragmentation) failure_modes.push('identity fragmentation');
  if (optimization_addiction) failure_modes.push('optimization addiction');
  if (attention_exhaustion) failure_modes.push('attention exhaustion');
  if (narrative_decay) failure_modes.push('narrative decay');

  let overall_health = 10;
  overall_health -= failure_modes.length * 1.8;
  overall_health -= complexity.complexity_load * 0.2;
  overall_health -= (10 - organism.vitality) * 0.2;
  overall_health = clamp10(round1(overall_health));

  notes.push(`kernel health monitor: ${overall_health}/10` +
    (failure_modes.length ? ` — failure modes: ${failure_modes.join(', ')}` : ' — no failure modes active'));
  return {
    overall_health, cognitive_overload, identity_fragmentation,
    optimization_addiction, attention_exhaustion, narrative_decay,
    failure_modes, notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
