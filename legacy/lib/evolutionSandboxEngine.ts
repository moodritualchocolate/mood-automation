/**
 * EVOLUTION SANDBOX ENGINE (pure, simulation-only)
 *
 * Generates CANDIDATE creative mutations and scores them against
 * historical DNA. This is a SANDBOX — nothing here executes, applies,
 * publishes, or selects a mutation. Every candidate is a parallel
 * possibility carrying signature deltas and historical comparisons.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - no critic / pipeline / generation imports
 *   - no applyMutation / executeMutation functions
 *   - no winner selection / "best" / "correct" / "recommended"
 *   - never auto-applied, never auto-published
 *   - phrasing only: "historically associated", "may increase",
 *     "correlated with", "observed alongside", "higher instability /
 *     survivability signature"
 *
 * Same input → same set of candidates with stable scores.
 */

// ─── loose structural subsets ────────────────────────────────

export interface CurrentFingerprint {
  formula?: string;
  campaignMode?: string | null;
  realismLevel?: number;
  polishLevel?: number;
  persuasionIntensity?: number;
  cadenceState?: string;
  visualStyle?: string;
  emotionalSignature?: string;
  narrativeSignature?: string;
  silenceDensity?: string;
  pacingIdentity?: string;
  humanRealism?: number;
  ctaPressure?: number;
}

export interface HistoricalSlices {
  outcomes?: Array<{
    visualStyle?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    cadenceState?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    downstreamOutcome?: string;
    metrics?: { retention?: number; saves?: number; rewatches?: number; bounceRate?: number; follows?: number };
  }>;
  visualFingerprints?: Array<{ framingFingerprint?: string; polishLevel?: number; realismLevel?: number }>;
  narrativeFingerprints?: Array<{ hookFamily?: string; humanRealism?: number; ctaPressure?: number; silenceUsage?: string }>;
  driftObservations?: Array<{ emotionalDiversity?: number; persuasionVariance?: number; trustErosionDrift?: number }>;
}

export interface AdaptationStateSubset {
  adaptationPriority?: string;
  cadenceState?: string;
  mutationUrgency?: number;
}
export interface CulturalSubset {
  emotionalPersistence?: number;
  segmentDiversity?: number;
}
export interface HumanTruthSubset {
  authenticityScore?: number;
  feltHumanScore?: number;
  signals?: { dignity?: number; vulnerability?: number; silenceTolerance?: number };
}
export interface FatigueSubset {
  fatigueLevel?: number;
  freshnessScore?: number;
  visualFatigue?: number;
}

export interface EvolutionSandboxInput {
  currentFingerprint?: CurrentFingerprint | null;
  history?: HistoricalSlices | null;
  adaptation?: AdaptationStateSubset | null;
  cultural?: CulturalSubset | null;
  humanTruth?: HumanTruthSubset | null;
  fatigue?: FatigueSubset | null;
}

// ─── mutation taxonomy ───────────────────────────────────────

export type MutationType =
  | 'pacing'
  | 'silence'
  | 'emotional-restraint'
  | 'realism'
  | 'symbolism'
  | 'composition'
  | 'typography'
  | 'narrative'
  | 'contrast'
  | 'intimacy'
  | 'ritual'
  | 'nostalgia'
  | 'humor'
  | 'documentary'
  | 'tension';

const MUTATION_TYPES: MutationType[] = [
  'pacing', 'silence', 'emotional-restraint', 'realism', 'symbolism',
  'composition', 'typography', 'narrative', 'contrast', 'intimacy',
  'ritual', 'nostalgia', 'humor', 'documentary', 'tension',
];

// ─── output ───────────────────────────────────────────────────

