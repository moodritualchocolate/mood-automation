/**
 * scripts/verify-authentication.ts
 *
 * Authentication-phase verifier. Drives the actual route handlers
 * against a temp memory dir and asserts password / session / route
 * behavior matches the architecture plan.
 *
 * Run: npx tsx scripts/verify-authentication.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  appendUser, createInitialUserMemory, findUserByEmail, newUserId,
  recordFailedLogin, resetFailedLogin,
  type UserMemoryState,
} from '../lib/auth/userMemory';
import {
  appendSession, createInitialSessionMemory, findLiveSession,
  hashSessionToken, newSessionId, newSessionToken,
  revokeSession, touchSession,
  type SessionMemoryState,
} from '../lib/auth/sessionMemory';
import {
  SESSION_ABSOLUTE_TTL_MS, SESSION_COOKIE_MAX_AGE_S,
  SESSION_SLIDING_HALFLIFE_MS, SESSION_COOKIE_NAME,
} from '../lib/auth/cookie';
import { hashPassword, verifyPassword } from '../lib/auth/passwordHash';
import { buildSessionCookieValue } from '../lib/auth/resolveSession';
import type { UserRecord } from '../lib/auth/types';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const TEST_PASSWORD = 'long-enough-test-password-12345';

function mkUser(over: Partial<UserRecord> = {}): UserRecord {
  const { passwordHash, passwordSalt } = hashPassword(TEST_PASSWORD);
  return {
    userId: newUserId(),
    email: `${Math.random().toString(36).slice(2)}@test.local`,
    displayName: 'Test User',
    passwordHash, passwordSalt,
    createdBy: 'self', createdAt: Date.now(),
    failedLoginCount: 0, lockedUntil: 0,
    ...over,
  };
}

function resetGlobals(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  for (const k of [
    '__moodUserMemory', '__moodSessionMemory', '__moodWorkspace',
    '__moodOrganizationMemory', '__moodWorkspaceActivation', '__moodWorkflowMemory',
  ]) g[k] = undefined;
}

async function withTempDir<T>(fn: (tmp: string) => Promise<T>): Promise<T> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'verify-auth-'));
  try {
    process.env.MOOD_MEMORY_DIR = tmp;
    resetGlobals();
    return await fn(tmp);
  } finally {
    try { await fs.rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
    delete process.env.MOOD_MEMORY_DIR;
    resetGlobals();
  }
}

// ─── pure-transform cases ────────────────────────────────────

function caseUserAppendDupEmail(): { ok: boolean; detail: string } {
  let state = createInitialUserMemory();
  state = appendUser(state, mkUser({ email: 'a@b.com' }));
  try {
    state = appendUser(state, mkUser({ email: 'A@B.com' }));
    return { ok: false, detail: 'duplicate email accepted' };
  } catch (e) {
    return { ok: /already in use/.test((e as Error).message), detail: (e as Error).message };
  }
}

function casePasswordHashRejectsWeak(): { ok: boolean; detail: string } {
  try {
    hashPassword('short');
    return { ok: false, detail: 'short password accepted' };
  } catch (e) {
    return { ok: /at least 12 characters/.test((e as Error).message), detail: (e as Error).message };
  }
}

function casePasswordHashRoundtrip(): { ok: boolean; detail: string } {
  const { passwordHash, passwordSalt } = hashPassword(TEST_PASSWORD);
  const good = verifyPassword(TEST_PASSWORD, passwordHash, passwordSalt);
  const bad  = verifyPassword('wrong-password-xx', passwordHash, passwordSalt);
  return { ok: good && !bad, detail: `good=${good} bad=${bad}` };
}

function casePasswordHashIsNotReversible(): { ok: boolean; detail: string } {
  const { passwordHash, passwordSalt } = hashPassword(TEST_PASSWORD);
  const blob = JSON.stringify({ passwordHash, passwordSalt });
  return {
    ok: !blob.includes(TEST_PASSWORD),
    detail: blob.includes(TEST_PASSWORD) ? 'PLAIN PASSWORD ON DISK' : 'hash blob does not contain plaintext',
  };
}

function caseSessionRoundtrip(): { ok: boolean; detail: string } {
  let state = createInitialSessionMemory();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  state = appendSession(state, { sessionId, userId: 'user-x', rawToken, at: 1000 });
  const live = findLiveSession(state, sessionId, rawToken, 2000);
  const liveBadToken = findLiveSession(state, sessionId, 'wrong-token', 2000);
  return {
    ok: !!live && !liveBadToken,
    detail: `live=${!!live} liveBadToken=${!!liveBadToken}`,
  };
}

function caseSessionRevokedRejected(): { ok: boolean; detail: string } {
  let state = createInitialSessionMemory();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  state = appendSession(state, { sessionId, userId: 'user-x', rawToken, at: 1000 });
  state = revokeSession(state, sessionId, 1500, 'logout');
  const live = findLiveSession(state, sessionId, rawToken, 2000);
  return { ok: !live, detail: `live=${!!live} (should be null)` };
}

function caseSessionExpiredRejected(): { ok: boolean; detail: string } {
  let state = createInitialSessionMemory();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  state = appendSession(state, { sessionId, userId: 'user-x', rawToken, at: 1000 });
  const at = 1000 + SESSION_COOKIE_MAX_AGE_S * 1000 + 1;
  const live = findLiveSession(state, sessionId, rawToken, at);
  return { ok: !live, detail: `live=${!!live} (should be null past expiry)` };
}

function caseSlidingExpiryOnlyAfterHalflife(): { ok: boolean; detail: string } {
  let state = createInitialSessionMemory();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  const t0 = 1000;
  state = appendSession(state, { sessionId, userId: 'user-x', rawToken, at: t0 });
  const initial = state.sessions[0].expiresAt;
  // touch before halflife — expiresAt should NOT extend
  state = touchSession(state, sessionId, t0 + SESSION_SLIDING_HALFLIFE_MS - 1);
  const after1 = state.sessions[0].expiresAt;
  // touch after halflife — expiresAt should extend
  state = touchSession(state, sessionId, t0 + SESSION_SLIDING_HALFLIFE_MS + 1000);
  const after2 = state.sessions[0].expiresAt;
  return {
    ok: after1 === initial && after2 > after1,
    detail: `initial=${initial} after1=${after1} after2=${after2}`,
  };
}

function caseLoginFailureIncrements(): { ok: boolean; detail: string } {
  let state = createInitialUserMemory();
  const user = mkUser();
  state = appendUser(state, user);
  state = recordFailedLogin(state, user.userId, 1000, 60_000);
  state = recordFailedLogin(state, user.userId, 1100, 60_000);
  return {
    ok: state.users[0].failedLoginCount === 2 && state.users[0].lockedUntil === 0,
    detail: `count=${state.users[0].failedLoginCount} locked=${state.users[0].lockedUntil}`,
  };
}

function caseLoginLockoutAfterFiveFailures(): { ok: boolean; detail: string } {
  let state = createInitialUserMemory();
  const user = mkUser();
  state = appendUser(state, user);
  for (let i = 0; i < 5; i++) state = recordFailedLogin(state, user.userId, 1000 + i, 60_000);
  return {
    ok: state.users[0].failedLoginCount === 5 && state.users[0].lockedUntil > 0,
    detail: `count=${state.users[0].failedLoginCount} lockedUntil=${state.users[0].lockedUntil}`,
  };
}

function caseLoginSuccessClearsLockout(): { ok: boolean; detail: string } {
  let state = createInitialUserMemory();
  const user = mkUser();
  state = appendUser(state, user);
  for (let i = 0; i < 5; i++) state = recordFailedLogin(state, user.userId, 1000 + i, 60_000);
  state = resetFailedLogin(state, user.userId);
  return {
    ok: state.users[0].failedLoginCount === 0 && state.users[0].lockedUntil === 0,
    detail: `count=${state.users[0].failedLoginCount} locked=${state.users[0].lockedUntil}`,
  };
}

function caseAbsoluteCapHonored(): { ok: boolean; detail: string } {
  let state = createInitialSessionMemory();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  const t0 = 1000;
  state = appendSession(state, { sessionId, userId: 'user-x', rawToken, at: t0 });
  // Touch far in the future — expiresAt must cap at t0 + ABSOLUTE_TTL.
  const future = t0 + SESSION_ABSOLUTE_TTL_MS - 1000;
  state = touchSession(state, sessionId, future);
  const cap = t0 + SESSION_ABSOLUTE_TTL_MS;
  return {
    ok: state.sessions[0].expiresAt <= cap,
    detail: `expiresAt=${state.sessions[0].expiresAt} cap=${cap}`,
  };
}

function caseTokenHashSaltedBySessionId(): { ok: boolean; detail: string } {
  const raw = 'sample-raw-token';
  const a = hashSessionToken('sess-a', raw);
  const b = hashSessionToken('sess-b', raw);
  return { ok: a !== b, detail: `hash_sess-a=${a.slice(0,8)} hash_sess-b=${b.slice(0,8)}` };
}

// ─── route-driven cases ──────────────────────────────────────

async function callJson<T>(
  handler: (req: Request) => Promise<Response>,
  url: string, init?: RequestInit,
): Promise<{ status: number; setCookie?: string | null; body: T }> {
  const res = await handler(new Request(url, init));
  const status = res.status;
  const setCookie = res.headers.get('set-cookie');
  const body = await res.json() as T;
  return { status, setCookie, body };
}

function extractSessionCookie(setCookie: string | null | undefined): string | null {
  if (!setCookie) return null;
  // The header may contain multiple cookies separated by commas; we
  // want the one starting with `mood_session=`.
  for (const part of setCookie.split(/,\s*(?=\w+=)/)) {
    if (part.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      const eq = part.indexOf('=');
      const sep = part.indexOf(';', eq);
      return part.slice(0, sep === -1 ? undefined : sep);
    }
  }
  return null;
}

async function caseRegisterRouteRoundtrip(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const route = await import('../app/api/auth/register/route');
    const r = await callJson<{ ok?: boolean; user?: { email: string } }>(
      route.POST as never, 'http://localhost/api/auth/register',
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'fresh@test.local', displayName: 'Fresh',
          password: TEST_PASSWORD, operatorReason: 'register',
        }),
      },
    );
    const ok = r.status === 200 && r.body.ok === true &&
               r.body.user?.email === 'fresh@test.local' &&
               !!extractSessionCookie(r.setCookie);
    return { ok, detail: `status=${r.status} email=${r.body.user?.email} cookieSet=${!!extractSessionCookie(r.setCookie)}` };
  });
}

async function caseLoginRouteRoundtrip(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const register = await import('../app/api/auth/register/route');
    const login = await import('../app/api/auth/login/route');
    await callJson(register.POST as never, 'http://localhost/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login@test.local', displayName: 'L', password: TEST_PASSWORD, operatorReason: 'reg',
      }),
    });
    // Wrong password.
    const bad = await callJson<{ error?: string }>(
      login.POST as never, 'http://localhost/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'login@test.local', password: 'wrong', operatorReason: 'r' }),
      },
    );
    const good = await callJson<{ ok?: boolean }>(
      login.POST as never, 'http://localhost/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'login@test.local', password: TEST_PASSWORD, operatorReason: 'r' }),
      },
    );
    const ok = bad.status === 401 && good.status === 200 && good.body.ok === true &&
               !!extractSessionCookie(good.setCookie);
    return { ok, detail: `badStatus=${bad.status} goodStatus=${good.status} cookieSet=${!!extractSessionCookie(good.setCookie)}` };
  });
}

async function caseMeRoute401WithoutCookie(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const me = await import('../app/api/auth/me/route');
    const r = await callJson<{ user: null | object }>(
      me.GET as never, 'http://localhost/api/auth/me', { method: 'GET' },
    );
    return { ok: r.status === 401 && r.body.user === null, detail: `status=${r.status} user=${JSON.stringify(r.body.user)}` };
  });
}

async function caseMeRoute200WithValidCookie(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const register = await import('../app/api/auth/register/route');
    const me = await import('../app/api/auth/me/route');
    const reg = await callJson<{ user: { userId: string } }>(
      register.POST as never, 'http://localhost/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'me@test.local', displayName: 'M', password: TEST_PASSWORD, operatorReason: 'r',
        }),
      },
    );
    const cookie = extractSessionCookie(reg.setCookie);
    if (!cookie) return { ok: false, detail: 'no cookie' };
    const r = await callJson<{ user: { userId: string } | null }>(
      me.GET as never, 'http://localhost/api/auth/me', {
        method: 'GET', headers: { Cookie: cookie },
      },
    );
    return { ok: r.status === 200 && r.body.user?.userId === reg.body.user.userId,
             detail: `status=${r.status} returnedUserId=${r.body.user?.userId}` };
  });
}

async function caseLogoutRevokesSession(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const register = await import('../app/api/auth/register/route');
    const logout = await import('../app/api/auth/logout/route');
    const me = await import('../app/api/auth/me/route');
    const reg = await callJson(
      register.POST as never, 'http://localhost/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'logout@test.local', displayName: 'L', password: TEST_PASSWORD, operatorReason: 'r',
        }),
      },
    );
    const cookie = extractSessionCookie(reg.setCookie)!;
    await callJson(logout.POST as never, 'http://localhost/api/auth/logout', {
      method: 'POST', headers: { Cookie: cookie },
    });
    const after = await callJson<{ user: null | object }>(
      me.GET as never, 'http://localhost/api/auth/me', {
        method: 'GET', headers: { Cookie: cookie },
      },
    );
    return { ok: after.status === 401 && after.body.user === null,
             detail: `afterLogoutStatus=${after.status} user=${JSON.stringify(after.body.user)}` };
  });
}

async function caseProtectedRoute401WithoutSession(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const brand = await import('../app/api/brand/route');
    const r = await callJson<{ error?: string }>(
      brand.POST as never, 'http://localhost/api/brand', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create', operatorId: 'forged-operator', operatorReason: 'no-session',
          name: 'should-be-rejected',
        }),
      },
    );
    return { ok: r.status === 401 && /authentication required/i.test(r.body.error ?? ''),
             detail: `status=${r.status} error=${r.body.error}` };
  });
}

async function caseProtectedRouteUsesSessionUserId(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const register = await import('../app/api/auth/register/route');
    const brand = await import('../app/api/brand/route');
    const reg = await callJson<{ user: { userId: string } }>(
      register.POST as never, 'http://localhost/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'authed@test.local', displayName: 'A', password: TEST_PASSWORD, operatorReason: 'r',
        }),
      },
    );
    const cookie = extractSessionCookie(reg.setCookie)!;
    const userId = reg.body.user.userId;
    const r = await callJson<{ brand?: { operatorId: string } }>(
      brand.POST as never, 'http://localhost/api/brand', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          action: 'create', operatorId: 'forged-different-operator',
          operatorReason: 'use session id', name: 'session-stamped-brand',
        }),
      },
    );
    // Route stamps the BrandRecord.operatorId with the session user id,
    // not with the forged body field.
    return { ok: r.body.brand?.operatorId === userId,
             detail: `stamped=${r.body.brand?.operatorId} expected=${userId}` };
  });
}

async function caseBootstrapIdempotent(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    process.env.MOOD_BOOTSTRAP_EMAIL = 'boot@test.local';
    process.env.MOOD_BOOTSTRAP_PASSWORD = TEST_PASSWORD;
    try {
      const bootstrap = await import('../app/api/auth/bootstrap/route');
      const r1 = await callJson<{ userCreated: boolean; membershipCreated: boolean }>(
        bootstrap.POST as never, 'http://localhost/api/auth/bootstrap', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operatorReason: 'init' }),
        },
      );
      const r2 = await callJson<{ userCreated: boolean; membershipCreated: boolean }>(
        bootstrap.POST as never, 'http://localhost/api/auth/bootstrap', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operatorReason: 'rerun' }),
        },
      );
      return {
        ok: r1.body.userCreated === true && r1.body.membershipCreated === true &&
            r2.body.userCreated === false && r2.body.membershipCreated === false,
        detail: `first=${JSON.stringify(r1.body)} second=${JSON.stringify(r2.body)}`,
      };
    } finally {
      delete process.env.MOOD_BOOTSTRAP_EMAIL;
      delete process.env.MOOD_BOOTSTRAP_PASSWORD;
    }
  });
}

async function caseBootstrapRefusesWithoutEnvVars(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const prevEmail = process.env.MOOD_BOOTSTRAP_EMAIL;
    const prevPass  = process.env.MOOD_BOOTSTRAP_PASSWORD;
    delete process.env.MOOD_BOOTSTRAP_EMAIL;
    delete process.env.MOOD_BOOTSTRAP_PASSWORD;
    try {
      const bootstrap = await import('../app/api/auth/bootstrap/route');
      const r = await callJson<{ error?: string }>(
        bootstrap.POST as never, 'http://localhost/api/auth/bootstrap', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operatorReason: 'init' }),
        },
      );
      return { ok: r.status === 412 && /MOOD_BOOTSTRAP/.test(r.body.error ?? ''),
               detail: `status=${r.status} error=${r.body.error}` };
    } finally {
      if (prevEmail !== undefined) process.env.MOOD_BOOTSTRAP_EMAIL = prevEmail;
      if (prevPass !== undefined) process.env.MOOD_BOOTSTRAP_PASSWORD = prevPass;
    }
  });
}

async function caseRegisterDoesNotGrantMembership(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const register = await import('../app/api/auth/register/route');
    await callJson(
      register.POST as never, 'http://localhost/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'membership@test.local', displayName: 'M', password: TEST_PASSWORD, operatorReason: 'r',
        }),
      },
    );
    // Verify org memory has no membership for the new user (registration
    // must never auto-grant a membership in any organization).
    const orgStore = await import('../lib/tenancy/organizationMemory');
    const state = await orgStore.createOrganizationMemoryStore().read();
    const hasMembership = state.memberships.length > 0;
    return { ok: !hasMembership, detail: `memberships=${state.memberships.length} (must be 0)` };
  });
}

async function caseCookieFlagsHttpOnlyAndSameSite(): Promise<{ ok: boolean; detail: string }> {
  return withTempDir(async () => {
    const register = await import('../app/api/auth/register/route');
    const r = await callJson(
      register.POST as never, 'http://localhost/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'flags@test.local', displayName: 'F', password: TEST_PASSWORD, operatorReason: 'r',
        }),
      },
    );
    const raw = r.setCookie ?? '';
    const ok = /httponly/i.test(raw) && /samesite=lax/i.test(raw) && /path=\//i.test(raw);
    return { ok, detail: `setCookie=${raw.slice(0, 200)}` };
  });
}

// ─── tenant-scoped GET protection · 48 routes ────────────────

/** All protected GET routes — each gated by requireTenantSession. */
const PROTECTED_TENANT_GET_ROUTES: Array<{
  path: string; module: string;
}> = [
  // Originally protected in the prior P0 commit (8):
  { path: '/api/brand',                module: '../app/api/brand/route' },
  { path: '/api/product',              module: '../app/api/product/route' },
  { path: '/api/workspace',            module: '../app/api/workspace/route' },
  { path: '/api/workspace-context',    module: '../app/api/workspace-context/route' },
  { path: '/api/executive-dashboard',  module: '../app/api/executive-dashboard/route' },
  { path: '/api/dashboard',            module: '../app/api/dashboard/route' },
  { path: '/api/growth',               module: '../app/api/growth/route' },
  { path: '/api/workflows',            module: '../app/api/workflows/route' },
  // Added in this Phase-1 sweep (40):
  { path: '/api/agent',                              module: '../app/api/agent/route' },
  { path: '/api/asset-composer',                     module: '../app/api/asset-composer/route' },
  { path: '/api/asset-registry',                     module: '../app/api/asset-registry/route' },
  { path: '/api/attribution',                        module: '../app/api/attribution/route' },
  { path: '/api/business-dashboard',                 module: '../app/api/business-dashboard/route' },
  { path: '/api/campaign-evolution',                 module: '../app/api/campaign-evolution/route' },
  { path: '/api/campaign-planner',                   module: '../app/api/campaign-planner/route' },
  { path: '/api/creative-director',                  module: '../app/api/creative-director/route' },
  { path: '/api/creative-dna-map',                   module: '../app/api/creative-dna-map/route' },
  { path: '/api/creative-drift',                     module: '../app/api/creative-drift/route' },
  { path: '/api/creative-fatigue',                   module: '../app/api/creative-fatigue/route' },
  { path: '/api/customer-journey',                   module: '../app/api/customer-journey/route' },
  { path: '/api/executive-governance',               module: '../app/api/executive-governance/route' },
  { path: '/api/generation-queue',                   module: '../app/api/generation-queue/route' },
  { path: '/api/generation-result',                  module: '../app/api/generation-result/route' },
  { path: '/api/knowledge',                          module: '../app/api/knowledge/route' },
  { path: '/api/learning-bridge',                    module: '../app/api/learning-bridge/route' },
  { path: '/api/memory',                             module: '../app/api/memory/route' },
  { path: '/api/memory/atmosphere',                  module: '../app/api/memory/atmosphere/route' },
  { path: '/api/narrative-dna',                      module: '../app/api/narrative-dna/route' },
  { path: '/api/onboarding',                         module: '../app/api/onboarding/route' },
  { path: '/api/operator-calibration-reconciliation',module: '../app/api/operator-calibration-reconciliation/route' },
  { path: '/api/operator-confidence-preference',     module: '../app/api/operator-confidence-preference/route' },
  { path: '/api/operator-creative-trial',            module: '../app/api/operator-creative-trial/route' },
  { path: '/api/organization',                       module: '../app/api/organization/route' },
  { path: '/api/performance',                        module: '../app/api/performance/route' },
  { path: '/api/performance-analyzer',               module: '../app/api/performance-analyzer/route' },
  { path: '/api/publication-registry',               module: '../app/api/publication-registry/route' },
  { path: '/api/revenue-bridge',                     module: '../app/api/revenue-bridge/route' },
  { path: '/api/scene-architect',                    module: '../app/api/scene-architect/route' },
  { path: '/api/story-architect',                    module: '../app/api/story-architect/route' },
  { path: '/api/strategic-outcome',                  module: '../app/api/strategic-outcome/route' },
  { path: '/api/supervised-learning-loop',           module: '../app/api/supervised-learning-loop/route' },
  { path: '/api/task',                               module: '../app/api/task/route' },
  { path: '/api/team',                               module: '../app/api/team/route' },
  { path: '/api/tenant-context',                     module: '../app/api/tenant-context/route' },
  { path: '/api/trial-outcome',                      module: '../app/api/trial-outcome/route' },
  { path: '/api/visual-dna',                         module: '../app/api/visual-dna/route' },
  { path: '/api/workspace-activation',               module: '../app/api/workspace-activation/route' },
  { path: '/api/workspace-quick-start',              module: '../app/api/workspace-quick-start/route' },
];

