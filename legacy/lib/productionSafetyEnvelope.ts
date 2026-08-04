/**
 * PRODUCTION SAFETY ENVELOPE (advisory, read-only)
 *
 * Pure analyzer over a FullHardeningMatrixReport. Computes:
 *
 *   - per-dimension stability scores (formula / mode / brutality)
 *   - per-cell composite stability (weakest-link of the three dims)
 *   - SAFE / WARNING / FORBIDDEN matrix tiering
 *   - recommended runtime policy (default, fallback, max brutality,
 *     refusal escalation, latency + memory guardrails)
 *   - leaderboard, top-10 dangerous, top-10 safest
 *   - overall production readiness score
 *
 * ARCHITECTURE CONTRACT:
 *   - pure function: same input → same output
 *   - no I/O of any kind in this module
 *   - no runtime mutation: the envelope is OBSERVATORY ONLY
 *   - the system must NEVER auto-apply the recommendedRuntimePolicy.
 *     A human operator reviews the envelope and decides.
 *
 * Stability scoring (deterministic):
 *
 *   baseScore     = 10 × (1 - failureRate)            // 10 clean, 0 all-fail
 *   latencyPenalty= clamp(0..3, (avgLatencyMs - 1500) / 1500)
 *   stabilityScore= clamp(0..10, baseScore - latencyPenalty)
 *
 * Tier thresholds:
 *   safe      : stabilityScore ≥ 8.0
 *   warning   : 5.0 ≤ stabilityScore < 8.0
 *   forbidden : stabilityScore < 5.0
 */

// Structural subset of FullHardeningMatrixReport that the analyzer
// reads. Defined locally so the module has no upward import into
// scripts/.
export interface MatrixReportInput {
  totalCombinations: number;
  totalRuns: number;
  approvals: number;
  refusals: number;
  failures: number;
  degradedAdvisories: number;
  averageLatencyMs: number;
  latencyHeatmap: {
    byFormula: Record<string, number>;
    byMode: Record<string, number>;
    byBrutality: Record<string, number>;
    perCombination: Array<{
      formula: string; mode: string; brutality: number; latencyMs: number;
    }>;
  };
  fifoPressure: {
    capped: number;
    overCap: number;
    total: number;
    overCapDetails: string[];
  };
  memoryGrowth: {
    filesTouched: string[];
    bytesAdded: number;
    perFile: Record<string, { before: number; after: number; delta: number }>;
  };
  routeErrorInventory: Array<{ route: string; error: string; phase: string }>;
  panelSyncWarnings: string[];
  refusalReasonDistribution: Record<string, number>;
  verdictDistribution: Record<string, number>;
  formulaStabilityRanking: Array<{
    formula: string; failureRate: number; avgLatencyMs: number; rank: number;
  }>;
  campaignModeStabilityRanking: Array<{
    mode: string; failureRate: number; avgLatencyMs: number; rank: number;
  }>;
  brutalityStressRanking: Array<{
    brutality: number; failureRate: number; avgLatencyMs: number; rank: number;
  }>;
  deterministicConsistencyScore: number;
  stoppedEarly: boolean;
  stoppedReason: string | null;
}

export type SafetyTier = 'safe' | 'warning' | 'forbidden';

export interface DimensionStability<K> {
  key: K;
  stabilityScore: number;     // 0..10
  failureRate: number;
  avgLatencyMs: number;
  safetyTier: SafetyTier;
  rank: number;               // 1 = safest in dimension
}

export interface CellStability {
  formula: string;
  mode: string;
  brutality: number;
  stabilityScore: number;     // min of three dim scores (weakest-link)
  cellLatencyMs: number;
  safetyTier: SafetyTier;
  warningReasons: string[];
  riskReasons: string[];
}

