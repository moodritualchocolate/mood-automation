/**
 * UNRESOLVED EMOTION (Phase 10)
 *
 * Human beings continue campaigns in their minds because something
 * unresolved remains. The system stops asking "what should the next
 * banner contain" and starts asking "what emotional sentence is
 * unfinished?"
 *
 * This module reads the campaign's history and reports what remains
 * UNANSWERED:
 *
 *   - unanswered tensions      (contradictions named but not closed)
 *   - denied relief            (states that ended without relief beat)
 *   - incomplete rituals       (ritual notes without aftermath follow)
 *   - interrupted comfort      (intimacy notes followed by rejection)
 *   - unresolved silences      (absent-typography banners with no echo)
 *   - visual questions         (frames where the camera asked something
 *                               the campaign has not answered)
 *
 * The cinematicBrain consumes this to decide what the next banner
 * should CONTINUE — not what it should newly contain.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { CampaignTimeline, EmotionalNote } from './campaignTimeline';
import type { Reaction } from './humanReaction';

export interface UnresolvedSignal {
  kind:
    | 'unanswered-tension'
    | 'denied-relief'
    | 'incomplete-ritual'
    | 'interrupted-comfort'
    | 'unresolved-silence'
    | 'visual-question';
  /** The banner id that opened the unresolved beat. */
  fromBannerId: string;
  /** One-line description of the unresolved emotional thread. */
  description: string;
  /** 0..10 — how active this thread still is in the campaign. */
  pressure: number;
}

export interface UnresolvedReport {
  signals: UnresolvedSignal[];
  /** The single most-active unresolved sentence — the one the next
   *  banner should continue (or risk leaving a campaign that does
   *  not haunt). */
  most_active: UnresolvedSignal | null;
  /** Plain-text "unfinished sentence" the cinematicBrain inherits. */
  unfinished_sentence: string;
  /** True when the campaign has resolved too much — every emotional
   *  beat has closed cleanly. The system should INTRODUCE new
   *  unresolved tension next. */
  campaign_over_resolved: boolean;
}

export interface UnresolvedInput {
  trail: EmotionalTraceEntry[];
  timeline: CampaignTimeline;
}

