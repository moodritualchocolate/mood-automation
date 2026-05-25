/**
 * COPY-QUALITY POLICY AUDIT VIEW (read-only)
 *
 * Aggregates the persisted audit trail into a small dashboard-shaped
 * view-model: counts, rates, reason-code histogram, formula/mode
 * pressure rankings, per-formula integrity averages, and a tail of
 * recent entries.
 *
 * Pure. No I/O. Deterministic for the same input state.
 */

import type {
  CampaignMode, Formula,
} from '@/core/types';
import type {
  PolicyAuditEntry, PolicyAuditState, PolicyOverrideType,
} from './copyQualityPolicyAudit';
import type { PolicyBand } from './copyQualityPolicy';

// ─── shape ─────────────────────────────────────────────────────

export interface OverrideTypeCount {
  overrideType: PolicyOverrideType;
  count: number;
  share: number;        // 0..1
}

export interface ReasonCodeCount {
  code: string;
  count: number;
}

export interface FormulaPressureRow {
  formula: Formula;
  totalRuns: number;
  strictCount: number;
  warnCount: number;
  observeCount: number;
  offCount: number;
  /** Weighted "policy pressure": (strict*3 + warn*2 + observe*1) / total. */
  pressureScore: number;
}

export interface ModeRiskRow {
  mode: CampaignMode | 'auto';
  totalRuns: number;
  averageCopyIntegrity: number | null;
  averageTrustSafety: number | null;
  averageDignitySafety: number | null;
  averageRepetitionConcern: number | null;
  refusalEnabledCount: number;
}

export interface FormulaIntegrityRow {
  formula: Formula;
  samples: number;
  averageCopyIntegrity: number | null;
}

export interface RecentAuditRow {
  id: string;
  at: number;
  formula: Formula;
  campaignMode: CampaignMode | null;
  policyBand: PolicyBand;
  overrideType: PolicyOverrideType;
  finalAppliedEnabled: boolean;
  outcomeVerdict: PolicyAuditEntry['outcomeVerdict'];
  copyIntegrity: number | null;
}

export interface PolicyAuditView {
  present: boolean;
  statement: string;
  totalAudited: number;
  autoAppliedCount: number;
  explicitOverrideCount: number;
  refusalEnabledCount: number;
  refusalEnabledRate: number;        // 0..1
  overrideTypeBreakdown: OverrideTypeCount[];
  topReasonCodes: ReasonCodeCount[];
  formulaPressureRanking: FormulaPressureRow[];
  modeRiskRanking: ModeRiskRow[];
  formulaIntegrityAverages: FormulaIntegrityRow[];
  recentEntries: RecentAuditRow[];
}

// ─── helpers ───────────────────────────────────────────────────

function round2(n: number): number { return Math.round(n * 100) / 100; }
function round1(n: number): number { return Math.round(n * 10) / 10; }

function avgOrNull(nums: Array<number | null>): number | null {
  const real = nums.filter((n): n is number => typeof n === 'number');
  if (real.length === 0) return null;
  return round1(real.reduce((a, b) => a + b, 0) / real.length);
}

// ─── main builder ──────────────────────────────────────────────