export interface RecommendedRuntimePolicy {
  defaultProductionMode: {
    formula: string;
    mode: string | null;          // null = AUTO
    brutality: number;
  };
  maxAllowedBrutality: number;
  safeFallbackMode: {
    formula: string;
    mode: string | null;
    brutality: number;
  };
  refusalEscalationRules: {
    consecutiveRefusalsTrigger: number;
    escalationAction: 'log-only' | 'switch-to-fallback';
    maxAllowedRefusalRate: number;
  };
  latencyGuardrails: {
    p50TargetMs: number;
    p95CeilingMs: number;
    timeoutMs: number;
  };
  memoryPressureGuardrails: {
    alertOnUncappedFile: true;
    fifoCapMustBeRespected: true;
    maxBytesGrowthPerRun: number;
    hotspotFiles: string[];
  };
}

export interface ProductionSafetyEnvelope {
  schemaVersion: 1;
  generatedAt: string;             // ISO timestamp
  advisoryOnly: true;
  systemMustNeverAutoApply: true;

  sourceReport: {
    totalCombinations: number;
    totalRuns: number;
    deterministicConsistencyScore: number;
    stoppedEarly: boolean;
    stoppedReason: string | null;
  };

  formulaStability: Array<DimensionStability<string>>;
  modeStability: Array<DimensionStability<string>>;
  brutalityStability: Array<DimensionStability<number>>;

  safestFormulas: string[];
  safestModes: string[];
  safestBrutalityRanges: number[];

  highestRiskCombinations: CellStability[];     // ascending stability
  highestLatencyCombinations: Array<{
    formula: string; mode: string; brutality: number; latencyMs: number;
  }>;
  instabilityClusters: Array<{
    axis: 'formula' | 'mode' | 'brutality';
    value: string | number;
    failureRate: number;
    avgLatencyMs: number;
    stabilityScore: number;
  }>;
  refusalHeavyZones: Array<{
    axis: 'formula' | 'mode' | 'brutality' | 'aggregate';
    value: string | number | 'aggregate';
    refusalShare: number;
    note: string;
  }>;
  memoryPressureHotspots: Array<{
    file: string;
    deltaBytes: number;
    shareOfTotalGrowth: number;
  }>;

  SAFE_PRODUCTION_MATRIX: CellStability[];
  WARNING_MATRIX: CellStability[];
  FORBIDDEN_MATRIX: CellStability[];

  recommendedRuntimePolicy: RecommendedRuntimePolicy;

  rankedStabilityLeaderboard: CellStability[];  // descending
  top10Dangerous: CellStability[];
  top10Safest: CellStability[];

  productionReadinessScore: number;             // 0..10
  productionReadinessReasonCodes: string[];

  reasonCodes: string[];
}

// ─── helpers ──────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round3(n: number): number { return Math.round(n * 1000) / 1000; }

const SAFE_THRESHOLD = 8.0;
const WARNING_THRESHOLD = 5.0;
const LATENCY_PENALTY_BASE_MS = 1500;
const LATENCY_PENALTY_MAX = 3;

function computeStabilityScore(failureRate: number, avgLatencyMs: number): number {
  const baseScore = 10 * (1 - clamp(0, 1, failureRate));
  const latencyPenalty = clamp(0, LATENCY_PENALTY_MAX,
    (avgLatencyMs - LATENCY_PENALTY_BASE_MS) / LATENCY_PENALTY_BASE_MS,
  );
  return round1(clamp(0, 10, baseScore - latencyPenalty));
}

function tierFor(stabilityScore: number): SafetyTier {
  if (stabilityScore >= SAFE_THRESHOLD) return 'safe';
  if (stabilityScore >= WARNING_THRESHOLD) return 'warning';
  return 'forbidden';
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = clamp(0, sortedAsc.length - 1, Math.floor(sortedAsc.length * p));
  return sortedAsc[idx];
}

function uniqueOrdered<T>(xs: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of xs) if (!seen.has(x)) { seen.add(x); out.push(x); }
  return out;
}

// ─── main ──────────────────────────────────────────────────────

export interface BuildOptions {
  /** Pinned timestamp for deterministic builds (verification reuse). */
  now?: string;
}

