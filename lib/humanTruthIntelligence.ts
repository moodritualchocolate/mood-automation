/**
 * HUMAN TRUTH INTELLIGENCE (pure, observational, human-protective)
 *
 * Distinguishes AUTHENTIC HUMAN EMOTIONAL RESONANCE from OPTIMIZED
 * CONTENT. Pure deterministic.
 *
 * Distinct from lib/humanTruthEngine.ts (which encodes emotional
 * cores per state) — this module is the ETHICAL observatory.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - no critic / pipeline / generation imports
 *   - HUMAN-PROTECTIVE: never produces signals that optimize
 *     psychological weakness, maximize attention, or intensify
 *     persuasion
 *
 * Reads structural subsets of existing observational memories
 * (outcome, visual DNA, narrative DNA, creative drift, copywriter,
 * ad strategy) and scores 15 authenticity signals plus a felt-human
 * vs optimized-content classification.
 */

// ─── loose structural subsets ────────────────────────────────

export interface OutcomeSubset {
  outcomes?: Array<{
    persuasionIntensity?: number;
    realismLevel?: number;
    visualStyle?: string;
    cadenceState?: string;
    mutationPressure?: number;
    emotionalSignature?: string;
    narrativeSignature?: string;
    downstreamOutcome?: string;
    metrics?: {
      impressions?: number;
      retention?: number; saves?: number; comments?: number;
      shares?: number; bounceRate?: number; follows?: number;
      ctr?: number; rewatches?: number;
      likes?: number; profileVisits?: number;
      scrollDepth?: number; checkoutRate?: number; purchases?: number;
    };
  }>;
}

export interface VisualDNASubset {
  fingerprints?: Array<{
    framingFingerprint?: string;
    lightingSignature?: string;
    pacingIdentity?: string;
    silenceDensity?: string;
    motionCadence?: string;
    realismLevel?: number;
    polishLevel?: number;
  }>;
}

export interface NarrativeDNASubset {
  fingerprints?: Array<{
    hookFamily?: string;
    persuasionStructure?: string;
    emotionalCadence?: string;
    silenceUsage?: string;
    observationalDensity?: number;
    narrationStyle?: string;
    humanRealism?: number;
    ctaPressure?: number;
  }>;
}

export interface DriftSubset {
  observations?: Array<{
    emotionalDiversity?: number;
    persuasionVariance?: number;
    narrativeStability?: number;
    formulaDistinctiveness?: number;
    trustErosionDrift?: number;
  }>;
}

export interface CopywriterSubset {
  dignityErosionScore?: number;
  repeatedStructuresScore?: number;
  toneHistory?: Array<string | Record<string, unknown>>;
  frameHistory?: Array<string | Record<string, unknown>>;
}

export interface AdStrategySubset {
  trustDebt?: number;
  brandDignityScore?: number;
  audienceHistory?: Array<{
    persuasionMode?: string;
    storyShape?: string;
  }>;
}

export interface HumanTruthInput {
  outcomes?: OutcomeSubset | null;
  visualDNA?: VisualDNASubset | null;
  narrativeDNA?: NarrativeDNASubset | null;
  drift?: DriftSubset | null;
  copywriter?: CopywriterSubset | null;
  strategy?: AdStrategySubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface HumanTruthSignals {
  emotionalRestraint: number;
  silenceTolerance: number;
  realism: number;
  imperfection: number;
  vulnerability: number;
  observationalHonesty: number;
  emotionalSpaciousness: number;
  humanPacing: number;
  dignity: number;
  groundedness: number;
  narrativeSincerity: number;
  emotionalCoherence: number;
  nonPerformativeBehavior: number;
  conversationalNaturalness: number;
  emotionalStability: number;
}

export interface HumanTruthReading {
  authenticityScore: number;            // 0..10
  feltHumanScore: number;               // 0..10
  optimizedContentScore: number;        // 0..10
  overOptimizationRisk: number;         // 0..10
  signals: HumanTruthSignals;
  classification: 'felt-human' | 'mixed' | 'optimized-content';
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function tokenOf(item: string | Record<string, unknown>): string {
  if (typeof item === 'string') return item.toLowerCase();
  const o = item as Record<string, unknown>;
  for (const k of ['frame', 'tone', 'signature', 'value', 'label']) {
    const v = o[k];
    if (typeof v === 'string') return v.toLowerCase();
  }
  return '';
}
function shareMatching(
  items: Array<string | Record<string, unknown>>,
  predicate: (s: string) => boolean,
): number {
  if (items.length === 0) return 0;
  return items.filter((i) => predicate(tokenOf(i))).length / items.length;
}

const ADVISORY_NOTICE =
  'Observatory only — the human-truth intelligence layer is HUMAN-PROTECTIVE. ' +
  'It never produces signals that optimize psychological weakness, maximize ' +
  'attention, or intensify persuasion.';

// ─── main ─────────────────────────────────────────────────────

export function computeHumanTruth(input: HumanTruthInput): HumanTruthReading {
  const visualFps    = input.visualDNA?.fingerprints ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];
  const driftObs     = input.drift?.observations ?? [];
  const outcomes     = input.outcomes?.outcomes ?? [];
  const stratObs     = input.strategy?.audienceHistory ?? [];
  const tones        = input.copywriter?.toneHistory ?? [];
  const frames       = input.copywriter?.frameHistory ?? [];
  void tones;

