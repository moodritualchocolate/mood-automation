/**
 * BEHAVIOR LOOP ENGINE (Phase 18)
 *
 * Detects recurring behavioral loops humans repeat as survival
 * mechanics around modern pressure. Different from Phase 13's
 * invisibleStakes (which scored the COST) and Phase 14's
 * emotionalAvoidance (which scored the SUBSTITUTION) — Phase 18
 * scores the LOOP itself: its classification, its exit criteria,
 * and how staged-vs-automatic it reads.
 *
 * The classifications the spec named:
 *   conscious           — the subject knows they are doing it
 *   subconscious        — the body does it before the mind agrees
 *   compulsive          — the body cannot not do it
 *   recovery-seeking   — body trying to refill, often failing
 *   avoidance-based    — body trying to escape, often via stimulus
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type LoopClassification =
  | 'conscious'
  | 'subconscious'
  | 'compulsive'
  | 'recovery-seeking'
  | 'avoidance-based';

export type BehaviorLoopId =
  | 'doomscroll'
  | 'reopen-laptop'
  | 'refresh-inbox'
  | 'fake-break'
  | 'tab-switching'
  | 'kitchen-standing-without-purpose'
  | 'fridge-without-hunger'
  | 'phone-during-family'
  | 'one-more-thing-before-sleep'
  | 'lock-screen-pull'
  | 'reply-rehearsal'
  | 'pacing-without-destination';

export interface BehaviorLoop {
  id: BehaviorLoopId;
  classification: LoopClassification;
  loop_description: string;
  trigger_condition: string;
  exit_criteria: string;          // what (rarely) stops it
  invisible_mark: string;          // what the subject does NOT notice they are doing
}

export const BEHAVIOR_LOOPS: Record<BehaviorLoopId, BehaviorLoop> = {
  'doomscroll': {
    id: 'doomscroll',
    classification: 'compulsive',
    loop_description: 'open feed → scroll → close → reopen 90 seconds later',
    trigger_condition: 'any pause longer than 3 seconds',
    exit_criteria: 'an interruption from outside, never from inside',
    invisible_mark: 'the thumb keeps moving past content the eye stopped registering',
  },
  'reopen-laptop': {
    id: 'reopen-laptop',
    classification: 'avoidance-based',
    loop_description: 'close laptop → sit on couch → reopen within four minutes',
    trigger_condition: 'evening, body still keyed up, can\'t tolerate not-doing',
    exit_criteria: 'the body finally gives in, often only when sleep wins',
    invisible_mark: 'the subject would say they closed for the night',
  },
  'refresh-inbox': {
    id: 'refresh-inbox',
    classification: 'compulsive',
    loop_description: 'open inbox → no new mail → refresh → no new mail → tab away → return',
    trigger_condition: 'low-grade anxiety about being responsive',
    exit_criteria: 'a new email arrives',
    invisible_mark: 'the subject does not remember opening it the second time',
  },
  'fake-break': {
    id: 'fake-break',
    classification: 'recovery-seeking',
    loop_description: 'announce a break → bring phone → scroll for ten minutes → return depleted',
    trigger_condition: 'two hours of focused work that did not refill',
    exit_criteria: 'the break window ends',
    invisible_mark: 'the break left them with less than before',
  },
  'tab-switching': {
    id: 'tab-switching',
    classification: 'subconscious',
    loop_description: 'cmd-tab → cmd-tab → cmd-tab without destination',
    trigger_condition: 'thought stalls; the body refuses to sit with the stall',
    exit_criteria: 'an external interruption',
    invisible_mark: 'no task got progress; the keys moved anyway',
  },
  'kitchen-standing-without-purpose': {
    id: 'kitchen-standing-without-purpose',
    classification: 'subconscious',
    loop_description: 'walks to kitchen → stands → forgets why → leaves',
    trigger_condition: 'an unfinished thought that the body needed to be moving for',
    exit_criteria: 'remembers a small task; or gives up',
    invisible_mark: 'the trip itself was the point — the kitchen was an excuse',
  },
  'fridge-without-hunger': {
    id: 'fridge-without-hunger',
    classification: 'subconscious',
    loop_description: 'open fridge → look in → close fridge → walk away',
    trigger_condition: 'restlessness, not hunger',
    exit_criteria: 'the subject realises they were not hungry',
    invisible_mark: 'the body went looking for something not in the fridge',
  },
  'phone-during-family': {
    id: 'phone-during-family',
    classification: 'avoidance-based',
    loop_description: 'kid is talking → phone glance → kid still talking → glance again',
    trigger_condition: 'social load + low energy + need for micro-escape',
    exit_criteria: 'the kid says "are you listening"',
    invisible_mark: 'the subject would say they were present',
  },
  'one-more-thing-before-sleep': {
    id: 'one-more-thing-before-sleep',
    classification: 'avoidance-based',
    loop_description: 'lying down → "one more email" → "one more reply" → 23:47 still typing',
    trigger_condition: 'fear of stopping with anything undone',
    exit_criteria: 'the eyes close mid-sentence',
    invisible_mark: 'the next morning the work was already done; the lost sleep was not',
  },
  'lock-screen-pull': {
    id: 'lock-screen-pull',
    classification: 'compulsive',
    loop_description: 'pull down on lockscreen → no new notifications → swipe up → pull down again',
    trigger_condition: 'any silence > 90 seconds',
    exit_criteria: 'a notification arrives (small dopamine release)',
    invisible_mark: 'the subject did not realise they checked',
  },
  'reply-rehearsal': {
    id: 'reply-rehearsal',
    classification: 'conscious',
    loop_description: 'type → delete → type → delete → lock phone',
    trigger_condition: 'a reply that has no version that does not cost something',
    exit_criteria: 'the reply gets sent days later, or never',
    invisible_mark: 'the energy spent on the unsent reply was real',
  },
  'pacing-without-destination': {
    id: 'pacing-without-destination',
    classification: 'subconscious',
    loop_description: 'standing up → walking around the block of furniture → sitting down → standing up',
    trigger_condition: 'a thought that the body needs to be moving inside',
    exit_criteria: 'the thought completes, or exhaustion',
    invisible_mark: 'no destination, no observed reason, real energy spent',
  },
};

const STATE_TO_LOOPS: Record<string, BehaviorLoopId[]> = {
  'doomscroll-fatigue':             ['doomscroll', 'lock-screen-pull'],
  'exhausted-scrolling':             ['doomscroll', 'one-more-thing-before-sleep'],
  'constant-notifications':          ['lock-screen-pull'],
  'overconnected-exhaustion':        ['refresh-inbox', 'lock-screen-pull'],
  'too-many-tabs':                   ['tab-switching'],
  'tab-switching-paralysis':         ['tab-switching'],
  'attention-fragmentation':         ['tab-switching', 'lock-screen-pull'],
  'fake-productivity':               ['tab-switching', 'fake-break'],
  'forced-productivity':             ['reopen-laptop', 'fake-break'],
  'startup-burnout':                 ['reopen-laptop', 'one-more-thing-before-sleep'],
  'overwhelmed-founder':             ['reopen-laptop'],
  'unread-messages-anxiety':         ['reply-rehearsal'],
  'restless-work-energy':            ['pacing-without-destination'],
  'mentally-absent':                 ['phone-during-family'],
  'late-kitchen-silence':            ['kitchen-standing-without-purpose', 'fridge-without-hunger'],
  'late-afternoon-collapse':         ['fake-break'],
  'exhausted-but-wired':             ['one-more-thing-before-sleep', 'doomscroll'],
  'sunday-anxiety':                  ['refresh-inbox'],
};

const CORE_TO_LOOPS: Partial<Record<string, BehaviorLoopId>> = {
  'doomscrolling':                  'doomscroll',
  'digital-fatigue':                'lock-screen-pull',
  'too-tired-to-rest':              'one-more-thing-before-sleep',
  'revenge-bedtime-procrastination':'doomscroll',
  'silent-burnout':                 'reopen-laptop',
  'avoidance':                      'fake-break',
  'guilt':                          'reply-rehearsal',
  'emotional-fragmentation':        'tab-switching',
  'inability-to-land':              'pacing-without-destination',
  'overstimulated-but-flat':        'tab-switching',
};

export interface BehaviorLoopReading {
  primary_loop: BehaviorLoop | null;
  secondary_loop: BehaviorLoop | null;
  /** 0..10 — how strongly the candidate banner expresses a behavioral loop. */
  loop_signature_strength: number;
  /** True when the truth describes the LOOP itself, not the feeling. */
  truth_describes_loop: boolean;
  /** True when the loop reads as automatic (subconscious / compulsive). */
  is_automatic: boolean;
  notes: string[];
}

