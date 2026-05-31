/**
 * PERMISSION MATRIX (pure, observational)
 *
 * Fixed role × action permission matrix for the multi-tenant SaaS
 * substrate. Every action a future route exposes MUST map to an
 * entry in this matrix. The matrix never auto-approves an action —
 * it answers "MAY this role perform this action?" so the operator-
 * supervised routes can gate their POSTs.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the matrix never approves anything on its own
 *   - the matrix never auto-grants roles
 *   - allowed phrasing only: "MAY perform", "MAY NOT perform",
 *     "operator approval required", "Human remains final authority"
 */

import type { AnyRole, OrganizationRole, PlatformRole } from './types';
import { ALL_ROLES } from './types';

// ─── action catalog ──────────────────────────────────────────

export type PermissionAction =
  // ─── platform-level (only platform-owner) ───
  | 'platform.organization.create'
  | 'platform.organization.archive'
  | 'platform.organization.set-billing-tier'
  | 'platform.membership.grant-platform-owner'

  // ─── organization-level ───
  | 'org.workspace.create'
  | 'org.workspace.archive'
  | 'org.membership.grant'
  | 'org.membership.revoke'

  // ─── workspace-level entity CRUD ───
  | 'workspace.brand.create'
  | 'workspace.brand.archive'
  | 'workspace.product.create'
  | 'workspace.product.archive'
  | 'workspace.campaign.create'
  | 'workspace.campaign.transition'

  // ─── creative + production ───
  | 'workspace.knowledge.create'
  | 'workspace.knowledge.update'
  | 'workspace.brief.draft'
  | 'workspace.brief.approve'
  | 'workspace.brief.reject'
  | 'workspace.asset.register'
  | 'workspace.asset.approve'
  | 'workspace.asset.reject'
  | 'workspace.asset.archive'
  | 'workspace.gen-queue.draft'
  | 'workspace.gen-queue.approve'
  | 'workspace.gen-queue.submit'
  | 'workspace.gen-queue.complete'
  | 'workspace.gen-queue.fail'
  | 'workspace.gen-queue.archive'
  | 'workspace.publication.register'
  | 'workspace.publication.transition'

  // ─── analytics + planning ───
  | 'workspace.performance.log'
  | 'workspace.journey.log'
  | 'workspace.campaign-plan.save'
  | 'workspace.campaign-plan.approve'
  | 'workspace.campaign-plan.transition'

  // ─── ops + agent ───
  | 'workspace.task.create'
  | 'workspace.task.transition'
  | 'workspace.agent.execute'
  | 'workspace.agent.approve'
  | 'workspace.agent.reject'

  // ─── read-only ───
  | 'workspace.read'
  | 'org.read';

export const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
  'platform.organization.create', 'platform.organization.archive',
  'platform.organization.set-billing-tier', 'platform.membership.grant-platform-owner',
  'org.workspace.create', 'org.workspace.archive',
  'org.membership.grant', 'org.membership.revoke',
  'workspace.brand.create', 'workspace.brand.archive',
  'workspace.product.create', 'workspace.product.archive',
  'workspace.campaign.create', 'workspace.campaign.transition',
  'workspace.knowledge.create', 'workspace.knowledge.update',
  'workspace.brief.draft', 'workspace.brief.approve', 'workspace.brief.reject',
  'workspace.asset.register', 'workspace.asset.approve', 'workspace.asset.reject',
  'workspace.asset.archive',
  'workspace.gen-queue.draft', 'workspace.gen-queue.approve',
  'workspace.gen-queue.submit', 'workspace.gen-queue.complete',
  'workspace.gen-queue.fail', 'workspace.gen-queue.archive',
  'workspace.publication.register', 'workspace.publication.transition',
  'workspace.performance.log', 'workspace.journey.log',
  'workspace.campaign-plan.save', 'workspace.campaign-plan.approve',
  'workspace.campaign-plan.transition',
  'workspace.task.create', 'workspace.task.transition',
  'workspace.agent.execute', 'workspace.agent.approve', 'workspace.agent.reject',
  'workspace.read', 'org.read',
];

// ─── role × action eligibility ───────────────────────────────

/** Eligibility table: for each action, which roles MAY perform it.
 *  The route layer combines this with the operator's resolved roles
 *  to decide whether to accept a POST. */
