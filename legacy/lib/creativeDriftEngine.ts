/**
 * CREATIVE DRIFT ENGINE (observational, read-only)
 *
 * Pure deterministic function. Given structural subsets of the
 * persistent memory stores, returns a CreativeDrift reading: how
 * the creative organism is changing across time — emotional
 * diversity, persuasion variance, narrative stability, formula
 * distinctiveness, originality pressure, identity erosion, trust
 * erosion, repetitive narratives, formula convergence, mode drift,
 * creative instability zones.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - no mutation of any input
 *   - no critic / pipeline / generation imports
 *   - reading is the only operation
 *   - the engine NEVER recommends auto-applied changes; its sole
 *     output is an observational snapshot
 *
 * Same input → same output. All scores deterministic 0..10.
 */

// ─── loose structural subsets (we read only what we need) ─────

/** Each history entry may be either a raw string OR a record-like
 *  object with a single salient field. The engine normalizes both. */
export type HistoryItem = string | Record<string, unknown>;

export interface CopywriterMemorySubset {
  hookHistory?: HistoryItem[];
  bodyHistory?: HistoryItem[];
  ctaHistory?: HistoryItem[];
  frameHistory?: HistoryItem[];
  toneHistory?: HistoryItem[];
  structureHistory?: HistoryItem[];
  dignityErosionScore?: number;
  repeatedStructuresScore?: number;
}

export interface CopyQualityMemorySubset {
  samples?: Array<{
    at?: number;
    formula?: string;
    campaignMode?: string | null;
    copyIntegrity?: number;
    trustSafety?: number;
    repetitionConcern?: number;
    proofAdequacy?: number;
    ctaRestraint?: number;
    strategicCopyFit?: number;
  }>;
}

export interface IdentityContinuityMemorySubset {
  observations?: Array<{
    at?: number;
    formula?: string;
    identityFragmentation?: number;
    identityStability?: number;
    continuityRisk?: number;
  }>;
}

export interface CampaignLifecycleMemorySubset {
  observations?: Array<{
    at?: number;
    formula?: string;
    campaignMode?: string | null;
    patternFingerprint?: string;
    campaignHealth?: number;
    fatiguePressure?: number;
    creativeFreshness?: number;
    decayRisk?: number;
    audienceRotationNeed?: number;
  }>;
  recentPatterns?: string[];
  patternCounts?: Record<string, number>;
  audienceFatigueEwma?: Record<string, number>;
}

export interface StrategicOutcomeMemorySubset {
  observations?: Array<{
    at?: number;
    formula?: string;
    strategicStability?: number;
    trustDurability?: number;
    audienceResilience?: number;
    noveltyFragility?: number;
    strategicRisk?: number;
  }>;
}

export interface AdStrategyMemorySubset {
  audienceHistory?: Array<{
    at?: number;
    audience?: string;
    role?: string;
    persuasionMode?: string;
    storyShape?: string;
    formula?: string;
    campaignMode?: string | null;
  }>;
  repetitionRiskHistory?: Array<{
    at?: number;
    repetitionRisk?: number;
    trustDebt?: number;
  }>;
  successfulPatterns?: HistoryItem[];
  failedAngles?: HistoryItem[];
  brandDignityScore?: number;
  trustDebt?: number;
  audienceFatigue?: Record<string, { usageCount?: number; recency?: number }>;
  painHistory?: HistoryItem[];
  angleHistory?: HistoryItem[];
  roleHistory?: HistoryItem[];
}

export interface PolicyAuditMemorySubset {
  entries?: Array<{
    at?: number;
    formula?: string;
    overrideType?: string;
    finalAppliedEnabled?: boolean;
    outcomeVerdict?: string | null;
    policyBand?: string;
  }>;
}

// ─── input + output ───────────────────────────────────────────

export interface CreativeDriftInput {
  copywriter?: CopywriterMemorySubset | null;
  copyQuality?: CopyQualityMemorySubset | null;
  identity?: IdentityContinuityMemorySubset | null;
  campaign?: CampaignLifecycleMemorySubset | null;
  outcomes?: StrategicOutcomeMemorySubset | null;
  strategy?: AdStrategyMemorySubset | null;
  policy?: PolicyAuditMemorySubset | null;
}

