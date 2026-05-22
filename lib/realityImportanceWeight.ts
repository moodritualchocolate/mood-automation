/**
 * REALITY IMPORTANCE WEIGHT (Phase 36 — Strategic Priority Engine / Wave 4)
 *
 * Distinguishes the four kinds of "important" the system must never
 * confuse: emotionally important, strategically important,
 * algorithmically tempting, and identity-dangerous.
 */

export type ImportanceKind =
  | 'emotionally-important'
  | 'strategically-important'
  | 'algorithmically-tempting'
  | 'identity-dangerous';

export interface RealityImportanceReading {
  /** The dominant kind of importance this candidate carries. */
  dominant_kind: ImportanceKind;
  /** 0..10 weight per kind. */
  emotionally_important: number;
  strategically_important: number;
  algorithmically_tempting: number;
  identity_dangerous: number;
  /** True when the candidate is tempting but not actually important. */
  is_a_temptation: boolean;
  notes: string[];
}

export interface RealityImportanceInput {
  truthValue: number;          // 0..10
  resonance: number;           // 0..10
  longTermEquity: number;      // 0..10
  engagementPull: number;      // 0..10 — algorithmic temptation
  identityRisk: number;        // 0..10
}

export function weightRealityImportance(input: RealityImportanceInput): RealityImportanceReading {
  const { truthValue, resonance, longTermEquity, engagementPull, identityRisk } = input;
  const notes: string[] = [];

  const emotionally_important = round1((truthValue + resonance) / 2);
  const strategically_important = round1((longTermEquity + truthValue * 0.5) / 1.5);
  const algorithmically_tempting = round1(engagementPull);
  const identity_dangerous = round1(identityRisk);

  const ranked: Array<[ImportanceKind, number]> = [
    ['emotionally-important', emotionally_important],
    ['strategically-important', strategically_important],
    ['algorithmically-tempting', algorithmically_tempting],
    ['identity-dangerous', identity_dangerous],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  const dominant_kind = ranked[0][0];

  // A temptation: algorithmically tempting OUTRANKS both emotional and
  // strategic importance — the pull is real but the importance is not.
  const is_a_temptation =
    algorithmically_tempting > emotionally_important &&
    algorithmically_tempting > strategically_important;

  notes.push(`reality importance: dominant kind "${dominant_kind}"`);
  if (is_a_temptation) notes.push('reality importance: this is an ALGORITHMIC TEMPTATION, not an importance — the pull is real, the value is not');
  if (dominant_kind === 'identity-dangerous') notes.push('reality importance: this candidate is identity-dangerous — its "importance" is a risk');

  return {
    dominant_kind, emotionally_important, strategically_important,
    algorithmically_tempting, identity_dangerous, is_a_temptation, notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
