/**
 * THE ATTENTION PHYSICIST (Wave 5 — Cognitive Council entity)
 *
 * Defends TRUE attention. The Attention Physicist holds one
 * conviction without compromise: loud is not attention. It objects to
 * any banner that stops a scroll by size, contrast, or product rather
 * than by human recognition.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readAttentionPhysicistOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'true attention — internal recognition, not loudness';

  if (b.attentionIsLoud) {
    return makeOpinion('attention-physicist', priority, 'object', 8,
      'this stops attention by being loud, not by being true — loud is not attention; I object');
  }
  if (b.attentionIsTrue) {
    return makeOpinion('attention-physicist', priority, 'advocate', 8,
      'this is true attention — internal recognition plus a real interruption; the eye stops because the banner is true');
  }
  if (b.attentionRisk >= 6) {
    return makeOpinion('attention-physicist', priority, 'caution', 6.5,
      `attention risk is ${b.attentionRisk}/10 — the banner has no first-second hook; it will be scrolled past`);
  }
  return makeOpinion('attention-physicist', priority, 'caution', 5,
    `attention is weak but not loud — risk ${b.attentionRisk}/10; the interruption could be sharper`);
}
