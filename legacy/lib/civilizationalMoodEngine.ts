/**
 * CIVILIZATIONAL MOOD ENGINE (pure, observational)
 *
 * Classifies the current observed era's emotional mood signature.
 * Eras are labels (never targets) drawn from the observed motion of
 * the world model + aesthetic migration + collective attention.
 *
 * Era labels:
 *   - emotionally-tired
 *   - hopeful
 *   - anxious
 *   - ironic
 *   - hyper-performative
 *   - authenticity-seeking
 *   - emotionally-defensive
 *   - ritual-seeking
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the era label is an OBSERVATION, never a target
 *   - never used for political segmentation
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "the current observed era appears to be"
 *   - forbidden: prediction, persuasion steering, behavioral targeting,
 *     optimization, manipulation scoring
 */

import type { WorldStateSignals } from './worldModelEngine';
import type { AestheticMigrationReading } from './aestheticMigrationEngine';
import type { CollectiveAttentionReading } from './collectiveAttentionEngine';

// ─── era labels ──────────────────────────────────────────────

export type CivilizationalEra =
  | 'emotionally-tired'
  | 'hopeful'
  | 'anxious'
  | 'ironic'
  | 'hyper-performative'
  | 'authenticity-seeking'
  | 'emotionally-defensive'
  | 'ritual-seeking'
  | 'balanced';

export interface EraScore {
  era: CivilizationalEra;
  score: number;
  reasonCodes: string[];
}

// ─── input ───────────────────────────────────────────────────

export interface CivilizationalMoodInput {
  worldSignals?: WorldStateSignals | null;
  aesthetic?: AestheticMigrationReading | null;
  attention?: CollectiveAttentionReading | null;
}

// ─── output ──────────────────────────────────────────────────

export interface CivilizationalMoodReading {
  /** The currently dominant era. */
  dominantEra: CivilizationalEra;
  /** Confidence in the dominant era, 0..10. */
  dominantEraConfidence: number;
  /** All era scores, sorted descending. */
  allEras: EraScore[];
  /** Plain-language notes about the observed civilizational mood. */
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the era label is an observation, never a target. ' +
  'The system observes humanity. It does not segment, steer, or persuade it.';

// ─── helpers ─────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function safeWorld(): WorldStateSignals {
  return {
    stimulationSaturation: 0,
    trustFragility: 0,
    emotionalExhaustion: 0,
    realismDemand: 0,
    ironyDensity: 0,
    optimismDrift: 0,
    anxietyClimate: 0,
    ritualHunger: 0,
    symbolicFatigue: 0,
    authenticityDemand: 0,
    nostalgiaPressure: 0,
    lonelinessSignals: 0,
    attentionFragmentation: 0,
    emotionalOverload: 0,
    simplicityCraving: 0,
    meaningSeeking: 0,
  };
}

// ─── main ────────────────────────────────────────────────────

