/**
 * BILLING HOOKS (architecture-only)
 *
 * Future-extension interfaces for a billing/subscription layer.
 * This module is intentionally interface-only — there is NO
 * implementation here. The platform MUST NOT charge, MUST NOT call
 * a payment provider, MUST NOT enforce limits on tier transitions.
 *
 * STRICT CONTRACT (verifier-checked):
 *   - no fetch, no http, no external imports
 *   - no implementation bodies — only interface + type declarations
 *     + a single architecture-only descriptor function that returns
 *     a static plain object (no provider lookups, no side-effects)
 *   - no auto-charges, no auto-upgrades, no auto-downgrades
 *   - the only valid runtime call is `describeBillingHooks()` which
 *     returns a deterministic descriptor for documentation purposes
 *   - Human remains final authority
 */

import type { BillingTier } from './types';

// ─── extension-point interfaces ──────────────────────────────

/** Future entry point: the route layer would call this BEFORE
 *  applying an operator-driven tier transition. The interface
 *  is intentionally not implemented anywhere in this build. */
export interface BillingTierTransitionHook {
  /** Called by the route BEFORE a tier transition is applied.
   *  In a future implementation, the function MAY consult an
   *  external billing provider and return a refusal. Until then,
   *  no implementation exists. */
  beforeApply: (input: {
    organizationId: string;
    fromTier: BillingTier;
    toTier: BillingTier;
    operatorId: string;
    operatorReason: string;
  }) => Promise<{ ok: boolean; refusalReason: string | null }>;
}

/** Future entry point: a metered usage signal the route layer
 *  MAY emit when operator-supervised entities are created. No
 *  implementation exists in this build. */
export interface BillingUsageSignalHook {
  /** Called by the route AFTER an operator-driven write succeeds. */
  recordUsage: (input: {
    organizationId: string;
    workspaceId: string | null;
    /** Stable signal name — e.g. 'asset.registered', 'agent.executed'. */
    signal: string;
    /** Always 1 for now — operator-driven discrete events. */
    quantity: number;
    operatorId: string;
    at: number;
  }) => Promise<void>;
}

/** Future entry point: a snapshot of an organization's current
 *  metered usage. Read-only. No implementation exists in this build. */
export interface BillingUsageSnapshotHook {
  readSnapshot: (input: {
    organizationId: string;
    windowStart: number;
    windowEnd: number;
  }) => Promise<{
    organizationId: string;
    windowStart: number;
    windowEnd: number;
    signals: Array<{ signal: string; quantity: number }>;
  }>;
}

// ─── descriptor (deterministic, no I/O) ──────────────────────

export interface BillingHooksDescriptor {
  /** True when at least one hook has a registered implementation.
   *  Always false in this build — the platform never billed anyone. */
  hooksInstalled: false;
  /** Names of the extension points reserved for the billing layer. */
  reservedHookNames: string[];
  /** Tier ladder the architecture supports as metadata. */
  tierLadder: BillingTier[];
  /** Advisory notice required for the verifier banner. */
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Billing hooks are architecture-only extension points. The platform ' +
  'NEVER charges, NEVER calls a payment provider, NEVER enforces tier ' +
  'limits on its own. Tier transitions remain operator-supervised. ' +
  'Operator approval required. Human remains final authority.';

/** Returns the static descriptor for documentation purposes. This
 *  is the ONLY runtime function exported by this module. */
export function describeBillingHooks(): BillingHooksDescriptor {
  return {
    hooksInstalled: false,
    reservedHookNames: [
      'BillingTierTransitionHook.beforeApply',
      'BillingUsageSignalHook.recordUsage',
      'BillingUsageSnapshotHook.readSnapshot',
    ],
    tierLadder: ['unbilled', 'starter', 'growth', 'scale', 'enterprise'],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
