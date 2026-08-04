/**
 * IDENTITY SHAPING PRESSURE FIELD (Phase 372 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Maps the field of pressures actively trying to reshape the brand.
 */

export interface IdentityShapingPressureFieldReading {
  /** 0..10 — total shaping pressure. */
  total_pressure: number;
  pressures: string[];
  notes: string[];
}

export interface IdentityShapingPressureFieldInput {
  trendPressure: number;
  audiencePressure: number;
  peerPressure: number;
  capturePressure: number;
}

export function readIdentityShapingPressureField(input: IdentityShapingPressureFieldInput): IdentityShapingPressureFieldReading {
  const { trendPressure, audiencePressure, peerPressure, capturePressure } = input;
  const notes: string[] = [];

  const pressures: string[] = [];
  if (trendPressure >= 5) pressures.push('trend');
  if (audiencePressure >= 5) pressures.push('audience');
  if (peerPressure >= 5) pressures.push('peer');
  if (capturePressure >= 5) pressures.push('capture');

  const total_pressure = round1((trendPressure + audiencePressure + peerPressure + capturePressure) / 4);

  notes.push(`identity shaping pressure field: total ${total_pressure}/10 (${pressures.join(', ') || 'no major pressure'})`);
  return { total_pressure, pressures, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