/** All protected POST routes — each gated by requireSession (and some by
 *  requireTenantSession). Phase-1 sweep added the 27 long-tail POSTs. */
const PROTECTED_POST_ROUTES: Array<{ path: string; module: string }> = [
  { path: '/api/banner/[id]/export',           module: '../app/api/banner/[id]/export/route' },
  { path: '/api/banner/[id]/signal',           module: '../app/api/banner/[id]/signal/route' },
  { path: '/api/banner/[id]/simulate-signals', module: '../app/api/banner/[id]/simulate-signals/route' },
  { path: '/api/branch-activation',            module: '../app/api/branch-activation/route' },
  { path: '/api/cognition/approve',            module: '../app/api/cognition/approve/route' },
  { path: '/api/cognition/consider',           module: '../app/api/cognition/consider/route' },
  { path: '/api/cognition/defer',              module: '../app/api/cognition/defer/route' },
  { path: '/api/cognition/draft',              module: '../app/api/cognition/draft/route' },
  { path: '/api/cognition/notice',             module: '../app/api/cognition/notice/route' },
  { path: '/api/cognition/observe',            module: '../app/api/cognition/observe/route' },
  { path: '/api/cognition/permit',             module: '../app/api/cognition/permit/route' },
  { path: '/api/cognition/prepare',            module: '../app/api/cognition/prepare/route' },
  { path: '/api/cognition/propose',            module: '../app/api/cognition/propose/route' },
  { path: '/api/cognition/rest',               module: '../app/api/cognition/rest/route' },
  { path: '/api/cognition/restrain',           module: '../app/api/cognition/restrain/route' },
  { path: '/api/cognition/review',             module: '../app/api/cognition/review/route' },
  { path: '/api/cognition/revise',             module: '../app/api/cognition/revise/route' },
  { path: '/api/generate',                     module: '../app/api/generate/route' },
  { path: '/api/generation-queue',             module: '../app/api/generation-queue/route' },
  { path: '/api/generation-result',            module: '../app/api/generation-result/route' },
  { path: '/api/ingest',                       module: '../app/api/ingest/route' },
  { path: '/api/operator-confidence-preference', module: '../app/api/operator-confidence-preference/route' },
  { path: '/api/operator-creative-trial',      module: '../app/api/operator-creative-trial/route' },
  { path: '/api/outcome',                      module: '../app/api/outcome/route' },
  { path: '/api/pre-generation-stability',     module: '../app/api/pre-generation-stability/route' },
  { path: '/api/refusal-narrative',            module: '../app/api/refusal-narrative/route' },
  { path: '/api/trial-outcome',                module: '../app/api/trial-outcome/route' },
];

