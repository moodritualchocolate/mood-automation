/**
 * RUNTIME IDENTITY ENFORCEMENT (Phase 105 — Wave 8: Operating System Genesis)
 *
 * Identity must hold across EVERY process, not just the foreground
 * one. This module is the OS's identity-enforcement layer: it watches
 * for identity violations anywhere in the runtime and blocks them
 * before they propagate — the organism stays itself across all of
 * cognition, or it does not run.
 */

import type { ExecutiveValue } from './executiveArbitrationCourt';

export interface IdentityEnforcementReading {
  /** True when core identity is being enforced across the runtime. */
  identity_enforced: boolean;
  /** The identity violations the enforcement layer blocked this tick. */
  violations_blocked: string[];
  /** 0..10 — how strongly identity is being enforced. */
  enforcement_strength: number;
  notes: string[];
}

export interface IdentityEnforcementInput {
  ideologicalMutation: boolean;
  /** True when the identity stress test failed (Phase 75). */
  identityFailing: boolean;
  /** True when identity governance blocked the candidate (Wave 4). */
  governanceBlocks: boolean;
  /** The value the arbitration court ruled should govern (Phase 104). */
  arbitratedWinner: ExecutiveValue;
}

export function readRuntimeIdentityEnforcement(input: IdentityEnforcementInput): IdentityEnforcementReading {
  const { ideologicalMutation, identityFailing, governanceBlocks, arbitratedWinner } = input;
  const notes: string[] = [];

  const violations_blocked: string[] = [];
  if (ideologicalMutation) violations_blocked.push('the founding ideology has mutated — the mutation is blocked from propagating');
  if (identityFailing) violations_blocked.push('the identity would not hold under this run\'s pressure — the run is blocked');
  if (governanceBlocks) violations_blocked.push('identity governance blocked the candidate — the block is enforced runtime-wide');

  let enforcement_strength = 5;
  if (arbitratedWinner === 'identity') enforcement_strength += 3;
  if (arbitratedWinner === 'survival' || arbitratedWinner === 'truth') enforcement_strength += 1;
  if (arbitratedWinner === 'engagement' || arbitratedWinner === 'growth') enforcement_strength -= 2;
  enforcement_strength -= violations_blocked.length;
  enforcement_strength = clamp10(round1(enforcement_strength));

  // Identity is enforced when nothing got past — or when what got
  // through was caught and blocked.
  const identity_enforced = violations_blocked.length === 0 || enforcement_strength >= 5;

  notes.push(`runtime identity enforcement: ${identity_enforced ? 'identity held across the runtime' : 'IDENTITY BREACH — enforcement could not hold'}` +
    (violations_blocked.length ? ` (${violations_blocked.length} violation[s] blocked)` : ''));
  return { identity_enforced, violations_blocked, enforcement_strength, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
