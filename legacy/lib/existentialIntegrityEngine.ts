/**
 * EXISTENTIAL INTEGRITY ENGINE (Phase 400 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Waves 1–14 built an organism that perceives, judges, plans, acts,
 * learns from feedback, and feels reality in real time. Wave 15
 * answers the new danger: the more deeply it couples to reality, the
 * more it risks dissolving into reality. This module owns the
 * persistent sovereign-identity state (data/runtime/identity.json) and
 * is the closing synthesis: the organism stops asking "how do we
 * adapt?" and starts asking "how do we remain ourselves while touching
 * the world deeply?"
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { IdentitySovereigntyGovernorReading } from './identitySovereigntyGovernor';
import type { CoreIdentityInvariantReading } from './coreIdentityInvariantEngine';
import type { TruthOverPopularityReading } from './truthOverPopularityGovernor';
import type { SovereignPresenceCheckReading } from './sovereignPresenceCheck';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'identity.json';

export interface SovereignIdentityState {
  bornAt: number;
  preservationCycles: number;
  identityCorruptions: number;
  driftEventsRecovered: number;
  popularityChosenOverTruth: number;
  truthChosenOverPopularity: number;
  audienceCaptureEvents: number;
  immuneResponses: number;
  coreIntegrityScore: number;     // 0..10
  sovereigntyScore: number;       // 0..10
  updatedAt: number;
}

export function createInitialSovereignIdentity(): SovereignIdentityState {
  return {
    bornAt: Date.now(),
    preservationCycles: 0,
    identityCorruptions: 0,
    driftEventsRecovered: 0,
    popularityChosenOverTruth: 0,
    truthChosenOverPopularity: 0,
    audienceCaptureEvents: 0,
    immuneResponses: 0,
    coreIntegrityScore: 7,
    sovereigntyScore: 7,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodSovereignIdentity?: SovereignIdentityState };

export interface SovereignIdentityStore {
  read(): Promise<SovereignIdentityState>;
  save(state: SovereignIdentityState): Promise<void>;
  reset(): Promise<void>;
}

export function createSovereignIdentityStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): SovereignIdentityStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodSovereignIdentity) return g.__moodSovereignIdentity;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodSovereignIdentity = { ...createInitialSovereignIdentity(), ...(JSON.parse(txt) as Partial<SovereignIdentityState>) };
      } catch { g.__moodSovereignIdentity = createInitialSovereignIdentity(); }
      return g.__moodSovereignIdentity;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodSovereignIdentity = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodSovereignIdentity = undefined;
    },
  };
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** The run chose truth over popularity — sovereignty deepens. */
export function evolveIdentityFromTruth(state: SovereignIdentityState): SovereignIdentityState {
  const next = { ...state };
  next.preservationCycles += 1;
  next.truthChosenOverPopularity += 1;
  next.sovereigntyScore = round1(clamp(state.sovereigntyScore + 0.4, 0, 10));
  next.coreIntegrityScore = round1(clamp(state.coreIntegrityScore + 0.3, 0, 10));
  return next;
}

/** The run chose popularity over truth — corruption is logged. */
export function evolveIdentityFromPopularityCapture(state: SovereignIdentityState): SovereignIdentityState {
  const next = { ...state };
  next.preservationCycles += 1;
  next.popularityChosenOverTruth += 1;
  next.identityCorruptions += 1;
  next.audienceCaptureEvents += 1;
  next.sovereigntyScore = round1(clamp(state.sovereigntyScore - 0.7, 0, 10));
  next.coreIntegrityScore = round1(clamp(state.coreIntegrityScore - 0.5, 0, 10));
  return next;
}

/** The run withheld action — identity rests, no corruption can sneak in. */
export function evolveIdentityFromRestraint(state: SovereignIdentityState): SovereignIdentityState {
  const next = { ...state };
  next.preservationCycles += 1;
  next.sovereigntyScore = round1(clamp(state.sovereigntyScore + 0.2, 0, 10));
  return next;
}

// ─── Phase 400 — the closing synthesis ─────────────────────────

export interface ExistentialIntegrityReading {
  identity_state: 'sovereign-and-coupled' | 'guarded' | 'compromising' | 'captured';
  /** True when the organism remains itself while touching the world deeply. */
  remains_itself_while_touching_world: boolean;
  /** True when the organism has been captured by the world it touches. */
  has_been_captured: boolean;
  /** 0..10 — overall existential integrity. */
  existential_integrity_score: number;
  integrity_statement: string;
  notes: string[];
}

export interface ExistentialIntegrityInput {
  state: SovereignIdentityState;
  governor: IdentitySovereigntyGovernorReading;
  invariants: CoreIdentityInvariantReading;
  truthOverPop: TruthOverPopularityReading;
  presence: SovereignPresenceCheckReading;
}

export function readExistentialIntegrityEngine(input: ExistentialIntegrityInput): ExistentialIntegrityReading {
  const { state, governor, invariants, truthOverPop, presence } = input;
  const notes: string[] = [];

  let existential_integrity_score = 0;
  existential_integrity_score += state.coreIntegrityScore * 0.3;
  existential_integrity_score += state.sovereigntyScore * 0.3;
  existential_integrity_score += invariants.invariants_intact_score * 0.2;
  existential_integrity_score += (truthOverPop.chose_truth ? 2 : 0);
  existential_integrity_score = round1(clamp(existential_integrity_score, 0, 10));

  const has_been_captured =
    governor.governance === 'captured' ||
    !invariants.all_invariants_intact ||
    (state.preservationCycles >= 4 && state.popularityChosenOverTruth > state.truthChosenOverPopularity * 2);

  const remains_itself_while_touching_world =
    !has_been_captured &&
    governor.governance === 'sovereign' &&
    invariants.all_invariants_intact &&
    presence.sovereign_presence_holds;

  const identity_state: ExistentialIntegrityReading['identity_state'] =
    has_been_captured ? 'captured' :
    remains_itself_while_touching_world ? 'sovereign-and-coupled' :
    governor.governance === 'guarded' ? 'guarded' : 'compromising';

  const integrity_statement =
    identity_state === 'captured'
      ? 'the organism has been captured by the world it touches — it has stopped being itself'
      : identity_state === 'sovereign-and-coupled'
        ? 'the organism remains itself while touching the world deeply — sovereign presence holds'
        : identity_state === 'guarded'
          ? 'the organism is holding its identity defensively — coupled but not yet sovereign'
          : 'the organism is compromising under live pressure — identity is bending';

  notes.push(`existential integrity engine: ${identity_state} (${existential_integrity_score}/10) — ${integrity_statement}`);
  return {
    identity_state, remains_itself_while_touching_world, has_been_captured,
    existential_integrity_score, integrity_statement, notes,
  };
}
