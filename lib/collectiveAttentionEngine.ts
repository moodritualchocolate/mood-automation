/**
 * COLLECTIVE ATTENTION ENGINE (pure, observational)
 *
 * Observes collective attention motion across the audience window.
 * Tracks short-form exhaustion, replay culture, doomscroll fatigue,
 * silence tolerance, overstimulation rejection, attention
 * fragmentation, pacing recovery, and long-form trust restoration.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a format
 *   - never names a "winning" length / cadence
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "appears to be rising", "appears to be receding"
 *   - forbidden: prediction, persuasion steering, behavioral targeting,
 *     optimization, manipulation scoring, political segmentation
 */

// ─── loose structural subsets ────────────────────────────────

export interface AttentionOutcomeSubset {
  outcomes?: Array<{
    at?: number;
    cadenceState?: string;
    exposureWindow?: { startedAt?: number; endedAt?: number; durationHours?: number };
    metrics?: {
      retention?: number;
      scrollDepth?: number;
      bounceRate?: number;
      rewatches?: number;
      saves?: number;
      shares?: number;
      averageWatchTimeSec?: number;
      contentDurationSec?: number;
    };
    downstreamOutcome?: string;
    visualStyle?: string;
    emotionalSignature?: string;
  }>;
}

export interface AttentionDriftSubset {
  observations?: Array<{
    at?: number;
    attentionPressure?: number;
    pacingPressure?: number;
    overallCreativeHealth?: number;
  }>;
}

