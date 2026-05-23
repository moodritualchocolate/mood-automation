/**
 * SOVEREIGN PRESENCE CHECK (Phase 398 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Final check before the kernel — is the brand verifiably present
 * AND verifiably itself?
 */

export interface SovereignPresenceCheckReading {
  /** True when sovereign presence holds — present and itself. */
  sovereign_presence_holds: boolean;
  reason: string;
  notes: string[];
}

export interface SovereignPresenceCheckInput {
  brandIsPresent: boolean;
  brandIsItself: boolean;
}

export function readSovereignPresenceCheck(input: SovereignPresenceCheckInput): SovereignPresenceCheckReading {
  const { brandIsPresent, brandIsItself } = input;
  const notes: string[] = [];

  const sovereign_presence_holds = brandIsPresent && brandIsItself;
  const reason = sovereign_presence_holds
    ? 'present in reality AND itself — sovereign presence holds'
    : !brandIsPresent
      ? 'failed: brand is not verifiably present'
      : 'failed: brand is present but has lost itself';

  notes.push(`sovereign presence check: ${sovereign_presence_holds ? 'PASS' : 'FAIL'} — ${reason}`);
  return { sovereign_presence_holds, reason, notes };
}
