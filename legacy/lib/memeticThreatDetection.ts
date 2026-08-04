/**
 * MEMETIC THREAT DETECTION (Phase 79 — Wave 7: Reality Organism)
 *
 * Some cultural patterns are not opportunities — they are PATHOGENS.
 * A meme that would infect the organism, rewrite its voice, and make
 * it indistinguishable from every other brand is a memetic threat.
 * This module detects them before the organism touches them.
 */

import type { HumanTruth } from '@/core/types';

export interface MemeticThreat {
  id: string;
  pattern: RegExp;
  infection: string;
}

export const MEMETIC_THREATS: MemeticThreat[] = [
  { id: 'trend-format', pattern: /\b(pov:|tell me .* without|its giving|the ick|main character|core memory|delulu)\b/i, infection: 'the organism would speak in a borrowed trend format' },
  { id: 'engagement-bait', pattern: /\b(comment .* below|tag someone|wait for it|you won'?t believe|link in bio)\b/i, infection: 'the organism would adopt engagement-bait grammar' },
  { id: 'hype-vocabulary', pattern: /\b(game[- ]?changer|next level|unlock|level up|elite|insane|crazy good)\b/i, infection: 'the organism would absorb hype vocabulary' },
  { id: 'wellness-meme', pattern: /\b(romantici[sz]e your|that girl|soft life|healing era|protect your peace)\b/i, infection: 'the organism would mutate into a wellness-meme account' },
];

export interface MemeticThreatReading {
  threats: MemeticThreat[];
  /** 0..10 — total memetic infection pressure. */
  infection_pressure: number;
  /** True when a memetic threat would infect the organism's voice. */
  memetic_infection_risk: boolean;
  notes: string[];
}

export interface MemeticThreatInput {
  truth: HumanTruth;
  copyText?: string;
}

export function detectMemeticThreats(input: MemeticThreatInput): MemeticThreatReading {
  const { truth, copyText } = input;
  const notes: string[] = [];
  const hay = `${truth.truth} ${truth.tension} ${copyText ?? ''}`;

  const threats = MEMETIC_THREATS.filter((t) => t.pattern.test(hay));
  const infection_pressure = Math.min(10, threats.length * 3.5);
  const memetic_infection_risk = threats.length > 0;

  for (const t of threats) notes.push(`memetic threat: "${t.id}" — ${t.infection}`);
  if (!memetic_infection_risk) notes.push('memetic threat detection: clear — no memetic pathogen present');

  return { threats, infection_pressure, memetic_infection_risk, notes };
}