export interface BehaviorLoopInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

const LOOP_BEHAVIOR_PATTERNS = /\b(open(s|ed)?|close(s|d)?|refresh(es|ed)?|check(s|ed)?|reach(es|ed)?|scroll(s|ed|ing)?|switch(es|ed|ing)?|tap(s|ped)?|reopen(s|ed)?|type(s|d)?|delete(s|d)?|stand(s|ing)?|walk(s|ed|ing)?|pace(s|d)?|return(s|ed)?)\b/i;

export function readBehaviorLoop(input: BehaviorLoopInput): BehaviorLoopReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: BehaviorLoopId[] = [];
  for (const id of STATE_TO_LOOPS[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_LOOPS[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }

  const primary = candidates[0] ? BEHAVIOR_LOOPS[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? BEHAVIOR_LOOPS[candidates[1]]
    : null;

  // truth_describes_loop — does the truth contain BEHAVIORAL VERBS
  // (the loop), or just feeling words?
  const truth_describes_loop = LOOP_BEHAVIOR_PATTERNS.test(truth.truth);
  if (truth_describes_loop) notes.push('truth uses behavioral verbs — the loop itself is visible');

  // is_automatic — primary loop is subconscious or compulsive.
  const is_automatic = primary?.classification === 'subconscious' || primary?.classification === 'compulsive';

  // Score:
  let loop_signature_strength = 0;
  if (primary) loop_signature_strength += 5;
  if (truth_describes_loop) loop_signature_strength += 2.5;
  if (is_automatic) loop_signature_strength += 1.5;
  if (secondary) loop_signature_strength += 1;
  loop_signature_strength = Math.min(10, loop_signature_strength);

  if (primary) notes.push(`primary loop: ${primary.id} (${primary.classification})`);
  if (!primary) notes.push('no behavior loop matched');

  return {
    primary_loop: primary,
    secondary_loop: secondary,
    loop_signature_strength,
    truth_describes_loop,
    is_automatic,
    notes,
  };
}
