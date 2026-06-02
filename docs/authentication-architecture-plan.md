# Authentication Architecture · Plan

> Plan only. No implementation lands until this document is reviewed
> and approved.
>
> Baseline:
> - HEAD `9f56db0`
> - tenant isolation verifier 15 / 15
> - full verifier suite 65 / 65

## Scope (verbatim from the directive)

- user model
- session model
- register / login / logout / me routes
- protected write routes
- organization ownership
- permission enforcement
- **no billing, no Stripe, no external auth yet**
- no new AI, dashboards, agents, or cognition

## Out of scope (explicit non-goals)

The following are intentionally **deferred** for a future directive:

- SSO / OIDC / SAML / OAuth providers (Google, GitHub, etc.)
- Email verification flows that actually send email
- Password reset flows that actually send email
- TOTP / WebAuthn / passkeys / 2FA enrollment UX
- Stripe / billing / subscriptions / paywalls
- Rate limiting middleware (recorded as a follow-up)
- CSRF tokens beyond the SameSite cookie default
- Account merging / impersonation by platform-owner
- Audit-trail UI for failed logins (the data is captured · UI later)

This plan stays inside the platform freeze: zero new engines, zero
new cognition, zero new dashboards. Authentication is infrastructure
the operator-supervised routes already implicitly assumed.

## Threat model (terse)

| Threat | Mitigation in this plan |
| --- | --- |
| Stolen demo-operator id grants any action | Real users · cookie-bound sessions · membership-gated permissions |
| Password disclosure on disk | Argon2id hash with per-record salt; never store plain or reversibly encrypted password |
| Session-token theft via XSS | `httpOnly` + `Secure` + `SameSite=Lax` cookie, no token in `localStorage` |
| Session-token theft via CSRF | `SameSite=Lax`, write endpoints accept only `application/json` (no form-encoded), no auto-submission from a foreign origin |
| Replay after logout | Server-side session record with `revokedAt`; cookie check matches against memory store, never trusts cookie alone |
| Brute-force login | Per-userId attempt counter recorded in `authMemory` with an exponential backoff window (no external rate-limit dep) |
| Cross-tenant action by an authenticated user | Existing `enforceTenantBoundary` is invoked using the resolved user's resolved org-roles, not from request body |
| Privilege escalation via crafted request body | All `organizationId`, `workspaceId`, `roles` fields on writes are **resolved from the session**, never trusted from the body |

## Data model

### `lib/auth/types.ts`

```ts
export type UserId = string;          // 'user-<base36>'
export type SessionId = string;       // 'sess-<base36>'

export interface UserRecord {
  userId: UserId;
  /** Lowercased, trimmed. Unique platform-wide. */
  email: string;
  displayName: string;
  /** argon2id hash. Never returned by GET routes. */
  passwordHash: string;
  /** Base64 salt the hash was generated against. */
  passwordSalt: string;
  /** Operator who created the user record (self-register: same userId). */
  createdBy: UserId;
  createdAt: number;
  /** Operator-set: a disabled user cannot authenticate. */
  disabledAt?: number;
  /** Failed-login counter, reset on success. */
  failedLoginCount: number;
  /** Wallclock until which login is rate-limited. 0 = no lockout. */
  lockedUntil: number;
  operatorNote?: string;
}

export interface SessionRecord {
  sessionId: SessionId;
  userId: UserId;
  /** Hex-encoded, never returned by GET routes (cookie holds it). */
  tokenHash: string;
  /** When the session was created. */
  createdAt: number;
  /** When the session was last refreshed (sliding-expiry). */
  lastSeenAt: number;
  /** Hard absolute expiry. */
  expiresAt: number;
  /** Set when the user (or platform-owner) logs out / revokes. */
  revokedAt?: number;
  revokedReason?: string;
  /** Operator-readable hint: 'ip omitted' by default. The route layer
   *  passes a coarse user-agent class only (e.g. 'mobile-web').
   *  We do not log raw IP or full UA — minimum data needed to keep
   *  sessions auditable for the operator. */
  contextHint?: string;
}
```

