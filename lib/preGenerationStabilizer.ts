/**
 * PRE-GENERATION STABILIZER (advisory, read-only)
 *
 * Pure function. Combines a ProductionConservativeMode reading with
 * optional live observability inputs (preflight policy, longitudinal
 * views for campaign/strategic/identity/governance, refusal rate,
 * memory health) and emits an advisory stabilization status.
 *
 * STRICT CONTRACT:
 *   - never blocks /api/generate
 *   - never mutates the request
 *   - never changes verdict, brutality, or campaign mode
 *   - never modifies critic, pipeline, or memory
 *   - emits only an advisory event + studio panel data
 *   - suggestions are NON-APPLIED — a human reviews and decides
 *
 * Pressure axes (each clamped 0..10):
 *   policyPressure     ← derived from conservative.safetyTier
 *   memoryPressure     ← over-cap memory file count (from system-integrity)
 *   refusalPressure    ← policy.refusalEnabledRate × 10
 *   latencyPressure    ← envelope p95 / requested-cell latency
 *   identityPressure   ← identity.averageContinuityRisk
 *   campaignPressure   ← campaign.averageFatiguePressure
 *   governancePressure ← governance.averageFragmentation
 *
 *   stabilizationScore = clamp(0..10, 10 - max(allPressures))
 */

import type { ProductionConservativeMode } from './productionConservativeMode';
import type { CopyQualityPolicyPreflight } from './copyQualityPolicyPreflight';

// ─── structural view subsets (loose) ─────────────────────────

export interface CampaignEvolutionSubset {
  averageFatiguePressure?: number;          // 0..10
  trend?: string;                           // e.g. 'compounding'|'fatiguing'|...
}
export interface StrategicOutcomeSubset {
  averageStrategicRisk?: number;            // 0..10
  strategicTrend?: string;                  // 'eroding'|'consolidating'|...
}
export interface IdentityContinuitySubset {
  averageContinuityRisk?: number;           // 0..10
  continuityTrend?: string;                 // 'rising-fragmentation'|...
}
export interface ExecutiveGovernanceSubset {
  averageFragmentation?: number;            // 0..10
  governanceTrend?: string;                 // 'fragmentation-rising'|...
}
export interface PolicyAuditSubset {
  refusalEnabledRate?: number;              // 0..1
}
export interface SystemIntegritySubset {
  memoryHealth?: Array<{ file: string; capped: boolean; issue: string | null }>;
}

// ─── inputs / output ──────────────────────────────────────────

export interface PreGenerationStabilizerInput {
  conservative: ProductionConservativeMode;
  preflight?: CopyQualityPolicyPreflight | null;
  campaign?: CampaignEvolutionSubset | null;
  outcome?: StrategicOutcomeSubset | null;
  identity?: IdentityContinuitySubset | null;
  governance?: ExecutiveGovernanceSubset | null;
  policy?: PolicyAuditSubset | null;
  systemIntegrity?: SystemIntegritySubset | null;
  /** Optional supplementary metric for environments where memory
   *  growth is tracked outside system-integrity. */
  memoryGrowthBytesPerRun?: number;
}

export type StabilizationStatus =
  | 'stable'
  | 'caution'
  | 'unstable'
  | 'blocked-for-production'
  | 'testing-only';

export type RecommendedHumanDecision =
  | 'run'
  | 'run-for-testing-only'
  | 'reduce-brutality'
  | 'change-mode'
  | 'use-fallback'
  | 'pause-and-review';

export interface NonAppliedSuggestion {
  suggestion: string;
  reason: string;
  wouldAffect: string;
}

export interface PreGenerationStabilizer {
  stabilizationStatus: StabilizationStatus;
  shouldGenerateInTesting: boolean;
  shouldGenerateInProduction: boolean;
  stabilizationScore: number;        // 0..10

  pressureMap: {
    policyPressure: number;
    memoryPressure: number;
    refusalPressure: number;
    latencyPressure: number;
    identityPressure: number;
    campaignPressure: number;
    governancePressure: number;
  };

