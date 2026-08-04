/**
 * LONG-TERM VS SHORT-TERM (Phase 36 — Strategic Priority Engine / Wave 4)
 *
 * Weighs short-term engagement against long-term brand equity. The
 * system is allowed — and often required — to sacrifice short-term
 * engagement for long-term identity and trust.
 */

export interface LongTermVsShortTermReading {
  /** 0..10 — projected long-term brand equity. */
  long_term_equity: number;
  /** 0..10 — projected short-term engagement. */
  short_term_engagement: number;
  /** True when the two are in conflict. */
  in_conflict: boolean;
  /** The recommended choice when they conflict. */
  recommendation: 'favour-long-term' | 'favour-short-term' | 'no-conflict';
  notes: string[];
}

export interface LongTermVsShortTermInput {
  truthValue: number;          // 0..10 — drives long-term equity
  resonance: number;           // 0..10 — drives long-term equity
  identityRisk: number;        // 0..10 — erodes long-term equity
  engagementPull: number;      // 0..10 — short-term engagement
  engagementDepth: number;     // 0..10 — depth of that engagement
}

export function readLongTermVsShortTerm(input: LongTermVsShortTermInput): LongTermVsShortTermReading {
  const { truthValue, resonance, identityRisk, engagementPull, engagementDepth } = input;
  const notes: string[] = [];

  const long_term_equity = round1(clamp10(truthValue * 0.5 + resonance * 0.4 - identityRisk * 0.4 + 2));
  const short_term_engagement = round1(clamp10(engagementPull * 0.7 + engagementDepth * 0.3));

  const in_conflict = Math.abs(long_term_equity - short_term_engagement) >= 3;

  let recommendation: LongTermVsShortTermReading['recommendation'];
  if (!in_conflict) {
    recommendation = 'no-conflict';
    notes.push('long-term vs short-term: aligned — no sacrifice required');
  } else if (long_term_equity >= short_term_engagement || identityRisk >= 5) {
    recommendation = 'favour-long-term';
    notes.push('long-term vs short-term: in conflict — favour long-term equity; sacrifice the short-term engagement');
  } else {
    // short-term outranks long-term AND identity is safe — but the
    // engine still flags it, because favouring short-term is the
    // dangerous default.
    recommendation = 'favour-short-term';
    notes.push('long-term vs short-term: short-term is stronger and identity is safe — but this is the dangerous default; proceed only with a reason');
  }

  return { long_term_equity, short_term_engagement, in_conflict, recommendation, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
