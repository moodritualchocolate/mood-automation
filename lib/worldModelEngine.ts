/**
 * WORLD MODEL ENGINE (pure, observational)
 *
 * Tracks 16 environmental emotional movement dimensions derived
 * from observed outcomes + drift + DNA. Each dimension is a 0..10
 * descriptive signal — never a forecast, never a target.
 *
 * STRICT CONTRACT:
 *   - never used for political optimization
 *   - never used for behavioral manipulation
 *   - never used for ideological steering
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "appears to be increasing", "appears to be receding"
 *   - forbidden: prediction, persuasion steering, behavioral targeting,
 *     optimization loops, manipulation scoring, political segmentation
 */

// ─── loose structural subsets ────────────────────────────────

export interface WorldOutcomeSubset {
  outcomes?: Array<{
    at?: number;
    audienceSegment?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    cadenceState?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    mutationPressure?: number;
    downstreamOutcome?: string;
    metrics?: {
      retention?: number; saves?: number; comments?: number;
      shares?: number; bounceRate?: number; follows?: number;
      scrollDepth?: number; rewatches?: number; impressions?: number;
    };
  }>;
}

export interface WorldDriftSubset {
  observations?: Array<{
    emotionalDiversity?: number;
    trustErosionDrift?: number;
    overallCreativeHealth?: number;
  }>;
}

export interface WorldVisualDNASubset {
  fingerprints?: Array<{
    polishLevel?: number;
    realismLevel?: number;
    silenceDensity?: string;
  }>;
}

export interface WorldNarrativeDNASubset {
  fingerprints?: Array<{
    silenceUsage?: string;
    humanRealism?: number;
    ctaPressure?: number;
    narrationStyle?: string;
  }>;
}

export interface WorldModelInput {
  outcomes?: WorldOutcomeSubset | null;
  drift?: WorldDriftSubset | null;
  visualDNA?: WorldVisualDNASubset | null;
  narrativeDNA?: WorldNarrativeDNASubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface WorldStateSignals {
  stimulationSaturation: number;
  trustFragility: number;
  emotionalExhaustion: number;
  realismDemand: number;
  ironyDensity: number;
  optimismDrift: number;       // signed -10..+10: + = optimism rising, - = pessimism rising
  anxietyClimate: number;
  ritualHunger: number;
  symbolicFatigue: number;
  authenticityDemand: number;
  nostalgiaPressure: number;
  lonelinessSignals: number;
  attentionFragmentation: number;
  emotionalOverload: number;
  simplicityCraving: number;
  meaningSeeking: number;
}

export interface WorldModelReading {
  totalObservations: number;
  signals: WorldStateSignals;
  /** Top three signals by magnitude. */
  dominantSignals: string[];
  /** Plain-language notes about the current world state. */
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system observes collective human movement. ' +
  'It never predicts, never optimizes, never manipulates.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function signedClamp10(n: number): number { return Math.max(-10, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Outcome = NonNullable<NonNullable<WorldModelInput['outcomes']>['outcomes']>[number];

function matches(o: Outcome, re: RegExp): boolean {
  const hay = ((o.emotionalSignature ?? '') + ' ' +
               (o.narrativeSignature ?? '') + ' ' +
               (o.visualStyle ?? '')).toLowerCase();
  return re.test(hay);
}

function shareWith(records: Outcome[], predicate: (o: Outcome) => boolean): number {
  if (records.length === 0) return 0;
  return records.filter(predicate).length / records.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeWorldModel(input: WorldModelInput): WorldModelReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const driftObs = input.drift?.observations ?? [];
  const visualFps = input.visualDNA?.fingerprints ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];

  // ── stimulation saturation ────────────────────────────────
  const meanMutationPressure = avg(outcomes.map((o) => o.mutationPressure ?? 0));
  const burstShare = shareWith(outcomes, (o) => o.cadenceState === 'burst');
  const stimulationSaturation = clamp10(meanMutationPressure * 0.5 + burstShare * 5);

  // ── trust fragility ───────────────────────────────────────
  const trustErosion = avg(driftObs.map((o) => Math.abs(o.trustErosionDrift ?? 0)));
  const noTrustShare = shareWith(outcomes, (o) =>
    o.downstreamOutcome === 'authenticity-rejection' ||
    o.downstreamOutcome === 'aggressive-cta-rejection',
  );
  const trustFragility = clamp10(trustErosion * 2 + noTrustShare * 8);

  // ── emotional exhaustion ──────────────────────────────────
  const fatigueShare = shareWith(outcomes, (o) =>
    o.downstreamOutcome === 'fatigue-acceleration' ||
    o.downstreamOutcome === 'visual-fatigue' ||
    o.downstreamOutcome === 'retention-decay',
  );
  const lowDiversity = 10 - avg(driftObs.map((o) => o.emotionalDiversity ?? 5));
  const emotionalExhaustion = clamp10(fatigueShare * 8 + lowDiversity * 0.4);

  // ── realism demand ────────────────────────────────────────
  // High realism outcomes engaging more than low realism outcomes.
  const highRealism = outcomes.filter((o) => (o.realismLevel ?? 5) >= 7);
  const lowRealism = outcomes.filter((o) => (o.realismLevel ?? 5) <= 3);
  const highEng = highRealism.length === 0 ? 0 : avg(highRealism.map((o) => o.metrics?.retention ?? 0));
  const lowEng = lowRealism.length === 0 ? 0 : avg(lowRealism.map((o) => o.metrics?.retention ?? 0));
  const realismDemand = clamp10(5 + (highEng - lowEng) * 20);

