/**
 * ANTI-FRAGILITY FUTURE ARCHITECTURE (Phase 160 — Wave 11: Strategic Future Intelligence)
 *
 * A plan can be robust and still be fragile — strong until the one
 * shock it never modelled. This module reads whether the organism's
 * future is anti-fragile: whether disorder would strengthen it or
 * break it.
 */

export interface AntiFragilityReading {
  /** 0..10 — how anti-fragile the organism's future is. */
  antifragility: number;
  /** True when the future is fragile to a shock. */
  is_fragile: boolean;
  fragility_source: string;
  notes: string[];
}

export interface AntiFragilityInput {
  /** 0..10 — desirability of the worst-case scenario. */
  worstCaseDesirability: number;
  /** 0..10 — accumulated compounding advantage (a buffer). */
  compoundingAdvantage: number;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
  /** True when identity would survive the long horizon. */
  identitySurvives: boolean;
}

export function readAntiFragility(input: AntiFragilityInput): AntiFragilityReading {
  const { worstCaseDesirability, compoundingAdvantage, strategicDebt, identitySurvives } = input;
  const notes: string[] = [];

  let antifragility = 0;
  antifragility += worstCaseDesirability * 0.4;       // a survivable worst case
  antifragility += compoundingAdvantage * 0.35;        // a buffer to absorb shocks
  antifragility += identitySurvives ? 2 : 0;
  antifragility -= strategicDebt * 0.3;
  antifragility = round1(Math.max(0, Math.min(10, antifragility)));

  const is_fragile = antifragility < 4 || worstCaseDesirability <= 2;

  const fragility_source = !is_fragile
    ? 'the future is anti-fragile — a shock would be absorbed, even used'
    : worstCaseDesirability <= 2
      ? 'the worst case is ruinous — there is no buffer if it arrives'
      : strategicDebt >= 6
        ? 'strategic debt has made the future brittle — a shock would crack it'
        : 'the future has no buffer — it is robust only until the first unmodelled shock';

  notes.push(`anti-fragility future architecture: ${antifragility}/10 — ${fragility_source}`);
  return { antifragility, is_fragile, fragility_source, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
