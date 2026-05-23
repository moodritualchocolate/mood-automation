/**
 * REALTIME ATTENTION FIELD (Phase 289 — Wave 14: Live Civilization Coupling)
 *
 * Audience attention as a live field — how much capacity is available
 * for the brand at this exact moment.
 */

export type AttentionFieldState = 'open' | 'narrowing' | 'crowded' | 'closed';

export interface RealtimeAttentionFieldReading {
  attention_state: AttentionFieldState;
  /** 0..10 — attention available to the brand right now. */
  attention_available: number;
  notes: string[];
}

export interface RealtimeAttentionFieldInput {
  digitalOverload: number;
  fieldVolume: number;
  audienceFatigue: number;
}

export function readRealtimeAttentionField(input: RealtimeAttentionFieldInput): RealtimeAttentionFieldReading {
  const { digitalOverload, fieldVolume, audienceFatigue } = input;
  const notes: string[] = [];

  const attention_available = round1(Math.max(0, 10 - digitalOverload * 0.5 - audienceFatigue * 0.3 - fieldVolume * 0.2));

  const attention_state: AttentionFieldState =
    attention_available <= 1 ? 'closed' :
    attention_available <= 3 ? 'crowded' :
    attention_available <= 6 ? 'narrowing' : 'open';

  notes.push(`realtime attention field: ${attention_state} (${attention_available}/10 available)`);
  return { attention_state, attention_available, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
