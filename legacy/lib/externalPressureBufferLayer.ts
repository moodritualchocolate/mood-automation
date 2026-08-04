/**
 * EXTERNAL PRESSURE BUFFER LAYER (Phase 392 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Buffers external pressure so identity decisions don't get made
 * under the heat of the moment.
 */

export interface ExternalPressureBufferReading {
  /** True when buffering is active. */
  buffering: boolean;
  notes: string[];
}

export interface ExternalPressureBufferInput {
  pressureLevel: number;
  decisionAttempted: boolean;
}

export function readExternalPressureBufferLayer(input: ExternalPressureBufferInput): ExternalPressureBufferReading {
  const { pressureLevel, decisionAttempted } = input;
  const notes: string[] = [];

  const buffering = pressureLevel >= 6 && decisionAttempted;

  notes.push(`external pressure buffer layer: ${buffering ? 'buffering — decision delayed for clarity' : 'no buffering'}`);
  return { buffering, notes };
}
