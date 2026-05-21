/**
 * FUNCTIONAL COLLAPSE (Phase 13)
 *
 * The spec's central insight for this phase:
 *
 *   "The most powerful MOOD campaigns will not show collapse.
 *    They will show people functioning while quietly collapsing.
 *    That is modern life."
 *
 * This engine distinguishes between TWO emotional textures:
 *
 *   Type A — SHOWING COLLAPSE
 *     visibly broken, dramatic, cinematic, the body has stopped
 *     working. The viewer sees a person who is no longer
 *     functioning.
 *
 *   Type B — FUNCTIONAL COLLAPSE   ← the spec wants THIS
 *     the body is still typing, still walking the kid to school,
 *     still attending the meeting. The person is gone but the
 *     work continues. Modern pain is BORING, QUIET, REPETITIVE,
 *     FUNCTIONAL.
 *
 * The engine reads the candidate banner and reports which texture
 * it is producing. Type B is the win; Type A is treated as
 * "cinematic suffering" — already named by Phase 11's
 * nonPerformativeReality.
 *
 * The new structural rule the spec demanded:
 *
 *   "The banner should feel 'accidentally true', not
 *    'creatively impressive'."
 *
 * Encoded as the accidentally_true_score below.
 */

import type { CreativeDirection, HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { AtmosphericLight } from './atmosphericLight';

export interface FunctionalCollapseReading {
  /** Type of collapse the banner is producing. */
  type: 'functional' | 'visible' | 'neither';
  /** 0..10 — how WELL the banner expresses functional collapse
   *  (working while quietly giving way). */
  functional_collapse_score: number;
  /** 0..10 — the spec's new structural rule. High when the banner
   *  feels accidentally true rather than creatively impressive. */
  accidentally_true_score: number;
  /** True when the banner is performing collapse instead of capturing
   *  it. Same emotional family as Phase 11's beautiful-burnout. */
  cinematic_collapse_risk: boolean;
  /** Director note explaining the texture. */
  directorNote: string;
  notes: string[];
}

export interface FunctionalCollapseInput {
  state: HumanState;
  truth: HumanTruth;
  direction: CreativeDirection;
  emotionalCore: EmotionalCore | null;
  atmosphericLight: AtmosphericLight;
}

export function readFunctionalCollapse(input: FunctionalCollapseInput): FunctionalCollapseReading {
  const { state, truth, direction, emotionalCore, atmosphericLight } = input;
  const text = truth.truth;
  const lowerText = text.toLowerCase();
  const notes: string[] = [];

  // ─── Functional-collapse signals (good) ───────────────────────
  // Body is DOING something + body has internally given way.
  const verbStillWorking = /\b(still|kept|keeps|continues|continued|kept going|opened the|answered|finished|delivered|sent|attended)\b/i.test(text);
  const bodyEmptiedSignal =
    /\b(autopilot|hollow|empty|absent|distant|elsewhere|gone|not here|past midnight|01:\d{2}|02:\d{2}|03:\d{2})\b/i.test(text)
    || (emotionalCore && ['silent-burnout', 'functional-collapse', 'emotional-numbness', 'too-tired-to-rest'].includes(emotionalCore.id))
    || state.family === 'numbness'
    || state.family === 'collapse';

  const showsContinuation = verbStillWorking || /\b(at \d{1,2}:\d{2}|past midnight|after the meeting|after dinner|finished the deck)\b/i.test(text);
  const showsInternalAbsence = bodyEmptiedSignal;

  const expressesFunctional = showsContinuation && showsInternalAbsence;

  // ─── Visible-collapse signals (the trap) ──────────────────────
  // Subject visibly broken: face-forward + collapsed pacing + low
  // restraint + warm light = cinematic suffering. Phase 11 already
  // detects 'beautiful-burnout' — we re-check the structural shape.
  const showsVisibleBreakdown =
    direction.focalPoint === 'human-face' &&
    direction.emotionalPacing === 'collapsed' &&
    direction.restraint < 0.5;
  const theatricalLight =
    atmosphericLight.behavior === 'amber-doorway' ||
    atmosphericLight.behavior === 'window-soft-warm' ||
    atmosphericLight.behavior === 'sunset-emotional-pause';
  const expressesVisible = showsVisibleBreakdown && theatricalLight;

  // ─── functional_collapse_score ────────────────────────────────
  let functional_collapse_score = 0;
  if (expressesFunctional) functional_collapse_score += 6;
  if (showsContinuation) functional_collapse_score += 1.5;
  if (showsInternalAbsence) functional_collapse_score += 1.5;
  if (expressesVisible) functional_collapse_score -= 3;
  // Boring / quiet / repetitive language earns the spec's reward.
  if (/\b(again|another|same|kept|still|once more|once again)\b/i.test(lowerText)) functional_collapse_score += 1;
  // Slack/email/spreadsheet/inbox words — the work itself is the texture.
  if (/\b(slack|email|inbox|deck|spreadsheet|meeting|standup|laptop)\b/i.test(lowerText)) functional_collapse_score += 0.5;
  functional_collapse_score = Math.max(0, Math.min(10, functional_collapse_score));

  // ─── accidentally_true_score ──────────────────────────────────
  // High when the truth is short, dry, observed; low when it is
  // "creatively impressive". We use:
  //   short truth (< 80 chars)
  //   punctuated (has a period or comma) — written like a sentence
  //                                          someone said, not a slogan
  //   no flowery vocabulary (no "embrace", "whisper of", "softly")
  //   has at least one specific witnessable detail
  const dryWritten = truth.truth.length > 0 && truth.truth.length < 90 && /[.,;:]/.test(truth.truth);
  const flowery = /\b(embrace|whisper of|softly|gently|wraps|cradles|kissed by|caress|gracefully)\b/i.test(text);
  const witnessable = /\b(\d{1,2}:\d{2}|\d+\s*(minutes?|hours?|messages?|tabs?))\b/i.test(text);

  let accidentally_true_score = 4;
  if (dryWritten) accidentally_true_score += 2;
  if (!flowery) accidentally_true_score += 1.5;
  if (witnessable) accidentally_true_score += 1.5;
  if (expressesFunctional) accidentally_true_score += 1;
  if (expressesVisible) accidentally_true_score -= 3;
  accidentally_true_score = Math.max(0, Math.min(10, accidentally_true_score));

  // ─── verdict ──────────────────────────────────────────────────
  let type: FunctionalCollapseReading['type'];
  if (expressesFunctional && !expressesVisible) {
    type = 'functional';
    notes.push('functional collapse — the work continues, the worker is gone');
  } else if (expressesVisible && !expressesFunctional) {
    type = 'visible';
    notes.push('visible collapse — cinematic suffering risk');
  } else {
    type = 'neither';
    notes.push('neither texture — banner is decoratively emotional');
  }

  const cinematic_collapse_risk = type === 'visible' || (functional_collapse_score < 3 && expressesVisible);

  const directorNote = type === 'functional'
    ? 'banner expresses functional collapse — the person is functioning AND quietly gone'
    : type === 'visible'
      ? 'banner is showing collapse instead of functioning — pull away from cinematic suffering'
      : 'banner does not express either functional or visible collapse — likely too decorative';

  if (flowery) notes.push('flowery vocabulary present — "creatively impressive" instead of "accidentally true"');

  return {
    type,
    functional_collapse_score,
    accidentally_true_score,
    cinematic_collapse_risk,
    directorNote,
    notes,
  };
}
