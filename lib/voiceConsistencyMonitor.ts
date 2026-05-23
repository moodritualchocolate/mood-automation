/**
 * VOICE CONSISTENCY MONITOR (Phase 350 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Continuous monitor on voice consistency across cycles.
 */

export interface VoiceConsistencyMonitorReading {
  voice_consistent: boolean;
  /** 0..10 — voice consistency score. */
  consistency: number;
  notes: string[];
}

export interface VoiceConsistencyMonitorInput {
  voiceMatchesFounding: boolean;
  cyclesOfDrift: number;
}

export function readVoiceConsistencyMonitor(input: VoiceConsistencyMonitorInput): VoiceConsistencyMonitorReading {
  const { voiceMatchesFounding, cyclesOfDrift } = input;
  const notes: string[] = [];

  const consistency = round1(Math.max(0, (voiceMatchesFounding ? 9 : 5) - cyclesOfDrift * 0.6));
  const voice_consistent = consistency >= 6;

  notes.push(`voice consistency monitor: ${voice_consistent ? 'consistent' : 'DRIFTED'} (${consistency}/10)`);
  return { voice_consistent, consistency, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
