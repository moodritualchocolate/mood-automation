/**
 * WEATHER LOG ARCHIVE (Wave 17.6 — Embodied Runtime Presence)
 *
 * The atmosphere of the moment is visible in the dashboard.
 * The atmosphere of the past hour is not. This archive holds a
 * short log of recent cognitive-weather samples — one per pipeline
 * cycle — so the runtime can render *where it came from*, not only
 * where it is right now.
 *
 * Persisted to data/runtime/weather-log.json. Capped at 64 samples,
 * oldest evicted; totalSamples is monotonic for accurate stats even
 * across eviction.
 *
 * Each sample is a tiny record. The view model that reads this
 * archive does the work of building transition fronts and memory
 * pressure; the archive itself just remembers.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'weather-log.json';
const MAX_SAMPLES = 64;

export type WeatherSampleKind =
  | 'awake' | 'breathing' | 'hushed' | 'restrained' | 'strained' | 'flourishing' | 'dormant';

export interface WeatherSample {
  at: number;
  weather: WeatherSampleKind;
  /** 0..10 — silence strength at the moment of sampling. */
  silence_strength: number;
  /** Whether a fresh protection event coincided with this sample. */
  protection_recorded: boolean;
  /** Whether a fresh scar coincided with this sample. */
  scar_recorded: boolean;
}

export interface WeatherLogState {
  bornAt: number;
  totalSamples: number;        // monotonic, includes evicted
  samples: WeatherSample[];    // capped, oldest evicted
  updatedAt: number;
}

export function createInitialWeatherLog(): WeatherLogState {
  return { bornAt: Date.now(), totalSamples: 0, samples: [], updatedAt: Date.now() };
}

const g = globalThis as unknown as { __moodWeatherLog?: WeatherLogState };

export interface WeatherLogStore {
  read(): Promise<WeatherLogState>;
  save(state: WeatherLogState): Promise<void>;
  reset(): Promise<void>;
}

export function createWeatherLogStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): WeatherLogStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodWeatherLog) return g.__moodWeatherLog;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodWeatherLog = { ...createInitialWeatherLog(), ...(JSON.parse(txt) as Partial<WeatherLogState>) };
      } catch { g.__moodWeatherLog = createInitialWeatherLog(); }
      return g.__moodWeatherLog;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodWeatherLog = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodWeatherLog = undefined;
    },
  };
}

/**
 * Append a new weather sample. The pipeline calls this at the end
 * of every run (approve and exhausted paths) so every cycle leaves
 * a trace.
 */
export function appendWeatherSample(state: WeatherLogState, sample: WeatherSample): WeatherLogState {
  const samples = [...state.samples, sample].slice(-MAX_SAMPLES);
  return {
    ...state,
    samples,
    totalSamples: state.totalSamples + 1,
    updatedAt: Date.now(),
  };
}
