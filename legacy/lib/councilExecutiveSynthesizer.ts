/**
 * THE EXECUTIVE SYNTHESIZER (Wave 5 — Cognitive Council entity)
 *
 * Defends the EXECUTIVE DECISION already reached by the Wave 4
 * runtime. The Synthesizer is the council's bridge to the executive
 * layer — it carries the Phase 41 ruling into the debate and argues
 * for coherence between the executive decision and the council.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readExecutiveSynthesizerOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'coherence with the executive decision';

  if (!b.executiveIsOutput) {
    return makeOpinion('executive-synthesizer', priority, 'object', 8.5,
      `the executive runtime decided "${b.executiveAction}" — it already ruled against an output; the council should honour that`);
  }
  if (b.executiveConfidence < 6) {
    return makeOpinion('executive-synthesizer', priority, 'caution', 6.5,
      `the executive decision ("${b.executiveAction}") was reached with low confidence (${b.executiveConfidence}/10) — the council should scrutinise it`);
  }
  if (b.emergence >= 6 && b.truthValue >= 6) {
    return makeOpinion('executive-synthesizer', priority, 'advocate', 7.5,
      `the executive decision "${b.executiveAction}" rests on real emergence (${b.emergence}/10) and truth (${b.truthValue}/10) — I support carrying it forward`);
  }
  return makeOpinion('executive-synthesizer', priority, 'advocate', 6,
    `the executive decision "${b.executiveAction}" (confidence ${b.executiveConfidence}/10) is coherent enough to carry forward`);
}
