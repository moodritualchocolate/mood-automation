/**
 * ORGANIZATION MEMORY (FIFO, operator-supervised)
 *
 * Persistent FIFO of Organizations, Workspaces, and Memberships for
 * the multi-tenant SaaS substrate. All mutations are exclusively
 * triggered by an operator action through /api/organization. The
 * store NEVER auto-creates organizations, NEVER auto-grants
 * memberships, NEVER auto-archives, NEVER transitions billing tiers
 * on its own.
 *
 * STRICT CONTRACT:
 *   - the memory NEVER auto-creates records
 *   - the memory NEVER auto-transitions state
 *   - the memory NEVER triggers any outbound action
 *   - FIFO-capped per record type
 *
 * Lives at data/memory/organization-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  BillingTier, MembershipRecord, OrganizationRecord, OrganizationRole,
  WorkspaceRecord,
} from './types';
import { ORGANIZATION_ROLES } from './types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'organization-memory.json';

export const ORGANIZATION_LIMIT = 128;
export const WORKSPACE_LIMIT = 512;
export const MEMBERSHIP_LIMIT = 1024;

// ─── state ───────────────────────────────────────────────────

export interface OrganizationMemoryState {
  organizations: OrganizationRecord[];
  workspaces: WorkspaceRecord[];
  memberships: MembershipRecord[];
  totalOrganizations: number;
  totalWorkspaces: number;
  totalMemberships: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialOrganizationMemory(): OrganizationMemoryState {
  return {
    organizations: [],
    workspaces: [],
    memberships: [],
    totalOrganizations: 0,
    totalWorkspaces: 0,
    totalMemberships: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── ID helpers ──────────────────────────────────────────────

let __orgSeq = 0;
let __wspSeq = 0;
let __memSeq = 0;

export function newOrganizationId(): string {
  __orgSeq += 1;
  return `org-${Date.now().toString(36)}-${__orgSeq.toString(36)}`;
}
export function newWorkspaceId(): string {
  __wspSeq += 1;
  return `wsp-${Date.now().toString(36)}-${__wspSeq.toString(36)}`;
}
export function newMembershipId(): string {
  __memSeq += 1;
  return `mem-${Date.now().toString(36)}-${__memSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendOrganization(
  state: OrganizationMemoryState, record: OrganizationRecord,
): OrganizationMemoryState {
  if (state.organizations.some((o) => o.organizationId === record.organizationId)) {
    throw new Error(`organization already exists: ${record.organizationId}`);
  }
  if (state.organizations.some((o) => o.slug === record.slug)) {
    throw new Error(`organization slug already in use: ${record.slug}`);
  }
  return {
    ...state,
    organizations: [...state.organizations, record].slice(-ORGANIZATION_LIMIT),
    totalOrganizations: state.totalOrganizations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function appendWorkspace(
  state: OrganizationMemoryState, record: WorkspaceRecord,
): OrganizationMemoryState {
  const owner = state.organizations.find((o) => o.organizationId === record.organizationId);
  if (!owner) throw new Error(`organization not found: ${record.organizationId}`);
  if (owner.archivedAt) throw new Error(`organization archived: ${record.organizationId}`);
  if (state.workspaces.some((w) => w.workspaceId === record.workspaceId)) {
    throw new Error(`workspace already exists: ${record.workspaceId}`);
  }
  // slug uniqueness scoped per-organization
  if (state.workspaces.some(
    (w) => w.organizationId === record.organizationId && w.slug === record.slug,
  )) {
    throw new Error(`workspace slug already in use in org: ${record.slug}`);
  }
  return {
    ...state,
    workspaces: [...state.workspaces, record].slice(-WORKSPACE_LIMIT),
    totalWorkspaces: state.totalWorkspaces + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function appendMembership(
  state: OrganizationMemoryState, record: MembershipRecord,
): OrganizationMemoryState {
  const owner = state.organizations.find((o) => o.organizationId === record.organizationId);
  if (!owner) throw new Error(`organization not found: ${record.organizationId}`);
  if (owner.archivedAt) throw new Error(`organization archived: ${record.organizationId}`);
  if (state.memberships.some((m) => m.membershipId === record.membershipId)) {
    throw new Error(`membership already exists: ${record.membershipId}`);
  }
  for (const r of record.roles) {
    if (!ORGANIZATION_ROLES.includes(r as OrganizationRole)) {
      throw new Error(`unknown organization role: ${r}`);
    }
  }
  if (record.workspaceIds) {
    for (const wid of record.workspaceIds) {
      const w = state.workspaces.find(
        (x) => x.workspaceId === wid && x.organizationId === record.organizationId,
      );
      if (!w) throw new Error(`workspace not in organization: ${wid}`);
    }
  }
  return {
    ...state,
    memberships: [...state.memberships, record].slice(-MEMBERSHIP_LIMIT),
    totalMemberships: state.totalMemberships + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function archiveOrganization(
  state: OrganizationMemoryState, organizationId: string, at: number, operatorNote?: string,
): OrganizationMemoryState {
  const idx = state.organizations.findIndex((o) => o.organizationId === organizationId);
  if (idx === -1) throw new Error(`organization not found: ${organizationId}`);
  const prev = state.organizations[idx];
  if (prev.archivedAt) throw new Error(`organization already archived: ${organizationId}`);
  const next: OrganizationRecord = {
    ...prev, archivedAt: at, operatorNote: operatorNote ?? prev.operatorNote,
  };
  const organizations = [...state.organizations];
  organizations[idx] = next;
  return { ...state, organizations, updatedAt: at };
}

export function archiveWorkspace(
  state: OrganizationMemoryState, workspaceId: string, at: number, operatorNote?: string,
): OrganizationMemoryState {
  const idx = state.workspaces.findIndex((w) => w.workspaceId === workspaceId);
  if (idx === -1) throw new Error(`workspace not found: ${workspaceId}`);
  const prev = state.workspaces[idx];
  if (prev.archivedAt) throw new Error(`workspace already archived: ${workspaceId}`);
  const next: WorkspaceRecord = {
    ...prev, archivedAt: at, operatorNote: operatorNote ?? prev.operatorNote,
  };
  const workspaces = [...state.workspaces];
  workspaces[idx] = next;
  return { ...state, workspaces, updatedAt: at };
}

export function revokeMembership(
  state: OrganizationMemoryState, membershipId: string, at: number, operatorNote?: string,
): OrganizationMemoryState {
  const idx = state.memberships.findIndex((m) => m.membershipId === membershipId);
  if (idx === -1) throw new Error(`membership not found: ${membershipId}`);
  const prev = state.memberships[idx];
  if (prev.revokedAt) throw new Error(`membership already revoked: ${membershipId}`);
  const next: MembershipRecord = {
    ...prev, revokedAt: at, operatorNote: operatorNote ?? prev.operatorNote,
  };
  const memberships = [...state.memberships];
  memberships[idx] = next;
  return { ...state, memberships, updatedAt: at };
}

export function setOrganizationBillingTier(
  state: OrganizationMemoryState, organizationId: string, tier: BillingTier, at: number,
): OrganizationMemoryState {
  const idx = state.organizations.findIndex((o) => o.organizationId === organizationId);
  if (idx === -1) throw new Error(`organization not found: ${organizationId}`);
  const prev = state.organizations[idx];
  if (prev.archivedAt) throw new Error(`organization archived: ${organizationId}`);
  const next: OrganizationRecord = { ...prev, billingTier: tier };
  const organizations = [...state.organizations];
  organizations[idx] = next;
  return { ...state, organizations, updatedAt: at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodOrganizationMemory?: OrganizationMemoryState };

export interface OrganizationMemoryStore {
  read(): Promise<OrganizationMemoryState>;
  save(state: OrganizationMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createOrganizationMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): OrganizationMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: OrganizationMemoryStore = {
    async read() {
      if (g.__moodOrganizationMemory) return g.__moodOrganizationMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<OrganizationMemoryState>;
        g.__moodOrganizationMemory = { ...createInitialOrganizationMemory(), ...parsed };
      } catch {
        g.__moodOrganizationMemory = createInitialOrganizationMemory();
      }
      return g.__moodOrganizationMemory;
    },
    async save(state) {
      state.organizations = state.organizations.slice(-ORGANIZATION_LIMIT);
      state.workspaces = state.workspaces.slice(-WORKSPACE_LIMIT);
      state.memberships = state.memberships.slice(-MEMBERSHIP_LIMIT);
      state.updatedAt = nowMs();
      g.__moodOrganizationMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOrganizationMemory = undefined;
    },
  };
  return store;
}