export function computeCivilizationalMood(
  input: CivilizationalMoodInput,
): CivilizationalMoodReading {
  const w = input.worldSignals ?? safeWorld();
  const aest = input.aesthetic;
  const att = input.attention;

  // ── era scoring (each 0..10) ─────────────────────────────
  // The scores are deterministic compositions of observed signals.
  // Phrasing is locked. Era labels are ONLY descriptive.

  // emotionally-tired
  const emotionallyTired = clamp10(
    w.emotionalExhaustion * 0.5 +
    w.emotionalOverload * 0.3 +
    (att?.doomscrollFatigue.level ?? 0) * 0.2,
  );

  // hopeful
  const hopeful = clamp10(
    Math.max(0, w.optimismDrift) * 0.5 +
    (10 - w.anxietyClimate) * 0.3 +
    (10 - w.emotionalExhaustion) * 0.2,
  );

  // anxious
  const anxious = clamp10(
    w.anxietyClimate * 0.5 +
    w.trustFragility * 0.3 +
    w.attentionFragmentation * 0.2,
  );

  // ironic
  const ironic = clamp10(
    w.ironyDensity * 0.7 +
    Math.max(0, -w.optimismDrift) * 0.3,
  );

  // hyper-performative
  const hyperPerformative = clamp10(
    w.stimulationSaturation * 0.5 +
    (aest?.cinematicPolish.level ?? 0) * 0.3 +
    (aest?.hyperEditingExhaustion.level ?? 0) * 0.2,
  );

  // authenticity-seeking
  const authenticitySeeking = clamp10(
    w.authenticityDemand * 0.4 +
    w.realismDemand * 0.3 +
    (aest?.imperfectionPreference.level ?? 0) * 0.3,
  );

  // emotionally-defensive
  // High exhaustion + high fragility + low optimism = defensive.
  const emotionallyDefensive = clamp10(
    w.trustFragility * 0.4 +
    w.emotionalExhaustion * 0.3 +
    Math.max(0, -w.optimismDrift) * 0.3,
  );

  // ritual-seeking
  const ritualSeeking = clamp10(
    w.ritualHunger * 0.5 +
    w.meaningSeeking * 0.3 +
    w.simplicityCraving * 0.2,
  );

  // balanced — fills the bottom of the ranking when nothing dominates.
  const allRaw = [
    emotionallyTired, hopeful, anxious, ironic, hyperPerformative,
    authenticitySeeking, emotionallyDefensive, ritualSeeking,
  ];
  const maxObserved = allRaw.reduce((a, b) => Math.max(a, b), 0);
  const balanced = clamp10(10 - maxObserved);

  const scores: EraScore[] = [
    { era: 'emotionally-tired',     score: r1(emotionallyTired),     reasonCodes: [`exhaustion=${w.emotionalExhaustion}`, `overload=${w.emotionalOverload}`] },
    { era: 'hopeful',               score: r1(hopeful),              reasonCodes: [`optimism=${w.optimismDrift}`, `anxiety=${w.anxietyClimate}`] },
    { era: 'anxious',               score: r1(anxious),              reasonCodes: [`anxiety=${w.anxietyClimate}`, `fragility=${w.trustFragility}`] },
    { era: 'ironic',                score: r1(ironic),               reasonCodes: [`irony=${w.ironyDensity}`, `optimism=${w.optimismDrift}`] },
    { era: 'hyper-performative',    score: r1(hyperPerformative),    reasonCodes: [`stimulation=${w.stimulationSaturation}`, `polish=${aest?.cinematicPolish.level ?? 0}`] },
    { era: 'authenticity-seeking',  score: r1(authenticitySeeking),  reasonCodes: [`authenticity=${w.authenticityDemand}`, `realism=${w.realismDemand}`] },
    { era: 'emotionally-defensive', score: r1(emotionallyDefensive), reasonCodes: [`fragility=${w.trustFragility}`, `exhaustion=${w.emotionalExhaustion}`] },
    { era: 'ritual-seeking',        score: r1(ritualSeeking),        reasonCodes: [`ritual=${w.ritualHunger}`, `meaning=${w.meaningSeeking}`] },
    { era: 'balanced',              score: r1(balanced),             reasonCodes: [`maxObserved=${r1(maxObserved)}`] },
  ];
  scores.sort((a, b) => b.score - a.score || a.era.localeCompare(b.era));

  const dominantEra = scores[0].era;
  const dominantEraConfidence = scores[0].score;

  const notes: string[] = [];
  notes.push(`the current observed era appears to be ${dominantEra}`);
  if (scores[1] && Math.abs(scores[0].score - scores[1].score) <= 1) {
    notes.push(`${dominantEra} observed alongside ${scores[1].era} — eras appear closely co-present`);
  }
  if (dominantEra === 'emotionally-tired') {
    notes.push('emotional exhaustion signature appears elevated — historically associated with rest-seeking behavior');
  }
  if (dominantEra === 'authenticity-seeking') {
    notes.push('authenticity demand observed alongside realism preference');
  }
  if (dominantEra === 'ritual-seeking') {
    notes.push('ritual hunger observed alongside meaning-seeking');
  }

  return {
    dominantEra,
    dominantEraConfidence,
    allEras: scores,
    notes,
    reasonCodes: [
      `dominant:${dominantEra}`,
      `confidence:${dominantEraConfidence}`,
      ...scores.map((s) => `${s.era}:${s.score}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
