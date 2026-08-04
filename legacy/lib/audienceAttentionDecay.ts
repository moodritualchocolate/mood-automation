/**
 * AUDIENCE ATTENTION DECAY (Phase 300 — Wave 14: Live Civilization Coupling)
 *
 * Rate at which audience attention is decaying right now.
 */

export type AttentionDecayState = 'holding' | 'fading' | 'lost';

export interface AudienceAttentionDecayReading {
  decay_state: AttentionDecayState;
  /** 0..10 — attention decay rate. */
  decay_rate: number;
  notes: string[];
}

export interface AudienceAttentionDecayInput {
  attentionAvailable: number;
  attentionEarlier: number;
}

export function readAudienceAttentionDecay(input: AudienceAttentionDecayInput): AudienceAttentionDecayReading {
  const { attentionAvailable, attentionEarlier } = input;
  const notes: string[] = [];

  const decay_rate = round1(Math.max(0, attentionEarlier - attentionAvailable));

  const decay_state: AttentionDecayState =
    attentionAvailable <= 1 ? 'lost' :
    decay_rate >= 1 ? 'fading' : 'holding';

  notes.push(`audience attention decay: ${decay_state} (rate ${decay_rate})`);
  return { decay_state, decay_rate, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
