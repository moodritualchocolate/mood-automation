/**
 * REALITY COUPLING CORE (Phase 150 — Wave 10: Reality Coupling Architecture)
 *
 * Waves 1–9 built an organism that lives, governs, and shows itself.
 * Wave 10 stops it living only inside itself: the organism begins
 * LEARNING FROM THE EXTERNAL WORLD — audience behaviour, trust,
 * fatigue, saturation, the narrative climate.
 *
 * This module owns the persistent coupling state
 * (data/runtime/reality-coupling.json) and is the closing synthesis
 * of the wave: is the organism in TRUE RESONANCE with reality, or
 * addicted to STIMULUS? Resonance compounds trust; stimulus erodes
 * authenticity. The two must never be confused.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { WorldFeedbackFusionReading } from './worldFeedbackFusion';
import type { TrueResonanceReading } from './trueResonanceDetector';
import type { CouplingGovernorReading } from './realityCouplingGovernor';
import type { CouplingHealthReading } from './couplingHealthMonitor';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'reality-coupling.json';

export interface RealityCouplingState {
  bornAt: number;
  couplingCycles: number;       // ingestion cycles the coupling has lived
  trustLevel: number;           // 0..10 — accumulated audience trust
  authenticityReserve: number;  // 0..10 — erodes when the organism chases stimulus
  reputationCredit: number;     // 0..10
  saturationMemory: number;     // 0..10 — accumulated audience saturation
  resonanceWins: number;        // times true resonance governed
  stimulusWins: number;         // times stimulus addiction governed
  silenceHonored: number;       // times the organism stayed quiet for an exhausted world
  updatedAt: number;
}

export function createInitialCoupling(): RealityCouplingState {
  return {
    bornAt: Date.now(),
    couplingCycles: 0,
    trustLevel: 5,
    authenticityReserve: 8,
    reputationCredit: 6,
    saturationMemory: 2,
    resonanceWins: 0,
    stimulusWins: 0,
    silenceHonored: 0,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodCoupling?: RealityCouplingState };

export interface RealityCouplingStore {
  read(): Promise<RealityCouplingState>;
  save(state: RealityCouplingState): Promise<void>;
  reset(): Promise<void>;
}

export function createRealityCouplingStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): RealityCouplingStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodCoupling) return g.__moodCoupling;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodCoupling = { ...createInitialCoupling(), ...(JSON.parse(txt) as Partial<RealityCouplingState>) };
      } catch {
        g.__moodCoupling = createInitialCoupling();
      }
      return g.__moodCoupling;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodCoupling = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCoupling = undefined;
    },
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** The organism shipped in TRUE RESONANCE — trust compounds, the
 *  authenticity reserve holds, reputation grows. */
export function evolveCouplingFromResonance(state: RealityCouplingState): RealityCouplingState {
  const next = { ...state };
  next.couplingCycles += 1;
  next.resonanceWins += 1;
  next.trustLevel = clamp10(round1(state.trustLevel + 0.5));
  next.authenticityReserve = clamp10(round1(state.authenticityReserve + 0.2));
  next.reputationCredit = clamp10(round1(state.reputationCredit + 0.3));
  next.saturationMemory = clamp10(round1(state.saturationMemory + 0.5));
  return next;
}

/** The organism shipped for STIMULUS — engagement chased over truth.
 *  Authenticity erodes, trust dips, saturation spikes. */
export function evolveCouplingFromStimulus(state: RealityCouplingState): RealityCouplingState {
  const next = { ...state };
  next.couplingCycles += 1;
  next.stimulusWins += 1;
  next.trustLevel = clamp10(round1(state.trustLevel - 0.8));
  next.authenticityReserve = clamp10(round1(state.authenticityReserve - 1.2));
  next.reputationCredit = clamp10(round1(state.reputationCredit - 0.5));
  next.saturationMemory = clamp10(round1(state.saturationMemory + 1.5));
  return next;
}

