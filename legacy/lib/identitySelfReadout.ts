/**
 * IDENTITY SELF READOUT (Phase 369 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The brand reading its own state honestly — refusing flattering or
 * self-flagellating self-images.
 */

export interface IdentitySelfReadoutReading {
  self_readout: string;
  /** True when the readout is honest. */
  honest: boolean;
  notes: string[];
}

export interface IdentitySelfReadoutInput {
  health: number;
  pretendingHealth: boolean;
}

export function readIdentitySelfReadout(input: IdentitySelfReadoutInput): IdentitySelfReadoutReading {
  const { health, pretendingHealth } = input;
  const notes: string[] = [];

  const honest = !pretendingHealth;
  const self_readout = pretendingHealth
    ? 'the brand is reporting itself healthier than it is'
    : health >= 7 ? 'the brand reports itself sovereign and integrated'
    : health >= 4 ? 'the brand reports itself coupled but compromised'
    : 'the brand reports itself in serious identity trouble';

  notes.push(`identity self readout: ${honest ? 'HONEST' : 'flattering'} — "${self_readout}"`);
  return { self_readout, honest, notes };
}
