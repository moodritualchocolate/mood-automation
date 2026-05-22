/**
 * THE EMOTIONAL HISTORIAN (Wave 5 — Cognitive Council entity)
 *
 * Defends EMOTIONAL CONTINUITY and the campaign's memory. The
 * Historian remembers everything the campaign has felt before and
 * objects when a banner merely repeats a feeling already said.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readEmotionalHistorianOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'emotional continuity — the campaign must evolve, not repeat';

  if (b.emotionalRepetitionRisk >= 6) {
    return makeOpinion('emotional-historian', priority, 'object', 8,
      `emotional repetition risk is ${b.emotionalRepetitionRisk}/10 — I have seen this feeling expressed before; this is not the next move`);
  }
  if (b.continuityScore < 4.5) {
    return makeOpinion('emotional-historian', priority, 'caution', 6.5,
      `continuity is only ${b.continuityScore}/10 — the campaign is fragmenting away from what it has been`);
  }
  if (b.truthPersistence >= 6) {
    return makeOpinion('emotional-historian', priority, 'advocate', 7.5,
      `this touches a truth the campaign has proven durable (persistence ${b.truthPersistence}/10) — it belongs to the history`);
  }
  return makeOpinion('emotional-historian', priority, 'advocate', 5.5,
    `the banner continues the emotional history coherently — continuity ${b.continuityScore}/10`);
}
