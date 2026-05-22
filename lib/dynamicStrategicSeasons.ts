/**
 * DYNAMIC STRATEGIC SEASONS (Phase 106 — Wave 8: Operating System Genesis)
 *
 * The runtime does not run at one tempo forever. It moves through
 * seasons — growth, silence, observation, recovery, expansion,
 * defense, hibernation — each governing how the whole OS behaves.
 * The season is persistent: it carries across ticks and changes only
 * when reality genuinely calls for a different mode.
 */

import type { StrategicSeasonName } from './operatingSystemCore';
import type { LongHorizonPredictionReading } from './longHorizonPrediction';
import type { KernelHealthReading } from './kernelHealthMonitor';
import type { DirectiveReading } from './directiveEngine';

export interface StrategicSeasonReading {
  season: StrategicSeasonName;
  /** What the season asks of the whole runtime. */
  season_directive: string;
  /** True when the runtime is entering a new season this tick. */
  season_changed: boolean;
  /** Ticks the runtime has spent in this season (0 when newly entered). */
  season_age: number;
  notes: string[];
}

export interface StrategicSeasonInput {
  currentSeason: StrategicSeasonName;
  seasonAge: number;
  longHorizon: LongHorizonPredictionReading;
  health: KernelHealthReading;
  directive: DirectiveReading;
  organismAtRisk: boolean;
  /** True when the organism can afford to expand (Phase 76). */
  canExpand: boolean;
}

const SEASON_DIRECTIVE: Record<StrategicSeasonName, string> = {
  growth: 'grow steadily — deepen the campaign without reaching for new territory',
  silence: 'stay quiet — the runtime speaks only when it has something true',
  observation: 'observe — gather signal and withhold output until the picture is clear',
  recovery: 'recover — yield runtime time to rest and shed accumulated load',
  expansion: 'expand — open new territory while the organism has the reserves',
  defense: 'defend — hold the identity and refuse to compete for volume',
  hibernation: 'hibernate — suspend all but survival-critical cognition',
};

export function readDynamicStrategicSeasons(input: StrategicSeasonInput): StrategicSeasonReading {
  const { currentSeason, seasonAge, longHorizon, health, directive, organismAtRisk, canExpand } = input;
  const notes: string[] = [];

  let season: StrategicSeasonName;
  if (organismAtRisk || directive.directive === 'hibernate') {
    season = 'hibernation';
  } else if (health.attention_exhaustion || health.overall_health < 4) {
    season = 'recovery';
  } else if (directive.directive === 'silence' || directive.directive === 'pause') {
    season = 'silence';
  } else if (longHorizon.predicted_season === 'a-season-of-noise') {
    season = 'defense';
  } else if (longHorizon.predicted_season === 'a-season-of-fatigue') {
    season = 'recovery';
  } else if (longHorizon.predicted_season === 'a-season-of-searching') {
    season = 'observation';
  } else if (canExpand) {
    season = 'expansion';
  } else {
    season = 'growth';
  }

  const season_changed = season !== currentSeason;
  const season_age = season_changed ? 0 : seasonAge;
  const season_directive = SEASON_DIRECTIVE[season];

  notes.push(`dynamic strategic seasons: ${season}` +
    (season_changed ? ` (entered from "${currentSeason}")` : ` (age ${season_age} ticks)`) +
    ` — ${season_directive}`);
  return { season, season_directive, season_changed, season_age, notes };
}
