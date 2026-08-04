/**
 * HUMAN PRESENCE ENGINE (pure, observational)
 *
 * Observes why some humans feel REAL — not attractive, not persuasive,
 * not performative. Real. Sixteen presence dimensions derived from
 * outcomes + narrative DNA + visual DNA. Each dimension is a 0..10
 * descriptive signal of presence-as-observed.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never manufactures presence
 *   - never recommends content
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "may carry presence weight", "dignity-preserved",
 *     "requires more evidence"
 *   - forbidden: prediction, optimization, manipulation, viral phrasing,
 *     winner / best / recommended / selected language
 *
 * The system studies human presence. It does not manufacture
 * authenticity.
 */

// ─── loose structural subsets ────────────────────────────────

export interface PresenceOutcomeSubset {
  outcomes?: Array<{
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    cadenceState?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    downstreamOutcome?: string;
    metrics?: {
      retention?: number; saves?: number; rewatches?: number;
      shares?: number; comments?: number;
    };
  }>;
}

export interface PresenceVisualSubset {
  fingerprints?: Array<{
    silenceDensity?: string;
    realismLevel?: number;
    polishLevel?: number;
    pacingIdentity?: string;
    motionCadence?: string;
    lightingSignature?: string;
  }>;
}

export interface PresenceNarrativeSubset {
  fingerprints?: Array<{
    silenceUsage?: string;
    narrationStyle?: string;
    humanRealism?: number;
    ctaPressure?: number;
    observationalDensity?: number;
    tensionCurve?: string;
    payoffTiming?: string;
  }>;
}

export interface HumanPresenceInput {
  outcomes?: PresenceOutcomeSubset | null;
  visualDNA?: PresenceVisualSubset | null;
  narrativeDNA?: PresenceNarrativeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface PresenceSignals {
  eyeContactStability: number;
  hesitation: number;
  breathingSpace: number;
  stillness: number;
  vulnerability: number;
  emotionalRestraint: number;
  awkwardness: number;
  imperfection: number;
  authenticityPressure: number;
  emotionalTiming: number;
  listeningPresence: number;
  dignityPreservation: number;
  humanFatigueVisibility: number;
  emotionalOpenness: number;
  selfConsciousnessTraces: number;
  nonPerformativeBehavior: number;
}

export interface HumanPresenceReading {
  totalObservations: number;
  signals: PresenceSignals;
  /** 0..10 — composite presence score. */
  presenceScore: number;
  stillnessWeight: number;
  authenticityWeight: number;
  imperfectionSignature: number;
  vulnerabilitySignals: number;
  emotionalBreathing: number;
  listeningSignals: number;
  humanityRetention: number;
  /** 0..10 — synthetic pressure absent from real presence. */
  syntheticPressure: number;
  /** 0..10 — dignity-preserved composite. */
  dignityProtection: number;
  /** Top 3 dominant presence signals. */
  dominantPresenceSignals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system studies human presence. ' +
  'It does not manufacture authenticity.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<PresenceOutcomeSubset['outcomes']>[number];

function matches(o: Out, re: RegExp): boolean {
  const hay = ((o.emotionalSignature ?? '') + ' ' +
               (o.narrativeSignature ?? '') + ' ' +
               (o.visualStyle ?? '')).toLowerCase();
  return re.test(hay);
}
function shareOf(records: Out[], predicate: (o: Out) => boolean): number {
  if (records.length === 0) return 0;
  return records.filter(predicate).length / records.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeHumanPresence(input: HumanPresenceInput): HumanPresenceReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const visualFps = input.visualDNA?.fingerprints ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];

  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanCta = avg(narrativeFps.map((f) => f.ctaPressure ?? 5));
  const meanObs = avg(narrativeFps.map((f) => f.observationalDensity ?? 5));
  const meanHumanRealism = avg(narrativeFps.map((f) => f.humanRealism ?? 5));
  const meanVisualRealism = avg(visualFps.map((f) => f.realismLevel ?? 5));
  const meanPolish = avg(visualFps.map((f) => f.polishLevel ?? 5));

  // ── eye contact stability ────────────────────────────────
  // Outcomes with direct-look / portrait / close-eye signatures +
  // steady cadence.
  const directLookShare = shareOf(outcomes, (o) =>
    matches(o, /direct|eye contact|look at|portrait|close-up|face camera|address camera/),
  );
  const flowShare = shareOf(outcomes, (o) => o.cadenceState === 'flow');
  const eyeContactStability = clamp10(directLookShare * 7 + flowShare * 3);

  // ── hesitation ───────────────────────────────────────────
  const hesitationShare = shareOf(outcomes, (o) =>
    matches(o, /hesitat|pause|stumble|um|uh|word search|stops|trails off|mid-thought/),
  );
  const hesitation = clamp10(hesitationShare * 10);

