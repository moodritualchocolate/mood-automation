/**
 * REALTIME OPPORTUNITY DETECTOR (Phase 302 — Wave 14: Live Civilization Coupling)
 *
 * The mirror of crisis detection: a live window where the brand
 * could say something that lands harder than usual.
 */

export interface RealtimeOpportunityReading {
  /** True when a live opportunity window is open. */
  opportunity_open: boolean;
  /** 0..10 — strength of the opportunity. */
  opportunity_strength: number;
  notes: string[];
}

export interface RealtimeOpportunityInput {
  culturalCalm: boolean;
  attentionAvailable: number;
  warmGradient: boolean;
}

export function readRealtimeOpportunityDetector(input: RealtimeOpportunityInput): RealtimeOpportunityReading {
  const { culturalCalm, attentionAvailable, warmGradient } = input;
  const notes: string[] = [];

  let opportunity_strength = 0;
  if (culturalCalm) opportunity_strength += 3;
  opportunity_strength += attentionAvailable * 0.4;
  if (warmGradient) opportunity_strength += 2;
  opportunity_strength = round1(Math.min(10, opportunity_strength));

  const opportunity_open = opportunity_strength >= 6;

  notes.push(`realtime opportunity detector: ${opportunity_open ? 'OPEN' : 'closed'} (${opportunity_strength}/10)`);
  return { opportunity_open, opportunity_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
