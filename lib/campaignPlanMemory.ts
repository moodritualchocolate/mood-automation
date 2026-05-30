/**
 * CAMPAIGN PLAN MEMORY (FIFO, operator-supervised)
 *
 * Persistent FIFO of CAMPAIGN PLAN RECORDS the operator chose to save.
 * Each record snapshots the input + the composed plan + a frozen
 * approval status. The system never auto-saves and never auto-executes.
 *
 * STRICT CONTRACT:
 *   - append + status-update are the only mutating operations
 *   - both require operator credentials at the route layer
 *   - the store NEVER triggers generation, publishing, or spend
 *   - FIFO-capped
 *
 * Lives at data/memory/campaign-plan-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignPlannerInput, CampaignPlanReading } from './campaignPlannerEngine';
import type { TestingMatrixReading } from './testingMatrixEngine';
import type { ContentCalendarReading } from './contentCalendarEngine';
import type { PerformanceExpectationReading } from './performanceExpectationEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'campaign-plan-memory.json';

export const CAMPAIGN_PLAN_LIMIT = 64;

// ─── types ────────────────────────────────────────────────────

export type CampaignPlanStatus =
  | 'draft' | 'approved' | 'in-flight' | 'completed' | 'rejected' | 'archived';

export interface CampaignPlanStep {
  at: number;
  status: CampaignPlanStatus;
  operatorId: string;
  reason?: string;
}

export interface CampaignPlanRecord {
  planId: string;
  /** Operator-defined label. */
  label: string;
  input: CampaignPlannerInput;
  plan: CampaignPlanReading;
  testingMatrix: TestingMatrixReading;
  contentCalendar: ContentCalendarReading;
  performanceExpectation: PerformanceExpectationReading;
  createdAt: number;
  operatorId: string;
  status: CampaignPlanStatus;
  history: CampaignPlanStep[];
  operatorNote?: string;
}

// ─── state ────────────────────────────────────────────────────

export interface CampaignPlanMemoryState {
  plans: CampaignPlanRecord[];
  totalPlans: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialCampaignPlanMemory(): CampaignPlanMemoryState {
  return { plans: [], totalPlans: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __planSeq = 0;
export function newCampaignPlanId(): string {
  __planSeq += 1;
  return `plan-${Date.now().toString(36)}-${__planSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendCampaignPlanRecord(
  state: CampaignPlanMemoryState,
  record: CampaignPlanRecord,
): CampaignPlanMemoryState {
  const plans = [...state.plans, record].slice(-CAMPAIGN_PLAN_LIMIT);
  return {
    ...state,
    plans,
    totalPlans: state.totalPlans + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function applyCampaignPlanStep(
  state: CampaignPlanMemoryState,
  planId: string,
  step: CampaignPlanStep,
): CampaignPlanMemoryState {
  const idx = state.plans.findIndex((p) => p.planId === planId);
  if (idx === -1) throw new Error(`campaign plan not found: ${planId}`);
  const prev = state.plans[idx];
  const next: CampaignPlanRecord = {
    ...prev,
    status: step.status,
    history: [...prev.history, step],
  };
  const plans = [...state.plans];
  plans[idx] = next;
  return { ...state, plans, updatedAt: step.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodCampaignPlanMemory?: CampaignPlanMemoryState };

export interface CampaignPlanMemoryStore {
  read(): Promise<CampaignPlanMemoryState>;
  append(record: CampaignPlanRecord): Promise<CampaignPlanMemoryState>;
  updateStatus(planId: string, step: CampaignPlanStep): Promise<CampaignPlanMemoryState>;
  save(state: CampaignPlanMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCampaignPlanMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CampaignPlanMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CampaignPlanMemoryStore = {
    async read() {
      if (g.__moodCampaignPlanMemory) return g.__moodCampaignPlanMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CampaignPlanMemoryState>;
        g.__moodCampaignPlanMemory = { ...createInitialCampaignPlanMemory(), ...parsed };
      } catch {
        g.__moodCampaignPlanMemory = createInitialCampaignPlanMemory();
      }
      return g.__moodCampaignPlanMemory;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendCampaignPlanRecord(cur, record);
      await store.save(next);
      return next;
    },
    async updateStatus(planId, step) {
      const cur = await store.read();
      const next = applyCampaignPlanStep(cur, planId, step);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.plans = state.plans.slice(-CAMPAIGN_PLAN_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCampaignPlanMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCampaignPlanMemory = undefined;
    },
  };
  return store;
}
