/**
 * VISUAL COGNITION LAYER (Phase 30 — Wave 2: Reality Execution)
 *
 * The system must begin to SEE — not generate images, see them. This
 * module synthesises the Phase 30 sensors (frame intelligence,
 * emotional geometry, product gravity, visual silence, human eye
 * flow) into one visual-cognition reading.
 *
 * Meta-critic question: "Could this frame exist before the
 * advertisement?"
 */

import type { CompositionPlan, CreativeDirection, ImageBrief } from '@/core/types';
import { readFrameIntelligence } from './frameIntelligence';
import { readEmotionalGeometry, type GeometryMood } from './emotionalGeometry';
import { readProductGravity } from './productGravity';
import { readVisualSilence } from './visualSilence';
import { readHumanEyeFlow } from './humanEyeFlow';

export interface VisualCognitionReading {
  frameObservedScore: number;
  emotionalGeometry: GeometryMood;
  silenceIsEmotional: boolean;
  eyeFlowCoherence: number;
  productBelongsToWorld: number;
  visualTension: number;
  realismScore: number;
  overDesignRisk: number;
  aiCompositionRisk: number;
  /** True when the frame reads as observed, not assembled. */
  frame_is_seen: boolean;
  recommendedFrameAdjustment: string | null;
  notes: string[];
}

export interface VisualCognitionInput {
  composition: CompositionPlan;
  direction: CreativeDirection;
  brief: ImageBrief;
}

export function readVisualCognition(input: VisualCognitionInput): VisualCognitionReading {
  const { composition, direction, brief } = input;
  const notes: string[] = [];

  const frame = readFrameIntelligence({ composition, direction, brief });
  const geometry = readEmotionalGeometry({ composition });
  const product = readProductGravity({ composition, direction });
  const silence = readVisualSilence({ composition, direction });
  const eyeFlow = readHumanEyeFlow({ composition });

  const realismScore = round1((frame.observed_score + product.belongs_to_world) / 2);
  const overDesignRisk = round1((frame.assembled_risk + (geometry.asymmetry_is_human < 5 ? 4 : 0)) / 1.4);
  const visualTension = round1(Math.min(10,
    geometry.geometry_meaning * 0.5 + silence.silence_function * 0.3 + eyeFlow.flow_coherence * 0.2));

  const frame_is_seen =
    frame.could_exist_before_the_ad &&
    geometry.meaning_before_copy &&
    product.has_physical_logic &&
    !eyeFlow.flow_collapses;

  let recommendedFrameAdjustment: string | null = null;
  if (!frame.could_exist_before_the_ad) recommendedFrameAdjustment = 'add real imperfection and move the focal off-centre — the frame feels assembled';
  else if (!product.has_physical_logic) recommendedFrameAdjustment = 'rest the product in the scene physics — it currently reads pasted';
  else if (!silence.silence_is_emotional && silence.silence_amount >= 5) recommendedFrameAdjustment = 'give the negative space an emotional function — it is empty, not silent';
  else if (eyeFlow.flow_collapses) recommendedFrameAdjustment = 'rebuild the eye path — the flow collapses';

  notes.push(`visual cognition: ${frame_is_seen ? 'the frame is SEEN (observed, meaningful, eye flows)' : 'the frame is ASSEMBLED'} — realism ${realismScore}/10, over-design ${overDesignRisk}/10`);
  notes.push(...frame.notes, ...geometry.notes, ...product.notes, ...silence.notes, ...eyeFlow.notes);

  return {
    frameObservedScore: frame.observed_score,
    emotionalGeometry: geometry.geometry_mood,
    silenceIsEmotional: silence.silence_is_emotional,
    eyeFlowCoherence: eyeFlow.flow_coherence,
    productBelongsToWorld: product.belongs_to_world,
    visualTension,
    realismScore,
    overDesignRisk,
    aiCompositionRisk: frame.ai_composition_risk,
    frame_is_seen,
    recommendedFrameAdjustment,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
