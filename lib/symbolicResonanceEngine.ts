/**
 * SYMBOLIC RESONANCE ENGINE (pure, observational)
 *
 * Detects recurring SYMBOLS in creative fingerprints and measures
 * their emotional resonance against outcome metrics. Pure function.
 *
 * STRICT CONTRACT:
 *   - no I/O · no critic / pipeline imports
 *   - never used for tribal segmentation or exploitation
 *   - the engine observes which symbols ENGAGED audiences, never
 *     which audiences "are" what
 */

import type { CulturalInput } from './culturalMemoryEngine';

// ─── symbol taxonomy ──────────────────────────────────────────

interface SymbolDefinition {
  key: string;
  patterns: RegExp;
}

const SYMBOLS: SymbolDefinition[] = [
  { key: 'kitchens',           patterns: /kitchen|stove|counter|cooking/i },
  { key: 'family-tables',      patterns: /table|dinner|family-meal|family-table/i },
  { key: 'sunsets',            patterns: /sunset|dusk|golden-hour|twilight/i },
  { key: 'empty-streets',      patterns: /empty-street|deserted|alley|quiet-road/i },
  { key: 'military-imagery',   patterns: /military|uniform|service|veteran/i },
  { key: 'childhood-memory',   patterns: /childhood|kid|young|grew-up|growing-up/i },
  { key: 'parents',            patterns: /parents|mother|father|mom|dad/i },
  { key: 'loneliness',         patterns: /lonel|alone|solitude|isolation/i },
  { key: 'rituals',            patterns: /ritual|routine|practice|ceremony/i },
  { key: 'food',               patterns: /food|meal|cooking|drink|coffee|tea/i },
  { key: 'silence',            patterns: /silen|still|wordless|unspoken|pause/i },
  { key: 'touch',              patterns: /touch|hand|warmth|contact/i },
  { key: 'old-objects',        patterns: /old|vintage|worn|aged|patina/i },
  { key: 'waiting',            patterns: /wait|pause|delay|linger/i },
  { key: 'music-atmosphere',   patterns: /music|ambient|soundscape|melody/i },
  { key: 'small-imperfections',patterns: /imperfect|small|crooked|minor-flaw|natural-flaw/i },
  { key: 'realism',            patterns: /realism|documentary|observed|verite/i },
  { key: 'documentary-feeling',patterns: /documentary|observed|verite|natural/i },
];

// ─── output ───────────────────────────────────────────────────

export interface SymbolResonance {
  symbol: string;
  occurrences: number;
  averageEngagement: number;       // 0..10
  dominantOutcome: string | null;
  trustFormationCount: number;
  segmentsTouched: number;
  /** 0..10 — composite resonance. */
  resonance: number;
  description: string;
}

export interface SymbolicResonanceReading {
  totalOutcomes: number;
  symbols: SymbolResonance[];
  highResonanceSymbols: SymbolResonance[];
  underusedSymbols: string[];      // declared symbols never observed
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — symbolic resonance describes engagement, not human identity. ' +
  'The engine never uses symbols to segment, polarize, or exploit.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function engagementScore(m: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; scrollDepth?: number } | undefined): number {
  if (!m) return 0;
  const saves = Math.min(1, (m.saves ?? 0) / 10);
  const comments = Math.min(1, (m.comments ?? 0) / 20);
  const shares = Math.min(1, (m.shares ?? 0) / 10);
  const retention = m.retention ?? 0;
  const scrollDepth = m.scrollDepth ?? 0;
  const bouncePenalty = 1 - (m.bounceRate ?? 0);
  return clamp10((retention * 0.40 + scrollDepth * 0.15 + saves * 0.15 +
    comments * 0.10 + shares * 0.10 + bouncePenalty * 0.10) * 10);
}

// ─── main ─────────────────────────────────────────────────────

export function computeSymbolicResonance(input: CulturalInput): SymbolicResonanceReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const symbols: SymbolResonance[] = [];

  for (const def of SYMBOLS) {
    const matching = outcomes.filter((r) => {
      const haystack = (
        (r.emotionalSignature ?? '') + ' ' +
        (r.narrativeSignature ?? '') + ' ' +
        (r.visualStyle ?? '')
      );
      return def.patterns.test(haystack);
    });
    if (matching.length === 0) continue;
    const engagement = r1(avg(matching.map((r) => engagementScore(r.metrics))));
    const outcomeCounts = new Map<string, number>();
    for (const r of matching) {
      const k = r.downstreamOutcome ?? 'unlabeled';
      outcomeCounts.set(k, (outcomeCounts.get(k) ?? 0) + 1);
    }
    let dominantOutcome: string | null = null;
    let dominantCount = -1;
    for (const [k, v] of outcomeCounts) {
      if (v > dominantCount || (v === dominantCount && dominantOutcome !== null && k.localeCompare(dominantOutcome) < 0)) {
        dominantOutcome = k; dominantCount = v;
      }
    }
    const trustFormationCount = matching.filter((r) => r.downstreamOutcome === 'trust-formation').length;
    const segments = new Set(matching.map((r) => r.audienceSegment ?? 'unspecified'));
    const segmentsTouched = segments.size;
    const resonance = r1(clamp10(
      engagement * 0.6 +
      Math.min(10, matching.length) * 0.2 +
      (trustFormationCount / matching.length) * 10 * 0.2,
    ));
    symbols.push({
      symbol: def.key,
      occurrences: matching.length,
      averageEngagement: engagement,
      dominantOutcome,
      trustFormationCount,
      segmentsTouched,
      resonance,
      description:
        `"${def.key}" — ${matching.length} record(s) across ${segmentsTouched} segment(s), ` +
        `engagement ${engagement}/10, trust formation ${trustFormationCount}.`,
    });
  }
  symbols.sort((a, b) =>
    b.resonance - a.resonance ||
    b.occurrences - a.occurrences ||
    a.symbol.localeCompare(b.symbol),
  );

  const highResonanceSymbols = symbols.filter((s) => s.resonance >= 6).slice(0, 8);
  const presentKeys = new Set(symbols.map((s) => s.symbol));
  const underusedSymbols = SYMBOLS.filter((s) => !presentKeys.has(s.key)).map((s) => s.key);

  return {
    totalOutcomes: outcomes.length,
    symbols,
    highResonanceSymbols,
    underusedSymbols,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `symbols-detected:${symbols.length}`,
      `high-resonance:${highResonanceSymbols.length}`,
      `underused:${underusedSymbols.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
