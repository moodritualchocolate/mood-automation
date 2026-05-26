/**
 * EMOTIONAL RESPONSE MAP (pure analyzer, observational)
 *
 * Derives the EMOTIONAL outcome implied by an outcome record's
 * metrics and groups by emotional signature. Surfaces:
 *
 *   - trust         (follows + profile visits with low aggression)
 *   - curiosity     (long watch time + scroll depth)
 *   - tension       (high comments + low bounce + emotional ambiguity)
 *   - relief        (high retention + high saves + low CTA)
 *   - nostalgia     (high saves + low ctr + low purchases)
 *   - aspiration    (high follows + high shares)
 *   - safety        (low bounce + steady retention + stillness)
 *   - urgency       (high CTR + low retention)
 *   - overwhelm     (high bounce + low retention + high persuasion)
 *   - emotional-fatigue (high impressions but flat engagement)
 *   - emotional-replayability (high rewatches)
 *
 * Pure function. Same input → same output. The labels describe
 * what the AUDIENCE expressed via behavior; the system does not
 * predict what they will feel.
 */

import type { OutcomeRecord, OutcomeMetrics } from './outcomeMemory';

export type EmotionalResponse =
  | 'trust'
  | 'curiosity'
  | 'tension'
  | 'relief'
  | 'nostalgia'
  | 'aspiration'
  | 'safety'
  | 'urgency'
  | 'overwhelm'
  | 'emotional-fatigue'
  | 'emotional-replayability'
  | 'undetermined';

export interface EmotionalSignatureSummary {
  emotionalSignature: string;
  occurrences: number;
  dominantResponse: EmotionalResponse;
  responseDistribution: Record<EmotionalResponse, number>;
  /** Avg engagement composite 0..10. */
  averageEngagement: number;
  description: string;
}

