/**
 * ASSIMILATION PRESSURE MONITOR (Phase 334 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Monitors total assimilation pressure on the brand from all sides.
 */

export interface AssimilationPressureMonitorReading {
  /** 0..10 — total assimilation pressure. */
  total_pressure: number;
  /** True when pressure has reached dangerous levels. */
  pressure_is_dangerous: boolean;
  notes: string[];
}

export interface AssimilationPressureMonitorInput {
  trendPressure: number;
  audienceConformityPressure: number;
  peerPressure: number;
}

export function readAssimilationPressureMonitor(input: AssimilationPressureMonitorInput): AssimilationPressureMonitorReading {
  const { trendPressure, audienceConformityPressure, peerPressure } = input;
  const notes: string[] = [];

  const total_pressure = round1((trendPressure + audienceConformityPressure + peerPressure) / 3);
  const pressure_is_dangerous = total_pressure >= 7;

  notes.push(`assimilation pressure monitor: ${total_pressure}/10 — ${pressure_is_dangerous ? 'DANGEROUS' : 'manageable'}`);
  return { total_pressure, pressure_is_dangerous, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
