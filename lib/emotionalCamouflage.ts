/**
 * EMOTIONAL CAMOUFLAGE (Phase 19)
 *
 * The art forms modern humans use to HIDE emotion in plain sight —
 * specifically by routing it through socially acceptable vehicles
 * the room reads as "normal" or even "thriving".
 *
 * Seven camouflage channels:
 *   humor                  — a joke that absorbs the answer to "how are you"
 *   productivity           — getting more done than usual
 *   politeness             — the right "thank you", the right "of course"
 *   efficiency             — calm execution where there should be friction
 *   caretaking             — turning the attention onto someone else
 *   perfectionism          — invisible refinements that look like care
 *   social-energy-simulation — synthesised warmth in a depleted body
 *
 * Different from:
 *   - Phase 14 socialMasking          (the GAP)
 *   - Phase 19 socialMaskingEngine    (the CLASSIFIED mask)
 *   - Phase 19 identityMaintenance    (the ROLE being preserved)
 *
 * Emotional camouflage is the SPECIFIC CHANNEL the emotion is being
 * routed through so the room reads "thriving" instead of "struggling".
 *
 * The engine scores:
 *   concealment_intensity        — how much emotion is being routed
 *   social_readability           — how invisible the camouflage is to
 *                                   the room (high = the camouflage works)
 *   hidden_exhaustion_probability — how likely the body underneath is
 *                                   actually exhausted
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type CamouflageChannelId =
  | 'humor'
  | 'productivity'
  | 'politeness'
  | 'efficiency'
  | 'caretaking'
  | 'perfectionism'
  | 'social-energy-simulation';

export interface CamouflageChannelRecord {
  id: CamouflageChannelId;
  vehicle: string;                    // the socially acceptable form
  hides: string;                      // the emotion being routed
  social_acceptability: number;       // 0..10 — how invisible
  body_evidence_marker: string;       // the cinematic tell
}

export const EMOTIONAL_CAMOUFLAGE: Record<CamouflageChannelId, CamouflageChannelRecord> = {
  'humor': {
    id: 'humor',
    vehicle: 'a well-timed joke that absorbs the moment the question "how are you" arrived',
    hides: 'an answer the subject does not have words for; or has words for and cannot give right now',
    social_acceptability: 9,
    body_evidence_marker: 'the laugh lands one half-beat after the joke; the subject\'s own face is the late participant',
  },
  'productivity': {
    id: 'productivity',
    vehicle: 'output volume — emails sent, decks finished, a clean Trello board at 23:47',
    hides: 'feelings the subject does not have a free hour to process',
    social_acceptability: 10,
    body_evidence_marker: 'the work shipped; the subject\'s eyes did not move when the "send" landed',
  },
  'politeness': {
    id: 'politeness',
    vehicle: 'a perfectly calibrated "thank you", "of course", "no worries", "happy to"',
    hides: 'a flat depleted internal field where the warmth used to come from',
    social_acceptability: 10,
    body_evidence_marker: 'the words are correct; the eyes do not soften the way they would have a year ago',
  },
  'efficiency': {
    id: 'efficiency',
    vehicle: 'frictionless execution — calendar moved, problem solved, decision taken, three things off the list',
    hides: 'the emotional charge the subject would have if they stopped moving for a minute',
    social_acceptability: 9,
    body_evidence_marker: 'the body is faster than the day; the speed is itself the photograph',
  },
  'caretaking': {
    id: 'caretaking',
    vehicle: 'the second question — "and how are you?" / "have you eaten?" — placed at the right moment',
    hides: 'the subject\'s own state, which has not been asked about in a long time',
    social_acceptability: 9,
    body_evidence_marker: 'the question goes outward; the body never turns the question on itself',
  },
  'perfectionism': {
    id: 'perfectionism',
    vehicle: 'invisible refinements — the slide tweaked, the email re-read, the spreadsheet aligned',
    hides: 'a need for control in a domain where control still feels possible',
    social_acceptability: 8,
    body_evidence_marker: 'the cursor hovers; a small change is made nobody asked for',
  },
  'social-energy-simulation': {
    id: 'social-energy-simulation',
    vehicle: 'a generated warmth at the dinner / the meeting / the school gate, on cue, on tone, on time',
    hides: 'a body that has had no energy of its own since 14:30 yesterday',
    social_acceptability: 7,
    body_evidence_marker: 'the tone is up; the shoulders are not',
  },
};

const STATE_TO_CAMOUFLAGE: Record<string, CamouflageChannelId[]> = {
  'silent-burnout':                  ['productivity', 'efficiency', 'politeness'],
  'overwhelmed-founder':             ['efficiency', 'productivity', 'social-energy-simulation'],
  'startup-burnout':                 ['productivity', 'efficiency'],
  'overconnected-exhaustion':        ['efficiency', 'politeness'],
  'unread-messages-anxiety':         ['efficiency'],
  'social-load-exhaustion':          ['humor', 'social-energy-simulation', 'caretaking'],
  'parent-overload':                 ['caretaking', 'social-energy-simulation'],
  'partner-overload':                ['caretaking', 'politeness'],
  'overstimulated-office':           ['efficiency', 'productivity'],
  'workday-blur':                    ['productivity', 'efficiency'],
  'before-meeting-panic':            ['perfectionism', 'efficiency'],
  'mentally-absent':                 ['social-energy-simulation', 'humor'],
  'emotionally-drained':             ['politeness', 'caretaking'],
  'phone-during-family':             ['social-energy-simulation'],
  'sunday-anxiety':                  ['perfectionism', 'productivity'],
  'late-afternoon-collapse':         ['efficiency', 'productivity'],
  'always-on-anxiety':               ['efficiency'],
};

const CORE_TO_CAMOUFLAGE: Partial<Record<string, CamouflageChannelId>> = {
  'silent-burnout':                 'productivity',
  'invisible-pressure':             'efficiency',
  'performance-pressure':           'efficiency',
  'social-mask-fatigue':            'humor',
  'caretaker-fatigue':              'caretaking',
  'productivity-identity':          'productivity',
  'always-improving':               'perfectionism',
  'hidden-anxiety':                 'perfectionism',
};

export interface EmotionalCamouflageReading {
  primary: CamouflageChannelRecord | null;
  secondary: CamouflageChannelRecord | null;
  /** 0..10 — how much emotion is being routed through camouflage. */
  concealment_intensity: number;
  /** 0..10 — how invisible the camouflage is to the room. */
  social_readability: number;
  /** 0..10 — how likely the body underneath is actually exhausted. */
  hidden_exhaustion_probability: number;
  /** True when the truth catches the body-evidence marker for the
   *  primary camouflage channel. */
  body_marker_visible: boolean;
  /** True when the truth describes the camouflage from above (analytic
   *  voice) rather than catching it mid-action. */
  too_analytic: boolean;
  notes: string[];
}

