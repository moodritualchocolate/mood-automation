/**
 * AESTHETIC COLLAPSE ENGINE (pure, observational)
 *
 * Detects aesthetic overexposure and sameness — the slow collapse of
 * a successful aesthetic into a pattern that no longer carries
 * emotional power.
 *
 * The system should understand: even successful aesthetics
 * eventually collapse.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never auto-mutates the aesthetic
 *   - never blocks generation
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "appears to be collapsing", "appears stable"
 *   - forbidden: self-rewrite, autonomous correction, auto-heal
 */

// ─── loose structural subsets ────────────────────────────────

export interface CollapseOutcomeSubset {
  outcomes?: Array<{
    at?: number;
    creativeFingerprint?: string;
    emotionalSignature?: string;
    visualStyle?: string;
    cadenceState?: string;
    downstreamOutcome?: string;
    metrics?: {
      retention?: number; saves?: number; bounceRate?: number;
      shares?: number; rewatches?: number;
    };
  }>;
}

export interface CollapseVisualSubset {
  fingerprints?: Array<{
    at?: number;
    framingFingerprint?: string;
    lightingSignature?: string;
    pacingIdentity?: string;
    typographyRhythm?: string;
    motionCadence?: string;
    emotionalColorTemperature?: string;
    polishLevel?: number;
    realismLevel?: number;
  }>;
}

export interface CollapseNarrativeSubset {
  fingerprints?: Array<{
    at?: number;
    emotionalCadence?: string;
    tensionCurve?: string;
  }>;
}

export interface AestheticCollapseInput {
  outcomes?: CollapseOutcomeSubset | null;
  visualDNA?: CollapseVisualSubset | null;
  narrativeDNA?: CollapseNarrativeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface CollapseSignal {
  /** 0..10 — current convergence/repetition intensity. */
  level: number;
  /** 0..10 — engagement decline observed on this signature. */
  engagementDecline: number;
  note: string;
}

export interface AestheticCollapseSignals {
  repeatedPacing: CollapseSignal;
  repeatedEmotionalCadence: CollapseSignal;
  repeatedVisualRhythm: CollapseSignal;
  repeatedTypographyEnergy: CollapseSignal;
  repeatedCinematicFraming: CollapseSignal;
  aiFeelingSignature: CollapseSignal;
  emotionalFlattening: CollapseSignal;
  overstimulationFatigue: CollapseSignal;
}

export type CollapseVerdict = 'aesthetic-stable' | 'aesthetic-saturating' | 'aesthetic-collapsing';

export interface AestheticCollapseReading {
  windowSize: number;
  signals: AestheticCollapseSignals;
  overallCollapseIndex: number;
  verdict: CollapseVerdict;
  dominantCollapseSignals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system reflects on its own aesthetic collapse signals. ' +
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

function tokenDominance(tokens: Array<string | undefined>): { dominantShare: number; dominantToken: string | null; distinct: number } {
  const filtered = tokens.filter((t): t is string => typeof t === 'string' && t.length > 0);
  if (filtered.length === 0) return { dominantShare: 0, dominantToken: null, distinct: 0 };
  const counts = new Map<string, number>();
  for (const t of filtered) counts.set(t, (counts.get(t) ?? 0) + 1);
  let best: [string, number] | null = null;
  for (const [k, v] of counts) {
    if (!best || v > best[1] || (v === best[1] && k.localeCompare(best[0]) < 0)) best = [k, v];
  }
  return {
    dominantShare: best ? best[1] / filtered.length : 0,
    dominantToken: best?.[0] ?? null,
    distinct: counts.size,
  };
}

type Out = NonNullable<CollapseOutcomeSubset['outcomes']>[number];

function engagementOf(o: Out): number {
  return (o.metrics?.retention ?? 0) + Math.min(1, (o.metrics?.saves ?? 0) / 10) +
         Math.min(1, (o.metrics?.shares ?? 0) / 10);
}

// ─── main ─────────────────────────────────────────────────────

export function computeAestheticCollapse(input: AestheticCollapseInput): AestheticCollapseReading {
  const outcomes = (input.outcomes?.outcomes ?? []).slice()
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const visualFps = (input.visualDNA?.fingerprints ?? []).slice()
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const narrativeFps = (input.narrativeDNA?.fingerprints ?? []).slice()
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));