export interface EmotionalResponseMap {
  totalOutcomes: number;
  /** Distribution across all outcomes regardless of signature. */
  globalResponseDistribution: Record<EmotionalResponse, number>;
  signatureSummaries: EmotionalSignatureSummary[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the emotional response map describes how audiences ' +
  'actually behaved. It does not predict future emotional reactions.';

// ─── derivation ──────────────────────────────────────────────

export function deriveEmotionalResponse(
  m: OutcomeMetrics,
  record: Pick<OutcomeRecord, 'persuasionIntensity' | 'realismLevel' | 'visualStyle' | 'emotionalSignature'>,
): EmotionalResponse {
  // Replayability: rewatches dominate.
  if ((m.rewatches ?? 0) >= 1) return 'emotional-replayability';
  // Trust: follows + profile visits with low persuasion intensity.
  if ((m.follows ?? 0) >= 1 && (m.profileVisits ?? 0) >= 2 && record.persuasionIntensity <= 4) return 'trust';
  // Urgency: very high CTR + low retention (the audience clicked but didn't stay).
  if ((m.ctr ?? 0) >= 0.05 && (m.retention ?? 1) <= 0.3) return 'urgency';
  // Overwhelm: high bounce + low retention + high persuasion.
  if ((m.bounceRate ?? 0) >= 0.5 && (m.retention ?? 1) <= 0.25 && record.persuasionIntensity >= 6) return 'overwhelm';
  // Aspiration: high follows + high shares.
  if ((m.follows ?? 0) >= 2 && (m.shares ?? 0) >= 2) return 'aspiration';
  // Safety: low bounce + steady retention + stillness in style.
  if ((m.bounceRate ?? 1) <= 0.2 && (m.retention ?? 0) >= 0.5 &&
      /still|silence|gentle/.test((record.visualStyle + ' ' + record.emotionalSignature).toLowerCase())) {
    return 'safety';
  }
  // Curiosity: long watch + high scroll depth.
  if ((m.watchTime ?? 0) >= 10 && (m.scrollDepth ?? 0) >= 0.5) return 'curiosity';
  // Nostalgia: high saves + low CTR + low purchases.
  if ((m.saves ?? 0) >= 2 && (m.ctr ?? 1) <= 0.02 && (m.purchases ?? 0) === 0) return 'nostalgia';
  // Relief: high retention + high saves + low CTA pressure.
  if ((m.retention ?? 0) >= 0.5 && (m.saves ?? 0) >= 1 && record.persuasionIntensity <= 4) return 'relief';
  // Tension: high comments + low bounce.
  if ((m.comments ?? 0) >= 3 && (m.bounceRate ?? 1) <= 0.3) return 'tension';
  // Emotional fatigue: lots of impressions but flat engagement.
  if ((m.impressions ?? 0) >= 1000 &&
      (m.saves ?? 0) + (m.shares ?? 0) + (m.comments ?? 0) <= 2) {
    return 'emotional-fatigue';
  }
  return 'undetermined';
}

// ─── helpers ──────────────────────────────────────────────────

function engagementScore(m: OutcomeMetrics): number {
  const saves      = Math.min(1, (m.saves ?? 0) / 10);
  const comments   = Math.min(1, (m.comments ?? 0) / 20);
  const shares     = Math.min(1, (m.shares ?? 0) / 10);
  const retention  = m.retention ?? 0;
  const scrollDepth = m.scrollDepth ?? 0;
  const bouncePenalty = 1 - (m.bounceRate ?? 0);
  return Math.max(0, Math.min(10,
    (retention * 0.40 + scrollDepth * 0.15 + saves * 0.15 +
     comments * 0.10 + shares * 0.10 + bouncePenalty * 0.10) * 10,
  ));
}

function r2(n: number): number { return Math.round(n * 100) / 100; }

function emptyDistribution(): Record<EmotionalResponse, number> {
  return {
    trust: 0, curiosity: 0, tension: 0, relief: 0, nostalgia: 0,
    aspiration: 0, safety: 0, urgency: 0, overwhelm: 0,
    'emotional-fatigue': 0, 'emotional-replayability': 0,
    undetermined: 0,
  };
}

// ─── main ─────────────────────────────────────────────────────

export function buildEmotionalResponseMap(outcomes: OutcomeRecord[]): EmotionalResponseMap {
  const globalDist = emptyDistribution();
  const bySignature = new Map<string, OutcomeRecord[]>();

  for (const r of outcomes) {
    const response = deriveEmotionalResponse(r.metrics, r);
    globalDist[response] += 1;
    const sig = r.emotionalSignature || 'unsigned';
    if (!bySignature.has(sig)) bySignature.set(sig, []);
    bySignature.get(sig)!.push(r);
  }

  const signatureSummaries: EmotionalSignatureSummary[] = [];
  for (const [signature, records] of bySignature) {
    const dist = emptyDistribution();
    for (const r of records) dist[deriveEmotionalResponse(r.metrics, r)] += 1;
    let dominant: EmotionalResponse = 'undetermined';
    let dominantCount = -1;
    for (const [k, v] of Object.entries(dist) as Array<[EmotionalResponse, number]>) {
      if (v > dominantCount || (v === dominantCount && k.localeCompare(dominant) < 0)) {
        dominant = k; dominantCount = v;
      }
    }
    const engagement = records.length === 0
      ? 0
      : records.reduce((a, r) => a + engagementScore(r.metrics), 0) / records.length;
    signatureSummaries.push({
      emotionalSignature: signature,
      occurrences: records.length,
      dominantResponse: dominant,
      responseDistribution: dist,
      averageEngagement: r2(engagement),
      description:
        `"${signature}" — ${records.length} record${records.length === 1 ? '' : 's'}, ` +
        `dominant audience response: ${dominant} ` +
        `(avg engagement ${r2(engagement)}/10).`,
    });
  }

  signatureSummaries.sort((a, b) =>
    b.occurrences - a.occurrences ||
    b.averageEngagement - a.averageEngagement ||
    a.emotionalSignature.localeCompare(b.emotionalSignature),
  );

  return {
    totalOutcomes: outcomes.length,
    globalResponseDistribution: globalDist,
    signatureSummaries,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `signatures:${signatureSummaries.length}`,
      ...Object.entries(globalDist)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
