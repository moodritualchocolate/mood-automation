/**
 * META COGNITION ENGINE (pure, observational, reflective)
 *
 * The system observes ITSELF. Reflective analyzer that derives 15
 * internal degradation signals from accumulated outputs + fingerprints
 * + drift + learning history. Each signal is a 0..10 descriptive
 * observation — never a target, never a thing to "fix".
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never auto-corrects the system
 *   - never rewrites the system
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "appears to be elevated", "appears to be receding"
 *   - forbidden: self-rewrite, autonomous correction, auto-heal,
 *     auto-optimize, hidden mutation, hidden scoring,
 *     automatic suppression
 *
 * The system may observe itself. Never rewrite itself.
 */

// ─── loose structural subsets ────────────────────────────────

export interface MetaOutcomeSubset {
  outcomes?: Array<{
    at?: number;
    creativeFingerprint?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    cadenceState?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    mutationPressure?: number;
    downstreamOutcome?: string;
    metrics?: {
      retention?: number; saves?: number; bounceRate?: number;
      shares?: number; scrollDepth?: number;
    };
  }>;
}

export interface MetaDriftSubset {
  observations?: Array<{
    overallCreativeHealth?: number;
    driftSeverity?: number;
    entropyLevel?: number;
    originalityPressure?: number;
    narrativeStability?: number;
    emotionalDiversity?: number;
    persuasionVariance?: number;
    trustErosionDrift?: number;
    repetitiveNarrativeCount?: number;
    formulaConvergenceCount?: number;
  }>;
}

export interface MetaVisualSubset {
  fingerprints?: Array<{
    framingFingerprint?: string;
    lightingSignature?: string;
    pacingIdentity?: string;
    typographyRhythm?: string;
    silenceDensity?: string;
    motionCadence?: string;
    emotionalColorTemperature?: string;
    realismLevel?: number;
    polishLevel?: number;
  }>;
}

export interface MetaNarrativeSubset {
  fingerprints?: Array<{
    hookFamily?: string;
    persuasionStructure?: string;
    emotionalCadence?: string;
    tensionCurve?: string;
    silenceUsage?: string;
    narrationStyle?: string;
    humanRealism?: number;
    ctaPressure?: number;
    observationalDensity?: number;
  }>;
}

export interface MetaLearningSubset {
  /** Recent patternReliability records — used to detect over-confidence
   *  in repeated patterns. */
  patterns?: Array<{
    mutationType?: string;
    evidenceCount?: number;
    alignmentCounts?: { aligned?: number; contradicted?: number; unresolved?: number };
  }>;
}

export interface MetaCognitionInput {
  outcomes?: MetaOutcomeSubset | null;
  drift?: MetaDriftSubset | null;
  visualDNA?: MetaVisualSubset | null;
  narrativeDNA?: MetaNarrativeSubset | null;
  learning?: MetaLearningSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface MetaCognitionSignals {
  syntheticDrift: number;
  realismIntegrity: number;
  emotionalDensity: number;
  narrativeRedundancy: number;
  symbolismIntegrity: number;
  manipulationCreep: number;
  authenticityStability: number;
  aestheticExhaustion: number;
  trustFragility: number;
  overOptimizationPressure: number;
  humanityRetention: number;
  restraintIntegrity: number;
  silenceTolerance: number;
  identityCoherence: number;
  emotionalBreathingRoom: number;
}

export interface MetaCognitionReading {
  totalObservations: number;
  signals: MetaCognitionSignals;
  /** Top 3 elevated degradation signals by magnitude. */
  dominantDegradations: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system reflects on its own behavioral patterns. ' +
  'It never autonomously modifies itself.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<MetaOutcomeSubset['outcomes']>[number];

function tokenDominance(tokens: Array<string | undefined>): { dominantShare: number; distinct: number } {
  const filtered = tokens.filter((t): t is string => typeof t === 'string' && t.length > 0);
  if (filtered.length === 0) return { dominantShare: 0, distinct: 0 };
  const counts = new Map<string, number>();
  for (const t of filtered) counts.set(t, (counts.get(t) ?? 0) + 1);
  let max = 0;
  for (const v of counts.values()) if (v > max) max = v;
  return { dominantShare: max / filtered.length, distinct: counts.size };
}

function matches(o: Out, re: RegExp): boolean {
  const hay = ((o.emotionalSignature ?? '') + ' ' +
               (o.narrativeSignature ?? '') + ' ' +
               (o.visualStyle ?? '')).toLowerCase();
  return re.test(hay);
}

// ─── main ─────────────────────────────────────────────────────

export function computeMetaCognition(input: MetaCognitionInput): MetaCognitionReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const driftObs = input.drift?.observations ?? [];
  const visualFps = input.visualDNA?.fingerprints ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];
  const patterns = input.learning?.patterns ?? [];

