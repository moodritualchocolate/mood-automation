/**
 * RUNTIME HEALTH MONITOR (Phase 27 — Persistent Cognitive Runtime)
 *
 * A persistent runtime can be intelligent and still UNHEALTHY: too
 * recursive, too abstract, too refusing, disconnected from reality,
 * over- or under-commercialised. The health monitor is the runtime's
 * self-diagnostic.
 */

import type { CognitiveFieldState } from './cognitiveField';
import type { RuntimeDriftReport } from './runtimeDriftDetector';
import type { CognitiveContinuityReading } from './cognitiveContinuityScore';

export interface RuntimeHealth {
  cognition_coherence: number;
  memory_load: number;
  contradiction_load: number;
  refusal_rate: number;
  approval_rate: number;
  drift_risk: number;
  recursion_risk: number;
  freshness_risk: number;
  fragmentation_risk: number;
  over_intelligence_risk: number;
  under_commercialization_risk: number;
  over_commercialization_risk: number;
  reality_disconnection_risk: number;
  /** 0..10 — overall runtime health. */
  overall_health: number;
  status: 'healthy' | 'strained' | 'at-risk';
  notes: string[];
}

export interface AssessRuntimeHealthInput {
  field: CognitiveFieldState;
  drift: RuntimeDriftReport;
  continuity: CognitiveContinuityReading;
  approvedCount: number;
  rejectedCount: number;
  contradictionCount: number;
  /** 0..10 — how reality-synced the campaign is (Phase 25). */
  realitySync: number;
  /** product role of the candidate. */
  productRole: string;
}

export function assessRuntimeHealth(input: AssessRuntimeHealthInput): RuntimeHealth {
  const { field, drift, continuity, approvedCount, rejectedCount, contradictionCount, realitySync, productRole } = input;
  const notes: string[] = [];

  const totalRuns = Math.max(1, approvedCount + rejectedCount);
  const refusal_rate = round1((rejectedCount / totalRuns) * 10);
  const approval_rate = round1((approvedCount / totalRuns) * 10);

  const cognition_coherence = field.field_coherence;
  const memory_load = Math.min(10, (approvedCount + rejectedCount) * 0.4);
  const contradiction_load = Math.min(10, contradictionCount * 2);

  const drift_risk = drift.drift_score;
  // Recursion risk — the runtime overfitting itself.
  const recursion_risk = drift.drift_signals.includes('overuse-of-same-truth')
    || drift.drift_signals.includes('overuse-of-same-emotional-territory') ? 7 : 3;
  // Freshness risk — behaving like a fresh prompt.
  const freshness_risk = continuity.behaved_like_fresh_prompt ? 9
    : continuity.continuity_score < 6 ? 5 : 2;
  const fragmentation_risk = continuity.evolution_without_fragmentation <= 3 ? 8
    : continuity.evolution_without_fragmentation <= 5 ? 5 : 2;
  const over_intelligence_risk = field.emergence_score >= 9 && field.field_coherence >= 9 ? 6 : 3;
  const under_commercialization_risk = (productRole === 'hidden' || productRole === 'environmental')
    && drift.drift_signals.includes('loss-of-commercial-grounding') ? 7 : 3;
  const over_commercialization_risk = (productRole === 'hand-held' || productRole === 'foreground-blur'
    || productRole === 'desk-proof') && field.emergence_score < 5 ? 6 : 2;
  const reality_disconnection_risk = realitySync < 3 ? 8 : realitySync < 5 ? 5 : 2;

  // Overall health — start at 10, subtract the active risks.
  const risks = [
    drift_risk, recursion_risk, freshness_risk, fragmentation_risk,
    over_intelligence_risk, under_commercialization_risk,
    over_commercialization_risk, reality_disconnection_risk, contradiction_load,
  ];
  const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
  let overall_health = clamp10(10 - avgRisk * 0.85 + cognition_coherence * 0.15);
  overall_health = round1(overall_health);

  const status: RuntimeHealth['status'] =
    overall_health >= 7 ? 'healthy' : overall_health >= 4.5 ? 'strained' : 'at-risk';

  if (freshness_risk >= 8) notes.push('runtime health: freshness risk high — the runtime is forgetting prior runs');
  if (reality_disconnection_risk >= 8) notes.push('runtime health: reality-disconnection risk high');
  if (drift_risk >= 6) notes.push('runtime health: drift risk elevated');
  notes.push(`runtime health: ${status} (${overall_health}/10) · refusal ${refusal_rate}/10 · approval ${approval_rate}/10`);

  return {
    cognition_coherence, memory_load, contradiction_load, refusal_rate, approval_rate,
    drift_risk, recursion_risk, freshness_risk, fragmentation_risk, over_intelligence_risk,
    under_commercialization_risk, over_commercialization_risk, reality_disconnection_risk,
    overall_health, status, notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
