/**
 * ADAPTIVE CADENCE ENGINE (advisory, pure)
 *
 * Controls HOW FAST the system should evolve — not whether to.
 * The cadence engine produces a recommended adaptation tempo
 * (stabilizing / gradual / normal / burst / paused) plus cooldown
 * windows that the operator can respect.
 *
 * Behavior:
 *   - too many recent mutations → force stabilization cadence
 *   - visual fatigue rising slowly → gradual cadence
 *   - creative collapse detected → allow high-burst cadence
 *   - trust debt high → trust restoration window active
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - no critic / pipeline / generation imports
 *   - never modifies prompts, policies, runtime, or memory
 *   - never schedules; only recommends a tempo
 *
 * Same input → same output.
 */

export type CadenceState =
  | 'paused'         // hard stop on adaptations
  | 'stabilizing'    // active stabilization period
  | 'gradual'        // small, slow mutations only
  | 'normal'         // standard mutation cadence
  | 'burst';         // open window for high adaptation

// ─── input ────────────────────────────────────────────────────

export interface CadenceInput {
  /** Mutations applied in the recent window (operator-counted). */
  recentMutationCount?: number;
  /** Size of the window in runs. */
  windowSize?: number;
  /** Visual fatigue from the fatigue engine, 0..10. */
  visualFatigue?: number;
  /** Fatigue trajectory delta (recent - early), -10..+10. */
  fatigueTrajectoryDelta?: number;
  /** Creative collapse detected (e.g. health < threshold). */
  collapseDetected?: boolean;
  /** Trust debt 0..10. */
  trustDebt?: number;
  /** Identity erosion 0..10. */
  identityErosion?: number;
  /** Available bandwidth from the energy model 0..10. */
  availableBandwidth?: number;
  /** Overload risk from the energy model 0..10. */
  overloadRisk?: number;
}

// ─── output ───────────────────────────────────────────────────

export interface AdaptiveCadence {
  cadenceState: CadenceState;
  /** Recommended count of mutations per run. 0 = none. */
  recommendedMutationsPerRun: number;
  /** Runs the system should wait before resuming mutation work. */
  cooldownRemaining: number;
  noveltyCooldownActive: boolean;
  trustRestorationActive: boolean;
  fatigueRecoveryWindowOpen: boolean;
  cadenceJustification: string;
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

const ADVISORY_NOTICE =
  'Advisory only — the cadence engine suggests adaptation tempo; the operator decides what runs next.';

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}

// ─── main ─────────────────────────────────────────────────────

export function computeAdaptiveCadence(input: CadenceInput): AdaptiveCadence {
  const recentMut    = input.recentMutationCount ?? 0;
  const windowSize   = input.windowSize ?? 10;
  const visualFat    = input.visualFatigue ?? 0;
  const trajDelta    = input.fatigueTrajectoryDelta ?? 0;
  const collapse     = input.collapseDetected ?? false;
  const trustDebt    = input.trustDebt ?? 0;
  const identity     = input.identityErosion ?? 0;
  const bandwidth    = input.availableBandwidth ?? 10;
  const overload     = input.overloadRisk ?? 0;

  // ── Decision tree ──────────────────────────────────────────
  let cadenceState: CadenceState;
  let cadenceJustification: string;

  if (overload >= 8 || bandwidth < 2) {
    cadenceState = 'paused';
    cadenceJustification = `overload risk ${overload}/10 or bandwidth ${bandwidth}/10 — hard pause`;
  } else if (collapse) {
    cadenceState = 'burst';
    cadenceJustification = 'creative collapse detected — adaptation burst window is open';
  } else if (recentMut / windowSize >= 0.5) {
    cadenceState = 'stabilizing';
    cadenceJustification = `${recentMut} mutations in last ${windowSize} runs — force stabilization`;
  } else if (trustDebt >= 7 || identity >= 7) {
    cadenceState = 'stabilizing';
    cadenceJustification = `trust debt ${trustDebt}/10 or identity erosion ${identity}/10 — stabilize first`;
  } else if (visualFat >= 4 && trajDelta >= 0 && trajDelta < 2) {
    cadenceState = 'gradual';
    cadenceJustification = `visual fatigue rising slowly (${visualFat}/10, Δ ${trajDelta}) — small mutations only`;
  } else if (visualFat >= 6 || trajDelta >= 2) {
    cadenceState = 'normal';
    cadenceJustification = `fatigue elevated — proceed at normal cadence`;
  } else {
    cadenceState = 'normal';
    cadenceJustification = 'no acute pressure — standard cadence';
  }

  // ── Mutations per run + cooldown ──────────────────────────
  const RECOMMENDED: Record<CadenceState, number> = {
    paused: 0,
    stabilizing: 0,
    gradual: 1,
    normal: 2,
    burst: 4,
  };
  const recommendedMutationsPerRun = RECOMMENDED[cadenceState];

  // Cooldown — how many runs to wait before re-evaluating.
  const cooldownRemaining = (() => {
    if (cadenceState === 'paused')      return clamp(2, 6, Math.round(overload / 2));
    if (cadenceState === 'stabilizing') return clamp(1, 4, Math.round(recentMut / 2));
    if (cadenceState === 'gradual')     return 1;
    return 0;
  })();

  const noveltyCooldownActive   = cadenceState === 'paused' || cadenceState === 'stabilizing';
  const trustRestorationActive  = trustDebt >= 6;
  const fatigueRecoveryWindowOpen = visualFat >= 5 && (cadenceState === 'gradual' || cadenceState === 'stabilizing');

  const reasonCodes: string[] = [
    `cadence:${cadenceState}`,
    `mutations-per-run:${recommendedMutationsPerRun}`,
    `cooldown:${cooldownRemaining}`,
    `recent-mutations:${recentMut}/${windowSize}`,
    `visual-fatigue:${visualFat}/10`,
    `trajectory-delta:${trajDelta}`,
    `trust-debt:${trustDebt}/10`,
    `identity-erosion:${identity}/10`,
    `bandwidth:${bandwidth}/10`,
    `overload:${overload}/10`,
    `novelty-cooldown:${noveltyCooldownActive}`,
    `trust-restoration:${trustRestorationActive}`,
    `fatigue-recovery-window:${fatigueRecoveryWindowOpen}`,
  ];

  return {
    cadenceState,
    recommendedMutationsPerRun,
    cooldownRemaining,
    noveltyCooldownActive,
    trustRestorationActive,
    fatigueRecoveryWindowOpen,
    cadenceJustification,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