  const { early: outEarly, late: outLate } = halves(outcomes);

  // Helper: signature engagement decline on dominant token.
  function declineFor(token: string | null, get: (o: Out) => string | undefined): number {
    if (!token) return 0;
    const early = outEarly.filter((o) => get(o) === token);
    const late = outLate.filter((o) => get(o) === token);
    if (early.length === 0 || late.length === 0) return 0;
    const earlyEng = avg(early.map(engagementOf));
    const lateEng = avg(late.map(engagementOf));
    return clamp10(Math.max(0, earlyEng - lateEng) * 8);
  }

  // ── repeated pacing ──────────────────────────────────────
  const pacingDom = tokenDominance(visualFps.map((f) => f.pacingIdentity));
  const repeatedPacing: CollapseSignal = {
    level: r1(clamp10(pacingDom.dominantShare * 10)),
    engagementDecline: r1(declineFor(pacingDom.dominantToken, (o) => o.cadenceState)),
    note: pacingDom.dominantShare >= 0.7
      ? 'pacing signature appears highly repeated'
      : 'pacing signature appears stable',
  };

  // ── repeated emotional cadence ───────────────────────────
  const cadenceDom = tokenDominance(narrativeFps.map((f) => f.emotionalCadence));
  const repeatedEmotionalCadence: CollapseSignal = {
    level: r1(clamp10(cadenceDom.dominantShare * 10)),
    engagementDecline: r1(declineFor(cadenceDom.dominantToken, (o) => o.emotionalSignature)),
    note: cadenceDom.dominantShare >= 0.7
      ? 'emotional cadence appears highly repeated'
      : 'emotional cadence appears stable',
  };

  // ── repeated visual rhythm ───────────────────────────────
  const motionDom = tokenDominance(visualFps.map((f) => f.motionCadence));
  const repeatedVisualRhythm: CollapseSignal = {
    level: r1(clamp10(motionDom.dominantShare * 10)),
    engagementDecline: r1(declineFor(motionDom.dominantToken, (o) => o.visualStyle)),
    note: motionDom.dominantShare >= 0.7
      ? 'visual rhythm appears highly repeated'
      : 'visual rhythm appears stable',
  };

  // ── repeated typography energy ───────────────────────────
  const typoDom = tokenDominance(visualFps.map((f) => f.typographyRhythm));
  const repeatedTypographyEnergy: CollapseSignal = {
    level: r1(clamp10(typoDom.dominantShare * 10)),
    engagementDecline: 0,
    note: typoDom.dominantShare >= 0.7
      ? 'typography energy appears highly repeated'
      : 'typography energy appears stable',
  };

  // ── repeated cinematic framing ───────────────────────────
  const framingDom = tokenDominance(visualFps.map((f) => f.framingFingerprint));
  const repeatedCinematicFraming: CollapseSignal = {
    level: r1(clamp10(framingDom.dominantShare * 10)),
    engagementDecline: r1(declineFor(framingDom.dominantToken, (o) => o.creativeFingerprint)),
    note: framingDom.dominantShare >= 0.7
      ? 'cinematic framing appears highly repeated'
      : 'cinematic framing appears stable',
  };

  // ── AI-feeling signature ─────────────────────────────────
  // High polish + low realism + dominant single token in lighting.
  const meanPolish = avg(visualFps.map((f) => f.polishLevel ?? 5));
  const meanRealism = avg(visualFps.map((f) => f.realismLevel ?? 5));
  const lightingDom = tokenDominance(visualFps.map((f) => f.lightingSignature));
  const aiSig = clamp10(
    meanPolish * 0.4 + (10 - meanRealism) * 0.3 + lightingDom.dominantShare * 10 * 0.3,
  );
  const aiFeelingSignature: CollapseSignal = {
    level: r1(aiSig),
    engagementDecline: r1(declineFor(lightingDom.dominantToken, (o) => o.visualStyle)),
    note: aiSig >= 7
      ? 'AI-feeling signature appears elevated'
      : 'AI-feeling signature appears within observed band',
  };

