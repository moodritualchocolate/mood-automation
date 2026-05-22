/**
 * STRATEGIC SEASON MONITOR VIEW (Phase 119 — Wave 9: Manifestation Architecture)
 *
 * The runtime moves through seasons. This monitor surfaces the season
 * the operating system is living in — which of the seven it has
 * entered, how long it has held, and the directive that season asks
 * of the whole runtime.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type { StrategicSeasonName } from './operatingSystemCore';

export interface SeasonMarker {
  season: StrategicSeasonName;
  active: boolean;
}

export interface StrategicSeasonMonitorViewModel {
  present: boolean;
  current_season: StrategicSeasonName;
  season_age: number;
  season_directive: string;
  markers: SeasonMarker[];
  statement: string;
}

const ALL_SEASONS: StrategicSeasonName[] = [
  'growth', 'expansion', 'observation', 'silence', 'recovery', 'defense', 'hibernation',
];

const SEASON_DIRECTIVE: Record<StrategicSeasonName, string> = {
  growth: 'grow steadily — deepen the campaign without reaching for new territory',
  silence: 'stay quiet — speak only when there is something true',
  observation: 'observe — gather signal, withhold output until the picture is clear',
  recovery: 'recover — yield runtime time to rest and shed accumulated load',
  expansion: 'expand — open new territory while the reserves hold',
  defense: 'defend — hold the identity, refuse to compete for volume',
  hibernation: 'hibernate — suspend all but survival-critical cognition',
};

export function buildStrategicSeasonMonitorView(snap: RuntimeSnapshot): StrategicSeasonMonitorViewModel {
  const os = snap.os;
  if (!os) {
    return {
      present: false, current_season: 'observation', season_age: 0,
      season_directive: SEASON_DIRECTIVE.observation,
      markers: ALL_SEASONS.map((s) => ({ season: s, active: false })),
      statement: 'no season — the runtime has not begun its first cycle',
    };
  }

  return {
    present: true,
    current_season: os.currentSeason,
    season_age: os.seasonAge,
    season_directive: SEASON_DIRECTIVE[os.currentSeason],
    markers: ALL_SEASONS.map((s) => ({ season: s, active: s === os.currentSeason })),
    statement: `the runtime is in a "${os.currentSeason}" season — held ${os.seasonAge} tick(s) — ${SEASON_DIRECTIVE[os.currentSeason]}`,
  };
}
