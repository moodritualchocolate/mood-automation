/**
 * MEMORY ANCHOR ENGINE (pure, observational)
 *
 * Proposes candidate emotional MEMORY ANCHORS — kitchen light, quiet
 * sofa, half-empty coffee cup, child's shoes near the door, phone
 * face down, old table, sunset on wall, open window, folded blanket,
 * silent hallway, hand touching product, slow breath, unfinished
 * work, warm lamp, familiar room.
 *
 * These are not props. They are emotional memory anchors.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a "best" anchor
 *   - never names a "winner"
 *   - allowed phrasing only
 */

// ─── input ────────────────────────────────────────────────────

export interface AnchorInputWorld {
  ritualHunger?: number;
  nostalgiaPressure?: number;
  lonelinessSignals?: number;
  emotionalExhaustion?: number;
  simplicityCraving?: number;
  meaningSeeking?: number;
}

export interface AnchorInputImprint {
  imprintStrength?: number;
  scenePermanence?: number;
  /** ritual persistence map (0..10). */
  ritualPersistence?: Record<string, number>;
  /** mythic archetype weights (0..10). */
  mythicWeights?: Record<string, number>;
}

export interface AnchorInputPresence {
  stillnessWeight?: number;
  presenceScore?: number;
}

export interface MemoryAnchorInput {
  world?: AnchorInputWorld | null;
  imprint?: AnchorInputImprint | null;
  presence?: AnchorInputPresence | null;
}

// ─── output ───────────────────────────────────────────────────

export interface MemoryAnchor {
  anchorId: string;
  description: string;
  /** 0..10 alignment with observed window. */
  alignment: number;
  observation: string;
  reasonCodes: string[];
}

export interface MemoryAnchorReading {
  anchors: MemoryAnchor[];
  dominantAnchors: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Memory anchors are exploratory structures only. ' +
  'The operator remains the creative authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 0): number { return v ?? d; }

interface AnchorSpec {
  anchorId: string;
  description: string;
  score: (w: AnchorInputWorld, mi: AnchorInputImprint, pr: AnchorInputPresence) => number;
}

const ANCHOR_SPECS: AnchorSpec[] = [
  {
    anchorId: 'kitchen-light',
    description: 'kitchen light',
    score: (w, mi) => Math.max(get(mi.ritualPersistence?.morning), get(mi.ritualPersistence?.food)) * 0.7 + get(w.simplicityCraving, 5) * 0.3,
  },
  {
    anchorId: 'quiet-sofa',
    description: 'quiet sofa',
    score: (w, _mi, pr) => get(pr.stillnessWeight) * 0.6 + get(w.emotionalExhaustion) * 0.4,
  },
  {
    anchorId: 'half-empty-coffee-cup',
    description: 'half-empty coffee cup',
    score: (_w, mi) => get(mi.ritualPersistence?.coffee) * 0.7 + get(mi.ritualPersistence?.morning) * 0.3,
  },
  {
    anchorId: 'childs-shoes-near-door',
    description: "child's shoes near the door",
    score: (_w, mi) => get(mi.ritualPersistence?.parentChild) * 0.5 + get(mi.mythicWeights?.care) * 0.5,
  },
  {
    anchorId: 'phone-face-down',
    description: 'phone face down',
    score: (w) => get(w.simplicityCraving, 5) * 0.5 + get(w.emotionalExhaustion) * 0.5,
  },
  {
    anchorId: 'old-table',
    description: 'old table',
    score: (w, mi) => get(w.nostalgiaPressure) * 0.5 + get(mi.mythicWeights?.home) * 0.5,
  },
  {
    anchorId: 'sunset-on-wall',
    description: 'sunset on wall',
    score: (_w, _mi, pr) => get(pr.stillnessWeight) * 0.6 + get(pr.presenceScore) * 0.4,
  },
  {
    anchorId: 'open-window',
    description: 'open window',
    score: (w, mi) => get(w.simplicityCraving, 5) * 0.4 + get(mi.mythicWeights?.waiting) * 0.6,
  },
  {
    anchorId: 'folded-blanket',
    description: 'folded blanket',
    score: (_w, mi) => get(mi.mythicWeights?.care) * 0.6 + get(mi.ritualPersistence?.night) * 0.4,
  },
  {
    anchorId: 'silent-hallway',
    description: 'silent hallway',
    score: (_w, mi, pr) => get(pr.stillnessWeight) * 0.5 + get(mi.mythicWeights?.loss) * 0.5,
  },
  {
    anchorId: 'hand-touching-product',
    description: 'hand touching product',
    score: (_w, _mi, pr) => get(pr.presenceScore) * 0.7 + get(pr.stillnessWeight) * 0.3,
  },
  {
    anchorId: 'slow-breath',
    description: 'slow breath',
    score: (_w, _mi, pr) => get(pr.stillnessWeight) * 0.6 + get(pr.presenceScore) * 0.4,
  },
  {
    anchorId: 'unfinished-work',
    description: 'unfinished work',
    score: (w, mi) => get(w.emotionalExhaustion) * 0.6 + get(mi.ritualPersistence?.workRecovery) * 0.4,
  },
  {
    anchorId: 'warm-lamp',
    description: 'warm lamp',
    score: (_w, mi) => get(mi.ritualPersistence?.night) * 0.5 + get(mi.mythicWeights?.home) * 0.5,
  },
  {
    anchorId: 'familiar-room',
    description: 'familiar room',
    score: (w, mi) => get(w.nostalgiaPressure) * 0.4 + get(mi.mythicWeights?.home) * 0.6,
  },
];

// ─── main ─────────────────────────────────────────────────────

export function computeMemoryAnchors(input: MemoryAnchorInput): MemoryAnchorReading {
  const w = input.world ?? {};
  const mi = input.imprint ?? {};
  const pr = input.presence ?? {};

  const anchors: MemoryAnchor[] = ANCHOR_SPECS.map((spec) => {
    const alignment = r1(clamp10(spec.score(w, mi, pr)));
    return {
      anchorId: spec.anchorId,
      description: spec.description,
      alignment,
      observation: alignment >= 6
        ? `${spec.description} may carry emotional weight in observed window — historically associated with remembrance-oriented moments`
        : alignment > 0
        ? `${spec.description} observed alongside the outputs — requires more evidence`
        : `${spec.description} not observed in current window`,
      reasonCodes: [`alignment:${alignment}`],
    };
  });

  const dominantAnchors = anchors.slice()
    .sort((a, b) => b.alignment - a.alignment || a.anchorId.localeCompare(b.anchorId))
    .slice(0, 5)
    .map((a) => a.anchorId);

  const notes: string[] = [];
  const anyHigh = anchors.some((a) => a.alignment >= 6);
  if (anyHigh) {
    notes.push('one or more memory anchors may carry emotional weight in this window');
  } else {
    notes.push('memory anchors appear muted in this window — requires more evidence');
  }

  return {
    anchors,
    dominantAnchors,
    notes,
    reasonCodes: [
      `dominant:${dominantAnchors.join('|')}`,
      ...anchors.map((a) => `${a.anchorId}:${a.alignment}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
