/**
 * THE STRATEGIST (Wave 5 — Cognitive Council entity)
 *
 * Defends STRATEGIC VALUE and long-term brand equity. The Strategist
 * is unmoved by emotional effectiveness alone — it asks whether a
 * banner is worth the campaign's finite executive energy.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readStrategistOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'strategic value and long-term brand equity';

  if (b.strategicallyUnwise) {
    return makeOpinion('strategist', priority, 'object', 8.5,
      `proceeding here is strategically unwise — strategic weight is only ${b.strategicWeight}/10 and the move does not build long-term equity`);
  }
  if (b.merelyEmotionallyEffective) {
    return makeOpinion('strategist', priority, 'caution', 6.5,
      'this is emotionally effective but not strategically wise — effective is not the same as worth doing');
  }
  if (b.priorityBand === 'deepen' && b.longTermEquity >= 6) {
    return makeOpinion('strategist', priority, 'advocate', 8,
      `strong strategic case — weight ${b.strategicWeight}/10, long-term equity ${b.longTermEquity}/10; this deserves real energy`);
  }
  if (b.priorityBand === 'defer') {
    return makeOpinion('strategist', priority, 'object', 6,
      'low strategic priority — this opportunity is better deferred than forced');
  }
  return makeOpinion('strategist', priority, 'advocate', 5.5,
    `acceptable strategic footing — weight ${b.strategicWeight}/10, long-term equity ${b.longTermEquity}/10`);
}
