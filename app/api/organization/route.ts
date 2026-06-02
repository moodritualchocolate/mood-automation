/**
 * /api/organization · operator-supervised tenancy CRUD.
 *
 * GET  — returns organization · workspace · membership records +
 *        permission matrix snapshot (read-only).
 * POST — operator-supervised.
 *        Actions:
 *          create-organization    · platform-owner only
 *          archive-organization   · platform-owner only
 *          set-billing-tier       · platform-owner only · metadata only
 *          create-workspace       · org-owner / admin
 *          archive-workspace      · org-owner / admin
 *          grant-membership       · org-owner / admin
 *          revoke-membership      · org-owner / admin
 *          grant-platform-owner   · platform-owner only
 *        Every write requires operatorId + operatorReason. The route
 *        NEVER auto-creates organizations, NEVER auto-grants
 *        memberships, NEVER charges, NEVER calls a billing provider,
 *        NEVER calls external APIs.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  appendMembership, appendOrganization, appendWorkspace,
  archiveOrganization, archiveWorkspace, createOrganizationMemoryStore,
  newMembershipId, newOrganizationId, newWorkspaceId, revokeMembership,
  setOrganizationBillingTier,
} from '@lib/tenancy/organizationMemory';
import {
  BILLING_TIERS, ORGANIZATION_ROLES, PLATFORM_TENANT_ID_MOOD,
  PLATFORM_WORKSPACE_ID_MOOD,
  type BillingTier, type MembershipRecord, type OrganizationRecord,
  type OrganizationRole, type WorkspaceRecord,
} from '@lib/tenancy/types';
import { buildPermissionMatrix } from '@lib/tenancy/permissionMatrix';
import { describeBillingHooks } from '@lib/tenancy/billingHooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── platform-owner registry ─────────────────────────────────
// The tenancy layer keeps the platform-owner roster as a static
// in-memory list seeded from MOOD_PLATFORM_OWNERS. The operator may
// expand the roster via the `grant-platform-owner` action; the roster
// is then persisted in a small memory slot on the global so the
// route restarts pick it up.

const g = globalThis as unknown as { __moodPlatformOwners?: Set<string> };

function platformOwners(): Set<string> {
  if (!g.__moodPlatformOwners) {
    const seed = (process.env.MOOD_PLATFORM_OWNERS ?? '')
      .split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    g.__moodPlatformOwners = new Set(seed);
  }
  return g.__moodPlatformOwners;
}

function isPlatformOwner(operatorId: string): boolean {
  return platformOwners().has(operatorId);
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const mem = await createOrganizationMemoryStore().read().catch(() => null);
  const matrix = buildPermissionMatrix();
  const billing = describeBillingHooks();
  return NextResponse.json({
    organizations: mem?.organizations ?? [],
    workspaces: mem?.workspaces ?? [],
    memberships: mem?.memberships ?? [],
    totalOrganizations: mem?.totalOrganizations ?? 0,
    totalWorkspaces: mem?.totalWorkspaces ?? 0,
    totalMemberships: mem?.totalMemberships ?? 0,
    platformOwnerCount: platformOwners().size,
    platformDefaults: {
      organizationId: PLATFORM_TENANT_ID_MOOD,
      workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
    },
    permissionMatrix: matrix,
    billingHooks: billing,
    advisoryNotice:
      'Tenancy · operator-supervised. The route NEVER auto-creates ' +
      'organizations, NEVER auto-grants memberships, NEVER charges, ' +
      'NEVER calls a billing provider, NEVER calls external APIs. ' +
      'Human remains final authority.',
  });
}

// ─── POST ────────────────────────────────────────────────────

type Action =
  | 'create-organization' | 'archive-organization' | 'set-billing-tier'
  | 'create-workspace' | 'archive-workspace'
  | 'grant-membership' | 'revoke-membership'
  | 'grant-platform-owner';

interface BaseBody {
  action: Action;
  operatorId: string;
  operatorReason: string;
}
interface CreateOrganizationBody extends BaseBody {
  action: 'create-organization';
  name: string;
  slug: string;
  billingTier?: BillingTier;
  operatorNote?: string;
}
interface ArchiveOrganizationBody extends BaseBody {
  action: 'archive-organization';
  organizationId: string;
  operatorNote?: string;
}
interface SetBillingTierBody extends BaseBody {
  action: 'set-billing-tier';
  organizationId: string;
  billingTier: BillingTier;
}
interface CreateWorkspaceBody extends BaseBody {
  action: 'create-workspace';
  organizationId: string;
  name: string;
  slug: string;
  operatorNote?: string;
}
interface ArchiveWorkspaceBody extends BaseBody {
  action: 'archive-workspace';
  workspaceId: string;
  operatorNote?: string;
}
interface GrantMembershipBody extends BaseBody {
  action: 'grant-membership';
  organizationId: string;
  memberId: string;
  displayName: string;
  roles: OrganizationRole[];
  workspaceIds?: string[];
  operatorNote?: string;
}
interface RevokeMembershipBody extends BaseBody {
  action: 'revoke-membership';
  membershipId: string;
  operatorNote?: string;
}
interface GrantPlatformOwnerBody extends BaseBody {
  action: 'grant-platform-owner';
  memberId: string;
}

type Body =
  | CreateOrganizationBody | ArchiveOrganizationBody | SetBillingTierBody
  | CreateWorkspaceBody | ArchiveWorkspaceBody
  | GrantMembershipBody | RevokeMembershipBody | GrantPlatformOwnerBody;

function requirePlatformOwner(operatorId: string): string | null {
  return isPlatformOwner(operatorId)
    ? null
    : 'operator MAY NOT perform this platform-level action — platform-owner role required';
}

function requireOrganizationAdminish(
  operatorId: string,
  organizationId: string,
  memberships: MembershipRecord[],
): string | null {
  if (isPlatformOwner(operatorId)) return null;
  const active = memberships.filter(
    (m) =>
      m.organizationId === organizationId &&
      m.memberId === operatorId &&
      !m.revokedAt,
  );
  for (const m of active) {
    if (m.roles.includes('organization-owner') || m.roles.includes('admin')) return null;
  }
  return 'operator MAY NOT perform this organization-level action — organization-owner or admin role required';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  body.operatorId = auth.ctx.user.userId;

  const store = createOrganizationMemoryStore();
  const state = await store.read();
  const at = Date.now();

  try {
    switch (body.action) {
      case 'create-organization': {
        const denial = requirePlatformOwner(body.operatorId);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        if (typeof body.name !== 'string' || body.name.length === 0)
          return NextResponse.json({ error: 'name is required' }, { status: 400 });
        if (typeof body.slug !== 'string' || !/^[a-z0-9-]+$/.test(body.slug))
          return NextResponse.json({ error: 'slug must match /^[a-z0-9-]+$/' }, { status: 400 });
        const tier: BillingTier = body.billingTier ?? 'unbilled';
        if (!BILLING_TIERS.includes(tier))
          return NextResponse.json({ error: 'unknown billing tier' }, { status: 400 });
        const record: OrganizationRecord = {
          organizationId: newOrganizationId(),
          name: body.name,
          slug: body.slug,
          billingTier: tier,
          createdAt: at,
          createdBy: body.operatorId,
          operatorNote: body.operatorNote,
        };
        const next = appendOrganization(state, record);
        await store.save(next);
        return NextResponse.json({
          ok: true,
          organization: record,
          advisoryNotice:
            'Operator-supervised — organization created. The route NEVER ' +
            'auto-grants memberships. Human remains final authority.',
        });
      }
      case 'archive-organization': {
        const denial = requirePlatformOwner(body.operatorId);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        const next = archiveOrganization(state, body.organizationId, at, body.operatorNote);
        await store.save(next);
        return NextResponse.json({
          ok: true,
          organizationId: body.organizationId,
          advisoryNotice:
            'Operator-supervised — organization archived. Human remains final authority.',
        });
      }
      case 'set-billing-tier': {
        const denial = requirePlatformOwner(body.operatorId);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        if (!BILLING_TIERS.includes(body.billingTier))
          return NextResponse.json({ error: 'unknown billing tier' }, { status: 400 });
        const next = setOrganizationBillingTier(state, body.organizationId, body.billingTier, at);
        await store.save(next);
        return NextResponse.json({
          ok: true,
          organizationId: body.organizationId,
          billingTier: body.billingTier,
          advisoryNotice:
            'Operator-supervised — billing tier metadata updated. The ' +
            'route NEVER charges, NEVER calls a billing provider. ' +
            'Human remains final authority.',
        });
      }
      case 'create-workspace': {
        const denial = requireOrganizationAdminish(
          body.operatorId, body.organizationId, state.memberships);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        if (typeof body.name !== 'string' || body.name.length === 0)
          return NextResponse.json({ error: 'name is required' }, { status: 400 });
        if (typeof body.slug !== 'string' || !/^[a-z0-9-]+$/.test(body.slug))
          return NextResponse.json({ error: 'slug must match /^[a-z0-9-]+$/' }, { status: 400 });
        const record: WorkspaceRecord = {
          workspaceId: newWorkspaceId(),
          organizationId: body.organizationId,
          name: body.name,
          slug: body.slug,
          createdAt: at,
          createdBy: body.operatorId,
          operatorNote: body.operatorNote,
        };
        const next = appendWorkspace(state, record);
        await store.save(next);
        return NextResponse.json({
          ok: true,
          workspace: record,
          advisoryNotice:
            'Operator-supervised — workspace created. Human remains final authority.',
        });
      }
      case 'archive-workspace': {
        const owning = state.workspaces.find((w) => w.workspaceId === body.workspaceId);
        if (!owning) return NextResponse.json({ error: 'workspace not found' }, { status: 404 });
        const denial = requireOrganizationAdminish(
          body.operatorId, owning.organizationId, state.memberships);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        const next = archiveWorkspace(state, body.workspaceId, at, body.operatorNote);
        await store.save(next);
        return NextResponse.json({
          ok: true,
          workspaceId: body.workspaceId,
          advisoryNotice:
            'Operator-supervised — workspace archived. Human remains final authority.',
        });
      }
      case 'grant-membership': {
        const denial = requireOrganizationAdminish(
          body.operatorId, body.organizationId, state.memberships);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        if (!Array.isArray(body.roles) || body.roles.length === 0)
          return NextResponse.json({ error: 'roles must be a non-empty array' }, { status: 400 });
        for (const r of body.roles) {
          if (!ORGANIZATION_ROLES.includes(r as OrganizationRole))
            return NextResponse.json({ error: `unknown organization role: ${r}` }, { status: 400 });
        }
        if (typeof body.memberId !== 'string' || body.memberId.length === 0)
          return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
        if (typeof body.displayName !== 'string' || body.displayName.length === 0)
          return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
        const record: MembershipRecord = {
          membershipId: newMembershipId(),
          organizationId: body.organizationId,
          memberId: body.memberId,
          displayName: body.displayName,
          roles: body.roles,
          workspaceIds: body.workspaceIds,
          createdAt: at,
          grantedBy: body.operatorId,
          operatorNote: body.operatorNote,
        };
        const next = appendMembership(state, record);
        await store.save(next);
        return NextResponse.json({
          ok: true,
          membership: record,
          advisoryNotice:
            'Operator-supervised — membership granted. Human remains final authority.',
        });
      }
      case 'revoke-membership': {
        const owning = state.memberships.find((m) => m.membershipId === body.membershipId);
        if (!owning) return NextResponse.json({ error: 'membership not found' }, { status: 404 });
        const denial = requireOrganizationAdminish(
          body.operatorId, owning.organizationId, state.memberships);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        const next = revokeMembership(state, body.membershipId, at, body.operatorNote);
        await store.save(next);
        return NextResponse.json({
          ok: true,
          membershipId: body.membershipId,
          advisoryNotice:
            'Operator-supervised — membership revoked. Human remains final authority.',
        });
      }
      case 'grant-platform-owner': {
        const denial = requirePlatformOwner(body.operatorId);
        if (denial) return NextResponse.json({ error: denial }, { status: 403 });
        if (typeof body.memberId !== 'string' || body.memberId.length === 0)
          return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
        platformOwners().add(body.memberId);
        return NextResponse.json({
          ok: true,
          memberId: body.memberId,
          platformOwnerCount: platformOwners().size,
          advisoryNotice:
            'Operator-supervised — platform-owner role granted to memberId. ' +
            'Human remains final authority.',
        });
      }
      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }
  } catch (err) {
    const msg = (err as Error).message;
    const status = /not found/.test(msg) ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
