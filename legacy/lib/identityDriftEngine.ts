/**
 * IDENTITY DRIFT ENGINE (pure, observational)
 *
 * Observes whether the brand / system is slowly drifting away from
 * its original emotional identity. Computes drift signatures across
 * tone, emotional stability, performance pressure, inspiration
 * pressure, realism erosion, intimacy inflation, groundedness loss,
 * aesthetic conformity, and symbolic incoherence.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never auto-corrects identity
 *   - never blocks generation
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "identity appears stable", "identity appears to be drifting"
 *   - forbidden: self-rewrite, autonomous correction, auto-heal
 */

// ─── loose structural subsets ────────────────────────────────

export interface DriftOutcomeSubset {
  outcomes?: Array<{
    at?: number;
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    cadenceState?: string;
    downstreamOutcome?: string;
  }>;
}

export interface DriftVisualSubset {
  fingerprints?: Array<{
    at?: number;
    framingFingerprint?: string;
    lightingSignature?: string;
    emotionalColorTemperature?: string;
    realismLevel?: number;
    polishLevel?: number;
  }>;
}

export interface DriftNarrativeSubset {
  fingerprints?: Array<{
    at?: number;
    emotionalCadence?: string;
    narrationStyle?: string;
    humanRealism?: number;
    ctaPressure?: number;
    observationalDensity?: number;
  }>;
}

