/**
 * SOCIAL MASKING ENGINE (Phase 19)
 *
 * Phase 14's socialMasking measured the GAP between surface and
 * internal state. Phase 19 goes one layer deeper and CLASSIFIES the
 * mask: not "is there a mask", but WHICH KIND of mask, and what
 * THAT MASK is doing for the subject.
 *
 * The five classifications:
 *
 *   conscious                 — the subject knows they are performing
 *   survival                  — the body learned this performance to stay
 *                               socially safe; not chosen, not negotiable
 *   identity-preservation     — the mask exists to protect a SELF-IMAGE
 *                               ("strong person", "reliable parent")
 *   socially-trained          — the culture installed this performance —
 *                               "I'm good!", "no worries!" — the subject
 *                               does it without noticing it is a mask
 *   collapse-concealment      — explicit hiding of internal collapse —
 *                               the highest cost, the most cinematic
 *                               version, the one the camera should catch
 *
 * The point of Phase 19 is to begin photographing the PERFORMANCE
 * LAYER hiding collapse. The most psychologically true humans rarely
 * appear collapsed; they appear functional. The system must stop
 * asking "how does collapse look?" and start asking "how does
 * collapse continue functioning invisibly?"
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type MaskClassification =
  | 'conscious'
  | 'survival'
  | 'identity-preservation'
  | 'socially-trained'
  | 'collapse-concealment';

export type SocialMaskingEngineId =
  | 'im-good'
  | 'smiling-while-overloaded'
  | 'conversational-autopilot'
  | 'functioning-tone-under-exhaustion'
  | 'public-emotional-suppression'
  | 'efficient-response-under-collapse'
  | 'available-with-nothing-left'
  | 'present-with-empty-eyes'
  | 'on-tone-in-the-meeting'
  | 'parent-voice-when-depleted';

export interface SocialMaskingRecord {
  id: SocialMaskingEngineId;
  classification: MaskClassification;
  observable_surface: string;
  what_it_hides: string;
  social_cost_if_removed: string;
  camera_note: string;
}

export const SOCIAL_MASKING_LIBRARY: Record<SocialMaskingEngineId, SocialMaskingRecord> = {
  'im-good': {
    id: 'im-good',
    classification: 'socially-trained',
    observable_surface: '"I\'m good" / "all good" / "fine" — said evenly, without inflection',
    what_it_hides: 'every actual answer to "how are you" the subject has not given in months',
    social_cost_if_removed: 'an honest answer would derail the conversation and require explanation',
    camera_note: 'mouth speaking the phrase, eyes not aligned with the words',
  },
  'smiling-while-overloaded': {
    id: 'smiling-while-overloaded',
    classification: 'socially-trained',
    observable_surface: 'smile during meeting / dinner / school pickup, on-cue, well-timed',
    what_it_hides: 'a nervous system at ceiling; a body that has been waiting to drop the smile for hours',
    social_cost_if_removed: 'the room would notice and worry — which costs more energy than the smile',
    camera_note: 'smile present; eyes one half-beat behind',
  },
  'conversational-autopilot': {
    id: 'conversational-autopilot',
    classification: 'survival',
    observable_surface: 'the subject is talking; the sentences are coherent; nobody could tell the operator has left the room',
    what_it_hides: 'the subject is not present in the conversation; the body is running a prerecorded version',
    social_cost_if_removed: 'awkward silence — the social field expects continuity',
    camera_note: 'mouth moving, eyes unfocused, a half-millisecond delay between question and answer',
  },
  'functioning-tone-under-exhaustion': {
    id: 'functioning-tone-under-exhaustion',
    classification: 'survival',
    observable_surface: 'voice tone unchanged; sentences delivered; the meeting goes on; the slack reply went out in 90 seconds',
    what_it_hides: 'the subject has been at deficit for weeks; the tone is the last thing holding',
    social_cost_if_removed: 'a colleague would ask "are you okay?" — that question costs more than the performance',
    camera_note: 'tone steady; jaw doing the work the voice no longer can',
  },
  'public-emotional-suppression': {
    id: 'public-emotional-suppression',
    classification: 'collapse-concealment',
    observable_surface: 'composed face on the elevator, on the call, at the school pickup, at the family dinner',
    what_it_hides: 'a body that is about to cry, scream, or freeze — held back by the room being public',
    social_cost_if_removed: 'social rupture; the subject would have to explain, repair, recover — energy they do not have',
    camera_note: 'face composed; one micro-tell at the jaw or eyelid the camera catches if it is looking',
  },
  'efficient-response-under-collapse': {
    id: 'efficient-response-under-collapse',
    classification: 'collapse-concealment',
    observable_surface: 'replies under 90 seconds; emails closed; one-handed responses; "got it"',
    what_it_hides: 'the subject has not eaten today and is operating on residue alone',
    social_cost_if_removed: 'the team would notice — which would require an explanation the subject cannot give',
    camera_note: 'one thumb on the phone; the other hand bracing the table',
  },
  'available-with-nothing-left': {
    id: 'available-with-nothing-left',
    classification: 'identity-preservation',
    observable_surface: '"yes, of course" / "happy to" / "send it over" — said with the same warmth as the first time this week',
    what_it_hides: 'the subject is empty; the "yes" is keeping the identity of the helpful person intact',
    social_cost_if_removed: 'the identity (parent, partner, colleague, friend) the subject has built around being available collapses',
    camera_note: 'mouth saying "yes"; shoulders one inch lower than yesterday',
  },
  'present-with-empty-eyes': {
    id: 'present-with-empty-eyes',
    classification: 'survival',
    observable_surface: 'subject in the chair, nodding at the right beats, eye contact within socially acceptable range',
    what_it_hides: 'the subject is not in the conversation; the body is staffing the chair',
    social_cost_if_removed: 'the speaker would feel unheard; the subject does not have repair-capacity left',
    camera_note: 'eye contact present; the focus is two feet behind the speaker',
  },
  'on-tone-in-the-meeting': {
    id: 'on-tone-in-the-meeting',
    classification: 'conscious',
    observable_surface: 'voice perfectly calibrated to the room — neither too eager nor too flat — exactly what the moment asked for',
    what_it_hides: 'the subject KNOWS they are performing; they could feel the tonal calibration as it happened',
    social_cost_if_removed: 'professional credibility — perceived competence depends on this performance',
    camera_note: 'subject neutral; subject\'s own awareness of the performance is the second photograph',
  },
  'parent-voice-when-depleted': {
    id: 'parent-voice-when-depleted',
    classification: 'identity-preservation',
    observable_surface: '"sweetheart, just one minute" / "of course, baby" — soft tone, on-cue patience, with the kid for the third time in an hour',
    what_it_hides: 'the parent has been depleted since 06:00; the parent voice is the last thing holding the parent identity',
    social_cost_if_removed: 'the parent would become a person who snapped — the identity of "good parent" is what the voice is protecting',
    camera_note: 'tone gentle; eye contact with the kid; jaw at the edge of the smile',
  },
};

const STATE_TO_MASK: Record<string, SocialMaskingEngineId[]> = {
  'silent-burnout':                  ['im-good', 'efficient-response-under-collapse', 'on-tone-in-the-meeting'],
  'overconnected-exhaustion':        ['available-with-nothing-left', 'efficient-response-under-collapse'],
  'mentally-absent':                 ['present-with-empty-eyes', 'conversational-autopilot'],
  'social-load-exhaustion':          ['conversational-autopilot', 'smiling-while-overloaded'],
  'parent-overload':                 ['parent-voice-when-depleted', 'available-with-nothing-left'],
  'partner-overload':                ['available-with-nothing-left', 'public-emotional-suppression'],
  'overstimulated-office':           ['on-tone-in-the-meeting', 'functioning-tone-under-exhaustion'],
  'workday-blur':                    ['functioning-tone-under-exhaustion', 'efficient-response-under-collapse'],
  'before-meeting-panic':            ['public-emotional-suppression', 'on-tone-in-the-meeting'],
  'after-meeting-recovery':          ['present-with-empty-eyes'],
  'overwhelmed-founder':             ['on-tone-in-the-meeting', 'available-with-nothing-left'],
  'startup-burnout':                 ['functioning-tone-under-exhaustion', 'efficient-response-under-collapse'],
  'always-on-anxiety':               ['available-with-nothing-left'],
  'sunday-anxiety':                  ['public-emotional-suppression', 'im-good'],
  'late-afternoon-collapse':         ['functioning-tone-under-exhaustion'],
  'low-battery-feeling':             ['im-good', 'smiling-while-overloaded'],
  'unread-messages-anxiety':         ['efficient-response-under-collapse'],
  'emotionally-drained':             ['public-emotional-suppression', 'present-with-empty-eyes'],
};

const CORE_TO_MASK: Partial<Record<string, SocialMaskingEngineId>> = {
  'silent-burnout':                 'efficient-response-under-collapse',
  'invisible-pressure':             'on-tone-in-the-meeting',
  'hidden-anxiety':                 'public-emotional-suppression',
  'emotional-numbness':             'present-with-empty-eyes',
  'social-mask-fatigue':            'conversational-autopilot',
  'mentally-absent':                'present-with-empty-eyes',
  'performance-pressure':           'on-tone-in-the-meeting',
};

export interface SocialMaskingEngineReading {
  primary: SocialMaskingRecord | null;
  secondary: SocialMaskingRecord | null;
  classification: MaskClassification | null;
  /** 0..10 — overall mask-signature strength. */
  mask_signature_strength: number;
  /** 0..10 — does the truth observe the mask MID-PERFORMANCE? */
  mask_in_motion: number;
  /** 0..10 — is the mask BEHAVIORAL (observed in body) or SYMBOLIC (described as a feeling)? */
  behavioral_not_symbolic: number;
  /** True when the truth shows the camera-note marker the mask requires. */
  camera_catches_the_tell: boolean;
  /** True when the truth says the quiet part out loud — banner becomes
   *  too expressive, mask broken. */
  truth_reveals_too_much: boolean;
  notes: string[];
}