const ACTION_TO_ELIGIBLE_ROLES: Record<PermissionAction, AnyRole[]> = {
  // platform-level — only platform-owner
  'platform.organization.create':           ['platform-owner'],
  'platform.organization.archive':          ['platform-owner'],
  'platform.organization.set-billing-tier': ['platform-owner'],
  'platform.membership.grant-platform-owner': ['platform-owner'],

  // organization-level — platform owner + organization owner + admin
  'org.workspace.create':   ['platform-owner', 'organization-owner', 'admin'],
  'org.workspace.archive':  ['platform-owner', 'organization-owner', 'admin'],
  'org.membership.grant':   ['platform-owner', 'organization-owner', 'admin'],
  'org.membership.revoke':  ['platform-owner', 'organization-owner', 'admin'],

  // workspace-level entity CRUD
  'workspace.brand.create':     ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.brand.archive':    ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.product.create':   ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.product.archive':  ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.campaign.create':  ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.campaign.transition': ['platform-owner', 'organization-owner', 'admin', 'manager'],

  // creative + production
  'workspace.knowledge.create': ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.knowledge.update': ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.brief.draft':      ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.brief.approve':    ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.brief.reject':     ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.asset.register':   ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.asset.approve':    ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.asset.reject':     ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.asset.archive':    ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.gen-queue.draft':    ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.gen-queue.approve':  ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.gen-queue.submit':   ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.gen-queue.complete': ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.gen-queue.fail':     ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.gen-queue.archive':  ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.publication.register':   ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.publication.transition': ['platform-owner', 'organization-owner', 'admin', 'manager'],

  // analytics + planning
  'workspace.performance.log':            ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.journey.log':                ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.campaign-plan.save':         ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.campaign-plan.approve':      ['platform-owner', 'organization-owner', 'admin'],
  'workspace.campaign-plan.transition':   ['platform-owner', 'organization-owner', 'admin', 'manager'],

  // ops + agent
  'workspace.task.create':       ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.task.transition':   ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.agent.execute':     ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
  'workspace.agent.approve':     ['platform-owner', 'organization-owner', 'admin', 'manager'],
  'workspace.agent.reject':      ['platform-owner', 'organization-owner', 'admin', 'manager'],

  // read-only — every role except none
  'workspace.read': ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
  'org.read':       ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
};

// ─── permission helpers ──────────────────────────────────────

export function eligibleRolesFor(action: PermissionAction): AnyRole[] {
  return ACTION_TO_ELIGIBLE_ROLES[action] ?? [];
}

export function roleHasPermission(role: AnyRole, action: PermissionAction): boolean {
  const eligible = ACTION_TO_ELIGIBLE_ROLES[action];
  if (!eligible) return false;
  return eligible.includes(role);
}

export function anyRoleHasPermission(roles: AnyRole[], action: PermissionAction): boolean {
  return roles.some((r) => roleHasPermission(r, action));
}

// ─── matrix reading (for the API + studio panel) ─────────────

export interface PermissionMatrixEntry {
  action: PermissionAction;
  eligibleRoles: AnyRole[];
  /** Plain-language description (allowed phrasing only). */
  description: string;
}

export interface PermissionMatrixReading {
  entries: PermissionMatrixEntry[];
  /** All roles known to the matrix. */
  allRoles: AnyRole[];
  /** Counters per role — how many actions each role MAY perform. */
  rolePermissionCounts: Record<AnyRole, number>;
  /** Counter per action — how many roles MAY perform it. */
  actionRoleCounts: Record<PermissionAction, number>;
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Permission matrix is a fixed eligibility table. It never approves ' +
  'anything on its own, never auto-grants roles. The route layer combines ' +
  'this matrix with the operator credentials. Operator approval required. ' +
  'Human remains final authority.';

function describe(action: PermissionAction, eligible: AnyRole[]): string {
  return `roles MAY perform '${action}': ${eligible.join(' · ')} · operator approval required at the route layer`;
}

export function buildPermissionMatrix(): PermissionMatrixReading {
  const rolePermissionCounts = {} as Record<AnyRole, number>;
  for (const r of ALL_ROLES) rolePermissionCounts[r] = 0;
  const actionRoleCounts = {} as Record<PermissionAction, number>;
  const entries: PermissionMatrixEntry[] = ALL_PERMISSION_ACTIONS.map((action) => {
    const eligibleRoles = ACTION_TO_ELIGIBLE_ROLES[action];
    for (const r of eligibleRoles) rolePermissionCounts[r] += 1;
    actionRoleCounts[action] = eligibleRoles.length;
    return { action, eligibleRoles, description: describe(action, eligibleRoles) };
  });
  return {
    entries, allRoles: ALL_ROLES, rolePermissionCounts, actionRoleCounts,
    notes: [
      `${ALL_PERMISSION_ACTIONS.length} actions × ${ALL_ROLES.length} roles · operator approval required at the route layer`,
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}

// ─── coarse role hint per organization role ──────────────────

/** Per-role org coverage hint — useful for the studio panel. */
export function organizationRoleCoverage(): Record<OrganizationRole, number> {
  const out = {} as Record<OrganizationRole, number>;
  for (const role of ['organization-owner', 'admin', 'manager', 'editor', 'viewer'] as OrganizationRole[]) {
    out[role] = ALL_PERMISSION_ACTIONS.filter((a) => roleHasPermission(role, a)).length;
  }
  return out;
}

/** Helper for the platform-owner global role. */
export function platformOwnerCoverage(): number {
  const role: PlatformRole = 'platform-owner';
  return ALL_PERMISSION_ACTIONS.filter((a) => roleHasPermission(role, a)).length;
}