const TENANT_A = { organizationId: 'org-a',  workspaceId: 'wsp-a-default' };
const TENANT_B = { organizationId: 'org-b',  workspaceId: 'wsp-b-default' };

async function withTwoTenantSeed<T>(fn: (ctx: {
  tmp: string; tenantACookie: string; tenantBCookie: string; anonCookie: undefined;
}) => Promise<T>): Promise<T> {
  return withTempDir(async (tmp) => {
    // Pre-seed two organizations + workspaces in org memory so memberships
    // can be granted.
    const orgMod = await import('../lib/tenancy/organizationMemory');
    let orgState = orgMod.createInitialOrganizationMemory();
    orgState = orgMod.appendOrganization(orgState, {
      organizationId: TENANT_A.organizationId, name: 'A', slug: 'a',
      billingTier: 'unbilled', createdAt: 1000, createdBy: 'plat',
    });
    orgState = orgMod.appendWorkspace(orgState, {
      workspaceId: TENANT_A.workspaceId, organizationId: TENANT_A.organizationId,
      name: 'A wsp', slug: 'default', createdAt: 1000, createdBy: 'plat',
    });
    orgState = orgMod.appendOrganization(orgState, {
      organizationId: TENANT_B.organizationId, name: 'B', slug: 'b',
      billingTier: 'unbilled', createdAt: 1000, createdBy: 'plat',
    });
    orgState = orgMod.appendWorkspace(orgState, {
      workspaceId: TENANT_B.workspaceId, organizationId: TENANT_B.organizationId,
      name: 'B wsp', slug: 'default', createdAt: 1000, createdBy: 'plat',
    });
    await orgMod.createOrganizationMemoryStore(tmp).save(orgState);

    // Mint two member sessions.
    async function mintMember(email: string, organizationId: string): Promise<string> {
      const { hashPassword } = await import('../lib/auth/passwordHash');
      const userMod = await import('../lib/auth/userMemory');
      const sessMod = await import('../lib/auth/sessionMemory');
      const { SESSION_COOKIE_NAME } = await import('../lib/auth/cookie');
      const { buildSessionCookieValue } = await import('../lib/auth/resolveSession');
      const userStore = userMod.createUserMemoryStore();
      let userState = await userStore.read();
      const { passwordHash, passwordSalt } = hashPassword('test-password-12345');
      const userId = userMod.newUserId();
      userState = userMod.appendUser(userState, {
        userId, email, displayName: 'm', passwordHash, passwordSalt,
        createdBy: userId, createdAt: Date.now(),
        failedLoginCount: 0, lockedUntil: 0,
      });
      await userStore.save(userState);
      const sessStore = sessMod.createSessionMemoryStore();
      let sessState = await sessStore.read();
      const sessionId = sessMod.newSessionId();
      const rawToken = sessMod.newSessionToken();
      sessState = sessMod.appendSession(sessState, {
        sessionId, userId, rawToken, at: Date.now(),
      });
      await sessStore.save(sessState);
      // Grant membership
      const orgStore2 = orgMod.createOrganizationMemoryStore();
      let orgState2 = await orgStore2.read();
      orgState2 = orgMod.appendMembership(orgState2, {
        membershipId: orgMod.newMembershipId(),
        organizationId, memberId: userId,
        displayName: 'm', roles: ['organization-owner'],
        createdAt: Date.now(), grantedBy: userId,
      });
      await orgStore2.save(orgState2);
      return `${SESSION_COOKIE_NAME}=${buildSessionCookieValue(sessionId, rawToken)}`;
    }
    const tenantACookie = await mintMember('a-member@test.local', TENANT_A.organizationId);
    const tenantBCookie = await mintMember('b-member@test.local', TENANT_B.organizationId);
    return fn({ tmp, tenantACookie, tenantBCookie, anonCookie: undefined });
  });
}

