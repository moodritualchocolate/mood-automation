/**
 * ADAPTATION ORCHESTRATOR (advisory, pure)
 *
 * Centralized prioritization intelligence over the system's
 * adaptation signals. Decides what matters MOST right now and
 * resolves conflicts between competing adaptation strategies using
 * an EXPLICIT deterministic hierarchy.
 *
 * Hierarchy (strictly enforced, top wins):
 *
 *   trustProtection       > persuasionOptimization
 *   identityPreservation  > noveltyEscalation
 *   fatigueRecovery       > repetitionAcceleration
 *   realismRecovery       > cinematicPolish
 *   emotionalTruth        > conversionIntensity
 *   dignityProtection     > aggressionEscalation
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - no critic / pipeline / generation imports
 *   - never modifies prompts, policies, runtime, or memory
 *   - never applies a mutation
 *   - only reports priority + conflict resolution
 *
 * Same input → same output. The orchestrator is a pure decision
 * function; all weights, suppressions, and rankings are derived
 * from a deterministic dispatch table.
 */

// ─── input ────────────────────────────────────────────────────

export interface OrchestratorInput {
  // Core metrics (all 0..10).
  trustDebt?: number;
  originalityPressure?: number;
  fatigueLevel?: number;
  identityErosion?: number;
  dignityErosion?: number;
  visualConvergence?: number;
  emotionalFlattening?: number;
  persuasionCollapse?: number;
  narrativeInstability?: number;
  campaignDrift?: number;
  /** 0..10, high = healthy. */
  longitudinalHealth?: number;
  entropy?: number;
  collapseRisk?: number;
  freshnessScore?: number;
  /** Count of recent mutations to factor into capacity reasoning. */
  recentMutationCount?: number;
}

// ─── concern table ────────────────────────────────────────────
//
// Each concern is a named adaptation pressure plus the metric it
// reads + how to score it (high = bad for the concern). The
// hierarchy below specifies pairwise winners.

type ConcernKey =
  | 'trust-protection'
  | 'identity-preservation'
  | 'dignity-protection'
  | 'fatigue-recovery'
  | 'realism-recovery'
  | 'emotional-truth'
  | 'novelty-escalation'
  | 'persuasion-optimization'
  | 'cinematic-polish'
  | 'conversion-intensity'
  | 'repetition-acceleration'
  | 'aggression-escalation';

interface ConcernPressure {
  key: ConcernKey;
  pressure: number;            // 0..10
  rationale: string;
}

// Pairs where left STRICTLY suppresses right when both are pressing.
const SUPPRESSION_HIERARCHY: Array<[ConcernKey, ConcernKey]> = [
  ['trust-protection',      'persuasion-optimization'],
  ['trust-protection',      'aggression-escalation'],
  ['trust-protection',      'conversion-intensity'],
  ['identity-preservation', 'novelty-escalation'],
  ['fatigue-recovery',      'repetition-acceleration'],
  ['realism-recovery',      'cinematic-polish'],
  ['emotional-truth',       'conversion-intensity'],
  ['dignity-protection',    'aggression-escalation'],
];

// ─── output ───────────────────────────────────────────────────

export type EscalationLevel = 'low' | 'medium' | 'high' | 'critical';
export type SystemState =
  | 'stable'
  | 'recovering'
  | 'mutating'
  | 'protecting'
  | 'unstable';

export interface AdaptationConflict {
  winner: ConcernKey;
  loser: ConcernKey;
  reason: string;
}

export interface AdaptationOrchestration {
  dominantRisk: string;
  dominantPressure: string;
  adaptationPriority: ConcernKey;
  suppressionPriorities: ConcernKey[];
  escalationLevel: EscalationLevel;
  mutationUrgency: number;       // 0..10

  trustProtectionWeight: number;       // 0..10
  originalityProtectionWeight: number; // 0..10
  persuasionReductionWeight: number;   // 0..10
  restraintWeight: number;             // 0..10
  stabilizationWeight: number;         // 0..10

