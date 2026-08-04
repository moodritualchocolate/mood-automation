/**
 * REALTIME CONTEXT WINDOW MONITOR (Phase 310 — Wave 14: Live Civilization Coupling)
 *
 * Monitors the live "context window" the brand is operating inside —
 * what is happening in the broader live moment that frames the action.
 */

export interface RealtimeContextWindowReading {
  /** True when the live context is workable for the brand. */
  context_is_workable: boolean;
  context_description: string;
  notes: string[];
}

export interface RealtimeContextWindowInput {
  crisisActive: boolean;
  opportunityOpen: boolean;
  culturalWeather: 'calm' | 'unsettled' | 'storm' | 'aftermath';
}

export function readRealtimeContextWindowMonitor(input: RealtimeContextWindowInput): RealtimeContextWindowReading {
  const { crisisActive, opportunityOpen, culturalWeather } = input;
  const notes: string[] = [];

  const context_is_workable = !crisisActive && culturalWeather !== 'storm';

  const context_description = crisisActive
    ? 'the live context is a crisis — anything said now is colored by it'
    : opportunityOpen
      ? 'the live context is an open window — substantive action would land'
      : `the live context is ${culturalWeather} — workable, ordinary`;

  notes.push(`realtime context window monitor: ${context_is_workable ? 'workable' : 'NOT workable'} — ${context_description}`);
  return { context_is_workable, context_description, notes };
}
