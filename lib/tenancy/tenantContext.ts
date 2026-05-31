/**
 * TENANT CONTEXT (pure resolver + boundary guard)
 *
 * Pure-function resolver that converts an operator identity + a
 * target organization/workspace into a resolved `TenantContext`.
 * The route layer then calls `enforceTenantBoundary` before every
 * read or write, which throws a `TenantBoundaryError` if the
 * context does not authorize the access.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure functions
 *   - the resolver NEVER auto-grants roles
 *   - the resolver NEVER fabricates memberships
 *   - the resolver NEVER reaches into another organization
 *   - Human remains final authority
 */

import type {
  MembershipRecord, OrganizationRecord, OrganizationRole, PlatformRole,
  TenantContext, TenantOwnership, WorkspaceRecord,
} from './types';
import { PLATFORM_TENANT_ID_MOOD, TenantBoundaryError } from './types';
import { anyRoleHasPermission, type PermissionAction } from './permissionMatrix';

// ─── input shapes ────────────────────────────────────────────

export interface ResolveTenantContextInput {
  /** Operator (caller) identifier. */
  operatorId: string;
  /** Target organization for this request. */
  targetOrganizationId: string;
  /** Optional target workspace for this request. */
  targetWorkspaceId?: string | null;
  /** Globally-stored platform-owner operator ids. */
  platformOwnerOperatorIds: string[];
  /** All known organizations. */
  organizations: OrganizationRecord[];
  /** All known workspaces. */
  workspaces: WorkspaceRecord[];
  /** All known memberships. */
  memberships: MembershipRecord[];
  /** Resolution timestamp (ms). */
  nowMs: number;
}

// ─── pure resolver ───────────────────────────────────────────

export function resolveTenantContext(input: ResolveTenantContextInput): TenantContext {
  const {
    operatorId, targetOrganizationId, targetWorkspaceId,
    platformOwnerOperatorIds, organizations, workspaces, memberships, nowMs,
  } = input;

  const isPlatformOwner = platformOwnerOperatorIds.includes(operatorId);
  const platformRoles: PlatformRole[] = isPlatformOwner ? ['platform-owner'] : [];

  // Membership intersection — only memberships in the requested org count,
  // and only those NOT revoked.
  const orgMemberships = memberships.filter(
    (m) =>
      m.organizationId === targetOrganizationId &&
      m.memberId === operatorId &&
      !m.revokedAt,
  );

  // If a workspace is targeted, restrict to memberships whose workspaceIds
  // either include it or are unscoped (empty/undefined = all workspaces).
  const scopedMemberships = targetWorkspaceId
    ? orgMemberships.filter(
        (m) =>
          !m.workspaceIds ||
          m.workspaceIds.length === 0 ||
          m.workspaceIds.includes(targetWorkspaceId),
      )
    : orgMemberships;

  const orgRoleSet = new Set<OrganizationRole>();
  for (const m of scopedMemberships) for (const r of m.roles) orgRoleSet.add(r);
  const organizationRoles = [...orgRoleSet];

  // Sanity-check that the target org actually exists (skip for MOOD which
  // is the implicit default tenant for legacy entities).
  const orgExists =
    targetOrganizationId === PLATFORM_TENANT_ID_MOOD ||
    organizations.some((o) => o.organizationId === targetOrganizationId);
  // Sanity-check that the target workspace, if any, belongs to the org.
  const wspBelongs =
    !targetWorkspaceId ||
    workspaces.some(
      (w) =>
        w.workspaceId === targetWorkspaceId &&
        w.organizationId === targetOrganizationId,
    );

  const resolvedOrgRoles = orgExists && wspBelongs ? organizationRoles : [];

  return {
    organizationId: targetOrganizationId,
    workspaceId: targetWorkspaceId ?? null,
    platformRoles,
    organizationRoles: resolvedOrgRoles,
    isPlatformOwner,
    isOrganizationMember: resolvedOrgRoles.length > 0,
    resolvedAt: nowMs,
  };
}

// ─── boundary guard ──────────────────────────────────────────

export interface EnforceTenantBoundaryInput {
  context: TenantContext;
  /** The entity the route is about to read/write. */
  ownership: TenantOwnership;
  /** The action the route is gating. */
  action: PermissionAction;
}

export function enforceTenantBoundary(input: EnforceTenantBoundaryInput): void {
  const { context, ownership, action } = input;

  // Cross-tenant access is always rejected unless the caller is a
  // platform-owner. Even then we still emit a structured error if the
  // resolved organization doesn't match (defense-in-depth).
  if (ownership.organizationId !== context.organizationId) {
    throw new TenantBoundaryError(
      `cross-tenant access rejected: context org=${context.organizationId} ` +
        `entity org=${ownership.organizationId}`,
      'TENANT_BOUNDARY_ORGANIZATION',
    );
  }

  // Workspace-scoped boundary: if the entity carries a workspaceId and the
  // context resolves a workspaceId, they must match.
  if (
    context.workspaceId !== null &&
    ownership.workspaceId !== context.workspaceId
  ) {
    throw new TenantBoundaryError(
      `cross-workspace access rejected: context wsp=${context.workspaceId} ` +
        `entity wsp=${ownership.workspaceId}`,
      'TENANT_BOUNDARY_WORKSPACE',
    );
  }

  // Permission check: the operator's resolved roles must include at least
  // one role that MAY perform this action. Platform-owner is always eligible
  // for platform-level actions; the matrix already encodes that.
  const roles = [...context.platformRoles, ...context.organizationRoles];
  if (roles.length === 0) {
    throw new TenantBoundaryError(
      `no roles resolved for operator in organization ${context.organizationId}`,
      'TENANT_BOUNDARY_NO_ROLES',
    );
  }
  if (!anyRoleHasPermission(roles, action)) {
    throw new TenantBoundaryError(
      `roles [${roles.join(',')}] MAY NOT perform '${action}'`,
      'TENANT_BOUNDARY_PERMISSION',
    );
  }
}

// ─── readonly helpers ────────────────────────────────────────

/** Lists the organizations a given operator currently belongs to
 *  (active memberships only). Useful for the studio panel. */
export function listOperatorOrganizations(
  operatorId: string,
  organizations: OrganizationRecord[],
  memberships: MembershipRecord[],
  platformOwnerOperatorIds: string[],
): OrganizationRecord[] {
  if (platformOwnerOperatorIds.includes(operatorId)) {
    // Platform owner sees every non-archived organization (read-only listing).
    return organizations.filter((o) => !o.archivedAt);
  }
  const orgIds = new Set(
    memberships
      .filter((m) => m.memberId === operatorId && !m.revokedAt)
      .map((m) => m.organizationId),
  );
  return organizations.filter((o) => orgIds.has(o.organizationId) && !o.archivedAt);
}

/** True if the operator has at least one active membership in the org. */
export function operatorBelongsToOrganization(
  operatorId: string,
  organizationId: string,
  memberships: MembershipRecord[],
): boolean {
  return memberships.some(
    (m) =>
      m.memberId === operatorId &&
      m.organizationId === organizationId &&
      !m.revokedAt,
  );
}
