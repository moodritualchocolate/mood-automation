/**
 * ESCALATION / SILENCE / APPROVAL SURFACE (Phase 126 — Wave 9: Manifestation Architecture)
 *
 * The three outcomes a run can reach — it shipped, it was refused, or
 * the runtime chose silence — surfaced as one decision ledger. Read
 * from the persistent runtime history, this is the record of what the
 * organism has and has not let itself do.
 */

import type { RuntimeSnapshot, Tone } from './runtimeUIBrain';

export interface DecisionEntry {
  run: number;
  outcome: 'approved' | 'refused' | 'silence';
  detail: string;
  tone: Tone;
}

export interface EscalationSurfaceViewModel {
  present: boolean;
  approved_count: number;
  refused_count: number;
  /** 0..1 — share of runs that shipped. */
  approval_rate: number;
  ledger: DecisionEntry[];
  posture: 'productive' | 'selective' | 'withholding';
  statement: string;
}

export function buildEscalationSurfaceView(snap: RuntimeSnapshot): EscalationSurfaceViewModel {
  const runtime = snap.runtime;
  if (!runtime) {
    return {
      present: false, approved_count: 0, refused_count: 0, approval_rate: 0,
      ledger: [], posture: 'withholding',
      statement: 'no decision history — the runtime has reached no outcomes yet',
    };
  }

  const ledger: DecisionEntry[] = runtime.history.slice(-12).reverse().map((h) => {
    const isApprove = h.verdict === 'approve';
    const isSilence = h.verdict.includes('silence') || h.silenceLevel >= 9;
    return {
      run: h.generationIndex,
      outcome: isApprove ? 'approved' : isSilence ? 'silence' : 'refused',
      detail: `${h.verdict} — territory "${h.emotionalTerritory}"`,
      tone: (isApprove ? 'good' : isSilence ? 'cool' : 'warn') as Tone,
    };
  });

  const total = runtime.approvedCount + runtime.rejectedCount;
  const approval_rate = total > 0 ? Math.round((runtime.approvedCount / total) * 100) / 100 : 0;

  const posture: EscalationSurfaceViewModel['posture'] =
    approval_rate >= 0.6 ? 'productive' :
    approval_rate >= 0.25 ? 'selective' : 'withholding';

  return {
    present: ledger.length > 0,
    approved_count: runtime.approvedCount,
    refused_count: runtime.rejectedCount,
    approval_rate,
    ledger,
    posture,
    statement: `${runtime.approvedCount} shipped / ${runtime.rejectedCount} refused — the runtime is ${posture} ` +
      `(${Math.round(approval_rate * 100)}% approval)`,
  };
}
