/**
 * POST /api/auth/bootstrap
 *
 * One-shot bootstrap. Creates the MOOD bootstrap user from
 * env vars (MOOD_BOOTSTRAP_EMAIL, MOOD_BOOTSTRAP_PASSWORD) and
 * stamps a `organization-owner` membership inside `org-mood`.
 *
 * Idempotent:
 *   - if the user already exists by email → user is reused
 *   - if the membership already exists → reused
 *   - re-running produces no diff
 *
 * Refuses to run when either env var is missing. NEVER recreates
 * a deleted user. NEVER overwrites an existing password.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendUser, createUserMemoryStore, findUserByEmail, newUserId,
  normalizeEmail,
} from '@lib/auth/userMemory';
import { hashPassword } from '@lib/auth/passwordHash';
import {
  appendMembership, appendOrganization, appendWorkspace,
  createOrganizationMemoryStore, newMembershipId,
} from '@lib/tenancy/organizationMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { toSafeUser, type UserRecord } from '@lib/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BootstrapBody {
  /** Operator audit string · always required. */
  operatorReason: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: BootstrapBody;
  try { body = await req.json() as BootstrapBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const email = process.env.MOOD_BOOTSTRAP_EMAIL;
  const password = process.env.MOOD_BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({
      error: 'MOOD_BOOTSTRAP_EMAIL and MOOD_BOOTSTRAP_PASSWORD must be set',
    }, { status: 412 });
  }

  const at = Date.now();
  const userStore = createUserMemoryStore();
  let userState = await userStore.read();
  const normalized = normalizeEmail(email);

  // Idempotent: if the user exists, reuse.
  let user = findUserByEmail(userState, normalized);
  let userCreated = false;
  if (!user) {
    const { passwordHash, passwordSalt } = hashPassword(password);
    const userId = newUserId();
    const record: UserRecord = {
      userId, email: normalized, displayName: 'MOOD Bootstrap Owner',
      passwordHash, passwordSalt,
      createdBy: userId, createdAt: at,
      failedLoginCount: 0, lockedUntil: 0,
      operatorNote: 'bootstrap user · seeded from MOOD_BOOTSTRAP_* env vars',
    };
    userState = appendUser(userState, record);
    await userStore.save(userState);
    user = record;
    userCreated = true;
  }

  // Idempotent org-mood + wsp-mood-default + organization-owner membership.
  const orgStore = createOrganizationMemoryStore();
  let orgState = await orgStore.read();
  if (!orgState.organizations.some((o) => o.organizationId === PLATFORM_TENANT_ID_MOOD)) {
    orgState = appendOrganization(orgState, {
      organizationId: PLATFORM_TENANT_ID_MOOD, name: 'MOOD', slug: 'mood',
      billingTier: 'unbilled', createdAt: at, createdBy: user.userId,
      operatorNote: 'bootstrap · auto-created MOOD organization',
    });
  }
  if (!orgState.workspaces.some((w) => w.workspaceId === PLATFORM_WORKSPACE_ID_MOOD)) {
    orgState = appendWorkspace(orgState, {
      workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
      organizationId: PLATFORM_TENANT_ID_MOOD,
      name: 'MOOD · Default Workspace', slug: 'default',
      createdAt: at, createdBy: user.userId,
      operatorNote: 'bootstrap · auto-created default workspace',
    });
  }
  const existingMembership = orgState.memberships.find(
    (m) =>
      m.organizationId === PLATFORM_TENANT_ID_MOOD &&
      m.memberId === user!.userId &&
      m.roles.includes('organization-owner') &&
      !m.revokedAt,
  );
  let membershipCreated = false;
  if (!existingMembership) {
    orgState = appendMembership(orgState, {
      membershipId: newMembershipId(),
      organizationId: PLATFORM_TENANT_ID_MOOD,
      memberId: user.userId,
      displayName: user.displayName,
      roles: ['organization-owner'],
      createdAt: at,
      grantedBy: user.userId,
      operatorNote: 'bootstrap membership · seeded by /api/auth/bootstrap',
    });
    await orgStore.save(orgState);
    membershipCreated = true;
  }

  return NextResponse.json({
    ok: true,
    user: toSafeUser(user),
    userCreated, membershipCreated,
    organizationId: PLATFORM_TENANT_ID_MOOD,
    advisoryNotice:
      `Operator-supervised — bootstrap ` +
      `${userCreated ? 'created user' : 'reused existing user'}` +
      `${membershipCreated ? ' + granted organization-owner membership' : ' (membership already present)'}. ` +
      'Idempotent. Human remains final authority.',
  });
}