async function caseAnonymousGETReturns401(): Promise<{ ok: boolean; detail: string }> {
  return withTwoTenantSeed(async ({ tenantACookie }) => {
    const failures: string[] = [];
    for (const r of PROTECTED_TENANT_GET_ROUTES) {
      const mod = await import(r.module);
      const url = `http://localhost${r.path}?organizationId=${TENANT_A.organizationId}&workspaceId=${TENANT_A.workspaceId}`;
      const res = await (mod.GET as (req: Request) => Promise<Response>)(new Request(url, { method: 'GET' }));
      if (res.status !== 401) failures.push(`${r.path}=${res.status}`);
    }
    // Sanity: tenantACookie unused here — we expect *anonymous* to be 401.
    void tenantACookie;
    return {
      ok: failures.length === 0,
      detail: failures.length === 0 ? `${PROTECTED_TENANT_GET_ROUTES.length}/8 routes returned 401 anonymous` : `failures: ${failures.join(',')}`,
    };
  });
}

async function caseWrongTenantReturns403(): Promise<{ ok: boolean; detail: string }> {
  return withTwoTenantSeed(async ({ tenantACookie }) => {
    // tenantACookie has membership in tenant A. Request data in tenant B → 403.
    const failures: string[] = [];
    for (const r of PROTECTED_TENANT_GET_ROUTES) {
      const mod = await import(r.module);
      const url = `http://localhost${r.path}?organizationId=${TENANT_B.organizationId}&workspaceId=${TENANT_B.workspaceId}`;
      const res = await (mod.GET as (req: Request) => Promise<Response>)(new Request(url, {
        method: 'GET', headers: { Cookie: tenantACookie },
      }));
      if (res.status !== 403) failures.push(`${r.path}=${res.status}`);
    }
    return {
      ok: failures.length === 0,
      detail: failures.length === 0 ? `${PROTECTED_TENANT_GET_ROUTES.length}/8 routes returned 403 cross-tenant` : `failures: ${failures.join(',')}`,
    };
  });
}