  strategicSummary: string;
  adaptationConflicts: AdaptationConflict[];
  recommendedFocus: string;
  systemState: SystemState;

  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

const ADVISORY_NOTICE =
  'Advisory only — the orchestrator prioritizes adaptation; it never applies, mutates, or rewrites anything.';

// ─── main ─────────────────────────────────────────────────────

export function computeAdaptationOrchestration(
  input: OrchestratorInput,
): AdaptationOrchestration {
  // ── 1. Concern pressures ──────────────────────────────────
  const concerns: ConcernPressure[] = [
    { key: 'trust-protection',      pressure: clamp10(input.trustDebt ?? 0),
      rationale: `trust debt ${round1(input.trustDebt ?? 0)}/10` },
    { key: 'identity-preservation', pressure: clamp10(input.identityErosion ?? 0),
      rationale: `identity erosion ${round1(input.identityErosion ?? 0)}/10` },
    { key: 'dignity-protection',    pressure: clamp10(input.dignityErosion ?? 0),
      rationale: `dignity erosion ${round1(input.dignityErosion ?? 0)}/10` },
    { key: 'fatigue-recovery',      pressure: clamp10(input.fatigueLevel ?? 0),
      rationale: `fatigue level ${round1(input.fatigueLevel ?? 0)}/10` },
    { key: 'realism-recovery',      pressure: clamp10(input.visualConvergence ?? 0),
      rationale: `visual convergence ${round1(input.visualConvergence ?? 0)}/10` },
    { key: 'emotional-truth',       pressure: clamp10(input.emotionalFlattening ?? 0),
      rationale: `emotional flattening ${round1(input.emotionalFlattening ?? 0)}/10` },
    // The "lower" concerns — alternative adaptation strategies the
    // system could pursue. Each carries a small baseline reflecting
    // its availability; the hierarchy below explicitly suppresses
    // them when a higher-priority concern is pressing.
    { key: 'novelty-escalation',          pressure: clamp10(input.originalityPressure ?? 0),
      rationale: `originality pressure ${round1(input.originalityPressure ?? 0)}/10` },
    { key: 'persuasion-optimization',     pressure: clamp10(Math.max(2, (input.persuasionCollapse ?? 0) / 2)),
      rationale: 'available strategy (low-priority baseline)' },
    { key: 'cinematic-polish',            pressure: 2,
      rationale: 'available strategy (low-priority baseline)' },
    { key: 'conversion-intensity',        pressure: 2,
      rationale: 'available strategy (low-priority baseline)' },
    { key: 'repetition-acceleration',     pressure: clamp10(Math.max(2, (10 - (input.entropy ?? 5)) / 3)),
      rationale: 'available strategy (entropy-driven baseline)' },
    { key: 'aggression-escalation',       pressure: 2,
      rationale: 'available strategy (low-priority baseline)' },
  ];

  // ── 2. Apply suppression hierarchy ────────────────────────
  // If a higher-priority concern has pressure ≥ a threshold AND its
  // counterpart is pressing, record the conflict and zero out the
  // loser's pressure for the priority pick.
  const SUPPRESSION_THRESHOLD = 4;
  const pressureByKey = new Map<ConcernKey, ConcernPressure>(
    concerns.map((c) => [c.key, c]),
  );
  const adaptationConflicts: AdaptationConflict[] = [];
  for (const [winnerKey, loserKey] of SUPPRESSION_HIERARCHY) {
    const w = pressureByKey.get(winnerKey)!;
    const l = pressureByKey.get(loserKey)!;
    if (w.pressure >= SUPPRESSION_THRESHOLD && l.pressure > 0) {
      adaptationConflicts.push({
        winner: winnerKey, loser: loserKey,
        reason: `${winnerKey} (${w.pressure}/10) suppresses ${loserKey} (${l.pressure}/10)`,
      });
      // Suppress the loser proportionally — the loser keeps a small
      // residual so it can still surface as a secondary concern.
      pressureByKey.set(loserKey, { ...l, pressure: round1(l.pressure * 0.3) });
    }
  }

  // ── 3. Rank after suppression ─────────────────────────────
  const ranked = Array.from(pressureByKey.values())
    .sort((a, b) => b.pressure - a.pressure || a.key.localeCompare(b.key));
  const dominant = ranked[0] ?? { key: 'trust-protection' as ConcernKey, pressure: 0, rationale: 'none' };

  const adaptationPriority = dominant.key;
  const suppressionPriorities = adaptationConflicts.map((c) => c.loser);

  // ── 4. Escalation level ────────────────────────────────────
  const topPressure = dominant.pressure;
  let escalationLevel: EscalationLevel;
  if (topPressure >= 8) escalationLevel = 'critical';
  else if (topPressure >= 6) escalationLevel = 'high';
  else if (topPressure >= 4) escalationLevel = 'medium';
  else escalationLevel = 'low';

  // ── 5. Strategy weights ────────────────────────────────────
  // Each weight is derived from BOTH the pressure that drives it
  // AND any opposing concern that should hold it back.
  const trustProtectionWeight = round1(clamp10(
    (input.trustDebt ?? 0) + (input.dignityErosion ?? 0) * 0.5,
  ));
  const originalityProtectionWeight = round1(clamp10(
    (input.originalityPressure ?? 0) + (input.fatigueLevel ?? 0) * 0.4,
  ));
  const persuasionReductionWeight = round1(clamp10(
    (input.trustDebt ?? 0) * 0.7 + (input.dignityErosion ?? 0) * 0.5,
  ));
  const restraintWeight = round1(clamp10(
    (input.dignityErosion ?? 0) * 0.6 +
    (input.visualConvergence ?? 0) * 0.4 +
    (input.trustDebt ?? 0) * 0.3,
  ));
  const stabilizationWeight = round1(clamp10(
    (input.campaignDrift ?? 0) * 0.5 +
    (input.identityErosion ?? 0) * 0.5 +
    (input.narrativeInstability ?? 0) * 0.4 +
    (10 - (input.longitudinalHealth ?? 10)) * 0.3,
  ));

  // ── 6. Mutation urgency ────────────────────────────────────
  // Derived from collapse risk + fatigue + originality pressure,
  // dampened by trust/identity concerns that argue for restraint.
  const baseUrgency =
    (input.collapseRisk ?? 0) * 0.4 +
    (input.fatigueLevel ?? 0) * 0.3 +
    (input.originalityPressure ?? 0) * 0.3;
  const restraintDamping =
    Math.max(input.trustDebt ?? 0, input.identityErosion ?? 0, input.dignityErosion ?? 0) * 0.25;
  const mutationUrgency = round1(clamp10(baseUrgency - restraintDamping));

  // ── 7. System state ────────────────────────────────────────
  const health = input.longitudinalHealth ?? 7;
  const criticalSignals = [
    input.trustDebt ?? 0, input.identityErosion ?? 0, input.dignityErosion ?? 0,
    input.collapseRisk ?? 0, input.fatigueLevel ?? 0,
  ].filter((x) => x >= 7).length;
  let systemState: SystemState;
  if (criticalSignals >= 3) systemState = 'unstable';
  else if (trustProtectionWeight >= 6 || restraintWeight >= 6) systemState = 'protecting';
  else if (mutationUrgency >= 6) systemState = 'mutating';
  else if (health < 5) systemState = 'recovering';
  else systemState = 'stable';

  // ── 8. Dominant risk + dominant pressure ──────────────────
  const dominantRisk = (() => {
    const candidates: Array<{ name: string; pressure: number }> = [
      { name: 'trust-erosion',      pressure: input.trustDebt ?? 0 },
      { name: 'identity-fragmentation', pressure: input.identityErosion ?? 0 },
      { name: 'dignity-erosion',    pressure: input.dignityErosion ?? 0 },
      { name: 'creative-collapse',  pressure: input.collapseRisk ?? 0 },
      { name: 'campaign-drift',     pressure: input.campaignDrift ?? 0 },
      { name: 'narrative-instability', pressure: input.narrativeInstability ?? 0 },
    ];
    candidates.sort((a, b) => b.pressure - a.pressure);
    return candidates[0]?.name ?? 'none';
  })();

  const dominantPressure = (() => {
    const candidates: Array<{ name: string; pressure: number }> = [
      { name: 'visual-convergence', pressure: input.visualConvergence ?? 0 },
      { name: 'emotional-flattening', pressure: input.emotionalFlattening ?? 0 },
      { name: 'persuasion-collapse', pressure: input.persuasionCollapse ?? 0 },
      { name: 'fatigue', pressure: input.fatigueLevel ?? 0 },
      { name: 'originality-pressure', pressure: input.originalityPressure ?? 0 },
    ];
    candidates.sort((a, b) => b.pressure - a.pressure);
    return candidates[0]?.name ?? 'none';
  })();

  // ── 9. Strategic summary + recommended focus ──────────────
  const STRATEGIC_LINES: Record<ConcernKey, { summary: string; focus: string }> = {
    'trust-protection': {
      summary: 'Trust continuity overrides novelty pressure.',
      focus: 'reduce persuasion intensity; let the product appear without performing',
    },
    'identity-preservation': {
      summary: 'Identity continuity overrides novelty escalation.',
      focus: 'hold formula and mode; let identity reconstitute before introducing variation',
    },
    'dignity-protection': {
      summary: 'Brand dignity protection suppresses aggression escalation.',
      focus: 'observational framing; remove imperatives; let restraint be visible',
    },
    'fatigue-recovery': {
      summary: 'Fatigue recovery takes precedence over conversion optimization.',
      focus: 'rotate hook structure; widen pacing variance; introduce stillness',
    },
    'realism-recovery': {
      summary: 'Realism recovery overrides cinematic polish.',
      focus: 'reduce polish; allow framing imperfections; documentary register',
    },
    'emotional-truth': {
      summary: 'Emotional truth overrides conversion intensity.',
      focus: 'introduce contrast; allow stillness; widen narrative temperature',
    },
    'novelty-escalation': {
      summary: 'Novelty pressure is leading — proceed with structural variation.',
      focus: 'rotate persuasion mode; allow one structurally unfamiliar run',
    },
    'persuasion-optimization': {
      summary: 'Persuasion optimization is the active focus.',
      focus: 'verify the persuasion choice is right for the audience now',
    },
    'cinematic-polish': {
      summary: 'Cinematic polish is permitted within the current envelope.',
      focus: 'monitor for synthetic familiarity drift',
    },
    'conversion-intensity': {
      summary: 'Conversion-leaning composition is permitted within trust limits.',
      focus: 'watch trust debt closely',
    },
    'repetition-acceleration': {
      summary: 'Repetition cadence is acceptable for now.',
      focus: 'monitor entropy and originality pressure',
    },
    'aggression-escalation': {
      summary: 'Aggression has space to operate.',
      focus: 'watch dignity erosion carefully',
    },
  };

  const STABLE_LINE = {
    summary: 'No single adaptation pressure dominates — the system is operating within its observed envelope.',
    focus: 'proceed; observe',
  };
  const line = topPressure < SUPPRESSION_THRESHOLD ? STABLE_LINE : STRATEGIC_LINES[adaptationPriority];
  const strategicSummary = line.summary;
  const recommendedFocus = line.focus;

  // ── 10. reason codes ─────────────────────────────────────
  const reasonCodes: string[] = [
    `dominant-risk:${dominantRisk}`,
    `dominant-pressure:${dominantPressure}`,
    `adaptation-priority:${adaptationPriority}`,
    `escalation:${escalationLevel}`,
    `mutation-urgency:${mutationUrgency}/10`,
    `system-state:${systemState}`,
    `top-pressure:${topPressure}/10`,
    `conflicts-resolved:${adaptationConflicts.length}`,
    `trust-weight:${trustProtectionWeight}/10`,
    `originality-weight:${originalityProtectionWeight}/10`,
    `persuasion-reduction-weight:${persuasionReductionWeight}/10`,
    `restraint-weight:${restraintWeight}/10`,
    `stabilization-weight:${stabilizationWeight}/10`,
  ];

  return {
    dominantRisk,
    dominantPressure,
    adaptationPriority,
    suppressionPriorities,
    escalationLevel,
    mutationUrgency,
    trustProtectionWeight,
    originalityProtectionWeight,
    persuasionReductionWeight,
    restraintWeight,
    stabilizationWeight,
    strategicSummary,
    adaptationConflicts,
    recommendedFocus,
    systemState,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