  // ── emotional flattening ─────────────────────────────────
  // Distinct emotional signatures collapsing toward 1-2 tokens.
  const emoDom = tokenDominance(outcomes.map((o) => o.emotionalSignature));
  const flattening = clamp10(
    Math.max(0, emoDom.dominantShare - 0.4) * 16,
  );
  const emotionalFlattening: CollapseSignal = {
    level: r1(flattening),
    engagementDecline: r1(declineFor(emoDom.dominantToken, (o) => o.emotionalSignature)),
    note: flattening >= 6
      ? 'emotional flattening appears elevated'
      : 'emotional flattening appears within observed band',
  };

  // ── overstimulation fatigue ──────────────────────────────
  // Burst cadence share rising + retention falling on burst outcomes.
  const burstShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst').length / outcomes.length;
  const burstEarly = outEarly.filter((o) => o.cadenceState === 'burst');
  const burstLate = outLate.filter((o) => o.cadenceState === 'burst');
  const burstRetentionDecline = (burstEarly.length === 0 || burstLate.length === 0) ? 0 :
    Math.max(0,
      avg(burstEarly.map((o) => o.metrics?.retention ?? 0)) -
      avg(burstLate.map((o) => o.metrics?.retention ?? 0)),
    );
  const overstim = clamp10(burstShare * 5 + burstRetentionDecline * 20);
  const overstimulationFatigue: CollapseSignal = {
    level: r1(overstim),
    engagementDecline: r1(clamp10(burstRetentionDecline * 20)),
    note: overstim >= 6
      ? 'overstimulation fatigue appears elevated'
      : 'overstimulation fatigue appears within observed band',
  };

  const signals: AestheticCollapseSignals = {
    repeatedPacing,
    repeatedEmotionalCadence,
    repeatedVisualRhythm,
    repeatedTypographyEnergy,
    repeatedCinematicFraming,
    aiFeelingSignature,
    emotionalFlattening,
    overstimulationFatigue,
  };

  // Composite: convergence level + decline impact.
  const convergenceMean = avg(Object.values(signals).map((s) => s.level));
  const declineMean = avg(Object.values(signals).map((s) => s.engagementDecline));
  const overallCollapseIndex = r1(clamp10(convergenceMean * 0.7 + declineMean * 0.3));

  const verdict: CollapseVerdict =
    overallCollapseIndex <= 3 ? 'aesthetic-stable' :
    overallCollapseIndex <= 6 ? 'aesthetic-saturating' :
                                'aesthetic-collapsing';

  const dominantCollapseSignals = Object.entries(signals)
    .map(([k, v]) => [k, v.level + v.engagementDecline] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  notes.push(`aesthetic motion appears ${verdict.replace('aesthetic-', '')}`);
  if (signals.aiFeelingSignature.level >= 7) notes.push('AI-feeling signature appears elevated — historically associated with humanity erosion');
  if (signals.overstimulationFatigue.level >= 6) notes.push('overstimulation fatigue observed alongside burst-cadence retention decline');
  if (signals.emotionalFlattening.level >= 6) notes.push('emotional signature convergence observed across the window');
  if (declineMean >= 3) notes.push('engagement decline observed alongside repeated dominant tokens');

  return {
    windowSize: outcomes.length + visualFps.length + narrativeFps.length,
    signals,
    overallCollapseIndex,
    verdict,
    dominantCollapseSignals,
    notes,
    reasonCodes: [
      `verdict:${verdict}`,
      `index:${overallCollapseIndex}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v.level}/${v.engagementDecline}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
