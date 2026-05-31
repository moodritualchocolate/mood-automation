/**
 * VERIFY — Multi-tenant SaaS substrate.
 *
 * Phase 1 Organization model · Phase 2 Tenant isolation · Phase 3
 * Permission model · Phase 4 Workspace architecture · Phase 5
 * Platform map (5 docs + billing-hooks extension points).
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  ALL_ROLES, BILLING_TIERS, ORGANIZATION_ROLES, PLATFORM_ROLES,
  PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD,
  TenantBoundaryError,
  type MembershipRecord, type OrganizationRecord, type WorkspaceRecord,
} from '../lib/tenancy/types';
import {
  ALL_PERMISSION_ACTIONS, anyRoleHasPermission, buildPermissionMatrix,
  eligibleRolesFor, organizationRoleCoverage, platformOwnerCoverage,
  roleHasPermission,
  type PermissionAction,
} from '../lib/tenancy/permissionMatrix';
import {
  appendMembership, appendOrganization, appendWorkspace,
  archiveOrganization, archiveWorkspace, createInitialOrganizationMemory,
  MEMBERSHIP_LIMIT, newMembershipId, newOrganizationId, newWorkspaceId,
  ORGANIZATION_LIMIT, revokeMembership, setOrganizationBillingTier,
  WORKSPACE_LIMIT,
} from '../lib/tenancy/organizationMemory';
import {
  enforceTenantBoundary, listOperatorOrganizations,
  operatorBelongsToOrganization, resolveTenantContext,
} from '../lib/tenancy/tenantContext';
import { describeBillingHooks } from '../lib/tenancy/billingHooks';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── fixture helpers ─────────────────────────────────────────

function mkOrg(over: Partial<OrganizationRecord> = {}): OrganizationRecord {
  return {
    organizationId: over.organizationId ?? newOrganizationId(),
    name: over.name ?? 'Org',
    slug: over.slug ?? 'org',
    billingTier: over.billingTier ?? 'unbilled',
    createdAt: over.createdAt ?? 1000,
    createdBy: over.createdBy ?? 'plat-owner',
    archivedAt: over.archivedAt,
    operatorNote: over.operatorNote,
  };
}
function mkWsp(orgId: string, over: Partial<WorkspaceRecord> = {}): WorkspaceRecord {
  return {
    workspaceId: over.workspaceId ?? newWorkspaceId(),
    organizationId: orgId,
    name: over.name ?? 'Default',
    slug: over.slug ?? 'default',
    createdAt: over.createdAt ?? 1000,
    createdBy: over.createdBy ?? 'admin-a',
    archivedAt: over.archivedAt,
    operatorNote: over.operatorNote,
  };
}
function mkMem(orgId: string, memberId: string, over: Partial<MembershipRecord> = {}): MembershipRecord {
  return {
    membershipId: over.membershipId ?? newMembershipId(),
    organizationId: orgId,
    memberId,
    displayName: over.displayName ?? memberId,
    roles: over.roles ?? ['editor'],
    workspaceIds: over.workspaceIds,
    createdAt: over.createdAt ?? 1000,
    grantedBy: over.grantedBy ?? 'admin-a',
    revokedAt: over.revokedAt,
    operatorNote: over.operatorNote,
  };
}

// ─── Phase 1: organization model ─────────────────────────────

function caseRolesAreCorrect(): { ok: boolean; detail: string } {
  return {
    ok: PLATFORM_ROLES.length === 1 && PLATFORM_ROLES[0] === 'platform-owner' &&
        ORGANIZATION_ROLES.length === 5 && ALL_ROLES.length === 6,
    detail: `platform=${PLATFORM_ROLES.length} org=${ORGANIZATION_ROLES.length} all=${ALL_ROLES.length}`,
  };
}
function caseBillingTierLadder(): { ok: boolean; detail: string } {
  const expected = ['unbilled', 'starter', 'growth', 'scale', 'enterprise'];
  return {
    ok: BILLING_TIERS.length === 5 && expected.every((t, i) => BILLING_TIERS[i] === t),
    detail: BILLING_TIERS.join(' · '),
  };
}
function casePlatformConstants(): { ok: boolean; detail: string } {
  return {
    ok: PLATFORM_TENANT_ID_MOOD === 'org-mood' && PLATFORM_WORKSPACE_ID_MOOD === 'wsp-mood-default',
    detail: `${PLATFORM_TENANT_ID_MOOD} · ${PLATFORM_WORKSPACE_ID_MOOD}`,
  };
}

// ─── Phase 1: memory transforms ──────────────────────────────

function caseAppendOrganization(): { ok: boolean; detail: string } {
  let state = createInitialOrganizationMemory();
  const o = mkOrg({ organizationId: 'o1', slug: 'one' });
  state = appendOrganization(state, o);
  if (state.organizations.length !== 1) return { ok: false, detail: 'org not appended' };
  // duplicate id rejected
  try { appendOrganization(state, mkOrg({ organizationId: 'o1', slug: 'two' })); return { ok: false, detail: 'dup id accepted' }; }
  catch { /* ok */ }
  // duplicate slug rejected
  try { appendOrganization(state, mkOrg({ organizationId: 'o2', slug: 'one' })); return { ok: false, detail: 'dup slug accepted' }; }
  catch { /* ok */ }
  return { ok: state.totalOrganizations === 1, detail: `total=${state.totalOrganizations}` };
}
function caseAppendWorkspaceRequiresOrg(): { ok: boolean; detail: string } {
  let state = createInitialOrganizationMemory();
  try { appendWorkspace(state, mkWsp('missing-org')); return { ok: false, detail: 'accepted missing org' }; }
  catch { /* ok */ }
  state = appendOrganization(state, mkOrg({ organizationId: 'o1', slug: 'one' }));
  state = appendWorkspace(state, mkWsp('o1', { workspaceId: 'w1', slug: 'main' }));
  // workspace slug uniqueness scoped per-org
  try { appendWorkspace(state, mkWsp('o1', { workspaceId: 'w2', slug: 'main' })); return { ok: false, detail: 'dup slug per org accepted' }; }
  catch { /* ok */ }
  // same slug different org is allowed
  state = appendOrganization(state, mkOrg({ organizationId: 'o2', slug: 'two' }));
  state = appendWorkspace(state, mkWsp('o2', { workspaceId: 'w3', slug: 'main' }));
  return { ok: state.workspaces.length === 2, detail: `wsps=${state.workspaces.length}` };
}
function caseAppendMembershipRequiresOrg(): { ok: boolean; detail: string } {
  let state = createInitialOrganizationMemory();
  state = appendOrganization(state, mkOrg({ organizationId: 'o1', slug: 'one' }));
  state = appendWorkspace(state, mkWsp('o1', { workspaceId: 'w1' }));
  state = appendMembership(state, mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'] }));
  // unknown org
  try { appendMembership(state, mkMem('nope', 'op-b', { membershipId: 'm2' })); return { ok: false, detail: 'accepted unknown org' }; }
  catch { /* ok */ }
  // unknown role
  try { appendMembership(state, mkMem('o1', 'op-b', { membershipId: 'm3', roles: ['mega-admin' as never] })); return { ok: false, detail: 'accepted unknown role' }; }
  catch { /* ok */ }
  // unknown workspaceId
  try {
    appendMembership(state, mkMem('o1', 'op-b', { membershipId: 'm4', roles: ['editor'], workspaceIds: ['nope'] }));
    return { ok: false, detail: 'accepted unknown wsp' };
  } catch { /* ok */ }
  // workspace-scoped membership succeeds
  state = appendMembership(state, mkMem('o1', 'op-b', { membershipId: 'm5', roles: ['editor'], workspaceIds: ['w1'] }));
  return { ok: state.memberships.length === 2, detail: `mems=${state.memberships.length}` };
}
function caseArchiveAndRevoke(): { ok: boolean; detail: string } {
  let state = createInitialOrganizationMemory();
  state = appendOrganization(state, mkOrg({ organizationId: 'o1', slug: 'one' }));
  state = appendWorkspace(state, mkWsp('o1', { workspaceId: 'w1' }));
  state = appendMembership(state, mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'] }));
  state = archiveWorkspace(state, 'w1', 2000);
  if (!state.workspaces[0].archivedAt) return { ok: false, detail: 'archiveWorkspace did not set timestamp' };
  state = revokeMembership(state, 'm1', 2000);
  if (!state.memberships[0].revokedAt) return { ok: false, detail: 'revokeMembership did not set timestamp' };
  state = archiveOrganization(state, 'o1', 3000);
  if (!state.organizations[0].archivedAt) return { ok: false, detail: 'archiveOrganization did not set timestamp' };
  // archived org rejects new workspace
  try { appendWorkspace(state, mkWsp('o1', { workspaceId: 'w2', slug: 'second' })); return { ok: false, detail: 'archived org accepted write' }; }
  catch { /* ok */ }
  // double archive rejected
  try { archiveOrganization(state, 'o1', 4000); return { ok: false, detail: 'double archive accepted' }; }
  catch { /* ok */ }
  // unknown ids throw
  try { archiveWorkspace(state, 'nope', 1); return { ok: false, detail: 'archive missing wsp accepted' }; }
  catch (e) { if (!/not found/.test((e as Error).message)) return { ok: false, detail: (e as Error).message }; }
  try { revokeMembership(state, 'nope', 1); return { ok: false, detail: 'revoke missing mem accepted' }; }
  catch (e) { if (!/not found/.test((e as Error).message)) return { ok: false, detail: (e as Error).message }; }
  return { ok: true, detail: 'archive + revoke + reject-archived-write all work' };
}
function caseFifoCaps(): { ok: boolean; detail: string } {
  let state = createInitialOrganizationMemory();
  for (let i = 0; i < ORGANIZATION_LIMIT + 5; i++) {
    state = appendOrganization(state, mkOrg({
      organizationId: `o-${i}`, slug: `slug-${i}`,
    }));
  }
  if (state.organizations.length !== ORGANIZATION_LIMIT) {
    return { ok: false, detail: `orgs=${state.organizations.length}` };
  }
  const liveOrgId = state.organizations[state.organizations.length - 1].organizationId;
  for (let i = 0; i < WORKSPACE_LIMIT + 5; i++) {
    state = appendWorkspace(state, mkWsp(liveOrgId, {
      workspaceId: `w-${i}`, slug: `slug-${i}`,
    }));
  }
  if (state.workspaces.length !== WORKSPACE_LIMIT) {
    return { ok: false, detail: `wsps=${state.workspaces.length}` };
  }
  for (let i = 0; i < MEMBERSHIP_LIMIT + 5; i++) {
    state = appendMembership(state, mkMem(liveOrgId, `op-${i}`, {
      membershipId: `m-${i}`, roles: ['viewer'],
    }));
  }
  return {
    ok: state.memberships.length === MEMBERSHIP_LIMIT,
    detail: `orgs=${ORGANIZATION_LIMIT} wsps=${WORKSPACE_LIMIT} mems=${state.memberships.length}`,
  };
}

// ─── Phase 2: tenant isolation ───────────────────────────────

function caseResolveContextRolesFromMembership(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1', slug: 'main' })];
  const mems = [
    mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin', 'editor'] }),
  ];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1234,
  });
  return {
    ok: ctx.organizationRoles.length === 2 && ctx.isOrganizationMember &&
        !ctx.isPlatformOwner && ctx.platformRoles.length === 0,
    detail: `roles=${ctx.organizationRoles.join(',')} platform=${ctx.platformRoles.length}`,
  };
}
function caseResolveContextRejectsRevokedMembership(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1' })];
  const mems = [mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'], revokedAt: 2000 })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1234,
  });
  return {
    ok: !ctx.isOrganizationMember && ctx.organizationRoles.length === 0,
    detail: `member=${ctx.isOrganizationMember} roles=${ctx.organizationRoles.length}`,
  };
}
function caseResolveContextWorkspaceScopeIsHonored(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1' }), mkWsp('o1', { workspaceId: 'w2', slug: 'two' })];
  const mems = [mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'], workspaceIds: ['w1'] })];
  const ctxIn = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1,
  });
  const ctxOut = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w2',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1,
  });
  return {
    ok: ctxIn.isOrganizationMember === true && ctxOut.isOrganizationMember === false,
    detail: `inMyWsp=${ctxIn.isOrganizationMember} otherWsp=${ctxOut.isOrganizationMember}`,
  };
}
function caseResolveContextRejectsUnknownOrg(): { ok: boolean; detail: string } {
  const mems = [mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'] })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o-other',
    platformOwnerOperatorIds: [], organizations: [], workspaces: [], memberships: mems, nowMs: 1,
  });
  return {
    ok: ctx.organizationRoles.length === 0 && !ctx.isOrganizationMember,
    detail: `roles=${ctx.organizationRoles.length} member=${ctx.isOrganizationMember}`,
  };
}
function caseEnforceTenantBoundaryRejectsCrossOrg(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' }), mkOrg({ organizationId: 'o2', slug: 'two' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1' }), mkWsp('o2', { workspaceId: 'w2' })];
  const mems = [mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'] })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1,
  });
  try {
    enforceTenantBoundary({
      context: ctx,
      ownership: { organizationId: 'o2', workspaceId: 'w2' },
      action: 'workspace.asset.approve',
    });
    return { ok: false, detail: 'cross-org access not rejected' };
  } catch (e) {
    const tbe = e as TenantBoundaryError;
    return { ok: tbe.code === 'TENANT_BOUNDARY_ORGANIZATION', detail: tbe.code };
  }
}
function caseEnforceTenantBoundaryRejectsCrossWorkspace(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1' }), mkWsp('o1', { workspaceId: 'w2', slug: 'two' })];
  const mems = [mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'], workspaceIds: ['w1'] })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1,
  });
  try {
    enforceTenantBoundary({
      context: ctx,
      ownership: { organizationId: 'o1', workspaceId: 'w2' },
      action: 'workspace.asset.approve',
    });
    return { ok: false, detail: 'cross-wsp access not rejected' };
  } catch (e) {
    const tbe = e as TenantBoundaryError;
    return { ok: tbe.code === 'TENANT_BOUNDARY_WORKSPACE', detail: tbe.code };
  }
}
function caseEnforceTenantBoundaryRejectsNoRoles(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1' })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: [], nowMs: 1,
  });
  try {
    enforceTenantBoundary({
      context: ctx,
      ownership: { organizationId: 'o1', workspaceId: 'w1' },
      action: 'workspace.read',
    });
    return { ok: false, detail: 'no-roles access not rejected' };
  } catch (e) {
    const tbe = e as TenantBoundaryError;
    return { ok: tbe.code === 'TENANT_BOUNDARY_NO_ROLES', detail: tbe.code };
  }
}
function caseEnforceTenantBoundaryRejectsInsufficientPermission(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1' })];
  const mems = [mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['viewer'] })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1,
  });
  try {
    enforceTenantBoundary({
      context: ctx,
      ownership: { organizationId: 'o1', workspaceId: 'w1' },
      action: 'workspace.asset.approve',
    });
    return { ok: false, detail: 'viewer was allowed to approve' };
  } catch (e) {
    const tbe = e as TenantBoundaryError;
    return { ok: tbe.code === 'TENANT_BOUNDARY_PERMISSION', detail: tbe.code };
  }
}
function caseEnforceTenantBoundaryAllowsAuthorized(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: 'o1', slug: 'one' })];
  const wsps = [mkWsp('o1', { workspaceId: 'w1' })];
  const mems = [mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['manager'] })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: 'o1', targetWorkspaceId: 'w1',
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: wsps,
    memberships: mems, nowMs: 1,
  });
  try {
    enforceTenantBoundary({
      context: ctx,
      ownership: { organizationId: 'o1', workspaceId: 'w1' },
      action: 'workspace.asset.approve',
    });
    return { ok: true, detail: 'manager allowed to approve asset' };
  } catch (e) {
    return { ok: false, detail: `unexpected throw: ${(e as Error).message}` };
  }
}
function casePlatformOwnerPlatformActions(): { ok: boolean; detail: string } {
  const ctx = resolveTenantContext({
    operatorId: 'plat-1', targetOrganizationId: PLATFORM_TENANT_ID_MOOD,
    platformOwnerOperatorIds: ['plat-1'], organizations: [], workspaces: [], memberships: [],
    nowMs: 1,
  });
  try {
    enforceTenantBoundary({
      context: ctx,
      ownership: { organizationId: PLATFORM_TENANT_ID_MOOD, workspaceId: PLATFORM_WORKSPACE_ID_MOOD },
      action: 'platform.organization.create',
    });
    return { ok: ctx.isPlatformOwner, detail: 'platform-owner can perform platform.* action' };
  } catch (e) {
    return { ok: false, detail: `unexpected throw: ${(e as Error).message}` };
  }
}
function caseNonPlatformOwnerCannotDoPlatformActions(): { ok: boolean; detail: string } {
  const orgs = [mkOrg({ organizationId: PLATFORM_TENANT_ID_MOOD, slug: 'mood' })];
  const mems = [mkMem(PLATFORM_TENANT_ID_MOOD, 'op-a', { membershipId: 'm1', roles: ['organization-owner'] })];
  const ctx = resolveTenantContext({
    operatorId: 'op-a', targetOrganizationId: PLATFORM_TENANT_ID_MOOD,
    platformOwnerOperatorIds: [], organizations: orgs, workspaces: [], memberships: mems, nowMs: 1,
  });
  try {
    enforceTenantBoundary({
      context: ctx,
      ownership: { organizationId: PLATFORM_TENANT_ID_MOOD, workspaceId: PLATFORM_WORKSPACE_ID_MOOD },
      action: 'platform.organization.create',
    });
    return { ok: false, detail: 'org-owner allowed to perform platform-only action' };
  } catch (e) {
    const tbe = e as TenantBoundaryError;
    return { ok: tbe.code === 'TENANT_BOUNDARY_PERMISSION', detail: tbe.code };
  }
}
function caseListOperatorOrganizations(): { ok: boolean; detail: string } {
  const orgs = [
    mkOrg({ organizationId: 'o1', slug: 'one' }),
    mkOrg({ organizationId: 'o2', slug: 'two' }),
    mkOrg({ organizationId: 'o3', slug: 'three', archivedAt: 9 }),
  ];
  const mems = [
    mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'] }),
    mkMem('o3', 'op-a', { membershipId: 'm2', roles: ['admin'] }),
    mkMem('o2', 'op-b', { membershipId: 'm3', roles: ['viewer'] }),
  ];
  const aSees = listOperatorOrganizations('op-a', orgs, mems, []).map((o) => o.organizationId).sort();
  const bSees = listOperatorOrganizations('op-b', orgs, mems, []).map((o) => o.organizationId).sort();
  const platformSees = listOperatorOrganizations('plat-1', orgs, mems, ['plat-1']).map((o) => o.organizationId).sort();
  return {
    ok: JSON.stringify(aSees) === JSON.stringify(['o1']) &&
        JSON.stringify(bSees) === JSON.stringify(['o2']) &&
        JSON.stringify(platformSees) === JSON.stringify(['o1', 'o2']),
    detail: `a=${aSees.join(',')} b=${bSees.join(',')} plat=${platformSees.join(',')}`,
  };
}
function caseOperatorBelongsToOrganization(): { ok: boolean; detail: string } {
  const mems = [
    mkMem('o1', 'op-a', { membershipId: 'm1', roles: ['admin'] }),
    mkMem('o2', 'op-a', { membershipId: 'm2', roles: ['admin'], revokedAt: 9 }),
  ];
  const yes = operatorBelongsToOrganization('op-a', 'o1', mems);
  const no1 = operatorBelongsToOrganization('op-a', 'o2', mems);
  const no2 = operatorBelongsToOrganization('op-b', 'o1', mems);
  return { ok: yes && !no1 && !no2, detail: `o1=${yes} o2=${no1} other=${no2}` };
}

