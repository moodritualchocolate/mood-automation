/**
 * CIVILIZATION COUPLING PRESENCE CHECK (Phase 319 — Wave 14: Live Civilization Coupling)
 *
 * The last check before the kernel synthesis — a single boolean
 * answer to "is the brand actually here?"
 */

export interface CivilizationCouplingPresenceCheckReading {
  /** True when the brand passes the final presence check. */
  brand_is_in_reality: boolean;
  /** Reason for the verdict. */
  check_reason: string;
  notes: string[];
}

export interface CivilizationCouplingPresenceCheckInput {
  isPresent: boolean;
  governorGovernance: 'reality-evolving' | 'present' | 'absent' | 'severed';
  withinBoundary: boolean;
}

export function readCivilizationCouplingPresenceCheck(input: CivilizationCouplingPresenceCheckInput): CivilizationCouplingPresenceCheckReading {
  const { isPresent, governorGovernance, withinBoundary } = input;
  const notes: string[] = [];

  const brand_is_in_reality = isPresent && withinBoundary &&
    (governorGovernance === 'reality-evolving' || governorGovernance === 'present');

  const check_reason = brand_is_in_reality
    ? 'the brand is verifiably in reality, within boundary, and governed'
    : !isPresent
      ? 'failed: brand is not verifiably present'
      : !withinBoundary
        ? 'failed: brand is present but has crossed the live-coupling boundary'
        : `failed: governance is ${governorGovernance}`;

  notes.push(`civilization coupling presence check: ${brand_is_in_reality ? 'PASS' : 'FAIL'} — ${check_reason}`);
  return { brand_is_in_reality, check_reason, notes };
}
