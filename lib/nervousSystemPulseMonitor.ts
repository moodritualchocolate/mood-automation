/**
 * NERVOUS SYSTEM PULSE MONITOR (Phase 276 — Wave 14: Live Civilization Coupling)
 *
 * A continuous live pulse on the audience nervous system — the
 * rhythm beneath the signals.
 */

export type NervousPulse = 'steady' | 'elevated' | 'erratic' | 'flat';

export interface NervousSystemPulseReading {
  pulse: NervousPulse;
  /** 0..10 — pulse intensity. */
  pulse_intensity: number;
  notes: string[];
}

export interface NervousSystemPulseInput {
  liveIntensity: number;
  sentimentVariance: number;
  liveSignalVolume: number;
}

export function readNervousSystemPulseMonitor(input: NervousSystemPulseInput): NervousSystemPulseReading {
  const { liveIntensity, sentimentVariance, liveSignalVolume } = input;
  const notes: string[] = [];

  const pulse_intensity = round1(Math.min(10, liveIntensity * 0.5 + liveSignalVolume * 0.3 + sentimentVariance * 0.2));

  const pulse: NervousPulse =
    liveSignalVolume < 2 ? 'flat' :
    sentimentVariance >= 5 ? 'erratic' :
    pulse_intensity >= 6 ? 'elevated' : 'steady';

  notes.push(`nervous system pulse monitor: ${pulse} (intensity ${pulse_intensity}/10)`);
  return { pulse, pulse_intensity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
