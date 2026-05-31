# Platform Boundary Document

> MOOD CREATIVE OS · multi-tenant SaaS substrate · v1
> Operator approval required at every write boundary. Human remains
> final authority.

## 1 · What this document defines

The **platform boundary** is the perimeter that separates the
platform (the SaaS layer that every tenant shares) from any single
**organization** (a tenant). Code that lives inside `lib/tenancy/`,
`app/api/organization/`, and `app/api/tenant-context/` belongs to
the platform layer. Every other engine, memory, route, view, and
panel belongs **inside a tenant**, never spanning tenants.

The boundary is enforced by three pure modules:

- `lib/tenancy/types.ts` — type primitives shared everywhere.
- `lib/tenancy/permissionMatrix.ts` — fixed role × action eligibility.
- `lib/tenancy/tenantContext.ts` — pure resolver +
  `enforceTenantBoundary` guard.

## 2 · What the platform layer MAY do

The platform layer **MAY**:

- Create organizations (operator-supervised, platform-owner role
  required).
- Archive organizations (operator-supervised, platform-owner role
  required).
- Set the `billingTier` metadata of an organization
  (operator-supervised, platform-owner role required).
- Grant the `platform-owner` role to an operator (operator-supervised,
  platform-owner role required).
- Resolve a `TenantContext` for a single request
  (read-only, pure function).
- Read the permission matrix as a static reading
  (read-only, pure function).
- Read the billing-hooks descriptor (read-only, returns a
  deterministic descriptor — no hooks are installed).

## 3 · What the platform layer MAY NOT do

The platform layer **MAY NOT**:

- Auto-create organizations.
- Auto-grant memberships.
- Auto-transition any record.
- Charge a customer.
- Call a billing provider.
- Call any external API.
- Inspect, read, or write entities belonging to another tenant on
  behalf of a non-platform-owner operator.
- Approve any of its own actions.

## 4 · The Tenant #1 invariant

MOOD itself is **Tenant #1**. All entities that existed before the
multi-tenant substrate continue to function under the implicit
defaults:

- `organizationId = PLATFORM_TENANT_ID_MOOD` (`org-mood`)
- `workspaceId   = PLATFORM_WORKSPACE_ID_MOOD` (`wsp-mood-default`)

No backfill is required. Every future entity write MUST carry an
explicit `TenantOwnership` stamp at the route layer.

## 5 · Platform-level operator role

There is exactly one platform-level role: `platform-owner`. The
platform-owner roster is seeded from the `MOOD_PLATFORM_OWNERS`
environment variable (comma-separated operator ids) and may be
expanded only by an existing platform-owner via the
`grant-platform-owner` action on `/api/organization`. The matrix
does NOT auto-grant the role; the operator MUST act through the
route.

## 6 · Architecture-only billing extension points

The platform layer reserves three interface-only hooks for a future
billing layer:

- `BillingTierTransitionHook.beforeApply`
- `BillingUsageSignalHook.recordUsage`
- `BillingUsageSnapshotHook.readSnapshot`

These hooks are declared in `lib/tenancy/billingHooks.ts` and have
**no implementation** anywhere in the codebase. The descriptor
function `describeBillingHooks()` returns `hooksInstalled: false`
deterministically. Operator approval required for every tier
change. Human remains final authority.

## 7 · Verifier

The platform boundary is statically verified by
`scripts/verify-multi-tenant-saas.ts`. The verifier asserts:

- the permission matrix is complete (every action maps to ≥1 role).
- the tenant context resolver rejects cross-tenant access.
- the billing hooks module imports no http / fetch / external module.
- the 5 platform documents exist.
- no banned phrasing appears in this document set.
