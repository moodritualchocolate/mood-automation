/**
 * CREATIVE FATIGUE ENGINE (advisory, pure)
 *
 * Pure deterministic detector of predictability across four vectors:
 *   - VISUAL    — repeated framing, color, lighting, lens, composition
 *   - EMOTIONAL — repeated inspiration/sadness/urgency arcs
 *   - PERSUASION — repeated CTA / hook / framing
 *   - NARRATIVE — repeated pacing, tension, payoff
 *
 * Reads structural subsets of visual + narrative DNA memories and a
 * creative-drift-style snapshot. No I/O. No mutations. Same input →
 * same output.
 *
 * Output drives the generation mutation planner (advisory only — the
 * fatigue engine itself never applies anything).
 */

// ─── loose subsets ─────────────────────────────────────────────

export interface VisualDNASubset {
  fingerprints?: Array<{
    framingFingerprint?: string;
    lightingSignature?: string;
    lensBehavior?: string;
    compositionGeometry?: string;
    pacingIdentity?: string;
    motionCadence?: string;
    emotionalColorTemperature?: string;
    realismLevel?: number;          // 0..10
    polishLevel?: number;           // 0..10
  }>;
}

export interface NarrativeDNASubset {
  fingerprints?: Array<{
    hookFamily?: string;
    persuasionStructure?: string;
    emotionalCadence?: string;
    tensionCurve?: string;
    payoffTiming?: string;
    silenceUsage?: string;
    observationalDensity?: number;  // 0..10
    narrationStyle?: string;
    humanRealism?: number;          // 0..10
    ctaPressure?: number;           // 0..10
  }>;
}

export interface CreativeFatigueInput {
  visualDNA?: VisualDNASubset | null;
  narrativeDNA?: NarrativeDNASubset | null;
  /** Optional drift signals — used to amplify fatigue when drift is high. */
  driftEntropy?: number;           // 0..10
  driftOriginalityPressure?: number; // 0..10
}

// ─── output ────────────────────────────────────────────────────

export type FatigueVectorName = 'visual' | 'emotional' | 'persuasion' | 'narrative';

export interface FatigueVectorReading {
  vector: FatigueVectorName;
  fatigue: number;            // 0..10
  saturation: number;         // 0..10 (share of dominant token)
  dominantSignal: string | null;
  explanation: string;
}

export interface SaturationSignal {
  vector: FatigueVectorName;
  dimension: string;
  token: string;
  share: number;              // 0..1
}

