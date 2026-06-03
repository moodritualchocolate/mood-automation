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
 * TENANT ISOLATION (added by tenant-isolation-hardening directive):
 * every record carries `organizationId` + `workspaceId`. Legacy
 * records without these fields are migrated to the MOOD defaults
 * on read so existing seed data continues to function. The store
 * itself does not filter — the route layer does, with the stamps
 * the operator passes in the request.
 *
 * Lives at data/memory/workspace-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Formula } from '@/core/types';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from './tenancy/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'workspace-memory.json';

export const WORKSPACE_LIMIT_PROJECTS = 64;
export const WORKSPACE_LIMIT_BRANDS = 64;
export const WORKSPACE_LIMIT_PRODUCTS = 128;
export const WORKSPACE_LIMIT_CAMPAIGNS = 256;

// ─── types ────────────────────────────────────────────────────

export interface ProjectRecord {
  projectId: string;
  /** Tenancy stamp. Required for new records. Legacy records are
   *  migrated to PLATFORM_TENANT_ID_MOOD / PLATFORM_WORKSPACE_ID_MOOD
   *  on read. */
  organizationId: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: number;
  operatorId: string;
  operatorNote?: string;
}

/** Optional brand identity profile. Captured by /brand-setup and
 *  consumed by the Asset Generator as a default palette / signature.
 *  All fields optional — operators can fill them in over time. */
export interface BrandIdentity {
  /** One-sentence positioning. Operator-written. */
  positioning?: string;
  /** Hebrew slogan, RTL. */
  slogan?: string;
  /** Brand voice — short adjectives ("quiet · editorial · honest"). */
  voice?: string;
  /** Audience description ("31-49, urban, Hebrew-first"). */
  audience?: string;
  /** Default palette key for the Asset Generator
   *  ('cocoa' | 'amber' | 'ember' | 'ivory' | 'ink'). */
  paletteKey?: string;
  /** Brand language — 'hebrew' | 'english' | 'mixed'. */
  language?: string;
  /** Comma-separated values the brand stands for. */
  values?: string;
  /** Comma-separated channels the brand publishes on. */
  channels?: string;
  /** Signature mark displayed in renders (defaults to brand name uppercase). */
  signature?: string;
  /** Timestamp of last identity update. */
  updatedAt?: number;
  /** Last operator to update identity. */
  updatedBy?: string;
}

export interface BrandRecord {
  brandId: string;
  /** Tenancy stamp. Required for new records. */
  organizationId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: number;
  operatorId: string;
  operatorNote?: string;
  /** Optional brand identity profile (see BrandIdentity). */
  identity?: BrandIdentity;
}

export interface ProductRecord {
  productId: string;
  /** Tenancy stamp. Required for new records. */
  organizationId: string;
  workspaceId: string;
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
  /** Tenancy stamp. Required for new records. */
  organizationId: string;
  workspaceId: string;
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

/** Replace a brand's identity profile. Pure. Throws on unknown
 *  brandId / tenant mismatch so the route can return a clear error. */
export function updateBrandIdentity(
  state: WorkspaceMemoryState,
  args: { brandId: string; organizationId: string; workspaceId: string; identity: BrandIdentity; operatorId: string },
): WorkspaceMemoryState {
  const idx = state.brands.findIndex((b) => b.brandId === args.brandId);
  if (idx === -1) throw new Error(`brand not found: ${args.brandId}`);
  const prev = state.brands[idx];
  if (prev.organizationId !== args.organizationId || prev.workspaceId !== args.workspaceId) {
    throw new Error('tenant scope mismatch');
  }
  const at = Date.now();
  const next: BrandRecord = {
    ...prev,
    identity: { ...(prev.identity ?? {}), ...args.identity, updatedAt: at, updatedBy: args.operatorId },
  };
  const brands = [...state.brands];
  brands[idx] = next;
  return { ...state, brands, updatedAt: at };
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

// ─── tenant-scoping helpers (read-side) ──────────────────────

export interface TenantScope { organizationId: string; workspaceId: string; }

export function brandsForTenant(state: WorkspaceMemoryState, scope: TenantScope): BrandRecord[] {
  return state.brands.filter(
    (b) => b.organizationId === scope.organizationId && b.workspaceId === scope.workspaceId,
  );
}
export function productsForTenant(state: WorkspaceMemoryState, scope: TenantScope): ProductRecord[] {
  return state.products.filter(
    (p) => p.organizationId === scope.organizationId && p.workspaceId === scope.workspaceId,
  );
}
export function projectsForTenant(state: WorkspaceMemoryState, scope: TenantScope): ProjectRecord[] {
  return state.projects.filter(
    (p) => p.organizationId === scope.organizationId && p.workspaceId === scope.workspaceId,
  );
}
export function campaignsForTenant(state: WorkspaceMemoryState, scope: TenantScope): CampaignRecord[] {
  return state.campaigns.filter(
    (c) => c.organizationId === scope.organizationId && c.workspaceId === scope.workspaceId,
  );
}

// ─── legacy migration on read ────────────────────────────────

/** Migrate a legacy record (no organizationId/workspaceId) to MOOD
 *  defaults. The migration is idempotent — records that already carry
 *  a tenancy stamp are returned unchanged. */
function migrateLegacyTenancy<T extends { organizationId?: string; workspaceId?: string }>(rec: T): T & TenantScope {
  return {
    ...rec,
    organizationId: rec.organizationId ?? PLATFORM_TENANT_ID_MOOD,
    workspaceId: rec.workspaceId ?? PLATFORM_WORKSPACE_ID_MOOD,
  };
}

function migrateState(parsed: Partial<WorkspaceMemoryState>): WorkspaceMemoryState {
  const base = { ...createInitialWorkspaceMemory(), ...parsed };
  return {
    ...base,
    projects:  (base.projects  ?? []).map(migrateLegacyTenancy) as ProjectRecord[],
    brands:    (base.brands    ?? []).map(migrateLegacyTenancy) as BrandRecord[],
    products:  (base.products  ?? []).map(migrateLegacyTenancy) as ProductRecord[],
    campaigns: (base.campaigns ?? []).map(migrateLegacyTenancy) as CampaignRecord[],
  };
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
        g.__moodWorkspace = migrateState(parsed);
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
