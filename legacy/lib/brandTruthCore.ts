/**
 * BRAND TRUTH CORE (Phase 34 — Identity Persistence / Wave 2)
 *
 * The fixed emotional philosophy of MOOD / ENERGY. Wave 2 puts the
 * brand into execution and execution drifts — so the brand truth core
 * is the constant the system measures every output against.
 *
 * Critically: the brand truth core knows what MOOD REFUSES TO BECOME.
 */

import type { HumanTruth } from '@/core/types';

export interface BrandTruthCore {
  emotionalPhilosophy: string[];
  productRole: string;
  ritualMeaning: string;
  refusesToBecome: string[];
}

export const BRAND_TRUTH_CORE: BrandTruthCore = {
  emotionalPhilosophy: [
    'emotional atmosphere over product features',
    'recognition over persuasion',
    'restraint over hype',
    'the small true moment over the big aspirational one',
    'observed human reality, never an idealised one',
  ],
  productRole: 'a real chocolate, present as a quiet object in a real moment — never a drug, never a fix, never a hack',
  ritualMeaning: 'a small honest pause, not an optimisation and not a reward to be earned',
  refusesToBecome: [
    'supplement hype',
    'TikTok wellness',
    'fake mental-health content',
    'luxury performance aesthetic',
    'influencer wellness',
    'generic chocolate brand',
    'productivity-drug narrative',
  ],
};

export interface BrandTruthCheckReading {
  /** 0..10 — how aligned the candidate is with the brand truth core. */
  brand_alignment: number;
  /** Which "refuses to become" categories the candidate drifted toward. */
  violated_refusals: string[];
  /** True when the candidate violates the brand truth core. */
  violates_brand_truth: boolean;
  notes: string[];
}

const REFUSAL_PATTERNS: Array<[string, RegExp]> = [
  ['supplement hype', /\b(supplement|dose|formula|nootropic|boost your|fuel your)\b/i],
  ['TikTok wellness', /\b(that girl|soft girl|wellness era|romanticis(e|ing) (my|your))\b/i],
  ['fake mental-health content', /\b(mental health journey|healing era|trauma|therapy[- ]?speak|inner child)\b/i],
  ['luxury performance aesthetic', /\b(luxur(y|ious)|elevate your|indulge|premium experience|treat yourself)\b/i],
  ['influencer wellness', /\b(my routine|link in bio|use my code|sponsored|that wellness)\b/i],
  ['productivity-drug narrative', /\b(productivity hack|get more done|unlock focus|peak performance|grind)\b/i],
];

export interface BrandTruthCheckInput {
  truth: HumanTruth;
  /** Optional copy / tone text to also screen. */
  copyText?: string;
}

export function checkBrandTruth(input: BrandTruthCheckInput): BrandTruthCheckReading {
  const { truth, copyText } = input;
  const notes: string[] = [];
  const hay = `${truth.truth} ${truth.tension} ${copyText ?? ''}`;

  const violated_refusals: string[] = [];
  for (const [name, rx] of REFUSAL_PATTERNS) {
    if (rx.test(hay)) violated_refusals.push(name);
  }

  const violates_brand_truth = violated_refusals.length > 0;
  let brand_alignment = 8;
  brand_alignment -= violated_refusals.length * 3;
  brand_alignment = Math.max(0, Math.min(10, brand_alignment));

  if (violates_brand_truth) {
    notes.push(`brand truth core: the candidate drifts toward what MOOD refuses to become — ${violated_refusals.join(', ')}`);
  } else {
    notes.push('brand truth core: aligned — the candidate is within the brand\'s emotional philosophy');
  }

  return { brand_alignment, violated_refusals, violates_brand_truth, notes };
}