export interface CandidateMutation {
  mutationType: MutationType;
  fingerprintDelta: string;
  historicalComparison: string;
  estimatedTrajectory: string;
  fatigueProjection: number;          // 0..10
  trustImpact: number;                // 0..10 (signature, not signed)
  realismImpact: number;
  symbolicResonanceEstimate: number;
  replayabilityEstimate: number;
  survivabilitySignature: number;
  instabilityScore: number;
  reasonCodes: string[];
}

export interface DivergencePair {
  a: MutationType;
  b: MutationType;
  distance: number;       // 0..10
  description: string;
}

export interface InstabilityZone {
  zone: string;
  severity: number;
  reason: string;
}

export interface EvolutionSandboxReading {
  totalCandidates: number;
  candidateMutations: CandidateMutation[];
  divergenceMap: DivergencePair[];
  survivabilitySignals: {
    short: number;
    mid: number;
    long: number;
    notes: string[];
  };
  fatigueForecast: {
    averageProjection: number;
    highestRisk: { mutationType: MutationType; projection: number } | null;
  };
  realismRetention: number;             // 0..10
  symbolicContinuity: number;           // 0..10
  replayabilityEstimate: number;        // 0..10 — aggregate signature
  trustStability: number;               // 0..10
  creativeEntropy: number;              // 0..10
  convergenceRisk: number;              // 0..10
  instabilityZones: InstabilityZone[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Simulation only — the evolution sandbox generates CANDIDATE mutations as ' +
  'parallel possibilities. Nothing here executes, applies, publishes, or selects. ' +
  'The operator is the only authority that decides what is tried in reality.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

interface MutationProfile {
  delta: (fp: CurrentFingerprint) => string;
  fatigueWeight: number;       // -3..+3 (positive = increases fatigue projection)
  trustWeight: number;         // -3..+3 (positive = increases trust signature)
  realismWeight: number;       // -3..+3
  symbolicWeight: number;      // -3..+3
  replayWeight: number;        // -3..+3
  instabilityWeight: number;   // -3..+3
  historicalHook: RegExp;      // pattern in narrativeSignature / visualStyle the mutation echoes
}

// Each profile encodes how a mutation HISTORICALLY tends to associate
// with the signatures (never asserts what WILL happen).
const PROFILES: Record<MutationType, MutationProfile> = {
  'pacing':              { delta: (fp) => `cadence shift from "${fp.cadenceState ?? 'unknown'}" toward gradual / paced`,
    fatigueWeight: -1, trustWeight: 1, realismWeight: 0, symbolicWeight: 0, replayWeight: 1, instabilityWeight: 1,
    historicalHook: /gradual|paced|slow|breath/i },
  'silence':             { delta: () => 'introduce sparse silence / negative-space',
    fatigueWeight: -2, trustWeight: 2, realismWeight: 1, symbolicWeight: 1, replayWeight: 1, instabilityWeight: 0,
    historicalHook: /silen|still|wordless|pause/i },
  'emotional-restraint': { delta: (fp) => `restrain persuasion intensity (from ${fp.persuasionIntensity ?? 'unknown'})`,
    fatigueWeight: -1, trustWeight: 2, realismWeight: 1, symbolicWeight: 0, replayWeight: 1, instabilityWeight: 0,
    historicalHook: /restrain|gentle|observ|honest/i },
  'realism':             { delta: (fp) => `increase realism (from ${fp.realismLevel ?? 'unknown'}/10)`,
    fatigueWeight: -1, trustWeight: 2, realismWeight: 3, symbolicWeight: 1, replayWeight: 0, instabilityWeight: 0,
    historicalHook: /documentary|observed|realis|verite/i },
  'symbolism':           { delta: () => 'introduce a culturally-resonant symbol token (kitchens, sunsets, parents, …)',
    fatigueWeight: 0, trustWeight: 1, realismWeight: 1, symbolicWeight: 3, replayWeight: 2, instabilityWeight: 1,
    historicalHook: /symbol|imag|metaph|object|moment/i },
  'composition':         { delta: () => 'asymmetric / off-center composition shift',
    fatigueWeight: -1, trustWeight: 0, realismWeight: 1, symbolicWeight: 0, replayWeight: 0, instabilityWeight: 2,
    historicalHook: /asym|edge|flush|focal/i },
  'typography':          { delta: () => 'typography rhythm shift (density / weight)',
    fatigueWeight: 0, trustWeight: 0, realismWeight: 0, symbolicWeight: 0, replayWeight: 0, instabilityWeight: 1,
    historicalHook: /typo|font|weight|condensed/i },
  'narrative':           { delta: () => 'narrative shape rotation (mirror ↔ objection ↔ observation)',
    fatigueWeight: -1, trustWeight: 1, realismWeight: 0, symbolicWeight: 1, replayWeight: 1, instabilityWeight: 1,
    historicalHook: /mirror|objection|story|narrative/i },
  'contrast':            { delta: () => 'increase emotional contrast (allow opposing tones)',
    fatigueWeight: -2, trustWeight: 1, realismWeight: 1, symbolicWeight: 1, replayWeight: 2, instabilityWeight: 1,
    historicalHook: /contrast|opposing|range|temperat/i },
  'intimacy':            { delta: () => 'closer / quieter intimacy register',
    fatigueWeight: -1, trustWeight: 2, realismWeight: 1, symbolicWeight: 1, replayWeight: 1, instabilityWeight: 1,
    historicalHook: /intim|close|quiet|tender/i },
  'ritual':              { delta: () => 'anchor in a recognizable ritual moment (morning / night / coffee)',
    fatigueWeight: -1, trustWeight: 2, realismWeight: 1, symbolicWeight: 2, replayWeight: 2, instabilityWeight: 0,
    historicalHook: /ritual|routine|morning|night|coffee|bedtime/i },
  'nostalgia':           { delta: () => 'introduce nostalgic frame (childhood / parents / old objects)',
    fatigueWeight: 0, trustWeight: 1, realismWeight: 1, symbolicWeight: 3, replayWeight: 2, instabilityWeight: 1,
    historicalHook: /nostalg|childhood|parents|old|past/i },
  'humor':               { delta: () => 'add light humor / wry tone',
    fatigueWeight: -1, trustWeight: 1, realismWeight: 0, symbolicWeight: 0, replayWeight: 2, instabilityWeight: 2,
    historicalHook: /humor|wry|play|joke/i },
  'documentary':         { delta: () => 'documentary realism shift (observed, not staged)',
    fatigueWeight: -1, trustWeight: 2, realismWeight: 3, symbolicWeight: 1, replayWeight: 0, instabilityWeight: 0,
    historicalHook: /document|observ|verite|natural/i },
  'tension':             { delta: () => 'introduce unresolved tension (delay payoff)',
    fatigueWeight: 0, trustWeight: 0, realismWeight: 0, symbolicWeight: 1, replayWeight: 2, instabilityWeight: 2,
    historicalHook: /tension|unresolv|delay|payoff/i },
};

// Look up "historical comparison" — find how many records in history
// echo this mutation's hook pattern, and what outcome was observed.
function historicalComparisonFor(
  hook: RegExp, history: HistoricalSlices | null | undefined,
): { count: number; share: number; dominantOutcome: string | null } {
  const outcomes = history?.outcomes ?? [];
  const matches = outcomes.filter((o) => {
    const hay = (o.visualStyle ?? '') + ' ' + (o.emotionalSignature ?? '') + ' ' + (o.narrativeSignature ?? '');
    return hook.test(hay);
  });
  if (matches.length === 0) {
    return { count: 0, share: 0, dominantOutcome: null };
  }
  const counts = new Map<string, number>();
  for (const m of matches) {
    const k = m.downstreamOutcome ?? 'unlabeled';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best: [string, number] | null = null;
  for (const [k, v] of counts) {
    if (!best || v > best[1] || (v === best[1] && k.localeCompare(best[0]) < 0)) best = [k, v];
  }
  return {
    count: matches.length,
    share: matches.length / outcomes.length,
    dominantOutcome: best ? best[0] : null,
  };
}

// ─── main ─────────────────────────────────────────────────────

export function computeEvolutionSandbox(input: EvolutionSandboxInput): EvolutionSandboxReading {
  const fp = input.currentFingerprint ?? {};
  const history = input.history ?? {};
  const fatigue = input.fatigue ?? {};
  const truth = input.humanTruth ?? {};

  // Base signatures pulled from the current state. Used to anchor
  // each candidate's score so that the SAME current state produces
  // the same scores.
  const baseTrust = clamp10(((truth.authenticityScore ?? 5) * 0.5) + ((truth.signals?.dignity ?? 5) * 0.5));
  const baseRealism = clamp10(fp.realismLevel ?? 5);
  const baseSymbolic = 5;
  const baseReplay = 5;
  const baseFatigue = clamp10(fatigue.fatigueLevel ?? 0);

  // Generate candidates.
  const candidates: CandidateMutation[] = MUTATION_TYPES.map((mt) => {
    const profile = PROFILES[mt];
    const histComp = historicalComparisonFor(profile.historicalHook, history);
    const fatigueProjection = r1(clamp10(baseFatigue + profile.fatigueWeight * 0.7));
    const trustImpact      = r1(clamp10(baseTrust + profile.trustWeight * 0.7));
    const realismImpact    = r1(clamp10(baseRealism + profile.realismWeight * 0.7));
    const symbolic         = r1(clamp10(baseSymbolic + profile.symbolicWeight * 0.7));
    const replay           = r1(clamp10(baseReplay + profile.replayWeight * 0.7));
    const survivability    = r1(clamp10(
      (trustImpact + realismImpact + symbolic) / 3 - (fatigueProjection - 5) * 0.4,
    ));
    const instabilityScore = r1(clamp10(profile.instabilityWeight + 3));
    const histDescriptor = histComp.count === 0
      ? 'no historical analogue observed in current memory'
      : `historically associated with ${histComp.dominantOutcome ?? 'mixed outcomes'} ` +
        `in ${histComp.count} record(s) (${Math.round(histComp.share * 100)}% share)`;
    const trajectory = profile.fatigueWeight <= -1
      ? 'may increase audience freshness if pacing room is available'
      : profile.instabilityWeight >= 2
        ? 'higher instability signature; observed alongside divergence'
        : 'observed alongside steady trajectories under similar conditions';
    return {
      mutationType: mt,
      fingerprintDelta: profile.delta(fp),
      historicalComparison: histDescriptor,
      estimatedTrajectory: trajectory,
      fatigueProjection,
      trustImpact,
      realismImpact,
      symbolicResonanceEstimate: symbolic,
      replayabilityEstimate: replay,
      survivabilitySignature: survivability,
      instabilityScore,
      reasonCodes: [
        `historical-count:${histComp.count}`,
        `historical-share:${r1(histComp.share)}`,
        `fatigue-projection:${fatigueProjection}/10`,
        `trust-impact:${trustImpact}/10`,
        `realism-impact:${realismImpact}/10`,
        `survivability-signature:${survivability}/10`,
      ],
    };
  });

  // Divergence map: for each pair, distance = Σ |a_axis - b_axis|.
  const divergenceMap: DivergencePair[] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i]; const b = candidates[j];
      const d = (
        Math.abs(a.fatigueProjection - b.fatigueProjection) +
        Math.abs(a.trustImpact - b.trustImpact) +
        Math.abs(a.realismImpact - b.realismImpact) +
        Math.abs(a.symbolicResonanceEstimate - b.symbolicResonanceEstimate) +
        Math.abs(a.replayabilityEstimate - b.replayabilityEstimate)
      ) / 5;
      divergenceMap.push({
        a: a.mutationType, b: b.mutationType,
        distance: r1(clamp10(d * 2)),
        description: `${a.mutationType} and ${b.mutationType} diverge by ${r1(d * 2)}/10 across signature axes`,
      });
    }
  }
  // Sort by largest divergence first (truncated for output size).
  divergenceMap.sort((p, q) => q.distance - p.distance || p.a.localeCompare(q.a));