/** The organism stayed SILENT for an exhausted world — it added
 *  nothing to the feed. Saturation recovers; quiet trust holds. */
export function evolveCouplingFromSilence(state: RealityCouplingState): RealityCouplingState {
  const next = { ...state };
  next.couplingCycles += 1;
  next.silenceHonored += 1;
  next.trustLevel = clamp10(round1(state.trustLevel + 0.2));
  next.authenticityReserve = clamp10(round1(state.authenticityReserve + 0.3));
  next.saturationMemory = clamp10(round1(state.saturationMemory - 1.5));
  return next;
}

// ─── Phase 150 — the closing synthesis ─────────────────────────

export interface RealityCouplingReading {
  coupling_state: 'true-coupling' | 'healthy' | 'straining' | 'stimulus-addicted' | 'decoupled';
  /** True when the organism is genuinely learning from reality. */
  organism_is_coupled_to_reality: boolean;
  /** True when the organism is chasing stimulus, not resonance. */
  organism_is_addicted_to_stimulus: boolean;
  /** 0..10 — overall coupling quality. */
  coupling_score: number;
  coupling_statement: string;
  notes: string[];
}

export interface RealityCouplingInput {
  state: RealityCouplingState;
  worldFeedback: WorldFeedbackFusionReading;
  resonance: TrueResonanceReading;
  governor: CouplingGovernorReading;
  health: CouplingHealthReading;
}

export function readRealityCouplingCore(input: RealityCouplingInput): RealityCouplingReading {
  const { state, worldFeedback, resonance, governor, health } = input;
  const notes: string[] = [];

  const decided = state.resonanceWins + state.stimulusWins;
  const resonanceShare = decided > 0 ? state.resonanceWins / decided : 0.5;

  let coupling_score = 0;
  coupling_score += state.trustLevel * 0.3;
  coupling_score += state.authenticityReserve * 0.3;
  coupling_score += health.coupling_health * 0.25;
  coupling_score += resonanceShare * 1.5;
  coupling_score = clamp10(round1(coupling_score));

  const organism_is_addicted_to_stimulus =
    resonance.is_stimulus_addiction ||
    governor.coupling_mode === 'over-coupled' ||
    (decided >= 4 && state.stimulusWins > state.resonanceWins);

  const organism_is_coupled_to_reality =
    governor.coupling_mode === 'coupled' &&
    !organism_is_addicted_to_stimulus &&
    !health.coupling_is_failing;

  const coupling_state: RealityCouplingReading['coupling_state'] =
    organism_is_addicted_to_stimulus ? 'stimulus-addicted' :
    governor.coupling_mode === 'decoupled' ? 'decoupled' :
    health.coupling_is_failing ? 'straining' :
    organism_is_coupled_to_reality && resonance.is_true_resonance ? 'true-coupling' :
    'healthy';

  const coupling_statement =
    coupling_state === 'stimulus-addicted'
      ? 'the organism is chasing stimulus, not resonance — authenticity is being spent for reach'
      : coupling_state === 'decoupled'
        ? 'the organism has decoupled from reality — it is acting from inside itself, not from the world'
        : coupling_state === 'straining'
          ? 'the coupling to reality is straining — the organism is not learning cleanly from the world'
          : coupling_state === 'true-coupling'
            ? `the organism is in true resonance with reality — trust ${state.trustLevel}/10, authenticity ${state.authenticityReserve}/10`
            : `the organism is coupled to reality and learning from it — coupling ${coupling_score}/10`;

  notes.push(`reality coupling core: ${coupling_state} (coupling ${coupling_score}/10) — ${coupling_statement}`);
  notes.push(`reality coupling: ${state.resonanceWins} resonance / ${state.stimulusWins} stimulus across ${state.couplingCycles} cycles · ${worldFeedback.world_says}`);
  return {
    coupling_state, organism_is_coupled_to_reality, organism_is_addicted_to_stimulus,
    coupling_score, coupling_statement, notes,
  };
}
