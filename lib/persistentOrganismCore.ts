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
import { deltaForDirective } from './cognitiveSignals';
import type { CognitiveActContext } from './cognitiveSignals';

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
  age: number;                  // runs the organism has lived (every cognitive act)
  /** Wave 25 — only advances on a successful 'approve' directive.
   *  Age counts cognitive runs; evolutionaryAge counts approved
   *  transformations. One cycle of disciplined cognition that ends
   *  in approval = +1 evolutionary tick. */
  evolutionaryAge: number;
  energyReserves: number;       // 0..10 — depletes with action, restores with rest
  stressAccumulation: number;   // 0..10
  complexityLoad: number;       // 0..10 — accumulated internal complexity
  immuneMemory: ImmuneRecord[];
  consecutiveActions: number;   // runs since the last rest
  restCount: number;
  adaptationCount: number;
  /** Wave 28 — wall-clock time of the most recent successful rest. */
  lastRestAt?: number;
  /** Wave 28 — os.uptime at the most recent successful rest. */
  lastRestTick?: number;
  /** Wave 28 — pre/post vitals snapshot from the most recent
   *  successful rest. Lets the dashboard show "before" and "after"
   *  honestly without needing to remember prior state. */
  lastRestSnapshot?: {
    beforeEnergy: number;
    beforeStress: number;
    beforeComplexity: number;
    beforeFragmentation: number;
    afterEnergy: number;
    afterStress: number;
    afterComplexity: number;
    afterFragmentation: number;
  };
  updatedAt: number;
}

export function createInitialOrganism(): OrganismVitalState {
  return {
    bornAt: Date.now(),
    age: 0,
    evolutionaryAge: 0,
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

/**
 * Wave 25 — the organism's response to a cognitive act.
 *
 * Every cognitive verb (success or refusal) advances 'age' by 1; the
 * organism has lived through one more run. On top of that, a per-verb
 * delta from VERB_DELTAS shifts energy / stress / complexity, and the
 * orchestrator's context can add transition deltas (first draft ever,
 * first revision in chain, approval just fired).
 *
 * approvalFired is the only thing that advances evolutionaryAge.
 * Every other cognitive act counts toward 'age' (runs lived) but not
 * toward 'evolutionaryAge' (approved transformations). The two clocks
 * are kept distinct so a viewer can tell the difference between an
 * organism that has lived a lot and an organism that has actually
 * grown a lot.
 *
 * No randomness, no time-based decay. Deltas fire only on cognitive
 * events; passive ticks (Wave 19 heartbeat) leave vitals unchanged.
 */
export function evolveOrganismFromCognitiveAct(
  state: OrganismVitalState,
  ctx: CognitiveActContext,
): OrganismVitalState {
  const next = { ...state, immuneMemory: [...state.immuneMemory] };
  next.age += 1;

  if (ctx.approvalFired) {
    next.evolutionaryAge = (state.evolutionaryAge ?? 0) + 1;
  }

  const base = deltaForDirective(ctx.directiveName);

  let stressDelta = base.stressDelta;
  if (ctx.contradictionScore && ctx.contradictionScore > 0) {
    stressDelta += 0.5 * ctx.contradictionScore;
  }

  let complexityDelta = base.complexityDelta;
  if (ctx.isFirstDraftEver) complexityDelta += 1.00;
  if (ctx.isFirstRevisionInChain) complexityDelta += 0.50;
  if (ctx.approvalFired) complexityDelta += -0.30;

  next.energyReserves = clamp10(round1(state.energyReserves + base.energyDelta));
  next.stressAccumulation = clamp10(round1(state.stressAccumulation + stressDelta));
  next.complexityLoad = clamp10(round1(state.complexityLoad + complexityDelta));

  // Wave 28 — successful rest sets the rest tracking fields.
  if (ctx.directiveName === 'rest') {
    next.restCount = state.restCount + 1;
    next.consecutiveActions = 0;  // rest clears the action-count
    if (ctx.restAt != null) next.lastRestAt = ctx.restAt;
    if (ctx.restTick != null) next.lastRestTick = ctx.restTick;
    if (ctx.preRestSnapshot != null && ctx.postRestFragmentation != null) {
      next.lastRestSnapshot = {
        beforeEnergy: ctx.preRestSnapshot.energyReserves,
        beforeStress: ctx.preRestSnapshot.stressAccumulation,
        beforeComplexity: ctx.preRestSnapshot.complexityLoad,
        beforeFragmentation: ctx.preRestSnapshot.fragmentationStreak,
        afterEnergy: next.energyReserves,
        afterStress: next.stressAccumulation,
        afterComplexity: next.complexityLoad,
        afterFragmentation: ctx.postRestFragmentation,
      };
    }
  }

  return next;
}

/** Back-compat wrapper. Wave 20 → 24 callers pass no context; this
 *  forwards as an observation (no transitions, no contradictions).
 *  New Wave 25+ call-sites should use evolveOrganismFromCognitiveAct
 *  directly with a real context. */
export function evolveOrganismFromObservation(state: OrganismVitalState): OrganismVitalState {
  return evolveOrganismFromCognitiveAct(state, { directiveName: 'observe' });
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
