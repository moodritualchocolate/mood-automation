/**
 * ATTENTION FRAGMENTATION (Phase 17)
 *
 * One of the defining emotional mechanics of modern life.
 *
 * The spec named five fragmentation patterns:
 *   interrupted focus
 *   multi-tab cognition
 *   partial-presence behavior
 *   stimulation switching
 *   inability to complete cognitive landing
 *
 * The engine scores how strongly the candidate banner captures one
 * or more of these patterns. It is a different abstraction from
 * Phase 14's avoidance (which detects substitution behaviour) and
 * Phase 9's emotional sequence (which tracks the campaign arc).
 *
 * Phase 17 specifically asks: "is the SUBJECT'S ATTENTION the thing
 * the camera is photographing — and is that attention fragmented?"
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalMicroMoment } from './culturalMemory';

export type FragmentationPattern =
  | 'interrupted-focus'
  | 'multi-tab-cognition'
  | 'partial-presence'
  | 'stimulation-switching'
  | 'inability-to-complete-cognitive-landing';

export interface FragmentationRecord {
  id: FragmentationPattern;
  description: string;
  observable_in_scene: string;
  what_it_costs: string;
}

export const FRAGMENTATION_LIBRARY: Record<FragmentationPattern, FragmentationRecord> = {
  'interrupted-focus': {
    id: 'interrupted-focus',
    description: 'a thought begins, is interrupted before completing, and never resumes',
    observable_in_scene: 'mid-action posture frozen — the body started something, the phone or screen interrupted, the body has not returned to the task',
    what_it_costs: 'thoughts started during the day, none of them finished',
  },
  'multi-tab-cognition': {
    id: 'multi-tab-cognition',
    description: 'the mind keeps multiple problems open at once, none receive full attention',
    observable_in_scene: 'multiple monitors / multiple tabs visible in frame; subject\'s eyes flick between surfaces',
    what_it_costs: 'attention spread too thin to consolidate into any actual finished work',
  },
  'partial-presence': {
    id: 'partial-presence',
    description: 'physically present but mentally elsewhere — the body is in the conversation, the mind is on tomorrow',
    observable_in_scene: 'eye-line off the social subject, expression off-tempo by half a beat',
    what_it_costs: 'the people in the room feel it; the subject loses the moment',
  },
  'stimulation-switching': {
    id: 'stimulation-switching',
    description: 'every pause is filled with another stimulus — feed, notification, browser tab, podcast',
    observable_in_scene: 'one device just closed, another already open',
    what_it_costs: 'no gap between thoughts long enough for a feeling to develop',
  },
  'inability-to-complete-cognitive-landing': {
    id: 'inability-to-complete-cognitive-landing',
    description: 'arrival is incomplete — the body got home, the mind is still at work; the mind got off, the body kept reaching',
    observable_in_scene: 'subject seated but coat still on, keys still in hand, bag still on shoulder',
    what_it_costs: 'the evening becomes a series of half-arrivals',
  },
};

const FAMILY_TO_PATTERNS: Record<HumanState['family'], FragmentationPattern[]> = {
  fragmentation:   ['interrupted-focus', 'multi-tab-cognition', 'stimulation-switching'],
  overstimulation: ['stimulation-switching', 'interrupted-focus'],
  pressure:        ['multi-tab-cognition', 'inability-to-complete-cognitive-landing'],
  paralysis:       ['interrupted-focus'],
  avoidance:       ['stimulation-switching'],
  fatigue:         ['inability-to-complete-cognitive-landing'],
  numbness:        ['partial-presence'],
  collapse:        ['inability-to-complete-cognitive-landing'],
};

const CORE_TO_PATTERNS: Partial<Record<string, FragmentationPattern>> = {
  'emotional-fragmentation':         'interrupted-focus',
  'overstimulation':                 'stimulation-switching',
  'overstimulated-but-flat':         'stimulation-switching',
  'digital-fatigue':                 'stimulation-switching',
  'inability-to-land':               'inability-to-complete-cognitive-landing',
  'emotional-numbness':              'partial-presence',
  'mentally-absent':                 'partial-presence',
  'silent-burnout':                  'multi-tab-cognition',
};

export interface FragmentationReading {
  patterns_detected: FragmentationRecord[];
  attention_fragmentation_score: number;  // 0..10
  /** True when fragmentation is the central mechanic of the banner. */
  is_centrally_fragmented: boolean;
  /** Hint for the image brief: where the fragmentation should show up. */
  briefHint: string | null;
  notes: string[];
}

export interface FragmentationInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  microMoment: CulturalMicroMoment | null;
}

export function readAttentionFragmentation(input: FragmentationInput): FragmentationReading {
  const { state, truth, emotionalCore, microMoment } = input;
  const notes: string[] = [];

  // Collect candidate patterns from state family + emotional core +
  // micro-moment fit.
  const candidateSet = new Set<FragmentationPattern>();
  for (const p of FAMILY_TO_PATTERNS[state.family] ?? []) candidateSet.add(p);
  if (emotionalCore) {
    const fromCore = CORE_TO_PATTERNS[emotionalCore.id];
    if (fromCore) candidateSet.add(fromCore);
  }
  // Micro-moment override: tabs-open scenes are multi-tab cognition;
  // overstimulated-tabs is stimulation switching.
  if (microMoment) {
    if (microMoment.state_id === 'overstimulated-tabs') candidateSet.add('multi-tab-cognition');
    if (microMoment.state_id === 'office-fluorescent') candidateSet.add('partial-presence');
    if (microMoment.state_id === 'car-after-work') candidateSet.add('inability-to-complete-cognitive-landing');
    if (microMoment.state_id === 'bed-scrolling') candidateSet.add('stimulation-switching');
  }

  // Truth-text overrides — explicit mentions.
  const text = truth.truth.toLowerCase();
  if (/\b(tab|tabs)\b/.test(text)) candidateSet.add('multi-tab-cognition');
  if (/\b(switch|switching|app)\b/.test(text)) candidateSet.add('stimulation-switching');
  if (/\b(interrupt|half-thought|unfinished)\b/.test(text)) candidateSet.add('interrupted-focus');
  if (/\b(home|car|driveway|engine|land|landed)\b/.test(text)) candidateSet.add('inability-to-complete-cognitive-landing');

  const patterns_detected = Array.from(candidateSet).map((id) => FRAGMENTATION_LIBRARY[id]);

  // Score: each pattern contributes ~3 up to 9; cap at 10.
  const attention_fragmentation_score = Math.min(10, patterns_detected.length * 2.8);
  const is_centrally_fragmented = attention_fragmentation_score >= 6;

  const briefHint = patterns_detected[0]?.observable_in_scene ?? null;

  if (patterns_detected.length === 0) notes.push('no fragmentation pattern detected — banner is about a continuous moment, not a fractured one');
  else notes.push(`patterns detected: ${patterns_detected.map((p) => p.id).join(', ')}`);

  return {
    patterns_detected,
    attention_fragmentation_score,
    is_centrally_fragmented,
    briefHint,
    notes,
  };
}
