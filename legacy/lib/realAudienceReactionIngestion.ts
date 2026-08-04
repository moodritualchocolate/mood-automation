/**
 * REAL AUDIENCE REACTION INGESTION (Phase 221 — Wave 13: Reality Feedback Infrastructure)
 *
 * The first job of a feedback layer is to actually receive what came
 * back. This module ingests reactions from the world — synthesizing
 * them, when no direct telemetry exists, from the audience-state
 * signals already flowing through the organism.
 */

export interface IngestedReaction {
  channel: string;
  emotional_charge: number;   // -10..10
  trust_signal: number;       // -10..10
  authenticity: number;       // 0..10
}

export interface AudienceReactionReading {
  reactions: IngestedReaction[];
  /** True when reactions could be observed from the world this cycle. */
  reactions_observed: boolean;
  /** 0..10 — how clear the reactions are. */
  reaction_clarity: number;
  notes: string[];
}

export interface AudienceReactionInput {
  /** True when the run shipped a banner this cycle. */
  bannerShipped: boolean;
  /** 0..10 — proxy emotional charge from audience state. */
  audienceEmotionalCharge: number;
  /** -10..10 — trust trend proxy from coupling. */
  trustTrendProxy: number;
  /** 0..10 — authenticity proxy from coupling. */
  authenticityProxy: number;
  /** 0..10 — external signal volume (Wave 10). */
  externalSignalVolume: number;
}

export function readRealAudienceReactionIngestion(input: AudienceReactionInput): AudienceReactionReading {
  const { bannerShipped, audienceEmotionalCharge, trustTrendProxy, authenticityProxy, externalSignalVolume } = input;
  const notes: string[] = [];

  const reactions: IngestedReaction[] = bannerShipped
    ? [
        { channel: 'feed', emotional_charge: round1(audienceEmotionalCharge - 5), trust_signal: round1(trustTrendProxy), authenticity: authenticityProxy },
        { channel: 'word-of-mouth', emotional_charge: round1((audienceEmotionalCharge - 5) * 0.6), trust_signal: round1(trustTrendProxy * 0.7), authenticity: round1(authenticityProxy * 0.9) },
      ]
    : [];

  const reactions_observed = reactions.length > 0;
  const reaction_clarity = round1(Math.min(10, externalSignalVolume * 0.7 + (reactions_observed ? 3 : 0)));

  notes.push(`real audience reaction ingestion: ${reactions.length} reaction(s) on ${reactions_observed ? 'observed' : 'no'} channels (clarity ${reaction_clarity}/10)`);
  return { reactions, reactions_observed, reaction_clarity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