Both records are PII-bearing. The store **never** returns
`passwordHash` / `passwordSalt` / `tokenHash` over any GET route.
The session cookie is the only carrier of the raw token; the store
keeps a salted hash of it.

### Token hashing strategy

| Secret | Where the raw value lives | Where the stored value lives |
| --- | --- | --- |
| User password | client → request body → discarded after hash | `passwordHash` (argon2id) |
| Session token | client cookie · 32-byte hex from `crypto.randomBytes` | `tokenHash` (sha-256, salted with `sessionId`) |

`argon2id` parameters: `memoryCost=19_456 KB`, `timeCost=2`,
`parallelism=1`, `hashLength=32`. These match the OWASP minimum
profile and execute in ~100 ms on a modern CPU.

If `argon2` is not yet a dependency, the plan provisionally adopts
`node:crypto.scryptSync` with `N=2**15, r=8, p=1, keyLen=32` as a
pure-stdlib fallback. The verifier asserts the chosen primitive is
consistent across register and login. **The plan does not introduce
any new npm dep without an explicit confirmation step.**

## Memory layout

### `lib/auth/userMemory.ts`

- FIFO cap: `USER_LIMIT = 2048`
- Lives at `data/memory/user-memory.json`
- Pure transforms: `appendUser`, `updateUserPassword`, `disableUser`,
  `reEnableUser`, `recordFailedLogin`, `resetFailedLogin`,
  `setUserLockout`
- All transforms throw on unknown `userId`
- All transforms throw on duplicate email (case-insensitive)

### `lib/auth/sessionMemory.ts`

- FIFO cap: `SESSION_LIMIT = 4096` (sessions are short-lived; cap
  bounds the historical FIFO, not concurrent users)
- Lives at `data/memory/session-memory.json`
- Pure transforms: `appendSession`, `touchSession` (sliding expiry),
  `revokeSession` (sets `revokedAt`), `revokeUserSessions` (used by
  the `/logout-all` operator-supervised action and by `disableUser`)
- All transforms throw on unknown `sessionId`

### Migration

No prior auth state exists. The MOOD pilot seed currently uses the
`demo-operator` synthetic id. Migration is one-shot:

1. On first server boot under the auth layer, the seed adds a single
   bootstrap user `user-mood-bootstrap` whose `email` equals
   `MOOD_BOOTSTRAP_EMAIL` (env var, defaults to
   `bootstrap@mood.local`) and whose password is supplied via
   `MOOD_BOOTSTRAP_PASSWORD` (env var; if absent, the server refuses
   to start in production mode).
2. Existing organization memberships keyed to `demo-operator` are
   **rewritten in-place** by a single migration verifier that updates
   the `memberId` field to `user-mood-bootstrap`. The migration is
   idempotent; re-running it produces no changes.
3. After migration, the seed log records the bootstrap user id so
   the operator has a starting point to log in.

The migration is the **only** mutation to existing memory. All
other downstream logic continues to consume `memberId` exactly as
before; `enforceTenantBoundary` is unchanged.

## Routes

### `app/api/auth/register/route.ts` · POST

Public · self-service registration.

Body:
```json
{
  "email": "...",
  "displayName": "...",
  "password": "...",
  "operatorReason": "..."   // operator audit string (always required)
}
```

Behaviour:
- Lowercases + trims email. Rejects empty/malformed email.
- Rejects passwords below 12 characters or that fail a basic
  composition check (length only — no complexity-rules theater).
- Rejects duplicate email with 409.
- Computes hash; appends `UserRecord`; creates a session; sets
  cookie; returns `{ ok, user: <safe shape>, sessionExpiresAt }`.