  const recentVisual    = visualFps.slice(-12);
  const recentNarrative = narrativeFps.slice(-12);
  const recentDrift     = driftObs.slice(-12);
  const recentOutcomes  = outcomes.slice(-24);

  // ── signal: emotional restraint ────────────────────────────
  const avgCtaPressure = avg(recentNarrative.map((f) => f.ctaPressure ?? 0));
  const avgPersuasionIntensity = avg(recentOutcomes.map((o) => o.persuasionIntensity ?? 5));
  const emotionalRestraint = clamp10(10 - (avgCtaPressure * 0.5 + avgPersuasionIntensity * 0.5));

  // ── signal: silence tolerance ──────────────────────────────
  const silenceShare = recentNarrative.filter((f) =>
    f.silenceUsage === 'sparse' ||
    /silence|stillness/.test((f.hookFamily ?? '').toLowerCase()),
  ).length;
  const silenceTolerance = recentNarrative.length === 0
    ? 5
    : clamp10(10 * silenceShare / recentNarrative.length);

  // ── signal: realism ─────────────────────────────────────────
  const visRealism = avg(recentVisual.map((f) => f.realismLevel ?? 5));
  const narRealism = avg(recentNarrative.map((f) => f.humanRealism ?? 5));
  const realism = clamp10((visRealism + narRealism) / 2);

  // ── signal: imperfection ───────────────────────────────────
  const polish = avg(recentVisual.map((f) => f.polishLevel ?? 5));
  const imperfection = clamp10(10 - polish);

  // ── signal: vulnerability ──────────────────────────────────
  const vulnerableShare = shareMatching(frames, (t) =>
    /vulnera|tender|honest|quiet|gentle|tired|unsure/.test(t),
  );
  const vulnerability = clamp10(vulnerableShare * 10);

  // ── signal: observational honesty ──────────────────────────
  const observationalShare = stratObs.filter((s) =>
    (s.persuasionMode ?? '').toLowerCase().includes('observa'),
  ).length;
  const documentaryShare = recentOutcomes.filter((o) =>
    /documentary|observed|verite/.test((o.visualStyle ?? '').toLowerCase()),
  ).length;
  const obsTotal = Math.max(stratObs.length, 1);
  const docTotal = Math.max(recentOutcomes.length, 1);
  const observationalHonesty = clamp10(
    (observationalShare / obsTotal) * 5 + (documentaryShare / docTotal) * 5,
  );

  // ── signal: emotional spaciousness ─────────────────────────
  const spaciousShare = recentNarrative.filter((f) =>
    f.silenceUsage === 'sparse' && (f.ctaPressure ?? 10) <= 4,
  ).length;
  const emotionalSpaciousness = recentNarrative.length === 0
    ? 5
    : clamp10(10 * spaciousShare / recentNarrative.length);

  // ── signal: human pacing ───────────────────────────────────
  const gradualCadence = recentOutcomes.filter((o) =>
    o.cadenceState === 'gradual' || o.cadenceState === 'normal',
  ).length;
  const humanPacing = recentOutcomes.length === 0
    ? 5
    : clamp10(10 * gradualCadence / recentOutcomes.length);

  // ── signal: dignity ────────────────────────────────────────
  const dignityErosion = input.copywriter?.dignityErosionScore ?? 0;
  const brandDignity = input.strategy?.brandDignityScore ?? 7;
  const dignity = clamp10(10 - dignityErosion * 0.5 + (brandDignity - 5) * 0.5);

  // ── signal: groundedness ───────────────────────────────────
  const groundedness = clamp10(
    (documentaryShare / docTotal) * 6 +
    (10 - avg(recentOutcomes.map((o) => o.mutationPressure ?? 0))) * 0.4,
  );

  // ── signal: narrative sincerity ────────────────────────────
  const mirrorShare = stratObs.filter((s) =>
    (s.storyShape ?? '').toLowerCase().includes('mirror'),
  ).length;
  const narrativeSincerity = stratObs.length === 0
    ? 5
    : clamp10(10 * mirrorShare / stratObs.length);

