/**
 * EMOTIONAL ARC ENGINE (pure, observational)
 *
 * Generates candidate emotional arcs grounded in observed world /
 * presence / imprint signals. NO hype, dopamine, fear, or fake-urgency
 * arcs.
 *
 * Examples (allowed arc shapes):
 *   exhaustion → stillness → relief
 *   noise → silence → clarity
 *   pressure → breath → return
 *   disconnection → ritual → reconnection
 *   fatigue → tenderness → continuation
 *   self-loss → small pause → self-return
 *   overwhelm → human presence → groundedness
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a "best" arc
 *   - never names a "winner"
 *   - allowed phrasing only
 *
 * Story blueprints are exploratory structures. The operator remains
 * the creative authority.
 */

// ─── input ────────────────────────────────────────────────────

export interface ArcInputWorld {
  emotionalExhaustion?: number;
  emotionalOverload?: number;
  stimulationSaturation?: number;
  anxietyClimate?: number;
  attentionFragmentation?: number;
  lonelinessSignals?: number;
  ritualHunger?: number;
  meaningSeeking?: number;
  simplicityCraving?: number;
  authenticityDemand?: number;
  emotionalBreathing?: number;
}

export interface ArcInputPresence {
  presenceScore?: number;
  stillnessWeight?: number;
  emotionalBreathing?: number;
}

export interface ArcInputImprint {
  imprintStrength?: number;
  scenePermanence?: number;
}

export interface EmotionalArcInput {
  world?: ArcInputWorld | null;
  presence?: ArcInputPresence | null;
  imprint?: ArcInputImprint | null;
}

// ─── output ───────────────────────────────────────────────────

export interface EmotionalArc {
  arcId: string;
  shape: string;
  /** 0..10 alignment with observed window. */
  alignment: number;
  reasonCodes: string[];
  /** Plain-language observation, allowed-phrasing only. */
  observation: string;
}

export interface EmotionalArcReading {
  arcs: EmotionalArc[];
  dominantArcs: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Emotional arcs are exploratory structures only. ' +
  'The operator remains the creative authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 5): number { return v ?? d; }

interface ArcSpec {
  arcId: string;
  shape: string;
  score: (w: ArcInputWorld, p: ArcInputPresence, mi: ArcInputImprint) => number;
  observation: (alignment: number) => string;
}

const ARC_SPECS: ArcSpec[] = [
  {
    arcId: 'exhaustion-stillness-relief',
    shape: 'exhaustion → stillness → relief',
    score: (w, p) =>
      Math.max(get(w.emotionalExhaustion), get(w.emotionalOverload)) * 0.5 +
      get(p.stillnessWeight) * 0.5,
    observation: (a) => `exhaustion → stillness → relief arc currently appears historically aligned (${a}/10) — may carry emotional weight`,
  },
  {
    arcId: 'noise-silence-clarity',
    shape: 'noise → silence → clarity',
    score: (w, p) =>
      get(w.stimulationSaturation) * 0.4 +
      get(p.stillnessWeight) * 0.4 +
      get(w.simplicityCraving) * 0.2,
    observation: (a) => `noise → silence → clarity arc currently appears historically aligned (${a}/10) — observed alongside stimulation saturation`,
  },
  {
    arcId: 'pressure-breath-return',
    shape: 'pressure → breath → return',
    score: (w, p) =>
      get(w.anxietyClimate) * 0.4 +
      get(p.emotionalBreathing) * 0.4 +
      get(w.attentionFragmentation) * 0.2,
    observation: (a) => `pressure → breath → return arc currently appears historically aligned (${a}/10) — observed alongside anxiety climate`,
  },
  {
    arcId: 'disconnection-ritual-reconnection',
    shape: 'disconnection → ritual → reconnection',
    score: (w) =>
      get(w.lonelinessSignals) * 0.5 +
      get(w.ritualHunger) * 0.5,
    observation: (a) => `disconnection → ritual → reconnection arc currently appears historically aligned (${a}/10) — observed alongside loneliness signals`,
  },
  {
    arcId: 'fatigue-tenderness-continuation',
    shape: 'fatigue → tenderness → continuation',
    score: (w, p) =>
      get(w.emotionalExhaustion) * 0.5 +
      get(p.presenceScore) * 0.5,
    observation: (a) => `fatigue → tenderness → continuation arc currently appears historically aligned (${a}/10) — may carry emotional weight`,
  },
  {
    arcId: 'self-loss-pause-self-return',
    shape: 'self-loss → small pause → self-return',
    score: (w, p) =>
      get(w.meaningSeeking) * 0.4 +
      get(p.stillnessWeight) * 0.3 +
      get(w.lonelinessSignals) * 0.3,
    observation: (a) => `self-loss → small pause → self-return arc currently appears historically aligned (${a}/10) — observed alongside meaning-seeking`,
  },
  {
    arcId: 'overwhelm-presence-groundedness',
    shape: 'overwhelm → human presence → groundedness',
    score: (w, p) =>
      get(w.emotionalOverload) * 0.4 +
      get(p.presenceScore) * 0.4 +
      get(w.simplicityCraving) * 0.2,
    observation: (a) => `overwhelm → human presence → groundedness arc currently appears historically aligned (${a}/10) — observed alongside emotional overload`,
  },
];

// ─── main ─────────────────────────────────────────────────────

export function computeEmotionalArcs(input: EmotionalArcInput): EmotionalArcReading {
  const w = input.world ?? {};
  const p = input.presence ?? {};
  const mi = input.imprint ?? {};

  const arcs: EmotionalArc[] = ARC_SPECS.map((spec) => {
    const raw = spec.score(w, p, mi);
    const alignment = r1(clamp10(raw));
    return {
      arcId: spec.arcId,
      shape: spec.shape,
      alignment,
      reasonCodes: [
        `exhaustion:${get(w.emotionalExhaustion)}`,
        `stillness:${get(p.stillnessWeight)}`,
        `presence:${get(p.presenceScore)}`,
        `loneliness:${get(w.lonelinessSignals)}`,
      ],
      observation: spec.observation(alignment),
    };
  });

  const dominantArcs = arcs.slice()
    .sort((a, b) => b.alignment - a.alignment || a.arcId.localeCompare(b.arcId))
    .slice(0, 3)
    .map((a) => a.arcId);

  const notes: string[] = [];
  if (dominantArcs.length === 0) {
    notes.push('emotional arcs appear muted in this window — requires more evidence');
  } else {
    notes.push(`${dominantArcs.join(', ')} currently appear historically aligned`);
  }

  return {
    arcs,
    dominantArcs,
    notes,
    reasonCodes: [
      `dominantArcs:${dominantArcs.join('|')}`,
      ...arcs.map((a) => `${a.arcId}:${a.alignment}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
