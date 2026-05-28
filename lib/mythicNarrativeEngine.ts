/**
 * MYTHIC NARRATIVE ENGINE (pure, observational)
 *
 * Detects when ordinary scenes become mythic. Not fantasy. Human myth:
 * grandfather on a bench · parent watching child sleep · old kitchen
 * light · first coffee after exhaustion · quiet return home · child
 * growing older · empty chair · hand on shoulder · last look before
 * leaving.
 *
 * Tracks eleven archetypes: return · loss · becoming · protection ·
 * waiting · passingTime · care · endurance · forgiveness · home ·
 * memory.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never recommends archetypes
 *   - never names a "winning" archetype
 *   - allowed phrasing: "historically associated", "observed alongside",
 *     "may carry memory weight", "remembrance-oriented"
 */

// ─── loose structural subsets ────────────────────────────────

export interface MythicOutcomeSubset {
  outcomes?: Array<{
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    metrics?: {
      retention?: number; saves?: number; rewatches?: number;
    };
  }>;
}

export interface MythicNarrativeInput {
  outcomes?: MythicOutcomeSubset | null;
}

// ─── archetypes ──────────────────────────────────────────────

type Archetype =
  | 'return' | 'loss' | 'becoming' | 'protection' | 'waiting'
  | 'passingTime' | 'care' | 'endurance' | 'forgiveness'
  | 'home' | 'memory';

const ARCHETYPE_PATTERNS: Record<Archetype, RegExp> = {
  return:      /return|come home|back to|came back|homecoming|wave when arriv/,
  loss:        /loss|gone|empty chair|missing|funeral|goodbye|last look|leaving/,
  becoming:    /becoming|growing|grew up|first day|first step|graduat|coming of/,
  protection:  /protect|hold|shield|over the child|hand on shoulder|cover|guard/,
  waiting:     /waiting|wait by|window|porch|kettle|listening for|expecting/,
  passingTime: /passing time|years|long ago|grew older|child grew|grandparent|generation/,
  care:        /care|tender|gentle|nurse|tend|feed|wrap|hold close/,
  endurance:   /endur|carry on|long day|tired|after work|still standing|persever/,
  forgiveness: /forgiv|let go|peace|reconcil|amends|sorry|truce|making up/,
  home:        /home|kitchen|bench|porch|garden|hearth|table|threshold/,
  memory:      /memory|remember|never forget|carry with me|holds onto|kept|stored/,
};

// ─── output ───────────────────────────────────────────────────

export interface ArchetypePresence {
  /** 0..10 — share of outcomes carrying this archetype. */
  presence: number;
  /** 0..10 — engagement signature on outcomes that carried it. */
  engagementSignature: number;
  /** 0..10 — composite mythic weight. */
  mythicWeight: number;
  note: string;
}

export interface MythicNarrativeReading {
  totalObservations: number;
  archetypes: Record<Archetype, ArchetypePresence>;
  dominantArchetypes: string[];
  /** 0..10 — composite mythic narrative weight. */
  overallMythicWeight: number;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system observes when ordinary scenes carry mythic weight. ' +
  'It does not recommend archetypes.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<MythicOutcomeSubset['outcomes']>[number];

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

export function computeMythicNarrative(input: MythicNarrativeInput): MythicNarrativeReading {
  const outcomes = input.outcomes?.outcomes ?? [];

  const archetypes: Record<Archetype, ArchetypePresence> = {} as Record<Archetype, ArchetypePresence>;
  const reasonCodes: string[] = [`outcomes:${outcomes.length}`];

  (Object.keys(ARCHETYPE_PATTERNS) as Archetype[]).forEach((key) => {
    const re = ARCHETYPE_PATTERNS[key];
    const matching = outcomes.filter((o) => re.test(hayOf(o)));
    const presence = outcomes.length === 0 ? 0 :
      clamp10(matching.length / outcomes.length * 10);
    const engagementSignature = matching.length === 0 ? 0 :
      clamp10(avg(matching.map(engagementOf)));
    const mythicWeight = clamp10(presence * 0.4 + engagementSignature * 0.6);
    archetypes[key] = {
      presence: r1(presence),
      engagementSignature: r1(engagementSignature),
      mythicWeight: r1(mythicWeight),
      note: mythicWeight >= 5
        ? `${key} archetype observed alongside engagement — may carry memory weight`
        : presence > 0
        ? `${key} archetype observed in window — requires more evidence`
        : `${key} archetype not observed in window`,
    };
    reasonCodes.push(`${key}:${mythicWeight}`);
  });

  const dominantArchetypes = Object.entries(archetypes)
    .map(([k, v]) => [k, v.mythicWeight] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const overallMythicWeight = r1(clamp10(
    avg(Object.values(archetypes).map((a) => a.mythicWeight)),
  ));

  const notes: string[] = [];
  const anyHigh = Object.values(archetypes).some((a) => a.mythicWeight >= 6);
  if (anyHigh) {
    notes.push('one or more archetypes observed alongside elevated engagement — historically associated with mythic resonance');
  } else {
    notes.push('archetype signatures appear muted in this window — requires more evidence');
  }

  return {
    totalObservations: outcomes.length,
    archetypes,
    dominantArchetypes,
    overallMythicWeight,
    notes,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