export interface CreativeDriftDominantPattern {
  pattern: string;
  severity: number;        // 0..10
  persistence: number;     // number of observations supporting it
  explanation: string;
}
export interface CreativeDriftEmergingRisk {
  risk: string;
  acceleration: number;    // 0..10 (delta magnitude)
  explanation: string;
}
export interface CreativeDriftCollapsingDimension {
  dimension: string;
  decay: number;           // 0..10
  explanation: string;
}
export interface CreativeDriftRepetitiveNarrative {
  narrativeFingerprint: string;
  recurrence: number;
  fatigueRisk: number;     // 0..10
}
export interface CreativeDriftEmotionalCompression {
  emotion: string;
  overused: boolean;
  saturation: number;      // 0..10
}
export interface CreativeDriftFormulaConvergence {
  formulas: string[];
  convergenceLevel: number; // 0..10
  explanation: string;
}
export interface CreativeDriftModeDrift {
  mode: string;
  drift: number;            // 0..10
  explanation: string;
}
export interface CreativeDriftInstabilityZone {
  condition: string;
  instability: number;      // 0..10
  explanation: string;
}

export interface CreativeDrift {
  overallCreativeHealth: number;       // 0..10
  driftSeverity: number;               // 0..10
  entropyLevel: number;                // 0..10
  originalityPressure: number;         // 0..10
  narrativeStability: number;          // 0..10
  emotionalDiversity: number;          // 0..10
  formulaDistinctiveness: number;      // 0..10
  persuasionVariance: number;          // 0..10

  dominantDriftPatterns: CreativeDriftDominantPattern[];
  emergingCreativeRisks: CreativeDriftEmergingRisk[];
  collapsingCreativeDimensions: CreativeDriftCollapsingDimension[];
  repetitiveNarratives: CreativeDriftRepetitiveNarrative[];
  emotionalCompression: CreativeDriftEmotionalCompression[];
  formulaConvergence: CreativeDriftFormulaConvergence[];
  modeDrift: CreativeDriftModeDrift[];

  trustErosionTrajectory: {
    historical: number;
    recent: number;
    drift: number;
  };

  creativeInstabilityZones: CreativeDriftInstabilityZone[];

  advisorySummary: string;
  reasonCodes: string[];
}

// ─── helpers ──────────────────────────────────────────────────

const RECENT_WINDOW = 12;
const DEFAULT_TRUST_DEBT = 0;

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Normalize a HistoryItem to a deterministic string token. If the
 *  item is already a string, return it. If it's an object, prefer
 *  semantically meaningful fields in order — these match the
 *  record shapes used across copywriter / ad-strategy memories. */
