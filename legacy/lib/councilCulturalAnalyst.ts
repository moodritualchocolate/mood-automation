/**
 * THE CULTURAL ANALYST (Wave 5 — Cognitive Council entity)
 *
 * Defends CULTURAL HONESTY and collective recognition. The Cultural
 * Analyst reads the climate the campaign is entering and objects when
 * the banner is culturally tone-deaf or contaminated by trend.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readCulturalAnalystOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'cultural honesty and collective recognition';

  if (b.viralContamination >= 5) {
    return makeOpinion('cultural-analyst', priority, 'object', 8,
      `viral contamination is ${b.viralContamination}/10 — the banner is borrowing trend language instead of speaking culture`);
  }
  if (b.worldStrained && b.culturalClimate.includes('exhausted')) {
    return makeOpinion('cultural-analyst', priority, 'caution', 7,
      `the cultural climate is "${b.culturalClimate}" — the banner must be quiet enough for it`);
  }
  if (b.collectiveRecognition >= 6) {
    return makeOpinion('cultural-analyst', priority, 'advocate', 7.5,
      `collective recognition is ${b.collectiveRecognition}/10 — this would land as "about us", not "about him"`);
  }
  if (b.collectiveRecognition < 4) {
    return makeOpinion('cultural-analyst', priority, 'caution', 6,
      `collective recognition is only ${b.collectiveRecognition}/10 — the banner reads individual, not cultural`);
  }
  return makeOpinion('cultural-analyst', priority, 'advocate', 5.5,
    `the banner is culturally sound — recognition ${b.collectiveRecognition}/10, climate "${b.culturalClimate}"`);
}