export interface CollectiveAttentionInput {
  outcomes?: AttentionOutcomeSubset | null;
  drift?: AttentionDriftSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface AttentionSignal {
  /** 0..10 — current intensity. */
  level: number;
  /** -10..+10 — recent migration direction. */
  migrationDirection: number;
  note: string;
}

export interface CollectiveAttentionReading {
  totalOutcomes: number;
  shortFormExhaustion: AttentionSignal;
  replayCulture: AttentionSignal;
  doomscrollFatigue: AttentionSignal;
  silenceTolerance: AttentionSignal;
  overstimulationRejection: AttentionSignal;
  attentionFragmentation: AttentionSignal;
  pacingRecovery: AttentionSignal;
  longFormTrustRestoration: AttentionSignal;
  dominantMovements: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — attention is a collective phenomenon. ' +
  'The system observes its motion and never optimizes for it.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function signedClamp10(n: number): number { return Math.max(-10, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<AttentionOutcomeSubset['outcomes']>[number];

function halves<T>(xs: T[]): { early: T[]; late: T[] } {
  if (xs.length < 2) return { early: xs, late: xs };
  const mid = Math.floor(xs.length / 2);
  return { early: xs.slice(0, mid), late: xs.slice(mid) };
}

function migration(early: number[], late: number[]): number {
  return signedClamp10((avg(late) - avg(early)) * 2);
}

function describeDirection(dir: number, label: string): string {
  if (dir >= 1.5) return `${label} appears to be rising`;
  if (dir <= -1.5) return `${label} appears to be receding`;
  return `${label} appears stable in this window`;
}

// ─── main ─────────────────────────────────────────────────────

export function computeCollectiveAttention(
  input: CollectiveAttentionInput,
): CollectiveAttentionReading {
  const outcomes: Out[] = (input.outcomes?.outcomes ?? []).slice()
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const driftObs = input.drift?.observations ?? [];
  const { early, late } = halves(outcomes);

  // ── short-form exhaustion ────────────────────────────────
  // Short-form: contentDurationSec ≤ 30. Exhaustion proxy:
  // declining retention on those pieces in the late window.
  const shortPieces = outcomes.filter((o) => (o.metrics?.contentDurationSec ?? 60) <= 30);
  const shortRetentionE = early.filter((o) => (o.metrics?.contentDurationSec ?? 60) <= 30)
    .map((o) => o.metrics?.retention ?? 0);
  const shortRetentionL = late.filter((o) => (o.metrics?.contentDurationSec ?? 60) <= 30)
    .map((o) => o.metrics?.retention ?? 0);
  const shortFormExhaustion: AttentionSignal = {
    level: r1(clamp10((1 - avg(shortPieces.map((o) => o.metrics?.retention ?? 0))) * 10)),
    // Migration is INVERSE — declining retention = exhaustion rising.
    migrationDirection: r1(signedClamp10((avg(shortRetentionE) - avg(shortRetentionL)) * 20)),
    note: '',
  };
  shortFormExhaustion.note = describeDirection(shortFormExhaustion.migrationDirection, 'short-form exhaustion');

  // ── replay culture ────────────────────────────────────────
  const rewatchE = early.map((o) => o.metrics?.rewatches ?? 0);
  const rewatchL = late.map((o) => o.metrics?.rewatches ?? 0);
  const replayCulture: AttentionSignal = {
    level: r1(clamp10(avg(outcomes.map((o) => Math.min(1, (o.metrics?.rewatches ?? 0) / 3))) * 10)),
    migrationDirection: r1(migration(rewatchE, rewatchL)),
    note: '',
  };
  replayCulture.note = describeDirection(replayCulture.migrationDirection, 'replay culture');

  // ── doomscroll fatigue ────────────────────────────────────
  // Proxy: high bounceRate + low scrollDepth = doomscroll motion.
  const dsE = early.map((o) => (o.metrics?.bounceRate ?? 0) * 5 + (1 - (o.metrics?.scrollDepth ?? 0.5)) * 5);
  const dsL = late.map((o) => (o.metrics?.bounceRate ?? 0) * 5 + (1 - (o.metrics?.scrollDepth ?? 0.5)) * 5);
  const doomscrollFatigue: AttentionSignal = {
    level: r1(clamp10(avg(dsL))),
    migrationDirection: r1(migration(dsE, dsL)),
    note: '',
  };
  doomscrollFatigue.note = describeDirection(doomscrollFatigue.migrationDirection, 'doomscroll fatigue signature');

  // ── silence tolerance ─────────────────────────────────────
  // Outcomes with low audio / silence-leaning visual style engaging well.
  const silentLike = outcomes.filter((o) =>
    /silen|quiet|calm|still/.test((o.visualStyle ?? '').toLowerCase()) ||
    /still|quiet|calm|silen/.test((o.emotionalSignature ?? '').toLowerCase()),
  );
  const silentEng = silentLike.length === 0 ? 0 :
    avg(silentLike.map((o) => (o.metrics?.retention ?? 0) + (o.metrics?.saves ?? 0) / 10));
  const silenceTolerance: AttentionSignal = {
    level: r1(clamp10(silentEng * 7)),
    migrationDirection: r1(signedClamp10((
      avg(late.filter((o) => /silen|quiet|calm|still/.test((o.visualStyle ?? '').toLowerCase()))
        .map((o) => o.metrics?.retention ?? 0)) -
      avg(early.filter((o) => /silen|quiet|calm|still/.test((o.visualStyle ?? '').toLowerCase()))
        .map((o) => o.metrics?.retention ?? 0))
    ) * 20)),
    note: '',
  };
  silenceTolerance.note = describeDirection(silenceTolerance.migrationDirection, 'silence tolerance');

  // ── overstimulation rejection ─────────────────────────────
  // High burst cadence + falling retention = rejection rising.
  const burstE = early.filter((o) => o.cadenceState === 'burst');
  const burstL = late.filter((o) => o.cadenceState === 'burst');
  const burstRetE = avg(burstE.map((o) => o.metrics?.retention ?? 0));
  const burstRetL = avg(burstL.map((o) => o.metrics?.retention ?? 0));
  const overstimulationRejection: AttentionSignal = {
    level: r1(clamp10((1 - avg(outcomes.filter((o) => o.cadenceState === 'burst').map((o) => o.metrics?.retention ?? 0))) * 10)),
    migrationDirection: r1(signedClamp10((burstRetE - burstRetL) * 20)),
    note: '',
  };
  overstimulationRejection.note = describeDirection(overstimulationRejection.migrationDirection, 'overstimulation rejection');

  // ── attention fragmentation ───────────────────────────────
  const fragE = early.map((o) => (1 - (o.metrics?.scrollDepth ?? 0.5)) * 5 + (o.metrics?.bounceRate ?? 0) * 5);
  const fragL = late.map((o) => (1 - (o.metrics?.scrollDepth ?? 0.5)) * 5 + (o.metrics?.bounceRate ?? 0) * 5);
  const attentionFragmentation: AttentionSignal = {
    level: r1(clamp10(avg(fragL))),
    migrationDirection: r1(migration(fragE, fragL)),
    note: '',
  };
  attentionFragmentation.note = describeDirection(attentionFragmentation.migrationDirection, 'attention fragmentation');

  // ── pacing recovery ───────────────────────────────────────
  // Inverse of pacingPressure from drift observations.
  const pacingE = early.length > 0 ? avg(driftObs.slice(0, Math.max(1, Math.floor(driftObs.length / 2)))
    .map((d) => d.pacingPressure ?? 5)) : 5;
  const pacingL = late.length > 0 ? avg(driftObs.slice(-Math.max(1, Math.floor(driftObs.length / 2)))
    .map((d) => d.pacingPressure ?? 5)) : 5;
  const pacingRecovery: AttentionSignal = {
    level: r1(clamp10(10 - pacingL)),
    // Recovery is rising when pacing pressure is falling.
    migrationDirection: r1(signedClamp10((pacingE - pacingL) * 2)),
    note: '',
  };
  pacingRecovery.note = describeDirection(pacingRecovery.migrationDirection, 'pacing recovery');

  // ── long-form trust restoration ───────────────────────────
  const longPieces = outcomes.filter((o) => (o.metrics?.contentDurationSec ?? 30) >= 90);
  const longRetentionE = early.filter((o) => (o.metrics?.contentDurationSec ?? 30) >= 90)
    .map((o) => o.metrics?.retention ?? 0);
  const longRetentionL = late.filter((o) => (o.metrics?.contentDurationSec ?? 30) >= 90)
    .map((o) => o.metrics?.retention ?? 0);
  const longFormTrustRestoration: AttentionSignal = {
    level: r1(clamp10(avg(longPieces.map((o) => o.metrics?.retention ?? 0)) * 10)),
    migrationDirection: r1(migration(longRetentionE, longRetentionL)),
    note: '',
  };
  longFormTrustRestoration.note = describeDirection(longFormTrustRestoration.migrationDirection, 'long-form trust restoration');

  // ── dominant movements ──────────────────────────────────
  const dims: Array<[string, number]> = [
    ['shortFormExhaustion', shortFormExhaustion.migrationDirection],
    ['replayCulture', replayCulture.migrationDirection],
    ['doomscrollFatigue', doomscrollFatigue.migrationDirection],
    ['silenceTolerance', silenceTolerance.migrationDirection],
    ['overstimulationRejection', overstimulationRejection.migrationDirection],
    ['attentionFragmentation', attentionFragmentation.migrationDirection],
    ['pacingRecovery', pacingRecovery.migrationDirection],
    ['longFormTrustRestoration', longFormTrustRestoration.migrationDirection],
  ];
  const dominantMovements = dims
    .map(([k, v]) => [k, Math.abs(v)] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  if (shortFormExhaustion.level >= 6) notes.push('short-form retention appears suppressed — historically associated with audience exhaustion');
  if (doomscrollFatigue.level >= 6) notes.push('doomscroll fatigue signature observed alongside bounce + low scroll-depth');
  if (silenceTolerance.migrationDirection >= 2) notes.push('silence tolerance appears to be rising in audience response');
  if (overstimulationRejection.migrationDirection >= 2) notes.push('overstimulation rejection appears to be rising in observed outcomes');
  if (longFormTrustRestoration.level >= 6) notes.push('long-form retention observed alongside engagement');
  if (pacingRecovery.migrationDirection >= 2) notes.push('pacing recovery appears to be rising — historically associated with attention restoration');
  if (notes.length === 0) notes.push('attention motion appears stable in this window');

  return {
    totalOutcomes: outcomes.length,
    shortFormExhaustion,
    replayCulture,
    doomscrollFatigue,
    silenceTolerance,
    overstimulationRejection,
    attentionFragmentation,
    pacingRecovery,
    longFormTrustRestoration,
    dominantMovements,
    notes,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `drift:${driftObs.length}`,
      `shortExhaust:${shortFormExhaustion.level}->${shortFormExhaustion.migrationDirection}`,
      `replay:${replayCulture.level}->${replayCulture.migrationDirection}`,
      `doomscroll:${doomscrollFatigue.level}->${doomscrollFatigue.migrationDirection}`,
      `silence:${silenceTolerance.level}->${silenceTolerance.migrationDirection}`,
      `overstim:${overstimulationRejection.level}->${overstimulationRejection.migrationDirection}`,
      `frag:${attentionFragmentation.level}->${attentionFragmentation.migrationDirection}`,
      `pacing:${pacingRecovery.level}->${pacingRecovery.migrationDirection}`,
      `longForm:${longFormTrustRestoration.level}->${longFormTrustRestoration.migrationDirection}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
