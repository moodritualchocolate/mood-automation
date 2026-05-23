/**
 * CIVILIZATION COUPLING KERNEL (Phase 320 — Wave 14: Live Civilization Coupling)
 *
 * Waves 1–13 built an organism that perceives, judges, plans, acts,
 * and remembers feedback. Wave 14 lets it FEEL reality in real time —
 * the organism stops asking "what was received?" and starts asking
 * "what changed in reality because we existed?" This module owns the
 * persistent live-coupling state (data/runtime/live-coupling.json)
 * and is the closing synthesis.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { LiveCouplingGovernorReading } from './liveCouplingGovernor';
import type { RealityPresenceReading } from './realityPresenceVerifier';
import type { LiveImpactDetectionReading } from './liveImpactDetector';
import type { LiveCouplingCoherenceReading } from './liveCouplingCoherenceValidator';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'live-coupling.json';

export interface LiveCouplingState {
  bornAt: number;
  couplingCycles: number;
  liveSignalsIngested: number;
  realityChangesAttributed: number;
  meaningsCarried: number;
  silencesObserved: number;
  presenceScore: number;          // 0..10
  realityCouplingDepth: number;   // 0..10
  livingReputation: number;       // 0..10
  cadenceSync: number;            // 0..10
  noveltyChased: number;
  meaningGenerated: number;
  updatedAt: number;
}

export function createInitialLiveCoupling(): LiveCouplingState {
  return {
    bornAt: Date.now(), couplingCycles: 0, liveSignalsIngested: 0,
    realityChangesAttributed: 0, meaningsCarried: 0, silencesObserved: 0,
    presenceScore: 6, realityCouplingDepth: 6, livingReputation: 5,
    cadenceSync: 5, noveltyChased: 0, meaningGenerated: 0, updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodLiveCoupling?: LiveCouplingState };

export interface LiveCouplingStore {
  read(): Promise<LiveCouplingState>;
  save(state: LiveCouplingState): Promise<void>;
  reset(): Promise<void>;
}

export function createLiveCouplingStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): LiveCouplingStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodLiveCoupling) return g.__moodLiveCoupling;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodLiveCoupling = { ...createInitialLiveCoupling(), ...(JSON.parse(txt) as Partial<LiveCouplingState>) };
      } catch { g.__moodLiveCoupling = createInitialLiveCoupling(); }
      return g.__moodLiveCoupling;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodLiveCoupling = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodLiveCoupling = undefined;
    },
  };
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** The run generated meaning — coupling deepens, presence rises. */
export function evolveLiveCouplingFromMeaning(state: LiveCouplingState): LiveCouplingState {
  const next = { ...state };
  next.couplingCycles += 1; next.meaningsCarried += 1; next.meaningGenerated += 1;
  next.realityChangesAttributed += 1;
  next.realityCouplingDepth = round1(clamp(state.realityCouplingDepth + 0.4, 0, 10));
  next.presenceScore = round1(clamp(state.presenceScore + 0.3, 0, 10));
  next.livingReputation = round1(clamp(state.livingReputation + 0.2, 0, 10));
  return next;
}

/** The run chased novelty over meaning — coupling thins, presence
 *  shifts from substance to spectacle. */
export function evolveLiveCouplingFromNovelty(state: LiveCouplingState): LiveCouplingState {
  const next = { ...state };
  next.couplingCycles += 1; next.noveltyChased += 1;
  next.realityCouplingDepth = round1(clamp(state.realityCouplingDepth - 0.5, 0, 10));
  next.presenceScore = round1(clamp(state.presenceScore - 0.3, 0, 10));
  next.livingReputation = round1(clamp(state.livingReputation - 0.2, 0, 10));
  return next;
}

/** Strategic silence — presence is held without spending novelty. */
export function evolveLiveCouplingFromStrategicSilence(state: LiveCouplingState): LiveCouplingState {
  const next = { ...state };
  next.couplingCycles += 1; next.silencesObserved += 1;
  next.presenceScore = round1(clamp(state.presenceScore + 0.2, 0, 10));
  next.cadenceSync = round1(clamp(state.cadenceSync + 0.3, 0, 10));
  return next;
}

// ─── Phase 320 — the closing synthesis ─────────────────────────

export interface CivilizationCouplingKernelReading {
  coupling_state: 'reality-shaping' | 'present' | 'absent' | 'severed';
  /** True when the organism's existence demonstrably changed reality. */
  organism_changed_reality: boolean;
  /** True when the organism is not present in the reality it claims to act on. */
  organism_was_absent_from_reality: boolean;
  /** 0..10 — overall live coupling integrity. */
  reality_coupling_score: number;
  what_reality_became: string;
  kernel_statement: string;
  notes: string[];
}

export interface CivilizationCouplingKernelInput {
  state: LiveCouplingState;
  governor: LiveCouplingGovernorReading;
  presence: RealityPresenceReading;
  liveImpact: LiveImpactDetectionReading;
  coherence: LiveCouplingCoherenceReading;
}

export function readCivilizationCouplingKernel(input: CivilizationCouplingKernelInput): CivilizationCouplingKernelReading {
  const { state, governor, presence, liveImpact, coherence } = input;
  const notes: string[] = [];

  let reality_coupling_score = 0;
  reality_coupling_score += state.realityCouplingDepth * 0.3;
  reality_coupling_score += state.presenceScore * 0.25;
  reality_coupling_score += presence.presence_score * 0.2;
  reality_coupling_score += coherence.coherence_score * 0.25;
  reality_coupling_score = round1(clamp(reality_coupling_score, 0, 10));

  const organism_was_absent_from_reality =
    governor.governance === 'severed' ||
    // The first two cycles are a presence-building grace period — the
    // organism cannot be "absent" before it has had a chance to be
    // present.
    (state.couplingCycles >= 2 && presence.is_present === false) ||
    (state.couplingCycles >= 4 && state.realityChangesAttributed === 0);

  const organism_changed_reality =
    !organism_was_absent_from_reality &&
    liveImpact.reality_demonstrably_changed &&
    coherence.live_coupling_is_coherent;

  const coupling_state: CivilizationCouplingKernelReading['coupling_state'] =
    organism_was_absent_from_reality ? (governor.governance === 'severed' ? 'severed' : 'absent') :
    organism_changed_reality ? 'reality-shaping' : 'present';

  const what_reality_became = organism_changed_reality
    ? liveImpact.reality_change_summary
    : organism_was_absent_from_reality
      ? 'reality went on unchanged — the organism was absent from the moment it claimed to act in'
      : 'reality is being attended to, but the brand has not yet visibly changed it';

  const kernel_statement = coupling_state === 'severed'
    ? 'the live coupling to reality has been severed — the organism is hallucinating its own presence'
    : coupling_state === 'absent'
      ? 'the organism is absent — it is acting at reality without being inside it'
      : coupling_state === 'reality-shaping'
        ? `the organism's existence is demonstrably changing reality — coupling ${reality_coupling_score}/10`
        : 'the organism is present in reality but has not yet shifted it';

  notes.push(`civilization coupling kernel: ${coupling_state} (${reality_coupling_score}/10) — ${kernel_statement}`);
  return {
    coupling_state, organism_changed_reality, organism_was_absent_from_reality,
    reality_coupling_score, what_reality_became, kernel_statement, notes,
  };
}