  // Aggregates across candidates.
  const survivabilitySignals = (() => {
    const survivabilities = candidates.map((c) => c.survivabilitySignature);
    const fatigues = candidates.map((c) => c.fatigueProjection);
    const replays = candidates.map((c) => c.replayabilityEstimate);
    const short = r1(clamp10(avg(replays) - avg(fatigues) * 0.3 + 5));
    const mid = r1(avg(survivabilities));
    const long = r1(clamp10(avg(survivabilities) * 0.6 + (10 - avg(fatigues)) * 0.4));
    const notes: string[] = [];
    if (mid < 5) notes.push('higher instability signature observed across multiple candidates');
    if (long > short) notes.push('long-term survivability signature exceeds short-term — slower mutations may compound');
    if (short > long) notes.push('short-term spike signature exceeds long-term — fast mutations may decay');
    if (notes.length === 0) notes.push('survivability signatures balanced across windows');
    return { short, mid, long, notes };
  })();

  const fatigueForecast = (() => {
    const projs = candidates.map((c) => c.fatigueProjection);
    let highestRisk: { mutationType: MutationType; projection: number } | null = null;
    for (const c of candidates) {
      if (!highestRisk || c.fatigueProjection > highestRisk.projection) {
        highestRisk = { mutationType: c.mutationType, projection: c.fatigueProjection };
      }
    }
    return { averageProjection: r1(avg(projs)), highestRisk };
  })();

