/**
 * IDENTITY PERSISTENCE ENGINE (Phase 34 — Wave 2: Reality Execution)
 *
 * Protects the brand's soul across execution. Synthesises the Phase
 * 34 sensors (brand truth core, tone integrity, visual identity
 * memory, emotional signature) into one identity reading.
 *
 * Meta-critic question: "Is this still unmistakably MOOD, even
 * without the logo?"
 */

import type { CreativeDirection, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { EmotionalTraceEntry } from './humanMemory';
import { checkBrandTruth } from './brandTruthCore';
import { readToneIntegrity } from './toneIntegrity';
import { readVisualIdentityMemory } from './visualIdentityMemory';
import { readEmotionalSignature } from './emotionalSignature';

export interface IdentityPersistenceReading {
  brandAlignment: number;
  toneIntegrity: number;
  emotionalSignatureStrength: number;
  visualIdentityContinuity: number;
  violatedRefusals: string[];
  /** 0..10 — overall identity risk (higher = worse). */
  identityRisk: number;
  /** True when the banner is still unmistakably MOOD. */
  still_unmistakably_mood: boolean;
  /** A correction instruction when identity has drifted. */
  identityCorrection: string | null;
  notes: string[];
}

export interface IdentityPersistenceInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  emotionalCore: EmotionalCore | null;
  trail: EmotionalTraceEntry[];
  recognition: number;
  nonPerformative: number;
  emergence: number;
  copyText?: string;
}

export function readIdentityPersistence(input: IdentityPersistenceInput): IdentityPersistenceReading {
  const { truth, direction, emotionalCore, trail, recognition, nonPerformative, emergence, copyText } = input;
  const notes: string[] = [];

  const brand = checkBrandTruth({ truth, copyText });
  const tone = readToneIntegrity({ truth, direction, copyText });
  const visual = readVisualIdentityMemory({ direction, trail });
  const signature = readEmotionalSignature({ truth, emotionalCore, recognition, nonPerformative, emergence });

  const identityRisk = round1(Math.min(10,
    (brand.violates_brand_truth ? 4 : 0) +
    (10 - tone.tone_integrity) * 0.3 +
    (10 - signature.signature_strength) * 0.3 +
    (visual.visual_drift ? 2 : 0)));

  const still_unmistakably_mood =
    !brand.violates_brand_truth &&
    tone.tone_integrity >= 5 &&
    signature.unmistakably_mood &&
    !signature.feels_replaceable;

  let identityCorrection: string | null = null;
  if (brand.violates_brand_truth) {
    identityCorrection = `pull back from what MOOD refuses to become: ${brand.violated_refusals.join(', ')}`;
  } else if (tone.generic_wellness_tone) {
    identityCorrection = 'the tone has drifted into generic wellness — restore the restrained, non-performative MOOD voice';
  } else if (signature.feels_replaceable) {
    identityCorrection = 'the banner feels replaceable — sharpen the tension and the recognition until it is unmistakably MOOD';
  } else if (visual.visual_drift) {
    identityCorrection = 'the visual signature drifts — return toward the campaign\'s established layout language';
  }

  notes.push(`identity persistence: ${still_unmistakably_mood ? 'still unmistakably MOOD' : 'identity at risk'} (risk ${identityRisk}/10)`);
  notes.push(...brand.notes, ...tone.notes, ...visual.notes, ...signature.notes);

  return {
    brandAlignment: brand.brand_alignment,
    toneIntegrity: tone.tone_integrity,
    emotionalSignatureStrength: signature.signature_strength,
    visualIdentityContinuity: visual.visual_continuity,
    violatedRefusals: brand.violated_refusals,
    identityRisk,
    still_unmistakably_mood,
    identityCorrection,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