  // ── breathing space ──────────────────────────────────────
  const breathingShare = shareOf(outcomes, (o) =>
    matches(o, /breath|inhale|exhale|sigh|chest|stillness|silence|pause/),
  );
  const silenceVisualShare = visualFps.length === 0 ? 0 :
    visualFps.filter((f) => f.silenceDensity === 'high' || f.silenceDensity === 'mid').length / visualFps.length;
  const breathingSpace = clamp10(breathingShare * 5 + silenceVisualShare * 5);

  // ── stillness ────────────────────────────────────────────
  const stillnessShare = shareOf(outcomes, (o) =>
    matches(o, /still|quiet|motionless|holding|frozen|paused/),
  );
  const sparseShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'sparse').length / narrativeFps.length;
  const stillness = clamp10(stillnessShare * 5 + flowShare * 2 + sparseShare * 3);

  // ── vulnerability ────────────────────────────────────────
  const vulnerableShare = shareOf(outcomes, (o) =>
    matches(o, /vulnerab|raw|honest|confess|tender|tear|tremble|cracked|fragile|admit/),
  );
  const vulnerability = clamp10(vulnerableShare * 8 + meanObs * 0.2);

  // ── emotional restraint ──────────────────────────────────
  const emotionalRestraint = clamp10(
    10 - Math.max(0, meanPersuasion - 5) * 0.8 -
    Math.max(0, meanCta - 5) * 0.4,
  );

  // ── awkwardness ──────────────────────────────────────────
  const awkwardShare = shareOf(outcomes, (o) =>
    matches(o, /awkward|unsure|fidget|nervous|shifts|adjusts|self-aware|caught|natural/),
  );
  const awkwardness = clamp10(awkwardShare * 10);

  // ── imperfection ─────────────────────────────────────────
  const imperfection = clamp10(
    meanVisualRealism * 0.5 + (10 - meanPolish) * 0.5,
  );

  // ── authenticity pressure ────────────────────────────────
  // Inverse of synthetic pressure: how strongly real-feeling traits
  // appear together.
  const authenticityPressure = clamp10(
    meanHumanRealism * 0.4 + emotionalRestraint * 0.3 + meanObs * 0.3,
  );

