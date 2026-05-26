/**
 * SYSTEM ENERGY MODEL (advisory, pure)
 *
 * The system cannot infinitely mutate everything. This pure analyzer
 * tracks the adaptation budget so the orchestrator can prefer
 * stability when novelty has been spent. Same input → same output.
 *
 * Goal: prevent over-mutation chaos. The system learns that sometimes
 * stability is healthier than novelty.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - no critic / pipeline / generation imports
 *   - never modifies prompts, policies, runtime, or memory
 *   - never schedules a mutation; only describes what the budget is
 */

// ─── input ────────────────────────────────────────────────────

export interface EnergyModelInput {
  /** Mutations that the operator has chosen to apply recently. */
  recentMutationCount?: number;
  /** Stabilization events (e.g. operator paused mutation, held formula). */
  recentStabilizationEvents?: number;
  /** Collapse events from creative drift memory. */
  collapseEvents?: number;
  /** Recovery events from creative drift memory. */
  recoveryEvents?: number;
  /** Current fatigue level 0..10. */
  fatigueLevel?: number;
  /** Current trust debt 0..10. */
  trustDebt?: number;
  /** Current originality pressure 0..10. */
  originalityPressure?: number;
  /** Current entropy 0..10. */
  entropy?: number;
  /** Run rate over window (mutations per N runs). */
  mutationsPerWindow?: number;
  /** Total runs in the window. */
  windowSize?: number;
}

// ─── output ───────────────────────────────────────────────────

export interface SystemEnergyModel {
  /** 0..10 — how much adaptation capacity remains. */
  availableBandwidth: number;
  /** 0..10 — capacity to apply additional mutations safely. */
  mutationCapacity: number;
  /** 0..10 — load currently absorbed by stabilization work. */
  stabilizationLoad: number;
  /** 0..10 — risk that aggressive mutation will exhaust the system. */
  exhaustionRisk: number;
  /** 0..10 — demand for recovery before more change. */
  recoveryNeed: number;
  /** 0..10 — recommended adaptation budget. */
  adaptationBudget: number;
  /** 0..10 — how close to overload the system is. */
  overloadRisk: number;
  /** Suggested upper bound on mutations per next N runs. */
  sustainableMutationRate: number;

  energyState: 'fresh' | 'measured' | 'taxed' | 'overloaded';
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

const ADVISORY_NOTICE =
  'Advisory only — the energy model describes adaptation budget; it never schedules a mutation.';

// ─── main ─────────────────────────────────────────────────────

export function computeSystemEnergyModel(
  input: EnergyModelInput,
): SystemEnergyModel {
  // Each load axis 0..10.

  // Exhaustion: rises with recent mutation count + fatigue.
  const recentMut = input.recentMutationCount ?? 0;
  const exhaustionRisk = clamp10(round1(
    Math.min(recentMut * 1.5, 10) * 0.5 +
    (input.fatigueLevel ?? 0) * 0.5,
  ));

  // Stabilization load: rises with stabilization events + collapse count.
  const stabilizationLoad = clamp10(round1(
    (input.recentStabilizationEvents ?? 0) * 1.5 +
    (input.collapseEvents ?? 0) * 1.2,
  ));

  // Recovery need: collapse events minus recovery events.
  const collapses  = input.collapseEvents ?? 0;
  const recoveries = input.recoveryEvents ?? 0;
  const recoveryNeed = clamp10(round1(
    Math.max(0, collapses - recoveries) * 2 +
    (input.trustDebt ?? 0) * 0.4,
  ));

  // Mutation capacity: high when the system is fresh; low when taxed.
  // Anchored at 10 then drained by exhaustion + stabilization + recovery.
  const mutationCapacity = clamp10(round1(
    10 - (exhaustionRisk * 0.5 + stabilizationLoad * 0.3 + recoveryNeed * 0.4),
  ));

  // Available bandwidth: the tightest of (mutationCapacity, 10-load axes).
  const availableBandwidth = clamp10(round1(Math.min(
    mutationCapacity,
    10 - stabilizationLoad,
    10 - exhaustionRisk,
    10 - recoveryNeed,
  )));

  // Overload risk: when load axes converge high.
  const overloadRisk = clamp10(round1(
    Math.max(exhaustionRisk, stabilizationLoad, recoveryNeed) *
    (exhaustionRisk + stabilizationLoad + recoveryNeed >= 18 ? 1.2 : 0.8),
  ));

  // Adaptation budget — proportional to bandwidth.
  const adaptationBudget = clamp10(round1(
    availableBandwidth * 0.8 + Math.max(0, (input.originalityPressure ?? 0) - 5) * 0.4,
  ));

  // Sustainable mutation rate (0..N) — recommend a count per ~10 runs.
  // Map 0..10 budget linearly to 0..6 mutations per 10 runs.
  const sustainableMutationRate = Math.max(0, Math.min(6, Math.round(adaptationBudget * 0.6)));

  // Classification.
  let energyState: SystemEnergyModel['energyState'];
  if (overloadRisk >= 8 || availableBandwidth < 2) energyState = 'overloaded';
  else if (availableBandwidth < 5)              energyState = 'taxed';
  else if (availableBandwidth < 8)              energyState = 'measured';
  else                                          energyState = 'fresh';

  const reasonCodes: string[] = [
    `available-bandwidth:${availableBandwidth}/10`,
    `mutation-capacity:${mutationCapacity}/10`,
    `stabilization-load:${stabilizationLoad}/10`,
    `exhaustion-risk:${exhaustionRisk}/10`,
    `recovery-need:${recoveryNeed}/10`,
    `adaptation-budget:${adaptationBudget}/10`,
    `overload-risk:${overloadRisk}/10`,
    `sustainable-mutation-rate:${sustainableMutationRate}-per-10-runs`,
    `recent-mutations:${recentMut}`,
    `collapse-events:${collapses}`,
    `recovery-events:${recoveries}`,
    `energy-state:${energyState}`,
  ];

  return {
    availableBandwidth,
    mutationCapacity,
    stabilizationLoad,
    exhaustionRisk,
    recoveryNeed,
    adaptationBudget,
    overloadRisk,
    sustainableMutationRate,
    energyState,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
