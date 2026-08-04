/**
 * EXTERNAL CAPTURE RISK AUDITOR (Phase 383 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Audits the brand for vulnerability to external capture.
 */

export interface ExternalCaptureRiskReading {
  /** 0..10 — current capture risk. */
  risk: number;
  /** True when risk is acceptable. */
  risk_acceptable: boolean;
  notes: string[];
}

export interface ExternalCaptureRiskInput {
  capturePressure: number;
  sovereignty: number;
}

export function readExternalCaptureRiskAuditor(input: ExternalCaptureRiskInput): ExternalCaptureRiskReading {
  const { capturePressure, sovereignty } = input;
  const notes: string[] = [];

  const risk = round1(Math.max(0, Math.min(10, capturePressure - sovereignty * 0.5)));
  const risk_acceptable = risk < 5;

  notes.push(`external capture risk auditor: ${risk}/10 — ${risk_acceptable ? 'acceptable' : 'TOO HIGH'}`);
  return { risk, risk_acceptable, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