  // ── emotional timing ─────────────────────────────────────
  const sustainedShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) =>
      f.tensionCurve === 'sustained' || f.tensionCurve === 'unresolved',
    ).length / narrativeFps.length;
  const latePayoffShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.payoffTiming === 'late' || f.payoffTiming === 'absent').length / narrativeFps.length;
  const emotionalTiming = clamp10(sustainedShare * 5 + latePayoffShare * 5);

  // ── listening presence ───────────────────────────────────
  // Observational density + non-directive narration style.
  const observationalNarrationShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) =>
      f.narrationStyle === 'observational' || f.narrationStyle === 'witness' ||
      f.narrationStyle === 'documentary',
    ).length / narrativeFps.length;
  const listeningPresence = clamp10(
    meanObs * 0.5 + observationalNarrationShare * 5,
  );

  // ── dignity preservation ─────────────────────────────────
  const trustFormation = shareOf(outcomes, (o) => o.downstreamOutcome === 'trust-formation');
  const authRejection = shareOf(outcomes, (o) => o.downstreamOutcome === 'authenticity-rejection');
  const dignityPreservation = clamp10(
    emotionalRestraint * 0.4 + meanObs * 0.2 + meanHumanRealism * 0.2 +
    trustFormation * 5 * 0.3 - authRejection * 4,
  );

  // ── human fatigue visibility ─────────────────────────────
  const fatigueShare = shareOf(outcomes, (o) =>
    matches(o, /tired|exhausted|long day|fatigue|drained|weary|after work|burned out|spent/),
  );
  const humanFatigueVisibility = clamp10(fatigueShare * 10);

  // ── emotional openness ───────────────────────────────────
  const opennessShare = shareOf(outcomes, (o) =>
    matches(o, /open|honest|share|admit|tell you|the truth|i feel|i felt|i was/),
  );
  const emotionalOpenness = clamp10(opennessShare * 7 + meanObs * 0.3);

  // ── self-consciousness traces ────────────────────────────
  // Mild self-awareness — recognition the subject knows they're being
  // observed — without performance.
  const selfConsciousShare = shareOf(outcomes, (o) =>
    matches(o, /self-aware|notices|catches herself|laughs at himself|smiles down|looks away|small smile|glance/),
  );
  const selfConsciousnessTraces = clamp10(selfConsciousShare * 10);

  // ── non-performative behavior ────────────────────────────
  const nonPerformative = clamp10(
    (10 - Math.max(0, meanPersuasion - 5)) * 0.4 +
    (10 - Math.max(0, meanCta - 5)) * 0.3 +
    meanObs * 0.3,
  );

  const signals: PresenceSignals = {
    eyeContactStability:    r1(eyeContactStability),
    hesitation:             r1(hesitation),
    breathingSpace:         r1(breathingSpace),
    stillness:              r1(stillness),
    vulnerability:          r1(vulnerability),
    emotionalRestraint:     r1(emotionalRestraint),
    awkwardness:            r1(awkwardness),
    imperfection:           r1(imperfection),
    authenticityPressure:   r1(authenticityPressure),
    emotionalTiming:        r1(emotionalTiming),
    listeningPresence:      r1(listeningPresence),
    dignityPreservation:    r1(dignityPreservation),
    humanFatigueVisibility: r1(humanFatigueVisibility),
    emotionalOpenness:      r1(emotionalOpenness),
    selfConsciousnessTraces: r1(selfConsciousnessTraces),
    nonPerformativeBehavior: r1(nonPerformative),
  };

  // ── composites ───────────────────────────────────────────
  const stillnessWeight = r1(clamp10(
    (signals.stillness + signals.breathingSpace + signals.emotionalRestraint) / 3,
  ));
  const authenticityWeight = r1(clamp10(
    (signals.authenticityPressure + signals.imperfection +
     signals.nonPerformativeBehavior + signals.emotionalOpenness) / 4,
  ));
  const imperfectionSignature = r1(clamp10(
    (signals.imperfection + signals.awkwardness +
     signals.selfConsciousnessTraces + signals.hesitation) / 4,
  ));
  const vulnerabilitySignals = r1(clamp10(
    (signals.vulnerability + signals.humanFatigueVisibility +
     signals.emotionalOpenness) / 3,
  ));
  const emotionalBreathing = r1(clamp10(
    (signals.breathingSpace + signals.emotionalTiming + signals.stillness) / 3,
  ));
  const listeningSignals = r1(clamp10(
    (signals.listeningPresence + signals.emotionalOpenness) / 2,
  ));
  const humanityRetention = r1(clamp10(
    (authenticityWeight + imperfectionSignature + emotionalBreathing +
     listeningSignals + signals.dignityPreservation) / 5,
  ));
  const syntheticPressure = r1(clamp10(
    Math.max(0, meanPersuasion - 5) * 0.6 +
    Math.max(0, meanCta - 5) * 0.4 +
    Math.max(0, meanPolish - 7) * 0.5 +
    (10 - meanVisualRealism) * 0.2,
  ));
  const dignityProtection = r1(signals.dignityPreservation);

  const presenceScore = r1(clamp10(
    authenticityWeight * 0.25 +
    imperfectionSignature * 0.15 +
    vulnerabilitySignals * 0.15 +
    emotionalBreathing * 0.15 +
    listeningSignals * 0.10 +
    humanityRetention * 0.10 +
    dignityProtection * 0.10,
  ));

  // ── dominant presence signals ────────────────────────────
  const dominantPresenceSignals = Object.entries(signals)
    .map(([k, v]) => [k, v as number] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  if (presenceScore >= 6) notes.push('presence signature appears elevated — may carry presence weight in observed outputs');
  else if (presenceScore <= 3) notes.push('presence signature appears suppressed — requires more evidence');
  if (signals.dignityPreservation >= 6) notes.push('dignity-preserved signature observed alongside the outputs');
  if (signals.stillness >= 6) notes.push('stillness observed alongside the outputs — historically associated with presence weight');
  if (signals.imperfection >= 6) notes.push('imperfection observed alongside the outputs — historically associated with felt-real presence');
  if (signals.listeningPresence >= 6) notes.push('listening presence observed alongside the outputs');
  if (syntheticPressure >= 6) notes.push('synthetic pressure appears elevated — observed alongside performance signatures');
  if (notes.length === 0) notes.push('presence signals are balanced in the current window');

  return {
    totalObservations: outcomes.length + visualFps.length + narrativeFps.length,
    signals,
    presenceScore,
    stillnessWeight,
    authenticityWeight,
    imperfectionSignature,
    vulnerabilitySignals,
    emotionalBreathing,
    listeningSignals,
    humanityRetention,
    syntheticPressure,
    dignityProtection,
    dominantPresenceSignals,
    notes,
    reasonCodes: [
      `presenceScore:${presenceScore}`,
      `syntheticPressure:${syntheticPressure}`,
      `humanityRetention:${humanityRetention}`,
      `dignity:${dignityProtection}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
