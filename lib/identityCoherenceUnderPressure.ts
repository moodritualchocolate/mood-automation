/**
 * IDENTITY COHERENCE UNDER PRESSURE (Phase 394 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Measures whether identity stays coherent specifically when under
 * pressure — not in calm conditions.
 */

export interface IdentityCoherenceUnderPressureReading {
  /** 0..10 — coherence under live pressure. */
  coherence: number;
  /** True when identity held up under pressure. */
  held_under_pressure: boolean;
  notes: string[];
}

export interface IdentityCoherenceUnderPressureInput {
  pressureLevel: number;
  identityHeld: boolean;
}

export function readIdentityCoherenceUnderPressure(input: IdentityCoherenceUnderPressureInput): IdentityCoherenceUnderPressureReading {
  const { pressureLevel, identityHeld } = input;
  const notes: string[] = [];

  const held_under_pressure = identityHeld;
  const coherence = round1(held_under_pressure ? Math.min(10, pressureLevel + 3) : Math.max(0, 5 - pressureLevel * 0.5));

  notes.push(`identity coherence under pressure: ${coherence}/10 (pressure ${pressureLevel}) — ${held_under_pressure ? 'HELD' : 'bent'}`);
  return { coherence, held_under_pressure, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
