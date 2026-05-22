/**
 * WORLD-STATE ENGINE (Phase 42 — Wave 4: Executive Cognition)
 *
 * Maintains a living model of the psychological WORLD the campaign
 * operates inside — collective exhaustion, anxiety, volatility, social
 * fragmentation, attention chaos, economic pressure, loneliness,
 * digital overload, trust erosion, and a composite world-tension
 * index.
 *
 * Distinct from Phase 26's campaign WorldState (the campaign's own
 * emotional weather): this is the EXTERNAL world the campaign enters.
 * It persists to data/runtime/world-psychology.json and evolves
 * slowly — every run is one more observation of reality.
 *
 * Headline gate: "Does this campaign understand the psychological
 * world it is entering?"
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { IngestedSignal } from './realityIngestion';
import type { EmotionalTraceEntry } from './humanMemory';
import { readCollectivePsychology } from './collectivePsychologyState';
import { readEnvironmentalStress } from './environmentalStressMap';
import { readSocialPressure } from './socialPressureSystems';
import { readCulturalClimate, type CulturalClimate } from './culturalClimateModel';
import { readWorldTensionIndex } from './worldTensionIndex';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'world-psychology.json';

export interface ExecutiveWorldState {
  updatedAt: number;
  observationCount: number;
  collective_exhaustion: number;
  emotional_volatility: number;
  anxiety_pressure: number;
  social_fragmentation: number;
  attention_chaos: number;
  economic_pressure: number;
  loneliness_index: number;
  digital_overload: number;
  trust_erosion: number;
  world_tension: number;
  climate: CulturalClimate;
  climate_description: string;
  most_acute_pressure: string;
  notes: string[];
}

const g = globalThis as unknown as { __moodWorldPsychology?: ExecutiveWorldState };

export interface WorldStateEngineStore {
  read(): Promise<ExecutiveWorldState | null>;
  save(state: ExecutiveWorldState): Promise<void>;
  reset(): Promise<void>;
}

export function createWorldStateEngineStore(
  dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR,
): WorldStateEngineStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodWorldPsychology) return g.__moodWorldPsychology;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodWorldPsychology = JSON.parse(txt) as ExecutiveWorldState;
        return g.__moodWorldPsychology;
      } catch {
        return null;
      }
    },
    async save(state) {
      g.__moodWorldPsychology = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodWorldPsychology = undefined;
    },
  };
}

export interface ReadWorldStateInput {
  ingestedSignals: IngestedSignal[];
  trail: EmotionalTraceEntry[];
  /** The prior persisted world-state, for slow evolution. */
  prior: ExecutiveWorldState | null;
}

/** Compute the world-state — blended slowly with the prior. */
export function readWorldState(input: ReadWorldStateInput): ExecutiveWorldState {
  const { ingestedSignals, trail, prior } = input;
  const notes: string[] = [];

  const psych = readCollectivePsychology({ ingestedSignals, trail });
  const env = readEnvironmentalStress({ ingestedSignals });
  const social = readSocialPressure({ ingestedSignals, trail });
  const climate = readCulturalClimate({ collectivePsychology: psych, socialPressure: social });
  const tension = readWorldTensionIndex({ collectivePsychology: psych, environmental: env, socialPressure: social });

  // Slow evolution: the world does not lurch. Blend 65% prior / 35%
  // new once a prior exists.
  const blend = (priorV: number, freshV: number) =>
    prior ? round1(priorV * 0.65 + freshV * 0.35) : round1(freshV);

  const next: ExecutiveWorldState = {
    updatedAt: Date.now(),
    observationCount: (prior?.observationCount ?? 0) + 1,
    collective_exhaustion: blend(prior?.collective_exhaustion ?? 0, psych.collective_exhaustion),
    emotional_volatility: blend(prior?.emotional_volatility ?? 0, psych.emotional_volatility),
    anxiety_pressure: blend(prior?.anxiety_pressure ?? 0, psych.anxiety_pressure),
    social_fragmentation: blend(prior?.social_fragmentation ?? 0, social.social_fragmentation),
    attention_chaos: blend(prior?.attention_chaos ?? 0, social.attention_chaos),
    economic_pressure: blend(prior?.economic_pressure ?? 0, env.economic_pressure),
    loneliness_index: blend(prior?.loneliness_index ?? 0, social.loneliness_index),
    digital_overload: blend(prior?.digital_overload ?? 0, env.digital_overload),
    trust_erosion: blend(prior?.trust_erosion ?? 0, social.trust_erosion),
    world_tension: blend(prior?.world_tension ?? 0, tension.world_tension),
    climate: climate.climate,
    climate_description: climate.description,
    most_acute_pressure: tension.most_acute_pressure,
    notes,
  };

  notes.push(`world-state engine: observation ${next.observationCount} — ${climate.description}, tension ${next.world_tension}/10`);
  notes.push(...psych.notes, ...env.notes, ...social.notes, ...climate.notes, ...tension.notes);
  return next;
}

export interface WorldUnderstandingReading {
  /** True when the candidate understands the world it is entering. */
  campaign_understands_world: boolean;
  /** 0..10 — how well-matched the candidate is to the world-state. */
  world_alignment: number;
  reason: string;
}

/**
 * The headline gate: does this campaign understand the psychological
 * world it is entering? A candidate that ignores a strained world —
 * by carrying an intense register into collective exhaustion, for
 * instance — does not.
 */
export function campaignUnderstandsWorld(
  worldState: ExecutiveWorldState,
  candidateRegister: 'soft' | 'intense' | 'neutral',
): WorldUnderstandingReading {
  let world_alignment = 6;
  let reason: string;

  if (worldState.world_tension >= 6 && candidateRegister === 'intense') {
    world_alignment = 2;
    reason = `the world is strained (tension ${worldState.world_tension}/10) but the banner carries an intense register — it does not understand the world it is entering`;
  } else if (worldState.collective_exhaustion >= 7.5 && candidateRegister === 'intense') {
    world_alignment = 3;
    reason = 'the world is collectively exhausted — an intense banner ignores that';
  } else if (worldState.world_tension >= 6 && candidateRegister === 'soft') {
    world_alignment = 8;
    reason = 'the world is strained and the banner is soft — it understands the world it is entering';
  } else {
    world_alignment = 7;
    reason = 'the banner is reasonably matched to the psychological world';
  }

  return {
    campaign_understands_world: world_alignment >= 5,
    world_alignment,
    reason,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
