/**
 * IDENTITY VIOLATION DETECTOR (Phase 39 — Executive Identity Governance / Wave 4)
 *
 * Combines the constitution check and the aesthetic-corruption map
 * into a single violation verdict — the prosecutor of the executive
 * identity-governance layer.
 */

import type { ConstitutionReading } from './brandTruthConstitution';
import type { AestheticCorruptionReading } from './aestheticCorruptionMap';

export interface IdentityViolationReading {
  /** All distinct violations — constitutional + corruption. */
  violations: string[];
  /** 0..10 — severity of the worst violation set. */
  violation_severity: number;
  /** True when the candidate violates the executive identity. */
  identity_violated: boolean;
  /** The single most serious violation. */
  primary_violation: string | null;
  notes: string[];
}

export interface IdentityViolationInput {
  constitution: ConstitutionReading;
  corruption: AestheticCorruptionReading;
}

export function detectIdentityViolations(input: IdentityViolationInput): IdentityViolationReading {
  const { constitution, corruption } = input;
  const notes: string[] = [];

  const violations: string[] = [
    ...constitution.violated_articles.map((a) => `constitution:${a}`),
    ...corruption.detected.map((c) => `corruption:${c.id}`),
  ];

  // Corruption violations are graver than constitution gaps — a
  // corruption actively mutates the brand into something else.
  let violation_severity = 0;
  violation_severity += constitution.violated_articles.length * 1.5;
  violation_severity += corruption.detected.length * 3;
  violation_severity = Math.min(10, round1(violation_severity));

  const identity_violated = corruption.brand_mutating || constitution.violated_articles.length >= 2;
  const primary_violation = corruption.detected[0]
    ? `corruption:${corruption.detected[0].id}`
    : (constitution.violated_articles[0] ? `constitution:${constitution.violated_articles[0]}` : null);

  if (identity_violated) {
    notes.push(`identity violation: the candidate violates the executive identity — ${violations.join(', ')}`);
  } else {
    notes.push('identity violation: none serious — the candidate is within the identity');
  }

  return { violations, violation_severity, identity_violated, primary_violation, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
