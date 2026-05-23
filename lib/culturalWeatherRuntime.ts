/**
 * CULTURAL WEATHER RUNTIME (Phase 265 — Wave 14: Live Civilization Coupling)
 *
 * Culture has weather — pressure systems, calms, storms — that
 * changes by the hour. This runtime reads the live cultural weather
 * the organism is acting inside of.
 */

export type CulturalWeather = 'calm' | 'unsettled' | 'storm' | 'aftermath';

export interface CulturalWeatherReading {
  weather: CulturalWeather;
  /** Short directive matched to the weather. */
  weather_directive: string;
  /** True when the weather permits substantive action. */
  weather_permits_action: boolean;
  notes: string[];
}

export interface CulturalWeatherInput {
  /** 0..10 — collective exhaustion. */
  collectiveExhaustion: number;
  /** 0..10 — emotional volatility. */
  emotionalVolatility: number;
  /** 0..10 — world tension. */
  worldTension: number;
  /** 0..10 — trust erosion. */
  trustErosion: number;
}

export function readCulturalWeatherRuntime(input: CulturalWeatherInput): CulturalWeatherReading {
  const { collectiveExhaustion, emotionalVolatility, worldTension, trustErosion } = input;
  const notes: string[] = [];

  const pressure = (emotionalVolatility + worldTension + trustErosion) / 3;

  const weather: CulturalWeather =
    pressure >= 7 ? 'storm' :
    pressure >= 4.5 ? 'unsettled' :
    collectiveExhaustion >= 7 ? 'aftermath' : 'calm';

  const weather_directive =
    weather === 'storm' ? 'a storm is in progress — say nothing unless it is shelter'
    : weather === 'unsettled' ? 'the weather is unsettled — keep messages small and grounded'
    : weather === 'aftermath' ? 'the storm has passed — speak quietly to the survivors, never triumphally'
    : 'the cultural weather is calm — substantive action may land';

  const weather_permits_action = weather === 'calm' || weather === 'unsettled';

  notes.push(`cultural weather runtime: ${weather} (pressure ${pressure.toFixed(1)}) — ${weather_directive}`);
  return { weather, weather_directive, weather_permits_action, notes };
}
