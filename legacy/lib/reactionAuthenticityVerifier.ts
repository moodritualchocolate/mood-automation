/**
 * REACTION AUTHENTICITY VERIFIER (Phase 236 — Wave 13: Reality Feedback Infrastructure)
 *
 * Not every reaction is honest. Performed enthusiasm and hollow
 * applause read like positive feedback but carry no real trust. This
 * verifier distinguishes the authentic reactions from the performed.
 */

export interface ReactionAuthenticityReading {
  /** 0..10 — share of reactions judged authentic. */
  authentic_share: number;
  /** True when the bulk of incoming reactions are authentic. */
  reactions_are_authentic: boolean;
  authenticity_note: string;
  notes: string[];
}

export interface ReactionAuthenticityInput {
  /** 0..10 — average authenticity score of incoming reactions. */
  averageAuthenticity: number;
  /** True when the audience appears to be performing alongside the brand. */
  audiencePerforming: boolean;
}

export function readReactionAuthenticityVerifier(input: ReactionAuthenticityInput): ReactionAuthenticityReading {
  const { averageAuthenticity, audiencePerforming } = input;
  const notes: string[] = [];

  let authentic_share = averageAuthenticity;
  if (audiencePerforming) authentic_share -= 3;
  authentic_share = round1(Math.max(0, Math.min(10, authentic_share)));

  const reactions_are_authentic = authentic_share >= 6;

  const authenticity_note = reactions_are_authentic
    ? 'reactions read as honest — the warmth back is real'
    : audiencePerforming
      ? 'the audience appears to be performing — the warmth is hollow'
      : 'reactions read as ambivalent — neither clearly honest nor performed';

  notes.push(`reaction authenticity verifier: ${authentic_share}/10 authentic — ${authenticity_note}`);
  return { authentic_share, reactions_are_authentic, authenticity_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
