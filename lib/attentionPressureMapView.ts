/**
 * ATTENTION PRESSURE MAP VIEW (Phase 118 — Wave 9: Manifestation Architecture)
 *
 * Pressure is not one number — it is a field. This module lays the
 * pressures bearing on the organism onto a map: external world
 * pressure, internal organism load, and runtime strain, each a cell
 * with an intensity the UI renders as a heat field.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import { clamp01 } from './runtimeUIBrain';

export interface PressureCell {
  label: string;
  source: 'external' | 'internal' | 'runtime';
  /** 0..1 — heat intensity. */
  intensity: number;
}

export interface AttentionPressureMapViewModel {
  present: boolean;
  cells: PressureCell[];
  /** 0..10 — total pressure bearing on the organism. */
  total_pressure: number;
  hottest_cell: string | null;
  statement: string;
}

export function buildAttentionPressureMapView(snap: RuntimeSnapshot): AttentionPressureMapViewModel {
  const { worldState, organism, os } = snap;
  const cells: PressureCell[] = [];

  if (worldState) {
    cells.push({ label: 'world tension', source: 'external', intensity: clamp01(worldState.world_tension / 10) });
    cells.push({ label: 'attention chaos', source: 'external', intensity: clamp01(worldState.attention_chaos / 10) });
    cells.push({ label: 'digital overload', source: 'external', intensity: clamp01(worldState.digital_overload / 10) });
    cells.push({ label: 'collective exhaustion', source: 'external', intensity: clamp01(worldState.collective_exhaustion / 10) });
  }
  if (organism) {
    cells.push({ label: 'organism stress', source: 'internal', intensity: clamp01(organism.stressAccumulation / 10) });
    cells.push({ label: 'complexity load', source: 'internal', intensity: clamp01(organism.complexityLoad / 10) });
    cells.push({ label: 'energy depletion', source: 'internal', intensity: clamp01((10 - organism.energyReserves) / 10) });
  }
  if (os) {
    cells.push({ label: 'fragmentation', source: 'runtime', intensity: clamp01(os.fragmentationStreak / 4) });
    cells.push({ label: 'coordination deficit', source: 'runtime', intensity: clamp01((10 - os.coordinationEMA) / 10) });
  }

  const total_pressure = cells.length
    ? Math.round((cells.reduce((s, c) => s + c.intensity, 0) / cells.length) * 100) / 10
    : 0;
  const hottest = [...cells].sort((a, b) => b.intensity - a.intensity)[0] ?? null;

  return {
    present: cells.length > 0,
    cells, total_pressure,
    hottest_cell: hottest ? hottest.label : null,
    statement: cells.length
      ? `attention pressure ${total_pressure}/10 — hottest: ${hottest!.label}`
      : 'no pressure map — the runtime has not observed any pressure',
  };
}
