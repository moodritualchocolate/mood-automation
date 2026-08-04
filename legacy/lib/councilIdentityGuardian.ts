/**
 * THE IDENTITY GUARDIAN (Wave 5 — Cognitive Council entity)
 *
 * Defends the brand's SOUL. The Identity Guardian is the most
 * uncompromising voice on the council — it will object loudly to any
 * banner that drifts toward what MOOD refuses to become, no matter
 * how well it performs.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readIdentityGuardianOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'the brand identity — what MOOD refuses to become';

  if (b.identityGovernanceBlocks) {
    return makeOpinion('identity-guardian', priority, 'object', 9.5,
      'identity governance blocks this — the banner is mutating the brand; I will not yield on this');
  }
  if (!b.exhaustedHumanTrust) {
    return makeOpinion('identity-guardian', priority, 'object', 8.5,
      'a real exhausted human would not trust this — it invites admiration of its aesthetics, not recognition');
  }
  if (b.identityRisk >= 5) {
    return makeOpinion('identity-guardian', priority, 'caution', 7,
      `identity risk is ${b.identityRisk}/10 — the MOOD voice is drifting and must be pulled back`);
  }
  return makeOpinion('identity-guardian', priority, 'advocate', 7.5,
    'identity is intact — a real exhausted human would trust this; the brand is unmistakably MOOD');
}
