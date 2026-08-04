/**
 * THE RECOVERY DIRECTOR (Wave 5 — Cognitive Council entity)
 *
 * Defends REST — the system's and the audience's. The Recovery
 * Director is the council's advocate for silence; it objects to
 * output whenever the wiser move is to not speak at all.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';
import { makeOpinion } from './councilTypes';

export function readRecoveryDirectorOpinion(b: CouncilBriefing): EntityOpinion {
  const priority = 'rest — the right to not speak';

  if (b.recommendSilence) {
    return makeOpinion('recovery-director', priority, 'object', 8.5,
      'cognitive energy says the wiser move is silence — the system should not speak just to fill the quiet');
  }
  if (b.cognitiveEnergy < 4) {
    return makeOpinion('recovery-director', priority, 'caution', 7,
      `cognitive energy is only ${b.cognitiveEnergy}/10 — speaking now risks a depleted, half-meant banner`);
  }
  if (b.shouldSpeak && b.cognitiveEnergy >= 7) {
    return makeOpinion('recovery-director', priority, 'advocate', 6.5,
      `there is genuine energy to speak well (${b.cognitiveEnergy}/10) — I have no objection to output here`);
  }
  return makeOpinion('recovery-director', priority, 'caution', 5,
    `cognitive energy is moderate (${b.cognitiveEnergy}/10) — speak only if the truth genuinely demands it`);
}
