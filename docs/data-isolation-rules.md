# Data Isolation Rules

> MOOD CREATIVE OS · multi-tenant SaaS substrate · v1
> Operator approval required at every write. Human remains final
> authority.

## 1 · The single rule

> No organization MAY access another organization's entities.

This rule applies to **every** memory store, **every** longitudinal
view, **every** engine output, and **every** agent run. The rule
applies even to platform-owners except for the explicit
`platform.*` actions enumerated in the permission matrix.

## 2 · Categories of isolated data

| Category    | Description                                             |
| ----------- | ------------------------------------------------------- |
| Assets      | Asset registry records, asset metadata, asset history.  |
| Campaigns   | Campaign records, campaign plans, campaign transitions. |
| Knowledge   | Knowledge entries, briefs, brand guardian notes.        |
| Agents      | Agent run history, agent inputs, agent outputs.         |
| Performance | Performance metrics, publications, performance history. |
| Revenue     | Revenue bridge output, attribution rows, journey data.  |

For every category above and every pair of distinct organizations
`A ≠ B`: organization `B` MAY NOT read or write any record of
organization `A`.

## 3 · How isolation is enforced

1. **Stamping.** Every entity write at the route layer stamps the
   record with `{ organizationId, workspaceId }`.
2. **Resolving.** Every request resolves a `TenantContext` via
   `resolveTenantContext(...)`.
3. **Guarding.** Every read or write calls `enforceTenantBoundary({
   context, ownership, action })` before touching the record.
4. **Failing closed.** `enforceTenantBoundary` throws
   `TenantBoundaryError` on any mismatch. The route returns a 4xx —
   it NEVER auto-recovers.
5. **No back-channels.** Memory stores are keyed by entity id and
   organization id; an engine that reads from a memory store MUST
   filter by the request's resolved `organizationId`.

## 4 · Workspace-level scoping (within an organization)

Within an organization, an operator MAY hold a membership scoped
to one or more workspaces (via `MembershipRecord.workspaceIds`).
When `workspaceIds` is empty or undefined, the membership applies
to all workspaces in the organization.

`enforceTenantBoundary` enforces workspace scope by comparing the
context's resolved `workspaceId` against the entity's
`workspaceId`. A workspace-scoped operator MAY NOT touch an entity
in another workspace, even within the same organization.

## 5 · What is NOT shared between organizations

- Memory state cached in `globalThis.*` MUST be partitioned by
  organization id whenever an engine consumes it. The substrate
  memory stores (`organization-memory.json`, `agent-run-memory.json`)
  hold cross-tenant indexes but the route layer applies the boundary
  check before exposing any record.
- Agent run histories are partitioned per organization.
- Longitudinal views are scoped to a single organization.
- The supervised-learning loop MUST consume only same-organization
  trials and outcomes.

## 6 · What MAY be shared at the platform layer

- The permission matrix (a fixed, public eligibility table).
- The list of organizations (visible to platform-owner only).
- The platform-level documents (this set).
- The static descriptor returned by `describeBillingHooks()`.

Nothing else.

## 7 · Verifier

`scripts/verify-multi-tenant-saas.ts` asserts:

- this document references the six isolated categories explicitly.
- `enforceTenantBoundary` rejects every category-cross attempt in
  the test cases.
- this document does not use banned phrasing.

Operator approval required. Human remains final authority.
