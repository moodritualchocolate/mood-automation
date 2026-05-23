/**
 * AUTONOMOUS EXECUTION SYNTHESIS CORE (Phase 220 — Wave 12: Autonomous Action Architecture)
 *
 * Waves 1–11 built an organism that perceives, judges, remembers, and
 * reasons about futures. Wave 12 lets it ACT — but never compulsively.
 * This module owns the persistent execution state
 * (data/runtime/execution.json) and is the closing synthesis: the
 * organism stops asking "can we act?" and starts asking "should this
 * action exist in the world at all?"
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { AutonomousActionGovernorReading } from './autonomousActionGovernor';
import type { ActionAuthorizationReading } from './actionAuthorizationRuntime';
import type { CompulsiveAutomationReading } from './compulsiveAutomationDetector';
import type { ActionWorthinessReading } from './actionWorthinessEvaluator';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'execution.json';

export interface ExecutionState {
  bornAt: number;
  executionCycles: number;
  actionsAuthorized: number;
  actionsWithheld: number;
  compulsiveSignals: number;
  restraintBudget: number;        // 0..10 — restraint still available
  trustSpentOnAction: number;     // 0..10
  audienceRecoveryDebt: number;   // 0..10 — recovery time owed to the audience
  cadenceHealth: number;          // 0..10
  experimentsRun: number;
  overreachCount: number;
  updatedAt: number;
}

export function createInitialExecution(): ExecutionState {
  return {
    bornAt: Date.now(),
    executionCycles: 0,
    actionsAuthorized: 0,
    actionsWithheld: 0,
    compulsiveSignals: 0,
    restraintBudget: 7,
    trustSpentOnAction: 3,
    audienceRecoveryDebt: 2,
    cadenceHealth: 7,
    experimentsRun: 0,
    overreachCount: 0,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodExecution?: ExecutionState };

export interface ExecutionStore {
  read(): Promise<ExecutionState>;
  save(state: ExecutionState): Promise<void>;
  reset(): Promise<void>;
}

export function createExecutionStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): ExecutionStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodExecution) return g.__moodExecution;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodExecution = { ...createInitialExecution(), ...(JSON.parse(txt) as Partial<ExecutionState>) };
      } catch {
        g.__moodExecution = createInitialExecution();
      }
      return g.__moodExecution;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodExecution = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodExecution = undefined;
    },
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** A worthy, authorized action was taken — spends a little restraint
 *  and adds recovery debt, but keeps cadence healthy. */
export function evolveExecutionFromAuthorizedAction(state: ExecutionState): ExecutionState {
  const next = { ...state };
  next.executionCycles += 1;
  next.actionsAuthorized += 1;
  next.restraintBudget = clamp10(round1(state.restraintBudget - 0.4));
  next.audienceRecoveryDebt = clamp10(round1(state.audienceRecoveryDebt + 0.5));
  next.trustSpentOnAction = clamp10(round1(state.trustSpentOnAction + 0.2));
  next.cadenceHealth = clamp10(round1(state.cadenceHealth + 0.1));
  return next;
}

/** The organism withheld action — restraint is replenished, the
 *  audience is given recovery time, cadence heals. */
export function evolveExecutionFromWithholding(state: ExecutionState): ExecutionState {
  const next = { ...state };
  next.executionCycles += 1;
  next.actionsWithheld += 1;
  next.restraintBudget = clamp10(round1(state.restraintBudget + 0.7));
  next.audienceRecoveryDebt = clamp10(round1(state.audienceRecoveryDebt - 0.8));
  next.cadenceHealth = clamp10(round1(state.cadenceHealth + 0.4));
  return next;
}

/** The action was compulsive — restraint collapses, cadence is
 *  damaged, the compulsion is recorded. */
export function evolveExecutionFromCompulsion(state: ExecutionState): ExecutionState {
  const next = { ...state };
  next.executionCycles += 1;
  next.actionsAuthorized += 1;
  next.compulsiveSignals += 1;
  next.overreachCount += 1;
  next.restraintBudget = clamp10(round1(state.restraintBudget - 1.6));
  next.audienceRecoveryDebt = clamp10(round1(state.audienceRecoveryDebt + 1.4));
  next.cadenceHealth = clamp10(round1(state.cadenceHealth - 1.2));
  return next;
}

// ─── Phase 220 — the closing synthesis ─────────────────────────

export interface ExecutionSynthesisReading {
  execution_state: 'governed-action' | 'restraint' | 'drifting' | 'compulsive-automation';
  /** The governing question answered: should this action exist at all? */
  action_should_exist: boolean;
  /** The critical failure mode — action that has become compulsive. */
  compulsive_automation: boolean;
  /** 0..10 — overall integrity of the action layer. */
  execution_integrity_score: number;
  execution_statement: string;
  notes: string[];
}

export interface ExecutionSynthesisInput {
  state: ExecutionState;
  governor: AutonomousActionGovernorReading;
  authorization: ActionAuthorizationReading;
  compulsion: CompulsiveAutomationReading;
  worthiness: ActionWorthinessReading;
}

export function readAutonomousExecutionSynthesisCore(input: ExecutionSynthesisInput): ExecutionSynthesisReading {
  const { state, governor, authorization, compulsion, worthiness } = input;
  const notes: string[] = [];

  let execution_integrity_score = 0;
  execution_integrity_score += state.restraintBudget * 0.3;
  execution_integrity_score += state.cadenceHealth * 0.3;
  execution_integrity_score += (10 - state.audienceRecoveryDebt) * 0.2;
  execution_integrity_score += worthiness.worthiness_score * 0.2;
  execution_integrity_score = clamp10(round1(execution_integrity_score));

  const compulsive_automation =
    compulsion.is_compulsive ||
    governor.governance === 'compulsive' ||
    (state.executionCycles >= 4 && state.restraintBudget <= 2);

  const action_should_exist =
    !compulsive_automation &&
    authorization.authorized &&
    worthiness.action_is_worthy;

  const execution_state: ExecutionSynthesisReading['execution_state'] =
    compulsive_automation ? 'compulsive-automation' :
    action_should_exist ? 'governed-action' :
    governor.governance === 'restraint' ? 'restraint' : 'drifting';

  const execution_statement =
    execution_state === 'compulsive-automation'
      ? 'the organism is acting compulsively — it is automating, not deciding'
      : execution_state === 'governed-action'
        ? 'this action passed every gate and is worthy of existing in the world'
        : execution_state === 'restraint'
          ? 'the organism is exercising restraint — it is choosing not to act'
          : 'the organism is acting without governance — its action is drifting';

  notes.push(`autonomous execution synthesis: ${execution_state} (integrity ${execution_integrity_score}/10) — ${execution_statement}`);
  return {
    execution_state, action_should_exist, compulsive_automation,
    execution_integrity_score, execution_statement, notes,
  };
}