  // ── irony density ─────────────────────────────────────────
  const ironyDensity = clamp10(shareWith(outcomes, (o) => matches(o, /iron|wry|self-aware|dry/)) * 10);

  // ── optimism drift (signed -10..+10) ──────────────────────
  const optimismShare = shareWith(outcomes, (o) => matches(o, /optim|hope|aspir|warm|light/));
  const survivalShare = shareWith(outcomes, (o) => matches(o, /surviv|endur|exhaust|tired|cope/));
  const optimismDrift = signedClamp10((optimismShare - survivalShare) * 20);

  // ── anxiety climate ───────────────────────────────────────
  const meanBounce = avg(outcomes.map((o) => o.metrics?.bounceRate ?? 0));
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const anxietyClimate = clamp10(meanBounce * 8 + Math.max(0, meanPersuasion - 5) * 0.6);

  // ── ritual hunger ─────────────────────────────────────────
  const ritualHunger = clamp10(shareWith(outcomes, (o) =>
    matches(o, /ritual|routine|morning|night|coffee|bedtime|home/),
  ) * 10);

  // ── symbolic fatigue ──────────────────────────────────────
  // Repeated symbols with declining engagement → symbolic fatigue.
  // Heuristic: high mutation pressure + low symbolic diversity proxy.
  const symbolicFatigue = clamp10(
    stimulationSaturation * 0.4 +
    (10 - avg(driftObs.map((o) => o.emotionalDiversity ?? 5))) * 0.6,
  );

  // ── authenticity demand ───────────────────────────────────
  const trustFormShare = shareWith(outcomes, (o) => o.downstreamOutcome === 'trust-formation');
  const authRejection = shareWith(outcomes, (o) => o.downstreamOutcome === 'authenticity-rejection');
  const authenticityDemand = clamp10(trustFormShare * 10 + authRejection * 6);

  // ── nostalgia pressure ────────────────────────────────────
  const nostalgiaPressure = clamp10(shareWith(outcomes, (o) =>
    matches(o, /nostalg|childhood|memory|parents|old|past/),
  ) * 10);

  // ── loneliness signals ────────────────────────────────────
  const lonelinessSignals = clamp10(shareWith(outcomes, (o) =>
    matches(o, /lonel|alone|solitude|isolation|quiet-hour|empty/),
  ) * 10);

  // ── attention fragmentation ───────────────────────────────
  const lowScrollDepth = avg(outcomes.map((o) => 1 - (o.metrics?.scrollDepth ?? 0.5)));
  const highBounce = avg(outcomes.map((o) => o.metrics?.bounceRate ?? 0));
  const attentionFragmentation = clamp10(lowScrollDepth * 5 + highBounce * 5);

  // ── emotional overload ────────────────────────────────────
  const emotionalOverload = clamp10(stimulationSaturation * 0.5 + anxietyClimate * 0.5);

  // ── simplicity craving ────────────────────────────────────
  // Sparse silence outcomes engaging well.
  const sparseShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'sparse').length / narrativeFps.length;
  const simplicityCraving = clamp10(sparseShare * 8 + (10 - avg(narrativeFps.map((f) => f.ctaPressure ?? 5))) * 0.3);

  // ── meaning seeking ───────────────────────────────────────
  // Long retention + saves + ritual / nostalgia themes.
  const meanRetention = avg(outcomes.map((o) => o.metrics?.retention ?? 0));
  const meanSaves = avg(outcomes.map((o) => Math.min(1, (o.metrics?.saves ?? 0) / 5)));
  const meaningSeeking = clamp10(meanRetention * 5 + meanSaves * 3 +
    (ritualHunger + nostalgiaPressure) * 0.1);

  const signals: WorldStateSignals = {
    stimulationSaturation: r1(stimulationSaturation),
    trustFragility:        r1(trustFragility),
    emotionalExhaustion:   r1(emotionalExhaustion),
    realismDemand:         r1(realismDemand),
    ironyDensity:          r1(ironyDensity),
    optimismDrift:         r1(optimismDrift),
    anxietyClimate:        r1(anxietyClimate),
    ritualHunger:          r1(ritualHunger),
    symbolicFatigue:       r1(symbolicFatigue),
    authenticityDemand:    r1(authenticityDemand),
    nostalgiaPressure:     r1(nostalgiaPressure),
    lonelinessSignals:     r1(lonelinessSignals),
    attentionFragmentation: r1(attentionFragmentation),
    emotionalOverload:     r1(emotionalOverload),
    simplicityCraving:     r1(simplicityCraving),
    meaningSeeking:        r1(meaningSeeking),
  };

  // Dominant signals — top 3 by absolute magnitude (with optimismDrift signed).
  const ranked = Object.entries(signals)
    .map(([k, v]) => [k, Math.abs(v as number)] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  if (signals.emotionalExhaustion >= 7) notes.push('emotional exhaustion appears elevated in observed outcomes');
  if (signals.authenticityDemand >= 6) notes.push('authenticity demand observed alongside engagement');
  if (signals.ritualHunger >= 6) notes.push('ritual themes observed alongside higher engagement');
  if (signals.meaningSeeking >= 6) notes.push('meaning-seeking behavior observed alongside retention');
  if (signals.symbolicFatigue >= 7) notes.push('symbolic fatigue signature appears elevated');
  if (signals.optimismDrift <= -4) notes.push('survival-leaning frames appear over-represented vs optimism-leaning');
  else if (signals.optimismDrift >= 4) notes.push('optimism-leaning frames appear over-represented vs survival');
  if (notes.length === 0) notes.push('world signals are balanced in the current window');

  return {
    totalObservations: outcomes.length,
    signals,
    dominantSignals: ranked,
    notes,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
