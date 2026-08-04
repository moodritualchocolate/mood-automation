/**
 * ANTI-ASSIMILATION LAYER (Phase 323 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The organism must not dissolve into trends, peers, or the dominant
 * voice of the moment. This layer detects assimilation pressure and
 * actively refuses it.
 */

export type AssimilationState = 'distinct' | 'similar' | 'dissolving';

export interface AntiAssimilationReading {
  assimilation_state: AssimilationState;
  /** True when the brand is staying distinct from the field. */
  remaining_distinct: boolean;
  /** 0..10 — measured similarity to surrounding voices. */
  similarity_to_field: number;
  notes: string[];
}

export interface AntiAssimilationInput {
  voiceMatchesField: boolean;
  borrowedTropes: number;       // 0..10
  identityHeld: boolean;
}

export function readAntiAssimilationLayer(input: AntiAssimilationInput): AntiAssimilationReading {
  const { voiceMatchesField, borrowedTropes, identityHeld } = input;
  const notes: string[] = [];

  const similarity_to_field = round1(Math.min(10, (voiceMatchesField ? 5 : 1) + borrowedTropes * 0.6));

  const assimilation_state: AssimilationState =
    similarity_to_field >= 7 ? 'dissolving' :
    similarity_to_field >= 4 ? 'similar' : 'distinct';

  const remaining_distinct = assimilation_state === 'distinct' && identityHeld;

  notes.push(`anti-assimilation layer: ${assimilation_state} (similarity ${similarity_to_field}/10)` +
    (remaining_distinct ? '' : ' — assimilation pressure detected'));
  return { assimilation_state, remaining_distinct, similarity_to_field, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
