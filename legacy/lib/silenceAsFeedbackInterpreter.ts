/**
 * SILENCE-AS-FEEDBACK INTERPRETER (Phase 247 — Wave 13: Reality Feedback Infrastructure)
 *
 * Silence from the audience is itself a kind of feedback. This module
 * interprets it — distinguishing the silence of attention from the
 * silence of forgetting.
 */

export type AudienceSilence = 'attentive-silence' | 'tired-silence' | 'forgotten-silence' | 'none';

export interface SilenceAsFeedbackReading {
  audience_silence: AudienceSilence;
  /** What the silence is telling the organism. */
  silence_meaning: string;
  notes: string[];
}

export interface SilenceAsFeedbackInput {
  /** Number of reactions this cycle. */
  reactionCount: number;
  /** 0..10 — meaning persistence score (high → attentive silence). */
  meaningPersistence: number;
  /** 0..10 — audience fatigue. */
  audienceFatigue: number;
  /** Cycles since the last action. */
  cyclesSinceAction: number;
}

export function readSilenceAsFeedbackInterpreter(input: SilenceAsFeedbackInput): SilenceAsFeedbackReading {
  const { reactionCount, meaningPersistence, audienceFatigue, cyclesSinceAction } = input;
  const notes: string[] = [];

  if (reactionCount > 0) {
    return {
      audience_silence: 'none', silence_meaning: 'the audience is not silent — there is direct feedback to read',
      notes: ['silence as feedback interpreter: not silent this cycle'],
    };
  }

  const audience_silence: AudienceSilence =
    cyclesSinceAction >= 4 ? 'forgotten-silence' :
    audienceFatigue >= 7 ? 'tired-silence' :
    meaningPersistence >= 6 ? 'attentive-silence' : 'tired-silence';

  const silence_meaning =
    audience_silence === 'attentive-silence' ? 'the audience is quiet because the meaning is still settling — this is good silence'
    : audience_silence === 'tired-silence' ? 'the audience is quiet because it is tired — recovery is owed'
    : 'the audience is quiet because it has forgotten — the brand has dropped out of the conversation';

  notes.push(`silence as feedback interpreter: ${audience_silence} — ${silence_meaning}`);
  return { audience_silence, silence_meaning, notes };
}
