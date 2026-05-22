/**
 * THE NARRATIVE ARCHITECT (Wave 5 — Cognitive Council entity)
 *
 * Defends the CAMPAIGN ARC. The Narrative Architect thinks in
 * lifecycles — it objects when a banner damages the arc, repeats an
 * exhausted direction, or fails to be a real creative decision.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readNarrativeArchitectOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'the campaign arc — every banner must move the story';

  if (b.lifecycleState === 'overexposed' || b.lifecycleState === 'emotionally-drained') {
    return makeOpinion('narrative-architect', priority, 'object', 8,
      `the campaign is "${b.lifecycleState}" — adding to this direction would damage the arc; it needs to evolve or rest`);
  }
  if (!b.isRealDecision) {
    return makeOpinion('narrative-architect', priority, 'object', 7.5,
      'this is not a real creative decision — no hypothesis, no rejected alternatives; it is an asset, not a move');
  }
  if (b.lifecycleState === 'identity-risk') {
    return makeOpinion('narrative-architect', priority, 'caution', 7,
      'the campaign is at identity-risk — the next move must repair the arc, not extend the drift');
  }
  if (b.campaignHealth >= 7) {
    return makeOpinion('narrative-architect', priority, 'advocate', 7.5,
      `the campaign is healthy (${b.campaignHealth}/10) and this is a real decision — it advances the arc`);
  }
  return makeOpinion('narrative-architect', priority, 'advocate', 5.5,
    `the arc holds — lifecycle "${b.lifecycleState}", health ${b.campaignHealth}/10`);
}