  const realismRetention   = r1(avg(candidates.map((c) => c.realismImpact)));
  const symbolicContinuity = r1(avg(candidates.map((c) => c.symbolicResonanceEstimate)));
  const replayabilityEstimate = r1(avg(candidates.map((c) => c.replayabilityEstimate)));
  const trustStability     = r1(avg(candidates.map((c) => c.trustImpact)));
  const creativeEntropy    = r1(clamp10(avg(divergenceMap.map((d) => d.distance))));
  const convergenceRisk    = r1(clamp10(10 - creativeEntropy));

  const instabilityZones: InstabilityZone[] = [];
  for (const c of candidates) {
    if (c.instabilityScore >= 5) {
      instabilityZones.push({
        zone: c.mutationType,
        severity: c.instabilityScore,
        reason: `${c.mutationType} carries an instability signature of ${c.instabilityScore}/10`,
      });
    }
  }
  if (convergenceRisk >= 7) {
    instabilityZones.push({
      zone: 'convergence',
      severity: convergenceRisk,
      reason: 'mutation candidates cluster — convergence pressure observed',
    });
  }
  instabilityZones.sort((a, b) => b.severity - a.severity || a.zone.localeCompare(b.zone));

  return {
    totalCandidates: candidates.length,
    candidateMutations: candidates,
    divergenceMap: divergenceMap.slice(0, 16),
    survivabilitySignals,
    fatigueForecast,
    realismRetention,
    symbolicContinuity,
    replayabilityEstimate,
    trustStability,
    creativeEntropy,
    convergenceRisk,
    instabilityZones,
    reasonCodes: [
      `candidates:${candidates.length}`,
      `entropy:${creativeEntropy}/10`,
      `convergence-risk:${convergenceRisk}/10`,
      `realism-retention:${realismRetention}/10`,
      `symbolic-continuity:${symbolicContinuity}/10`,
      `trust-stability:${trustStability}/10`,
      `replayability:${replayabilityEstimate}/10`,
      `fatigue-avg:${fatigueForecast.averageProjection}/10`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
