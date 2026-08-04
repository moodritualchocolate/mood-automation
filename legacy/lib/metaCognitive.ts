/**
 * META-COGNITIVE RELIABILITY (Wave 34)
 *
 * Persistent measurement of the organism's reasoning reliability
 * across time. Four metrics tracked deterministically from real
 * cognitive events:
 *
 *   cognitionStability        — variance of identity coherence over
 *                                recent observations. Low variance =
 *                                stable cognition. Higher = wobbly.
 *   reasoningDecay            — fraction of recent reviews returning
 *                                'revise-required' or 'refused' verdict.
 *                                Higher = reasoning is degrading.
 *   predictionReliability     — when defer is fired, was it followed
 *                                within N events by recovery (rest +
 *                                improved metrics)? Tracks whether
 *                                defer predictions came true.
 *   recoveryEfficiencyTrend   — slope of recent rest effectiveness.
 *                                Rising = recovery getting better;
 *                                falling = effectiveness degrading.
 *
 * Lives at data/memory/meta-cognitive.json. History arrays capped
 * at HISTORY_LIMIT (32) FIFO.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'meta-cognitive.json';
export const HISTORY_LIMIT = 32;
export const HISTORY_DELTA_THRESHOLD = 0.3;

export interface MetricObservation {
  at: number;
  tick: number;
  value: number;
  delta: number;
}

export interface PredictionTrace {
  deferAt: number;
  deferTick: number;
  /** The temporal-assessment snapshot at the moment of defer. We compare
   *  next-cycle metrics to these to score reliability. */
  preDeferFragmentationRisk: number;
  preDeferCadenceHealth: number;
  /** Set when the prediction window closes (~5 events later). */
  outcome?: 'improved' | 'unchanged' | 'worsened';
  outcomeAt?: number;
  outcomeTick?: number;
  /** Numeric score: positive = defer prediction held, negative = didn't. */
  reliabilityScore?: number;
}

export interface MetaCognitiveState {
  cognitionStabilityHistory: MetricObservation[];
  reasoningDecayHistory: MetricObservation[];
  predictionReliabilityHistory: MetricObservation[];
  recoveryEfficiencyTrendHistory: MetricObservation[];
  /** Open prediction traces (defer events whose outcome window hasn't
   *  closed yet). When closed, they convert to a predictionReliability
   *  observation and move out. */
  openPredictions: PredictionTrace[];
  /** Closed predictions kept for inspection. Capped FIFO. */
  closedPredictions: PredictionTrace[];
  /** 0..10 — running composite of all four metrics. */
  cumulativeReliabilityScore: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialMetaCognitive(): MetaCognitiveState {
  return {
    cognitionStabilityHistory: [],
    reasoningDecayHistory: [],
    predictionReliabilityHistory: [],
    recoveryEfficiencyTrendHistory: [],
    openPredictions: [],
    closedPredictions: [],
    cumulativeReliabilityScore: 7,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodMetaCognitive?: MetaCognitiveState };

export interface MetaCognitiveStore {
  read(): Promise<MetaCognitiveState>;
  save(state: MetaCognitiveState): Promise<void>;
  reset(): Promise<void>;
}

export function createMetaCognitiveStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): MetaCognitiveStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodMetaCognitive) return g.__moodMetaCognitive;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodMetaCognitive = {
          ...createInitialMetaCognitive(),
          ...(JSON.parse(txt) as Partial<MetaCognitiveState>),
        };
      } catch {
        g.__moodMetaCognitive = createInitialMetaCognitive();
      }
      return g.__moodMetaCognitive;
    },
    async save(state) {
      state.cognitionStabilityHistory     = state.cognitionStabilityHistory.slice(-HISTORY_LIMIT);
      state.reasoningDecayHistory         = state.reasoningDecayHistory.slice(-HISTORY_LIMIT);
      state.predictionReliabilityHistory  = state.predictionReliabilityHistory.slice(-HISTORY_LIMIT);
      state.recoveryEfficiencyTrendHistory = state.recoveryEfficiencyTrendHistory.slice(-HISTORY_LIMIT);
      state.closedPredictions             = state.closedPredictions.slice(-HISTORY_LIMIT);
      // openPredictions are time-bounded; no cap, but they convert to closed within ~5 events
      state.updatedAt = nowMs();
      g.__moodMetaCognitive = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMetaCognitive = undefined;
    },
  };
}
