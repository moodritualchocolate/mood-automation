/**
 * CORE IDENTITY WATCHDOG (Phase 386 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Watchdog process running on top of the identity layer — catches
 * anything the other detectors missed.
 */

export interface CoreIdentityWatchdogReading {
  /** True when the watchdog is currently alerted. */
  alert: boolean;
  alert_reason: string | null;
  notes: string[];
}

export interface CoreIdentityWatchdogInput {
  invariantsScore: number;
  sovereigntyScore: number;
  unexplainedDrift: boolean;
}

export function readCoreIdentityWatchdog(input: CoreIdentityWatchdogInput): CoreIdentityWatchdogReading {
  const { invariantsScore, sovereigntyScore, unexplainedDrift } = input;
  const notes: string[] = [];

  const alert_reason = unexplainedDrift ? 'unexplained drift detected'
    : invariantsScore < 5 ? 'invariants degrading'
    : sovereigntyScore < 4 ? 'sovereignty collapsing'
    : null;

  const alert = alert_reason !== null;

  notes.push(`core identity watchdog: ${alert ? `ALERT — ${alert_reason}` : 'quiet'}`);
  return { alert, alert_reason, notes };
}
