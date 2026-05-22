/**
 * COGNITIVE DEPENDENCY MAPPING (Phase 107 — Wave 8: Operating System Genesis)
 *
 * Nothing in the runtime is independent. Beliefs depend on campaigns,
 * the strategic season depends on the world-state, every process
 * depends on identity. This module maps those hidden dependencies so
 * the OS can see, before it acts, which change would cascade — and
 * which dependency has become fragile enough to break.
 */

import type { CognitionGraphReading } from './activeCognitionGraph';
import type { KernelHealthReading } from './kernelHealthMonitor';

export interface CognitiveDependency {
  from: string;
  to: string;
}

export interface DependencyMapReading {
  dependencies: CognitiveDependency[];
  /** The dependency most at risk of breaking, or null when all hold. */
  fragile_dependency: string | null;
  /** 0..10 — how far a failure here would cascade. */
  cascade_risk: number;
  notes: string[];
}

export interface DependencyMapInput {
  cognitionGraph: CognitionGraphReading;
  health: KernelHealthReading;
  /** True when the cognitive civilization is decaying (Wave 6). */
  civilizationDecaying: boolean;
}

const BASE_DEPENDENCIES: CognitiveDependency[] = [
  { from: 'beliefs', to: 'campaign-decisions' },
  { from: 'world-state', to: 'strategic-season' },
  { from: 'identity', to: 'every-process' },
  { from: 'audience-condition', to: 'narrative-climate' },
  { from: 'organism-energy', to: 'process-scheduling' },
];

export function readCognitiveDependencyMapping(input: DependencyMapInput): DependencyMapReading {
  const { cognitionGraph, health, civilizationDecaying } = input;
  const notes: string[] = [];

  const dependencies = BASE_DEPENDENCIES;

  // The fragile dependency — identity feeds every process, so an
  // identity fragmentation is the most dangerous break.
  let fragile_dependency: string | null = null;
  if (health.identity_fragmentation) {
    fragile_dependency = 'identity → every-process';
  } else if (civilizationDecaying) {
    fragile_dependency = 'beliefs → campaign-decisions';
  } else if (cognitionGraph.graph_is_tangled) {
    fragile_dependency = 'world-state → strategic-season';
  }

  let cascade_risk = 0;
  cascade_risk += cognitionGraph.graph_load * 0.4;
  cascade_risk += health.failure_modes.length * 1.5;
  if (fragile_dependency) cascade_risk += 2;
  if (civilizationDecaying) cascade_risk += 1.5;
  cascade_risk = clamp10(round1(cascade_risk));

  notes.push(`cognitive dependency mapping: ${dependencies.length} dependencies tracked, cascade risk ${cascade_risk}/10` +
    (fragile_dependency ? ` — fragile: "${fragile_dependency}"` : ''));
  return { dependencies, fragile_dependency, cascade_risk, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
