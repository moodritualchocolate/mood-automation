/**
 * SOUL PRESERVATION LAYER (pure, human-protective)
 *
 * Protected observatory layer. Detects emotional overproduction,
 * inspiration inflation, artificial depth, aesthetic emptiness,
 * identity erosion, humanity decay, cinematic over-polish,
 * emotional dishonesty, "AI feeling", content-farming signals.
 *
 * Pure deterministic. Same input → same output. Observatory only.
 */

import type { HumanTruthInput } from './humanTruthIntelligence';

export interface SoulPreservationSignal {
  signal: string;
  severity: number;        // 0..10
  explanation: string;
}

export interface SoulPreservationReading {
  /** 0..10 — how preserved the soul of the brand feels (10 = preserved). */
  soulIntegrity: number;
  /** Magnitude of the threat (0..10). */
  threatLevel: number;
  signals: SoulPreservationSignal[];
  aiFeelingDetected: boolean;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — soul preservation flags emotional dishonesty / AI feeling / ' +
  'content-farming signals so the operator can interrupt them. The system never ' +
  'optimizes against these signals; it observes them.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeSoulPreservation(input: HumanTruthInput): SoulPreservationReading {
  const visualFps = (input.visualDNA?.fingerprints ?? []).slice(-12);
  const narrativeFps = (input.narrativeDNA?.fingerprints ?? []).slice(-12);
  const outcomes = (input.outcomes?.outcomes ?? []).slice(-24);
  const driftObs = (input.drift?.observations ?? []).slice(-12);

  const polish = avg(visualFps.map((f) => f.polishLevel ?? 5));
  const realism = avg(visualFps.map((f) => f.realismLevel ?? 5));
  const ctaPressure = avg(narrativeFps.map((f) => f.ctaPressure ?? 0));
  const humanRealism = avg(narrativeFps.map((f) => f.humanRealism ?? 5));
  const avgPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const repeatedStructure = input.copywriter?.repeatedStructuresScore ?? 0;

  const signals: SoulPreservationSignal[] = [];

  // 1. emotional overproduction — high polish + high ctaPressure
  const overproduction = clamp10(polish * 0.5 + ctaPressure * 0.5);
  if (overproduction >= 6) signals.push({
    signal: 'emotional-overproduction',
    severity: r1(overproduction),
    explanation: `polish ${r1(polish)}/10 with CTA pressure ${r1(ctaPressure)}/10`,
  });

  // 2. inspiration inflation — large engagement, but trust formation absent
  const inflationOutcomes = outcomes.filter((o) =>
    (o.metrics?.likes ?? 0) >= 50 && (o.metrics?.follows ?? 0) === 0,
  ).length;
  if (outcomes.length > 0 && inflationOutcomes / outcomes.length >= 0.4) {
    const sev = clamp10(10 * inflationOutcomes / outcomes.length);
    signals.push({
      signal: 'inspiration-inflation',
      severity: r1(sev),
      explanation: `${inflationOutcomes} outcomes with engagement-but-no-trust`,
    });
  }

  // 3. artificial depth — high polish + low human realism
  const artificialDepth = clamp10(polish * 0.55 + (10 - humanRealism) * 0.45);
  if (artificialDepth >= 6) signals.push({
    signal: 'artificial-depth',
    severity: r1(artificialDepth),
    explanation: `polished delivery (${r1(polish)}/10) with low human realism (${r1(humanRealism)}/10)`,
  });

  // 4. aesthetic emptiness — high polish + low emotional diversity
  const avgDiversity = avg(driftObs.map((o) => o.emotionalDiversity ?? 5));
  const aestheticEmptiness = clamp10(polish * 0.45 + (10 - avgDiversity) * 0.55);
  if (aestheticEmptiness >= 6) signals.push({
    signal: 'aesthetic-emptiness',
    severity: r1(aestheticEmptiness),
    explanation: `polish without emotional diversity`,
  });

  // 5. identity erosion — drift indicators
  const identityErosionScore = clamp10(
    avg(driftObs.map((o) => 10 - (o.narrativeStability ?? 5))) * 0.5 +
    avg(driftObs.map((o) => 10 - (o.formulaDistinctiveness ?? 5))) * 0.5,
  );
  if (identityErosionScore >= 6) signals.push({
    signal: 'identity-erosion',
    severity: r1(identityErosionScore),
    explanation: `narrative + formula identity drifting`,
  });

  // 6. humanity decay — composite low felt-human axes
  const humanityDecay = clamp10(
    (10 - realism) * 0.4 +
    (10 - humanRealism) * 0.3 +
    avgPersuasion * 0.3,
  );
  if (humanityDecay >= 6) signals.push({
    signal: 'humanity-decay',
    severity: r1(humanityDecay),
    explanation: `realism low, persuasion elevated`,
  });

  // 7. cinematic over-polish
  const overPolish = clamp10(polish + Math.max(0, polish - 7));
  if (overPolish >= 7) signals.push({
    signal: 'cinematic-over-polish',
    severity: r1(overPolish),
    explanation: `polish averaging ${r1(polish)}/10`,
  });

  // 8. emotional dishonesty — vulnerable framing + high optimization
  const vulnerableTokens = (input.copywriter?.frameHistory ?? []).filter((t) => {
    const v = typeof t === 'string' ? t : (t as { frame?: string }).frame ?? '';
    return /vulnera|tender|honest|quiet/.test(String(v).toLowerCase());
  }).length;
  const emotionalDishonesty = vulnerableTokens > 0 && avgPersuasion > 6
    ? clamp10(avgPersuasion * 0.6 + (10 - humanRealism) * 0.4)
    : 0;
  if (emotionalDishonesty >= 6) signals.push({
    signal: 'emotional-dishonesty',
    severity: r1(emotionalDishonesty),
    explanation: 'vulnerable framing paired with high persuasion intensity',
  });

  // 9. AI feeling — high polish + low imperfection + low realism + high cadence
  const burstShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst').length / outcomes.length;
  const aiFeeling = clamp10(
    polish * 0.35 +
    (10 - realism) * 0.35 +
    burstShare * 5 +
    Math.max(0, ctaPressure - 5) * 0.3,
  );
  const aiFeelingDetected = aiFeeling >= 6;
  if (aiFeelingDetected) signals.push({
    signal: 'ai-feeling',
    severity: r1(aiFeeling),
    explanation: `polish + low realism + burst cadence pattern`,
  });

  // 10. content-farming — repetition + high volume + low engagement-depth
  const farming = repeatedStructure * 0.6 + Math.min(outcomes.length / 20, 1) * 4;
  const farmingSeverity = clamp10(farming);
  if (repeatedStructure >= 6 && farmingSeverity >= 6) signals.push({
    signal: 'content-farming-signals',
    severity: r1(farmingSeverity),
    explanation: `repeated structures at ${r1(repeatedStructure)}/10`,
  });

  signals.sort((a, b) => b.severity - a.severity || a.signal.localeCompare(b.signal));

  const threatLevel = signals.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...signals.map((s) => s.severity)) * 0.6 +
      avg(signals.map((s) => s.severity)) * 0.4,
    ));
  const soulIntegrity = r1(clamp10(10 - threatLevel));

  return {
    soulIntegrity,
    threatLevel,
    signals,
    aiFeelingDetected,
    reasonCodes: [
      `soul-integrity:${soulIntegrity}/10`,
      `threat-level:${threatLevel}/10`,
      `signals:${signals.length}`,
      `ai-feeling:${aiFeelingDetected}`,
      ...signals.slice(0, 5).map((s) => `${s.signal}:${s.severity}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
