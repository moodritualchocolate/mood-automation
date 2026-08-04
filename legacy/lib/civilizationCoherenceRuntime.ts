/**
 * CIVILIZATION COHERENCE RUNTIME (Phase 500 — Wave 16: Generative Civilization Presence)
 *
 * Waves 1–15 built an organism that perceives, judges, plans, acts,
 * learns, feels reality, and remains itself. Wave 16 asks the deepest
 * question yet: "How does reality become different because we existed
 * beautifully inside it?" This module owns the persistent generative-
 * presence state and is the closing kernel.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { GenerativePresenceGovernorReading } from './generativePresenceGovernor';
import type { CivilizationPresenceFieldReading } from './civilizationPresenceField';
import type { CoherentHopeArchitectureReading } from './coherentHopeArchitecture';
import type { GenerativeIntegrityCoherenceReading } from './generativeIntegrityCoherence';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'generative-presence.json';

export interface GenerativePresenceState {
  bornAt: number;
  presenceCycles: number;
  meaningPropagated: number;
  trustGravityAccumulated: number;
  beautyMomentsCreated: number;
  hopeSeedsPlanted: number;
  cynicismRepelled: number;
  collectiveHealingDispatched: number;
  forcedInfluenceAttempts: number;
  generativeImpactScore: number;     // 0..10
  civilizationCoherenceScore: number; // 0..10
  updatedAt: number;
}

export function createInitialGenerativePresence(): GenerativePresenceState {
  return {
    bornAt: Date.now(), presenceCycles: 0, meaningPropagated: 0,
    trustGravityAccumulated: 0, beautyMomentsCreated: 0, hopeSeedsPlanted: 0,
    cynicismRepelled: 0, collectiveHealingDispatched: 0, forcedInfluenceAttempts: 0,
    generativeImpactScore: 6, civilizationCoherenceScore: 6, updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodGenerativePresence?: GenerativePresenceState };

export interface GenerativePresenceStore {
  read(): Promise<GenerativePresenceState>;
  save(state: GenerativePresenceState): Promise<void>;
  reset(): Promise<void>;
}

export function createGenerativePresenceStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): GenerativePresenceStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodGenerativePresence) return g.__moodGenerativePresence;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodGenerativePresence = { ...createInitialGenerativePresence(), ...(JSON.parse(txt) as Partial<GenerativePresenceState>) };
      } catch { g.__moodGenerativePresence = createInitialGenerativePresence(); }
      return g.__moodGenerativePresence;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodGenerativePresence = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodGenerativePresence = undefined;
    },
  };
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** The run created beauty / meaning — presence builds, coherence rises. */
export function evolveGenerativeFromBeauty(state: GenerativePresenceState): GenerativePresenceState {
  const next = { ...state };
  next.presenceCycles += 1; next.beautyMomentsCreated += 1; next.meaningPropagated += 1;
  next.trustGravityAccumulated = round1(clamp(state.trustGravityAccumulated + 0.4, 0, 100));
  next.generativeImpactScore = round1(clamp(state.generativeImpactScore + 0.3, 0, 10));
  next.civilizationCoherenceScore = round1(clamp(state.civilizationCoherenceScore + 0.2, 0, 10));
  return next;
}

/** The run forced influence — presence is damaged. */
export function evolveGenerativeFromForce(state: GenerativePresenceState): GenerativePresenceState {
  const next = { ...state };
  next.presenceCycles += 1; next.forcedInfluenceAttempts += 1;
  next.generativeImpactScore = round1(clamp(state.generativeImpactScore - 0.7, 0, 10));
  next.civilizationCoherenceScore = round1(clamp(state.civilizationCoherenceScore - 0.5, 0, 10));
  return next;
}

/** Silence — presence rests, accumulates without spending. */
export function evolveGenerativeFromQuiet(state: GenerativePresenceState): GenerativePresenceState {
  const next = { ...state };
  next.presenceCycles += 1;
  next.civilizationCoherenceScore = round1(clamp(state.civilizationCoherenceScore + 0.1, 0, 10));
  return next;
}

// ─── Phase 500 — the closing kernel ────────────────────────────

export interface CivilizationCoherenceRuntimeReading {
  generative_state: 'flourishing' | 'present' | 'thin' | 'extractive';
  /** The Wave 16 governing question answered: did reality become different
   *  because we existed beautifully inside it? */
  changed_reality_beautifully: boolean;
  /** The opposite failure: damaged reality by forcing it. */
  damaged_reality_by_forcing: boolean;
  /** 0..10 — civilizational coherence the brand contributed to. */
  civilization_coherence_score: number;
  what_the_world_received: string;
  runtime_statement: string;
  notes: string[];
}

export interface CivilizationCoherenceRuntimeInput {
  state: GenerativePresenceState;
  governor: GenerativePresenceGovernorReading;
  presenceField: CivilizationPresenceFieldReading;
  hope: CoherentHopeArchitectureReading;
  coherence: GenerativeIntegrityCoherenceReading;
}

export function readCivilizationCoherenceRuntime(input: CivilizationCoherenceRuntimeInput): CivilizationCoherenceRuntimeReading {
  const { state, governor, presenceField, hope, coherence } = input;
  const notes: string[] = [];

  let civilization_coherence_score = 0;
  civilization_coherence_score += state.civilizationCoherenceScore * 0.3;
  civilization_coherence_score += state.generativeImpactScore * 0.25;
  civilization_coherence_score += presenceField.field_strength * 0.2;
  civilization_coherence_score += coherence.coherence_score * 0.15;
  civilization_coherence_score += hope.hope_is_coherent ? 1 : 0;
  civilization_coherence_score = round1(clamp(civilization_coherence_score, 0, 10));

  const damaged_reality_by_forcing =
    governor.governance === 'extractive' ||
    (state.presenceCycles >= 4 && state.forcedInfluenceAttempts > state.beautyMomentsCreated);

  const changed_reality_beautifully =
    !damaged_reality_by_forcing &&
    governor.governance === 'flourishing' &&
    presenceField.field_is_generative &&
    coherence.is_coherent;

  const generative_state: CivilizationCoherenceRuntimeReading['generative_state'] =
    damaged_reality_by_forcing ? 'extractive' :
    changed_reality_beautifully ? 'flourishing' :
    presenceField.field_strength >= 5 ? 'present' : 'thin';

  const what_the_world_received = changed_reality_beautifully
    ? `a quiet field of meaning carrying ${state.beautyMomentsCreated} moment(s) of beauty, ${state.hopeSeedsPlanted} seed(s) of hope, ${state.cynicismRepelled} repulsion(s) of cynicism`
    : damaged_reality_by_forcing
      ? 'pressure where presence should have been — the world received force, not gift'
      : 'a brand attending to reality without yet beautifully changing it';

  const runtime_statement = generative_state === 'extractive'
    ? 'the brand has been extracting from reality instead of giving to it'
    : generative_state === 'flourishing'
      ? `reality is becoming different because the brand existed beautifully inside it (coherence ${civilization_coherence_score}/10)`
      : generative_state === 'present'
        ? 'the brand is present but its presence is not yet generatively shaping reality'
        : 'the brand\'s generative presence is too thin to change the world';

  notes.push(`civilization coherence runtime: ${generative_state} (${civilization_coherence_score}/10) — ${runtime_statement}`);
  return {
    generative_state, changed_reality_beautifully, damaged_reality_by_forcing,
    civilization_coherence_score, what_the_world_received, runtime_statement, notes,
  };
}