export interface EmotionalCamouflageInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

const ANALYTIC_VOICE = /\b(camouflage|conceal(s|ed|ing|ment)?|mask(ing)?|hides? (her|his|their)?|covers? up|behind the|underneath|secretly|inside they)\b/i;
const BODY_MARKER_VOCAB = /\b(laugh|joke|reply|sent|deck|email|inbox|tidy|thank you|of course|happy to|cursor|slide|email|host(s|ed|ing)?|tone|shoulders|eyes|smile)\b/i;

export function readEmotionalCamouflage(input: EmotionalCamouflageInput): EmotionalCamouflageReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: CamouflageChannelId[] = [];
  for (const id of STATE_TO_CAMOUFLAGE[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_CAMOUFLAGE[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }

  const primary = candidates[0] ? EMOTIONAL_CAMOUFLAGE[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? EMOTIONAL_CAMOUFLAGE[candidates[1]]
    : null;

  const text = truth.truth;
  const too_analytic = ANALYTIC_VOICE.test(text);
  const body_marker_visible = BODY_MARKER_VOCAB.test(text);

  // Concealment intensity — strong with primary + body marker.
  let concealment_intensity = 0;
  if (primary) concealment_intensity += 5;
  if (secondary) concealment_intensity += 1.5;
  if (body_marker_visible) concealment_intensity += 2;
  if (too_analytic) concealment_intensity -= 3;
  concealment_intensity = clamp10(concealment_intensity);

  // Social readability — comes from the channel's social_acceptability.
  let social_readability = primary?.social_acceptability ?? 0;
  if (too_analytic) social_readability = Math.max(0, social_readability - 4);

  // Hidden exhaustion probability — strong when the state family is
  // depletion-flavored AND a camouflage channel matched.
  let hidden_exhaustion_probability = 0;
  if (primary) {
    switch (state.family) {
      case 'fatigue':          hidden_exhaustion_probability = 9; break;
      case 'collapse':         hidden_exhaustion_probability = 9; break;
      case 'numbness':         hidden_exhaustion_probability = 8; break;
      case 'pressure':         hidden_exhaustion_probability = 8; break;
      case 'overstimulation':  hidden_exhaustion_probability = 7; break;
      case 'paralysis':        hidden_exhaustion_probability = 7; break;
      case 'avoidance':        hidden_exhaustion_probability = 6; break;
      case 'fragmentation':    hidden_exhaustion_probability = 6; break;
    }
  }

  if (primary) {
    notes.push(`camouflage channel: ${primary.id} via "${primary.vehicle}"`);
    notes.push(`body tell: "${primary.body_evidence_marker}"`);
  } else {
    notes.push('no camouflage channel matched — banner shows emotion through its own surface');
  }
  if (too_analytic) {
    notes.push('WARNING: truth uses analytic voice (names the mask) — banner becomes explained, not photographed');
  }
  if (concealment_intensity >= 7 && body_marker_visible) {
    notes.push('camouflage caught mid-execution by a body-evidence marker — the photograph is doing the work');
  }

  return {
    primary,
    secondary,
    concealment_intensity,
    social_readability,
    hidden_exhaustion_probability,
    body_marker_visible,
    too_analytic,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
