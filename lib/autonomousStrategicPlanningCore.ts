/**
 * AUTONOMOUS STRATEGIC PLANNING CORE (Phase 180 — Wave 11: Strategic Future Intelligence)
 *
 * Waves 1–10 built an organism that reacts to present reality. Wave 11
 * makes it reason across futures — months, quarters, reputation arcs,
 * cultural shifts. This module owns the persistent strategic-future
 * state (data/runtime/strategic-future.json) and is the closing
 * synthesis: the organism stops asking "what works now?" and starts
 * asking "what future are we compounding toward?"
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { StrategicFutureGovernorReading } from './strategicFutureGovernor';
import type { CompoundingAdvantageReading } from './compoundingAdvantageTracker';
import type { StrategicDebtReading } from './strategicDebtMonitor';
import type { FutureCoherenceReading } from './futureCoherenceValidator';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'strategic-future.json';

export interface StrategicFutureState {
  bornAt: number;
  planningCycles: number;
  futureBeingCompounded: string;
  compoundingAdvantage: number;   // 0..10
  strategicDebt: number;          // 0..10
  trustCompounded: number;        // 0..10
  patienceHonored: number;
  nowOptimizedCount: number;
  futureCompoundedCount: number;
  predictionsLogged: number;
  updatedAt: number;
}

export function createInitialStrategicFuture(): StrategicFutureState {
  return {
    bornAt: Date.now(),
    planningCycles: 0,
    futureBeingCompounded: 'a campaign trusted for telling the truth quietly',
    compoundingAdvantage: 4,
    strategicDebt: 2,
    trustCompounded: 5,
    patienceHonored: 0,
    nowOptimizedCount: 0,
    futureCompoundedCount: 0,
    predictionsLogged: 0,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodStrategicFuture?: StrategicFutureState };

export interface StrategicFutureStore {
  read(): Promise<StrategicFutureState>;
  save(state: StrategicFutureState): Promise<void>;
  reset(): Promise<void>;
}

export function createStrategicFutureStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): StrategicFutureStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodStrategicFuture) return g.__moodStrategicFuture;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodStrategicFuture = { ...createInitialStrategicFuture(), ...(JSON.parse(txt) as Partial<StrategicFutureState>) };
      } catch {
        g.__moodStrategicFuture = createInitialStrategicFuture();
      }
      return g.__moodStrategicFuture;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodStrategicFuture = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodStrategicFuture = undefined;
    },
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** The run COMPOUNDED toward a future — advantage and trust grow,
 *  strategic debt is slowly paid down. */
export function evolveFutureFromCompounding(state: StrategicFutureState): StrategicFutureState {
  const next = { ...state };
  next.planningCycles += 1;
  next.futureCompoundedCount += 1;
  next.predictionsLogged += 1;
  next.compoundingAdvantage = clamp10(round1(state.compoundingAdvantage + 0.5));
  next.trustCompounded = clamp10(round1(state.trustCompounded + 0.4));
  next.strategicDebt = clamp10(round1(state.strategicDebt - 0.3));
  return next;
}

/** The run OPTIMIZED FOR NOW — strategic debt accrues, the compounding
 *  advantage is spent for a present gain. */
export function evolveFutureFromNowOptimization(state: StrategicFutureState): StrategicFutureState {
  const next = { ...state };
  next.planningCycles += 1;
  next.nowOptimizedCount += 1;
  next.predictionsLogged += 1;
  next.strategicDebt = clamp10(round1(state.strategicDebt + 1.4));
  next.compoundingAdvantage = clamp10(round1(state.compoundingAdvantage - 0.8));
  next.trustCompounded = clamp10(round1(state.trustCompounded - 0.4));
  return next;
}

/** The run was held back in STRATEGIC PATIENCE — no banner shipped,
 *  but the future was protected; debt eases slightly. */
export function evolveFutureFromPatience(state: StrategicFutureState): StrategicFutureState {
  const next = { ...state };
  next.planningCycles += 1;
  next.patienceHonored += 1;
  next.strategicDebt = clamp10(round1(state.strategicDebt - 0.5));
  next.compoundingAdvantage = clamp10(round1(state.compoundingAdvantage + 0.2));
  return next;
}

// ─── Phase 180 — the closing synthesis ─────────────────────────

export interface StrategicPlanningReading {
  planning_state: 'compounding-a-future' | 'patient' | 'drifting' | 'optimizing-for-now';
  /** True when the run is building toward a long-term future. */
  organism_compounds_a_future: boolean;
  /** True when the run is spending the future for a present gain. */
  organism_optimizes_for_now: boolean;
  /** 0..10 — overall strategic-future quality. */
  strategic_future_score: number;
  the_future_being_compounded: string;
  planning_statement: string;
  notes: string[];
}

export interface StrategicPlanningInput {
  state: StrategicFutureState;
  governor: StrategicFutureGovernorReading;
  compounding: CompoundingAdvantageReading;
  debt: StrategicDebtReading;
  coherence: FutureCoherenceReading;
}

export function readAutonomousStrategicPlanningCore(input: StrategicPlanningInput): StrategicPlanningReading {
  const { state, governor, compounding, debt, coherence } = input;
  const notes: string[] = [];

  let strategic_future_score = 0;
  strategic_future_score += state.compoundingAdvantage * 0.3;
  strategic_future_score += state.trustCompounded * 0.25;
  strategic_future_score += (10 - state.strategicDebt) * 0.25;
  strategic_future_score += coherence.coherence_score * 0.2;
  strategic_future_score = clamp10(round1(strategic_future_score));

  const organism_optimizes_for_now =
    governor.governance === 'now-optimizing' ||
    debt.debt_is_dangerous ||
    (state.planningCycles >= 4 && state.nowOptimizedCount > state.futureCompoundedCount);

  const organism_compounds_a_future =
    governor.governance === 'compounding' &&
    compounding.advantage_is_compounding &&
    !organism_optimizes_for_now;

  const planning_state: StrategicPlanningReading['planning_state'] =
    organism_optimizes_for_now ? 'optimizing-for-now' :
    organism_compounds_a_future ? 'compounding-a-future' :
    governor.governance === 'drifting' ? 'drifting' : 'patient';

  const planning_statement =
    planning_state === 'optimizing-for-now'
      ? 'the organism is optimizing for what works now — it is spending its future for a present gain'
      : planning_state === 'compounding-a-future'
        ? `the organism is compounding toward "${state.futureBeingCompounded}" — advantage ${state.compoundingAdvantage}/10, debt ${state.strategicDebt}/10`
        : planning_state === 'drifting'
          ? 'the organism has no future it is compounding toward — it is drifting'
          : 'the organism is holding patiently — protecting the future rather than spending it';

  notes.push(`autonomous strategic planning: ${planning_state} (future score ${strategic_future_score}/10) — ${planning_statement}`);
  return {
    planning_state, organism_compounds_a_future, organism_optimizes_for_now,
    strategic_future_score, the_future_being_compounded: state.futureBeingCompounded,
    planning_statement, notes,
  };
}
