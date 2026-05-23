/**
 * REALITY CHANGE ATTRIBUTION (Phase 294 — Wave 14: Live Civilization Coupling)
 *
 * If reality changed this cycle, what part of the change can be
 * honestly attributed to the brand's existence?
 */

export interface RealityChangeAttributionReading {
  /** 0..10 — share of the change that is honestly attributable. */
  attribution_share: number;
  /** True when the attribution claim holds up. */
  attribution_holds: boolean;
  attribution_note: string;
  notes: string[];
}

export interface RealityChangeAttributionInput {
  realityChanged: boolean;
  worldShiftedAlone: boolean;
  liveSignalClarity: number;
}

export function readRealityChangeAttribution(input: RealityChangeAttributionInput): RealityChangeAttributionReading {
  const { realityChanged, worldShiftedAlone, liveSignalClarity } = input;
  const notes: string[] = [];

  let attribution_share = 0;
  if (realityChanged) attribution_share += liveSignalClarity * 0.7;
  if (worldShiftedAlone) attribution_share -= 4;
  attribution_share = round1(Math.max(0, Math.min(10, attribution_share)));

  const attribution_holds = realityChanged && attribution_share >= 4;

  const attribution_note = !realityChanged
    ? 'nothing to attribute — reality did not change this cycle'
    : worldShiftedAlone
      ? 'the world shifted on its own — credit cannot be claimed for the change'
      : attribution_holds
        ? `~${attribution_share}/10 of the change is honestly attributable to the brand`
        : 'signal too thin to attribute the change to the brand';

  notes.push(`reality change attribution: ${attribution_note}`);
  return { attribution_share, attribution_holds, attribution_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