export function buildProductionSafetyEnvelope(
  report: MatrixReportInput,
  opts: BuildOptions = {},
): ProductionSafetyEnvelope {
  // ── Per-dimension stability ─────────────────────────────────
  const formulaStability = report.formulaStabilityRanking
    .map((row): DimensionStability<string> => {
      const stabilityScore = computeStabilityScore(row.failureRate, row.avgLatencyMs);
      return {
        key: row.formula,
        stabilityScore,
        failureRate: round3(row.failureRate),
        avgLatencyMs: row.avgLatencyMs,
        safetyTier: tierFor(stabilityScore),
        rank: 0,
      };
    })
    .sort((a, b) => b.stabilityScore - a.stabilityScore)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const modeStability = report.campaignModeStabilityRanking
    .map((row): DimensionStability<string> => {
      const stabilityScore = computeStabilityScore(row.failureRate, row.avgLatencyMs);
      return {
        key: row.mode,
        stabilityScore,
        failureRate: round3(row.failureRate),
        avgLatencyMs: row.avgLatencyMs,
        safetyTier: tierFor(stabilityScore),
        rank: 0,
      };
    })
    .sort((a, b) => b.stabilityScore - a.stabilityScore)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const brutalityStability = report.brutalityStressRanking
    .map((row): DimensionStability<number> => {
      const stabilityScore = computeStabilityScore(row.failureRate, row.avgLatencyMs);
      return {
        key: row.brutality,
        stabilityScore,
        failureRate: round3(row.failureRate),
        avgLatencyMs: row.avgLatencyMs,
        safetyTier: tierFor(stabilityScore),
        rank: 0,
      };
    })
    .sort((a, b) => b.stabilityScore - a.stabilityScore)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  // Indexed lookups for cell composition.
  const formulaScoreOf = new Map(formulaStability.map((r) => [r.key, r] as const));
  const modeScoreOf    = new Map(modeStability.map((r) => [r.key, r] as const));
  const brutScoreOf    = new Map(brutalityStability.map((r) => [r.key, r] as const));

  // ── Per-cell composite stability (weakest-link) ─────────────
  // Average latency per (formula, mode, brutality). The latencyHeatmap
  // already lists per-run latency; we collapse repeats by averaging.
  type CellKey = string;
  const cellLatencyBuckets = new Map<CellKey, number[]>();
  for (const row of report.latencyHeatmap.perCombination) {
    const key: CellKey = `${row.formula}|${row.mode}|${row.brutality}`;
    if (!cellLatencyBuckets.has(key)) cellLatencyBuckets.set(key, []);
    cellLatencyBuckets.get(key)!.push(row.latencyMs);
  }

  const cells: CellStability[] = [];
  for (const [key, latencies] of cellLatencyBuckets) {
    const [formula, mode, brutalityStr] = key.split('|');
    const brutality = parseFloat(brutalityStr);
    const fScore = formulaScoreOf.get(formula);
    const mScore = modeScoreOf.get(mode);
    const bScore = brutScoreOf.get(brutality);
    if (!fScore || !mScore || !bScore) continue;

    const cellLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const compositeScore = round1(Math.min(
      fScore.stabilityScore, mScore.stabilityScore, bScore.stabilityScore,
    ));
    const tier = tierFor(compositeScore);

    const warningReasons: string[] = [];
    const riskReasons: string[] = [];
    if (fScore.safetyTier === 'forbidden') riskReasons.push(`formula:${formula} forbidden (score ${fScore.stabilityScore})`);
    else if (fScore.safetyTier === 'warning') warningReasons.push(`formula:${formula} warning (score ${fScore.stabilityScore})`);
    if (mScore.safetyTier === 'forbidden') riskReasons.push(`mode:${mode} forbidden (score ${mScore.stabilityScore})`);
    else if (mScore.safetyTier === 'warning') warningReasons.push(`mode:${mode} warning (score ${mScore.stabilityScore})`);
    if (bScore.safetyTier === 'forbidden') riskReasons.push(`brutality:${brutality} forbidden (score ${bScore.stabilityScore})`);
    else if (bScore.safetyTier === 'warning') warningReasons.push(`brutality:${brutality} warning (score ${bScore.stabilityScore})`);
    if (cellLatency > LATENCY_PENALTY_BASE_MS * 2) {
      warningReasons.push(`cell latency ${cellLatency}ms exceeds 2× nominal`);
    }

    cells.push({
      formula, mode, brutality,
      stabilityScore: compositeScore,
      cellLatencyMs: cellLatency,
      safetyTier: tier,
      warningReasons,
      riskReasons,
    });
  }

  // Deterministic ordering for downstream consumers.
  cells.sort((a, b) =>
    a.formula.localeCompare(b.formula) ||
    a.mode.localeCompare(b.mode) ||
    a.brutality - b.brutality,
  );

  // ── Safe zones ──────────────────────────────────────────────
  const safestFormulas = formulaStability
    .filter((r) => r.safetyTier === 'safe')
    .map((r) => r.key);
  const safestModes = modeStability
    .filter((r) => r.safetyTier === 'safe')
    .map((r) => r.key);
  const safestBrutalityRanges = brutalityStability
    .filter((r) => r.safetyTier === 'safe')
    .map((r) => r.key);

  // ── Top-10 dangerous + safest + leaderboard ────────────────
  const byStabilityAsc  = [...cells].sort((a, b) =>
    a.stabilityScore - b.stabilityScore || b.cellLatencyMs - a.cellLatencyMs,
  );
  const byStabilityDesc = [...cells].sort((a, b) =>
    b.stabilityScore - a.stabilityScore || a.cellLatencyMs - b.cellLatencyMs,
  );
  const top10Dangerous = byStabilityAsc.slice(0, 10);
  const top10Safest = byStabilityDesc.slice(0, 10);
  const rankedStabilityLeaderboard = byStabilityDesc;

  // ── Highest-latency combinations ───────────────────────────
  const highestLatencyCombinations = [...cells]
    .sort((a, b) => b.cellLatencyMs - a.cellLatencyMs)
    .slice(0, 10)
    .map((c) => ({
      formula: c.formula, mode: c.mode, brutality: c.brutality, latencyMs: c.cellLatencyMs,
    }));

  // ── Instability clusters: any dim with stabilityScore < safe ─
  const instabilityClusters: ProductionSafetyEnvelope['instabilityClusters'] = [];
  for (const r of formulaStability) {
    if (r.safetyTier !== 'safe') instabilityClusters.push({
      axis: 'formula', value: r.key, failureRate: r.failureRate,
      avgLatencyMs: r.avgLatencyMs, stabilityScore: r.stabilityScore,
    });
  }
  for (const r of modeStability) {
    if (r.safetyTier !== 'safe') instabilityClusters.push({
      axis: 'mode', value: r.key, failureRate: r.failureRate,
      avgLatencyMs: r.avgLatencyMs, stabilityScore: r.stabilityScore,
    });
  }
  for (const r of brutalityStability) {
    if (r.safetyTier !== 'safe') instabilityClusters.push({
      axis: 'brutality', value: r.key, failureRate: r.failureRate,
      avgLatencyMs: r.avgLatencyMs, stabilityScore: r.stabilityScore,
    });
  }

  // ── Refusal-heavy zones (aggregate-level only; matrix report
  //    does not include per-cell verdict breakdown) ────────────
  const refusalHeavyZones: ProductionSafetyEnvelope['refusalHeavyZones'] = [];
  const totalRefusals = report.refusals;
  const totalRuns = report.totalRuns;
  const aggregateRefusalRate = totalRuns === 0 ? 0 : totalRefusals / totalRuns;
  if (aggregateRefusalRate >= 0.25) {
    refusalHeavyZones.push({
      axis: 'aggregate',
      value: 'aggregate',
      refusalShare: round3(aggregateRefusalRate),
      note: `${totalRefusals}/${totalRuns} runs ended in controlled refusal`,
    });
  }
  // Inferred high-brutality refusal correlation: brutality dims with
  // worst stability are likely refusal-heavy (per existing critic
  // semantics). Surface them with a note that this is an inference.
  for (const r of brutalityStability.slice().reverse()) {
    if (r.failureRate >= 0.20 || r.stabilityScore < SAFE_THRESHOLD) {
      refusalHeavyZones.push({
        axis: 'brutality',
        value: r.key,
        refusalShare: round3(r.failureRate),
        note: `inferred from dim failureRate (matrix report lacks per-cell verdict breakdown)`,
      });
    }
  }

  // ── Memory pressure hotspots ────────────────────────────────
  const memEntries = Object.entries(report.memoryGrowth.perFile)
    .map(([file, p]) => ({ file, delta: p.delta }))
    .filter((e) => e.delta > 0)
    .sort((a, b) => b.delta - a.delta);
  const totalGrowth = report.memoryGrowth.bytesAdded || 1;
  const memoryPressureHotspots = memEntries.slice(0, 10).map((e) => ({
    file: e.file,
    deltaBytes: e.delta,
    shareOfTotalGrowth: round3(e.delta / totalGrowth),
  }));

  // ── Tiered matrices ─────────────────────────────────────────
  const SAFE_PRODUCTION_MATRIX = cells.filter((c) => c.safetyTier === 'safe');
  const WARNING_MATRIX = cells.filter((c) => c.safetyTier === 'warning');
  const FORBIDDEN_MATRIX = cells.filter((c) => c.safetyTier === 'forbidden');

  // ── Recommended runtime policy ──────────────────────────────
  // Default = the SAFE cell with highest stability; ties broken by
  // lower latency. Fallback = the safest non-AUTO cell.
  const safestCells = [...SAFE_PRODUCTION_MATRIX].sort((a, b) =>
    b.stabilityScore - a.stabilityScore ||
    a.cellLatencyMs - b.cellLatencyMs ||
    a.formula.localeCompare(b.formula),
  );
  const safestNonAuto = safestCells.find((c) => c.mode !== 'AUTO');
  const fallbackPick = safestNonAuto ?? safestCells[0] ?? cells[0] ?? null;
  const defaultPick = safestCells[0] ?? cells[0] ?? null;

  // Max brutality = the highest brutality with a safe stability score.
  const safeBrutalityValues = brutalityStability
    .filter((r) => r.safetyTier === 'safe')
    .map((r) => r.key);
  const maxAllowedBrutality = safeBrutalityValues.length > 0
    ? Math.max(...safeBrutalityValues)
    : (brutalityStability[0]?.key ?? 0.5);

  // Latency guardrails — derived from the per-run latency distribution.
  const allLatencies = report.latencyHeatmap.perCombination
    .map((r) => r.latencyMs).sort((a, b) => a - b);
  const p50 = percentile(allLatencies, 0.5);
  const p95 = percentile(allLatencies, 0.95);
  const recommendedTimeoutMs = Math.max(30000, Math.ceil(p95 * 1.5 / 1000) * 1000);

  // Memory growth ceiling: bytesAdded observed during the matrix is a
  // sample of "normal" growth. Recommended max-per-run is 1.5× the
  // per-run average, rounded up to a friendly KB.
  const perRunGrowth = report.totalRuns > 0
    ? report.memoryGrowth.bytesAdded / report.totalRuns
    : 0;
  const maxBytesGrowthPerRun = Math.max(1024, Math.ceil(perRunGrowth * 1.5 / 1024) * 1024);

  const recommendedRuntimePolicy: RecommendedRuntimePolicy = {
    defaultProductionMode: defaultPick ? {
      formula: defaultPick.formula,
      mode: defaultPick.mode === 'AUTO' ? null : defaultPick.mode,
      brutality: defaultPick.brutality,
    } : { formula: 'ENERGY', mode: null, brutality: 0.5 },
    maxAllowedBrutality,
    safeFallbackMode: fallbackPick ? {
      formula: fallbackPick.formula,
      mode: fallbackPick.mode === 'AUTO' ? null : fallbackPick.mode,
      brutality: fallbackPick.brutality,
    } : { formula: 'ENERGY', mode: null, brutality: 0.5 },
    refusalEscalationRules: {
      consecutiveRefusalsTrigger: 3,
      escalationAction: aggregateRefusalRate >= 0.40 ? 'switch-to-fallback' : 'log-only',
      maxAllowedRefusalRate: 0.30,
    },
    latencyGuardrails: {
      p50TargetMs: p50,
      p95CeilingMs: p95,
      timeoutMs: recommendedTimeoutMs,
    },
    memoryPressureGuardrails: {
      alertOnUncappedFile: true,
      fifoCapMustBeRespected: true,
      maxBytesGrowthPerRun,
      hotspotFiles: memoryPressureHotspots.map((h) => h.file),
    },
  };

  // ── Production readiness score ──────────────────────────────
  // Weighted: 50% deterministic consistency, 25% % cells in SAFE,
  // 15% % dims fully safe, 10% absence of route/panel errors.
  const detPct = clamp(0, 1, report.deterministicConsistencyScore / 10);
  const safeCellPct = cells.length === 0 ? 0 : SAFE_PRODUCTION_MATRIX.length / cells.length;
  const totalDims = formulaStability.length + modeStability.length + brutalityStability.length;
  const safeDims = formulaStability.filter((r) => r.safetyTier === 'safe').length +
                   modeStability.filter((r) => r.safetyTier === 'safe').length +
                   brutalityStability.filter((r) => r.safetyTier === 'safe').length;
  const safeDimPct = totalDims === 0 ? 0 : safeDims / totalDims;
  const cleanRoutes = report.routeErrorInventory.length === 0 && report.panelSyncWarnings.length === 0 ? 1 : 0;
  const productionReadinessScore = round1(clamp(0, 10,
    detPct * 5 + safeCellPct * 2.5 + safeDimPct * 1.5 + cleanRoutes * 1.0,
  ));

  const productionReadinessReasonCodes: string[] = [
    `det-consistency:${report.deterministicConsistencyScore}/10`,
    `safe-cells:${SAFE_PRODUCTION_MATRIX.length}/${cells.length}`,
    `warning-cells:${WARNING_MATRIX.length}/${cells.length}`,
    `forbidden-cells:${FORBIDDEN_MATRIX.length}/${cells.length}`,
    `safe-dims:${safeDims}/${totalDims}`,
    `route-errors:${report.routeErrorInventory.length}`,
    `panel-sync-warnings:${report.panelSyncWarnings.length}`,
    `fifo-over-cap:${report.fifoPressure.overCap}/${report.fifoPressure.total}`,
    `stopped-early:${report.stoppedEarly}`,
  ];

  // ── Highest-risk combinations (top 10 by ascending stability) ─
  const highestRiskCombinations = top10Dangerous;

  return {
    schemaVersion: 1,
    generatedAt: opts.now ?? new Date().toISOString(),
    advisoryOnly: true,
    systemMustNeverAutoApply: true,
    sourceReport: {
      totalCombinations: report.totalCombinations,
      totalRuns: report.totalRuns,
      deterministicConsistencyScore: report.deterministicConsistencyScore,
      stoppedEarly: report.stoppedEarly,
      stoppedReason: report.stoppedReason,
    },
    formulaStability,
    modeStability,
    brutalityStability,
    safestFormulas: uniqueOrdered(safestFormulas),
    safestModes: uniqueOrdered(safestModes),
    safestBrutalityRanges: uniqueOrdered(safestBrutalityRanges),
    highestRiskCombinations,
    highestLatencyCombinations,
    instabilityClusters,
    refusalHeavyZones,
    memoryPressureHotspots,
    SAFE_PRODUCTION_MATRIX,
    WARNING_MATRIX,
    FORBIDDEN_MATRIX,
    recommendedRuntimePolicy,
    rankedStabilityLeaderboard,
    top10Dangerous,
    top10Safest,
    productionReadinessScore,
    productionReadinessReasonCodes,
    reasonCodes: [
      `cells:${cells.length}`,
      `safe:${SAFE_PRODUCTION_MATRIX.length}`,
      `warning:${WARNING_MATRIX.length}`,
      `forbidden:${FORBIDDEN_MATRIX.length}`,
      `readiness:${productionReadinessScore}/10`,
      `default:${defaultPick?.formula}/${defaultPick?.mode}/b=${defaultPick?.brutality}`,
      `fallback:${fallbackPick?.formula}/${fallbackPick?.mode}/b=${fallbackPick?.brutality}`,
      `max-brutality:${maxAllowedBrutality}`,
    ],
  };
}