async function caseCorrectTenantReturns200(): Promise<{ ok: boolean; detail: string }> {
  return withTwoTenantSeed(async ({ tenantACookie }) => {
    const failures: string[] = [];
    for (const r of PROTECTED_TENANT_GET_ROUTES) {
      const mod = await import(r.module);
      const url = `http://localhost${r.path}?organizationId=${TENANT_A.organizationId}&workspaceId=${TENANT_A.workspaceId}`;
      const res = await (mod.GET as (req: Request) => Promise<Response>)(new Request(url, {
        method: 'GET', headers: { Cookie: tenantACookie },
      }));
      // 200 is the happy path. Some routes may return 4xx for shape-specific
      // reasons (e.g. workflows with no records), but never 401 / 403.
      if (res.status === 401 || res.status === 403) failures.push(`${r.path}=${res.status}`);
    }
    return {
      ok: failures.length === 0,
      detail: failures.length === 0 ? `${PROTECTED_TENANT_GET_ROUTES.length}/8 routes passed (no 401/403 for valid member)` : `failures: ${failures.join(',')}`,
    };
  });
}

async function caseAnonymousPOSTReturns401(): Promise<{ ok: boolean; detail: string }> {
  return withTwoTenantSeed(async () => {
    const failures: string[] = [];
    for (const r of PROTECTED_POST_ROUTES) {
      const mod = await import(r.module);
      const url = `http://localhost${r.path.replace('[id]', 'test-banner')}`;
      let res: Response;
      try {
        // Some banner POSTs require a (req, { params }) signature; we pass
        // params via a stub.
        if (r.path.includes('[id]')) {
          res = await (mod.POST as (req: Request, ctx: { params: { id: string } }) => Promise<Response>)(
            new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
            { params: { id: 'test-banner' } },
          );
        } else {
          res = await (mod.POST as (req: Request) => Promise<Response>)(
            new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
          );
        }
      } catch (e) {
        failures.push(`${r.path}=threw(${(e as Error).message.slice(0, 40)})`);
        continue;
      }
      if (res.status !== 401) failures.push(`${r.path}=${res.status}`);
    }
    return {
      ok: failures.length === 0,
      detail: failures.length === 0 ? `${PROTECTED_POST_ROUTES.length}/${PROTECTED_POST_ROUTES.length} POSTs returned 401 anonymous` : `failures: ${failures.slice(0, 5).join(' · ')}…`,
    };
  });
}

