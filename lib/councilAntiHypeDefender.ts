/**
 * THE ANTI-HYPE DEFENDER (Wave 5 — Cognitive Council entity)
 *
 * Defends the system from PERFORMANCE CORRUPTION. The Anti-Hype
 * Defender treats every engagement temptation as a threat and objects
 * whenever optimisation would train the campaign to be less truthful.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readAntiHypeDefenderOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'truth over performance — performance is a signal, not a master';

  if (b.optimizationCorruptsTruth) {
    return makeOpinion('anti-hype-defender', priority, 'object', 9,
      'optimisation here would corrupt human truth — improving these metrics would train the campaign to be less true; resist');
  }
  if (b.viralContamination >= 5) {
    return makeOpinion('anti-hype-defender', priority, 'object', 7.5,
      `viral contamination ${b.viralContamination}/10 — this is reaching for shallow virality`);
  }
  if (b.optimizationRisk >= 5) {
    return makeOpinion('anti-hype-defender', priority, 'caution', 6.5,
      `optimisation pressure is rising (${b.optimizationRisk}/10) — watch that performance does not become the master`);
  }
  return makeOpinion('anti-hype-defender', priority, 'advocate', 6,
    `no performance corruption — optimisation risk is only ${b.optimizationRisk}/10; truth is safe here`);
}
