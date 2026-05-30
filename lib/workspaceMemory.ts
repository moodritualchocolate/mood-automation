/**
 * WORKSPACE MEMORY (FIFO-per-collection, operator-supervised)
 *
 * Phase 1 — Operations Layer.
 *
 * Persistent collections for the workspace tree:
 *   Project → Brand → Product → Campaign
 *
 * Each entity is operator-created at the route layer. The memory
 * NEVER auto-creates entities and NEVER triggers any outbound
 * action. Entities reference each other by id only — the store does
 * not enforce referential integrity, the operator does.
 *
 * Lives at data/memory/workspace-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Formula } from '@/core/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'workspace-memory.json';

export const WORKSPACE_LIMIT_PROJECTS = 64;
export const WORKSPACE_LIMIT_BRANDS = 64;
export const WORKSPACE_LIMIT_PRODUCTS = 128;
export const WORKSPACE_LIMIT_CAMPAIGNS = 256;

// ─── types ────────────────────────────────────────────────────

export interface ProjectRecord {
  projectId: string;
  name: string;
  description?: string;
  createdAt: number;
  operatorId: string;
  operatorNote?: string;
}

export interface BrandRecord {
  brandId: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: number;
  operatorId: string;
  operatorNote?: string;
}

export interface ProductRecord {
  productId: string;
  brandId: string;
  name: string;
  formula?: Formula;
  description?: string;
  createdAt: number;
  operatorId: string;
  operatorNote?: string;
}

export interface CampaignRecord {
  campaignId: string;
  productId: string;
  name: string;
  /** Optional link to a saved campaign plan. */
  campaignPlanId?: string;
  status: 'planning' | 'in-flight' | 'completed' | 'archived';
  createdAt: number;
  operatorId: string;
  operatorNote?: string;
}

// ─── state ────────────────────────────────────────────────────

export interface WorkspaceMemoryState {
  projects: ProjectRecord[];
  brands: BrandRecord[];
  products: ProductRecord[];
  campaigns: CampaignRecord[];
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialWorkspaceMemory(): WorkspaceMemoryState {
  return {
    projects: [], brands: [], products: [], campaigns: [],
    firstUpdatedAt: null, updatedAt: nowMs(),
  };
}

// ─── ID helpers ──────────────────────────────────────────────

let __projSeq = 0;
let __brandSeq = 0;
let __prodSeq = 0;
let __campSeq = 0;
export function newProjectId(): string {
  __projSeq += 1; return `proj-${Date.now().toString(36)}-${__projSeq.toString(36)}`;
}
export function newBrandId(): string {
  __brandSeq += 1; return `brand-${Date.now().toString(36)}-${__brandSeq.toString(36)}`;
}
export function newProductId(): string {
  __prodSeq += 1; return `prod-${Date.now().toString(36)}-${__prodSeq.toString(36)}`;
}
export function newCampaignId(): string {
  __campSeq += 1; return `camp-${Date.now().toString(36)}-${__campSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendProject(state: WorkspaceMemoryState, record: ProjectRecord): WorkspaceMemoryState {
  return {
    ...state,
    projects: [...state.projects, record].slice(-WORKSPACE_LIMIT_PROJECTS),
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}
export function appendBrand(state: WorkspaceMemoryState, record: BrandRecord): WorkspaceMemoryState {
  return {
    ...state,
    brands: [...state.brands, record].slice(-WORKSPACE_LIMIT_BRANDS),
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}
export function appendProduct(state: WorkspaceMemoryState, record: ProductRecord): WorkspaceMemoryState {
  return {
    ...state,
    products: [...state.products, record].slice(-WORKSPACE_LIMIT_PRODUCTS),
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}
export function appendCampaign(state: WorkspaceMemoryState, record: CampaignRecord): WorkspaceMemoryState {
  return {
    ...state,
    campaigns: [...state.campaigns, record].slice(-WORKSPACE_LIMIT_CAMPAIGNS),
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}
export function updateCampaignStatus(
  state: WorkspaceMemoryState, campaignId: string, status: CampaignRecord['status'],
): WorkspaceMemoryState {
  const idx = state.campaigns.findIndex((c) => c.campaignId === campaignId);
  if (idx === -1) throw new Error(`campaign not found: ${campaignId}`);
  const campaigns = [...state.campaigns];
  campaigns[idx] = { ...campaigns[idx], status };
  return { ...state, campaigns, updatedAt: nowMs() };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodWorkspace?: WorkspaceMemoryState };

export interface WorkspaceMemoryStore {
  read(): Promise<WorkspaceMemoryState>;
  save(state: WorkspaceMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createWorkspaceMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): WorkspaceMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: WorkspaceMemoryStore = {
    async read() {
      if (g.__moodWorkspace) return g.__moodWorkspace;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<WorkspaceMemoryState>;
        g.__moodWorkspace = { ...createInitialWorkspaceMemory(), ...parsed };
      } catch {
        g.__moodWorkspace = createInitialWorkspaceMemory();
      }
      return g.__moodWorkspace;
    },
    async save(state) {
      state.updatedAt = nowMs();
      g.__moodWorkspace = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodWorkspace = undefined;
    },
  };
  return store;
}