- **Does not auto-create an organization or membership.** A platform
  owner (or the bootstrap migration) is the only path that grants a
  new user into a tenant — the directive's organization ownership
  rule is enforced by the existing `/api/organization` route.

### `app/api/auth/login/route.ts` · POST

Body:
```json
{
  "email": "...",
  "password": "...",
  "operatorReason": "..."
}
```

Behaviour:
- Lookups user by email. Constant-time string compare on the hash
  via `crypto.timingSafeEqual`.
- On success: zero the `failedLoginCount`, clear `lockedUntil`,
  create session, set cookie, return safe user.
- On failure: increment `failedLoginCount`; if it crosses 5 in 15
  min, set `lockedUntil = now + exponentialBackoff(failedLoginCount)`
  and return 429 with the lockout horizon.
- Disabled users always receive 403 regardless of password validity.

### `app/api/auth/logout/route.ts` · POST

- Reads the session cookie · revokes the matching session record ·
  clears the cookie · returns `{ ok: true }`.
- Idempotent: an already-revoked or absent session returns 200.

### `app/api/auth/me/route.ts` · GET

- Reads the session cookie · returns the safe user shape +
  resolved memberships +  resolved roles.
- Returns 401 with `{ user: null }` when no valid session exists
  (cookie missing / expired / revoked / user disabled).
- Implements **sliding expiry**: every successful `me` extends
  `session.lastSeenAt` and (if past half-life) extends `expiresAt`.

### Bootstrap auxiliary · `app/api/auth/bootstrap/route.ts` · POST

- Operator-supervised. Available **only** while the user store is
  empty (returns 410 once any user exists). Creates the bootstrap
  user from `MOOD_BOOTSTRAP_*` env vars and stamps the existing
  MOOD memberships. This is the migration handle.

## Session middleware

A single shared helper:

```
lib/auth/resolveSession.ts
  resolveSession(req): Promise<{
    session: SessionRecord | null;
    user: UserRecord | null;
    membership: MembershipRecord[];   // active only
  }>
```

The helper:
1. Reads the cookie · returns `null` triple on any miss.
2. Looks up the session by hashed token.
3. Rejects sessions where `revokedAt` is set, `expiresAt <= now`, or
   the user is disabled.
4. Returns the resolved triple.

All write routes call `resolveSession` first. The result is the
**only** source of truth for the operator id passed into the
existing `enforceTenantBoundary` check. The request body's
`operatorId` is no longer trusted — if present, it must equal
`session.user.userId` or the route returns 403.

## Protected write routes

The directive says "protected write routes". The freeze rules out
adding new ones, so the scope is **retrofitting the existing
operator-supervised POSTs**. Forty-eight routes are affected.

| Route group | Behaviour change |
| --- | --- |
| `/api/organization` · `/api/workspace` · `/api/fast-start` · `/api/brand` · `/api/product` · `/api/onboarding` · `/api/workspace-activation` · `/api/workspace-quick-start` · `/api/workflows` | Before any state mutation: `resolveSession`; reject 401 if no session; override `operatorId` with `session.user.userId`; resolve `organizationId` / `workspaceId` from the session's active memberships rather than trusting the body. |
| `/api/asset-registry` · `/api/publication-registry` · `/api/performance` · `/api/simple-performance` · `/api/customer-journey` · `/api/campaign-planner` · `/api/agent` · `/api/team` · `/api/task` · `/api/knowledge` | Same · plus the `enforceTenantBoundary` check is upgraded from "trust the body" to "resolve from the session's resolved roles". |
| All other operator-supervised POSTs (the cognition / banner / ingest / pre-generation routes) | Lower priority — these are observatory-side routes that already throw on unknown ids. They are retrofitted by the same `resolveSession` shim but the bulk of their behaviour does not change. The verifier covers the high-value subset; the rest are flagged for a follow-up sweep. |

