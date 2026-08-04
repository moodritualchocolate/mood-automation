/**
 * WORKSPACE ACTIVATION (pure scaffolding + FIFO memory)
 *
 * When a new brand is onboarded, the operator MAY call the
 * activation route to scaffold the workspace with default goals ·
 * funnel · blueprint · channels · measurements. The activation NEVER
 * publishes anything. It NEVER launches a campaign. It NEVER spends
 * money. It just declares the operator-supervised default
 * configuration the brand will live inside.
 *
 * STRICT CONTRACT:
 *   - the activation NEVER publishes
 *   - the activation NEVER launches a campaign
 *   - the activation NEVER calls external APIs
 *   - the memory NEVER auto-creates an activation record
 *   - FIFO-capped
 *   - Human remains final authority
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  BusinessGoalId, ChannelRef, MeasurementCategory,
} from './businessGoalModel';
import { getBusinessGoal } from './businessGoalModel';
import { getGrowthBlueprint, type BlueprintId } from './growthBlueprints';
import { listChannelArchitecture } from './channelArchitecture';
import { listCustomerFunnel, type FunnelStageId } from './customerFunnelModel';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'workspace-activation-memory.json';

export const WORKSPACE_ACTIVATION_LIMIT = 256;

// ─── scaffolding shape ───────────────────────────────────────

export interface WorkspaceScaffolding {
  /** Default business goals enabled for the workspace. */
  defaultGoalIds: BusinessGoalId[];
  /** Default funnel stages enabled (always the full 7). */
  defaultFunnelStageIds: FunnelStageId[];
  /** Default blueprint to seed the campaign planner with. */
  defaultBlueprintId: BlueprintId;
  /** Default channels the workspace publishes through. */
  defaultChannelIds: ChannelRef[];
  /** Default measurement categories operators MAY log. */
  defaultMeasurementCategories: MeasurementCategory[];
  /** Single-sentence notes the route emits in its advisory. */
  notes: string[];
}

/** Pure function — given a primary business goal, return the
 *  default scaffolding the activation route applies. Deterministic
 *  and idempotent. */
export function buildWorkspaceScaffolding(
  primaryGoalId: BusinessGoalId,
  optionalBlueprintId?: BlueprintId,
): WorkspaceScaffolding {
  const goal = getBusinessGoal(primaryGoalId);
  const funnel = listCustomerFunnel();
  const channels = listChannelArchitecture();
  // Pick the blueprint that matches the goal when possible.
  const defaultBlueprintId: BlueprintId = optionalBlueprintId ??
    (primaryGoalId === 'lead-generation'    ? 'lead-generation' :
     primaryGoalId === 'product-launch'     ? 'product-launch'  :
     primaryGoalId === 'brand-awareness'    ? 'brand-awareness' :
     primaryGoalId === 'community-growth'   ? 'community'       :
     'brand-awareness');
  const blueprint = getGrowthBlueprint(defaultBlueprintId);

  return {
    defaultGoalIds: [primaryGoalId],
    defaultFunnelStageIds: funnel.stages.map((s) => s.stageId),
    defaultBlueprintId,
    defaultChannelIds: goal.requiredChannels.length > 0
      ? goal.requiredChannels
      : channels.channels.map((c) => c.channelId),
    defaultMeasurementCategories: goal.requiredMeasurements,
    notes: [
      `primary goal: ${goal.label}`,
      `funnel: ${funnel.stages.length} stages enabled`,
      `blueprint seeded: ${blueprint.label}`,
      `channels enabled: ${goal.requiredChannels.length}`,
      `measurements enabled: ${goal.requiredMeasurements.length}`,
      'NEVER publishes · NEVER launches a campaign · NEVER spends money',
      'Human remains final authority',
    ],
  };
}

// ─── activation record ──────────────────────────────────────

export type WorkspaceActivationStatus =
  | 'pending' | 'activated' | 'revoked';

export interface WorkspaceActivationStep {
  at: number;
  status: WorkspaceActivationStatus;
  operatorId: string;
  reason: string;
}

export interface WorkspaceActivationRecord {
  activationId: string;
  organizationId: string;
  workspaceId: string;
  /** The brand the activation scaffolds defaults for. */
  brandLabel: string;
  primaryGoalId: BusinessGoalId;
  scaffolding: WorkspaceScaffolding;
  status: WorkspaceActivationStatus;
  createdAt: number;
  operatorId: string;
  history: WorkspaceActivationStep[];
  operatorNote?: string;
}

// ─── memory state ────────────────────────────────────────────

export interface WorkspaceActivationMemoryState {
  activations: WorkspaceActivationRecord[];
  totalActivations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialWorkspaceActivationMemory(): WorkspaceActivationMemoryState {
  return { activations: [], totalActivations: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __actSeq = 0;
export function newWorkspaceActivationId(): string {
  __actSeq += 1;
  return `wsp-activation-${Date.now().toString(36)}-${__actSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendWorkspaceActivation(
  state: WorkspaceActivationMemoryState, record: WorkspaceActivationRecord,
): WorkspaceActivationMemoryState {
  if (state.activations.some((a) => a.activationId === record.activationId)) {
    throw new Error(`workspace activation already exists: ${record.activationId}`);
  }
  // One active activation per (org, workspace, brand) tuple.
  const dupActive = state.activations.find(
    (a) =>
      a.organizationId === record.organizationId &&
      a.workspaceId === record.workspaceId &&
      a.brandLabel === record.brandLabel &&
      a.status === 'activated',
  );
  if (dupActive) {
    throw new Error(
      `workspace already has an active activation for brand ${record.brandLabel}: ${dupActive.activationId}`,
    );
  }
  return {
    ...state,
    activations: [...state.activations, record].slice(-WORKSPACE_ACTIVATION_LIMIT),
    totalActivations: state.totalActivations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function applyWorkspaceActivationStep(
  state: WorkspaceActivationMemoryState, activationId: string, step: WorkspaceActivationStep,
): WorkspaceActivationMemoryState {
  const idx = state.activations.findIndex((a) => a.activationId === activationId);
  if (idx === -1) throw new Error(`workspace activation not found: ${activationId}`);
  const prev = state.activations[idx];
  const next: WorkspaceActivationRecord = {
    ...prev, status: step.status, history: [...prev.history, step],
  };
  const activations = [...state.activations];
  activations[idx] = next;
  return { ...state, activations, updatedAt: step.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodWorkspaceActivation?: WorkspaceActivationMemoryState };

export interface WorkspaceActivationStore {
  read(): Promise<WorkspaceActivationMemoryState>;
  save(state: WorkspaceActivationMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createWorkspaceActivationStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): WorkspaceActivationStore {
  const filePath = path.join(dir, FILE);
  const store: WorkspaceActivationStore = {
    async read() {
      if (g.__moodWorkspaceActivation) return g.__moodWorkspaceActivation;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<WorkspaceActivationMemoryState>;
        g.__moodWorkspaceActivation = { ...createInitialWorkspaceActivationMemory(), ...parsed };
      } catch {
        g.__moodWorkspaceActivation = createInitialWorkspaceActivationMemory();
      }
      return g.__moodWorkspaceActivation;
    },
    async save(state) {
      state.activations = state.activations.slice(-WORKSPACE_ACTIVATION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodWorkspaceActivation = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodWorkspaceActivation = undefined;
    },
  };
  return store;
}
