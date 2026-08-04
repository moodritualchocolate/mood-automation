/**
 * FRAME INTELLIGENCE (Phase 30 — Visual Cognition / Wave 2)
 *
 * The system must begin to SEE a frame, not generate one. Frame
 * intelligence asks the Phase 30 question: "Could this frame exist
 * before the advertisement?" — does it feel observed, or assembled?
 */

import type { CompositionPlan, CreativeDirection, ImageBrief } from '@/core/types';

export interface FrameIntelligenceReading {
  /** 0..10 — how observed (vs assembled) the frame feels. */
  observed_score: number;
  /** 0..10 — how assembled / designed the frame feels (higher = worse). */
  assembled_risk: number;
  /** 0..10 — how AI-composed the frame reads (higher = worse). */
  ai_composition_risk: number;
  /** True when the frame could exist before the advertisement. */
  could_exist_before_the_ad: boolean;
  notes: string[];
}

export interface FrameIntelligenceInput {
  composition: CompositionPlan;
  direction: CreativeDirection;
  brief: ImageBrief;
}

export function readFrameIntelligence(input: FrameIntelligenceInput): FrameIntelligenceReading {
  const { composition, direction, brief } = input;
  const notes: string[] = [];

  // Observed: the brief carries real imperfections; the focal is off
  // centre; restraint is high.
  const imperfectionCount = brief.imperfections.length;
  const f = composition.focal;
  const offCentre = Math.abs((f.x + f.w / 2) - 0.5) > 0.1 || Math.abs((f.y + f.h / 2) - 0.5) > 0.1;
  const highRestraint = direction.restraint >= 0.6;

  let observed_score = 4;
  if (imperfectionCount >= 3) observed_score += 3;
  else if (imperfectionCount >= 1) observed_score += 1.5;
  if (offCentre) observed_score += 1.5;
  if (highRestraint) observed_score += 1;
  observed_score = Math.min(10, round1(observed_score));

  // Assembled: dead-centred focal + no imperfections + loud typography.
  let assembled_risk = 0;
  if (!offCentre) assembled_risk += 3;
  if (imperfectionCount === 0) assembled_risk += 3;
  if (direction.typographyDominance === 'loud') assembled_risk += 2;
  if (direction.layoutFamily === 'editorial-page' && !offCentre) assembled_risk += 1;
  assembled_risk = Math.min(10, assembled_risk);

  // AI composition: perfect symmetry + balanced everything.
  const ai_composition_risk = (!offCentre && imperfectionCount === 0)
    ? 7 : (!offCentre || imperfectionCount === 0) ? 4 : 2;

  const could_exist_before_the_ad = observed_score >= 6 && assembled_risk < 6;

  notes.push(`frame intelligence: observed ${observed_score}/10, assembled ${assembled_risk}/10, AI-composition ${ai_composition_risk}/10`);
  if (!could_exist_before_the_ad) notes.push('frame intelligence: this frame could NOT exist before the advertisement — it feels assembled');

  return { observed_score, assembled_risk, ai_composition_risk, could_exist_before_the_ad, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
