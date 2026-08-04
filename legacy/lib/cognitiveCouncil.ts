/**
 * COGNITIVE COUNCIL RUNTIME (Phase 43 — Wave 5: Autonomous Strategic Society)
 *
 * Convenes the eleven cognitive entities. Each entity reads the same
 * CouncilBriefing through its own bias and returns an EntityOpinion.
 * The council does not yet decide — it gathers the society's
 * competing interpretations of the same reality.
 *
 * The system must not feel like eleven API calls. It must feel like
 * one living mind with internal tension.
 */

import type { CouncilBriefing, EntityOpinion, CouncilEntityId } from './councilTypes';
import { readStrategistOpinion } from './councilStrategist';
import { readIdentityGuardianOpinion } from './councilIdentityGuardian';
import { readCulturalAnalystOpinion } from './councilCulturalAnalyst';
import { readAudienceInterpreterOpinion } from './councilAudienceInterpreter';
import { readEmotionalHistorianOpinion } from './councilEmotionalHistorian';
import { readAttentionPhysicistOpinion } from './councilAttentionPhysicist';
import { readRecoveryDirectorOpinion } from './councilRecoveryDirector';
import { readAntiHypeDefenderOpinion } from './councilAntiHypeDefender';
import { readWorldStateObserverOpinion } from './councilWorldStateObserver';
import { readNarrativeArchitectOpinion } from './councilNarrativeArchitect';
import { readExecutiveSynthesizerOpinion } from './councilExecutiveSynthesizer';

export interface CouncilSession {
  opinions: EntityOpinion[];
  /** Tally of stances across the council. */
  tally: { advocate: number; object: number; caution: number; abstain: number };
  /** The entities objecting, by id. */
  objectors: CouncilEntityId[];
  /** The entities advocating, by id. */
  advocates: CouncilEntityId[];
  notes: string[];
}

export interface CognitiveCouncilInput {
  briefing: CouncilBriefing;
}

export function conveneCognitiveCouncil(input: CognitiveCouncilInput): CouncilSession {
  const { briefing } = input;
  const notes: string[] = [];

  const opinions: EntityOpinion[] = [
    readStrategistOpinion(briefing),
    readIdentityGuardianOpinion(briefing),
    readCulturalAnalystOpinion(briefing),
    readAudienceInterpreterOpinion(briefing),
    readEmotionalHistorianOpinion(briefing),
    readAttentionPhysicistOpinion(briefing),
    readRecoveryDirectorOpinion(briefing),
    readAntiHypeDefenderOpinion(briefing),
    readWorldStateObserverOpinion(briefing),
    readNarrativeArchitectOpinion(briefing),
    readExecutiveSynthesizerOpinion(briefing),
  ];

  const tally = { advocate: 0, object: 0, caution: 0, abstain: 0 };
  const objectors: CouncilEntityId[] = [];
  const advocates: CouncilEntityId[] = [];
  for (const o of opinions) {
    tally[o.stance] += 1;
    if (o.stance === 'object') objectors.push(o.entity);
    if (o.stance === 'advocate') advocates.push(o.entity);
  }

  notes.push(`cognitive council convened — ${tally.advocate} advocate / ${tally.object} object / ${tally.caution} caution / ${tally.abstain} abstain`);
  if (objectors.length) notes.push(`objecting: ${objectors.join(', ')}`);

  return { opinions, tally, objectors, advocates, notes };
}