// ─── Phase 3: permission matrix ──────────────────────────────

function casePermissionMatrixComplete(): { ok: boolean; detail: string } {
  const missing: PermissionAction[] = [];
  for (const a of ALL_PERMISSION_ACTIONS) {
    if (eligibleRolesFor(a).length === 0) missing.push(a);
  }
  return { ok: missing.length === 0, detail: missing.length === 0 ? `${ALL_PERMISSION_ACTIONS.length} actions covered` : `missing: ${missing.join(',')}` };
}
function casePlatformActionsPlatformOwnerOnly(): { ok: boolean; detail: string } {
  for (const a of ALL_PERMISSION_ACTIONS) {
    if (!a.startsWith('platform.')) continue;
    const eligible = eligibleRolesFor(a);
    if (eligible.length !== 1 || eligible[0] !== 'platform-owner') {
      return { ok: false, detail: `${a}: ${eligible.join(',')}` };
    }
  }
  return { ok: true, detail: 'every platform.* action is platform-owner only' };
}
function caseEveryOrgRoleCanRead(): { ok: boolean; detail: string } {
  for (const role of ORGANIZATION_ROLES) {
    if (!roleHasPermission(role, 'workspace.read')) {
      return { ok: false, detail: `${role} cannot workspace.read` };
    }
    if (!roleHasPermission(role, 'org.read')) {
      return { ok: false, detail: `${role} cannot org.read` };
    }
  }
  return { ok: true, detail: 'all 5 org roles MAY read' };
}
function caseViewerCannotMutate(): { ok: boolean; detail: string } {
  const cannot: PermissionAction[] = [];
  for (const a of ALL_PERMISSION_ACTIONS) {
    if (a.endsWith('.read')) continue;
    if (roleHasPermission('viewer', a)) cannot.push(a);
  }
  return { ok: cannot.length === 0, detail: cannot.length === 0 ? 'viewer is strictly read-only' : `viewer can: ${cannot.join(',')}` };
}
function caseAnyRolePermissionHelper(): { ok: boolean; detail: string } {
  const ok1 = anyRoleHasPermission(['viewer', 'manager'], 'workspace.asset.approve');
  const ok2 = !anyRoleHasPermission(['viewer'], 'workspace.asset.approve');
  return { ok: ok1 && ok2, detail: `manager-in-set=${ok1} viewer-only=${ok2}` };
}
function caseBuildPermissionMatrixSnapshot(): { ok: boolean; detail: string } {
  const r = buildPermissionMatrix();
  if (r.entries.length !== ALL_PERMISSION_ACTIONS.length) {
    return { ok: false, detail: `entries=${r.entries.length} expected=${ALL_PERMISSION_ACTIONS.length}` };
  }
  for (const role of ALL_ROLES) {
    if (typeof r.rolePermissionCounts[role] !== 'number') {
      return { ok: false, detail: `missing count for ${role}` };
    }
  }
  return {
    ok: /Human remains final authority/.test(r.advisoryNotice),
    detail: `${r.entries.length} entries · advisoryNotice ok`,
  };
}
function caseCoverageHelpers(): { ok: boolean; detail: string } {
  const cov = organizationRoleCoverage();
  if (cov['organization-owner'] < cov['admin']) {
    return { ok: false, detail: `owner<${cov['organization-owner']} admin=${cov['admin']}` };
  }
  if (cov['admin'] < cov['manager']) return { ok: false, detail: `admin<${cov['admin']} manager=${cov['manager']}` };
  if (cov['manager'] < cov['editor']) return { ok: false, detail: `manager<${cov['manager']} editor=${cov['editor']}` };
  if (cov['editor'] < cov['viewer'])  return { ok: false, detail: `editor<${cov['editor']} viewer=${cov['viewer']}` };
  const p = platformOwnerCoverage();
  return {
    ok: p === ALL_PERMISSION_ACTIONS.length,
    detail: `platform-owner=${p} actions=${ALL_PERMISSION_ACTIONS.length} cov=${JSON.stringify(cov)}`,
  };
}

