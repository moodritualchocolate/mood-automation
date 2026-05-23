/**
 * IDENTITY CORRUPTION LOGGER (Phase 338 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Logs identity corruption events for accountability.
 */

export interface IdentityCorruptionLoggerReading {
  /** Total corruption events ever logged. */
  corruption_events: number;
  /** True when this cycle would add an entry. */
  logging_this_cycle: boolean;
  notes: string[];
}

export interface IdentityCorruptionLoggerInput {
  priorCorruptions: number;
  corruptionDetected: boolean;
  capturedThisCycle: boolean;
}

export function readIdentityCorruptionLogger(input: IdentityCorruptionLoggerInput): IdentityCorruptionLoggerReading {
  const { priorCorruptions, corruptionDetected, capturedThisCycle } = input;
  const notes: string[] = [];

  const logging_this_cycle = corruptionDetected || capturedThisCycle;
  const corruption_events = priorCorruptions + (logging_this_cycle ? 1 : 0);

  notes.push(`identity corruption logger: ${corruption_events} corruption(s) on record${logging_this_cycle ? ' (logging this cycle)' : ''}`);
  return { corruption_events, logging_this_cycle, notes };
}