export interface SocialMaskingEngineInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

// Truth uses behavioral verbs in surface-action vocabulary — strong signal.
const BEHAVIORAL_SURFACE = /\b(reply(ies|ied|ing)?|smil(e|es|ed|ing)|nod(s|ded|ding)?|answer(s|ed|ing)?|laugh(s|ed|ing)?|attend(s|ed|ing)?|deliver(s|ed|ing)?|present(s|ed|ing)?|respond(s|ed|ing)?|post(s|ed|ing)?)\b/i;
// Truth uses self-revealing first-person vocabulary — mask broken.
const TOO_EXPRESSIVE = /\b(i can[' ]?t (anymore|do this)|i'm (broken|done|empty|drowning|falling apart)|i need help|i'm not okay|breaking|breakdown|tears|crying|sobbing|screaming)\b/i;
// Camera-tell vocabulary that suggests the photograph caught the giveaway.
const CAMERA_TELL = /\b(jaw|eyelid|micro|half[- ]beat|behind the eyes|two feet behind|one inch lower|shoulders dropped|tone steady)\b/i;

export function readSocialMaskingEngine(input: SocialMaskingEngineInput): SocialMaskingEngineReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: SocialMaskingEngineId[] = [];
  for (const id of STATE_TO_MASK[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_MASK[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }

  const primary = candidates[0] ? SOCIAL_MASKING_LIBRARY[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? SOCIAL_MASKING_LIBRARY[candidates[1]]
    : null;
  const classification = primary?.classification ?? null;

  const text = truth.truth;
  const usesBehavioralSurface = BEHAVIORAL_SURFACE.test(text);
  const truth_reveals_too_much = TOO_EXPRESSIVE.test(text);
  const camera_catches_the_tell = CAMERA_TELL.test(text);

  // Behavioral-not-symbolic.
  let behavioral_not_symbolic = 5;
  if (usesBehavioralSurface) behavioral_not_symbolic += 3;
  if (truth_reveals_too_much) behavioral_not_symbolic -= 3;
  behavioral_not_symbolic = clamp10(behavioral_not_symbolic);

  // Mask-in-motion — the truth catches the mask AS it is being worn.
  let mask_in_motion = 0;
  if (primary && usesBehavioralSurface) mask_in_motion += 6;
  if (primary && camera_catches_the_tell) mask_in_motion += 3;
  mask_in_motion = clamp10(mask_in_motion);

  // Mask signature strength.
  let mask_signature_strength = 0;
  if (primary) mask_signature_strength += 4;
  if (secondary) mask_signature_strength += 1.5;
  mask_signature_strength += (behavioral_not_symbolic / 10) * 2;
  mask_signature_strength += (mask_in_motion / 10) * 2;
  if (truth_reveals_too_much) mask_signature_strength -= 4;
  mask_signature_strength = clamp10(mask_signature_strength);

  if (primary) {
    notes.push(`mask: ${primary.id} (${primary.classification})`);
    notes.push(`hides: "${primary.what_it_hides}"`);
    notes.push(`camera: "${primary.camera_note}"`);
  } else {
    notes.push('no social mask identified — banner shows internal state without performance layer');
  }
  if (truth_reveals_too_much) notes.push('WARNING: truth is too expressive — the mask is broken; banner becomes performative-vulnerability');
  if (camera_catches_the_tell) notes.push('truth catches the camera-tell — banner photographs the moment the mask leaks');

  return {
    primary,
    secondary,
    classification,
    mask_signature_strength,
    mask_in_motion,
    behavioral_not_symbolic,
    camera_catches_the_tell,
    truth_reveals_too_much,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