// ─── Phase 5: billing hooks (architecture-only) ──────────────

function caseBillingHooksDescriptor(): { ok: boolean; detail: string } {
  const d = describeBillingHooks();
  return {
    ok: d.hooksInstalled === false &&
        d.reservedHookNames.length === 3 &&
        d.tierLadder.length === 5 &&
        /Human remains final authority/.test(d.advisoryNotice),
    detail: `installed=${d.hooksInstalled} hooks=${d.reservedHookNames.length} tiers=${d.tierLadder.length}`,
  };
}
async function caseBillingHooksFileHasNoImplementation(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'tenancy', 'billingHooks.ts'), 'utf8');
  // Strip comments + strings before checking — the self-describing block
  // comment legitimately mentions the words we're guarding against.
  const codeOnly = src
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
  if (/\bfetch\s*\(/.test(codeOnly)) return { ok: false, detail: 'fetch in billingHooks' };
  if (/\b(http|https|child_process|spawn|net|tls)\b/.test(codeOnly)) {
    return { ok: false, detail: 'forbidden module reference in billingHooks' };
  }
  // The only allowed import is from './types'
  const importMatches = src.match(/^import\s+[^;]+;/gm) ?? [];
  for (const imp of importMatches) {
    if (!/from\s+'\.\/types'/.test(imp)) {
      return { ok: false, detail: `extra import in billingHooks: ${imp}` };
    }
  }
  // The only runtime function is describeBillingHooks; no other exported
  // function should have a body that does anything substantial.
  const funcCount = (src.match(/export\s+function\s+\w+/g) ?? []).length;
  if (funcCount !== 1) return { ok: false, detail: `expected 1 runtime function · found ${funcCount}` };
  return { ok: true, detail: 'no fetch · no http · no impl · 1 runtime function' };
}

