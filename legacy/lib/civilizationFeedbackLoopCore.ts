/**
 * CIVILIZATION FEEDBACK LOOP CORE (Phase 260 — Wave 13: Reality Feedback Infrastructure)
 *
 * Waves 1–12 built an organism that perceives, reasons, plans, and
 * acts deliberately. Wave 13 closes the loop with reality itself: the
 * organism stops asking "did we publish?" and starts asking "what did
 * this action become inside real human nervous systems over time?"
 * This module owns the persistent feedback state
 * (data/runtime/feedback.json) and is the closing synthesis.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { RealityFeedbackGovernorReading } from './realityFeedbackGovernor';
import type { TrustShiftReading } from './trustShiftDetection';
import type { ResonanceDecayReading } from './resonanceDecayTracking';
import type { MeaningPersistenceReading } from './meaningPersistenceTracker';
import type { FeedbackCoherenceReading } from './feedbackCoherenceValidator';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'feedback.json';

export interface FeedbackState {
  bornAt: number;
  feedbackCycles: number;
  reactionsIngested: number;
  trustShifts: number;
  trustNetGain: number;             // -10..10
  resonanceCurveAUC: number;        // 0..10
  contradictionsFound: number;
  identityCorrections: number;
  meaningPersistenceScore: number;  // 0..10
  falseSuccesses: number;
  slowTruthsDetected: number;
  updatedAt: number;
}

export function createInitialFeedback(): FeedbackState {
  return {
    bornAt: Date.now(),
    feedbackCycles: 0,
    reactionsIngested: 0,
    trustShifts: 0,
    trustNetGain: 0,
    resonanceCurveAUC: 4,
    contradictionsFound: 0,
    identityCorrections: 0,
    meaningPersistenceScore: 5,
    falseSuccesses: 0,
    slowTruthsDetected: 0,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodFeedback?: FeedbackState };

export interface FeedbackStore {
  read(): Promise<FeedbackState>;
  save(state: FeedbackState): Promise<void>;
  reset(): Promise<void>;
}

export function createFeedbackStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): FeedbackStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodFeedback) return g.__moodFeedback;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodFeedback = { ...createInitialFeedback(), ...(JSON.parse(txt) as Partial<FeedbackState>) };
      } catch {
        g.__moodFeedback = createInitialFeedback();
      }
      return g.__moodFeedback;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodFeedback = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodFeedback = undefined;
    },
  };
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** Reception cohered with intent — trust accrues, resonance builds. */
export function evolveFeedbackFromCoherentReception(state: FeedbackState): FeedbackState {
  const next = { ...state };
  next.feedbackCycles += 1;
  next.reactionsIngested += 1;
  next.trustShifts += 1;
  next.trustNetGain = round1(clamp(state.trustNetGain + 0.4, -10, 10));
  next.resonanceCurveAUC = round1(clamp(state.resonanceCurveAUC + 0.3, 0, 10));
  next.meaningPersistenceScore = round1(clamp(state.meaningPersistenceScore + 0.2, 0, 10));
  return next;
}

/** Reception contradicted intent — trust slips, a contradiction is logged. */
export function evolveFeedbackFromContradictoryReception(state: FeedbackState): FeedbackState {
  const next = { ...state };
  next.feedbackCycles += 1;
  next.reactionsIngested += 1;
  next.contradictionsFound += 1;
  next.trustShifts += 1;
  next.trustNetGain = round1(clamp(state.trustNetGain - 0.6, -10, 10));
  next.resonanceCurveAUC = round1(clamp(state.resonanceCurveAUC - 0.2, 0, 10));
  return next;
}

/** The organism shipped nothing — silence becomes its own feedback
 *  signal: meaning has time to settle, slow truths surface. */
export function evolveFeedbackFromSilence(state: FeedbackState): FeedbackState {
  const next = { ...state };
  next.feedbackCycles += 1;
  next.slowTruthsDetected += 1;
  next.meaningPersistenceScore = round1(clamp(state.meaningPersistenceScore + 0.5, 0, 10));
  return next;
}

// ─── Phase 260 — the closing synthesis ─────────────────────────

export interface CivilizationFeedbackLoopReading {
  feedback_state: 'reality-evolving' | 'learning' | 'echo-chamber' | 'blind';
  /** True when the organism is genuinely evolving from reality feedback. */
  organism_evolves_from_reality: boolean;
  /** True when the organism is only hearing itself — feedback is closed. */
  organism_is_in_echo_chamber: boolean;
  /** 0..10 — overall integrity of the reality feedback loop. */
  feedback_integrity_score: number;
  what_the_action_became: string;
  feedback_statement: string;
  notes: string[];
}

export interface CivilizationFeedbackLoopInput {
  state: FeedbackState;
  governor: RealityFeedbackGovernorReading;
  trustShift: TrustShiftReading;
  resonanceDecay: ResonanceDecayReading;
  meaningPersistence: MeaningPersistenceReading;
  coherence: FeedbackCoherenceReading;
}

export function readCivilizationFeedbackLoopCore(input: CivilizationFeedbackLoopInput): CivilizationFeedbackLoopReading {
  const { state, governor, trustShift, resonanceDecay, meaningPersistence, coherence } = input;
  const notes: string[] = [];

  let feedback_integrity_score = 0;
  feedback_integrity_score += clamp(state.trustNetGain + 5, 0, 10) * 0.25;
  feedback_integrity_score += state.resonanceCurveAUC * 0.25;
  feedback_integrity_score += state.meaningPersistenceScore * 0.25;
  feedback_integrity_score += coherence.coherence_score * 0.25;
  feedback_integrity_score = round1(clamp(feedback_integrity_score, 0, 10));

  const organism_is_in_echo_chamber =
    governor.governance === 'echo-chamber' ||
    (state.feedbackCycles >= 5 && state.reactionsIngested === 0);

  const organism_evolves_from_reality =
    !organism_is_in_echo_chamber &&
    governor.governance === 'reality-evolving' &&
    feedback_integrity_score >= 5;

  const feedback_state: CivilizationFeedbackLoopReading['feedback_state'] =
    organism_is_in_echo_chamber ? 'echo-chamber' :
    governor.governance === 'blind' ? 'blind' :
    organism_evolves_from_reality ? 'reality-evolving' : 'learning';

  const what_the_action_became =
    trustShift.shift_direction === 'gaining' && resonanceDecay.decay_is_healthy
      ? 'a moment audiences carried with them — meaning persisted, trust grew'
      : trustShift.shift_direction === 'eroding'
        ? 'a moment that quietly cost trust — the action became its own subtraction'
        : meaningPersistence.meaning_persists
          ? 'a quiet truth that kept working after the cycle ended'
          : 'a moment that landed and then evaporated — neither helped nor hurt';

  const feedback_statement =
    feedback_state === 'echo-chamber'
      ? 'the organism is only hearing itself — the feedback loop is closed'
      : feedback_state === 'blind'
        ? 'the organism is acting without reading what its actions become — it is blind to reality'
        : feedback_state === 'reality-evolving'
          ? `the organism is genuinely evolving from what its actions become — integrity ${feedback_integrity_score}/10`
          : 'the organism is beginning to learn from reality — feedback is forming but not yet driving evolution';

  notes.push(`civilization feedback loop: ${feedback_state} (integrity ${feedback_integrity_score}/10) — ${feedback_statement}`);
  return {
    feedback_state, organism_evolves_from_reality, organism_is_in_echo_chamber,
    feedback_integrity_score, what_the_action_became, feedback_statement, notes,
  };
}
