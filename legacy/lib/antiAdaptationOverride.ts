/**
 * ANTI-ADAPTATION OVERRIDE (Phase 363 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Override that refuses adaptation when adaptation would cross an
 * identity invariant.
 */

export interface AntiAdaptationOverrideReading {
  /** True when adaptation is actively overridden. */
  override_active: boolean;
  override_reason: string;
  notes: string[];
}

export interface AntiAdaptationOverrideInput {
  adaptationProposed: boolean;
  adaptationCrossesInvariant: boolean;
}

export function readAntiAdaptationOverride(input: AntiAdaptationOverrideInput): AntiAdaptationOverrideReading {
  const { adaptationProposed, adaptationCrossesInvariant } = input;
  const notes: string[] = [];

  const override_active = adaptationProposed && adaptationCrossesInvariant;
  const override_reason = override_active
    ? 'override active — adaptation would cross an identity invariant'
    : 'no override needed';

  notes.push(`anti-adaptation override: ${override_reason}`);
  return { override_active, override_reason, notes };
}