export function buildPolicyAuditView(state: PolicyAuditState | null): PolicyAuditView {
  const entries = state?.entries ?? [];
  if (entries.length === 0) {
    return {
      present: false,
      statement: 'no policy audit history yet — run a generation to populate the governance trail',
      totalAudited: 0,
      autoAppliedCount: 0,
      explicitOverrideCount: 0,
      refusalEnabledCount: 0,
      refusalEnabledRate: 0,
      overrideTypeBreakdown: [],
      topReasonCodes: [],
      formulaPressureRanking: [],
      modeRiskRanking: [],
      formulaIntegrityAverages: [],
      recentEntries: [],
    };
  }

  const total = entries.length;

  // ── override-type breakdown ─────────────────────────────────
  const overrideCounts = new Map<PolicyOverrideType, number>();
  for (const e of entries) {
    overrideCounts.set(e.overrideType, (overrideCounts.get(e.overrideType) ?? 0) + 1);
  }
  const overrideTypeBreakdown: OverrideTypeCount[] = [...overrideCounts.entries()]
    .map(([overrideType, count]) => ({
      overrideType, count, share: round2(count / total),
    }))
    .sort((a, b) => b.count - a.count);

  const autoAppliedCount = overrideCounts.get('auto-applied') ?? 0;
  const explicitOverrideCount =
    (overrideCounts.get('explicit-override-true') ?? 0) +
    (overrideCounts.get('explicit-override-false') ?? 0);

  const refusalEnabledCount = entries.filter((e) => e.finalAppliedEnabled).length;
  const refusalEnabledRate = round2(refusalEnabledCount / total);

  // ── top reason codes (histogram) ────────────────────────────
  const reasonCounts = new Map<string, number>();
  for (const e of entries) {
    for (const code of e.reasonCodes) {
      reasonCounts.set(code, (reasonCounts.get(code) ?? 0) + 1);
    }
  }
  const topReasonCodes: ReasonCodeCount[] = [...reasonCounts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── formula pressure ranking ────────────────────────────────
  const byFormula = new Map<Formula, PolicyAuditEntry[]>();
  for (const e of entries) {
    const arr = byFormula.get(e.formula) ?? [];
    arr.push(e);
    byFormula.set(e.formula, arr);
  }
  const formulaPressureRanking: FormulaPressureRow[] = [...byFormula.entries()]
    .map(([formula, list]) => {
      const strict  = list.filter((x) => x.policyBand === 'strict').length;
      const warn    = list.filter((x) => x.policyBand === 'warn').length;
      const observe = list.filter((x) => x.policyBand === 'observe').length;
      const off     = list.filter((x) => x.policyBand === 'off').length;
      const pressure = list.length > 0
        ? round2((strict * 3 + warn * 2 + observe * 1) / list.length)
        : 0;
      return {
        formula,
        totalRuns: list.length,
        strictCount: strict,
        warnCount: warn,
        observeCount: observe,
        offCount: off,
        pressureScore: pressure,
      };
    })
    .sort((a, b) =>
      b.pressureScore !== a.pressureScore
        ? b.pressureScore - a.pressureScore
        : b.totalRuns - a.totalRuns,
    );

  // ── mode risk ranking ───────────────────────────────────────
  const byMode = new Map<CampaignMode | 'auto', PolicyAuditEntry[]>();
  for (const e of entries) {
    const k = e.campaignMode ?? 'auto';
    const arr = byMode.get(k) ?? [];
    arr.push(e);
    byMode.set(k, arr);
  }
  const modeRiskRanking: ModeRiskRow[] = [...byMode.entries()]
    .map(([mode, list]) => {
      const avgIntegrity = avgOrNull(list.map((x) => x.copyIntegrity));
      const avgTrust     = avgOrNull(list.map((x) => x.trustSafety));
      const avgDignity   = avgOrNull(list.map((x) => x.dignitySafety));
      const avgRep       = avgOrNull(list.map((x) => x.repetitionConcern));
      return {
        mode,
        totalRuns: list.length,
        averageCopyIntegrity: avgIntegrity,
        averageTrustSafety: avgTrust,
        averageDignitySafety: avgDignity,
        averageRepetitionConcern: avgRep,
        refusalEnabledCount: list.filter((x) => x.finalAppliedEnabled).length,
      };
    })
    .sort((a, b) => {
      // Risk = low integrity OR high repetitionConcern.
      const score = (r: ModeRiskRow) => {
        const integ = r.averageCopyIntegrity ?? 10;     // missing → assume safe
        const rep   = r.averageRepetitionConcern ?? 0;
        return (10 - integ) + rep;                       // higher = riskier
      };
      return score(b) - score(a);
    });

  // ── per-formula integrity averages ──────────────────────────
  const formulaIntegrityAverages: FormulaIntegrityRow[] = [...byFormula.entries()]
    .map(([formula, list]) => ({
      formula,
      samples: list.filter((x) => x.copyIntegrity !== null).length,
      averageCopyIntegrity: avgOrNull(list.map((x) => x.copyIntegrity)),
    }))
    .sort((a, b) => {
      const ai = a.averageCopyIntegrity ?? 10;
      const bi = b.averageCopyIntegrity ?? 10;
      return ai - bi;     // lowest integrity first (most at risk)
    });

  // ── recent tail ─────────────────────────────────────────────
  const recentEntries: RecentAuditRow[] = entries.slice(-8).reverse().map((e) => ({
    id: e.id,
    at: e.at,
    formula: e.formula,
    campaignMode: e.campaignMode,
    policyBand: e.policyBand,
    overrideType: e.overrideType,
    finalAppliedEnabled: e.finalAppliedEnabled,
    outcomeVerdict: e.outcomeVerdict,
    copyIntegrity: e.copyIntegrity,
  }));

  // ── statement ───────────────────────────────────────────────
  const statement =
    `${total} audited runs · ${refusalEnabledCount} with refusal enabled (${(refusalEnabledRate * 100).toFixed(0)}%) · ` +
    `auto-applied ×${autoAppliedCount} · explicit override ×${explicitOverrideCount}`;

  return {
    present: true,
    statement,
    totalAudited: total,
    autoAppliedCount,
    explicitOverrideCount,
    refusalEnabledCount,
    refusalEnabledRate,
    overrideTypeBreakdown,
    topReasonCodes,
    formulaPressureRanking,
    modeRiskRanking,
    formulaIntegrityAverages,
    recentEntries,
  };
}
