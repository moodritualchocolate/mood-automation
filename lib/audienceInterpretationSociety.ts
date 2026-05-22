/**
 * AUDIENCE INTERPRETATION SOCIETY (Phase 50 — Wave 5)
 *
 * The audience is not one voice — it is read differently by different
 * entities. This module models the SOCIETY of audience
 * interpretations: the Audience Interpreter, the Cultural Analyst,
 * and the Anti-Hype Defender each read the response their own way,
 * and their disagreement is itself information.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';

export interface AudienceInterpretationReading {
  /** The competing interpretations of the audience response. */
  interpretations: Array<{ lens: string; reading: string }>;
  /** 0..10 — how much the interpretations agree. */
  interpretive_agreement: number;
  /** True when the society reads the audience as genuinely recognising. */
  consensus_genuine_recognition: boolean;
  /** True when at least one entity flags a misread. */
  misread_flagged: boolean;
  notes: string[];
}

export interface AudienceInterpretationInput {
  briefing: CouncilBriefing;
  opinions: EntityOpinion[];
}

export function readAudienceInterpretationSociety(input: AudienceInterpretationInput): AudienceInterpretationReading {
  const { briefing, opinions } = input;
  const notes: string[] = [];

  const interpreter = opinions.find((o) => o.entity === 'audience-interpreter');
  const cultural = opinions.find((o) => o.entity === 'cultural-analyst');
  const antiHype = opinions.find((o) => o.entity === 'anti-hype-defender');

  const interpretations: AudienceInterpretationReading['interpretations'] = [
    {
      lens: 'audience interpreter',
      reading: briefing.audienceRecognisedItself
        ? 'the audience recognised itself'
        : briefing.audienceHasFeedback ? 'the audience reacted, it did not recognise' : 'no response yet to read',
    },
    {
      lens: 'cultural analyst',
      reading: briefing.collectiveRecognition >= 6
        ? 'the culture would read this as "about us"'
        : 'the culture reads this as individual, not collective',
    },
    {
      lens: 'anti-hype defender',
      reading: briefing.responseCorruptsTruth
        ? 'the response is shallow stimulation — a misread waiting to corrupt the campaign'
        : 'the response is not corrupting the campaign',
    },
  ];

  // Agreement — do the three lenses point the same way?
  const positives = [
    briefing.audienceRecognisedItself || !briefing.audienceHasFeedback,
    briefing.collectiveRecognition >= 6,
    !briefing.responseCorruptsTruth,
  ].filter(Boolean).length;
  const interpretive_agreement = round1((positives === 3 || positives === 0) ? 8 : positives === 2 ? 5 : 3);

  const consensus_genuine_recognition =
    briefing.audienceRecognisedItself && briefing.collectiveRecognition >= 5 && !briefing.responseCorruptsTruth;
  const misread_flagged =
    briefing.responseCorruptsTruth ||
    (!!interpreter && interpreter.stance === 'object') ||
    (!!antiHype && antiHype.stance === 'object');

  notes.push(`audience interpretation society: ${positives}/3 lenses positive, agreement ${interpretive_agreement}/10`);
  if (misread_flagged) notes.push('audience interpretation society: a misread is flagged — the audience response is contested');
  if (cultural && cultural.stance === 'object') notes.push('audience interpretation society: the cultural analyst objects to the reading');

  return { interpretations, interpretive_agreement, consensus_genuine_recognition, misread_flagged, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
