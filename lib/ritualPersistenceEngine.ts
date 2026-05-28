/**
 * RITUAL PERSISTENCE ENGINE (pure, observational)
 *
 * Observes which repeated human rituals appear alongside memory.
 * Track twelve ritual categories. Per category, returns the share
 * of observed outcomes referencing the ritual, plus a persistence
 * signature combining presence + engagement retention + saves.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never recommends rituals
 *   - never names a "winning" ritual
 *   - allowed phrasing: "historically associated", "observed alongside",
 *     "may carry memory weight", "remembrance-oriented"
 */

// ─── loose structural subsets ────────────────────────────────

export interface RitualOutcomeSubset {
  outcomes?: Array<{
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    metrics?: {
      retention?: number; saves?: number; rewatches?: number; shares?: number;
    };
  }>;
}

export interface RitualPersistenceInput {
  outcomes?: RitualOutcomeSubset | null;
}

// ─── ritual categories ───────────────────────────────────────

type RitualKey =
  | 'morning' | 'night' | 'family' | 'food' | 'coffee' | 'workRecovery'
  | 'parentChild' | 'study' | 'loneliness' | 'silence' | 'seasonal' | 'goodbye';

const RITUAL_PATTERNS: Record<RitualKey, RegExp> = {
  morning:       /morning|sunrise|wake|dawn|early|first light|sunlight on/,
  night:         /night|bedtime|moonlight|dark|sleep|evening|lullaby/,
  family:        /family|dinner|gather|sunday|holiday|table|share/,
  food:          /food|meal|cook|bake|kitchen|recipe|table|bread|soup/,
  coffee:        /coffee|tea|cup|morning brew|kettle|mug|espresso/,
  workRecovery:  /after work|long day|recovery|tired|exhaust|home from|after shift/,
  parentChild:   /parent|child|son|daughter|baby|toddler|teen|teach|raise|grow/,
  study:         /study|reading|book|library|desk|notebook|writing|journal/,
  loneliness:    /lonely|alone|solitude|empty|quiet hour|silence|isolat/,
  silence:       /silence|still|quiet|hush|pause|breath/,
  seasonal:      /season|autumn|winter|spring|summer|holiday|snow|leaves|rain/,
  goodbye:       /goodbye|last|leaving|departure|farewell|wave|see you/,
};

// ─── output ───────────────────────────────────────────────────

export interface RitualSignature {
  /** 0..10 — share of outcomes referencing this ritual. */
  presence: number;
  /** 0..10 — engagement signature on outcomes that referenced it. */
  engagementSignature: number;
  /** 0..10 — composite persistence. */
  persistence: number;
  note: string;
}

export interface RitualPersistenceReading {
  totalObservations: number;
  rituals: Record<RitualKey, RitualSignature>;
  dominantRituals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system observes which rituals appear alongside memory. ' +
  'It does not recommend rituals.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<RitualOutcomeSubset['outcomes']>[number];

function engagementOf(o: Out): number {
  return (o.metrics?.retention ?? 0) * 5 +
    Math.min(1, (o.metrics?.saves ?? 0) / 5) * 3 +
    Math.min(1, (o.metrics?.rewatches ?? 0) / 3) * 2;
}

function hayOf(o: Out): string {
  return ((o.emotionalSignature ?? '') + ' ' +
          (o.narrativeSignature ?? '') + ' ' +
          (o.visualStyle ?? '')).toLowerCase();
}

// ─── main ─────────────────────────────────────────────────────

export function computeRitualPersistence(input: RitualPersistenceInput): RitualPersistenceReading {
  const outcomes = input.outcomes?.outcomes ?? [];

  const rituals: Record<RitualKey, RitualSignature> = {} as Record<RitualKey, RitualSignature>;
  const reasonCodes: string[] = [`outcomes:${outcomes.length}`];

  // Build per-ritual signature.
  (Object.keys(RITUAL_PATTERNS) as RitualKey[]).forEach((key) => {
    const re = RITUAL_PATTERNS[key];
    const matching = outcomes.filter((o) => re.test(hayOf(o)));
    const presence = outcomes.length === 0 ? 0 :
      clamp10(matching.length / outcomes.length * 10);
    const engagementSignature = matching.length === 0 ? 0 :
      clamp10(avg(matching.map(engagementOf)));
    const persistence = clamp10(presence * 0.4 + engagementSignature * 0.6);
    rituals[key] = {
      presence: r1(presence),
      engagementSignature: r1(engagementSignature),
      persistence: r1(persistence),
      note: persistence >= 5
        ? `${key} ritual observed alongside engagement — may carry memory weight`
        : presence > 0
        ? `${key} ritual observed in window — requires more evidence`
        : `${key} ritual not observed in window`,
    };
    reasonCodes.push(`${key}:${persistence}`);
  });

  // Dominant rituals — top 3 by persistence.
  const dominantRituals = Object.entries(rituals)
    .map(([k, v]) => [k, v.persistence] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  const anyHigh = (Object.values(rituals)).some((r) => r.persistence >= 6);
  if (anyHigh) {
    notes.push('one or more rituals observed alongside elevated engagement — historically associated with remembrance');
  } else {
    notes.push('ritual signatures appear muted in this window — requires more evidence');
  }

  return {
    totalObservations: outcomes.length,
    rituals,
    dominantRituals,
    notes,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
