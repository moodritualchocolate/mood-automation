/**
 * 1. HUMAN STATE ENGINE
 *
 * Picks one of the 59 ENERGY states autonomously, weighting by:
 *  - base weight (intrinsic strength of the state)
 *  - memory score (what is winning in critique)
 *  - fatigue (recently used states drop sharply)
 *  - family rotation (avoid back-to-back states from the same family)
 *  - campaign mode bias (e.g. "Documentary" favours observed-life families)
 *
 * The engine is deliberately deterministic given (memory, mode, seed) so
 * the same campaign can be replayed and so tests are stable.
 */

import type { CampaignMode, EngineContext, HumanState, MemorySnapshot } from '@/core/types';
import { ENERGY_STATES } from '@data/energy-states';
import { EngineError } from '@/core/errors';

const FAMILY_WEIGHTS: Record<CampaignMode, Partial<Record<HumanState['family'], number>>> = {
  Editorial:         { numbness: 1.4, fragmentation: 1.3, paralysis: 1.2 },
  Documentary:       { fatigue: 1.4, collapse: 1.3, numbness: 1.2 },
  Performance:       { pressure: 1.5, fragmentation: 1.3 },
  Emotional:         { overstimulation: 1.4, collapse: 1.3, pressure: 1.2 },
  Minimal:           { paralysis: 1.4, numbness: 1.3, avoidance: 1.2 },
  Aggressive:        { pressure: 1.5, overstimulation: 1.4, collapse: 1.2 },
  Luxury:            { numbness: 1.3, paralysis: 1.2 },
  'Product-focused': { fatigue: 1.2, avoidance: 1.2 },
};

export interface SelectInput {
  ctx: EngineContext;
  memory: MemorySnapshot;
  forceStateId?: string;
  seed?: number;
}

export function selectHumanState(input: SelectInput): HumanState {
  const { ctx, memory, forceStateId, seed = Date.now() } = input;

  if (forceStateId) {
    const state = ENERGY_STATES.find((s) => s.id === forceStateId);
    if (!state) throw new EngineError('human-state', `unknown state id: ${forceStateId}`);
    ctx.emit({ stage: 'human-state', message: `forced state: ${state.label}` });
    return state;
  }

  const recentSet = new Set(memory.recentStateIds);
  const recentFamilies = new Set(
    memory.recentStateIds
      .slice(0, 3)
      .map((id) => ENERGY_STATES.find((s) => s.id === id)?.family)
      .filter(Boolean) as HumanState['family'][],
  );

  const modeBias = ctx.campaignMode ? FAMILY_WEIGHTS[ctx.campaignMode] ?? {} : {};

  type Scored = { state: HumanState; score: number };
  const scored: Scored[] = ENERGY_STATES.map((s) => {
    let score = s.weight;
    score *= (memory.stateScores[s.id] ?? 1);
    score *= (modeBias[s.family] ?? 1);
    if (recentSet.has(s.id)) score *= 0.05;             // strong fatigue penalty
    if (recentFamilies.has(s.family)) score *= 0.5;     // family rotation
    return { state: s, score };
  });

  // Weighted random sampling, deterministic by seed.
  const rng = mulberry32(seed);
  const total = scored.reduce((a, b) => a + b.score, 0);
  let pick = rng() * total;
  for (const { state, score } of scored) {
    if ((pick -= score) <= 0) {
      ctx.emit({
        stage: 'human-state',
        message: `selected: ${state.label}`,
        data: { id: state.id, family: state.family, score },
      });
      return state;
    }
  }
  // Fallback (shouldn't hit unless total is zero).
  return scored[0].state;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { ENERGY_STATES };
