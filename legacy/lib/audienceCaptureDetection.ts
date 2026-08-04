/**
 * AUDIENCE CAPTURE DETECTION (Phase 325 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Audience capture: when the brand begins to optimise for the
 * audience's approval rather than for the truth it was founded on.
 */

export interface AudienceCaptureReading {
  /** True when audience capture is actively occurring. */
  is_captured: boolean;
  /** 0..10 — strength of the capture pressure. */
  capture_pressure: number;
  capture_signals: string[];
  notes: string[];
}

export interface AudienceCaptureInput {
  chasingApproval: boolean;
  mirroringAudienceVoice: boolean;
  softeningPositionsForLikes: boolean;
  refusingToDisappoint: boolean;
}

export function readAudienceCaptureDetection(input: AudienceCaptureInput): AudienceCaptureReading {
  const { chasingApproval, mirroringAudienceVoice, softeningPositionsForLikes, refusingToDisappoint } = input;
  const notes: string[] = [];

  const capture_signals: string[] = [];
  if (chasingApproval) capture_signals.push('chasing audience approval');
  if (mirroringAudienceVoice) capture_signals.push('mirroring the audience\'s voice back to it');
  if (softeningPositionsForLikes) capture_signals.push('softening positions to keep likes');
  if (refusingToDisappoint) capture_signals.push('refusing to disappoint a single segment');

  const capture_pressure = round1(Math.min(10, capture_signals.length * 2.7));
  const is_captured = capture_signals.length >= 2;

  notes.push(`audience capture detection: ${is_captured ? 'CAPTURED' : 'sovereign'} (${capture_pressure}/10, ${capture_signals.length} signal(s))`);
  return { is_captured, capture_pressure, capture_signals, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