export function analyzeUnresolvedEmotion(input: UnresolvedInput): UnresolvedReport {
  const { trail, timeline } = input;
  const signals: UnresolvedSignal[] = [];

  // We walk oldest → newest so pressure decays correctly.
  const oldestFirst = trail.slice().reverse();
  const now = Date.now();

  for (let i = 0; i < oldestFirst.length; i++) {
    const e = oldestFirst[i];
    const banner_age = now - e.createdAt;
    // Pressure decays slowly: 100% at 0min, 60% at 1 hour, 30% at 6 hours,
    // 10% beyond 24 hours.
    const ageHours = banner_age / (60 * 60 * 1000);
    const pressureDecay = ageHours <= 0.5 ? 1
      : ageHours <= 1 ? 0.85
      : ageHours <= 6 ? 0.6
      : ageHours <= 24 ? 0.35
      : 0.15;

    // unanswered-tension — when the truth carries a tension phrase but
    // no LATER banner has answered it (we check via the residue chain).
    if (e.tension && e.tension.length > 0 && e.tension.length < 60) {
      const laterAnswers = oldestFirst.slice(i + 1).filter((later) =>
        later.reaction.at_3s === 'intimacy' || later.reaction.at_3s === 'validation',
      ).length;
      if (laterAnswers === 0) {
        signals.push({
          kind: 'unanswered-tension',
          fromBannerId: e.bannerId,
          description: `tension "${e.tension}" was named and not answered`,
          pressure: 7 * pressureDecay,
        });
      }
    }

    // denied-relief — a state in collapse/fatigue family whose closing
    // reaction was rejection/discomfort (relief was denied).
    if ((e.family === 'collapse' || e.family === 'fatigue') &&
        (e.reaction.at_3s === 'rejection' || e.reaction.at_3s === 'discomfort')) {
      signals.push({
        kind: 'denied-relief',
        fromBannerId: e.bannerId,
        description: `relief withheld at end of "${e.stateId}" — the campaign owes a quieter beat`,
        pressure: 6 * pressureDecay,
      });
    }

    // incomplete-ritual — note=ritual without a subsequent aftermath/recovery.
    const noteFromReaction = noteForReaction(e.reaction.at_3s, e.family);
    if (noteFromReaction === 'ritual') {
      const followedByResolution = oldestFirst.slice(i + 1).some((later) => {
        const ln = noteForReaction(later.reaction.at_3s, later.family);
        return ln === 'aftermath' || ln === 'recovery' || ln === 'quiet-control';
      });
      if (!followedByResolution) {
        signals.push({
          kind: 'incomplete-ritual',
          fromBannerId: e.bannerId,
          description: `ritual at "${e.stateId}" never resolved — needs aftermath or recovery`,
          pressure: 5 * pressureDecay,
        });
      }
    }

    // interrupted-comfort — intimacy followed immediately by rejection
    // (banner closed warm, the next closed cold).
    if (e.reaction.at_3s === 'intimacy' && i + 1 < oldestFirst.length) {
      const next = oldestFirst[i + 1];
      if (next.reaction.at_3s === 'rejection' || next.reaction.at_3s === 'indifference') {
        signals.push({
          kind: 'interrupted-comfort',
          fromBannerId: e.bannerId,
          description: `intimacy at "${e.stateId}" was immediately broken in the next banner`,
          pressure: 6 * pressureDecay,
        });
      }
    }

    // unresolved-silence — absent typography on a banner whose closing
    // was not also quiet-control / intimacy / recognition.
    if (e.facts?.typographyDominance === 'absent' &&
        !(e.reaction.at_3s === 'intimacy' || e.reaction.at_3s === 'validation' || e.reaction.at_3s === 'recognition')) {
      signals.push({
        kind: 'unresolved-silence',
        fromBannerId: e.bannerId,
        description: `silent banner at "${e.stateId}" closed without landing — the silence is still open`,
        pressure: 4.5 * pressureDecay,
      });
    }

    // visual-question — the camera asked something via low-anchor close-up
    // OR off-balance framing AND no later banner has answered the same
    // tension phrase. (We approximate by signaling visual-question for
    // any banner whose family is fragmentation or pressure with no
    // follow-up.)
    if ((e.family === 'fragmentation' || e.family === 'pressure') && i === oldestFirst.length - 1) {
      // most recent banner — its question is always open.
      signals.push({
        kind: 'visual-question',
        fromBannerId: e.bannerId,
        description: `the camera asked something in the "${e.stateId}" banner — answer pending`,
        pressure: 5 * pressureDecay,
      });
    }
  }

  // Most active = highest pressure.
  const most_active = signals.length > 0
    ? signals.slice().sort((a, b) => b.pressure - a.pressure)[0]
    : null;

  // Over-resolved? — the campaign has covered every arc note AND no
  // signal has pressure ≥ 5.
  const allNotesCovered = timeline.notes_missing.length === 0;
  const noActivePressure = signals.every((s) => s.pressure < 5);
  const campaign_over_resolved = trail.length >= 6 && allNotesCovered && noActivePressure;

  const unfinished_sentence = most_active
    ? most_active.description
    : campaign_over_resolved
      ? 'campaign has resolved too cleanly — introduce a new unresolved tension'
      : 'campaign is still forming its unfinished sentence';

  return { signals, most_active, unfinished_sentence, campaign_over_resolved };
}

function noteForReaction(at_3s: Reaction, family: string): EmotionalNote {
  if (at_3s === 'rejection') return 'denial';
  if (at_3s === 'indifference') return 'numbness';
  if (at_3s === 'confusion') return 'disorientation';
  if (at_3s === 'discomfort') return 'micro-collapse';
  if (at_3s === 'intimacy' && (family === 'fatigue' || family === 'collapse')) return 'aftermath';
  if (at_3s === 'intimacy') return 'recovery';
  if (at_3s === 'validation') return 'quiet-control';
  if (at_3s === 'recognition' && family === 'numbness') return 'detachment';
  if (at_3s === 'recognition' && (family === 'fatigue' || family === 'collapse')) return 'ritual';
  if (at_3s === 'recognition') return 'quiet-control';
  if (at_3s === 'emotional tension') return 'ritual';
  if (at_3s === 'aspiration') return 'recovery';
  if (at_3s === 'curiosity') return 'disorientation';
  return 'ritual';
}
