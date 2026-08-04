/**
 * HUMANITY RETENTION ENGINE (pure, observational)
 *
 * Measures whether the system's outputs still feel emotionally human.
 * Tracks imperfection retention, silence retention, realism texture,
 * restraint, grounded pacing, emotional sincerity, vulnerability
 * honesty, observational humility, emotional spaciousness.
 *
 * Classifies overall feeling: felt-human | mixed | synthetic-pressure.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the classification is a LABEL, never a target
 *   - never auto-corrects the system
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "outputs appear felt-human", "outputs appear under synthetic pressure"
 *   - forbidden: self-rewrite, autonomous correction, auto-heal
 */

// ─── loose structural subsets ────────────────────────────────

export interface HumanityOutcomeSubset {
  outcomes?: Array<{
    realismLevel?: number;
    persuasionIntensity?: number;
    cadenceState?: string;
    downstreamOutcome?: string;
    emotionalSignature?: string;
    visualStyle?: string;
  }>;
}

export interface HumanityVisualSubset {
  fingerprints?: Array<{
    silenceDensity?: string;
    realismLevel?: number;
    polishLevel?: number;
    pacingIdentity?: string;
  }>;
}

export interface HumanityNarrativeSubset {
  fingerprints?: Array<{
    silenceUsage?: string;
    narrationStyle?: string;
    humanRealism?: number;
    ctaPressure?: number;
    observationalDensity?: number;
  }>;
}

export interface HumanityRetentionInput {
  outcomes?: HumanityOutcomeSubset | null;
  visualDNA?: HumanityVisualSubset | null;
  narrativeDNA?: HumanityNarrativeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface HumanityRetentionSignals {
  imperfectionRetention: number;
  silenceRetention: number;
  realismTexture: number;
  restraint: number;
  groundedPacing: number;
  emotionalSincerity: number;
  vulnerabilityHonesty: number;
  observationalHumility: number;
  emotionalSpaciousness: number;
}

export type HumanityVerdict = 'felt-human' | 'mixed' | 'synthetic-pressure';

export interface HumanityRetentionReading {
  windowSize: number;
  signals: HumanityRetentionSignals;
  /** 0..10 — overall composite. */
  humanityIndex: number;
  verdict: HumanityVerdict;
  dominantHumanitySignals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system observes whether its outputs still feel human. ' +
  'It never autonomously modifies itself.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<HumanityOutcomeSubset['outcomes']>[number];

function matches(o: Out, re: RegExp): boolean {
  const hay = ((o.emotionalSignature ?? '') + ' ' + (o.visualStyle ?? '')).toLowerCase();
  return re.test(hay);
}

// ─── main ─────────────────────────────────────────────────────

export function computeHumanityRetention(input: HumanityRetentionInput): HumanityRetentionReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const visualFps = input.visualDNA?.fingerprints ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];

  // ── imperfection retention ────────────────────────────────
  // Lower polish + higher realism = imperfection retained.
  const meanPolish = avg(visualFps.map((f) => f.polishLevel ?? 5));
  const meanVisualRealism = avg(visualFps.map((f) => f.realismLevel ?? 5));
  const imperfectionRetention = clamp10(
    (10 - meanPolish) * 0.5 + meanVisualRealism * 0.5,
  );

  // ── silence retention ─────────────────────────────────────
  const silenceShare = visualFps.length === 0 ? 0 :
    visualFps.filter((f) => f.silenceDensity === 'high' || f.silenceDensity === 'mid').length / visualFps.length;
  const sparseShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'sparse').length / narrativeFps.length;
  const silenceRetention = clamp10(silenceShare * 5 + sparseShare * 5);

  // ── realism texture ───────────────────────────────────────
  const meanHumanRealism = avg(narrativeFps.map((f) => f.humanRealism ?? 5));
  const realismTexture = clamp10((meanVisualRealism + meanHumanRealism) / 2);

  // ── restraint ──────────────────────────────────────────────
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanCta = avg(narrativeFps.map((f) => f.ctaPressure ?? 5));
  const restraint = clamp10(
    10 - Math.max(0, meanPersuasion - 5) * 0.8 -
    Math.max(0, meanCta - 5) * 0.4,
  );

  // ── grounded pacing ───────────────────────────────────────
  const burstShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst').length / outcomes.length;
  const flowShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'flow').length / outcomes.length;
  const groundedPacing = clamp10(flowShare * 8 + (1 - burstShare) * 2);

  // ── emotional sincerity ───────────────────────────────────
  // Trust formation + emotional resonance outcomes elevated.
  const trustShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) =>
      o.downstreamOutcome === 'trust-formation' ||
      o.downstreamOutcome === 'emotional-resonance',
    ).length / outcomes.length;
  const authRejection = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'authenticity-rejection').length / outcomes.length;
  const emotionalSincerity = clamp10(trustShare * 10 - authRejection * 6);

  // ── vulnerability honesty ─────────────────────────────────
  // Vulnerable / tender signatures observed alongside high observational
  // density (not performance-of-vulnerability).
  const vulnShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => matches(o, /vulnerab|tender|raw|honest|confess|whisper/)).length / outcomes.length;
  const meanObs = avg(narrativeFps.map((f) => f.observationalDensity ?? 5));
  const vulnerabilityHonesty = clamp10(vulnShare * 6 + meanObs * 0.4);

  // ── observational humility ────────────────────────────────
  const observationalHumility = clamp10(meanObs * 0.7 + (10 - Math.max(0, meanPersuasion - 5)) * 0.3);

  // ── emotional spaciousness ────────────────────────────────
  const emotionalSpaciousness = clamp10(
    silenceRetention * 0.5 + groundedPacing * 0.3 + restraint * 0.2,
  );

  const signals: HumanityRetentionSignals = {
    imperfectionRetention: r1(imperfectionRetention),
    silenceRetention:      r1(silenceRetention),
    realismTexture:        r1(realismTexture),
    restraint:             r1(restraint),
    groundedPacing:        r1(groundedPacing),
    emotionalSincerity:    r1(emotionalSincerity),
    vulnerabilityHonesty:  r1(vulnerabilityHonesty),
    observationalHumility: r1(observationalHumility),
    emotionalSpaciousness: r1(emotionalSpaciousness),
  };

  const humanityIndex = r1(clamp10(avg(Object.values(signals))));

  const verdict: HumanityVerdict =
    humanityIndex >= 7 ? 'felt-human' :
    humanityIndex >= 4 ? 'mixed' :
                         'synthetic-pressure';

  const ranked = Object.entries(signals)
    .map(([k, v]) => [k, v as number] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  notes.push(
    verdict === 'felt-human' ? 'outputs appear felt-human in this window' :
    verdict === 'mixed' ? 'outputs appear mixed — felt-human in places, synthetic in others' :
    'outputs appear under synthetic pressure',
  );
  if (signals.imperfectionRetention >= 7) notes.push('imperfection retention observed alongside human realism');
  if (signals.silenceRetention >= 6) notes.push('silence retention observed alongside the outputs');
  if (signals.restraint <= 4) notes.push('restraint appears suppressed — observed alongside elevated persuasion / CTA');
  if (signals.emotionalSincerity <= 4) notes.push('emotional sincerity appears suppressed in observed outcomes');
  if (signals.emotionalSpaciousness <= 4) notes.push('emotional spaciousness appears suppressed');

  return {
    windowSize: outcomes.length + visualFps.length + narrativeFps.length,
    signals,
    humanityIndex,
    verdict,
    dominantHumanitySignals: ranked,
    notes,
    reasonCodes: [
      `verdict:${verdict}`,
      `index:${humanityIndex}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
