/**
 * ORGANISM STATE VIEW (Phase 112 — Wave 9: Manifestation Architecture)
 *
 * The organism's vital signs, made visible. Energy, stress, internal
 * complexity, vitality, age, the immune system's memory — every number
 * is read straight from data/runtime/organism.json. This is not a
 * health widget; it is the organism's body, surfaced.
 */

import type { RuntimeSnapshot, Gauge, Tone } from './runtimeUIBrain';
import { round1 } from './runtimeUIBrain';

export interface OrganismStateViewModel {
  present: boolean;
  condition: 'thriving' | 'healthy' | 'strained' | 'at-risk' | 'dormant';
  vitality: number;          // 0..10
  gauges: Gauge[];
  age: number;
  /** Wave 25 — only advances on a successful 'approve' directive.
   *  Counts internally-coherent transformations rather than total
   *  runs lived. 0 until the first approval ever. */
  evolutionary_age: number;
  consecutive_actions: number;
  rest_count: number;
  adaptation_count: number;
  immune_memory_size: number;
  immune_recent_survival: string;
  statement: string;
}

export function buildOrganismStateView(snap: RuntimeSnapshot): OrganismStateViewModel {
  const o = snap.organism;
  if (!o) {
    return {
      present: false, condition: 'dormant', vitality: 0, gauges: [],
      age: 0, evolutionary_age: 0, consecutive_actions: 0, rest_count: 0, adaptation_count: 0,
      immune_memory_size: 0, immune_recent_survival: 'no immune history',
      statement: 'the organism has not yet drawn breath',
    };
  }

  const vitality = round1(
    o.energyReserves * 0.45 + (10 - o.stressAccumulation) * 0.3 + (10 - o.complexityLoad) * 0.25,
  );

  const energyTone: Tone = o.energyReserves <= 3 ? 'bad' : o.energyReserves <= 5 ? 'warn' : 'good';
  const stressTone: Tone = o.stressAccumulation >= 8 ? 'bad' : o.stressAccumulation >= 6 ? 'warn' : 'good';
  const complexityTone: Tone = o.complexityLoad >= 8 ? 'bad' : o.complexityLoad >= 6 ? 'warn' : 'good';

  const gauges: Gauge[] = [
    { label: 'energy reserves', value: o.energyReserves, max: 10, display: `${o.energyReserves}/10`, tone: energyTone },
    { label: 'stress accumulation', value: o.stressAccumulation, max: 10, display: `${o.stressAccumulation}/10`, tone: stressTone },
    { label: 'complexity load', value: o.complexityLoad, max: 10, display: `${o.complexityLoad}/10`, tone: complexityTone },
    { label: 'vitality', value: vitality, max: 10, display: `${vitality}/10`, tone: vitality >= 7 ? 'good' : vitality >= 4 ? 'warn' : 'bad' },
  ];

  const condition: OrganismStateViewModel['condition'] =
    vitality >= 7.5 ? 'thriving' : vitality >= 5 ? 'healthy' :
    vitality >= 3 ? 'strained' : 'at-risk';

  const recent = o.immuneMemory.slice(-6);
  const survived = recent.filter((r) => r.survived).length;
  const immune_recent_survival = recent.length
    ? `${survived}/${recent.length} recent threats survived`
    : 'no immune encounters yet';

  const statement = `the organism is ${condition} — vitality ${vitality}/10, age ${o.age} runs, ` +
    `${o.consecutiveActions} run(s) since its last rest`;

  return {
    present: true, condition, vitality, gauges,
    age: o.age, evolutionary_age: o.evolutionaryAge ?? 0,
    consecutive_actions: o.consecutiveActions, rest_count: o.restCount,
    adaptation_count: o.adaptationCount, immune_memory_size: o.immuneMemory.length,
    immune_recent_survival, statement,
  };
}
