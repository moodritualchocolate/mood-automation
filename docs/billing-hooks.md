# Billing Hooks (Architecture-Only)

> MOOD CREATIVE OS · multi-tenant SaaS substrate · v1
> Billing hooks are architecture-only extension points. The platform
> NEVER charges, NEVER calls a payment provider, NEVER enforces tier
> limits on its own. Tier transitions remain operator-supervised.
> Operator approval required. Human remains final authority.

## 1 · Why these hooks exist

The multi-tenant substrate must accommodate a future billing layer
without conditioning today's code on it. The hooks declared in
`lib/tenancy/billingHooks.ts` are TypeScript **interfaces only**.
There is **no implementation** of any hook anywhere in the
codebase. The verifier statically asserts this.

## 2 · The three reserved extension points

### 2.1 · `BillingTierTransitionHook.beforeApply`

Reserved entry point that a future implementation MAY call BEFORE
an operator-driven tier transition is applied. The hook would
return `{ ok, refusalReason }`; on `ok=false`, the route refuses
the transition. Until installed, tier transitions are pure
metadata writes — operator-supervised, never refused by the
platform itself.

### 2.2 · `BillingUsageSignalHook.recordUsage`

Reserved entry point a future implementation MAY call AFTER an
operator-driven write succeeds. Signals carry
`{ organizationId, workspaceId, signal, quantity, operatorId, at }`.
Today no signal is recorded; the substrate emits nothing.

### 2.3 · `BillingUsageSnapshotHook.readSnapshot`

Reserved read-only entry point a future implementation MAY call to
inspect a window of metered usage. Today the substrate has no
metering and returns nothing.

## 3 · The descriptor function

`describeBillingHooks()` is the ONLY runtime export of
`lib/tenancy/billingHooks.ts`. It returns a deterministic
descriptor:

```
{
  hooksInstalled: false,
  reservedHookNames: [
    'BillingTierTransitionHook.beforeApply',
    'BillingUsageSignalHook.recordUsage',
    'BillingUsageSnapshotHook.readSnapshot',
  ],
  tierLadder: ['unbilled', 'starter', 'growth', 'scale', 'enterprise'],
  advisoryNotice: '…',
}
```

The descriptor never reads from a provider, never makes a network
call, and never has side-effects.

## 4 · Tier ladder

The platform reserves five tiers as metadata labels: `unbilled`,
`starter`, `growth`, `scale`, `enterprise`. The labels carry no
behavioural meaning today. The platform-owner MAY set the tier of
an organization via the `set-billing-tier` action; the route
accepts the new label and persists it. No quota is enforced.

## 5 · Verifier

`scripts/verify-multi-tenant-saas.ts` asserts:

- `lib/tenancy/billingHooks.ts` does NOT import any module other
  than `./types`.
- the file contains no `fetch`, no `http`, no `spawn`, no
  `child_process`.
- the file exports interfaces + the descriptor function only —
  no other runtime function bodies.
- this document does not use banned phrasing.

Operator approval required. Human remains final authority.