  recommendedHumanDecision: RecommendedHumanDecision;
  plainEnglishReason: string;
  nonAppliedSuggestions: NonAppliedSuggestion[];

  advisoryNotice: string;
  reasonCodes: string[];
}

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

const ADVISORY_NOTICE =
  'Advisory only — this stabilizer never blocks generation, never mutates ' +
  'the request, and never changes critic or verdict behavior. The human ' +
  'operator remains the final executor.';

// ─── main ──────────────────────────────────────────────────────

export function computePreGenerationStabilizer(
  input: PreGenerationStabilizerInput,
): PreGenerationStabilizer {
  const reasonCodes: string[] = [];

  // ── 1. policyPressure from conservative tier ──────────────
  let policyPressure = 0;
  switch (input.conservative.safetyTier) {
    case 'safe':      policyPressure = 0; break;
    case 'warning':   policyPressure = 5; break;
    case 'forbidden': policyPressure = 9; break;
    case 'unknown':   policyPressure = 10; break;
  }
  reasonCodes.push(`policy-pressure:${policyPressure}`);

  // ── 2. memoryPressure from system-integrity ──────────────
  let memoryPressure = 0;
  if (input.systemIntegrity?.memoryHealth) {
    const overCap = input.systemIntegrity.memoryHealth.filter((m) => !m.capped).length;
    memoryPressure = clamp10(overCap * 3);
    reasonCodes.push(`over-cap-files:${overCap}`);
  }
  // Supplementary metric: bytesPerRun > 4KB ⇒ +2; > 16KB ⇒ +4
  if (typeof input.memoryGrowthBytesPerRun === 'number') {
    if (input.memoryGrowthBytesPerRun > 16_384) memoryPressure = clamp10(memoryPressure + 4);
    else if (input.memoryGrowthBytesPerRun > 4_096) memoryPressure = clamp10(memoryPressure + 2);
  }

  // ── 3. refusalPressure from policy audit ──────────────────
  let refusalPressure = 0;
  if (input.policy && typeof input.policy.refusalEnabledRate === 'number') {
    refusalPressure = clamp10(input.policy.refusalEnabledRate * 10);
    reasonCodes.push(`refusal-rate:${input.policy.refusalEnabledRate.toFixed(2)}`);
  }
  // Preflight degradation indicates the policy layer is operating in
  // safe-fallback — that's a pressure signal even when refusalRate is low.
  if (input.preflight && input.preflight.reasonCodes.some((c) =>
    c.includes('degraded') || c.includes('coerced'),
  )) {
    refusalPressure = clamp10(refusalPressure + 2);
    reasonCodes.push('preflight-degraded');
  }

  // ── 4. latencyPressure from envelope's p95 + conservative warnings ─
  let latencyPressure = 0;
  const latencyCeiling = input.conservative.guardrails.latencyCeilingMs;
  if (latencyCeiling > 3000) latencyPressure = 5;
  else if (latencyCeiling > 2000) latencyPressure = 3;
  else if (latencyCeiling > 1500) latencyPressure = 1;
  if (input.conservative.instabilityReasons.some((r) => r.toLowerCase().includes('latency'))) {
    latencyPressure = clamp10(latencyPressure + 2);
  }

  // ── 5. identity / campaign / governance ─────────────────────
  const identityPressure   = clamp10(input.identity?.averageContinuityRisk ?? 0);
  const campaignPressure   = clamp10(input.campaign?.averageFatiguePressure ?? 0);
  const governancePressure = clamp10(input.governance?.averageFragmentation ?? 0);

  // Trend escalation — rising-fragmentation / fatiguing / eroding all
  // add a small bump (does not exceed +2).
  let trendBump = 0;
  if (input.identity?.continuityTrend === 'rising-fragmentation') trendBump = 1;
  if (input.campaign?.trend === 'fatiguing' || input.campaign?.trend === 'compounding') trendBump = Math.max(trendBump, 1);
  if (input.outcome?.strategicTrend === 'eroding') trendBump = Math.max(trendBump, 1);
  if (input.governance?.governanceTrend === 'fragmentation-rising') trendBump = Math.max(trendBump, 1);
  const adjustedIdentity   = clamp10(identityPressure   + (input.identity?.continuityTrend     === 'rising-fragmentation'  ? trendBump : 0));
  const adjustedCampaign   = clamp10(campaignPressure   + (input.campaign?.trend === 'fatiguing' || input.campaign?.trend === 'compounding' ? trendBump : 0));
  const adjustedGovernance = clamp10(governancePressure + (input.governance?.governanceTrend  === 'fragmentation-rising' ? trendBump : 0));

  const pressureMap = {
    policyPressure: round1(policyPressure),
    memoryPressure: round1(memoryPressure),
    refusalPressure: round1(refusalPressure),
    latencyPressure: round1(latencyPressure),
    identityPressure: round1(adjustedIdentity),
    campaignPressure: round1(adjustedCampaign),
    governancePressure: round1(adjustedGovernance),
  };

  // ── 6. stabilization score = 10 - max(pressures), clamped ─
  const allPressures = Object.values(pressureMap);
  const maxPressure = allPressures.reduce((a, b) => Math.max(a, b), 0);
  const stabilizationScore = round1(clamp10(10 - maxPressure));

  // ── 7. status decision tree ───────────────────────────────
  let stabilizationStatus: StabilizationStatus;
  if (input.conservative.safetyTier === 'forbidden' || input.conservative.safetyTier === 'unknown' || stabilizationScore < 3) {
    stabilizationStatus = 'blocked-for-production';
  } else if (input.conservative.safetyTier === 'warning' && stabilizationScore < 7) {
    stabilizationStatus = 'testing-only';
  } else if (stabilizationScore < 5) {
    stabilizationStatus = 'unstable';
  } else if (stabilizationScore < 8) {
    stabilizationStatus = 'caution';
  } else {
    stabilizationStatus = 'stable';
  }
  reasonCodes.push(`status:${stabilizationStatus}`);

  const shouldGenerateInProduction = stabilizationStatus === 'stable';
  const shouldGenerateInTesting = stabilizationStatus !== 'blocked-for-production';

  // ── 8. recommended human decision ─────────────────────────
  let recommendedHumanDecision: RecommendedHumanDecision;
  switch (stabilizationStatus) {
    case 'stable':       recommendedHumanDecision = 'run'; break;
    case 'caution':      recommendedHumanDecision = 'run'; break;
    case 'testing-only': recommendedHumanDecision = 'run-for-testing-only'; break;
    case 'unstable': {
      // Choose between reduce-brutality and change-mode based on
      // which pressure is highest.
      const highest = Object.entries(pressureMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      if (highest === 'refusalPressure' || highest === 'policyPressure') {
        recommendedHumanDecision = 'reduce-brutality';
      } else if (highest === 'campaignPressure' || highest === 'identityPressure' || highest === 'governancePressure') {
        recommendedHumanDecision = 'change-mode';
      } else {
        recommendedHumanDecision = 'reduce-brutality';
      }
      break;
    }
    case 'blocked-for-production':
      recommendedHumanDecision = input.conservative.safeFallback ? 'use-fallback' : 'pause-and-review';
      break;
  }
  reasonCodes.push(`decision:${recommendedHumanDecision}`);

  // ── 9. non-applied suggestions ────────────────────────────
  const nonAppliedSuggestions: NonAppliedSuggestion[] = [];
  if (input.conservative.recommendedAction === 'lower-brutality') {
    nonAppliedSuggestions.push({
      suggestion: `lower brutality to ${input.conservative.guardrails.maxRecommendedBrutality} or below`,
      reason: 'requested brutality exceeds the envelope-derived ceiling',
      wouldAffect: 'critic strictness; expect fewer refusals at lower brutality',
    });
  }
  if (input.conservative.recommendedAction === 'switch-mode' && input.conservative.guardrails.preferredModes.length > 0) {
    nonAppliedSuggestions.push({
      suggestion: `switch to one of: ${input.conservative.guardrails.preferredModes.slice(0, 3).join(', ')}`,
      reason: 'requested mode is in avoidedModes',
      wouldAffect: 'campaign mode preset',
    });
  }
  if (input.conservative.recommendedAction === 'use-safe-fallback' && input.conservative.safeFallback) {
    const fb = input.conservative.safeFallback;
    nonAppliedSuggestions.push({
      suggestion: `use envelope fallback ${fb.formula} / ${fb.campaignMode ?? 'AUTO'} / b=${fb.brutality}`,
      reason: fb.reason,
      wouldAffect: 'all three: formula, mode, brutality',
    });
  }
  if (pressureMap.memoryPressure >= 6) {
    nonAppliedSuggestions.push({
      suggestion: 'review FIFO caps and uncapped files via /api/system-integrity',
      reason: 'memoryPressure is elevated',
      wouldAffect: 'observability only — no runtime change',
    });
  }
  if (pressureMap.refusalPressure >= 6) {
    nonAppliedSuggestions.push({
      suggestion: 'review recent refusalReasonDistribution in /api/policy-audit',
      reason: 'refusalPressure is elevated',
      wouldAffect: 'understanding of refusal pattern; no behavior change',
    });
  }
  if (pressureMap.identityPressure >= 6 || pressureMap.governancePressure >= 6) {
    nonAppliedSuggestions.push({
      suggestion: 'consider pausing to let identity/governance pressure settle',
      reason: 'identity or governance pressure is elevated',
      wouldAffect: 'campaign continuity stability',
    });
  }

  // ── 10. plain-English summary ─────────────────────────────
  const plainEnglishParts: string[] = [];
  switch (stabilizationStatus) {
    case 'stable':
      plainEnglishParts.push('System is stable. Requested combination is safe and pressure signals are low.');
      break;
    case 'caution':
      plainEnglishParts.push('System is broadly stable but some pressure signals are elevated. Proceed with awareness.');
      break;
    case 'testing-only':
      plainEnglishParts.push('Combination is not production-safe but is testable. Use a non-production context.');
      break;
    case 'unstable':
      plainEnglishParts.push('Multiple pressure signals are elevated. Consider adjusting the request before running.');
      break;
    case 'blocked-for-production':
      if (input.conservative.safetyTier === 'forbidden') {
        plainEnglishParts.push('Requested combination is in the FORBIDDEN matrix of the production safety envelope.');
      } else if (input.conservative.safetyTier === 'unknown') {
        plainEnglishParts.push('Requested combination was not present in the production safety envelope — there is no stability evidence for it.');
      } else {
        plainEnglishParts.push('System pressure is too high for a production run.');
      }
      break;
  }
  if (input.conservative.safeFallback) {
    plainEnglishParts.push(
      `Envelope-suggested fallback: ${input.conservative.safeFallback.formula} / ` +
      `${input.conservative.safeFallback.campaignMode ?? 'AUTO'} / ` +
      `b=${input.conservative.safeFallback.brutality} (${input.conservative.safeFallback.reason}).`,
    );
  }
  const topPressure = Object.entries(pressureMap).sort((a, b) => b[1] - a[1])[0];
  if (topPressure && topPressure[1] >= 5) {
    plainEnglishParts.push(`Highest pressure axis: ${topPressure[0]} = ${topPressure[1]}/10.`);
  }
  plainEnglishParts.push('No suggestion has been applied. The operator decides what runs.');
  const plainEnglishReason = plainEnglishParts.join(' ');

  return {
    stabilizationStatus,
    shouldGenerateInTesting,
    shouldGenerateInProduction,
    stabilizationScore,
    pressureMap,
    recommendedHumanDecision,
    plainEnglishReason,
    nonAppliedSuggestions,
    advisoryNotice: ADVISORY_NOTICE,
    reasonCodes: [
      ...reasonCodes,
      `score:${stabilizationScore}/10`,
      `max-pressure-axis:${topPressure?.[0]}:${topPressure?.[1]}`,
      `suggestions:${nonAppliedSuggestions.length}`,
    ],
  };
}