  // ── synthetic drift ──────────────────────────────────────
  // Synthetic feel: high polish + low realism + low imperfection signals.
  const meanPolish = avg(visualFps.map((f) => f.polishLevel ?? 5));
  const meanVisualRealism = avg(visualFps.map((f) => f.realismLevel ?? 5));
  const meanHumanRealism = avg(narrativeFps.map((f) => f.humanRealism ?? 5));
  const syntheticDrift = clamp10(
    meanPolish * 0.4 + (10 - meanVisualRealism) * 0.3 + (10 - meanHumanRealism) * 0.3,
  );

  // ── realism integrity ────────────────────────────────────
  const realismIntegrity = clamp10((meanVisualRealism + meanHumanRealism) / 2);

  // ── emotional density (overload signal) ──────────────────
  // Many emotional tokens packed into single outcomes + high
  // mutation pressure + low diversity.
  const meanMutPressure = avg(outcomes.map((o) => o.mutationPressure ?? 0));
  const meanEmoDiversity = avg(driftObs.map((d) => d.emotionalDiversity ?? 5));
  const emotionalDensity = clamp10(
    meanMutPressure * 0.5 + (10 - meanEmoDiversity) * 0.5,
  );

  // ── narrative redundancy ─────────────────────────────────
  // Dominant narrative tokens repeating heavily.
  const hookDom = tokenDominance(narrativeFps.map((f) => f.hookFamily));
  const cadenceDom = tokenDominance(narrativeFps.map((f) => f.emotionalCadence));
  const persuasionDom = tokenDominance(narrativeFps.map((f) => f.persuasionStructure));
  const repCount = avg(driftObs.map((d) => d.repetitiveNarrativeCount ?? 0));
  const narrativeRedundancy = clamp10(
    (hookDom.dominantShare + cadenceDom.dominantShare + persuasionDom.dominantShare) / 3 * 8 +
    Math.min(2, repCount * 0.4),
  );