Public GETs (catalog routes such as `/api/business-goal`,
`/api/channel-architecture`, `/api/customer-funnel`,
`/api/growth-blueprint`, `/api/workflow-templates`,
`/api/design-system`, `/api/entity-page`,
`/api/channel-unified`) remain **public**. They serve static
descriptor data. Authentication is not required to view them. The
operator-facing `/api/dashboard`, `/api/growth`, `/api/workflows`
GETs will require a session because they leak workspace state.

## Organization ownership · self-register flow

Concrete sequence for a new RoyalLoot operator:

1. Platform-owner (the bootstrap user) calls
   `POST /api/organization` action `create-organization` with
   `{ name: 'RoyalLoot', slug: 'royalloot' }`. Returns
   `organizationId`.
2. Platform-owner calls action `create-workspace`. Returns
   `workspaceId`.
3. RoyalLoot's first operator self-registers via
   `POST /api/auth/register`. Returns a new `userId`.
4. Platform-owner calls action `grant-membership`
   `{ organizationId, memberId: <new userId>, roles:
   ['organization-owner'] }`. Now that operator is a member.
5. RoyalLoot operator logs in. `resolveSession` resolves them to
   the RoyalLoot tenant. Every subsequent write is tenant-scoped.

No self-service organization creation by anonymous users. No
auto-grant of memberships. The plan keeps existing rules intact:
the operator never escalates themselves.

## Permission enforcement

Permissions are unchanged in shape — the existing permission matrix
in `lib/tenancy/permissionMatrix.ts` already maps every action to a
role list. The auth layer's only contribution is to **resolve the
caller to a role set**:

```
allowedRoles = resolveSession.user.memberships
  .filter(m => m.organizationId === tenantScope.organizationId)
  .flatMap(m => m.roles);
```

This is passed into the existing `enforceTenantBoundary` check.
No new permission strings. No new role names. No new actions.

## Cookie shape

| Cookie | Value | Flags |
| --- | --- | --- |
| `mood_session` | the raw session token (32 byte hex) | `httpOnly`, `Secure` (in prod), `SameSite=Lax`, `Path=/`, `Max-Age=86400` (1 day) |

No second cookie. No client-readable session metadata. The `me`
endpoint is the one source of truth.

## Telemetry

The operator-supervised audit trails already in place
(`auditMemory`, `agentRunMemory`, etc.) gain two new event kinds:

- `auth.login.success`, `auth.login.failure`, `auth.logout`,
  `auth.lockout`, `auth.disabled-login-attempt`
- `session.created`, `session.revoked`, `session.expired`

These are recorded inside the existing audit-trail conventions —
no new audit memory store, no new dashboard.

## Verifier plan

`scripts/verify-authentication.ts` (new). At least 18 cases:

1. `user-append-throws-duplicate-email` · case-insensitive
2. `user-append-rejects-weak-password` · <12 chars rejected
3. `password-hash-roundtrip` · verify accepts known good, rejects known bad
4. `password-hash-is-not-reversible` · plain password absent from on-disk record
5. `session-create-roundtrip` · token in cookie verifies against stored hash
6. `session-revoked-rejects-all-requests`
7. `session-expired-rejects-all-requests`
8. `session-sliding-expiry-extends-only-after-halflife`
9. `login-success-clears-lockout`
10. `login-failure-counter-increments`
11. `login-lockout-after-five-failures`
12. `disabled-user-cannot-login`
13. `register-route-roundtrip` · drives POST handler
14. `login-route-roundtrip` · drives POST handler
15. `me-route-401-without-cookie`
16. `me-route-200-with-valid-cookie`
17. `logout-route-revokes-session`
18. `protected-route-401-without-session` · drive a representative
    operator-supervised POST (e.g. `/api/brand`) with no cookie ·
    expect 401
19. `protected-route-uses-session-userId-not-body-operatorId` · same
    route but with a forged `operatorId` in the body · the resolved
    operator id must match the session user
