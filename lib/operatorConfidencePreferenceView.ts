/**
 * OPERATOR CONFIDENCE PREFERENCE VIEW
 *
 * Read-only interpretation-overlay view. Renders the operator's
 * confidence sliders + plain-language interpretation labels next to
 * each known projection type.
 *
 * STRICTLY visual — never applied to raw projection scores, never
 * mutates branch rankings, never read by critic / generation /
 * campaign evolution.
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  OperatorConfidencePreferenceMemoryState,
} from './operatorConfidencePreferenceMemory';
import {
  KNOWN_PROJECTION_TYPES, type KnownProjectionType,
  type OperatorPreference, type InterpretedPreference,
  interpretPreference, defaultPreference,
} from './operatorConfidencePreference';
import { getCurrentPreference } from './operatorConfidencePreferenceMemory';

// ─── shape ─────────────────────────────────────────────────────

export interface PreferenceHistoryRow {
  at: number;
  operatorId: string;
  projectionType: KnownProjectionType;
  confidenceWeight: number;
  reasonNote: string | null;
}

export interface OperatorSummaryRow {
  operatorId: string;
  totalUpdates: number;
  averageWeight: number;
  mostTrustedType: string | null;
  leastTrustedType: string | null;
}

export interface OperatorConfidencePreferenceView {
  present: boolean;
  statement: string;
  operatorId: string;
  totalUpdates: number;
  preferences: InterpretedPreference[];
  /** Recent history tail (operator + project + weight + reason). */
  recentHistory: PreferenceHistoryRow[];
  /** Per-operator summary across the whole memory. */
  operatorSummaries: OperatorSummaryRow[];
  /** Reminder string surfaced in the panel — always present. */
  visualOnlyNotice: string;
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main builder ──────────────────────────────────────────────

export interface OperatorConfidencePreferenceViewInput {
  memory: OperatorConfidencePreferenceMemoryState | null;
  operatorId: string;
  /** Reference timestamp used for default preferences when the
   *  operator hasn't set a slider yet. Same memory + same `at`
   *  → same view. */
  at: number;
}

export function buildOperatorConfidencePreferenceView(
  input: OperatorConfidencePreferenceViewInput,
): OperatorConfidencePreferenceView {
  const mem = input.memory;
  const operatorId = input.operatorId;

  // Always render all 8 known projection types, filling defaults
  // (neutral 50% medium) where the operator hasn't set a slider.
  const preferences: InterpretedPreference[] = KNOWN_PROJECTION_TYPES.map((t) => {
    const stored = mem ? getCurrentPreference(mem, operatorId, t) : null;
    const pref: OperatorPreference = stored ?? defaultPreference(operatorId, t, input.at);
    return interpretPreference(pref);
  });

  const totalUpdates = mem?.totalUpdates ?? 0;
  const operatorUpdates = mem?.operatorUpdateCounts[operatorId] ?? 0;

  const recentHistory: PreferenceHistoryRow[] = (mem?.history ?? [])
    .slice(-12)
    .reverse()
    .map((h) => ({
      at: h.updatedAt,
      operatorId: h.operatorId,
      projectionType: h.projectionType,
      confidenceWeight: h.confidenceWeight,
      reasonNote: h.reasonNote,
    }));

  // Per-operator summary across all operators in memory.
  const operatorSummaries: OperatorSummaryRow[] = (() => {
    if (!mem) return [];
    const operators = Object.keys(mem.operatorUpdateCounts);
    return operators.map((op) => {
      const ownPrefs: OperatorPreference[] = [];
      for (const t of KNOWN_PROJECTION_TYPES) {
        const p = getCurrentPreference(mem, op, t);
        if (p) ownPrefs.push(p);
      }
      if (ownPrefs.length === 0) {
        return {
          operatorId: op,
          totalUpdates: mem.operatorUpdateCounts[op] ?? 0,
          averageWeight: 50,
          mostTrustedType: null,
          leastTrustedType: null,
        };
      }
      const sorted = [...ownPrefs].sort((a, b) => b.confidenceWeight - a.confidenceWeight);
      const avg = ownPrefs.reduce((a, b) => a + b.confidenceWeight, 0) / ownPrefs.length;
      return {
        operatorId: op,
        totalUpdates: mem.operatorUpdateCounts[op] ?? 0,
        averageWeight: round1(avg),
        mostTrustedType: sorted[0]?.projectionType ?? null,
        leastTrustedType: sorted[sorted.length - 1]?.projectionType ?? null,
      };
    })
      .sort((a, b) => b.totalUpdates - a.totalUpdates)
      .slice(0, 6);
  })();

  const statement = (() => {
    if (totalUpdates === 0) {
      return 'no operator confidence preferences set yet — all projection types default to medium (50%)';
    }
    if (operatorUpdates === 0) {
      return `${totalUpdates} preference update(s) across other operators · no preferences set for "${operatorId}" yet`;
    }
    return `${operatorUpdates} preference update(s) by "${operatorId}" · ${totalUpdates} total in memory`;
  })();

  return {
    present: totalUpdates > 0,
    statement,
    operatorId,
    totalUpdates: operatorUpdates,
    preferences,
    recentHistory,
    operatorSummaries,
    visualOnlyNotice:
      'visual overlay only — confidence weights NEVER modify raw projections, branch rankings, critic, generation, or any automation',
  };
}