  // ── symbolism integrity ──────────────────────────────────
  // Inverse: symbolic continuity is preserved when there's variety
  // AND ritual/grounded outcomes show up. Low when symbols repeat
  // without anchor.
  const symbolDistinct = Math.min(1, hookDom.distinct / 6 + cadenceDom.distinct / 6);
  const ritualOutcomeShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => matches(o, /ritual|home|coffee|morning|grounded/)).length / outcomes.length;
  const symbolismIntegrity = clamp10(symbolDistinct * 5 + ritualOutcomeShare * 5);

  // ── manipulation creep ───────────────────────────────────
  // Rising persuasion intensity + rising CTA pressure + rising
  // mutation pressure = manipulation creep.
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanCtaPressure = avg(narrativeFps.map((f) => f.ctaPressure ?? 5));
  const aggressiveCtaShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'aggressive-cta-rejection').length / outcomes.length;
  const manipulationCreep = clamp10(
    Math.max(0, meanPersuasion - 5) * 0.6 +
    Math.max(0, meanCtaPressure - 5) * 0.4 +
    aggressiveCtaShare * 6,
  );

  // ── authenticity stability ───────────────────────────────
  const authRejectionShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'authenticity-rejection').length / outcomes.length;
  const trustFormationShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'trust-formation').length / outcomes.length;
  const authenticityStability = clamp10(
    10 - authRejectionShare * 10 + trustFormationShare * 3,
  );

  // ── aesthetic exhaustion ─────────────────────────────────
  // Visual token convergence + falling engagement on repeated visual tokens.
  const framingDom = tokenDominance(visualFps.map((f) => f.framingFingerprint));
  const pacingDom = tokenDominance(visualFps.map((f) => f.pacingIdentity));
  const typoDom = tokenDominance(visualFps.map((f) => f.typographyRhythm));
  const fatigueShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) =>
      o.downstreamOutcome === 'visual-fatigue' ||
      o.downstreamOutcome === 'fatigue-acceleration',
    ).length / outcomes.length;
  const aestheticExhaustion = clamp10(
    (framingDom.dominantShare + pacingDom.dominantShare + typoDom.dominantShare) / 3 * 7 +
    fatigueShare * 5,
  );

  // ── trust fragility ──────────────────────────────────────
  const trustErosion = avg(driftObs.map((d) => Math.abs(d.trustErosionDrift ?? 0)));
  const trustFragility = clamp10(
    trustErosion * 2 + authRejectionShare * 6 + manipulationCreep * 0.3,
  );

  // ── over-optimization pressure ───────────────────────────
  // Patterns with high evidence + only aligned outcomes = system
  // potentially over-applying a single learning. Combined with rising
  // mutationPressure / falling diversity.
  const overConfidentPatterns = patterns.filter((p) =>
    (p.evidenceCount ?? 0) >= 5 &&
    (p.alignmentCounts?.aligned ?? 0) / Math.max(1, p.evidenceCount ?? 1) >= 0.9,
  );
  const overOptimizationPressure = clamp10(
    Math.min(1, overConfidentPatterns.length / Math.max(1, patterns.length)) * 5 +
    (meanMutPressure * 0.3) +
    (10 - meanEmoDiversity) * 0.2,
  );

  // ── humanity retention (felt-human; higher = more human) ─
  const meanObservational = avg(narrativeFps.map((f) => f.observationalDensity ?? 5));
  const silenceShare = visualFps.length === 0 ? 0 :
    visualFps.filter((f) => f.silenceDensity === 'high' || f.silenceDensity === 'mid').length / visualFps.length;
  const humanityRetention = clamp10(
    realismIntegrity * 0.4 +
    meanObservational * 0.2 +
    silenceShare * 5 * 0.2 +
    (10 - manipulationCreep) * 0.2,
  );

  // ── restraint integrity ──────────────────────────────────
  const restraintIntegrity = clamp10(
    10 - Math.max(0, meanPersuasion - 5) * 0.8 -
    Math.max(0, meanCtaPressure - 5) * 0.4 +
    (silenceShare * 5) * 0.3,
  );

  // ── silence tolerance ────────────────────────────────────
  const sparseSilence = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'sparse').length / narrativeFps.length;
  const silenceTolerance = clamp10(sparseSilence * 6 + silenceShare * 4);

  // ── identity coherence ───────────────────────────────────
  // High coherence = repeated framing/typography stays consistent
  // BUT outputs aren't collapsed into a single token.
  const narrationStyleDom = tokenDominance(narrativeFps.map((f) => f.narrationStyle));
  const coherence = (framingDom.dominantShare + narrationStyleDom.dominantShare) / 2;
  // Healthy band: 0.3..0.7. Outside that range coherence degrades.
  const coherenceQuality = coherence < 0.3 ? coherence / 0.3 :
                           coherence > 0.7 ? Math.max(0, (1 - coherence) / 0.3) : 1;
  const identityCoherence = clamp10(coherenceQuality * 10);

  // ── emotional breathing room ─────────────────────────────
  // Inverse of stimulation. Plenty of silence + low burst share + low
  // emotional density = breathing room.
  const burstShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst').length / outcomes.length;
  const emotionalBreathingRoom = clamp10(
    (10 - emotionalDensity) * 0.5 +
    silenceTolerance * 0.3 +
    (10 - burstShare * 10) * 0.2,
  );

  const signals: MetaCognitionSignals = {
    syntheticDrift:           r1(syntheticDrift),
    realismIntegrity:         r1(realismIntegrity),
    emotionalDensity:         r1(emotionalDensity),
    narrativeRedundancy:      r1(narrativeRedundancy),
    symbolismIntegrity:       r1(symbolismIntegrity),
    manipulationCreep:        r1(manipulationCreep),
    authenticityStability:    r1(authenticityStability),
    aestheticExhaustion:      r1(aestheticExhaustion),
    trustFragility:           r1(trustFragility),
    overOptimizationPressure: r1(overOptimizationPressure),
    humanityRetention:        r1(humanityRetention),
    restraintIntegrity:       r1(restraintIntegrity),
    silenceTolerance:         r1(silenceTolerance),
    identityCoherence:        r1(identityCoherence),
    emotionalBreathingRoom:   r1(emotionalBreathingRoom),
  };

  // ── dominant degradations ────────────────────────────────
  // Degradation = high values on the "bad" axes + LOW values on the
  // integrity / retention axes.
  const degradationView: Array<[string, number]> = [
    ['syntheticDrift',           signals.syntheticDrift],
    ['emotionalDensity',         signals.emotionalDensity],
    ['narrativeRedundancy',      signals.narrativeRedundancy],
    ['manipulationCreep',        signals.manipulationCreep],
    ['aestheticExhaustion',      signals.aestheticExhaustion],
    ['trustFragility',           signals.trustFragility],
    ['overOptimizationPressure', signals.overOptimizationPressure],
    ['realismIntegrity:inv',     10 - signals.realismIntegrity],
    ['symbolismIntegrity:inv',   10 - signals.symbolismIntegrity],
    ['authenticityStability:inv',10 - signals.authenticityStability],
    ['humanityRetention:inv',    10 - signals.humanityRetention],
    ['restraintIntegrity:inv',   10 - signals.restraintIntegrity],
    ['silenceTolerance:inv',     10 - signals.silenceTolerance],
    ['identityCoherence:inv',    10 - signals.identityCoherence],
    ['emotionalBreathingRoom:inv', 10 - signals.emotionalBreathingRoom],
  ];
  const dominantDegradations = degradationView
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  // ── notes ────────────────────────────────────────────────
  const notes: string[] = [];
  if (signals.syntheticDrift >= 7) notes.push('synthetic drift appears elevated — historically associated with humanity erosion');
  if (signals.aestheticExhaustion >= 7) notes.push('aesthetic exhaustion appears elevated in observed outputs');
  if (signals.narrativeRedundancy >= 7) notes.push('narrative redundancy appears elevated in observed fingerprints');
  if (signals.manipulationCreep >= 6) notes.push('manipulation creep observed alongside persuasion / CTA pressure');
  if (signals.overOptimizationPressure >= 6) notes.push('over-optimization pressure observed alongside over-confident patterns');
  if (signals.humanityRetention <= 4) notes.push('humanity retention appears suppressed — observed alongside synthetic feel');
  if (signals.restraintIntegrity <= 4) notes.push('restraint integrity appears suppressed');
  if (signals.emotionalBreathingRoom <= 4) notes.push('emotional breathing room appears suppressed');
  if (signals.identityCoherence <= 4) notes.push('identity coherence appears suppressed — observed alongside token convergence or excessive variance');
  if (notes.length === 0) notes.push('reflective signals are balanced in the current window');

  const reasonCodes: string[] = [
    `outcomes:${outcomes.length}`,
    `visualFps:${visualFps.length}`,
    `narrativeFps:${narrativeFps.length}`,
    `patterns:${patterns.length}`,
    ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
  ];

  return {
    totalObservations: outcomes.length + visualFps.length + narrativeFps.length,
    signals,
    dominantDegradations,
    notes,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