20. `cross-tenant-write-rejected-via-session` · a MOOD user attempting
    a RoyalLoot brand create gets 403 from `enforceTenantBoundary`
    even though the body names RoyalLoot's `organizationId`

The verifier drives the actual route handlers via
`new Request()` (the pattern already used by the tenant-isolation
verifier).

## Migration verifier

`scripts/verify-auth-migration.ts` (new):

- Seeds a fresh memory dir with the legacy MOOD pilot state
  (membership `memberId='demo-operator'`).
- Runs the bootstrap migration.
- Asserts the legacy membership now references the bootstrap
  user's id.
- Re-runs the migration · asserts idempotency.

## File layout

```
lib/auth/
  types.ts
  userMemory.ts
  sessionMemory.ts
  passwordHash.ts          # argon2id wrapper · or scrypt fallback
  resolveSession.ts        # shared middleware helper
  cookie.ts                # cookie name + flags constants
  authAudit.ts             # tiny adapter into existing audit memory

app/api/auth/
  register/route.ts
  login/route.ts
  logout/route.ts
  me/route.ts
  bootstrap/route.ts       # one-shot bootstrap migration handle

scripts/
  verify-authentication.ts
  verify-auth-migration.ts

docs/
  authentication-architecture-plan.md     (this file)
  authentication-implementation-report.md (written after impl, before commit)

lib/systemIntegrityReport.ts               (KNOWN_ROUTES extended)
scripts/verify-system-stability.ts         (whitelist extended)
```

No new lib top-level directory beyond `lib/auth/`. No new
dashboard. No new engine. No new cognition.

## Rollout sequence (the implementation order)

1. **lib/auth foundations** · types + userMemory + sessionMemory +
   passwordHash + cookie + resolveSession + authAudit.
   tsc clean before continuing.
2. **register / login / logout / me routes** · driven by the new
   foundation.
3. **bootstrap route + auth-migration verifier** · proves the
   demo-operator → bootstrap-user replay works.
4. **Retrofit a representative protected write** (`/api/brand`)
   first. Confirm it 401s without a session and accepts with one.
5. **Sweep the remaining protected writes** in the priority order
   listed above.
6. **Verifier** · run `verify-authentication.ts` to 20/20.
7. **Re-run** the full verifier suite. Expect 67 / 67
   (65 existing + the 2 new authentication suites). Any
   regression must be traced to a retrofitted route and fixed
   before commit.
8. **Implementation report** · `authentication-implementation-report.md`.
9. **Diff stat + status + test output** delivered for review
   before any commit (same protocol as the tenant-isolation work).
10. **Commit · push** only on explicit approval. Suggested commit
    message:
    ```
    authentication · users, sessions, register/login/logout/me, protected writes
    ```

## Risks and uncertainties

- **Argon2id dependency**: argon2 is the right choice but adds a
  native build step. The fallback (`crypto.scryptSync`) is
  stdlib-only and good enough for an internal pilot. The plan
  ships the fallback unless approval is given to add `argon2`.
- **Cookie security in dev**: `Secure` requires HTTPS; the dev
  environment may run on `http://localhost`. The plan toggles
  `Secure` by `NODE_ENV === 'production'` and notes this in the
  verifier.
- **Sliding-expiry vs absolute-expiry**: chosen sliding because
  it matches typical SaaS UX; `expiresAt` still caps at 7 days
  absolute to bound replay.
- **Retrofit blast radius**: 48 POST routes touch operator
  context. The plan retrofits the high-value subset listed under
  "Protected write routes" and explicitly flags the long tail for
  a follow-up sweep. The verifier covers the high-value subset.
- **`enforceTenantBoundary` contract**: today it accepts an
  `operatorId` argument and looks up memberships. The auth layer
  passes the session's resolved user id; no signature change.

## Approval checkpoint

This plan is plan-only. No code lands until you reply with
**APPROVED** or a redlined version of the plan. I will not
proceed past this checkpoint on a stop-hook nudge.
