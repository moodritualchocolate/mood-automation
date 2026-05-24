/**
 * PERSISTENT ORGANISM CORE (Phase 90 — Wave 7: Reality Organism)
 *
 * Wave 6 built a civilization with history. Wave 7 makes that
 * civilization a LIVING ORGANISM — one that interacts with a changing
 * reality continuously, has finite energy, accumulates stress, runs
 * an immune system, and knows when NOT to act.
 *
 * This module owns the organism's persistent vital state
 * (data/runtime/organism.json) and is the closing synthesis of the
 * whole wave: is the organism ADAPTING to reality, or compulsively
 * REACTING to stimulation? An organism governed by stimulation is
 * addicted; one governed by identity survives.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'organism.json';
const IMMUNE_LIMIT = 60;

export interface ImmuneRecord {
  threat: string;
  age: number;
  survived: boolean;
}

export interface OrganismVitalState {
  bornAt: number;
  age: number;                  // runs the organism has lived
  energyReserves: number;       // 0..10 — depletes with action, restores with rest
  stressAccumulation: number;   // 0..10
  complexityLoad: number;       // 0..10 — accumulated internal complexity
  immuneMemory: ImmuneRecord[];
  consecutiveActions: number;   // runs since the last rest
  restCount: number;
  adaptationCount: number;
  updatedAt: number;
}

export function createInitialOrganism(): OrganismVitalState {
  return {
    bornAt: Date.now(),
    age: 0,
    energyReserves: 8,
    stressAccumulation: 2,
    complexityLoad: 3,
    immuneMemory: [],
    consecutiveActions: 0,
    restCount: 0,
    adaptationCount: 0,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodOrganism?: OrganismVitalState };

export interface OrganismCoreStore {
  read(): Promise<OrganismVitalState>;
  save(state: OrganismVitalState): Promise<void>;
  reset(): Promise<void>;
}

export function createOrganismCoreStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): OrganismCoreStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodOrganism) return g.__moodOrganism;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodOrganism = { ...createInitialOrganism(), ...(JSON.parse(txt) as Partial<OrganismVitalState>) };
      } catch {
        g.__moodOrganism = createInitialOrganism();
      }
      return g.__moodOrganism;
    },
    async save(state) {
      state.immuneMemory = state.immuneMemory.slice(-IMMUNE_LIMIT);
      state.updatedAt = Date.now();
      g.__moodOrganism = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOrganism = undefined;
    },
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** The organism ACTED — a banner shipped. Action depletes energy and
 *  accumulates stress and complexity. */
export function evolveOrganismFromAction(
  state: OrganismVitalState,
  args: { energyCost: number; stressAdded: number; complexityAdded: number; adapted: boolean },
): OrganismVitalState {
  const next = { ...state, immuneMemory: [...state.immuneMemory] };
  next.age += 1;
  next.consecutiveActions += 1;
  next.energyReserves = clamp10(round1(state.energyReserves - args.energyCost));
  next.stressAccumulation = clamp10(round1(state.stressAccumulation + args.stressAdded));
  next.complexityLoad = clamp10(round1(state.complexityLoad + args.complexityAdded * 0.5));
  if (args.adapted) next.adaptationCount += 1;
  return next;
}

/** The organism RESTED — it chose not to act. Rest restores energy
 *  and sheds stress; a healthy organism rests. */
export function evolveOrganismFromRest(state: OrganismVitalState): OrganismVitalState {
  const next = { ...state, immuneMemory: [...state.immuneMemory] };
  next.age += 1;
  next.consecutiveActions = 0;
  next.restCount += 1;
  next.energyReserves = clamp10(round1(state.energyReserves + 2.5));
  next.stressAccumulation = clamp10(round1(state.stressAccumulation - 2));
  next.complexityLoad = clamp10(round1(state.complexityLoad - 1));
  return next;
}

/** Record a threat the immune system met. */
export function recordImmuneEncounter(state: OrganismVitalState, threat: string, survived: boolean): OrganismVitalState {
  state.immuneMemory.push({ threat, age: state.age, survived });
  return state;
}

/** Wave 20 — the organism OBSERVED itself. Observation is the lightest
 *  cognition: it advances age (one cognitive run has happened) but
 *  does NOT consume energy, accumulate stress, increase complexity,
 *  or count toward consecutiveActions. Observing is not acting; it is
 *  pure perception of state. */
export function evolveOrganismFromObservation(state: OrganismVitalState): OrganismVitalState {
  const next = { ...state, immuneMemory: [...state.immuneMemory] };
  next.age += 1;
  return next;
}

// ─── Phase 90 — the closing synthesis ──────────────────────────

export interface OrganismCoreReading {
  /** 0..10 — overall organism vitality. */
  vitality: number;
  /** True when the organism is adapting to reality, governed by identity. */
  organism_is_adapting: boolean;
  /** True when the organism is compulsively reacting to stimulation. */
  organism_is_addicted: boolean;
  /** True when the organism should rest rather than act. */
  should_rest: boolean;
  /** The organism's condition. */
  condition: 'thriving' | 'healthy' | 'strained' | 'at-risk';
  /** A one-line statement of the organism's living state. */
  organism_statement: string;
  notes: string[];
}

export interface OrganismCoreInput {
  state: OrganismVitalState;
  /** True when the run is governed by identity, not stimulation. */
  identityGoverns: boolean;
  /** True when stimulation / engagement pressure is driving the run. */
  stimulationDriven: boolean;
  /** 0..10 — existential risk to the organism (Phase 89). */
  existentialRisk: number;
  /** True when stability preservation (Phase 88) calls for rest. */
  preservationCallsForRest: boolean;
}

export function readPersistentOrganismCore(input: OrganismCoreInput): OrganismCoreReading {
  const { state, identityGoverns, stimulationDriven, existentialRisk, preservationCallsForRest } = input;
  const notes: string[] = [];

  // Vitality — energy, low stress, manageable complexity.
  let vitality = 0;
  vitality += state.energyReserves * 0.45;
  vitality += (10 - state.stressAccumulation) * 0.3;
  vitality += (10 - state.complexityLoad) * 0.25;
  vitality = clamp10(round1(vitality - existentialRisk * 0.25));

  // The organism is ADDICTED when it has acted many times without
  // rest AND stimulation, not identity, is governing it.
  const organism_is_addicted =
    (state.consecutiveActions >= 6 && stimulationDriven) ||
    (stimulationDriven && !identityGoverns && state.energyReserves < 4);

  const organism_is_adapting = identityGoverns && !organism_is_addicted;

  // The organism should rest when energy is low, stress is high, it
  // has not rested in many runs, or preservation calls for it.
  const should_rest =
    state.energyReserves <= 3 ||
    state.stressAccumulation >= 8 ||
    state.consecutiveActions >= 8 ||
    preservationCallsForRest;

  const condition: OrganismCoreReading['condition'] =
    existentialRisk >= 7 ? 'at-risk' :
    vitality >= 7.5 ? 'thriving' :
    vitality >= 5 ? 'healthy' : 'strained';

  const organism_statement = organism_is_addicted
    ? 'the organism is compulsively reacting to stimulation — it is addicted, not adapting'
    : should_rest
      ? `the organism should rest — energy ${state.energyReserves}/10, ${state.consecutiveActions} runs since its last pause`
      : `the organism is adapting to reality, governed by identity — vitality ${vitality}/10, age ${state.age}`;

  notes.push(`persistent organism core: ${condition} (vitality ${vitality}/10) — ${organism_statement}`);
  return {
    vitality, organism_is_adapting, organism_is_addicted, should_rest,
    condition, organism_statement, notes,
  };
}