export interface IdentityDriftInput {
  outcomes?: DriftOutcomeSubset | null;
  visualDNA?: DriftVisualSubset | null;
  narrativeDNA?: DriftNarrativeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface IdentityDriftSignals {
  toneMutation: number;
  emotionalInstability: number;
  overPerformance: number;
  excessiveInspiration: number;
  realismErosion: number;
  intimacyInflation: number;
  groundednessLoss: number;
  aestheticConformity: number;
  symbolicIncoherence: number;
}

export type DriftVerdict = 'identity-stable' | 'identity-mildly-drifting' | 'identity-drifting' | 'identity-strongly-drifting';

export interface IdentityDriftReading {
  windowSize: number;
  signals: IdentityDriftSignals;
  /** Overall identity drift index — 0..10. */
  overallDriftIndex: number;
  verdict: DriftVerdict;
  dominantDriftSignals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system reflects on its own identity drift. ' +
  'It never autonomously modifies itself.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function halves<T>(xs: T[]): { early: T[]; late: T[] } {
  if (xs.length < 2) return { early: xs, late: xs };
  const mid = Math.floor(xs.length / 2);
  return { early: xs.slice(0, mid), late: xs.slice(mid) };
}

function tokenDominance(tokens: Array<string | undefined>): number {
  const filtered = tokens.filter((t): t is string => typeof t === 'string' && t.length > 0);
  if (filtered.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const t of filtered) counts.set(t, (counts.get(t) ?? 0) + 1);
  let max = 0;
  for (const v of counts.values()) if (v > max) max = v;
  return max / filtered.length;
}

function tokenDistinct(tokens: Array<string | undefined>): number {
  const filtered = tokens.filter((t): t is string => typeof t === 'string' && t.length > 0);
  const set = new Set(filtered);
  return set.size;
}

// ─── main ─────────────────────────────────────────────────────

export function computeIdentityDrift(input: IdentityDriftInput): IdentityDriftReading {
  const outcomes = (input.outcomes?.outcomes ?? []).slice()
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const visualFps = (input.visualDNA?.fingerprints ?? []).slice()
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const narrativeFps = (input.narrativeDNA?.fingerprints ?? []).slice()
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));

  const { early: outEarly, late: outLate } = halves(outcomes);
  const { early: visEarly, late: visLate } = halves(visualFps);
  const { early: narEarly, late: narLate } = halves(narrativeFps);

  // ── tone mutation ─────────────────────────────────────────
  // Earlier dominant emotional cadence token vs later. Significant
  // shift = tone mutation.
  const earlyCadenceDom = tokenDominance(narEarly.map((f) => f.emotionalCadence));
  const lateCadenceDom = tokenDominance(narLate.map((f) => f.emotionalCadence));
  // Combined with shift in narration style.
  const earlyNarStyle = tokenDominance(narEarly.map((f) => f.narrationStyle));
  const lateNarStyle = tokenDominance(narLate.map((f) => f.narrationStyle));
  const toneMutation = clamp10(
    Math.abs(earlyCadenceDom - lateCadenceDom) * 7 +
    Math.abs(earlyNarStyle - lateNarStyle) * 5,
  );

  // ── emotional instability ─────────────────────────────────
  // High variance in emotional signatures across the window.
  const distinctEmoEarly = tokenDistinct(outEarly.map((o) => o.emotionalSignature));
  const distinctEmoLate = tokenDistinct(outLate.map((o) => o.emotionalSignature));
  const emotionalInstability = clamp10(
    Math.abs(distinctEmoLate - distinctEmoEarly) * 1.5 +
    (distinctEmoLate >= 6 ? 3 : 0),
  );

  // ── over-performance ──────────────────────────────────────
  // Rising mean persuasion intensity from early to late.
  const earlyPersuasion = avg(outEarly.map((o) => o.persuasionIntensity ?? 5));
  const latePersuasion = avg(outLate.map((o) => o.persuasionIntensity ?? 5));
  const overPerformance = clamp10(
    Math.max(0, latePersuasion - earlyPersuasion) * 2 +
    Math.max(0, latePersuasion - 5) * 0.6,
  );

  // ── excessive inspiration ─────────────────────────────────
  // Rising aspirational / inspirational signature share.
  const inspirationalShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => /aspir|inspir|elevat|trans|peak|hero/i.test(
      (o.emotionalSignature ?? '') + ' ' + (o.narrativeSignature ?? ''),
    )).length / outcomes.length;
  const excessiveInspiration = clamp10(inspirationalShare * 10);

  // ── realism erosion ───────────────────────────────────────
  // Late realism level significantly lower than early realism level.
  const earlyVisRealism = avg(visEarly.map((f) => f.realismLevel ?? 5));
  const lateVisRealism = avg(visLate.map((f) => f.realismLevel ?? 5));
  const earlyNarRealism = avg(narEarly.map((f) => f.humanRealism ?? 5));
  const lateNarRealism = avg(narLate.map((f) => f.humanRealism ?? 5));
  const realismErosion = clamp10(
    Math.max(0, earlyVisRealism - lateVisRealism) * 1.5 +
    Math.max(0, earlyNarRealism - lateNarRealism) * 1.5,
  );

  // ── intimacy inflation ────────────────────────────────────
  // Outcomes using intimate / vulnerable language while observational
  // density is FALLING (i.e., performance-of-intimacy instead of intimacy).
  const intimateShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => /intima|vulnerab|confess|whisper|raw|tender/i.test(
      (o.emotionalSignature ?? '') + ' ' + (o.narrativeSignature ?? ''),
    )).length / outcomes.length;
  const earlyObs = avg(narEarly.map((f) => f.observationalDensity ?? 5));
  const lateObs = avg(narLate.map((f) => f.observationalDensity ?? 5));
  const obsFalling = Math.max(0, earlyObs - lateObs);
  const intimacyInflation = clamp10(intimateShare * 8 + obsFalling * 1.5);

  // ── groundedness loss ─────────────────────────────────────
  // Falling silence + falling grounded outcome share + rising stimulation.
  const earlyVisRealismGround = avg(visEarly.map((f) => f.realismLevel ?? 5));
  const lateVisRealismGround = avg(visLate.map((f) => f.realismLevel ?? 5));
  const groundedShareEarly = outEarly.length === 0 ? 0 :
    outEarly.filter((o) => /ground|home|ordinary|every|still|real/i.test(
      (o.emotionalSignature ?? '') + ' ' + (o.visualStyle ?? ''),
    )).length / outEarly.length;
  const groundedShareLate = outLate.length === 0 ? 0 :
    outLate.filter((o) => /ground|home|ordinary|every|still|real/i.test(
      (o.emotionalSignature ?? '') + ' ' + (o.visualStyle ?? ''),
    )).length / outLate.length;
  const groundednessLoss = clamp10(
    Math.max(0, earlyVisRealismGround - lateVisRealismGround) * 1.5 +
    Math.max(0, groundedShareEarly - groundedShareLate) * 10,
  );

  // ── aesthetic conformity ──────────────────────────────────
  // Late framing / lighting token convergence is HIGH (>0.7).
  const lateFramingDom = tokenDominance(visLate.map((f) => f.framingFingerprint));
  const lateLightingDom = tokenDominance(visLate.map((f) => f.lightingSignature));
  const lateColorDom = tokenDominance(visLate.map((f) => f.emotionalColorTemperature));
  const aestheticConformity = clamp10(
    Math.max(0, (lateFramingDom + lateLightingDom + lateColorDom) / 3 - 0.4) * 16,
  );

  // ── symbolic incoherence ──────────────────────────────────
  // Rising distinct visual + narrative tokens without anchoring outcome
  // story (i.e., symbols multiplying but engagement not tracking).
  const distinctVisualTokens = tokenDistinct(visualFps.map((f) => f.framingFingerprint))
    + tokenDistinct(visualFps.map((f) => f.lightingSignature));
  const distinctNarTokens = tokenDistinct(narrativeFps.map((f) => f.emotionalCadence))
    + tokenDistinct(narrativeFps.map((f) => f.narrationStyle));
  const proliferation = (distinctVisualTokens + distinctNarTokens) /
    Math.max(1, visualFps.length + narrativeFps.length);
  const symbolicIncoherence = clamp10(Math.max(0, proliferation - 0.5) * 10);

  const signals: IdentityDriftSignals = {
    toneMutation:         r1(toneMutation),
    emotionalInstability: r1(emotionalInstability),
    overPerformance:      r1(overPerformance),
    excessiveInspiration: r1(excessiveInspiration),
    realismErosion:       r1(realismErosion),
    intimacyInflation:    r1(intimacyInflation),
    groundednessLoss:     r1(groundednessLoss),
    aestheticConformity:  r1(aestheticConformity),
    symbolicIncoherence:  r1(symbolicIncoherence),
  };

  // ── overall drift index ──────────────────────────────────
  const overallDriftIndex = r1(clamp10(
    avg(Object.values(signals)),
  ));

  const verdict: DriftVerdict =
    overallDriftIndex <= 2 ? 'identity-stable' :
    overallDriftIndex <= 4 ? 'identity-mildly-drifting' :
    overallDriftIndex <= 6 ? 'identity-drifting' :
                             'identity-strongly-drifting';

  const ranked = Object.entries(signals)
    .map(([k, v]) => [k, v as number] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  notes.push(`identity appears ${verdict.replace('identity-', '').replace(/-/g, ' ')}`);
  if (signals.toneMutation >= 6) notes.push('tone mutation observed alongside narration-style shift');
  if (signals.realismErosion >= 5) notes.push('realism erosion observed across early-to-late window');
  if (signals.intimacyInflation >= 6) notes.push('intimacy inflation observed alongside falling observational density');
  if (signals.aestheticConformity >= 7) notes.push('aesthetic conformity appears elevated in late-window visual tokens');
  if (signals.overPerformance >= 5) notes.push('over-performance observed alongside rising persuasion intensity');

  return {
    windowSize: outcomes.length + visualFps.length + narrativeFps.length,
    signals,
    overallDriftIndex,
    verdict,
    dominantDriftSignals: ranked,
    notes,
    reasonCodes: [
      `verdict:${verdict}`,
      `index:${overallDriftIndex}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
