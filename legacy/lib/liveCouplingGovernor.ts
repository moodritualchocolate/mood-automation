/**
 * LIVE COUPLING GOVERNOR (Phase 318 — Wave 14: Live Civilization Coupling)
 *
 * Governs the whole live coupling layer — reality-evolving, present,
 * absent, or severed.
 */

export type LiveCouplingGovernance = 'reality-evolving' | 'present' | 'absent' | 'severed';

export interface LiveCouplingGovernorReading {
  governance: LiveCouplingGovernance;
  /** True when the live coupling layer is genuinely governing. */
  live_coupling_governed: boolean;
  reason: string;
  notes: string[];
}

export interface LiveCouplingGovernorInput {
  integrityHolds: boolean;
  brandIsPresent: boolean;
  realityChanged: boolean;
  driftDetected: boolean;
  loadIsSustainable: boolean;
}

export function readLiveCouplingGovernor(input: LiveCouplingGovernorInput): LiveCouplingGovernorReading {
  const { integrityHolds, brandIsPresent, realityChanged, driftDetected, loadIsSustainable } = input;
  const notes: string[] = [];

  let governance: LiveCouplingGovernance;
  let reason: string;

  if (driftDetected || !loadIsSustainable) {
    governance = 'severed';
    reason = driftDetected
      ? 'live coupling is drifting — the layer is no longer accurately reading reality'
      : 'live coupling is overloaded — too much pressure to govern from';
  } else if (!integrityHolds) {
    governance = 'absent';
    reason = 'live coupling signal lacks integrity — beliefs cannot be drawn from it';
  } else if (!brandIsPresent) {
    governance = 'absent';
    reason = 'the brand is not verifiably present in the live field it claims to act on';
  } else if (realityChanged) {
    governance = 'reality-evolving';
    reason = 'the brand is present, integrity holds, and reality is being shaped';
  } else {
    governance = 'present';
    reason = 'the brand is present and listening but has not yet shifted reality';
  }

  const live_coupling_governed = governance === 'reality-evolving' || governance === 'present';

  notes.push(`live coupling governor: ${governance} — ${reason}`);
  return { governance, live_coupling_governed, reason, notes };
}
