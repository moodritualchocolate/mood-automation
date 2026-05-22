/**
 * THE WORLD-STATE OBSERVER (Wave 5 — Cognitive Council entity)
 *
 * Defends WORLD-AWARENESS. The Observer holds the model of the
 * psychological world outside the campaign and objects whenever the
 * banner enters that world blind.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readWorldStateObserverOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'world-awareness — the campaign must understand the world it enters';

  if (!b.campaignUnderstandsWorld) {
    return makeOpinion('world-state-observer', priority, 'object', 8.5,
      `the campaign does not understand the psychological world it is entering — world tension is ${b.worldTension}/10 and the banner ignores it`);
  }
  if (b.worldStrained) {
    return makeOpinion('world-state-observer', priority, 'caution', 6.5,
      `the world is strained (tension ${b.worldTension}/10) — the banner fits it, but only just; restraint matters`);
  }
  return makeOpinion('world-state-observer', priority, 'advocate', 6,
    `the campaign understands the world it is entering — climate "${b.culturalClimate}", tension ${b.worldTension}/10`);
}
