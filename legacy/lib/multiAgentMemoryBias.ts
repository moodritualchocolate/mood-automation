/**
 * MULTI-AGENT MEMORY BIAS (Phase 45 — Wave 5: Autonomous Strategic Society)
 *
 * Each council entity carries a MEMORY BIAS — a track record that
 * shapes how much weight its conviction earns. An entity that has
 * been repeatedly vindicated argues with more authority; one that has
 * been repeatedly overruled argues with less. The agents' personalities
 * evolve over time.
 *
 * This module owns the persistent reputation book
 * (data/runtime/council-reputation.json) that Phase 53's reputation
 * system updates.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CouncilEntityId, EntityOpinion } from './councilTypes';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'council-reputation.json';

const ALL_ENTITIES: CouncilEntityId[] = [
  'strategist', 'identity-guardian', 'cultural-analyst', 'audience-interpreter',
  'emotional-historian', 'attention-physicist', 'recovery-director',
  'anti-hype-defender', 'world-state-observer', 'narrative-architect',
  'executive-synthesizer',
];

export interface EntityReputation {
  entity: CouncilEntityId;
  sessionsParticipated: number;
  timesAligned: number;
  timesOpposed: number;
  /** 0.5..1.5 — conviction multiplier; evolves with the track record. */
  conviction_weight: number;
  /** A short label of how the entity's personality has drifted. */
  personality: string;
}

export interface CouncilReputationBook {
  entities: Record<string, EntityReputation>;
  updatedAt: number;
}

function freshReputation(entity: CouncilEntityId): EntityReputation {
  return {
    entity, sessionsParticipated: 0, timesAligned: 0, timesOpposed: 0,
    conviction_weight: 1, personality: 'unproven',
  };
}

function emptyBook(): CouncilReputationBook {
  const entities: Record<string, EntityReputation> = {};
  for (const e of ALL_ENTITIES) entities[e] = freshReputation(e);
  return { entities, updatedAt: Date.now() };
}

const g = globalThis as unknown as { __moodCouncilReputation?: CouncilReputationBook };

export interface CouncilReputationStore {
  read(): Promise<CouncilReputationBook>;
  save(book: CouncilReputationBook): Promise<void>;
  reset(): Promise<void>;
}

export function createCouncilReputationStore(
  dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR,
): CouncilReputationStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodCouncilReputation) return g.__moodCouncilReputation;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as CouncilReputationBook;
        // Defensive — backfill any missing entity.
        for (const e of ALL_ENTITIES) {
          if (!parsed.entities[e]) parsed.entities[e] = freshReputation(e);
        }
        g.__moodCouncilReputation = parsed;
      } catch {
        g.__moodCouncilReputation = emptyBook();
      }
      return g.__moodCouncilReputation;
    },
    async save(book) {
      book.updatedAt = Date.now();
      g.__moodCouncilReputation = book;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(book, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCouncilReputation = undefined;
    },
  };
}

export interface MemoryBiasReading {
  /** The opinions, with conviction re-weighted by each entity's reputation. */
  biased_opinions: EntityOpinion[];
  /** Entities currently arguing with above-baseline authority. */
  trusted_voices: CouncilEntityId[];
  /** Entities currently arguing with diminished authority. */
  diminished_voices: CouncilEntityId[];
  notes: string[];
}

/**
 * Apply each entity's memory bias to its raw opinion — a well-proven
 * entity's conviction carries further; an over-ruled one's carries
 * less.
 */
export function applyMemoryBias(opinions: EntityOpinion[], book: CouncilReputationBook): MemoryBiasReading {
  const notes: string[] = [];
  const trusted_voices: CouncilEntityId[] = [];
  const diminished_voices: CouncilEntityId[] = [];

  const biased_opinions = opinions.map((o) => {
    const rep = book.entities[o.entity] ?? freshReputation(o.entity);
    const weighted = Math.max(0, Math.min(10, o.conviction * rep.conviction_weight));
    if (rep.conviction_weight >= 1.15) trusted_voices.push(o.entity);
    if (rep.conviction_weight <= 0.85) diminished_voices.push(o.entity);
    return { ...o, conviction: Math.round(weighted * 10) / 10 };
  });

  notes.push(`multi-agent memory bias applied — ${trusted_voices.length} trusted, ${diminished_voices.length} diminished`);
  return { biased_opinions, trusted_voices, diminished_voices, notes };
}
