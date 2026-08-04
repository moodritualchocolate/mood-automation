/** GENERATIVE PRESENCE WATCHDOG (Phase 481 — Wave 16) */
export interface GenerativePresenceWatchdogReading { alert: boolean; reason: string | null; notes: string[]; }
export interface GenerativePresenceWatchdogInput { fieldStrength: number; forcing: boolean; }
export function readGenerativePresenceWatchdog(input: GenerativePresenceWatchdogInput): GenerativePresenceWatchdogReading {
  const reason = input.forcing ? 'forcing reality' : input.fieldStrength < 3 ? 'field too thin' : null;
  return { alert: reason !== null, reason, notes: [`generative presence watchdog: ${reason ? `ALERT — ${reason}` : 'quiet'}`] };
}