// ─── runner ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('AUTHENTICATION VERIFICATION\n');

  // Sync cases.
  for (const [id, label, fn] of [
    ['user-append-dup-email',          'appendUser throws on duplicate email (case-insensitive)', caseUserAppendDupEmail],
    ['password-rejects-weak',          'hashPassword rejects <12 char password',                  casePasswordHashRejectsWeak],
    ['password-roundtrip',             'verifyPassword accepts correct + rejects wrong',          casePasswordHashRoundtrip],
    ['password-not-reversible',        'plaintext password absent from hash blob',                casePasswordHashIsNotReversible],
    ['session-roundtrip',              'session token verifies; wrong token rejected',            caseSessionRoundtrip],
    ['session-revoked-rejects',        'revoked session not returned by findLiveSession',         caseSessionRevokedRejected],
    ['session-expired-rejects',        'expired session not returned by findLiveSession',         caseSessionExpiredRejected],
    ['sliding-expiry-halflife',        'touchSession extends expiresAt only after halflife',      caseSlidingExpiryOnlyAfterHalflife],
    ['login-failure-increments',       'recordFailedLogin increments counter',                    caseLoginFailureIncrements],
    ['login-lockout-after-five',       'lockedUntil set after 5 failures',                        caseLoginLockoutAfterFiveFailures],
    ['login-success-clears-lockout',   'resetFailedLogin clears counter + lockedUntil',           caseLoginSuccessClearsLockout],
    ['absolute-cap-honored',           'expiresAt never exceeds createdAt + ABSOLUTE_TTL',        caseAbsoluteCapHonored],
    ['token-hash-salted',              'hashSessionToken produces different hash per sessionId',  caseTokenHashSaltedBySessionId],
  ] as const) {
    let r: { ok: boolean; detail: string };
    try { r = fn(); }
    catch (err) { r = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, r.ok, r.detail);
  }

  // Async route-driven cases.
  for (const [id, label, fn] of [
    ['register-route',                 'POST /api/auth/register · returns 200 + sets cookie',     caseRegisterRouteRoundtrip],
    ['login-route',                    'POST /api/auth/login · 401 wrong / 200 right + cookie',   caseLoginRouteRoundtrip],
    ['me-401-no-cookie',               'GET /api/auth/me · 401 with {user:null} when no cookie', caseMeRoute401WithoutCookie],
    ['me-200-with-cookie',             'GET /api/auth/me · 200 returns user with valid cookie',  caseMeRoute200WithValidCookie],
    ['logout-revokes',                 'POST /api/auth/logout · subsequent /me returns 401',      caseLogoutRevokesSession],
    ['protected-401-no-session',       'POST /api/brand without cookie → 401 authentication required', caseProtectedRoute401WithoutSession],
    ['protected-uses-session-userid',  'protected POST stamps record with session userId · ignores forged operatorId', caseProtectedRouteUsesSessionUserId],
    ['bootstrap-idempotent',           '/api/auth/bootstrap creates once · reuses on rerun',      caseBootstrapIdempotent],
    ['bootstrap-refuses-no-env',       '/api/auth/bootstrap returns 412 without env vars',        caseBootstrapRefusesWithoutEnvVars],
    ['register-no-auto-grant',         'POST /api/auth/register does NOT auto-grant any membership', caseRegisterDoesNotGrantMembership],
    ['cookie-flags',                   'Set-Cookie includes httpOnly + SameSite=Lax + Path=/',    caseCookieFlagsHttpOnlyAndSameSite],
    ['anon-get-401',                   'all 48 tenant-data GETs return 401 to anonymous request',  caseAnonymousGETReturns401],
    ['wrong-tenant-get-403',           'all 48 tenant-data GETs return 403 for cross-tenant member', caseWrongTenantReturns403],
    ['correct-tenant-get-not-4xx',     'all 48 tenant-data GETs return non-401/403 for valid member', caseCorrectTenantReturns200],
    ['anon-post-401',                  'all 27 long-tail POSTs return 401 to anonymous request',   caseAnonymousPOSTReturns401],
  ] as const) {
    let r: { ok: boolean; detail: string };
    try { r = await fn(); }
    catch (err) { r = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, r.ok, r.detail);
  }

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error('verification crashed:', err); process.exit(2); });