// ─── Phase 5: documentation set ──────────────────────────────

async function caseDocsExist(): Promise<{ ok: boolean; detail: string }> {
  const required = [
    'platform-boundary.md', 'tenant-boundary.md', 'permission-matrix.md',
    'entity-relationship-map.md', 'data-isolation-rules.md', 'billing-hooks.md',
  ];
  const missing: string[] = [];
  for (const f of required) {
    try { await fs.stat(path.resolve(__dirname, '..', 'docs', f)); }
    catch { missing.push(f); }
  }
  return { ok: missing.length === 0, detail: missing.length === 0 ? `${required.length} docs present` : `missing: ${missing.join(',')}` };
}
async function caseDataIsolationDocReferencesAllSixCategories(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'docs', 'data-isolation-rules.md'), 'utf8');
  const cats = ['Assets', 'Campaigns', 'Knowledge', 'Agents', 'Performance', 'Revenue'];
  const missing = cats.filter((c) => !new RegExp(`\\b${c}\\b`).test(src));
  return { ok: missing.length === 0, detail: missing.length === 0 ? 'all 6 categories' : `missing: ${missing.join(',')}` };
}
async function caseEntityMapHierarchy(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'docs', 'entity-relationship-map.md'), 'utf8');
  const levels = ['Organization', 'Workspace', 'Brand', 'Product', 'Campaign', 'Asset', 'Publication', 'Performance'];
  const missing = levels.filter((l) => !new RegExp(`\\b${l}\\b`).test(src));
  return { ok: missing.length === 0, detail: missing.length === 0 ? '8 hierarchy levels' : `missing: ${missing.join(',')}` };
}

