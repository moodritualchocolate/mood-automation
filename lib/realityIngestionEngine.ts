/**
 * REALITY INGESTION ENGINE (Phase 131 — Wave 10: Reality Coupling Architecture)
 *
 * The intake. Before the organism can learn from the world it must
 * read it — how much real external signal is reaching the runtime,
 * how fresh it is, and whether the world is saying enough for the
 * organism to couple to at all.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface RealityIngestionReading {
  /** 0..10 — how much real external signal is reaching the runtime. */
  external_signal_volume: number;
  /** True when there is enough external signal to genuinely couple to. */
  world_is_speaking: boolean;
  /** 0..10 — how fresh the ingested signal is. */
  ingestion_freshness: number;
  dominant_external_signal: string;
  notes: string[];
}

export interface RealityIngestionInput {
  worldState: ExecutiveWorldState;
  /** Count of observed external signals in scope this cycle. */
  externalSignalCount: number;
}

export function readRealityIngestionEngine(input: RealityIngestionInput): RealityIngestionReading {
  const { worldState, externalSignalCount } = input;
  const notes: string[] = [];

  let external_signal_volume = 0;
  external_signal_volume += Math.min(6, externalSignalCount * 0.7);
  external_signal_volume += Math.min(4, worldState.observationCount * 0.3);
  external_signal_volume = round1(Math.min(10, external_signal_volume));

  const ingestion_freshness = round1(Math.min(10, externalSignalCount * 1.2));
  const world_is_speaking = external_signal_volume >= 3;
  const dominant_external_signal = worldState.most_acute_pressure;

  notes.push(`reality ingestion: signal volume ${external_signal_volume}/10` +
    (world_is_speaking ? ` — the world is speaking ("${dominant_external_signal}")` : ' — the world is quiet, little to couple to'));
  return {
    external_signal_volume, world_is_speaking, ingestion_freshness,
    dominant_external_signal, notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
