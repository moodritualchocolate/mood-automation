/**
 * ATTACHMENT LOOPS (Phase 22)
 *
 * Modern humans form attachments to OBJECTS, GESTURES, and SMALL
 * TIME-WINDOWS that act as emotional anchors. The morning cup at
 * 06:42. The specific mug. The walk-around-the-block-before-bed.
 * The shower at 22:14. The five minutes alone in the car.
 *
 * The engine watches for these attachments and answers: is the
 * subject's daily wellbeing partially dependent on this specific
 * anchor, and what happens if it is not available?
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type AttachmentObjectId =
  | 'morning-cup'
  | 'specific-mug'
  | 'walk-before-bed'
  | 'evening-shower'
  | 'five-minutes-in-the-car'
  | 'one-specific-song'
  | 'one-specific-corner-of-the-couch'
  | 'one-specific-podcast-voice'
  | 'one-specific-pillow'
  | 'one-specific-window-view';

export interface AttachmentObjectRecord {
  id: AttachmentObjectId;
  the_object_or_window: string;
  what_it_anchors: string;
  what_happens_without_it: string;
}

export const ATTACHMENT_LIBRARY: Record<AttachmentObjectId, AttachmentObjectRecord> = {
  'morning-cup': {
    id: 'morning-cup',
    the_object_or_window: 'the first cup of the day, at the kitchen counter, before anyone else is up',
    what_it_anchors: 'the only window in the day that is not allocated',
    what_happens_without_it: 'the day starts mid-stream instead of starting',
  },
  'specific-mug': {
    id: 'specific-mug',
    the_object_or_window: 'the mug with the chip on the rim',
    what_it_anchors: 'a small physical continuity across a week of disorder',
    what_happens_without_it: 'a small flat note the subject does not name',
  },
  'walk-before-bed': {
    id: 'walk-before-bed',
    the_object_or_window: 'the loop around the block at 22:14, with or without the dog',
    what_it_anchors: 'the transition phase the bedroom does not provide',
    what_happens_without_it: 'sleep arrives without decompression',
  },
  'evening-shower': {
    id: 'evening-shower',
    the_object_or_window: 'the shower at 22:14, in the dark, fourteen minutes',
    what_it_anchors: 'a physical resetting of the day',
    what_happens_without_it: 'the day carries into the bed',
  },
  'five-minutes-in-the-car': {
    id: 'five-minutes-in-the-car',
    the_object_or_window: 'the parked-car silence between work and home',
    what_it_anchors: 'a buffer between two performances',
    what_happens_without_it: 'one role bleeds into the other',
  },
  'one-specific-song': {
    id: 'one-specific-song',
    the_object_or_window: 'a track the subject puts on when something is hard',
    what_it_anchors: 'an external nervous-system regulator',
    what_happens_without_it: 'the body sits with the dysregulation longer',
  },
  'one-specific-corner-of-the-couch': {
    id: 'one-specific-corner-of-the-couch',
    the_object_or_window: 'the left corner of the couch with the blanket folded a specific way',
    what_it_anchors: 'a body-shape that the body recognises as safe',
    what_happens_without_it: 'a small disorientation in the evening',
  },
  'one-specific-podcast-voice': {
    id: 'one-specific-podcast-voice',
    the_object_or_window: 'one voice the subject reaches for when chores need doing',
    what_it_anchors: 'company without obligation',
    what_happens_without_it: 'the chores feel longer',
  },
  'one-specific-pillow': {
    id: 'one-specific-pillow',
    the_object_or_window: 'the older pillow, never the new one',
    what_it_anchors: 'sleep-onset reliability',
    what_happens_without_it: 'restlessness for the first twenty minutes',
  },
  'one-specific-window-view': {
    id: 'one-specific-window-view',
    the_object_or_window: 'the kitchen window at the specific hour the light hits',
    what_it_anchors: 'a small daily aesthetic the body has come to depend on',
    what_happens_without_it: 'a flat day with no flagged moment',
  },
};

const STATE_TO_ATTACHMENT: Record<string, AttachmentObjectId[]> = {
  'silent-burnout':                  ['morning-cup', 'evening-shower'],
  'overwhelmed-founder':             ['five-minutes-in-the-car', 'morning-cup'],
  'exhausted-commute':               ['five-minutes-in-the-car'],
  'parent-overload':                 ['morning-cup', 'evening-shower'],
  'partner-overload':                ['walk-before-bed'],
  'restless-night':                  ['one-specific-pillow', 'walk-before-bed'],
  'late-kitchen-silence':            ['one-specific-window-view'],
  'emotionally-drained':             ['one-specific-song', 'one-specific-corner-of-the-couch'],
};

export interface AttachmentLoopsReading {
  primary: AttachmentObjectRecord | null;
  /** 0..10 — how strongly the candidate banner has an attachment anchor. */
  attachment_strength: number;
  /** 0..10 — what the absence-cost would be. */
  absence_destabilisation: number;
  notes: string[];
}

export interface AttachmentLoopsInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readAttachmentLoops(input: AttachmentLoopsInput): AttachmentLoopsReading {
  const { state } = input;
  const notes: string[] = [];
  const id = STATE_TO_ATTACHMENT[state.id]?.[0] ?? null;
  const primary = id ? ATTACHMENT_LIBRARY[id] : null;
  const attachment_strength = primary ? 7 : 0;
  const absence_destabilisation = primary ? 6 : 0;
  if (primary) notes.push(`attachment anchor: ${primary.id} — anchors "${primary.what_it_anchors}"`);
  return { primary, attachment_strength, absence_destabilisation, notes };
}