function normalizeToken(item: HistoryItem): string {
  if (typeof item === 'string') return item;
  if (item === null || typeof item !== 'object') return String(item);
  const obj = item as Record<string, unknown>;
  for (const key of ['frame', 'signature', 'hook', 'body', 'cta', 'pattern', 'angle', 'role', 'audience', 'pain', 'desire', 'token', 'label', 'value']) {
    const v = obj[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  // Last-resort stable fingerprint: serialize a few salient keys.
  return JSON.stringify(obj);
}

function normalizeAll(items: HistoryItem[] | undefined): string[] {
  if (!items) return [];
  return items.map(normalizeToken);
}

/** Diversity score 0..10 — distinct count / total count, scaled. */
function diversityScore(items: string[]): number {
  if (items.length === 0) return 5;          // unknown = neutral
  const distinct = new Set(items).size;
  return clamp10(10 * (distinct / items.length));
}

/** Jaccard similarity of two sets, 0..1. */
function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

const ADVISORY_NOTICE =
  'Observatory only — drift detection never modifies generation. ' +
  'The engine reports change, it does not act on it.';

// ─── main ─────────────────────────────────────────────────────

export function computeCreativeDrift(input: CreativeDriftInput): CreativeDrift {
  // Pull arrays with safe defaults.
  const copywriter   = input.copywriter ?? {};
  const cqSamples    = input.copyQuality?.samples ?? [];
  const idObs        = input.identity?.observations ?? [];
  const campaignObs  = input.campaign?.observations ?? [];
  const outcomeObs   = input.outcomes?.observations ?? [];
  const stratObs     = input.strategy?.audienceHistory ?? [];
  const stratRep     = input.strategy?.repetitionRiskHistory ?? [];

  // Slice to "recent" window for current-state analysis.
  const recentCQ      = cqSamples.slice(-RECENT_WINDOW);
  const recentId      = idObs.slice(-RECENT_WINDOW);
  const recentCampaign = campaignObs.slice(-RECENT_WINDOW);
  const recentOutcome = outcomeObs.slice(-RECENT_WINDOW);
  const recentStrat   = stratObs.slice(-RECENT_WINDOW);
  const recentRep     = stratRep.slice(-RECENT_WINDOW);

  // ── DIVERSITY METRICS ────────────────────────────────────────

  const recentFrames    = normalizeAll(copywriter.frameHistory).slice(-RECENT_WINDOW);
  const recentTones     = normalizeAll(copywriter.toneHistory).slice(-RECENT_WINDOW);
  const recentStructures= normalizeAll(copywriter.structureHistory).slice(-RECENT_WINDOW);
  const emotionalDiversity = clamp10(round1(diversityScore([...recentFrames, ...recentTones])));

  const persuasionModes = recentStrat.map((s) => s.persuasionMode).filter(Boolean) as string[];
  const storyShapes     = recentStrat.map((s) => s.storyShape).filter(Boolean) as string[];
  const persuasionVariance = clamp10(round1(diversityScore([...persuasionModes, ...storyShapes])));

  const patterns = (input.campaign?.recentPatterns ?? []).slice(-RECENT_WINDOW);
  const narrativeStability = patterns.length === 0
    ? 5
    : clamp10(round1(10 * (new Set(patterns).size / patterns.length)));

  // Formula distinctiveness: 1 − avg pairwise Jaccard of formula audience sets.
  const formulaToAudiences = new Map<string, Set<string>>();
  for (const s of recentStrat) {
    if (!s.formula || !s.audience) continue;
    if (!formulaToAudiences.has(s.formula)) formulaToAudiences.set(s.formula, new Set());
    formulaToAudiences.get(s.formula)!.add(s.audience);
  }
  let formulaDistinctiveness = 5;
  if (formulaToAudiences.size >= 2) {
    const formulas = Array.from(formulaToAudiences.keys());
    let pairs = 0; let totalSim = 0;
    for (let i = 0; i < formulas.length; i++) {
      for (let j = i + 1; j < formulas.length; j++) {
        totalSim += jaccard(formulaToAudiences.get(formulas[i])!, formulaToAudiences.get(formulas[j])!);
        pairs += 1;
      }
    }
    const avgSim = pairs === 0 ? 0 : totalSim / pairs;
    formulaDistinctiveness = clamp10(round1(10 * (1 - avgSim)));
  }

  // Originality pressure: average of repetitionConcern (copy quality)
  // and repetitionRisk (strategy). Higher = more pressure.
  const avgRepConcern = avg(recentCQ.map((c) => c.repetitionConcern ?? 0));
  const avgRepRisk    = avg(recentRep.map((r) => r.repetitionRisk ?? 0));
  const originalityPressure = clamp10(round1((avgRepConcern + avgRepRisk) / 2));

  // Entropy: average of diversity metrics — coarse Shannon-ish proxy.
  const entropyLevel = clamp10(round1(
    (emotionalDiversity + persuasionVariance + narrativeStability + formulaDistinctiveness) / 4,
  ));

  // Overall health.
  const overallCreativeHealth = clamp10(round1(
    0.30 * entropyLevel +
    0.30 * (10 - originalityPressure) +
    0.20 * emotionalDiversity +
    0.20 * narrativeStability,
  ));

  // ── TRAJECTORY DELTAS (historical vs recent) ────────────────

  function trajectoryDelta(xs: number[]): { early: number; late: number; delta: number } {
    if (xs.length < 4) return { early: 0, late: 0, delta: 0 };
    const half = Math.floor(xs.length / 2);
    const early = avg(xs.slice(0, half));
    const late  = avg(xs.slice(half));
    return { early, late, delta: late - early };
  }

  const trustTrajectory      = trajectoryDelta(stratRep.map((r) => r.trustDebt ?? DEFAULT_TRUST_DEBT));
  const repConcernTrajectory = trajectoryDelta(cqSamples.map((c) => c.repetitionConcern ?? 0));
  const identityFragTrajectory = trajectoryDelta(idObs.map((o) => o.identityFragmentation ?? 0));
  const fatigueTrajectory    = trajectoryDelta(campaignObs.map((o) => o.fatiguePressure ?? 0));
  const strategicRiskTraj    = trajectoryDelta(outcomeObs.map((o) => o.strategicRisk ?? 0));

  // Drift severity = average absolute trajectory magnitude.
  const trajectories = [
    Math.abs(trustTrajectory.delta),
    Math.abs(repConcernTrajectory.delta),
    Math.abs(identityFragTrajectory.delta),
    Math.abs(fatigueTrajectory.delta),
    Math.abs(strategicRiskTraj.delta),
  ].filter((x) => Number.isFinite(x));
  const driftSeverity = clamp10(round1(avg(trajectories) * 2));

  // ── DOMINANT DRIFT PATTERNS ──────────────────────────────────

  const dominantDriftPatterns: CreativeDriftDominantPattern[] = [];

  if (emotionalDiversity <= 4 && (recentFrames.length + recentTones.length) > 0) {
    const distinct = new Set([...recentFrames, ...recentTones]).size;
    dominantDriftPatterns.push({
      pattern: 'emotional-flattening',
      severity: round1(10 - emotionalDiversity),
      persistence: recentFrames.length + recentTones.length,
      explanation: `only ${distinct} distinct frames/tones across last ${recentFrames.length + recentTones.length} attempts`,
    });
  }

  if (persuasionVariance <= 4 && persuasionModes.length > 0) {
    const distinct = new Set(persuasionModes).size;
    dominantDriftPatterns.push({
      pattern: 'repetitive-persuasion-patterns',
      severity: round1(10 - persuasionVariance),
      persistence: persuasionModes.length,
      explanation: `${distinct} distinct persuasion modes in last ${persuasionModes.length} attempts`,
    });
  }

  if (trustTrajectory.late >= 6 && trustTrajectory.late > trustTrajectory.early) {
    dominantDriftPatterns.push({
      pattern: 'trust-overcompression',
      severity: round1(trustTrajectory.late),
      persistence: stratRep.length,
      explanation: `recent trust debt at ${round1(trustTrajectory.late)}/10 (was ${round1(trustTrajectory.early)})`,
    });
  }

  const recentIdentityFrag = avg(recentId.map((o) => o.identityFragmentation ?? 0));
  if (recentIdentityFrag >= 6) {
    dominantDriftPatterns.push({
      pattern: 'identity-erosion',
      severity: round1(recentIdentityFrag),
      persistence: recentId.length,
      explanation: `identity fragmentation averaging ${round1(recentIdentityFrag)}/10 in last ${recentId.length} observations`,
    });
  }

  if (typeof copywriter.repeatedStructuresScore === 'number' && copywriter.repeatedStructuresScore >= 6) {
    dominantDriftPatterns.push({
      pattern: 'aesthetic-homogenization',
      severity: round1(copywriter.repeatedStructuresScore),
      persistence: (copywriter.structureHistory ?? []).length,
      explanation: `structure repetition score at ${round1(copywriter.repeatedStructuresScore)}/10`,
    });
  }

  if (originalityPressure >= 7) {
    dominantDriftPatterns.push({
      pattern: 'novelty-exhaustion',
      severity: round1(originalityPressure),
      persistence: recentCQ.length + recentRep.length,
      explanation: `combined repetition concern + risk at ${round1(originalityPressure)}/10`,
    });
  }

  // Narrative collapse: a single fingerprint dominates the recent window.
  if (patterns.length >= 4) {
    const counts = new Map<string, number>();
    for (const p of patterns) counts.set(p, (counts.get(p) ?? 0) + 1);
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted[0] && sorted[0][1] / patterns.length >= 0.5) {
      dominantDriftPatterns.push({
        pattern: 'narrative-collapse',
        severity: round1((sorted[0][1] / patterns.length) * 10),
        persistence: patterns.length,
        explanation: `pattern "${sorted[0][0]}" dominates ${Math.round((sorted[0][1] / patterns.length) * 100)}% of recent narratives`,
      });
    }
  }

  // Emotional contradiction accumulation: same window mixes tones that
  // imply contradictory emotional postures. We use a simple proxy —
  // if both "urgent"-flavored and "calm"-flavored tones appear together
  // at high frequency, that's a contradiction signal.
  const contradictionTokens = ['urgent', 'aggressive', 'gentle', 'soft', 'calm', 'patient', 'panic', 'crisp'];
  const presentContradictoryTokens = contradictionTokens.filter((tok) =>
    [...recentTones, ...recentFrames].some((t) => t.toLowerCase().includes(tok)),
  );
  if (presentContradictoryTokens.length >= 4) {
    dominantDriftPatterns.push({
      pattern: 'emotional-contradiction-accumulation',
      severity: round1(presentContradictoryTokens.length),
      persistence: recentTones.length + recentFrames.length,
      explanation: `recent window mixes contradictory tones: ${presentContradictoryTokens.slice(0, 4).join(', ')}`,
    });
  }

  // ── EMERGING CREATIVE RISKS ──────────────────────────────────

  const emergingCreativeRisks: CreativeDriftEmergingRisk[] = [];

  if (trustTrajectory.delta >= 1) {
    emergingCreativeRisks.push({
      risk: 'rising-trust-debt',
      acceleration: round1(trustTrajectory.delta),
      explanation: `trust debt early=${round1(trustTrajectory.early)} → recent=${round1(trustTrajectory.late)} (Δ +${round1(trustTrajectory.delta)})`,
    });
  }
  if (repConcernTrajectory.delta >= 1) {
    emergingCreativeRisks.push({
      risk: 'rising-repetition-concern',
      acceleration: round1(repConcernTrajectory.delta),
      explanation: `repetition concern early=${round1(repConcernTrajectory.early)} → recent=${round1(repConcernTrajectory.late)} (Δ +${round1(repConcernTrajectory.delta)})`,
    });
  }
  if (identityFragTrajectory.delta >= 1) {
    emergingCreativeRisks.push({
      risk: 'rising-identity-fragmentation',
      acceleration: round1(identityFragTrajectory.delta),
      explanation: `identity fragmentation early=${round1(identityFragTrajectory.early)} → recent=${round1(identityFragTrajectory.late)} (Δ +${round1(identityFragTrajectory.delta)})`,
    });
  }
  if (fatigueTrajectory.delta >= 1) {
    emergingCreativeRisks.push({
      risk: 'rising-campaign-fatigue',
      acceleration: round1(fatigueTrajectory.delta),
      explanation: `campaign fatigue early=${round1(fatigueTrajectory.early)} → recent=${round1(fatigueTrajectory.late)} (Δ +${round1(fatigueTrajectory.delta)})`,
    });
  }
  if (strategicRiskTraj.delta >= 1) {
    emergingCreativeRisks.push({
      risk: 'rising-strategic-risk',
      acceleration: round1(strategicRiskTraj.delta),
      explanation: `strategic risk early=${round1(strategicRiskTraj.early)} → recent=${round1(strategicRiskTraj.late)} (Δ +${round1(strategicRiskTraj.delta)})`,
    });
  }

  // ── COLLAPSING CREATIVE DIMENSIONS ───────────────────────────

  const collapsingCreativeDimensions: CreativeDriftCollapsingDimension[] = [];
  if (emotionalDiversity <= 3) {
    collapsingCreativeDimensions.push({
      dimension: 'emotional-diversity',
      decay: round1(10 - emotionalDiversity),
      explanation: `frame/tone diversity at ${emotionalDiversity}/10`,
    });
  }
  if (persuasionVariance <= 3) {
    collapsingCreativeDimensions.push({
      dimension: 'persuasion-variance',
      decay: round1(10 - persuasionVariance),
      explanation: `persuasion mode variance at ${persuasionVariance}/10`,
    });
  }
  if (narrativeStability <= 3 && patterns.length >= 4) {
    collapsingCreativeDimensions.push({
      dimension: 'narrative-stability',
      decay: round1(10 - narrativeStability),
      explanation: `narrative patterns repeating at ${narrativeStability}/10`,
    });
  }
  if (formulaDistinctiveness <= 3 && formulaToAudiences.size >= 2) {
    collapsingCreativeDimensions.push({
      dimension: 'formula-distinctiveness',
      decay: round1(10 - formulaDistinctiveness),
      explanation: `formulas using overlapping audience sets`,
    });
  }

  // ── REPETITIVE NARRATIVES ────────────────────────────────────

  const repetitiveNarratives: CreativeDriftRepetitiveNarrative[] = [];
  const patternCounts = new Map<string, number>();
  for (const p of patterns) patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
  // Also incorporate strategy successfulPatterns frequencies if available.
  if (input.strategy?.successfulPatterns) {
    for (const p of normalizeAll(input.strategy.successfulPatterns)) {
      patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
    }
  }
  for (const [fingerprint, count] of patternCounts) {
    if (count >= 2) {
      repetitiveNarratives.push({
        narrativeFingerprint: fingerprint,
        recurrence: count,
        fatigueRisk: clamp10(round1(count * 2)),
      });
    }
  }
  repetitiveNarratives.sort((a, b) => b.recurrence - a.recurrence || b.fatigueRisk - a.fatigueRisk);

  // ── EMOTIONAL COMPRESSION ────────────────────────────────────

  const emotionalCompression: CreativeDriftEmotionalCompression[] = [];
  const allFrameTokens = [...recentFrames, ...recentTones];
  const frameCounts = new Map<string, number>();
  for (const f of allFrameTokens) frameCounts.set(f, (frameCounts.get(f) ?? 0) + 1);
  for (const [emotion, count] of frameCounts) {
    const share = allFrameTokens.length === 0 ? 0 : count / allFrameTokens.length;
    emotionalCompression.push({
      emotion,
      overused: share >= 0.40,
      saturation: clamp10(round1(share * 10)),
    });
  }
  emotionalCompression.sort((a, b) => b.saturation - a.saturation);

  // ── FORMULA CONVERGENCE ──────────────────────────────────────

  const formulaConvergence: CreativeDriftFormulaConvergence[] = [];
  const formulas = Array.from(formulaToAudiences.keys());
  for (let i = 0; i < formulas.length; i++) {
    for (let j = i + 1; j < formulas.length; j++) {
      const sim = jaccard(formulaToAudiences.get(formulas[i])!, formulaToAudiences.get(formulas[j])!);
      if (sim >= 0.50) {
        formulaConvergence.push({
          formulas: [formulas[i], formulas[j]],
          convergenceLevel: round1(sim * 10),
          explanation: `${formulas[i]} and ${formulas[j]} share ${Math.round(sim * 100)}% of recent audiences`,
        });
      }
    }
  }
  formulaConvergence.sort((a, b) => b.convergenceLevel - a.convergenceLevel);

  // ── MODE DRIFT ───────────────────────────────────────────────

  const modeDrift: CreativeDriftModeDrift[] = [];
  const modeToAudiences = new Map<string, string[]>();
  for (const s of recentStrat) {
    if (!s.campaignMode || !s.audience) continue;
    if (!modeToAudiences.has(s.campaignMode)) modeToAudiences.set(s.campaignMode, []);
    modeToAudiences.get(s.campaignMode)!.push(s.audience);
  }
  for (const [mode, audiences] of modeToAudiences) {
    const distinct = new Set(audiences).size;
    if (audiences.length >= 3 && distinct === 1) {
      modeDrift.push({
        mode, drift: 8,
        explanation: `mode ${mode} stuck on single audience: ${audiences[0]}`,
      });
    } else if (audiences.length >= 4 && distinct <= 2) {
      modeDrift.push({
        mode, drift: 5,
        explanation: `mode ${mode} cycling between just ${distinct} audiences`,
      });
    }
  }
  modeDrift.sort((a, b) => b.drift - a.drift);

  // ── TRUST EROSION TRAJECTORY ─────────────────────────────────

  const trustErosionTrajectory = {
    historical: round1(trustTrajectory.early),
    recent: round1(trustTrajectory.late),
    drift: round1(trustTrajectory.delta),
  };

  // ── CREATIVE INSTABILITY ZONES ───────────────────────────────

  const creativeInstabilityZones: CreativeDriftInstabilityZone[] = [];
  if (entropyLevel < 4 && originalityPressure > 6) {
    creativeInstabilityZones.push({
      condition: 'low-entropy + high-originality-pressure',
      instability: clamp10(round1((10 - entropyLevel) + originalityPressure / 2)),
      explanation: 'producing repetitive output under strong novelty pressure',
    });
  }
  if (formulaDistinctiveness < 4 && formulaToAudiences.size >= 2) {
    creativeInstabilityZones.push({
      condition: 'formula-bleed',
      instability: round1(10 - formulaDistinctiveness),
      explanation: 'formulas are losing distinct personalities',
    });
  }
  if (trustErosionTrajectory.drift >= 2 && narrativeStability < 5) {
    creativeInstabilityZones.push({
      condition: 'trust-erosion + narrative-instability',
      instability: clamp10(round1(trustErosionTrajectory.drift * 2 + (10 - narrativeStability))),
      explanation: 'trust debt rising while narrative patterns are repeating',
    });
  }

  // ── ADVISORY SUMMARY ─────────────────────────────────────────

  const summaryParts: string[] = [];
  if (overallCreativeHealth >= 7) {
    summaryParts.push('Creative organism is healthy.');
  } else if (overallCreativeHealth >= 4) {
    summaryParts.push('Creative organism is showing mild drift.');
  } else {
    summaryParts.push('Creative organism is in significant drift.');
  }
  if (dominantDriftPatterns.length > 0) {
    summaryParts.push(
      `Dominant drift: ${dominantDriftPatterns.slice(0, 3).map((p) => p.pattern).join(', ')}.`,
    );
  }
  if (emergingCreativeRisks.length > 0) {
    summaryParts.push(
      `Emerging risks: ${emergingCreativeRisks.slice(0, 3).map((r) => r.risk).join(', ')}.`,
    );
  }
  if (collapsingCreativeDimensions.length > 0) {
    summaryParts.push(
      `Collapsing: ${collapsingCreativeDimensions.map((d) => d.dimension).join(', ')}.`,
    );
  }
  summaryParts.push(ADVISORY_NOTICE);
  const advisorySummary = summaryParts.join(' ');

  // ── reason codes ─────────────────────────────────────────────

  const reasonCodes: string[] = [
    `health:${overallCreativeHealth}/10`,
    `drift:${driftSeverity}/10`,
    `entropy:${entropyLevel}/10`,
    `originality-pressure:${originalityPressure}/10`,
    `narrative-stability:${narrativeStability}/10`,
    `emotional-diversity:${emotionalDiversity}/10`,
    `persuasion-variance:${persuasionVariance}/10`,
    `formula-distinctiveness:${formulaDistinctiveness}/10`,
    `trust-erosion-drift:${trustErosionTrajectory.drift}`,
    `dominant-patterns:${dominantDriftPatterns.length}`,
    `emerging-risks:${emergingCreativeRisks.length}`,
    `collapsing-dimensions:${collapsingCreativeDimensions.length}`,
    `repetitive-narratives:${repetitiveNarratives.length}`,
    `formula-convergence-pairs:${formulaConvergence.length}`,
    `mode-drift-rows:${modeDrift.length}`,
    `instability-zones:${creativeInstabilityZones.length}`,
  ];

  // Hint that drift readings are deterministic + advisory.
  void recentOutcome;          // declared for symmetry; not yet used in scoring
  void recentStructures;       // future fingerprinting hook

  return {
    overallCreativeHealth,
    driftSeverity,
    entropyLevel,
    originalityPressure,
    narrativeStability,
    emotionalDiversity,
    formulaDistinctiveness,
    persuasionVariance,
    dominantDriftPatterns,
    emergingCreativeRisks,
    collapsingCreativeDimensions,
    repetitiveNarratives,
    emotionalCompression,
    formulaConvergence,
    modeDrift,
    trustErosionTrajectory,
    creativeInstabilityZones,
    advisorySummary,
    reasonCodes,
  };
}
