/**
 * THE AUDIENCE INTERPRETER (Wave 5 — Cognitive Council entity)
 *
 * Defends the audience's REAL response. The Audience Interpreter
 * distrusts shallow engagement and advocates only when the audience
 * genuinely recognised itself.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readAudienceInterpreterOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'the audience\'s genuine recognition, not its reaction';

  if (!b.audienceHasFeedback) {
    return makeOpinion('audience-interpreter', priority, 'abstain', 4,
      'no audience feedback yet — I cannot speak for a response that has not happened; decide from memory');
  }
  if (b.responseCorruptsTruth) {
    return makeOpinion('audience-interpreter', priority, 'object', 8.5,
      'the audience response is shallow stimulation — chasing it would corrupt the campaign\'s truth');
  }
  if (b.audienceRecognisedItself && b.deepEngagement >= 5) {
    return makeOpinion('audience-interpreter', priority, 'advocate', 8,
      `the audience recognised itself — deep engagement ${b.deepEngagement}/10; this territory is true`);
  }
  if (b.shallowEngagement > b.deepEngagement + 2) {
    return makeOpinion('audience-interpreter', priority, 'caution', 6.5,
      `shallow engagement (${b.shallowEngagement}/10) outweighs deep (${b.deepEngagement}/10) — the audience reacted, it did not recognise`);
  }
  return makeOpinion('audience-interpreter', priority, 'advocate', 5.5,
    `the audience response is moderate — deep ${b.deepEngagement}/10, shallow ${b.shallowEngagement}/10`);
}