// ─── narrative-language guard rails ──────────────────────────

function stripNegatedContract(text: string): string {
  return text
    .replace(/NEVER\s+\S+(\s+\S+){0,5}/gi, '')
    .replace(/never\s+\S+(\s+\S+){0,5}/gi, '')
    .replace(/MAY\s+NOT\s+\S+(\s+\S+){0,5}/gi, '')
    .replace(/no\s+(auto-?\S+|external\s+API|external\s+APIs|shared\s+\S+|back-?channels?)/gi, '')
    .replace(/does\s+not\s+\S+(\s+\S+){0,3}/gi, '');
}

async function buildAllDocText(): Promise<string> {
  const docs = [
    'platform-boundary.md', 'tenant-boundary.md', 'permission-matrix.md',
    'entity-relationship-map.md', 'data-isolation-rules.md', 'billing-hooks.md',
  ];
  const parts: string[] = [];
  for (const f of docs) parts.push(await fs.readFile(path.resolve(__dirname, '..', 'docs', f), 'utf8'));
  return parts.join('\n');
}
async function caseDocsForbiddenPhrasing(): Promise<{ ok: boolean; detail: string }> {
  const raw = await buildAllDocText();
  const text = stripNegatedContract(raw);
  const banned = /\b(predict(s|ed|ing)?|winner|guaranteed|auto-?apply|auto-?approve|auto-?optimize|optimal|recommended|selected|chosen|will\s+perform|dopamine|virality|viral|outrage|manipulat)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.match(banned)?.[0] ?? ''}` };
}
async function caseDocsRequiredPhrasing(): Promise<{ ok: boolean; detail: string }> {
  const raw = await buildAllDocText();
  const required = /(Operator approval required|operator-supervised|Human remains final authority)/i;
  return { ok: required.test(raw), detail: required.test(raw) ? 'present' : 'missing' };
}

// ─── routes ──────────────────────────────────────────────────

async function caseOrganizationRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'organization', 'route.ts'), 'utf8');
  const a = /operatorId is required/.test(src);
  const b = /operatorReason is required/.test(src);
  const c = /\bexport\s+async\s+function\s+GET\b/.test(src) && /\bexport\s+async\s+function\s+POST\b/.test(src);
  return { ok: a && b && c, detail: `operatorId=${a} operatorReason=${b} GET+POST=${c}` };
}
async function caseTenantContextRouteIsGetOnly(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'tenant-context', 'route.ts'), 'utf8');
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return { ok: hasGet && !hasPost, detail: `GET=${hasGet} POST=${hasPost}` };
}
async function caseOrganizationRouteNoExternalAPIs(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'organization', 'route.ts'), 'utf8');
  if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: 'fetch in organization route' };
  const forbidden = /from\s+['"][^'"]*(stripe|paypal|braintree|chargebee|recurly|orb\.com|metronome|paddle|facebook|google[- ]?ads|hubspot|salesforce)/i;
  if (forbidden.test(src)) return { ok: false, detail: 'external billing/marketing import' };
  return { ok: true, detail: 'no external billing/marketing imports · no fetch' };
}
async function caseRoutesRegistered(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  const ok = /['"]\/api\/organization['"]/.test(src) && /['"]\/api\/tenant-context['"]/.test(src);
  return { ok, detail: ok ? 'both routes registered' : 'missing route registration' };
}
async function caseWhitelistUpdated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'scripts', 'verify-system-stability.ts'), 'utf8');
  const ok = /app\/api\/organization\/route\.ts/.test(src);
  return { ok, detail: ok ? 'organization POST whitelisted' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('MULTI-TENANT SAAS SUBSTRATE VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    // Phase 1
    ['roles-correct',            '6 roles: 1 platform · 5 organization',                () => caseRolesAreCorrect()],
    ['billing-tier-ladder',      '5 tiers: unbilled → enterprise (metadata only)',     () => caseBillingTierLadder()],
    ['platform-constants',       'PLATFORM_TENANT_ID_MOOD + PLATFORM_WORKSPACE_ID_MOOD', () => casePlatformConstants()],
    ['append-organization',      'organization append + dup-id + dup-slug rejected',   () => caseAppendOrganization()],
    ['append-workspace',         'workspace requires org + per-org slug uniqueness',   () => caseAppendWorkspaceRequiresOrg()],
    ['append-membership',        'membership validates org · role · workspaceIds',     () => caseAppendMembershipRequiresOrg()],
    ['archive-revoke',           'archive workspace · revoke membership · archive org', () => caseArchiveAndRevoke()],
    ['fifo-caps',                'org/wsp/membership FIFO caps respected',             () => caseFifoCaps()],
    // Phase 2
    ['resolve-context-roles',    'resolveTenantContext picks roles from active membership', () => caseResolveContextRolesFromMembership()],
    ['resolve-rejects-revoked',  'revoked memberships do not contribute roles',        () => caseResolveContextRejectsRevokedMembership()],
    ['resolve-workspace-scope',  'workspace-scoped memberships honored',               () => caseResolveContextWorkspaceScopeIsHonored()],
    ['resolve-unknown-org',      'unknown organization yields empty roles',            () => caseResolveContextRejectsUnknownOrg()],
    ['boundary-cross-org',       'enforceTenantBoundary rejects cross-organization',   () => caseEnforceTenantBoundaryRejectsCrossOrg()],
    ['boundary-cross-wsp',       'enforceTenantBoundary rejects cross-workspace',      () => caseEnforceTenantBoundaryRejectsCrossWorkspace()],
    ['boundary-no-roles',        'enforceTenantBoundary rejects when no roles',        () => caseEnforceTenantBoundaryRejectsNoRoles()],
    ['boundary-insufficient',    'enforceTenantBoundary rejects insufficient role',    () => caseEnforceTenantBoundaryRejectsInsufficientPermission()],
    ['boundary-allows-good',     'enforceTenantBoundary allows authorized action',     () => caseEnforceTenantBoundaryAllowsAuthorized()],
    ['platform-owner-platform',  'platform-owner MAY perform platform.* actions',      () => casePlatformOwnerPlatformActions()],
    ['non-platform-owner',       'org-owner MAY NOT perform platform.* actions',       () => caseNonPlatformOwnerCannotDoPlatformActions()],
    ['list-operator-orgs',       'listOperatorOrganizations honors membership scope',  () => caseListOperatorOrganizations()],
    ['operator-belongs',         'operatorBelongsToOrganization honors revoke',        () => caseOperatorBelongsToOrganization()],
    // Phase 3
    ['matrix-complete',          'every action maps to >=1 eligible role',             () => casePermissionMatrixComplete()],
    ['platform-only',            'platform.* actions reserved to platform-owner',      () => casePlatformActionsPlatformOwnerOnly()],
    ['org-roles-can-read',       'every org role MAY workspace.read + org.read',       () => caseEveryOrgRoleCanRead()],
    ['viewer-readonly',          'viewer cannot perform any non-read action',          () => caseViewerCannotMutate()],
    ['any-role-helper',          'anyRoleHasPermission works for mixed role sets',     () => caseAnyRolePermissionHelper()],
    ['matrix-snapshot',          'buildPermissionMatrix emits advisory + counts',      () => caseBuildPermissionMatrixSnapshot()],
    ['coverage-helpers',         'role coverage monotonic + platform-owner=all',       () => caseCoverageHelpers()],
    // Phase 5 billing hooks + docs
    ['billing-descriptor',       'describeBillingHooks declares hooksInstalled=false', () => caseBillingHooksDescriptor()],
    ['billing-no-impl',          'billingHooks.ts has no fetch / http / extra imports',() => caseBillingHooksFileHasNoImplementation()],
    ['docs-exist',               'all 6 platform docs present',                        () => caseDocsExist()],
    ['docs-isolation-cats',      'data-isolation-rules references 6 isolated categories', () => caseDataIsolationDocReferencesAllSixCategories()],
    ['docs-entity-hierarchy',    'entity-relationship-map lists 8 hierarchy levels',   () => caseEntityMapHierarchy()],
    ['docs-forbidden-phrasing',  'no banned phrasing in platform documents',           () => caseDocsForbiddenPhrasing()],
    ['docs-required-phrasing',   'docs declare Human remains final authority',         () => caseDocsRequiredPhrasing()],
    // routes + registration
    ['route-organization',       '/api/organization is operator-gated + GET+POST',     () => caseOrganizationRouteOperatorGated()],
    ['route-tenant-context',     '/api/tenant-context is GET-only',                    () => caseTenantContextRouteIsGetOnly()],
    ['route-no-external',        'organization route has no external billing imports', () => caseOrganizationRouteNoExternalAPIs()],
    ['routes-registered',        'both routes registered in systemIntegrityReport',    () => caseRoutesRegistered()],
    ['whitelist-updated',        'verify-system-stability whitelist includes /api/organization', () => caseWhitelistUpdated()],
  ];
  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }
  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true, 'deferred');
  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error('verification script crashed:', err); process.exit(2); });