  // ── signal: emotional coherence ────────────────────────────
  const avgDiversity = avg(recentDrift.map((o) => o.emotionalDiversity ?? 5));
  const diversityVariance = recentDrift.length === 0 ? 0 :
    avg(recentDrift.map((o) => Math.abs((o.emotionalDiversity ?? 5) - avgDiversity)));
  const emotionalCoherence = clamp10(10 - diversityVariance * 2);

  // ── signal: non-performative behavior ──────────────────────
  const performativeOutcomes = recentOutcomes.filter((o) =>
    o.downstreamOutcome === 'conversion-spike' ||
    o.downstreamOutcome === 'aggressive-cta-rejection',
  ).length;
  const performativeShare = recentOutcomes.length === 0 ? 0 :
    performativeOutcomes / recentOutcomes.length;
  const nonPerformativeBehavior = clamp10(
    10 - performativeShare * 10 - Math.max(0, avgPersuasionIntensity - 5) * 0.5,
  );

  // ── signal: conversational naturalness ─────────────────────
  const obsNarStyleShare = recentNarrative.filter((f) =>
    (f.narrationStyle ?? '').toLowerCase().includes('observa'),
  ).length;
  const conversationalNaturalness = recentNarrative.length === 0
    ? 5
    : clamp10(
      (10 * obsNarStyleShare / recentNarrative.length) * 0.5 +
      (10 - avgCtaPressure) * 0.5,
    );

  // ── signal: emotional stability ────────────────────────────
  const avgNarStability = avg(recentDrift.map((o) => o.narrativeStability ?? 5));
  const avgTrustErosion = avg(recentDrift.map((o) => Math.abs(o.trustErosionDrift ?? 0)));
  const emotionalStability = clamp10(avgNarStability * 0.7 + (10 - avgTrustErosion * 2) * 0.3);

  const signals: HumanTruthSignals = {
    emotionalRestraint:        r1(emotionalRestraint),
    silenceTolerance:          r1(silenceTolerance),
    realism:                   r1(realism),
    imperfection:              r1(imperfection),
    vulnerability:             r1(vulnerability),
    observationalHonesty:      r1(observationalHonesty),
    emotionalSpaciousness:     r1(emotionalSpaciousness),
    humanPacing:               r1(humanPacing),
    dignity:                   r1(dignity),
    groundedness:              r1(groundedness),
    narrativeSincerity:        r1(narrativeSincerity),
    emotionalCoherence:        r1(emotionalCoherence),
    nonPerformativeBehavior:   r1(nonPerformativeBehavior),
    conversationalNaturalness: r1(conversationalNaturalness),
    emotionalStability:        r1(emotionalStability),
  };

  const allSignals = Object.values(signals);
  const authenticityScore = r1(avg(allSignals));

  const feltHumanScore = r1(clamp10(
    signals.emotionalRestraint * 0.10 +
    signals.silenceTolerance * 0.08 +
    signals.realism * 0.10 +
    signals.imperfection * 0.08 +
    signals.vulnerability * 0.08 +
    signals.observationalHonesty * 0.10 +
    signals.emotionalSpaciousness * 0.08 +
    signals.dignity * 0.10 +
    signals.groundedness * 0.08 +
    signals.narrativeSincerity * 0.08 +
    signals.nonPerformativeBehavior * 0.06 +
    signals.conversationalNaturalness * 0.06,
  ));
  const optimizedContentScore = r1(clamp10(10 - feltHumanScore));
  const overOptimizationRisk = r1(clamp10(10 - authenticityScore));

  let classification: HumanTruthReading['classification'];
  if (feltHumanScore >= 7) classification = 'felt-human';
  else if (feltHumanScore <= 4) classification = 'optimized-content';
  else classification = 'mixed';

  const notes: string[] = [];
  if (signals.imperfection < 4 && signals.realism < 5) {
    notes.push('content reads as polished; imperfection and realism signals are low');
  }
  if (signals.dignity < 5) notes.push('dignity signal eroded');
  if (signals.observationalHonesty < 4) notes.push('observational honesty is sparse');
  if (signals.silenceTolerance < 4) notes.push('silence is rare; the content is dense');
  if (notes.length === 0) notes.push('current outputs sustain felt-human signals at acceptable levels');

  return {
    authenticityScore,
    feltHumanScore,
    optimizedContentScore,
    overOptimizationRisk,
    signals,
    classification,
    notes,
    reasonCodes: [
      `authenticity:${authenticityScore}/10`,
      `felt-human:${feltHumanScore}/10`,
      `optimized:${optimizedContentScore}/10`,
      `over-optimization-risk:${overOptimizationRisk}/10`,
      `classification:${classification}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
