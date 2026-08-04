/**
 * ATTENTION PHYSICS ENGINE (Phase 29 — Wave 2: Reality Execution)
 *
 * Understands why humans stop. Not because something is loud —
 * because something interrupts an internal pattern. This module
 * synthesises the four Phase 29 sensors into one attention reading.
 *
 * Meta-critic question: "Does this stop attention because it is true,
 * or because it is loud?"
 *
 * True attention = internal recognition + visual interruption +
 * unresolved tension. Loud / contrast / size are NOT attention.
 */

import type { CompositionPlan, CreativeDirection, HumanTruth, VisualPsychology } from '@/core/types';
import type { Reaction } from './humanReaction';
import type { GravityReading } from './visualGravity';
import { readScrollStopMechanics } from './scrollStopMechanics';
import { readFirstSecondRecognition } from './firstSecondRecognition';
import { readVisualInterruptionMap } from './visualInterruptionMap';
import { readCognitiveEntryPoint } from './cognitiveEntryPoint';

export interface AttentionPhysicsReading {
  firstGlanceAnchor: CreativeDirection['focalPoint'];
  recognitionDelay: number | null;
  scrollStopProbability: number;
  emotionalInterruption: number;
  attentionLeakage: number;
  cognitiveEntryHuman: boolean;
  threeSecondResidue: number;
  /** 0..10 — overall attention risk (higher = worse). */
  attentionRisk: number;
  /** True when attention is earned by truth, not loudness. */
  attention_is_true: boolean;
  /** True when attention relies on loudness / size only. */
  attention_is_loud: boolean;
  notes: string[];
}

export interface AttentionPhysicsInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  psychology: VisualPsychology | null;
  gravity: GravityReading | null;
  at_0_3s: Reaction;
  at_1s: Reaction;
  at_3s: Reaction;
}

export function readAttentionPhysics(input: AttentionPhysicsInput): AttentionPhysicsReading {
  const { truth, direction, composition, psychology, gravity, at_0_3s, at_1s, at_3s } = input;
  const notes: string[] = [];

  const scrollStop = readScrollStopMechanics({ truth, direction, reactionAt03s: at_0_3s });
  const recognition = readFirstSecondRecognition({ at_0_3s, at_1s, at_3s });
  const interruption = readVisualInterruptionMap({ composition, direction, gravity });
  const entry = readCognitiveEntryPoint({ composition, direction, psychology });

  const emotionalInterruption = round1((interruption.true_interruption + recognition.recognition_speed) / 2);

  const attention_is_true =
    scrollStop.interruption_is_true &&
    recognition.has_first_second_hook &&
    interruption.true_interruption >= 5 &&
    !interruption.product_as_interruption;

  const attention_is_loud =
    scrollStop.relies_on_loudness ||
    interruption.product_as_interruption ||
    (interruption.loud_interruption >= 6 && interruption.true_interruption < 5);

  // Attention risk — higher is worse.
  let attentionRisk = 0;
  if (attention_is_loud) attentionRisk += 5;
  if (!recognition.has_first_second_hook) attentionRisk += 3;
  attentionRisk += interruption.attention_leakage * 0.2;
  attentionRisk += entry.cognitive_friction * 0.15;
  if (attention_is_true) attentionRisk = Math.max(0, attentionRisk - 3);
  attentionRisk = round1(Math.min(10, attentionRisk));

  notes.push(`attention physics: ${attention_is_true ? 'TRUE attention (recognition + interruption + tension)' : attention_is_loud ? 'LOUD attention (size / contrast / product)' : 'weak attention'} — risk ${attentionRisk}/10`);
  notes.push(...scrollStop.notes, ...recognition.notes, ...interruption.notes, ...entry.notes);

  return {
    firstGlanceAnchor: entry.first_glance_anchor,
    recognitionDelay: recognition.recognition_delay,
    scrollStopProbability: scrollStop.scroll_stop_probability,
    emotionalInterruption,
    attentionLeakage: interruption.attention_leakage,
    cognitiveEntryHuman: entry.human_entry,
    threeSecondResidue: recognition.three_second_residue,
    attentionRisk,
    attention_is_true,
    attention_is_loud,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
