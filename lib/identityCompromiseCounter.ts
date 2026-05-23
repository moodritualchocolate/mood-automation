/**
 * IDENTITY COMPROMISE COUNTER (Phase 346 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Tracks cumulative identity compromises across the campaign's life.
 */

export interface IdentityCompromiseCounterReading {
  total_compromises: number;
  /** True when compromises have crossed a danger threshold. */
  threshold_crossed: boolean;
  notes: string[];
}

export interface IdentityCompromiseCounterInput {
  priorCompromises: number;
  compromiseThisCycle: boolean;
}

export function readIdentityCompromiseCounter(input: IdentityCompromiseCounterInput): IdentityCompromiseCounterReading {
  const { priorCompromises, compromiseThisCycle } = input;
  const notes: string[] = [];

  const total_compromises = priorCompromises + (compromiseThisCycle ? 1 : 0);
  const threshold_crossed = total_compromises >= 5;

  notes.push(`identity compromise counter: ${total_compromises} total — ${threshold_crossed ? 'THRESHOLD CROSSED' : 'within bounds'}`);
  return { total_compromises, threshold_crossed, notes };
}
