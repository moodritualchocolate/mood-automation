/**
 * REALITY CHANGE ATTRIBUTION AUDITOR (Phase 316 — Wave 14: Live Civilization Coupling)
 *
 * Second-order check on reality-change attribution claims — catches
 * inflated credit before it reaches the strategic layer.
 */

export interface RealityChangeAttributionAuditorReading {
  /** True when the attribution claim survives a second-order audit. */
  audit_passed: boolean;
  audit_note: string;
  notes: string[];
}

export interface RealityChangeAttributionAuditorInput {
  attributionShare: number;
  worldShiftedAlone: boolean;
  fieldIsCoherent: boolean;
}

export function readRealityChangeAttributionAuditor(input: RealityChangeAttributionAuditorInput): RealityChangeAttributionAuditorReading {
  const { attributionShare, worldShiftedAlone, fieldIsCoherent } = input;
  const notes: string[] = [];

  const audit_passed = !worldShiftedAlone && fieldIsCoherent && attributionShare >= 3;

  const audit_note = !audit_passed
    ? worldShiftedAlone
      ? 'audit failed — the world moved on its own this cycle'
      : !fieldIsCoherent
        ? 'audit failed — the field was polarised, attribution is unreliable'
        : 'audit failed — attribution share too small to defend'
    : 'audit passed — attribution claim survives second-order check';

  notes.push(`reality change attribution auditor: ${audit_passed ? 'PASSED' : 'FAILED'} — ${audit_note}`);
  return { audit_passed, audit_note, notes };
}
