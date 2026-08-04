/**
 * HIGH-FUNCTIONING BURNOUT (Phase 19)
 *
 * The form of burnout that NEVER stops working.
 *
 * Other phases see burnout differently:
 *   - Phase 13 functionalCollapse: subject still typing, person gone
 *   - Phase 14 modernNumbing      : background stimulus preventing rest
 *   - Phase 17 recoveryFailure    : rest that does not restore
 *   - Phase 18 fakeRecovery       : cultural performance of recovery
 *
 * Phase 19 highFunctioningBurnout asks a sharper question:
 *
 *   "Is this body still meeting its responsibilities at the same
 *    apparent level it always has — while internally depleted past
 *    the point of recovery?"
 *
 * The five signatures:
 *   productive-exhaustion          — output unchanged, depletion deep
 *   competent-collapse              — competence the last thing holding
 *   over-functioning                — doing more, not less, under load
 *   excessive-responsiveness        — every email within 90s as proof of life
 *   hyper-availability              — yes to every ask, no margin retained
 *
 * Plus the cinematic centrepiece:
 *   doing-well-while-cognitively-failing — the body is delivering; the
 *   inside is gone. The mask of competence has become the structure
 *   the body now stands on.
 *
 * Each signature scores:
 *   functional_output_unchanged   — appearance to the world (high = invisible)
 *   internal_depletion             — what the body is actually carrying
 *   competence_as_load_bearing     — how much identity depends on the output
 *   recoverable                    — how reversible this state still is
 *                                    (low = the body has rebuilt itself
 *                                     around the depletion)
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type HighFunctioningSignatureId =
  | 'productive-exhaustion'
  | 'competent-collapse'
  | 'over-functioning'
  | 'excessive-responsiveness'
  | 'hyper-availability'
  | 'doing-well-while-cognitively-failing';

export interface HighFunctioningSignatureRecord {
  id: HighFunctioningSignatureId;
  external_appearance: string;     // what the world sees
  internal_truth: string;          // what is actually happening
  competence_role: string;         // what competence is now bearing
  recovery_window: string;         // how reversible
}

export const HIGH_FUNCTIONING_LIBRARY: Record<HighFunctioningSignatureId, HighFunctioningSignatureRecord> = {
  'productive-exhaustion': {
    id: 'productive-exhaustion',
    external_appearance: 'output unchanged — same volume, same deadlines, same Friday wrap-up message',
    internal_truth: 'depletion that has been deepening for months while the work continues at apparent baseline',
    competence_role: 'output IS the only visible signal — the world reads the output and assumes the inside',
    recovery_window: 'reversible in weeks of full off-ramp; not in long weekends',
  },
  'competent-collapse': {
    id: 'competent-collapse',
    external_appearance: 'still good at the job — colleagues would say "they\'re doing great"',
    internal_truth: 'the competence is the last thing the body has not lost; everything else has',
    competence_role: 'competence as structural support — without the output the identity has nothing to stand on',
    recovery_window: 'months — the recovery requires permission to be less competent for a while',
  },
  'over-functioning': {
    id: 'over-functioning',
    external_appearance: 'doing MORE than before — taking on more, replying faster, helping more, organising the calendar for the team',
    internal_truth: 'cannot stop; stopping would let the deficit become visible to themselves',
    competence_role: 'output volume is the proof the body uses to convince itself it is still fine',
    recovery_window: 'requires an external interruption — burnout, illness, sometimes worse — before it stops',
  },
  'excessive-responsiveness': {
    id: 'excessive-responsiveness',
    external_appearance: 'every email replied within 90 seconds; slack messages closed in under five minutes; "got it" the most common reply',
    internal_truth: 'responsiveness as proof of life — every reply is a vote against the suspicion of disappearance',
    competence_role: 'speed substitutes for substance; the reply itself, not its content, is the message',
    recovery_window: 'the moment responsiveness slows, the subject discovers they have been collapsed for weeks',
  },
  'hyper-availability': {
    id: 'hyper-availability',
    external_appearance: 'yes to every meeting, every ask, every help — no calendar gap ever defended',
    internal_truth: 'saying no costs more than saying yes; the identity of the helpful person has nothing to fall back on',
    competence_role: 'availability is the identity; output is the side effect',
    recovery_window: 'requires the subject to tolerate being unavailable — a skill the body has not practised',
  },
  'doing-well-while-cognitively-failing': {
    id: 'doing-well-while-cognitively-failing',
    external_appearance: 'all the right answers, on tone, on time, on point — the room would say "they\'re thriving"',
    internal_truth: 'the cognitive baseline is gone; the answers are coming from prerecorded patterns and trained heuristics',
    competence_role: 'competence is the prerecording; the operator left the building weeks ago',
    recovery_window: 'rare without external rupture — the appearance is too good to interrupt',
  },
};

const STATE_TO_SIGNATURE: Record<string, HighFunctioningSignatureId[]> = {
  'silent-burnout':                   ['competent-collapse', 'doing-well-while-cognitively-failing'],
  'overwhelmed-founder':              ['over-functioning', 'hyper-availability'],
  'startup-burnout':                  ['productive-exhaustion', 'over-functioning'],
  'overconnected-exhaustion':         ['excessive-responsiveness', 'hyper-availability'],
  'unread-messages-anxiety':          ['excessive-responsiveness'],
  'always-on-anxiety':                ['excessive-responsiveness', 'hyper-availability'],
  'workday-blur':                     ['productive-exhaustion', 'doing-well-while-cognitively-failing'],
  'forced-productivity':              ['over-functioning'],
  'mentally-offline':                 ['doing-well-while-cognitively-failing'],
  'parent-overload':                  ['hyper-availability', 'over-functioning'],
  'partner-overload':                 ['hyper-availability'],
  'overstimulated-office':            ['productive-exhaustion'],
  'tired-but-continuing':             ['competent-collapse'],
  'late-afternoon-collapse':          ['doing-well-while-cognitively-failing'],
};

const CORE_TO_SIGNATURE: Partial<Record<string, HighFunctioningSignatureId>> = {
  'silent-burnout':                 'competent-collapse',
  'invisible-pressure':             'over-functioning',
  'performance-pressure':           'doing-well-while-cognitively-failing',
  'productivity-identity':          'over-functioning',
  'too-tired-to-rest':              'excessive-responsiveness',
  'always-improving':               'over-functioning',
  'optimization-pressure':          'productive-exhaustion',
};

export interface HighFunctioningBurnoutReading {
  primary: HighFunctioningSignatureRecord | null;
  secondary: HighFunctioningSignatureRecord | null;
  /** 0..10 — how completely the body's output looks unchanged. */
  functional_output_unchanged: number;
  /** 0..10 — how deep the internal depletion is. */
  internal_depletion: number;
  /** 0..10 — how much identity rests on the output level. */
  competence_as_load_bearing: number;
  /** 0..10 — how reversible this state still is (LOW = body has
   *  rebuilt itself around the depletion; recovery requires rupture). */
  recoverable: number;
  /** 0..10 — overall high-functioning-burnout signal strength. */
  hfb_score: number;
  /** True when the banner reads as hidden-burnout (the spec's ideal). */
  burnout_hidden_in_competence: boolean;
  /** True when the truth says the burnout out loud — the hiding is
   *  broken; banner becomes "visible burnout aesthetics". */
  burnout_visible_too_early: boolean;
  notes: string[];
}

export interface HighFunctioningBurnoutInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

const VISIBLE_BURNOUT = /\b(burned out|burnt out|can[' ]?t anymore|exhausted|spent|drained|i'm done|i'm broken|breakdown|breaking down|collapse)\b/i;
const HIDDEN_BURNOUT_LANGUAGE = /\b(reply(ies|ied|ing)?|deliver(s|ed|ing)?|on time|on tone|got it|sent|sending|present(s|ing|ed)?|stand-?up|standup|deck|slack|inbox)\b/i;
const COMPETENCE_LANGUAGE = /\b(competent|good at|great at|thriving|crushing|delivering|killing it|on it)\b/i;

export function readHighFunctioningBurnout(input: HighFunctioningBurnoutInput): HighFunctioningBurnoutReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: HighFunctioningSignatureId[] = [];
  for (const id of STATE_TO_SIGNATURE[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_SIGNATURE[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }

  const primary = candidates[0] ? HIGH_FUNCTIONING_LIBRARY[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? HIGH_FUNCTIONING_LIBRARY[candidates[1]]
    : null;

  const text = truth.truth;
  const burnout_visible_too_early = VISIBLE_BURNOUT.test(text);
  const usesHiddenLanguage = HIDDEN_BURNOUT_LANGUAGE.test(text);
  const usesCompetenceLanguage = COMPETENCE_LANGUAGE.test(text);

  // Output unchanged — high when truth describes business-as-usual
  // surface signals; low when truth is openly collapse-flavored.
  let functional_output_unchanged = 0;
  if (primary) functional_output_unchanged = 7;
  if (usesHiddenLanguage) functional_output_unchanged += 2;
  if (burnout_visible_too_early) functional_output_unchanged -= 5;
  functional_output_unchanged = clamp10(functional_output_unchanged);

  // Internal depletion — strong when family is collapse/fatigue/numb;
  // moderate elsewhere.
  let internal_depletion = 0;
  switch (state.family) {
    case 'collapse':         internal_depletion = 9; break;
    case 'fatigue':          internal_depletion = 8; break;
    case 'numbness':         internal_depletion = 8; break;
    case 'pressure':         internal_depletion = 7; break;
    case 'overstimulation':  internal_depletion = 6; break;
    case 'fragmentation':    internal_depletion = 6; break;
    case 'paralysis':        internal_depletion = 7; break;
    case 'avoidance':        internal_depletion = 5; break;
  }
  if (!primary) internal_depletion = Math.max(0, internal_depletion - 3);

  // Competence as load-bearing.
  let competence_as_load_bearing = 0;
  if (primary) {
    const HIGH = new Set<HighFunctioningSignatureId>(['competent-collapse', 'doing-well-while-cognitively-failing', 'over-functioning']);
    competence_as_load_bearing = HIGH.has(primary.id) ? 8 : 6;
  }
  if (usesCompetenceLanguage) competence_as_load_bearing += 2;
  competence_as_load_bearing = clamp10(competence_as_load_bearing);

  // Recoverable — low when output unchanged is high AND internal
  // depletion is deep (the body has been at this for a while).
  let recoverable = 10;
  if (functional_output_unchanged >= 7 && internal_depletion >= 7) recoverable = 3;
  else if (functional_output_unchanged >= 6 || internal_depletion >= 6) recoverable = 5;

  // Composite.
  let hfb_score = 0;
  if (primary) hfb_score += 4;
  if (secondary) hfb_score += 1;
  hfb_score += (functional_output_unchanged / 10) * 2.5;
  hfb_score += (internal_depletion / 10) * 1.5;
  hfb_score += (competence_as_load_bearing / 10) * 1;
  if (burnout_visible_too_early) hfb_score -= 4;
  hfb_score = clamp10(hfb_score);

  const burnout_hidden_in_competence = hfb_score >= 6 && !burnout_visible_too_early;

  if (primary) notes.push(`high-functioning burnout: ${primary.id} — external "${primary.external_appearance}", internal "${primary.internal_truth}"`);
  else         notes.push('no high-functioning burnout signature matched');
  if (burnout_visible_too_early) notes.push('WARNING: truth makes the burnout visible too early — banner loses the hiding mechanism');
  if (burnout_hidden_in_competence) notes.push('banner captures BURNOUT HIDDEN IN COMPETENCE — the cinematic ideal of Phase 19');

  return {
    primary,
    secondary,
    functional_output_unchanged,
    internal_depletion,
    competence_as_load_bearing,
    recoverable,
    hfb_score,
    burnout_hidden_in_competence,
    burnout_visible_too_early,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