export interface CreativeFatigue {
  /** Overall fatigue 0..10 — max of vector fatigues. */
  fatigueLevel: number;
  fatigueVectors: FatigueVectorReading[];
  saturationSignals: SaturationSignal[];
  collapseRisk: number;       // 0..10
  mutationPressure: number;   // 0..10 — feeds the mutation planner
  freshnessScore: number;     // 10 - fatigueLevel
  predictabilityScore: number;// 0..10 — max share of any single dominant token
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

const RECENT = 16;

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

function dominantShare(tokens: Array<string | undefined>): { token: string | null; share: number } {
  const counts = new Map<string, number>();
  let total = 0;
  for (const t of tokens) {
    if (typeof t !== 'string' || t.length === 0) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return { token: null, share: 0 };
  let best: [string, number] | null = null;
  for (const [k, v] of counts) {
    if (!best || v > best[1] || (v === best[1] && k.localeCompare(best[0]) < 0)) best = [k, v];
  }
  return { token: best![0], share: best![1] / total };
}

/** Saturation across a set of dimension tokens. Each dimension's
 *  dominant share contributes; we average them, then scale to 0..10. */
function vectorSaturation(
  dimensionTokenLists: Array<{ name: string; tokens: Array<string | undefined> }>,
): { score: number; dominantSignal: string | null; signals: SaturationSignal[]; vector?: FatigueVectorName } {
  const perDim = dimensionTokenLists.map((d) => ({
    name: d.name,
    ...dominantShare(d.tokens),
    sampleSize: d.tokens.filter((t) => typeof t === 'string' && t.length > 0).length,
  }));
  const meaningful = perDim.filter((d) => d.sampleSize >= 2);
  if (meaningful.length === 0) return { score: 0, dominantSignal: null, signals: [] };
  const avgShare = meaningful.reduce((a, d) => a + d.share, 0) / meaningful.length;
  // Score 0..10 — share 1.0 → 10, share 1/N → ~0 (linear from 1/k baseline).
  const baseline = 1 / Math.max(1, meaningful.length);
  const norm = clamp10(((avgShare - baseline) / (1 - baseline)) * 10);
  const signals: SaturationSignal[] = meaningful
    .filter((d) => d.share >= 0.45 && d.token !== null)
    .map((d) => ({
      vector: 'visual' as FatigueVectorName,  // overwritten by caller
      dimension: d.name,
      token: d.token as string,
      share: Math.round(d.share * 100) / 100,
    }));
  const dominantBucket = meaningful.reduce((acc, d) => d.share > acc.share ? { name: d.name, share: d.share } : acc, { name: '', share: 0 });
  return { score: round1(norm), dominantSignal: dominantBucket.name || null, signals };
}

const ADVISORY_NOTICE =
  'Advisory only — the fatigue engine reports predictability. It never modifies generation.';

// ─── main ─────────────────────────────────────────────────────

export function computeCreativeFatigue(
  input: CreativeFatigueInput,
): CreativeFatigue {
  const vFingerprints = (input.visualDNA?.fingerprints ?? []).slice(-RECENT);
  const nFingerprints = (input.narrativeDNA?.fingerprints ?? []).slice(-RECENT);

  // ── VISUAL ─────────────────────────────────────────────────
  const visualReading = vectorSaturation([
    { name: 'framing',    tokens: vFingerprints.map((f) => f.framingFingerprint) },
    { name: 'lighting',   tokens: vFingerprints.map((f) => f.lightingSignature) },
    { name: 'lens',       tokens: vFingerprints.map((f) => f.lensBehavior) },
    { name: 'composition',tokens: vFingerprints.map((f) => f.compositionGeometry) },
    { name: 'pacing',     tokens: vFingerprints.map((f) => f.pacingIdentity) },
  ]);
  const visualVector: FatigueVectorReading = {
    vector: 'visual',
    fatigue: visualReading.score,
    saturation: visualReading.score,
    dominantSignal: visualReading.dominantSignal,
    explanation: vFingerprints.length === 0
      ? 'no visual fingerprints recorded yet'
      : `visual saturation across framing/lighting/lens/composition/pacing`,
  };
  for (const s of visualReading.signals) s.vector = 'visual';

  // ── EMOTIONAL ──────────────────────────────────────────────
  const emotionalReading = vectorSaturation([
    { name: 'colorTemperature',  tokens: vFingerprints.map((f) => f.emotionalColorTemperature) },
    { name: 'cadence',           tokens: nFingerprints.map((f) => f.emotionalCadence) },
  ]);
  const emotionalVector: FatigueVectorReading = {
    vector: 'emotional',
    fatigue: emotionalReading.score,
    saturation: emotionalReading.score,
    dominantSignal: emotionalReading.dominantSignal,
    explanation: nFingerprints.length === 0
      ? 'no narrative fingerprints recorded yet'
      : 'emotional saturation across cadence + color temperature',
  };
  for (const s of emotionalReading.signals) s.vector = 'emotional';

  // ── PERSUASION ─────────────────────────────────────────────
  const persuasionReading = vectorSaturation([
    { name: 'hookFamily',          tokens: nFingerprints.map((f) => f.hookFamily) },
    { name: 'persuasionStructure', tokens: nFingerprints.map((f) => f.persuasionStructure) },
  ]);
  const persuasionVector: FatigueVectorReading = {
    vector: 'persuasion',
    fatigue: persuasionReading.score,
    saturation: persuasionReading.score,
    dominantSignal: persuasionReading.dominantSignal,
    explanation: nFingerprints.length === 0
      ? 'no narrative fingerprints recorded yet'
      : 'persuasion saturation across hook / structure',
  };
  for (const s of persuasionReading.signals) s.vector = 'persuasion';

  // ── NARRATIVE ──────────────────────────────────────────────
  const narrativeReading = vectorSaturation([
    { name: 'tensionCurve',  tokens: nFingerprints.map((f) => f.tensionCurve) },
    { name: 'payoffTiming',  tokens: nFingerprints.map((f) => f.payoffTiming) },
    { name: 'silenceUsage',  tokens: nFingerprints.map((f) => f.silenceUsage) },
    { name: 'narrationStyle',tokens: nFingerprints.map((f) => f.narrationStyle) },
  ]);
  const narrativeVector: FatigueVectorReading = {
    vector: 'narrative',
    fatigue: narrativeReading.score,
    saturation: narrativeReading.score,
    dominantSignal: narrativeReading.dominantSignal,
    explanation: nFingerprints.length === 0
      ? 'no narrative fingerprints recorded yet'
      : 'narrative saturation across tension / payoff / silence / narration',
  };
  for (const s of narrativeReading.signals) s.vector = 'narrative';

  const fatigueVectors = [visualVector, emotionalVector, persuasionVector, narrativeVector]
    .sort((a, b) => b.fatigue - a.fatigue || a.vector.localeCompare(b.vector));

  // ── aggregate scores ──────────────────────────────────────
  const fatigueLevel = round1(Math.max(...fatigueVectors.map((v) => v.fatigue)));
  const freshnessScore = round1(clamp10(10 - fatigueLevel));
  const allShares = [
    ...visualReading.signals, ...emotionalReading.signals,
    ...persuasionReading.signals, ...narrativeReading.signals,
  ].map((s) => s.share);
  const predictabilityScore = allShares.length === 0
    ? round1(fatigueLevel)
    : round1(clamp10(Math.max(...allShares) * 10));

  // Collapse risk: high fatigue + low entropy + high originality pressure.
  const driftPenalty = Math.max(
    (input.driftOriginalityPressure ?? 0) - 5,
    5 - (input.driftEntropy ?? 5),
    0,
  );
  const collapseRisk = round1(clamp10(fatigueLevel * 0.7 + driftPenalty * 0.6));

  // Mutation pressure mirrors fatigue with a small drift bump.
  const mutationPressure = round1(clamp10(
    fatigueLevel * 0.85 + (input.driftOriginalityPressure ?? 0) * 0.1,
  ));

  const saturationSignals: SaturationSignal[] = [
    ...visualReading.signals, ...emotionalReading.signals,
    ...persuasionReading.signals, ...narrativeReading.signals,
  ].sort((a, b) => b.share - a.share);

  const reasonCodes: string[] = [
    `fatigue-level:${fatigueLevel}/10`,
    `freshness:${freshnessScore}/10`,
    `predictability:${predictabilityScore}/10`,
    `collapse-risk:${collapseRisk}/10`,
    `mutation-pressure:${mutationPressure}/10`,
    `visual:${visualVector.fatigue}/10`,
    `emotional:${emotionalVector.fatigue}/10`,
    `persuasion:${persuasionVector.fatigue}/10`,
    `narrative:${narrativeVector.fatigue}/10`,
    `saturation-signals:${saturationSignals.length}`,
    `visual-samples:${vFingerprints.length}`,
    `narrative-samples:${nFingerprints.length}`,
  ];

  return {
    fatigueLevel,
    fatigueVectors,
    saturationSignals,
    collapseRisk,
    mutationPressure,
    freshnessScore,
    predictabilityScore,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
