# Tenant Boundary Document

> MOOD CREATIVE OS · multi-tenant SaaS substrate · v1
> Operator approval required at every cross-boundary action.
> Human remains final authority.

## 1 · What this document defines

The **tenant boundary** is the perimeter around a single
organization. Code inside that perimeter MAY read/write entities
owned by the organization, scoped to one of its workspaces. Code
across that perimeter MAY NOT see any data of another organization.

## 2 · The strict guarantees

For every organization `A` and every organization `B ≠ A`,
organization `A` **MAY NOT** access:

- `A`'s assets are isolated from `B`. `B` MAY NOT read or write
  any `A` asset record.
- `A`'s campaigns are isolated from `B`. `B` MAY NOT read or write
  any `A` campaign record.
- `A`'s knowledge entries are isolated from `B`. `B` MAY NOT read
  or write any `A` knowledge entry.
- `A`'s agent runs are isolated from `B`. `B` MAY NOT execute or
  approve an agent run for `A`'s assets.
- `A`'s performance data is isolated from `B`. `B` MAY NOT read
  `A`'s performance metrics.
- `A`'s revenue signals are isolated from `B`. `B` MAY NOT read
  `A`'s revenue bridge output.

These guarantees are enforced by `enforceTenantBoundary(input)` in
`lib/tenancy/tenantContext.ts`, which throws `TenantBoundaryError`
with one of:

- `TENANT_BOUNDARY_ORGANIZATION` — cross-organization access.
- `TENANT_BOUNDARY_WORKSPACE` — cross-workspace access within
  the same organization.
- `TENANT_BOUNDARY_NO_ROLES` — the operator has no resolved role
  in the organization.
- `TENANT_BOUNDARY_PERMISSION` — the operator's resolved roles
  MAY NOT perform the requested action.

## 3 · How the boundary is enforced

Every operator-supervised POST route MUST:

1. Read the operator's identity from the request body
   (`operatorId`, `operatorReason`).
2. Identify the target organization and (where applicable) target
   workspace.
3. Call `resolveTenantContext(...)` to compute the request's
   `TenantContext`.
4. Call `enforceTenantBoundary({ context, ownership, action })`
   for every entity it is about to read or write.
5. On `TenantBoundaryError`, return a 4xx response — the route
   NEVER recovers a boundary violation by retrying with elevated
   privileges.

The platform layer NEVER approves a boundary violation. The
operator NEVER bypasses the boundary by passing a flag. The
matrix NEVER auto-grants a role to satisfy a boundary check.

## 4 · Platform-owner role

The `platform-owner` role is the ONLY role that MAY act across
organization boundaries — and only for the actions explicitly
listed under the `platform.*` namespace of the permission matrix.
Even a platform-owner MAY NOT approve another organization's
asset on behalf of that organization; only roles inside the
target organization MAY do that.

## 5 · Default tenant (MOOD)

Legacy entities default to `PLATFORM_TENANT_ID_MOOD` /
`PLATFORM_WORKSPACE_ID_MOOD`. The boundary check still applies:
a non-MOOD operator MAY NOT read or write MOOD's legacy data
unless they hold a membership inside the MOOD organization.

## 6 · No back-channels

The tenant boundary is the only authorized channel between
organizations. There is **no shared cache**, **no shared engine
state**, **no shared agent run history** between organizations.
Every memory store keys by `organizationId` at the entity level.

## 7 · Verifier

`scripts/verify-multi-tenant-saas.ts` asserts:

- `enforceTenantBoundary` throws on cross-organization ownership.
- `enforceTenantBoundary` throws on cross-workspace ownership.
- `enforceTenantBoundary` throws when no roles are resolved.
- `resolveTenantContext` returns empty `organizationRoles` when
  the target organization does not exist.
- this document does not use banned phrasing.

Operator approval required at every route. Human remains final
authority.
