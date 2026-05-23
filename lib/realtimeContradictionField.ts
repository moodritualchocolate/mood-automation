/**
 * REALTIME CONTRADICTION FIELD (Phase 299 — Wave 14: Live Civilization Coupling)
 *
 * Active contradictions in the live field between what the brand says
 * and what is being heard.
 */

export interface RealtimeContradictionFieldReading {
  /** True when active contradictions exist in the live field. */
  contradictions_active: boolean;
  /** 0..10 — total contradiction pressure. */
  contradiction_pressure: number;
  notes: string[];
}

export interface RealtimeContradictionFieldInput {
  contradictionLoad: number;
  unresolvedContradictions: boolean;
}

export function readRealtimeContradictionField(input: RealtimeContradictionFieldInput): RealtimeContradictionFieldReading {
  const { contradictionLoad, unresolvedContradictions } = input;
  const notes: string[] = [];

  const contradiction_pressure = round1(Math.min(10, contradictionLoad * 0.5 + (unresolvedContradictions ? 3 : 0)));
  const contradictions_active = contradiction_pressure >= 5;

  notes.push(`realtime contradiction field: ${contradictions_active ? 'ACTIVE' : 'quiet'} (${contradiction_pressure}/10)`);
  return { contradictions_active, contradiction_pressure, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
