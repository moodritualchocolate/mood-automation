/**
 * KNOWLEDGE ENGINE (pure, observational)
 *
 * Phase 4 — Operations Layer.
 *
 * Pure retrieval / search over knowledge entries. The engine never
 * auto-creates entries, never auto-edits them, and never derives
 * "best practice" claims.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the engine never names a winner / best entry
 *   - allowed phrasing: "historically observed", "operator-curated"
 *   - forbidden: predict, best, winner, recommended, selected, chosen,
 *     optimal, auto-apply
 */

import type { KnowledgeEntry, KnowledgeCategory } from './knowledgeMemory';

// ─── input ────────────────────────────────────────────────────

export interface KnowledgeEngineInput {
  entries?: KnowledgeEntry[];
  /** Optional search query (operator-provided text). */
  query?: string;
  /** Optional category filter. */
  categoryFilter?: KnowledgeCategory | null;
}

// ─── output ───────────────────────────────────────────────────

export interface KnowledgeMatch {
  entry: KnowledgeEntry;
  /** Coarse relevance score 0..10 (descriptive only). */
  matchScore: number;
  /** Matched tokens for transparency. */
  matchedTokens: string[];
  observation: string;
}

export interface KnowledgeEngineReading {
  totalEntries: number;
  categoryCounts: Record<KnowledgeCategory, number>;
  /** Top matches if `query` was provided, else recent entries. */
  matches: KnowledgeMatch[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Knowledge engine is a retrieval helper only. The engine never auto-creates ' +
  'entries, never names a best practice. Operator approval required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function r1(n: number): number { return Math.round(n * 10) / 10; }

function tokenizeQuery(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter((s) => s.length >= 2);
}

function scoreEntry(entry: KnowledgeEntry, tokens: string[]): { score: number; matched: string[] } {
  if (tokens.length === 0) return { score: 0, matched: [] };
  const hay = `${entry.title} ${entry.body} ${entry.tags.join(' ')}`.toLowerCase();
  const matched: string[] = [];
  for (const t of tokens) if (hay.includes(t)) matched.push(t);
  return { score: matched.length / tokens.length * 10, matched };
}

// ─── main ─────────────────────────────────────────────────────

export function searchKnowledge(input: KnowledgeEngineInput): KnowledgeEngineReading {
  const entries = input.entries ?? [];
  const tokens = input.query ? tokenizeQuery(input.query) : [];
  const filtered = input.categoryFilter
    ? entries.filter((e) => e.category === input.categoryFilter)
    : entries;

  const categoryCounts: Record<KnowledgeCategory, number> = {
    'brand-rule': 0, 'product-rule': 0, 'visual-rule': 0,
    'audience-rule': 0, 'formula-rule': 0, 'campaign-history': 0,
  };
  for (const e of entries) categoryCounts[e.category] += 1;

  const scored: KnowledgeMatch[] = filtered.map((entry) => {
    const { score, matched } = tokens.length > 0
      ? scoreEntry(entry, tokens)
      : { score: 0, matched: [] };
    return {
      entry, matchScore: r1(score), matchedTokens: matched,
      observation: tokens.length === 0
        ? `${entry.category} · operator-curated entry · historically observed in workspace`
        : score >= 5
        ? `${entry.category} · historically observed with ${matched.join(', ')}`
        : `${entry.category} · observed alongside ${matched.length} token(s)`,
    };
  });
  // If query is empty, surface most recent N entries.
  if (tokens.length === 0) {
    scored.sort((a, b) => b.entry.createdAt - a.entry.createdAt || a.entry.title.localeCompare(b.entry.title));
  } else {
    scored.sort((a, b) =>
      b.matchScore - a.matchScore ||
      b.entry.createdAt - a.entry.createdAt ||
      a.entry.title.localeCompare(b.entry.title));
  }

  const notes: string[] = [];
  if (entries.length === 0) {
    notes.push('no knowledge entries yet — operator may add entries · operator approval required');
  }
  if (tokens.length > 0 && scored.filter((m) => m.matchScore > 0).length === 0) {
    notes.push('no entries matched the query — requires more evidence');
  }

  return {
    totalEntries: entries.length,
    categoryCounts,
    matches: scored.slice(0, 32),
    notes,
    reasonCodes: [
      `entries:${entries.length}`,
      `tokens:${tokens.length}`,
      `category:${input.categoryFilter ?? 'all'}`,
      `matches:${scored.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
