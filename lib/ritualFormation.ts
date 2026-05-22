/**
 * RITUAL FORMATION (Phase 22)
 *
 * Different from Phase 18 ritualCompensation (the SUBSTITUTION
 * ritual that stands in for an unaddressed need). Phase 22 modules a
 * deeper question: how do rituals FORM in the first place, and is
 * the candidate banner photographing a ritual MID-FORMATION or a
 * ritual already complete?
 *
 * Stages of ritual formation:
 *   accident         — the body did the thing once because it happened
 *   association      — the body did the thing twice and noticed it helped
 *   stabilisation     — the body now does the thing on a small schedule
 *   identity         — the ritual is part of who the subject is
 *
 * The cinematic value of a ritual depends on its stage. A ritual in
 * "identity" is comfortable but not interesting; a ritual in
 * "association" is fragile and emotionally vivid.
 */

import type { HumanTruth } from '@/core/types';

export type RitualStage = 'accident' | 'association' | 'stabilisation' | 'identity';

export interface RitualFormationReading {
  detected_stage: RitualStage | null;
  /** 0..10 — how forming-vs-formed the ritual reads. Higher = forming. */
  in_formation_score: number;
  notes: string[];
}

export interface RitualFormationInput {
  truth: HumanTruth;
}

const ACCIDENT_LANGUAGE = /\b(first time|that one time|just once|happened to|by accident)\b/i;
const ASSOCIATION_LANGUAGE = /\b(noticed|again|the second time|started to|caught (myself|themselves|himself|herself))\b/i;
const STABILISATION_LANGUAGE = /\b(every (day|night|morning|sunday|friday)|always|usually|most (days|nights|mornings)|by now)\b/i;
const IDENTITY_LANGUAGE = /\b(my (ritual|morning|night|sunday)|i'?m the kind|this is how (i|they))\b/i;

export function readRitualFormation(input: RitualFormationInput): RitualFormationReading {
  const { truth } = input;
  const notes: string[] = [];
  const text = truth.truth;

  let detected_stage: RitualStage | null = null;
  if (IDENTITY_LANGUAGE.test(text)) detected_stage = 'identity';
  else if (STABILISATION_LANGUAGE.test(text)) detected_stage = 'stabilisation';
  else if (ASSOCIATION_LANGUAGE.test(text)) detected_stage = 'association';
  else if (ACCIDENT_LANGUAGE.test(text)) detected_stage = 'accident';

  const in_formation_score =
    detected_stage === 'accident'      ? 9 :
    detected_stage === 'association'   ? 8 :
    detected_stage === 'stabilisation' ? 4 :
    detected_stage === 'identity'      ? 2 : 0;

  if (detected_stage) notes.push(`ritual stage: ${detected_stage}`);
  else notes.push('no ritual-formation stage detected');

  return { detected_stage, in_formation_score, notes };
}
